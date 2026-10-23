# Credentials

**What the application restricts and what the credential allows are two different things, and both have to be written down.** An application that only ever writes to `bucket/reports/` has not been granted only that. If the key it holds carries account-wide access, then one bug, one injected path, or one leaked environment variable reaches everything that key can reach. A prefix in the code is a convention. The policy attached to the key is the boundary.

So every credential below is described twice: what the provider actually grants, and what the application chooses to do with it. When those two columns differ a lot, the gap is the risk.

## Current credentials

| Credential | Provider grants | Application restricts itself to | Rotation |
|---|---|---|---|
| `DATABASE_URL` (Neon) | Read and write on the application database, including DDL, since migrations run as this role. The role is scoped to one Neon project/database | Everything it is granted. Nothing narrower is claimed | On exposure; rotate the role password and update the deployment secret |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Full access to the Upstash database through the REST API | Two key namespaces, `rate-limit:` and `job-dedupe:`, through `cacheKeyCreate` | On exposure; rotate the token in Upstash and redeploy |
| `RABBITMQ_URL` | Full access to the virtual host | The queues named in `QUEUE_NAME` plus their `.retry` and `.dlq` siblings | On exposure |
| `SMTP_URL` | Send as the configured account | Outbound mail only, from `MAIL_FROM` | On exposure |
| `BETTER_AUTH_SECRET` | Signs and verifies every session | Session tokens only. Refused at boot below 32 characters | On exposure, which invalidates every session |
| `METRICS_TOKEN` | Reads `/metrics` on the api: request counts and durations by route and status, plus process memory, CPU and event loop figures | Nothing else. It authorises no application route and carries no session | On exposure. Rotating it only interrupts scraping |
