import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE, INGESTION_MESSAGE } from "@app/messages";
import {
	INGESTION_MODE,
	isIngestionTerminal,
	type TIngestionIdInput,
	type TIngestionRun,
} from "@app/schemas";
import { Effect } from "effect";
import { toIngestionRunDto } from "#/ingestion/application/to-ingestion-run-dto.ts";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import {
	EBadRequest,
	EConflict,
	type EDatabase,
	ENotFound,
} from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";

export const ingestionRetry = Effect.fn("ingestionRetry")(function* (
	{ id }: TIngestionIdInput,
	actorId: string,
): Effect.fn.Return<
	TIngestionRun,
	ENotFound | EConflict | EBadRequest | EDatabase,
	TIngestionRepoId | TActivityRecorderId
> {
	const repo = yield* IngestionRepo;
	const activityRepo = yield* ActivityRecorder;
	const original = yield* repo.getById(id);

	if (original === null) {
		return yield* new ENotFound({
			message: INGESTION_MESSAGE.NOT_FOUND_TITLE,
		});
	}

	if (!isIngestionTerminal(original.status)) {
		return yield* new EConflict({
			message: INGESTION_MESSAGE.RETRY_UNAVAILABLE,
		});
	}

	if (original.mode === INGESTION_MODE.SOURCE && original.sourceId === null) {
		return yield* new EBadRequest({
			message: DATA_SOURCE_MESSAGE.NOT_FOUND,
		});
	}

	const row = yield* repo.create({
		sourceId: original.sourceId,
		retryOfId: original.id,
		mode: original.mode,
		fileName: original.fileName,
		payload: original.payload,
		triggeredBy: actorId,
	});

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.INGESTION_RUN,
		resourceType: ACTIVITY_RESOURCE_TYPE.INGESTION,
		resourceId: row.id,
		metadata: {
			mode: row.mode,
			source:
				row.fileName ?? original.sourceName ?? INGESTION_MESSAGE.RETRY_ACTION,
			retryOf: original.id,
		},
	});

	return toIngestionRunDto(row);
});
