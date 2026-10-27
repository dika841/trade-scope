# Staging

Staging is a target, not a running environment in this repository. The compose file, environment example, image, migration command, and observability stack are all here; a host, DNS, TLS, and the managed credentials are not. This document is the checklist that turns one into the other.

## What already exists

| Piece | Where |
|---|---|
| Stack definition | `docker-compose.staging.yml` — API, worker, RabbitMQ |
| Environment template | `.env.staging.example` |
| Image build | `make image`, tagged with the root version |
| Migration command | `make staging-migrate` |
| Up / down | `make staging-up`, `make staging-down` |
| Local observability stack | [observability.md](observability.md) |

Staging deliberately does not run Postgres or Redis containers: it points at a Neon branch and an Upstash database, so the state you exercise is the state production uses.

## Provisioning checklist

1. **Host**: a Linux host with Docker and the compose plugin. Bound the API to loopback only; the compose file already publishes `127.0.0.1:3001:3001`.
2. **Reverse proxy**: terminate TLS and forward to `127.0.0.1:3001`. Set `WEB_ORIGIN` and `BETTER_AUTH_URL` to the public HTTPS origin.
3. **Neon**: create a staging branch/project, never a copy of production. Record the connection string in the secret store.
4. **Upstash**: a separate Redis database for staging. Use the REST URL and token unless you are intentionally testing the node driver.
5. **Secrets**: generate fresh `BETTER_AUTH_SECRET`, `DATA_SOURCE_SECRET_KEY`, `METRICS_TOKEN`, and `RABBITMQ_PASSWORD`. Do not reuse production values.
6. **Mail**: a provider sandbox or catch-all inbox. Staging must not send to real people.
7. **Image**: build, push, and pin the tag in `.env.staging`. Do not track `latest`.
8. **Migrate**: run `make staging-migrate` before starting the new image.
9. **Start**: `make staging-up`.
10. **Verify**: `GET /healthz` answers 200, `GET /ready` answers 200 with both dependencies up, sign in with a staging admin, and run one catalog search.
11. **Observability**: run the stack from [observability.md](observability.md) on the same host. The staging API publishes on `127.0.0.1:3001`, so the default Prometheus target works. Add the metered bearer token to the scrape if `METRICS_TOKEN` is set. Point `TRACING_ENDPOINT` at `http://127.0.0.1:4318/v1/traces` if Tempo is running.
12. **Backup**: enable Neon PITR for the staging branch and schedule a logical dump. Run the restore drill in [backup-restore.md](backup-restore.md) against a staging dump.

## Deploying a change

```sh
make image                         # build and tag
docker push <registry>/trade-scope:<version>
# update TRADE_SCOPE_IMAGE in .env.staging
make staging-migrate
make staging-up
```

The API and worker share one image. `make staging-migrate` runs migrations as a separate process before the new containers start; the API accepts traffic only after `/ready` passes.

## Verifying a deploy

- `/health` shows the same version on web and API.
- `/ready` reports `database` and `cache` up.
- `/metrics` answers with the bearer token when one is configured.
- The dashboard in Grafana shows request traffic from the `api` target.
- One pilot can be created, assigned, moved to review, and seen in the activity timeline.
- A report can be generated and its share link opened in a private window.

## Rollback

The image tag is the rollback unit. Put the previous tag back in `.env.staging`, run `make staging-up`, and leave the schema alone: migrations are expand/contract, so the previous image still reads the new schema. If the migration itself was destructive, restore the Neon branch or PITR point instead of rolling the image back.

## What is still manual

- The host and TLS certificate are infrastructure, not code.
- Credentials live in the operator's secret store, not in this repository.
- The pager receiver in Alertmanager is silent until a real receiver is configured.
- The restore drill and rollback rehearsal must be run on the staging host and recorded; a procedure that has only been read is not a rehearsal.
