# Deployment

## The artifact

One image builds both processes. `Dockerfile` installs the workspace from the lockfile, builds the SPA, and starts the API with `WEB_DIST_PATH` pointed at the built assets so a single container serves both.

```sh
make image        # build, tagged with the root package.json version and latest
make image-run    # run it against the local services
```

The image is tagged with the root `package.json` version, which is the same value `/health` reports at runtime. That is what lets you confirm which build is actually live rather than which build you believe you deployed.

## Releases

Releases are automatic. Every merge to `trunk` carries a version bump, so the release workflow reads the root `package.json` version on each push to `trunk`, waits for the three required checks to be green on that exact commit, tags it `vX.Y.Z`, and publishes a GitHub release.

The notes are not commit subjects. `.github/scripts/release-notes.sh` walks the commits since the previous tag, follows each `(#N)` back to its pull request, and lifts that PR's **Changelog** section verbatim, plus its **Breaking Changes / Feature Impact** section when it says anything other than None. Entries are grouped by the conventional-commit type of the squash commit. That is why the pull request template calls the Changelog section "For reporting": what is written there is what ships on the release page. A commit with no pull request behind it falls back to its subject line.

The workflow is keyed on the tag rather than on the diff, so a version that already has a tag is skipped and the job is a no-op. That makes it safe to re-run, and `workflow_dispatch` exists for exactly that: re-releasing a version whose publish failed after its checks went green.

## Order of operations

Migrations are forward-only and run as a separate step, never on process start, so that two API replicas coming up at once cannot race each other.

1. Build and push the image for the commit
2. Run `pnpm --filter @app/api migrate` once, as a job, against the target database
3. Roll the API replicas
4. Roll the worker replicas

Step 2 before step 3 means the schema must stay backward compatible with the currently running code for the duration of the roll. Add columns as nullable or with a default, and remove them in a later release once nothing reads them.

## Staging

`docker-compose.staging.yml` runs the same image as production against Neon Postgres, Upstash Redis and a RabbitMQ container, and `.env.staging.example` lists what it needs. `make staging-up`, `make staging-migrate` and `make staging-down` drive it. The full provisioning checklist is [staging.md](staging.md).

**What is here is the specification, not a running environment.** Provisioning a host, pointing a domain at it, and terminating TLS in front of it are infrastructure decisions with a cost attached, and they are not code. Nothing in this repository can make that choice for you. What it can do is make sure that once you have a host, the environment is already described.

Three things the compose file encodes on purpose:

- **`TRADE_SCOPE_IMAGE` is pinned to a tag**, not `latest`. A staging environment that silently drifts to a newer build cannot be used to rehearse a deploy, because you would not know which build you rehearsed
- **The api port binds to `127.0.0.1`. The database and cache are managed services outside the compose network; their credentials are not shared with production.** TLS terminates in a reverse proxy in front, which is also what makes `RATE_LIMIT_TRUSTED_PROXY_IPS` meaningful. Exposing the port publicly would defeat both
- **Secrets are not shared with production.** Staging exists to be broken, so its credentials must not be worth stealing

Staging is where the things that are currently unrehearsed get rehearsed: a rollback to the previous image tag, the restore drill in [backup-restore.md](backup-restore.md), and the observability stack in [observability.md](observability.md). The local restore drill has been run; the staging drill and the rollback rehearsal still need a staging host.

## Probes

| Probe | Endpoint | Meaning |
|---|---|---|
| Liveness | `GET /healthz` | The process is alive. It never checks a dependency, because restarting a process does not fix a dead database |
| Readiness | `GET /ready` | The process can serve. It probes Neon Postgres and Upstash Redis and answers 503 when either is down |

Point the orchestrator's liveness probe at `/healthz` and its readiness probe at `/ready`. Wiring liveness to `/ready` causes a restart loop during any dependency blip.

## Rollback

Roll back by deploying the previous image tag. Confirm with `/health`, which reports the version that is actually running.

Migrations are the constraint: there is no `down` migration, so a rollback of code is safe only while the newer schema still satisfies the older code. A rollback across a destructive migration is not a rollback at all, it is a restore, and it belongs in [backup-restore.md](backup-restore.md). Keeping that from happening is what the next section is for.

## Expand and contract

**A migration may not break the code that is currently running.** During a rolling deploy both the old and the new build serve traffic at the same time, so any change that the old build cannot survive takes the site down the moment it lands, and rolling the code back does not bring it up again.

Every schema change is therefore split across two releases:

| Phase | Release | What it does |
|---|---|---|
| Expand | First | Add the new column or table. It is nullable or has a default, so existing rows need no backfill. The new build writes to both the old and the new shape |
| Contract | Second, once the first is fully rolled out | Remove the old column or table. Nothing reads it any more, so nothing breaks |

That means renaming a column is never one migration. Add the new one, backfill it, write to both, and drop the old one in a later release. The same applies to dropping anything, and to tightening an existing column to `NOT NULL`, which fails on the next insert from a build that still writes null.

Additive changes are unaffected. `CREATE TABLE`, `CREATE INDEX`, and `ADD COLUMN` with a default or nullable are safe in a single release, and that is the large majority of schema work.

### Enforcement

`moon run api:migrations` fails the build on `DROP COLUMN`, `RENAME COLUMN`, `DROP TABLE`, and `SET NOT NULL` in `apps/api/drizzle`. It runs in CI as a dependency of `api:build`, so an unsafe migration cannot reach `trunk` by being missed in review.

The contract phase is legitimate, so there is a way through. Put this at the top of the migration file:

```sql
-- migration-safety: contract-phase
```

That marks the removal as the deliberate second half of an expand and contract, and it is visible in the diff, so the reviewer sees the claim being made rather than a rule quietly bypassed. Use it when the expand phase is already deployed everywhere, and not before.

`0003_brown_silk_fever.sql` renamed two columns in a single migration and predates this policy. It is listed as an exception in `apps/api/scripts/migration-rules.ts` rather than rewritten, since it shipped long ago. It is also the concrete example of what this rule exists to prevent.

## Staged rollout

Not implemented, and declined on purpose. There are no feature flags, no canary and no percentage rollout: every deploy reaches every user at once.

What the release machinery gives instead is recovery, not containment. A release is a tag whose version is verified against `package.json` and cut only from a commit where all three required checks are green, the image is pinned to that tag rather than `latest`, `/health` reports the version actually serving, and `moon run api:migrations` refuses a destructive migration, so a rollback never lands on a schema the older build cannot read. A bad release is therefore identifiable, and reversible in one deploy.

What it does not give is a smaller blast radius. Between the moment a bad build starts serving and the moment someone notices, everybody is on it. That window is exactly what a staged rollout buys down, and nothing above substitutes for it.

The trade is accepted while the cost sits the way it does now. A flag is a branch in the code and a second state to test, a flag nobody deletes becomes a permanent fork of the product, and a canary needs at least two independently routable instances plus metrics sliced per instance for the comparison to mean anything. None of that is free, and today it would be paid to protect a deploy that can already be undone in minutes.

Revisit when any of this becomes true:

- a release goes out broken and users see it before the alerts do
- the traffic is large enough that a full blast radius costs more than maintaining flags
- a change has to reach a subset of users by design rather than out of caution
