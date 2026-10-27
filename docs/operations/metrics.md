# Metrics

The API exposes Prometheus text on `GET /metrics`. Until this existed the only signal the application produced was a request log line, which meant the error rate and latency alerts in [alerting.md](alerting.md) had nothing to fire on unless the logs were shipped somewhere queryable first.

## What is exposed

| Metric | Type | Labels | Answers |
|---|---|---|---|
| `http_requests_total` | counter | `method`, `route`, `status` | Request volume, and the 5xx share that the error rate alert needs |
| `http_request_duration_seconds` | histogram | `method`, `route`, `status` | Latency percentiles per route, from ten buckets between 10ms and 10s. Read the route caveat below before trusting this per endpoint |
| `process_*`, `nodejs_*` | gauges and counters | none | Memory, CPU, event loop lag, garbage collection and handle counts |

Every series carries `service="api"`.

**The probe paths are not counted.** `/healthz`, `/ready` and `/metrics` are excluded from both the counter and the histogram, because a liveness probe on a short interval outnumbers real traffic in every environment and would dominate the 5xx share that the error rate alert reads. Probe health is alerted on by probing, not by counting, which is what [alerting.md](alerting.md) already does.

**The `route` label is the matched route template, never the request path.** A label whose values are unbounded turns a time series database into an outage, so the template is what gets recorded. A request that matches no route at all is labelled with the wildcard Hono matched it against, `/*`, which is checked in the end to end suite. The normaliser's `unmatched` fallback exists for a future mount that could leave the route blank, and does not fire in this wiring.

The consequence is worth stating plainly, because it limits what these numbers can answer. The RPC and REST surfaces are each mounted behind one wildcard, so every call through them collapses into a single series. Checked against a running API:

```
http_requests_total{method="GET",route="/healthz",status="200"}  1
http_requests_total{method="POST",route="/rpc/*",status="200"}   1
http_requests_total{method="GET",route="/api/*",status="200"}    1
http_requests_total{method="GET",route="/api/*",status="401"}    1
```

So error rate and overall latency are answerable, including error rate per surface, which is what the alert in [alerting.md](alerting.md) needs. **Latency for one specific endpoint is not**, because `note.list` and `user.create` are the same series. Resolving that means labelling RPC calls by their procedure path, which is a closed set and therefore safe, unlike the REST paths that carry resource ids. That is worth doing when someone needs per-endpoint latency, and not before.

## Reaching it

The endpoint is served on the application's own origin, next to the SPA, so it is reachable by anyone who can reach the site. That is why a token guards it.

| Variable | Default | Effect |
|---|---|---|
| `METRICS_ENABLED` | `true` | `false` does not register the route at all, so the endpoint 404s |
| `METRICS_TOKEN` | unset | When set, a scrape must send `Authorization: Bearer <token>`. At least 32 characters |

**In production the API refuses to start with metrics enabled and no token.** `envSchema` treats it the way it treats a weak authentication secret, because the alternative is publishing process internals and route names to the internet by default.

That rule applies to every process that reads the environment, including the worker, which serves no HTTP and therefore has no `/metrics` to protect. `docker-compose.staging.yml` sets `METRICS_ENABLED: "false"` on the worker for exactly that reason. A worker that will not boot in production is usually this.

A scrape looks like this:

```sh
curl -H "Authorization: Bearer $METRICS_TOKEN" https://staging.example.com/metrics
```

Rotate the token the way any other secret is rotated, and record it in [credentials.md](credentials.md).

## Tracing

Every request also opens one server span, named `GET /api/users/{id}` after the matched route and carrying the method, the path, the route and the response status. A 5xx sets the span status to error, and a handler that throws records the exception before the span ends.

**An incoming `traceparent` is continued rather than replaced.** A request that arrives with a W3C trace context joins that trace as a child span, so a call that crosses two services reads as one trace instead of two unrelated ones. Outgoing calls can carry it onward with `tracingHeadersInject`, which has no consumer yet because the API makes no outbound call of its own.

That continuation trusts the caller, which is the W3C default and is correct behind a gateway that owns its callers. This API is served on the same public origin as the SPA, the reasoning that made `/metrics` require a token, so anyone can send a `traceparent` and choose the trace their request joins. Nothing leaks: the cost is pollution, an unrelated request appearing inside a trace someone else named. **An edge that does not own its callers should strip `traceparent` on the way in** and let the API start the trace itself.

Probe paths are excluded from the counters but are still traced. At a sample ratio of 1 a liveness probe produces a span every interval, so `TRACING_SAMPLE_RATIO` is the lever if that becomes noise before there is a reason to filter them by path.

The request log line carries `traceId` and `spanId` next to `reqId`, so a line found in the logs leads to the trace and back.

| Variable | Default | Effect |
|---|---|---|
| `TRACING_ENDPOINT` | unset | An OTLP over HTTP traces endpoint, for example `http://collector:4318/v1/traces`. Empty means no spans are created and nothing is exported |
| `TRACING_HEADERS` | unset | JSON, for a collector that wants an API key |
| `TRACING_SAMPLE_RATIO` | `1` | Ratio between 0 and 1, sampled on the trace id so a trace is kept or dropped whole. Blank reads as the default, not as zero |

Unlike metrics, tracing is off until an endpoint is named, because a scrape is pulled and an export is pushed: there is nothing to push to until someone runs a collector.

## What is still missing

Spans are not flushed on shutdown. `TTracing.shutdown` exists and nothing calls it, because nothing in this codebase handles `SIGTERM` anywhere, so a rolling deploy drops whatever the batch processor is still holding, up to five seconds of spans. A process that flushes its traces on the way out while still cutting live HTTP connections is the more misleading of the two states, so this belongs with graceful shutdown for the server, the pools and the broker as one piece of work rather than bolted onto tracing alone.

Spans cover the HTTP seam and nothing below it. There is no instrumentation on Postgres, Redis or the broker, so a trace tells you which request was slow but not which query made it slow. Adding it means the OpenTelemetry auto-instrumentations, which patch modules as they load and need loader hooks to work under ESM. That is a real piece of work rather than a line of configuration, and it is worth doing when a slow request stops being obvious from the code.

Job outcomes are not counted here either. The worker has no HTTP surface to scrape, and queue depth, retries and dead letters are already visible in the broker's own metrics, which is where the queue alerts in [alerting.md](alerting.md) read them from. A counter in the application would be a second, less reliable copy.

## The local stack

[observability.md](observability.md) runs Prometheus, Grafana, Tempo, Loki, Promtail, and Alertmanager beside the dev services. Prometheus scrapes this endpoint, Grafana provisions the dashboard, and Tempo receives OTLP traces once `TRACING_ENDPOINT` points at `http://127.0.0.1:4318/v1/traces`. That closes the "nowhere to send it" gap on a laptop. A staging host still has to be provisioned; [staging.md](staging.md) is the checklist.
