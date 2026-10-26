import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import type { TDataSourceIdInput } from "@app/schemas";
import { Effect } from "effect";
import {
	DataSourceRepo,
	type TDataSourceRepoId,
} from "#/data-source/domain/data-source.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";

export const dataSourceDelete = Effect.fn("dataSourceDelete")(function* (
	{ id }: TDataSourceIdInput,
	actorId: string,
): Effect.fn.Return<
	{ id: string },
	ENotFound | EDatabase,
	TDataSourceRepoId | TActivityRecorderId
> {
	const repo = yield* DataSourceRepo;
	const activityRepo = yield* ActivityRecorder;
	const existing = yield* repo.findById(id);

	if (existing === null) {
		return yield* new ENotFound({ message: DATA_SOURCE_MESSAGE.NOT_FOUND });
	}

	const removed = yield* repo.remove(id);

	if (!removed) {
		return yield* new ENotFound({ message: DATA_SOURCE_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.DATA_SOURCE_DELETE,
		resourceType: ACTIVITY_RESOURCE_TYPE.DATA_SOURCE,
		resourceId: id,
		metadata: { name: existing.name },
	});

	return { id };
});
