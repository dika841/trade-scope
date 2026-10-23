# Logging

## Where logs go

The api writes newline-delimited JSON to stdout and nothing else. It does not open a connection to a log service, and that is deliberate.

A process that ships its own logs owns delivery: retries, buffering, and what to do when the log service is down. That work is already solved by the platform, which sees stdout for every container, keeps reading it while the application is busy, and does not lose the last lines when the process dies. An application that posts its own logs tends to drop exactly the lines written during the incident you are investigating.

So the collector is the platform's job. A Docker log driver, a Kubernetes agent, Vector, Fluent Bit and the hosted equivalents all read stdout without the application knowing.

## If you do want the application to ship

`LOG_TRANSPORT_TARGET` names a pino transport, and `LOG_TRANSPORT_OPTIONS` carries its options as a JSON object. The transport package has to be installed alongside.

```sh
LOG_TRANSPORT_TARGET=pino-loki
LOG_TRANSPORT_OPTIONS={"host":"http://loki:3100","labels":{"app":"standard"}}
```

Neither variable is set by default, so the default path stays stdout. Outside production the default is `pino-pretty`, and setting a target overrides that too, which is how you test a shipping setup locally.

## Level

`LOG_LEVEL` accepts the pino levels. Unset, it is `info` in production and `debug` everywhere else. Raise it to `debug` in production only briefly: the request logger writes a line per request, and debug adds to that.

## Redaction

Logs that stay on one machine are one thing. Logs shipped to a service other people can read are another, so the fields most likely to carry a secret are censored before they are written:

| Path | Why |
|---|---|
| `authorization`, `cookie` headers | A bearer token or a session cookie is a working credential |
| `password`, `*.password` | Never wanted, and easy to pass in by accident through an input object |
| `token`, `*.token` | Reset tokens and verification tokens are single-use credentials, and a log is long lived |
| `err.cause.connectionString` | `toORPCError` keeps the original error as `cause` so it reaches the logs, and a database error commonly carries the connection string with its password |

That last one exists because of a decision made elsewhere: unexpected errors deliberately keep their cause for the logs while hiding it from the client. That only stays safe if the cause is scrubbed on its way into the log.

### Connection URLs are a special case

A connection URL carries its password in the middle of a string, so no field-path rule can censor it: redacting a field named `url` would blind every legitimate use of that name, and the credential can arrive under any name at all. Pass one through `connectionUrlRedact` from `@app/logger` instead, which replaces the user and password while leaving the host and port readable.

```ts
logger.info({ broker: connectionUrlRedact(env.RABBITMQ_URL) }, "worker waiting for the broker");
```

Anything that does not parse as a URL is censored entirely rather than passed through, because a value that was expected to be a URL and is not is exactly the case where guessing is wrong.

Redaction is not a substitute for not logging a secret. It covers the paths that are known to carry one, and a new field with a new name will not be covered until someone adds it here.

## What is not here

Metrics and tracing. The alerts in [alerting.md](alerting.md) that depend on error rate and latency need the request lines queryable somewhere, which this makes possible, but there is no `/metrics` endpoint and no trace propagation. OpenTelemetry is the vendor-neutral way in when it is time.
