import { Effect } from "effect";
import { DbService, type TDbServiceId } from "#/platform/db/db-service.ts";
import { pilotRequest } from "#/platform/db/tables/pilot.ts";

export type TPilotSeedResult = {
	rows: number;
};

const HS_REVISION = "HS2022";

const PILOTS = [
	{
		hsCode: "090121",
		marketIso2: "US",
		status: "in_review",
		notes: "Confirm importer demand with two US buyers before the next quote.",
	},
	{
		hsCode: "610910",
		marketIso2: "DE",
		status: "approved",
		notes: "Buyer list validated. Prepare samples and a landed-cost estimate.",
	},
	{
		hsCode: "851713",
		marketIso2: "JP",
		status: "new",
		notes: "Check certification requirements before any outreach.",
	},
] as const;

export const pilotSeed = (
	adminId: string,
): Effect.Effect<TPilotSeedResult, never, TDbServiceId> =>
	Effect.fn("pilotSeed")(function* (): Effect.fn.Return<
		TPilotSeedResult,
		never,
		TDbServiceId
	> {
		const { db } = yield* DbService;

		return yield* Effect.promise(async (): Promise<TPilotSeedResult> => {
			const existing = await db
				.select({ id: pilotRequest.id })
				.from(pilotRequest);

			if (existing.length > 0) {
				return { rows: 0 };
			}

			await db.insert(pilotRequest).values(
				PILOTS.map((pilot) => ({
					hsCode: pilot.hsCode,
					hsRevision: HS_REVISION,
					marketIso2: pilot.marketIso2,
					status: pilot.status,
					ownerId: adminId,
					notes: pilot.notes,
					createdBy: adminId,
				})),
			);

			return { rows: PILOTS.length };
		});
	})();
