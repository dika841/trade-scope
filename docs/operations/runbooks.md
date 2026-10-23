# Runbooks

One section per failure that is expected to happen. Each starts with how you know, because an alert that nobody can act on is noise.

## Readiness is failing

**You know because** `GET /ready` answers 503 and names the dependency, and the orchestrator has pulled the pod out of rotation.

The response body lists each dependency, so read it before guessing:

```sh
curl -s https://<host>/ready | jq
```

| `dependencies` says | Go to |
|---|---|
| `database` down | [Neon Postgres is unreachable](#neon-postgres-is-unreachable) |
| `cache` down | [Upstash Redis is unreachable](#upstash-redis-is-unreachable) |

Readiness probes with a 2 second timeout, so a dependency that is merely slow reads as down. That is deliberate: a request that would hang is not better than a request that is refused.

## Neon Postgres is unreachable

**Impact** Total outage. Every request that touches data fails and readiness keeps the process out of rotation.

1. Confirm from outside the app: `psql "$DATABASE_URL" -c 'select 1'`
2. If the server is up but refusing connections, check the connection count against `max_connections`. The API uses a `pg` pool per process, so replica count multiplies it
3. If it is a failover, wait for the new primary and confirm `DATABASE_URL` resolves to it. The app does not retry a DNS change on its own; restart the replicas once the endpoint moves
4. If the database is gone rather than unreachable, this is a restore. Go to [backup-restore.md](backup-restore.md)

## Upstash Redis is unreachable

**Impact** Rate limiting fails **closed**, so authentication endpoints start rejecting real users with 429. Job de-duplication also stops, so a retried job can run twice.

This is deliberate in `apps/api/src/platform/http/rate-limit.ts`: an unavailable limiter refuses rather than waves everything through, because open would turn an Upstash Redis outage into a credential-stuffing window.

1. Confirm: `redis-cli -u "$REDIS_URL" ping`
2. Restore Upstash Redis. No data migration is needed; counters and claims rebuild themselves
3. Do not "fix" this by making the limiter fail open. If the outage is long and sign-in must keep working, raise `RATE_LIMIT_MAX` deliberately and put it back afterwards

## Jobs are piling up in the dead-letter queue

**You know because** the depth of `<queue>.dlq` is above zero and climbing.

A message reaches the dead-letter queue only after exhausting its retry budget, so this means a handler failed repeatedly for the same payload.

1. Inspect without consuming, through the RabbitMQ management UI or `rabbitmqadmin get queue=<queue>.dlq requeue=true`
2. Read the API logs for the handler error. Every request line carries `reqId`; worker failures carry the job payload
3. Fix the cause, deploy, then republish the dead-lettered messages back to the main queue
4. Republishing is safe against duplicates: the consumer claims each message id before running the handler, so a message already processed is acknowledged and skipped

Do not purge the dead-letter queue to make the number go down. It is the only copy of that work.

## Jobs are not being processed at all

**Impact** The main queue depth climbs and nothing drains it.

1. Check the worker process is running at all. It is separate from the API and is easy to forget in a deploy
2. Check RabbitMQ is reachable from the worker. A worker started while the broker is down waits and retries for about a minute before giving up and exiting, so the orchestrator restarts it; a worker that exits repeatedly means the broker has been unreachable for longer than that
3. Confirm the worker is consuming: the main queue should show a consumer count above zero
4. Look for `worker.broker.lost` in the worker logs. The worker exits when its broker connection closes or errors, so this line is followed by a restart and then by the startup wait in step 2. Seeing it once around a broker restart is expected and self-healing. Seeing it repeatedly means the connection is being dropped, by an idle timeout, a proxy, or a broker under memory pressure

A worker that is running and shows a consumer count of zero should not happen any more. That was the old failure: the connection dropped, nothing re-subscribed, and the process stayed alive, so `restart: unless-stopped` never fired and the queue filled in silence. If you do see it, the exit path itself failed and the process needs killing by hand.

## Password reset emails are not arriving

**You know because** `mail.send.failed` appears in the logs. You will not hear it from the product: the reset endpoint answers success whether or not the mail went out, deliberately, so that nobody can use it to discover which addresses are registered.

**Impact** Anyone who has forgotten their password is locked out, and believes a link is on its way.

1. Confirm the credentials still work from outside the app: `swaks --to you@example.com --server "$SMTP_URL"`, or any SMTP client
2. An `EAUTH` error means the credentials were rejected. They have expired or been rotated. Update `SMTP_URL` and restart
3. A connection error means the host is unreachable. Check the provider's status and any egress rules on port 465 or 587
4. Once mail works again, tell affected users to request a new link rather than replaying the old ones. Reset links expire in one hour, so the ones issued during the outage are probably already dead

Do not make the reset endpoint fail when mail fails. Answering success regardless is what keeps the endpoint from becoming an account-enumeration oracle, and it is the reason this alert exists instead.

## A job could not be consumed at all

**You know because** `job.consume.failed` appears in the worker logs. It is not the same as a job that failed: a handler that throws is retried and then dead-lettered, and neither of those logs this event. This one means the consumer could not even reach that point, so the message may still be unacknowledged.

**Impact** One delivery is stuck. Prefetch is 1, so a message the broker keeps redelivering can stall the queue behind it.

1. Read the `err` on the line. Two causes account for almost all of it
2. A cache error means Upstash Redis was unreachable while the de-duplication claim was being taken. The message is routed to the retry queue, so it recovers on its own once Upstash Redis is back. Check `/ready` on the API, which reports `cache` separately
3. A channel error means the broker connection died mid-message. The message stays unacknowledged and the broker redelivers it to the next consumer. Confirm the worker is still consuming with `rabbitmqctl list_consumers`, and restart it if the queue has consumers but nothing is moving
4. A malformed payload does **not** produce this event. It goes straight to `<queue>.dlq` without being retried, because a payload that cannot be parsed will not parse on the second attempt either. Look there instead, and see [Jobs are piling up in the dead-letter queue](#jobs-are-piling-up-in-the-dead-letter-queue)

The worker no longer exits on any of these. Before, an error before the handler escaped as an unhandled rejection, which on Node 24 ends the process, and the unacknowledged message was redelivered into the same crash on restart.

## Everyone appears to be signed out

**You know because** users report being signed out, and `session.resolve.failed` appears in the API logs. The application answers 503 on protected routes, and the web shows the server-unreachable screen rather than the login page.

**Impact** Nobody can use a protected route. Sessions themselves are intact: the failure is in resolving them, not in ending them.

1. Check `/ready`. Resolving a session reads the database to find the user's role, so a Neon Postgres outage produces exactly this
2. Read the `err` on `session.resolve.failed`. A database error points at step 1. An authentication error points at better-auth itself, usually a schema drift after a migration
3. Nothing needs to be done to the sessions. Once the dependency is back, the next request resolves normally and nobody has to sign in again

This used to present as a mass sign-out. An infrastructure failure was caught and turned into an anonymous session, so the API answered 401, and the web maps any sub-500 status to signed out. The operational cause was invisible and valid users were pushed to the login screen.

## A deploy made things worse

1. Confirm which build is live: `curl -s https://<host>/health | jq .version`. The two versions on `/health`, web and API, differing means they were deployed out of step
2. Redeploy the previous image tag
3. If the release carried a destructive migration, a code rollback is not enough. Go to [backup-restore.md](backup-restore.md)
