# Backup and restore

A backup nobody has restored is not a backup. The restore drill below is the part that matters; run it on a schedule, not after an incident.

## What holds state

| Store | Backed up | Why |
|---|---|---|
| Neon Postgres | Yes | The only source of truth. Users, roles, activity log, auth sessions, and future TradeScope data |
| Upstash Redis | No | Rate-limit counters and job de-duplication claims. Both are short-lived and rebuild themselves. Losing Redis costs a window of duplicate-job protection, not data |
| RabbitMQ | No, but drain before planned downtime | Queues are durable and messages persistent, so a broker restart keeps them. A destroyed volume loses in-flight and dead-lettered jobs, which is why the dead-letter queue should be drained rather than left to accumulate |

## Neon Postgres backup

Use Neon's point-in-time restore and branches for the production project, plus a logical dump kept outside Neon. The dump alone gives a coarse recovery point; PITR is what makes recovery possible after a bad migration or a mistaken delete. Create a Neon branch before a destructive migration and keep it until the deploy is verified.

```sh
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > tradescope-$(date -u +%Y%m%dT%H%M%SZ).dump
```

| Setting | Value | Rationale |
|---|---|---|
| Frequency | Nightly logical dump; Neon PITR continuously | |
| Retention | 30 daily, 12 monthly | A schema mistake is often noticed weeks later |
| Location | A different account or project from the Neon project | A backup in the same blast radius as the thing it protects is not a backup |
| Encryption | At rest, with a key not stored alongside the backup | The dump contains password hashes and session rows |

Restrict who can read the dumps to the same set who can read production. It is the same data.

## Restore

```sh
createdb tradescope_restore
pg_restore --no-owner --no-acl --dbname=tradescope_restore tradescope-<timestamp>.dump
```

Then point a non-production API at it, run `pnpm --filter @app/api migrate`, and check `/ready` reports both dependencies up.

## The drill

Quarterly, and before any release that carries a destructive migration:

1. Restore the most recent nightly dump into a scratch database
2. Run the migrations against it and confirm the run is clean
3. Start an API against it and confirm `GET /ready` answers 200
4. Sign in as a seeded user and read one record from users, roles, and the activity log
5. Record the wall-clock time from step 1 to step 4, and the age of the restored data

Step 5 is the output. Those two numbers are the real recovery time and recovery point; anything written in a plan without them is a guess.

## The local drill

`make drill-restore` runs the same shape against the dev Postgres container: it dumps the live `app` database, restores it into a scratch database, counts the public tables and users, drops the scratch database, and prints the wall-clock time.

```sh
make drill-restore
# restore drill passed: 14 tables, 4 users restored in 1s
# recovery point: the live dump taken at the start of this run
```

The script is `scripts/restore-drill.sh`. It refuses nothing and changes nothing outside the scratch database named `app_restore_drill`. A local pass proves the procedure and the tooling; it does not replace the staging drill, which restores a real nightly dump and then starts an API against it.

| Objective | Target | Last measured |
|---|---|---|
| Recovery time | 1 hour | Not yet measured on staging; local drill 1s on 2026-10-27 |
| Recovery point | 24 hours without WAL, 5 minutes with it | Not yet measured on staging; local drill uses a live dump |

Fill the staging column in after the first staging drill. An unmeasured target is a guess, and this table is deliberately honest that production and staging have not been exercised yet.
