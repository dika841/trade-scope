import { Context, Effect, Layer } from "effect";
import { env } from "#/platform/config/env.ts";
import { dbCreate, type TDb } from "#/platform/db/client.ts";
import { closeQuietly } from "#/platform/resource-close.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { SERVICE_TAG } from "#/platform/service-tags.ts";

export type TDbService = { readonly db: TDb };

export type TDbServiceId = TServiceId<typeof SERVICE_TAG.DB>;

export const DbService = Context.Service<TDbServiceId, TDbService>(
	SERVICE_TAG.DB,
);

export const dbServiceLayer = Layer.effect(
	DbService,
	Effect.gen(function* () {
		const handle = yield* Effect.acquireRelease(
			Effect.sync(() => dbCreate(env.DATABASE_URL, env.DATABASE_DRIVER)),
			(found): Effect.Effect<void> => closeQuietly(() => found.close()),
		);

		return DbService.of({ db: handle.db });
	}),
);
