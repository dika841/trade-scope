import pino, { type Logger, type LoggerOptions } from "pino";
import { match, P } from "ts-pattern";

const NODE_ENV = { PRODUCTION: "production" } as const;

export const LOGGER_LEVEL = {
	FATAL: "fatal",
	ERROR: "error",
	WARN: "warn",
	INFO: "info",
	DEBUG: "debug",
	TRACE: "trace",
} as const;

export type TLoggerLevel = (typeof LOGGER_LEVEL)[keyof typeof LOGGER_LEVEL];

export const LOGGER_LEVELS: readonly TLoggerLevel[] = [
	LOGGER_LEVEL.FATAL,
	LOGGER_LEVEL.ERROR,
	LOGGER_LEVEL.WARN,
	LOGGER_LEVEL.INFO,
	LOGGER_LEVEL.DEBUG,
	LOGGER_LEVEL.TRACE,
];

const PRETTY_TARGET = "pino-pretty";

export const REDACT_PLACEHOLDER = "[redacted]";

export const REDACT_PATHS: readonly string[] = [
	"req.headers.authorization",
	"req.headers.cookie",
	"headers.authorization",
	"headers.cookie",
	"password",
	"*.password",
	"token",
	"*.token",
	"secret",
	"*.secret",
	"err.cause.connectionString",
	"err.cause.config.connectionString",
];

export type TLoggerTransport = {
	target: string;
	options?: Record<string, unknown>;
};

export type TLoggerOptionsInput = {
	service: string;
	env: string;
	level?: TLoggerLevel;
	transport?: TLoggerTransport;
};

const defaultLevelFor = (env: string): TLoggerLevel =>
	match(env)
		.with(NODE_ENV.PRODUCTION, (): TLoggerLevel => LOGGER_LEVEL.INFO)
		.otherwise((): TLoggerLevel => LOGGER_LEVEL.DEBUG);

const CREDENTIALS_HIDDEN = "***";

export const connectionUrlRedact = (value: string): string => {
	try {
		const url = new URL(value);

		return match(url.username === "" && url.password === "")
			.with(true, (): string => value)
			.otherwise((): string => {
				url.username = CREDENTIALS_HIDDEN;
				url.password = CREDENTIALS_HIDDEN;
				return url.toString();
			});
	} catch {
		return REDACT_PLACEHOLDER;
	}
};

const transportFor = (
	env: string,
	transport: TLoggerTransport | undefined,
): LoggerOptions["transport"] =>
	match(transport)
		.with(P.nonNullable, (found): LoggerOptions["transport"] => found)
		.otherwise((): LoggerOptions["transport"] =>
			match(env)
				.with(NODE_ENV.PRODUCTION, (): LoggerOptions["transport"] => undefined)
				.otherwise((): LoggerOptions["transport"] => ({
					target: PRETTY_TARGET,
					options: { colorize: true },
				})),
		);

export const loggerOptionsFor = (
	input: TLoggerOptionsInput,
): LoggerOptions => ({
	level: input.level ?? defaultLevelFor(input.env),
	base: { service: input.service },
	redact: { paths: [...REDACT_PATHS], censor: REDACT_PLACEHOLDER },
	transport: transportFor(input.env, input.transport),
});

export const loggerCreate = (input: TLoggerOptionsInput): Logger =>
	pino(loggerOptionsFor(input));

export type TLogger = ReturnType<typeof loggerCreate>;
