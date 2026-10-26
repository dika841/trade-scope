import { LOGGER_LEVELS } from "@app/logger";
import { userCreateInputSchema } from "@app/schemas";
import { z } from "zod";
import { A } from "@mobily/ts-belt";
import { match, P } from "ts-pattern";
import { DATABASE_DRIVER, REDIS_DRIVER } from "#/platform/config/drivers.ts";

export { DATABASE_DRIVER, REDIS_DRIVER };

export const NODE_ENV = {
	PRODUCTION: "production",
} as const;

const URL_PROTOCOL = {
	HTTPS: "https:",
} as const;

const ENV_KEY = {
	BETTER_AUTH_URL: "BETTER_AUTH_URL",
	WEB_ORIGIN: "WEB_ORIGIN",
	METRICS_TOKEN: "METRICS_TOKEN",
	DATABASE_URL: "DATABASE_URL",
	REDIS_URL: "REDIS_URL",
	UPSTASH_REDIS_REST_URL: "UPSTASH_REDIS_REST_URL",
	UPSTASH_REDIS_REST_TOKEN: "UPSTASH_REDIS_REST_TOKEN",
} as const;

const ENV_VALIDATION_MESSAGE = {
	HTTPS_REQUIRED: "HTTPS is required in production.",
	TRANSPORT_OPTIONS_INVALID_JSON: "LOG_TRANSPORT_OPTIONS must be valid JSON.",
	TRANSPORT_OPTIONS_NOT_OBJECT:
		"LOG_TRANSPORT_OPTIONS must be a JSON object, not an array, a string, or null.",
	METRICS_TOKEN_REQUIRED:
		"METRICS_TOKEN is required in production while METRICS_ENABLED is true, because /metrics is served on the same origin as the application.",
	REDIS_URL_REQUIRED:
		"REDIS_URL is required while REDIS_DRIVER=node. Set REDIS_DRIVER=upstash to use Upstash instead.",
	UPSTASH_URL_REQUIRED:
		"UPSTASH_REDIS_REST_URL is required while REDIS_DRIVER=upstash.",
	UPSTASH_TOKEN_REQUIRED:
		"UPSTASH_REDIS_REST_TOKEN is required while REDIS_DRIVER=upstash.",
} as const;

const blankAsUndefined = (value: unknown): unknown =>
	match(value)
		.with("", (): undefined => undefined)
		.otherwise((found): unknown => found);

type TJsonDecoded = { ok: true; value: unknown } | { ok: false };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const jsonDecode = (found: string): TJsonDecoded => {
	try {
		return { ok: true, value: JSON.parse(found) };
	} catch {
		return { ok: false };
	}
};

const jsonObjectDecode = (
	found: string,
	context: z.RefinementCtx,
): Record<string, unknown> | undefined =>
	match(jsonDecode(found))
		.with({ ok: false }, (): undefined => {
			context.addIssue({
				code: "custom",
				message: ENV_VALIDATION_MESSAGE.TRANSPORT_OPTIONS_INVALID_JSON,
			});
			return undefined;
		})
		.otherwise(({ value }): Record<string, unknown> | undefined =>
			match(value)
				.when(isPlainObject, (found2): Record<string, unknown> => found2)
				.otherwise((): undefined => {
					context.addIssue({
						code: "custom",
						message: ENV_VALIDATION_MESSAGE.TRANSPORT_OPTIONS_NOT_OBJECT,
					});
					return undefined;
				}),
		);

const jsonObjectParse = (
	value: string | undefined,
	context: z.RefinementCtx,
): Record<string, unknown> | undefined =>
	match(value)
		.with(P.nullish, (): undefined => undefined)
		.otherwise((found): Record<string, unknown> | undefined =>
			jsonObjectDecode(found, context),
		);

const stringListParse = (value: string): readonly string[] =>
	A.filterMap(value.split(","), (item): string | undefined => {
		const trimmed = item.trim();
		return trimmed === "" ? undefined : trimmed;
	});

export const envSchema = z
	.object({
		NODE_ENV: z
			.enum(["development", "test", NODE_ENV.PRODUCTION])
			.default("development"),
		PORT: z.coerce.number().int().default(3001),
		WEB_ORIGIN: z.url().default("http://localhost:5173"),
		WEB_DIST_PATH: z.string().optional(),
		API_REFERENCE_ENABLED: z.preprocess(
			blankAsUndefined,
			z.stringbool().optional(),
		),
		DATABASE_DRIVER: z
			.enum([DATABASE_DRIVER.NODE, DATABASE_DRIVER.NEON])
			.default(DATABASE_DRIVER.NODE),
		DATABASE_URL: z.string().min(1),
		REDIS_DRIVER: z
			.enum([REDIS_DRIVER.NODE, REDIS_DRIVER.UPSTASH])
			.default(REDIS_DRIVER.NODE),
		REDIS_URL: z.preprocess(blankAsUndefined, z.string().min(1).optional()),
		UPSTASH_REDIS_REST_URL: z.preprocess(blankAsUndefined, z.url().optional()),
		UPSTASH_REDIS_REST_TOKEN: z.preprocess(
			blankAsUndefined,
			z.string().min(1).optional(),
		),
		RABBITMQ_URL: z.string().min(1),
		SMTP_URL: z.string().min(1).default("smtp://localhost:1025"),
		MAIL_FROM: z.string().min(1).default("Standard <no-reply@standard.test>"),
		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		DATA_SOURCE_SECRET_KEY: z.preprocess(
			blankAsUndefined,
			z.string().min(32).optional(),
		),
		SEED_PASSWORD: z.preprocess(
			blankAsUndefined,
			userCreateInputSchema.shape.password.optional(),
		),
		LOG_LEVEL: z.preprocess(blankAsUndefined, z.enum(LOGGER_LEVELS).optional()),
		LOG_TRANSPORT_TARGET: z.preprocess(
			blankAsUndefined,
			z.string().min(1).optional(),
		),
		LOG_TRANSPORT_OPTIONS: z
			.preprocess(blankAsUndefined, z.string().optional())
			.transform(jsonObjectParse),
		ACTIVITY_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
		RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().default(60),
		RATE_LIMIT_MAX: z.coerce.number().int().default(100),
		RATE_LIMIT_TRUSTED_PROXY_IPS: z
			.string()
			.default("")
			.transform(stringListParse),
		TRACING_ENDPOINT: z.preprocess(blankAsUndefined, z.url().optional()),
		TRACING_HEADERS: z
			.preprocess(blankAsUndefined, z.string().optional())
			.transform(jsonObjectParse),
		TRACING_SAMPLE_RATIO: z.preprocess(
			blankAsUndefined,
			z.coerce.number().min(0).max(1).default(1),
		),
		METRICS_ENABLED: z.preprocess(
			blankAsUndefined,
			z.stringbool().default(true),
		),
		METRICS_TOKEN: z.preprocess(
			blankAsUndefined,
			z.string().min(32).optional(),
		),
	})
	.superRefine((env, context): void => {
		match(env.REDIS_DRIVER)
			.with(REDIS_DRIVER.UPSTASH, (): void => {
				match(env.UPSTASH_REDIS_REST_URL)
					.with(P.nullish, (): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.UPSTASH_REDIS_REST_URL],
							message: ENV_VALIDATION_MESSAGE.UPSTASH_URL_REQUIRED,
						});
					})
					.otherwise((): void => undefined);
				match(env.UPSTASH_REDIS_REST_TOKEN)
					.with(P.nullish, (): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.UPSTASH_REDIS_REST_TOKEN],
							message: ENV_VALIDATION_MESSAGE.UPSTASH_TOKEN_REQUIRED,
						});
					})
					.otherwise((): void => undefined);
			})
			.otherwise((): void => {
				match(env.REDIS_URL)
					.with(P.nullish, (): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.REDIS_URL],
							message: ENV_VALIDATION_MESSAGE.REDIS_URL_REQUIRED,
						});
					})
					.otherwise((): void => undefined);
			});

		match(env.NODE_ENV)
			.with(NODE_ENV.PRODUCTION, (): void => {
				match(new URL(env.WEB_ORIGIN).protocol)
					.with(URL_PROTOCOL.HTTPS, (): void => undefined)
					.otherwise((): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.WEB_ORIGIN],
							message: ENV_VALIDATION_MESSAGE.HTTPS_REQUIRED,
						});
					});
				match(new URL(env.BETTER_AUTH_URL).protocol)
					.with(URL_PROTOCOL.HTTPS, (): void => undefined)
					.otherwise((): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.BETTER_AUTH_URL],
							message: ENV_VALIDATION_MESSAGE.HTTPS_REQUIRED,
						});
					});
				match({ enabled: env.METRICS_ENABLED, token: env.METRICS_TOKEN })
					.with({ enabled: true, token: P.nullish }, (): void => {
						context.addIssue({
							code: "custom",
							path: [ENV_KEY.METRICS_TOKEN],
							message: ENV_VALIDATION_MESSAGE.METRICS_TOKEN_REQUIRED,
						});
					})
					.otherwise((): void => undefined);
			})
			.otherwise((): void => undefined);
	});

export type TEnv = z.infer<typeof envSchema>;

export const apiReferenceEnabledOf = (env: TEnv): boolean =>
	env.API_REFERENCE_ENABLED ?? env.NODE_ENV !== NODE_ENV.PRODUCTION;
