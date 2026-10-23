# Operations

What it takes to run this stack somewhere other than a laptop, and what to do when it misbehaves.

| Document | Answers |
|---|---|
| [deployment.md](deployment.md) | How a commit becomes a running process, and how to roll it back |
| [backup-restore.md](backup-restore.md) | What is backed up, how often, and how a restore is proven to work |
| [runbooks.md](runbooks.md) | What to do when a specific thing breaks |
| [alerting.md](alerting.md) | What pages someone, at what threshold, and who |
| [credentials.md](credentials.md) | What each credential actually allows, next to what the application restricts itself to |
| [retention.md](retention.md) | What is kept, for how long, and what deletes it |
| [logging.md](logging.md) | Where logs go, how to ship them, and what is redacted first |
| [metrics.md](metrics.md) | What `/metrics` exposes, the token that guards it, and how tracing is switched on |
| [baselines.md](baselines.md) | What a reported saving or error figure has to carry before it is reported |

## Processes

The workspace runs as two long-lived processes from one image:

| Process | Command | Serves |
|---|---|---|
| API | `pnpm --filter @app/api start` | HTTP on `PORT`, and the built SPA when `WEB_DIST_PATH` is set |
| Worker | `pnpm --filter @app/api worker` | RabbitMQ consumers, no HTTP |

The worker is not optional. Without it, published jobs accumulate in their queue and nothing drains the retry or dead-letter queues.

## Backing services

| Service | Required by | Loss of it means |
|---|---|---|
| Neon Postgres | Both | Total outage. Readiness fails and the API stops accepting traffic |
| Upstash Redis | API | Rate limiting fails closed and job de-duplication stops, so requests are rejected rather than served wrongly |
| RabbitMQ | Worker, and the api only when it publishes | The api starts and serves HTTP without it, because the connection is opened on first use rather than at boot. A publish resolves only once the broker has confirmed the message, fails with a queue error when the broker is unreachable or refuses it, and reconnects on the next attempt. The worker waits for the broker at startup, and exits if the connection is later lost, so the orchestrator restarts it into that same wait |
| SMTP | API | Mail silently stops. Nothing else is affected |

## Environments

| Environment | `NODE_ENV` | Notes |
|---|---|---|
| Local | `development` | `make setup` brings up Postgres, Redis, RabbitMQ and mailpit through `docker-compose.dev.yml`; the API uses the node drivers |
| CI | `test` | Services are declared per job in `.github/workflows/ci.yml` |
| Staging | `production` | Specified in `docker-compose.staging.yml` and `.env.staging.example`; uses Neon and Upstash, not local database containers. Not yet provisioned |
| Production | `production` | `envSchema` refuses to start unless `WEB_ORIGIN` and `BETTER_AUTH_URL` are HTTPS and `BETTER_AUTH_SECRET` is at least 32 characters |

Configuration is environment variables only, validated at boot by `apps/api/src/platform/config/env-schema.ts`. `apps/api/.env.example` is the full list. A missing or malformed variable stops the process at startup rather than failing later in a request.

The API reference UI at `/api`, with its OpenAPI document at `/api/spec.json`, is served outside production and hidden in production, so a public deployment does not describe its own surface by default. `API_REFERENCE_ENABLED` overrides that in either direction.
