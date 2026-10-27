# Observability

The API already exposes metrics and can export traces; this stack gives them somewhere to go. It runs beside the dev services, not inside the application image: Prometheus pulls `/metrics`, Tempo receives OTLP traces, Promtail ships container logs to Loki, and Grafana reads all three. Alertmanager receives the two rules that can be evaluated from the API metrics.

## Start it

```sh
make services        # Postgres, Redis, RabbitMQ, mailpit
make api             # API on :3001
make observability   # Prometheus, Grafana, Loki, Promtail, Tempo, Alertmanager
```

| Surface | URL | Login |
|---|---|---|
| Grafana | <http://localhost:3000> | `admin` / `admin`, overridable with `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | <http://localhost:9090> | none |
| Alertmanager | <http://localhost:9093> | none |
| Loki | <http://localhost:3100> | none |
| Tempo | <http://localhost:3200> | none |

The provisioned dashboard is **TradeScope → TradeScope API**. It shows request rate by status, 5xx share, p50/p95 latency, process memory, and event-loop lag.

Stop it with `make observability-stop`; tail it with `make observability-logs`. The volumes are named, so stopping keeps history.

## How the pieces connect

| Component | Reads / listens | Writes |
|---|---|---|
| Prometheus | scrapes `127.0.0.1:3001/metrics` every 15s | its own TSDB |
| Alertmanager | receives firing rules from Prometheus | nothing; the local receiver is deliberately silent |
| Tempo | OTLP HTTP on `:4318` | local blocks |
| Promtail | Docker socket and container logs | Loki |
| Loki | receives pushes on `:3100` | filesystem chunks |
| Grafana | Prometheus, Loki, and Tempo as provisioned data sources | its own database |

The stack uses `network_mode: host` because a container on this Linux host cannot reach the API through the Docker bridge. Host networking makes `127.0.0.1:3001` mean the API the way it does from a shell. That is also why the compose file has no published ports: the services bind the host directly.

## Enabling traces

Tracing stays off until an endpoint is named. Add this to `apps/api/.env` and restart the API:

```sh
TRACING_ENDPOINT=http://127.0.0.1:4318/v1/traces
TRACING_SAMPLE_RATIO=1
```

A request then appears in Grafana under **Explore → Tempo**, and its log line carries `traceId` and `spanId`. Raising the sample ratio cost is the lever if probes make the trace list noisy. Spans are not flushed on shutdown yet, so a process that is killed can drop the last few seconds; see [metrics.md](metrics.md).

## Logs

Promtail follows every Docker container, so the Postgres, Redis, RabbitMQ, mailpit, and observability logs are queryable in Loki by `service`, `container`, and `project`. The API and worker are normally run from the host with `make api` and `make worker`, and **their stdout is not in Docker**, so Promtail cannot see it. To put an API log in Loki locally, run the built image instead of the host process, or add a file-based scrape to `ops/observability/promtail/promtail-config.yml`.

The staging compose file runs the API in Docker, so that environment does not have this limitation.

## Metrics token

Local development normally leaves `METRICS_TOKEN` unset, so Prometheus can scrape without credentials. When a token is set, Prometheus must send it. Add this to the `trade-scope-api` scrape in `ops/observability/prometheus/prometheus.yml`:

```yaml
    authorization:
      type: Bearer
      credentials: <token>
```

Do not commit the token. The staging instructions use a secret file or an environment-provided config instead.

## Alerts

`ops/observability/prometheus/alerts.yml` carries three rules:

| Alert | Condition | Severity |
|---|---|---|
| `TradeScopeApiDown` | The scrape has failed for 2 minutes | page |
| `TradeScopeErrorRateHigh` | 5xx share above 2% for 5 minutes | page |
| `TradeScopeLatencyHigh` | p95 above 2 seconds for 10 minutes | ticket |

Alertmanager runs with a silent local receiver on purpose: alerts are visible in Prometheus and Alertmanager, but nothing is paged. A real pager receiver is a deployment decision, recorded in [alerting.md](alerting.md).

## What this stack does not cover

- There is no staging host in this repository. See [staging.md](staging.md) for the provisioning checklist.
- Production Postgres and Redis alerts still come from Neon and Upstash, not from this stack.
- Queue depth, dead-letter depth, and backup age are not API metrics; they belong to the broker and the backup job.
- Spans cover the HTTP seam only. There is no automatic instrumentation for Postgres, Redis, or RabbitMQ.
