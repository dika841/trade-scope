import {
	ingestionRunDetailSchema,
	ingestionRunSchema,
	type TIngestionRun,
	type TIngestionRunDetail,
} from "@app/schemas";
import type { TIngestionRunRow } from "#/ingestion/domain/ingestion.ts";

export const toIngestionRunDto = (row: TIngestionRunRow): TIngestionRun =>
	ingestionRunSchema.parse({
		id: row.id,
		sourceId: row.sourceId,
		sourceName: row.sourceName,
		retryOfId: row.retryOfId,
		kind: row.kind,
		mode: row.mode,
		fileName: row.fileName,
		status: row.status,
		totalRows: row.totalRows,
		insertedRows: row.insertedRows,
		updatedRows: row.updatedRows,
		failedRows: row.failedRows,
		message: row.message,
		triggeredBy: row.triggeredBy,
		triggeredByEmail: row.triggeredByEmail,
		startedAt: row.startedAt === null ? null : row.startedAt.toISOString(),
		finishedAt: row.finishedAt === null ? null : row.finishedAt.toISOString(),
		createdAt: row.createdAt.toISOString(),
	});

export const toIngestionRunDetailDto = (
	row: TIngestionRunRow,
): TIngestionRunDetail =>
	ingestionRunDetailSchema.parse({
		...toIngestionRunDto(row),
		errors: [...row.errors],
	});
