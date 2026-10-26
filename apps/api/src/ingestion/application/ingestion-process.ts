import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from "@app/activity";
import { DATA_SOURCE_MESSAGE, INGESTION_MESSAGE } from "@app/messages";
import {
	INGESTION_CSV_MAX_BYTES,
	INGESTION_KIND,
	INGESTION_MODE,
	INGESTION_STATUS,
	isIngestionTerminal,
} from "@app/schemas";
import { Effect } from "effect";
import { ingestionCsvParse } from "#/ingestion/application/ingestion-csv.ts";
import { ingestionTradeCsvParse } from "#/ingestion/application/ingestion-trade-csv.ts";
import {
	IngestionRepo,
	type TIngestionFinalizeInput,
	type TIngestionRepoId,
	type TIngestionRunRow,
	type TIngestionSourceRow,
} from "#/ingestion/domain/ingestion.ts";
import { secretOpen } from "#/platform/crypto/secret-box.ts";
import { outboundTextFetch } from "#/platform/http/outbound-text.ts";
import { transactional } from "#/platform/db/transaction.ts";
import { EBadRequest, type EDatabase, EUpstream } from "#/shared/errors.ts";
import {
	ActivityRecorder,
	type TActivityRecorderId,
} from "#/shared/activity-recorder.ts";
import type { TDbServiceId } from "#/platform/db/db-service.ts";

const SOURCE_LABEL_MAX = 100;

const sourceLabelOf = (
	run: TIngestionRunRow,
	source: TIngestionSourceRow | null,
): string => {
	const label =
		run.mode === INGESTION_MODE.SOURCE && source !== null
			? `source:${source.name}`
			: `upload:${run.fileName ?? "csv"}`;

	return label.slice(0, SOURCE_LABEL_MAX);
};

const sourceInputRead = (
	run: TIngestionRunRow,
	source: TIngestionSourceRow | null,
): Effect.Effect<string, EBadRequest | EUpstream> => {
	if (run.mode === INGESTION_MODE.UPLOAD) {
		return run.payload === null
			? Effect.fail(
					new EBadRequest({ message: INGESTION_MESSAGE.EMPTY_SOURCE }),
				)
			: Effect.succeed(run.payload);
	}

	if (source === null) {
		return Effect.fail(
			new EBadRequest({ message: DATA_SOURCE_MESSAGE.NOT_FOUND }),
		);
	}

	if (!source.isActive) {
		return Effect.fail(
			new EBadRequest({ message: DATA_SOURCE_MESSAGE.DISABLED }),
		);
	}

	return Effect.gen(function* () {
		const token =
			source.secretCiphertext === null
				? undefined
				: yield* Effect.try({
						try: (): string => secretOpen(source.secretCiphertext ?? ""),
						catch: (cause): EUpstream =>
							new EUpstream({
								message: INGESTION_MESSAGE.SECRET_UNREADABLE,
								cause,
							}),
					});

		return yield* outboundTextFetch(source.url, {
			maxBytes: INGESTION_CSV_MAX_BYTES,
			bearerToken: token,
		});
	});
};

const finish = (
	input: TIngestionFinalizeInput,
	actorId: string | null,
): Effect.Effect<
	void,
	EDatabase,
	TIngestionRepoId | TActivityRecorderId | TDbServiceId
> =>
	transactional(
		Effect.gen(function* () {
			const repo = yield* IngestionRepo;
			const activityRepo = yield* ActivityRecorder;
			const row = yield* repo.finalize(input);

			if (row === null) {
				return;
			}

			yield* activityRepo.insert({
				actorId,
				action: ACTIVITY_ACTION.INGESTION_FINISH,
				resourceType: ACTIVITY_RESOURCE_TYPE.INGESTION,
				resourceId: row.id,
				metadata: {
					kind: row.kind,
					status: row.status,
					totalRows: row.totalRows,
					insertedRows: row.insertedRows,
					updatedRows: row.updatedRows,
					failedRows: row.failedRows,
				},
			});
		}),
	);

export const ingestionProcess = Effect.fn("ingestionProcess")(function* (
	runId: string,
): Effect.fn.Return<
	void,
	EDatabase | EBadRequest | EUpstream,
	TIngestionRepoId | TActivityRecorderId | TDbServiceId
> {
	const repo = yield* IngestionRepo;
	const current = yield* repo.getById(runId);

	if (current === null || isIngestionTerminal(current.status)) {
		return;
	}

	const run = yield* repo.markRunning(runId);

	if (run === null) {
		return;
	}

	const source =
		run.mode === INGESTION_MODE.SOURCE && run.sourceId !== null
			? yield* repo.findSource(run.sourceId)
			: null;

	if (run.kind === INGESTION_KIND.TRADE) {
		const parsed = yield* sourceInputRead(run, source).pipe(
			Effect.flatMap((text) =>
				Effect.try({
					try: () => ingestionTradeCsvParse(text),
					catch: (cause): EBadRequest | EUpstream =>
						cause instanceof EBadRequest
							? cause
							: new EBadRequest({
									message: INGESTION_MESSAGE.INVALID_TRADE_HEADER,
								}),
				}),
			),
			Effect.matchEffect({
				onFailure: (error) =>
					finish(
						{
							id: run.id,
							status: INGESTION_STATUS.FAILED,
							totalRows: 0,
							insertedRows: 0,
							updatedRows: 0,
							failedRows: 0,
							errors: [],
							message: error.message,
						},
						run.triggeredBy,
					).pipe(Effect.as(null)),
				onSuccess: (value) => Effect.succeed(value),
			}),
		);

		if (parsed === null) {
			return;
		}

		if (parsed.totalRows === 0) {
			yield* finish(
				{
					id: run.id,
					status: INGESTION_STATUS.FAILED,
					totalRows: 0,
					insertedRows: 0,
					updatedRows: 0,
					failedRows: 0,
					errors: [],
					message: INGESTION_MESSAGE.EMPTY_SOURCE,
				},
				run.triggeredBy,
			);
			return;
		}

		const status =
			parsed.failures.length === 0
				? INGESTION_STATUS.SUCCEEDED
				: INGESTION_STATUS.PARTIAL;

		yield* transactional(
			Effect.gen(function* () {
				const counts = yield* repo.upsertTrade(parsed.trades);

				const row = yield* repo.finalize({
					id: run.id,
					status,
					totalRows: parsed.totalRows,
					insertedRows: counts.inserted,
					updatedRows: counts.updated,
					failedRows: parsed.failures.length,
					errors: parsed.failures,
					message: null,
				});

				if (row === null) {
					return;
				}

				const activityRepo = yield* ActivityRecorder;
				yield* activityRepo.insert({
					actorId: run.triggeredBy,
					action: ACTIVITY_ACTION.INGESTION_FINISH,
					resourceType: ACTIVITY_RESOURCE_TYPE.INGESTION,
					resourceId: row.id,
					metadata: {
						kind: row.kind,
						status: row.status,
						totalRows: row.totalRows,
						insertedRows: row.insertedRows,
						updatedRows: row.updatedRows,
						failedRows: row.failedRows,
					},
				});
			}),
		);
		return;
	}

	const parsed = yield* sourceInputRead(run, source).pipe(
		Effect.flatMap((text) =>
			Effect.try({
				try: () => ingestionCsvParse(text),
				catch: (cause): EBadRequest | EUpstream =>
					cause instanceof EBadRequest
						? cause
						: new EBadRequest({
								message: INGESTION_MESSAGE.INVALID_HEADER,
							}),
			}),
		),
		Effect.matchEffect({
			onFailure: (error) =>
				finish(
					{
						id: run.id,
						status: INGESTION_STATUS.FAILED,
						totalRows: 0,
						insertedRows: 0,
						updatedRows: 0,
						failedRows: 0,
						errors: [],
						message: error.message,
					},
					run.triggeredBy,
				).pipe(Effect.as(null)),
			onSuccess: (value) => Effect.succeed(value),
		}),
	);

	if (parsed === null) {
		return;
	}

	if (parsed.totalRows === 0) {
		yield* finish(
			{
				id: run.id,
				status: INGESTION_STATUS.FAILED,
				totalRows: 0,
				insertedRows: 0,
				updatedRows: 0,
				failedRows: 0,
				errors: [],
				message: INGESTION_MESSAGE.EMPTY_SOURCE,
			},
			run.triggeredBy,
		);
		return;
	}

	const status =
		parsed.failures.length === 0
			? INGESTION_STATUS.SUCCEEDED
			: INGESTION_STATUS.PARTIAL;

	yield* transactional(
		Effect.gen(function* () {
			const counts = yield* repo.upsertCatalog({
				sourceLabel: sourceLabelOf(run, source),
				products: parsed.products,
			});

			const row = yield* repo.finalize({
				id: run.id,
				status,
				totalRows: parsed.totalRows,
				insertedRows: counts.inserted,
				updatedRows: counts.updated,
				failedRows: parsed.failures.length,
				errors: parsed.failures,
				message: null,
			});

			if (row === null) {
				return;
			}

			const activityRepo = yield* ActivityRecorder;
			yield* activityRepo.insert({
				actorId: run.triggeredBy,
				action: ACTIVITY_ACTION.INGESTION_FINISH,
				resourceType: ACTIVITY_RESOURCE_TYPE.INGESTION,
				resourceId: row.id,
				metadata: {
					kind: row.kind,
					status: row.status,
					totalRows: row.totalRows,
					insertedRows: row.insertedRows,
					updatedRows: row.updatedRows,
					failedRows: row.failedRows,
				},
			});
		}),
	);
});
