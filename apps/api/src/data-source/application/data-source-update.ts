import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import type { TDataSource, TDataSourceUpdateInput } from "@app/schemas";
import { Effect } from "effect";
import { toDataSourceDto } from "#/data-source/application/to-data-source-dto.ts";
import {
	DataSourceRepo,
	type TDataSourceRepoId,
} from "#/data-source/domain/data-source.ts";
import { secretHint, secretSeal } from "#/platform/crypto/secret-box.ts";
import { EConflict, type EDatabase, ENotFound } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";

export const dataSourceUpdate = Effect.fn("dataSourceUpdate")(function* (
	input: TDataSourceUpdateInput,
	actorId: string,
): Effect.fn.Return<
	TDataSource,
	ENotFound | EConflict | EDatabase,
	TDataSourceRepoId | TActivityRecorderId
> {
	const repo = yield* DataSourceRepo;
	const activityRepo = yield* ActivityRecorder;
	const existing = yield* repo.findById(input.id);

	if (existing === null) {
		return yield* new ENotFound({ message: DATA_SOURCE_MESSAGE.NOT_FOUND });
	}

	if (input.name !== undefined && input.name !== existing.name) {
		const taken = yield* repo.findByName(input.name);

		if (taken !== null) {
			return yield* new EConflict({
				message: DATA_SOURCE_MESSAGE.NAME_TAKEN,
			});
		}
	}

	const sealed =
		input.secret === undefined
			? {}
			: input.secret === null
				? { secretCiphertext: null, secretHint: null }
				: {
						secretCiphertext: secretSeal(input.secret),
						secretHint: secretHint(input.secret),
					};

	const row = yield* repo.update({ ...input, ...sealed });

	if (row === null) {
		return yield* new ENotFound({ message: DATA_SOURCE_MESSAGE.NOT_FOUND });
	}

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.DATA_SOURCE_UPDATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.DATA_SOURCE,
		resourceId: row.id,
		metadata: {
			name: row.name,
			url: row.url,
			active: row.isActive,
			tokenChanged: input.secret !== undefined,
		},
	});

	return toDataSourceDto(row);
});
