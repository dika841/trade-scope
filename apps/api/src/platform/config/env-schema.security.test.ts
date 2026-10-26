import { describe, expect, it } from "vitest";
import {
	apiReferenceEnabledOf,
	envSchema,
} from "#/platform/config/env-schema.ts";

const ENV = {
	BETTER_AUTH_SECRET: "a-32-character-production-secret!",
	BETTER_AUTH_URL: "https://api.trade-scope.test",
	DATABASE_URL: "postgres://app:app@localhost:5432/app",
	RABBITMQ_URL: "amqp://app:app@localhost:5672",
	REDIS_URL: "redis://localhost:6379",
	WEB_ORIGIN: "https://trade-scope.test",
} as const;

const METRICS_TOKEN = "a-32-character-metrics-scrape-tok";

describe("envSchema security", () => {
	it("requires a 32-character authentication secret", () => {
		expect(
			envSchema.safeParse({ ...ENV, BETTER_AUTH_SECRET: "too-short" }).success,
		).toBe(false);
	});

	it("rejects an HTTP web origin in production", () => {
		expect(
			envSchema.safeParse({
				...ENV,
				NODE_ENV: "production",
				WEB_ORIGIN: "http://trade-scope.test",
			}).success,
		).toBe(false);
	});

	it("rejects an HTTP auth URL in production", () => {
		expect(
			envSchema.safeParse({
				...ENV,
				NODE_ENV: "production",
				BETTER_AUTH_URL: "http://api.trade-scope.test",
			}).success,
		).toBe(false);
	});

	it("accepts HTTPS URLs in production", () => {
		expect(
			envSchema.safeParse({
				...ENV,
				NODE_ENV: "production",
				METRICS_TOKEN,
			}).success,
		).toBe(true);
	});

	it("refuses to start in production with metrics enabled and no token", () => {
		const result = envSchema.safeParse({ ...ENV, NODE_ENV: "production" });

		expect(result.success).toBe(false);
	});

	it("accepts production metrics behind a token", () => {
		const result = envSchema.safeParse({
			...ENV,
			NODE_ENV: "production",
			METRICS_TOKEN,
		});

		expect(result.success).toBe(true);
	});

	it("accepts production with metrics switched off", () => {
		const result = envSchema.safeParse({
			...ENV,
			NODE_ENV: "production",
			METRICS_ENABLED: "false",
		});

		expect(result.success).toBe(true);
	});

	it("rejects a metrics token that is too short to be a secret", () => {
		const result = envSchema.safeParse({ ...ENV, METRICS_TOKEN: "short" });

		expect(result.success).toBe(false);
	});

	it("rejects a data source secret key that is too short", () => {
		const result = envSchema.safeParse({
			...ENV,
			DATA_SOURCE_SECRET_KEY: "short",
		});

		expect(result.success).toBe(false);
	});

	it("accepts a dedicated data source key and a blank value", () => {
		expect(
			envSchema.safeParse({
				...ENV,
				DATA_SOURCE_SECRET_KEY: "a-32-character-data-source-key!!",
			}).success,
		).toBe(true);
		expect(
			envSchema.safeParse({ ...ENV, DATA_SOURCE_SECRET_KEY: "" }).success,
		).toBe(true);
	});

	it("requires Upstash credentials when REDIS_DRIVER=upstash", () => {
		const { REDIS_URL: _redisUrl, ...withoutRedisUrl } = ENV;
		const result = envSchema.safeParse({
			...withoutRedisUrl,
			REDIS_DRIVER: "upstash",
		});

		expect(result.success).toBe(false);
	});

	it("accepts Upstash without REDIS_URL when both credentials are present", () => {
		const { REDIS_URL: _redisUrl, ...withoutRedisUrl } = ENV;
		const result = envSchema.safeParse({
			...withoutRedisUrl,
			REDIS_DRIVER: "upstash",
			UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
			UPSTASH_REDIS_REST_TOKEN: "upstash-token",
		});

		expect(result.success).toBe(true);
	});

	it("requires REDIS_URL for the node Redis driver", () => {
		const { REDIS_URL: _redisUrl, ...withoutRedisUrl } = ENV;
		const result = envSchema.safeParse(withoutRedisUrl);

		expect(result.success).toBe(false);
	});

	it("accepts the Neon database driver with a connection string", () => {
		const result = envSchema.safeParse({
			...ENV,
			DATABASE_DRIVER: "neon",
			DATABASE_URL:
				"postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require",
		});

		expect(result.success).toBe(true);
	});

	it("reads a blank sample ratio as the default rather than as zero", () => {
		const result = envSchema.safeParse({ ...ENV, TRACING_SAMPLE_RATIO: "" });

		expect(result.success && result.data.TRACING_SAMPLE_RATIO).toBe(1);
	});

	it("still honours an explicit sample ratio", () => {
		const result = envSchema.safeParse({
			...ENV,
			TRACING_SAMPLE_RATIO: "0.1",
		});

		expect(result.success && result.data.TRACING_SAMPLE_RATIO).toBe(0.1);
	});

	it("rejects a sample ratio outside zero to one", () => {
		expect(
			envSchema.safeParse({ ...ENV, TRACING_SAMPLE_RATIO: "2" }).success,
		).toBe(false);
	});

	it("rejects LOG_TRANSPORT_OPTIONS that is not valid JSON", () => {
		const result = envSchema.safeParse({
			...ENV,
			LOG_TRANSPORT_OPTIONS: "{not json",
		});

		expect(result.success).toBe(false);
	});

	it("rejects LOG_TRANSPORT_OPTIONS that parses to something other than an object", () => {
		const rejected = ["null", "[1,2]", '"a string"', "42"];

		for (const value of rejected) {
			expect(
				envSchema.safeParse({ ...ENV, LOG_TRANSPORT_OPTIONS: value }).success,
			).toBe(false);
		}
	});

	it("accepts a JSON object and an empty value", () => {
		expect(
			envSchema.safeParse({
				...ENV,
				LOG_TRANSPORT_OPTIONS: '{"host":"http://loki:3100"}',
			}).success,
		).toBe(true);
		expect(
			envSchema.safeParse({ ...ENV, LOG_TRANSPORT_OPTIONS: "" }).success,
		).toBe(true);
	});

	it("rejects a log level outside the pino set", () => {
		expect(envSchema.safeParse({ ...ENV, LOG_LEVEL: "verbose" }).success).toBe(
			false,
		);
	});
});

describe("apiReferenceEnabledOf", () => {
	it("serves the API reference outside production unless told otherwise", () => {
		expect(apiReferenceEnabledOf(envSchema.parse(ENV))).toBe(true);
		expect(
			apiReferenceEnabledOf(
				envSchema.parse({ ...ENV, API_REFERENCE_ENABLED: "false" }),
			),
		).toBe(false);
	});

	it("hides the API reference in production unless told otherwise", () => {
		const production = { ...ENV, NODE_ENV: "production", METRICS_TOKEN };

		expect(apiReferenceEnabledOf(envSchema.parse(production))).toBe(false);
		expect(
			apiReferenceEnabledOf(
				envSchema.parse({ ...production, API_REFERENCE_ENABLED: "true" }),
			),
		).toBe(true);
	});
});
