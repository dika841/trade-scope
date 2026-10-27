import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { PILOT_MESSAGE } from "@app/messages";
import {
	PILOT_STATUS_TRANSITION,
	type TPilot,
	type TPilotUpdateInput,
} from "@app/schemas";
import { Effect } from "effect";
import { toPilotDto } from "#/pilot/application/to-pilot-dto.ts";
import { PilotRepo, type TPilotRepoId } from "#/pilot/domain/pilot.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import {
	EBadRequest,
	EConflict,
	type EDatabase,
	ENotFound,
} from "#/shared/errors.ts";

export const pilotUpdate = Effect.fn("pilotUpdate")(function* (
	input: TPilotUpdateInput,
	actorId: string,
): Effect.fn.Return<
	TPilot,
	ENotFound | EBadRequest | EConflict | EDatabase,
	TPilotRepoId | TActivityRecorderId
> {
	const repo = yield* PilotRepo;
	const activityRepo = yield* ActivityRecorder;
	const current = yield* repo.getById(input.id);

	if (current === null) {
		return yield* new ENotFound({ message: PILOT_MESSAGE.NOT_FOUND });
	}

	if (input.status !== undefined && input.status !== current.status) {
		const allowed = PILOT_STATUS_TRANSITION[current.status];

		if (!allowed.includes(input.status)) {
			return yield* new EConflict({
				message: PILOT_MESSAGE.STATUS_TRANSITION_INVALID,
			});
		}
	}

	if (input.ownerId !== undefined && input.ownerId !== null) {
		const owner = yield* repo.findOwner(input.ownerId);

		if (owner === null) {
			return yield* new EBadRequest({
				message: PILOT_MESSAGE.OWNER_NOT_FOUND,
			});
		}
	}

	const updated = yield* repo.update(input);

	if (updated === null) {
		return yield* new ENotFound({ message: PILOT_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.PILOT_UPDATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.PILOT,
		resourceId: updated.id,
		metadata: {
			status: updated.status,
			previousStatus: current.status,
		},
	});

	return toPilotDto(updated);
});
