# Standard

Full-stack TypeScript boilerplate: moon + pnpm workspaces, Hono + oRPC, Drizzle, better-auth, React 19 + TanStack + Vite + Tailwind v4, Biome, Vitest, Playwright.

## Stack

| Concern | Choice |
|---|---|
| Monorepo | moon + pnpm workspaces |
| API | Hono, oRPC (typed RPC + REST/OpenAPI from one router), Effect for business logic |
| DB | Drizzle ORM + Neon serverless Postgres (node-postgres for local/CI) |
| Auth | better-auth, one role per user |
| Cache / rate limit | Upstash Redis (ioredis for local/CI) |
| Jobs | RabbitMQ |
| Mail | nodemailer over SMTP, mailpit in dev |
| Web | React 19, TanStack (Router, Query, Form, Store), Vite, Tailwind v4, shadcn/ui |
| Quality | Biome, Vitest, Playwright |

## Layout

```
apps/
  api/          Hono + oRPC + Drizzle + Effect, organised by module
  api-e2e/      API integration tests
  web/          TanStack Router SPA
  web-e2e/      Playwright E2E
packages/
  schemas/      Zod schemas shared by api + web
  components/   shadcn/ui primitives + guards + theme
  permissions/  permission catalog + role maps
  activity/     activity log
  queue/        RabbitMQ helper
  cache/        cache port + rate limiting
  mail/         nodemailer SMTP mailer
  logger/       pino factory
  format/       date/money/string formatters
  messages/     user-facing message constants
  migrations/   shared migration runner
  version/      APP_VERSION, re-exported from the root package.json
```

## Getting Started

Requires [moon](https://moonrepo.dev/docs/install) + [proto](https://moonrepo.dev/proto), or Node 24 / pnpm 11 directly.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env # and apps/web/.env.example to apps/web/.env
make setup                            # docker services, migrate and seed
make up                               # start api + web together
```

Dependency versions that more than one package shares (TypeScript, Vitest, React, zod, `ts-pattern`, `ts-belt` and the rest) are pinned once in the `catalog` of `pnpm-workspace.yaml`, and a manifest refers to them as `catalog:`; bump the version there and every package moves together. The example files already match what `docker-compose.dev.yml` brings up, so they work unedited for local development. In development the web app reaches the API through Vite's same-origin proxy rather than `VITE_API_URL`, so the session cookie stays first-party even when the API is on another localhost host or port. `apps/api/.env.example` is the full list of variables the API accepts, and `envSchema` rejects a missing or malformed one at boot rather than failing later in a request.

Local development and CI keep using the docker Postgres and Redis services through `DATABASE_DRIVER=node` and `REDIS_DRIVER=node`. Serverless deployments switch to Neon and Upstash with `DATABASE_DRIVER=neon` and `REDIS_DRIVER=upstash`, then supply `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. The two drivers share the same migrations and repository code; only the connection layer changes.

Or run them separately:

```sh
make api                              # api on :3001
make web                              # web on :5173
make worker                           # RabbitMQ worker (needed for ingestion)
```

Seed logins: `admin@test.app` / `Password123`, `analyst@test.app` / `Password123`, `viewer@test.app` / `Password123`. That password is the default outside production only. With `NODE_ENV=production` the seed refuses to run unless `SEED_PASSWORD` is set, and then it creates the admin alone, with that password and no demo users.

Mail sent in development is caught by mailpit, read it at `http://localhost:8025`.

## Roles

| Role | Scope |
|---|---|
| `superadmin` | Every permission, including user management and data source credentials |
| `admin` | Catalog, ingestion, pilots, reports, activity, and users; no data source credentials |
| `analyst` | Manage the catalog, run ingestion, read pilots, reports, and activity |
| `viewer` | Read-only catalog, ingestion runs, pilots, and reports; no activity log |

The four roles are fixed. Custom roles can still be created from the role editor and are resolved from the database; `permissionRequire` checks them on the server, and the UI uses the same catalog.

## Public catalog

The first public slice is an HS catalog search. It works without a session:

| Surface | What it does |
|---|---|
| `GET /api/products?q=kopi&limit=10` | Finds candidates by HS code prefix, description, or Indonesian/English alias |
| `GET /api/products/{hsCode}?revision=HS2022` | Returns the confirmed product and its aliases |
| `/` | Public landing page with search |
| `/search?q=kopi` | Candidate list with an ambiguity warning |
| `/products/090121?revision=HS2022` | Product detail and the next-step placeholder |

`make db-seed` seeds six HS codes across coffee, apparel, smartphones, palm oil, and computers, plus six countries. The seed is demo data; the import below is the real write path.

## Ingestion and data sources

Phase 2 adds the write side of the catalog. An ingestion run reads a CSV, validates every row, and upserts `hs_product` and `hs_alias` in one transaction. Rows that fail validation are reported with their line number and the run finishes as `partial`; a run with no valid rows finishes as `failed`.

| Surface | What it does |
|---|---|
| `POST /api/ingestion` | Queues a run from an uploaded CSV (`mode: "upload"`) or a saved data source (`mode: "source"`) |
| `GET /api/ingestion` | Lists runs with status, row counts, duration, and who triggered them |
| `GET /api/ingestion/{id}` | Returns one run with the rejected rows |
| `POST /api/ingestion/{id}/retry` | Queues a new run with the same input, linked by `retryOfId` |
| `/ingestion` | Run form, status filter, and run history |
| `/ingestion/{id}` | Summary, rejected rows, and retry |
| `/data-sources` | Superadmin-only endpoint and token management |

The API only queues the run; the **worker** performs it, so `make worker` has to be running for a run to leave `queued`. The worker claims a run through Redis, updates it to `running`, and records the result even when the source is unreachable. The two contracts share `@app/schemas`, so the web and API cannot drift.

CSV columns:

| Column | Required | Notes |
|---|---|---|
| `hs_code` | yes | 2-12 digits, dots allowed and stripped |
| `hs_revision` | yes | For example `HS2022` |
| `description` | yes | 1-500 characters |
| `parent_hs_code` | no | Same format as `hs_code` |
| `level` | no | 1-10; defaults to the digit length of the code |
| `aliases` | no | Up to 20, separated by `|` or `;` |
| `language` | no | Two lowercase letters, `id` by default |
| `valid_from`, `valid_to` | no | `YYYY-MM-DD` |

Files are capped at 2 MB and 20,000 rows. A data source token is encrypted with AES-256-GCM at rest and only its last four characters are ever returned; the token is sent as a bearer credential only when the worker fetches the source. Set `DATA_SOURCE_SECRET_KEY` (32 characters or more, shared by the api and the worker) to keep token encryption independent of the auth secret. Endpoints that resolve to a private, loopback, or link-local address are refused before any request is made, and redirects are disabled. The full format and failure behaviour are in [docs/ingestion.md](docs/ingestion.md).

## Version and Health

The root `package.json` version is the single source of truth for the workspace. `@app/version` re-exports it as `APP_VERSION` (a plain JSON import, no build step and no generated file), and both sides serve it:

| Surface | Response |
|---|---|
| `health.check` over RPC, `GET /api/health` | `{ status: "ok", version }` |
| `GET /healthz` | `{ status, version }`, liveness only: the process answers, nothing is probed |
| `GET /ready` | `{ status, version, dependencies }`, and **503** when any dependency is down |
| `/health` on the web (no auth) | its own version next to the API's |
| `GET /metrics` | Prometheus text: request counts and durations by method, matched route and status, plus process figures. Guarded by `METRICS_TOKEN`, and required to be in production. See [docs/operations/metrics.md](docs/operations/metrics.md) |

The shape is `healthSchema` in `@app/schemas`, so the web page is typed against what the API returns; the two versions differing means web and API are deployed out of step.

**Every change bumps the root version** in the same commit, so `/health` always names the build you are looking at: patch for a fix, chore or docs change, minor for a feature, major for a breaking change. Only the root version matters; the workspace packages are private and unpublished.

## Commands

Every command goes through `make` or `moon`; nothing shells into a package directory.

```sh
make help                             # every target, with a one-line description
make setup                            # services + migrate + seed
make services | services-stop         # docker: postgres, redis, rabbitmq, mailpit
make api | web | worker               # run one process
make db-migrate | db-seed | db-studio # database
make check | lint | test | build      # quality gates
make e2e                              # api + web end-to-end
make ci                               # everything CI runs, on affected projects
```

```sh
moon run :check                       # biome check (format + lint)
moon run :build                       # tsc --noEmit, every project
moon run :test                        # unit tests
moon run api:db-generate              # generate drizzle migration
moon ci                               # what CI runs
```

## Releasing

Trunk-based development on `main`. Branches are short-lived, branch off `main`, and squash-merge once CI is green. Pre-push hooks run biome and the typecheck plus unit tests via lefthook. Dependabot keeps deps current.

`main` is protected and the rules apply to admins too:

| Rule | Effect |
|---|---|
| Pull request required | No direct pushes to `main`; 0 approvals required, so you can merge your own once CI is green |
| 3 required checks, strict | `Check, test, build (affected)`, `E2E (api + web)` and `Drizzle schema drift check` must pass, and the branch must be up to date with `main` |
| Linear history, squash-only | Merge commits and rebase merges are disabled at the repo level |
| Branch auto-deleted on merge | Keeps the branch list honest about what is in flight |
| No force pushes or deletions | Applies to everyone, including admins |

`E2E (api + web)` is a gate rather than a suite: the API and the web suites run as two parallel jobs and the gate reports their combined result, so the required check keeps one name. Both suites are skipped when a change touches only Markdown, documentation and the root version, which is why a documentation pull request goes green in seconds.

A branch that has fallen behind must be rebased on `main` and re-pushed; that is what keeps the history linear and every commit on `main` CI-green.

PRs use `.github/PULL_REQUEST_TEMPLATE.md`. Fill every section in place, writing "None" rather than deleting one. Reviews use `.github/PULL_REQUEST_REVIEW_TEMPLATE.md` and always cover three sections: **Functional** (correctness, and whether every Changelog bullet is actually implemented), **Clean Code** (the conventions in `.claude/skills/ts-conventions/SKILL.md`, plus duplication and naming), and **Feature Suggestions** (non-blocking, each tagged `this-pr` or `follow-up`). Findings in the first two carry a P0–P3 severity from the template's legend.

Releases are automatic and there is nothing to run by hand: every merge to `main` carries a version bump, and the workflow tags that commit once its checks are green. The notes are lifted from each PR's Changelog section rather than from commit subjects, which is why that section is written for whoever reads the release page. How it is assembled, and how to re-run a publish that failed, are in [docs/operations/deployment.md](docs/operations/deployment.md).

## Documentation

| Document | Answers |
|---|---|
| [AGENTS.md](AGENTS.md) | The rules an agent or a new contributor works under, and which file to read before what |
| [.claude/skills/ts-conventions/SKILL.md](.claude/skills/ts-conventions/SKILL.md) | The TypeScript ruleset, in full |
| [docs/adding-a-module.md](docs/adding-a-module.md) | Every touchpoint a new module, endpoint or permission has to reach |
| [docs/effect-services.md](docs/effect-services.md) | Why a service is a const and an error is a class |
| [docs/operations/](docs/operations/) | Deploying, backups, runbooks, alerting, credentials, retention, logging |
| [docs/kpi/](docs/kpi/) | Where this repository stands against an external engineering standards rubric |
