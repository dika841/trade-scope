import { cacheCreate, type TCache, type TCacheClient } from "@app/cache";
import { Redis as UpstashRedis } from "@upstash/redis";
import { Context, Effect, Layer } from "effect";
import { Redis as NodeRedis } from "ioredis";
import { match } from "ts-pattern";
import { REDIS_DRIVER, type TRedisDriver } from "#/platform/config/drivers.ts";
import { env } from "#/platform/config/env.ts";
import { closeQuietly } from "#/platform/resource-close.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { SERVICE_TAG } from "#/platform/service-tags.ts";

const COMMAND_TIMEOUT_MS = 1_000;
const MAX_RETRIES_PER_REQUEST = 1;

const NODE_REDIS_TOKEN = {
	EXPIRE_SECONDS: "EX",
	IF_ABSENT: "NX",
	OK: "OK",
} as const;

const UPSTASH_OK = "OK";

export type TCacheConnectionConfig = {
	driver: TRedisDriver;
	redisUrl?: string;
	upstashUrl?: string;
	upstashToken?: string;
};

export type TCacheConnection = {
	readonly client: TCacheClient;
	readonly close: () => Promise<unknown>;
};

const nodeClientCreate = (redisUrl: string): NodeRedis =>
	new NodeRedis(redisUrl, {
		maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
		commandTimeout: COMMAND_TIMEOUT_MS,
		enableOfflineQueue: false,
		lazyConnect: false,
	});

const nodeClientOf = (redis: NodeRedis): TCacheClient => ({
	ping: (): Promise<string> => redis.ping(),
	get: (key: string): Promise<string | null> => redis.get(key),
	setex: (key: string, seconds: number, value: string): Promise<unknown> =>
		redis.setex(key, seconds, value),
	setIfAbsent: async (
		key: string,
		seconds: number,
		value: string,
	): Promise<boolean> =>
		(await redis.set(
			key,
			value,
			NODE_REDIS_TOKEN.EXPIRE_SECONDS,
			seconds,
			NODE_REDIS_TOKEN.IF_ABSENT,
		)) === NODE_REDIS_TOKEN.OK,
	del: (key: string): Promise<number> => redis.del(key),
	incr: (key: string): Promise<number> => redis.incr(key),
	expire: (key: string, seconds: number): Promise<number> =>
		redis.expire(key, seconds),
});

const upstashClientOf = (redis: UpstashRedis): TCacheClient => ({
	ping: async (): Promise<string> => String(await redis.ping()),
	get: (key: string): Promise<string | null> => redis.get<string>(key),
	setex: (key: string, seconds: number, value: string): Promise<unknown> =>
		redis.set(key, value, { ex: seconds }),
	setIfAbsent: async (
		key: string,
		seconds: number,
		value: string,
	): Promise<boolean> =>
		(await redis.set(key, value, { ex: seconds, nx: true })) === UPSTASH_OK,
	del: (key: string): Promise<number> => redis.del(key),
	incr: (key: string): Promise<number> => redis.incr(key),
	expire: (key: string, seconds: number): Promise<number> =>
		redis.expire(key, seconds),
});

export const cacheConnectionCreate = (
	config: TCacheConnectionConfig,
): TCacheConnection =>
	match(config.driver)
		.with(REDIS_DRIVER.UPSTASH, (): TCacheConnection => {
			if (!config.upstashUrl || !config.upstashToken) {
				throw new Error("Upstash Redis URL and token are required");
			}

			const redis = new UpstashRedis({
				url: config.upstashUrl,
				token: config.upstashToken,
			});

			return {
				client: upstashClientOf(redis),
				close: (): Promise<void> => Promise.resolve(),
			};
		})
		.otherwise((): TCacheConnection => {
			if (!config.redisUrl) {
				throw new Error("REDIS_URL is required for the node Redis driver");
			}

			const redis = nodeClientCreate(config.redisUrl);
			redis.on("error", (): void => undefined);

			return {
				client: nodeClientOf(redis),
				close: (): Promise<unknown> => redis.quit(),
			};
		});

export type TCacheService = {
	readonly client: TCacheClient;
	readonly cache: TCache;
};

export type TCacheServiceId = TServiceId<typeof SERVICE_TAG.CACHE>;

export const CacheService = Context.Service<TCacheServiceId, TCacheService>(
	SERVICE_TAG.CACHE,
);

export const cacheServiceLayer = Layer.effect(
	CacheService,
	Effect.gen(function* () {
		const connection = yield* Effect.acquireRelease(
			Effect.sync(() =>
				cacheConnectionCreate({
					driver: env.REDIS_DRIVER,
					redisUrl: env.REDIS_URL,
					upstashUrl: env.UPSTASH_REDIS_REST_URL,
					upstashToken: env.UPSTASH_REDIS_REST_TOKEN,
				}),
			),
			(found): Effect.Effect<void> => closeQuietly(found.close),
		);

		return CacheService.of({
			client: connection.client,
			cache: cacheCreate(connection.client),
		});
	}),
);
