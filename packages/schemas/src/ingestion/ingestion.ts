import { INGESTION_MESSAGE } from "@app/messages";
import { z } from "zod";
import { eventSchema } from "../shared/base-schema.ts";
import { paginated, paginationSchema } from "../shared/pagination.ts";
import { SORT_DIRECTION, sortDirectionSchema } from "../shared/sort.ts";

export const INGESTION_STATUS = {
	QUEUED: "queued",
	RUNNING: "running",
	SUCCEEDED: "succeeded",
	PARTIAL: "partial",
	FAILED: "failed",
} as const;

export type TIngestionStatus =
	(typeof INGESTION_STATUS)[keyof typeof INGESTION_STATUS];

export const INGESTION_MODE = {
	UPLOAD: "upload",
	SOURCE: "source",
} as const;

export type TIngestionMode =
	(typeof INGESTION_MODE)[keyof typeof INGESTION_MODE];

export const INGESTION_CSV_MAX_BYTES = 2_000_000;
export const INGESTION_ERRORS_MAX = 50;

export const INGESTION_TERMINAL_STATUSES: readonly TIngestionStatus[] = [
	INGESTION_STATUS.SUCCEEDED,
	INGESTION_STATUS.PARTIAL,
	INGESTION_STATUS.FAILED,
];

export const isIngestionTerminal = (status: TIngestionStatus): boolean =>
	INGESTION_TERMINAL_STATUSES.some((value) => value === status);

const blankAsUndefined = (value: unknown): unknown =>
	value === "" ? undefined : value;

export const ingestionRowErrorSchema = z.object({
	row: z.number().int().min(1),
	message: z.string(),
});
export type TIngestionRowError = z.infer<typeof ingestionRowErrorSchema>;

export const ingestionRunSchema = eventSchema(z.uuid()).extend({
	sourceId: z.uuid().nullable(),
	sourceName: z.string().nullable(),
	retryOfId: z.uuid().nullable(),
	mode: z.enum(INGESTION_MODE),
	fileName: z.string().nullable(),
	status: z.enum(INGESTION_STATUS),
	totalRows: z.number().int().min(0),
	insertedRows: z.number().int().min(0),
	updatedRows: z.number().int().min(0),
	failedRows: z.number().int().min(0),
	message: z.string().nullable(),
	triggeredBy: z.string().nullable(),
	triggeredByEmail: z.string().nullable(),
	startedAt: z.iso.datetime().nullable(),
	finishedAt: z.iso.datetime().nullable(),
});
export type TIngestionRun = z.infer<typeof ingestionRunSchema>;

export const ingestionRunDetailSchema = ingestionRunSchema.extend({
	errors: z.array(ingestionRowErrorSchema).readonly(),
});
export type TIngestionRunDetail = z.infer<typeof ingestionRunDetailSchema>;

export const ingestionRunCreateInputSchema = z
	.object({
		mode: z.enum(INGESTION_MODE),
		sourceId: z.preprocess(blankAsUndefined, z.uuid().optional()),
		fileName: z.preprocess(
			blankAsUndefined,
			z.string().trim().min(1).max(255).optional(),
		),
		content: z.preprocess(
			blankAsUndefined,
			z.string().min(1).max(INGESTION_CSV_MAX_BYTES).optional(),
		),
	})
	.superRefine((input, context): void => {
		if (input.mode === INGESTION_MODE.SOURCE && input.sourceId === undefined) {
			context.addIssue({
				code: "custom",
				path: ["sourceId"],
				message: INGESTION_MESSAGE.SOURCE_REQUIRED,
			});
		}

		if (input.mode === INGESTION_MODE.UPLOAD) {
			if (input.fileName === undefined) {
				context.addIssue({
					code: "custom",
					path: ["fileName"],
					message: INGESTION_MESSAGE.FILE_REQUIRED,
				});
			}

			if (input.content === undefined) {
				context.addIssue({
					code: "custom",
					path: ["content"],
					message: INGESTION_MESSAGE.FILE_REQUIRED,
				});
			}
		}
	});
export type TIngestionRunCreateInput = z.infer<
	typeof ingestionRunCreateInputSchema
>;

export const INGESTION_SORT = {
	CREATED_AT: "createdAt",
	STATUS: "status",
} as const;

export type TIngestionSort =
	(typeof INGESTION_SORT)[keyof typeof INGESTION_SORT];

export const ingestionListInputSchema = paginationSchema.extend({
	status: z.enum(INGESTION_STATUS).optional(),
	sourceId: z.uuid().optional(),
	sortBy: z
		.enum([INGESTION_SORT.CREATED_AT, INGESTION_SORT.STATUS])
		.default(INGESTION_SORT.CREATED_AT),
	sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TIngestionListInput = z.infer<typeof ingestionListInputSchema>;

export const ingestionListSchema = paginated(ingestionRunSchema);
export type TIngestionList = z.infer<typeof ingestionListSchema>;

export const ingestionIdInputSchema = z.object({ id: z.uuid() });
export type TIngestionIdInput = z.infer<typeof ingestionIdInputSchema>;

export const ingestionStatsSchema = z.object({
	total: z.number().int().min(0),
	queued: z.number().int().min(0),
	running: z.number().int().min(0),
	succeeded: z.number().int().min(0),
	partial: z.number().int().min(0),
	failed: z.number().int().min(0),
	lastRunAt: z.iso.datetime().nullable(),
});
export type TIngestionStats = z.infer<typeof ingestionStatsSchema>;
