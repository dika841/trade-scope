import { loggerCreate, type TLoggerTransport } from "@app/logger";
import { match, P } from "ts-pattern";
import { env } from "#/platform/config/env.ts";

const SERVICE = "api";

const transportFor = (
	target: string | undefined,
	options: Record<string, unknown> | undefined,
): TLoggerTransport | undefined =>
	match(target)
		.with(P.nullish, (): undefined => undefined)
		.otherwise((found): TLoggerTransport => ({ target: found, options }));

export const logger = loggerCreate({
	service: SERVICE,
	env: env.NODE_ENV,
	level: env.LOG_LEVEL,
	transport: transportFor(env.LOG_TRANSPORT_TARGET, env.LOG_TRANSPORT_OPTIONS),
});
