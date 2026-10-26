# Ingestion

Ingestion is the only path that writes to the HS catalog or the trade flows behind the market ranking outside the seed. It is deliberately a job, not a request: the API validates the request, stores the input, and queues the run. The worker does the slow part and records the result. That keeps a 20,000 row import from holding an HTTP request open and gives every run a durable audit row.

## Kinds

| Kind | Writes | Key |
|---|---|---|
| `catalog` | `hs_product` and `hs_alias` | `(hs_code, hs_revision)` |
| `trade` | `trade_flow` | `(hs_code, hs_revision, importer_iso2, year)` |

A trade row must name a product that already exists in the catalog; the catalog stays the anchor for every market ranking. Both kinds share the same run history, data source handling, validation failure reporting, and retry behaviour.


## Lifecycle

| Status | Meaning |
|---|---|
| `queued` | The run row exists and a message is in the `ingestion` queue |
| `running` | A worker claimed the run and recorded `startedAt` |
| `succeeded` | Every row was written |
| `partial` | Some rows were written and some were rejected; see `errors` |
| `failed` | Nothing was written; `message` says why |

`queued` and `running` are the only non-terminal states. A worker restarts a `running` run if the job is delivered again, so a crash between `running` and the commit is recoverable. Finalization is guarded on the run still being non-terminal, so two workers cannot finish the same run twice.

## One transaction for the write

Fetching a source and parsing the CSV happen outside the database transaction. Only the upsert and the final status update run inside one transaction:

1. `hs_product` is upserted on `(hs_code, hs_revision)`. `xmax` is not used; existing keys are read first so the counts distinguish inserted from updated.
2. `hs_alias` is inserted with `on conflict do nothing` on `(alias, hs_product_id, language)`.
3. For a `trade` run, `trade_flow` is upserted on `(hs_code, hs_revision, importer_iso2, year)`; its source, URL, retrieval time, value, and quantity are replaced together.
4. The run is updated with counts, rejected rows, and `finishedAt`.
5. An `activity_log` row is written with the same counts.

If the transaction fails, the run stays `running` and the broker retries the job. If it succeeds, a redelivery is acknowledged without re-running because the status is already terminal.

## Rejected rows

A row is rejected without stopping the import. The first error per row is recorded, up to 50 errors, while the run still counts every rejected row. A catalog row is rejected for a bad HS code, revision, description, level, language, alias count, date, a repeated code and revision in the same file, or a missing required column in the header. A trade row is rejected for a bad HS code, revision, market code, year, value, quantity, source, source URL, retrieval time, a repeated product-market-year in the same file, or a missing required column in the header. An unknown header column is also rejected, so a typo cannot import silently.

Blank lines are skipped and are not counted. `total_rows` counts non-blank data rows; `inserted_rows + updated_rows + failed_rows` equals it.

## Data sources and credentials

A data source is a public HTTP(S) CSV endpoint plus an optional bearer token. The token is encrypted with AES-256-GCM. The key is derived from `DATA_SOURCE_SECRET_KEY`, or from `BETTER_AUTH_SECRET` when the dedicated key is empty; the api and the worker must use the same value. Only the last four characters are stored in clear as a hint, and the ciphertext is never returned by the API. Rotating the key that is in use makes saved tokens unreadable until they are saved again; that is a deliberate fail-closed behaviour, not silent data loss. Set `DATA_SOURCE_SECRET_KEY` before saving the first token so a later auth-secret rotation does not also rotate token encryption.

Before a source is fetched:

- only `http:` and `https:` are accepted;
- the hostname is resolved and every resolved address is checked, so a public name pointing at a private address is refused;
- loopback, private, link-local, multicast, and documentation ranges are refused;
- redirects are disabled, so a public endpoint cannot bounce the request to an internal one;
- the request times out after 15 seconds and the body is capped at 2 MB.

DNS rebinding between the check and the fetch is still theoretically possible. The mitigation is to keep data sources on endpoints the operator controls, and to revisit this if ingestion is ever pointed at arbitrary user-supplied URLs.

## Retry

`POST /ingestion/{id}/retry` creates a new queued run with the same source or uploaded payload and the same kind, then sets `retry_of_id`. The original run is untouched. Retrying a `queued` or `running` run is refused with a conflict, because two live runs with the same input are not useful.

## Why the worker

The same run can be triggered from the UI, the RPC client, or the REST contract. The queue is what gives one durable place for the job to wait, one retry policy, and one de-duplication mechanism through the message id. The worker is also where a future provider adapter belongs; the CSV path is the first implementation of the same contract.
