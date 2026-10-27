import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { PILOT_MESSAGE } from "@app/messages";
import type { TPilot, TPilotCreateInput } from "@app/schemas";
import { Effect } from "effect";
import { toPilotDto } from "#/pilot/application/to-pilot-dto.ts";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import { EBadRequest, type EDatabase } from "#/shared/errors.ts";

export const pilotCreate = Effect.fn("pilotCreate")(function* (
	input: TPilotCreateInput,
	actorId: string,
): Effect.fn.Return<
	TPilot,
	EBadRequest | EDatabase,
	TPilotRepoId | TActivityRecorderId
> {
	const repo = yield* PilotRepo;
	const activityRepo = yield* ActivityRecorder;

	const product = yield* repo.findProduct(input.hsCode, input.hsRevision);

	if (product === null) {
		return yield* new EBadRequest({
			message: PILOT_MESSAGE.PRODUCT_NOT_FOUND,
		});
	}

	const market = yield* repo.findMarket(input.marketIso2);

	if (market === null) {
		return yield* new EBadRequest({
			message: PILOT_MESSAGE.MARKET_NOT_FOUND,
		});
	}

	if (input.ownerId !== undefined && input.ownerId !== null) {
		const owner = yield* repo.findOwner(input.ownerId);

		if (owner === null) {
			return yield* new EBadRequest({
				message: PILOT_MESSAGE.OWNER_NOT_FOUND,
			});
		}
	}

	const row = yield* repo.create({
		...input,
		hsCode: product.hsCode,
		hsRevision: product.hsRevision,
		marketIso2: market.iso2,
		createdBy: actorId,
	});

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.PILOT_CREATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.PILOT,
		resourceId: row.id,
		metadata: {
			status: row.status,
			product: `${row.hsCode}@${row.hsRevision}`,
			market: row.marketIso2,
		},
	});

	return toPilotDto(row);
});
