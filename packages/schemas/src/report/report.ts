import { z } from "zod";
import { marketDemandSchema } from "../market/market.ts";
import { PILOT_STATUS } from "../pilot/pilot.ts";
import { baseSchema, type TEntityOf } from "../shared/base-schema.ts";
import { paginated, paginationSchema } from "../shared/pagination.ts";
import { SORT_DIRECTION, sortDirectionSchema } from "../shared/sort.ts";

export const REPORT_TITLE_MAX = 120;
export const REPORT_TITLE_MIN = 1;

const blankAsUndefined = (value: unknown): unknown =>
	value === "" ? undefined : value;

export const reportPilotSnapshotSchema = z.object({
	id: z.uuid(),
	marketIso2: z.string().length(2),
	marketName: z.string(),
	status: z.enum(PILOT_STATUS),
	updatedAt: z.iso.datetime(),
});
export type TReportPilotSnapshot = z.infer<typeof reportPilotSnapshotSchema>;

export const reportPayloadSchema = z.object({
	market: marketDemandSchema,
	pilots: z.array(reportPilotSnapshotSchema).readonly(),
});
export type TReportPayload = z.infer<typeof reportPayloadSchema>;

export const reportSummarySchema = baseSchema(z.uuid()).extend({
	title: z.string(),
	hsCode: z.string(),
	hsRevision: z.string(),
	productDescription: z.string(),
	periodYear: z.number().int().nullable(),
	shareToken: z.string(),
	revokedAt: z.iso.datetime().nullable(),
	createdBy: z.string().nullable(),
	createdByEmail: z.email().nullable(),
});
export type TReportSummary = TEntityOf<z.infer<typeof reportSummarySchema>>;

export const reportSchema = reportSummarySchema.extend({
	payload: reportPayloadSchema,
});
export type TReport = TEntityOf<z.infer<typeof reportSchema>>;

export const sharedReportSchema = z.object({
	title: z.string(),
	hsCode: z.string(),
	hsRevision: z.string(),
	productDescription: z.string(),
	createdAt: z.iso.datetime(),
	payload: reportPayloadSchema,
});
export type TSharedReport = z.infer<typeof sharedReportSchema>;

export const REPORT_SORT = {
	TITLE: "title",
	CREATED_AT: "createdAt",
} as const;

export type TReportSort = (typeof REPORT_SORT)[keyof typeof REPORT_SORT];

export const reportListInputSchema = paginationSchema.extend({
	sortBy: z
		.enum([REPORT_SORT.TITLE, REPORT_SORT.CREATED_AT])
		.default(REPORT_SORT.CREATED_AT),
	sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TReportListInput = z.infer<typeof reportListInputSchema>;

export const reportListSchema = paginated(reportSummarySchema);
export type TReportList = z.infer<typeof reportListSchema>;

export const reportIdInputSchema = z.object({ id: z.uuid() });
export type TReportIdInput = z.infer<typeof reportIdInputSchema>;

export const reportShareInputSchema = z.object({
	token: z.string().min(16).max(128),
});
export type TReportShareInput = z.infer<typeof reportShareInputSchema>;

export const reportCreateInputSchema = z.object({
	hsCode: z
		.string()
		.trim()
		.min(2)
		.max(12)
		.regex(/^[0-9.]+$/, "Use digits or dots for an HS code."),
	hsRevision: z.string().trim().min(1).max(20),
	title: z.preprocess(
		blankAsUndefined,
		z.string().trim().min(REPORT_TITLE_MIN).max(REPORT_TITLE_MAX).optional(),
	),
});
export type TReportCreateInput = z.infer<typeof reportCreateInputSchema>;
