import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE, INGESTION_MESSAGE } from "@app/messages";
import {
	INGESTION_MODE,
	type TIngestionRun,
	type TIngestionRunCreateInput,
} from "@app/schemas";
import { Effect } from "effect";
import {
	IngestionRepo,
	type TIngestionRepoId,
} from "#/ingestion/domain/ingestion.ts";
import { toIngestionRunDto } from "#/ingestion/application/to-ingestion-run-dto.ts";
import { EBadRequest, type EDatabase } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";

export const ingestionCreate = Effect.fn("ingestionCreate")(function* (
	input: TIngestionRunCreateInput,
	actorId: string,
): Effect.fn.Return<
	TIngestionRun,
	EBadRequest | EDatabase,
	TIngestionRepoId | TActivityRecorderId
> {
	const repo = yield* IngestionRepo;
	const activityRepo = yield* ActivityRecorder;

	const source =
		input.mode === INGESTION_MODE.SOURCE && input.sourceId !== undefined
			? yield* repo.findSource(input.sourceId)
			: null;

	if (input.mode === INGESTION_MODE.SOURCE) {
		if (source === null) {
			return yield* new EBadRequest({
				message: DATA_SOURCE_MESSAGE.NOT_FOUND,
			});
		}

		if (!source.isActive) {
			return yield* new EBadRequest({
				message: DATA_SOURCE_MESSAGE.DISABLED,
			});
		}
	}

	const row = yield* repo.create({
		sourceId:
			input.mode === INGESTION_MODE.SOURCE ? (input.sourceId ?? null) : null,
		retryOfId: null,
		kind: input.kind,
		mode: input.mode,
		fileName:
			input.mode === INGESTION_MODE.UPLOAD ? (input.fileName ?? null) : null,
		payload:
			input.mode === INGESTION_MODE.UPLOAD ? (input.content ?? null) : null,
		triggeredBy: actorId,
	});

	yield* activityRepo.insert({
		actorId,
		action: ACTIVITY_ACTION.INGESTION_RUN,
		resourceType: ACTIVITY_RESOURCE_TYPE.INGESTION,
		resourceId: row.id,
		metadata: {
			kind: row.kind,
			mode: row.mode,
			source: source?.name ?? row.fileName ?? INGESTION_MESSAGE.NEW_RUN,
		},
	});

	return toIngestionRunDto(row);
});
