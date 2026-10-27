import type { TPilotOptions } from "@app/schemas";
import { Effect } from "effect";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const pilotOptions = Effect.fn("pilotOptions")(
	function* (): Effect.fn.Return<TPilotOptions, EDatabase, TPilotRepoId> {
		const repo = yield* PilotRepo;
		const [owners, markets] = yield* Effect.all([
			repo.listOwners(),
			repo.listMarkets(),
		]);

		return { owners, markets };
	},
);
