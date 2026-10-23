import {
	DEPENDENCY,
	DEPENDENCY_STATUS,
	type TDependency,
	type TDependencyReport,
} from "@app/schemas";
import { sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { HealthProbe, type THealthProbe } from "#/health/domain/health.ts";
import { CacheService, cacheServiceLayer } from "#/platform/cache/redis.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";

const PROBE_TIMEOUT_MS = 2_000;

const reportOf = (
	name: TDependency,
	probe: () => Promise<unknown>,
): Effect.Effect<TDependencyReport> =>
	Effect.tryPromise(probe).pipe(
		Effect.timeout(PROBE_TIMEOUT_MS),
		Effect.map(
			(): TDependencyReport => ({
				name,
				status: DEPENDENCY_STATUS.UP,
			}),
		),
		Effect.catch(
			(): Effect.Effect<TDependencyReport> =>
				Effect.succeed({ name, status: DEPENDENCY_STATUS.DOWN }),
		),
	);

export const healthProbeLayer = Layer.effect(
	HealthProbe,
	Effect.gen(function* () {
		const { db } = yield* DbService;
		const { client } = yield* CacheService;

		const check: THealthProbe["check"] = () =>
			Effect.all([
				reportOf(DEPENDENCY.DATABASE, () => db.execute(sql`select 1`)),
				reportOf(DEPENDENCY.CACHE, () => client.ping()),
			]);

		return HealthProbe.of({ check });
	}),
).pipe(Layer.provide(Layer.mergeAll(dbServiceLayer, cacheServiceLayer)));
