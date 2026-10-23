import { ROLE_MESSAGE } from "@app/messages";
import { isRole } from "@app/permissions";
import type { TRoleDto, TRoleUpdateInput } from "@app/schemas";
import { Effect } from "effect";
import { toRoleDto } from "#/role/application/to-role-dto.ts";
import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { EBadRequest, type EDatabase, ENotFound } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import {
	CustomRoleRepo,
	type TCustomRoleRepoId,
} from "#/role/domain/custom-role.ts";

export const roleUpdate = Effect.fn("roleUpdate")(function* (
	input: TRoleUpdateInput,
	actorId: string,
): Effect.fn.Return<
	TRoleDto,
	ENotFound | EBadRequest | EDatabase,
	TCustomRoleRepoId | TActivityRecorderId
> {
	const customRoleRepo = yield* CustomRoleRepo;
	const activityRepo = yield* ActivityRecorder;

	if (isRole(input.key)) {
		return yield* new EBadRequest({ message: ROLE_MESSAGE.FIXED });
	}

	const updated = yield* customRoleRepo.update(input);

	if (updated === null) {
		return yield* new ENotFound({ message: ROLE_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.ROLE_UPDATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.ROLE,
		resourceId: updated.key,
	});

	const counts = yield* customRoleRepo.memberCounts();
	return toRoleDto(updated, counts);
});
