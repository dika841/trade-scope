import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE } from "@app/messages";
import {
	DATA_SOURCE_KIND,
	type TDataSourceCreateInput,
	type TDataSource,
} from "@app/schemas";
import { Effect } from "effect";
import { toDataSourceDto } from "#/data-source/application/to-data-source-dto.ts";
import {
	DataSourceRepo,
	type TDataSourceRepoId,
} from "#/data-source/domain/data-source.ts";
import { secretHint, secretSeal } from "#/platform/crypto/secret-box.ts";
import { EConflict, type EDatabase } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";

export const dataSourceCreate = Effect.fn("dataSourceCreate")(function* (
	input: TDataSourceCreateInput,
	actorId: string,
): Effect.fn.Return<
	TDataSource,
	EConflict | EDatabase,
	TDataSourceRepoId | TActivityRecorderId
> {
	const repo = yield* DataSourceRepo;
	const activityRepo = yield* ActivityRecorder;

	const taken = yield* repo.findByName(input.name);

	if (taken !== null) {
		return yield* new EConflict({ message: DATA_SOURCE_MESSAGE.NAME_TAKEN });
	}

	const sealed =
		input.secret === undefined
			? { secretCiphertext: null, secretHint: null }
			: {
					secretCiphertext: secretSeal(input.secret),
					secretHint: secretHint(input.secret),
				};

	const row = yield* repo.create({
		...input,
		...sealed,
		kind: DATA_SOURCE_KIND.CSV,
		createdBy: actorId,
	});

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.DATA_SOURCE_CREATE,
		resourceType: ACTIVITY_RESOURCE_TYPE.DATA_SOURCE,
		resourceId: row.id,
		metadata: { name: row.name, url: row.url },
	});

	return toDataSourceDto(row);
});
