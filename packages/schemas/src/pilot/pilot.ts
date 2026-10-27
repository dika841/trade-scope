import { z } from "zod";
import { baseSchema, type TEntityOf } from "../shared/base-schema.ts";
import { paginated, paginationSchema } from "../shared/pagination.ts";
import { SORT_DIRECTION, sortDirectionSchema } from "../shared/sort.ts";

export const PILOT_STATUS = {
	NEW: "new",
	IN_REVIEW: "in_review",
	APPROVED: "approved",
	REJECTED: "rejected",
	COMPLETED: "completed",
} as const;

export type TPilotStatus = (typeof PILOT_STATUS)[keyof typeof PILOT_STATUS];

export const PILOT_STATUS_TRANSITION: Readonly<
	Record<TPilotStatus, readonly TPilotStatus[]>
> = {
	[PILOT_STATUS.NEW]: [PILOT_STATUS.IN_REVIEW],
	[PILOT_STATUS.IN_REVIEW]: [PILOT_STATUS.APPROVED, PILOT_STATUS.REJECTED],
	[PILOT_STATUS.APPROVED]: [PILOT_STATUS.COMPLETED],
	[PILOT_STATUS.REJECTED]: [],
	[PILOT_STATUS.COMPLETED]: [],
};

export const PILOT_NOTES_MAX = 2000;
export const PILOT_MARKET_LENGTH = 2;
export const PILOT_HS_CODE_MIN = 2;
export const PILOT_HS_CODE_MAX = 12;

const blankAsUndefined = (value: unknown): unknown =>
	value === "" ? undefined : value;

export const pilotSchema = baseSchema(z.uuid()).extend({
	hsCode: z.string(),
	hsRevision: z.string(),
	productDescription: z.string(),
	marketIso2: z.string().length(PILOT_MARKET_LENGTH),
	marketName: z.string(),
	status: z.enum(PILOT_STATUS),
	version: z.number().int().min(0),
	ownerId: z.string().nullable(),
	ownerName: z.string().nullable(),
	ownerEmail: z.email().nullable(),
	notes: z.string().nullable(),
	createdBy: z.string().nullable(),
	createdByEmail: z.email().nullable(),
});
export type TPilot = TEntityOf<z.infer<typeof pilotSchema>>;

export const PILOT_SORT = {
	CREATED_AT: "createdAt",
	STATUS: "status",
} as const;

export type TPilotSort = (typeof PILOT_SORT)[keyof typeof PILOT_SORT];

export const pilotListInputSchema = paginationSchema.extend({
	status: z.enum(PILOT_STATUS).optional(),
	hsCode: z
		.string()
		.trim()
		.min(PILOT_HS_CODE_MIN)
		.max(PILOT_HS_CODE_MAX)
		.optional(),
	hsRevision: z.string().trim().min(1).max(20).optional(),
	marketIso2: z.string().trim().length(PILOT_MARKET_LENGTH).optional(),
	sortBy: z
		.enum([PILOT_SORT.CREATED_AT, PILOT_SORT.STATUS])
		.default(PILOT_SORT.CREATED_AT),
	sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TPilotListInput = z.infer<typeof pilotListInputSchema>;

export const pilotListSchema = paginated(pilotSchema);
export type TPilotList = z.infer<typeof pilotListSchema>;

export const pilotIdInputSchema = z.object({ id: z.uuid() });
export type TPilotIdInput = z.infer<typeof pilotIdInputSchema>;

export const pilotCreateInputSchema = z.object({
	hsCode: z
		.string()
		.trim()
		.min(PILOT_HS_CODE_MIN)
		.max(PILOT_HS_CODE_MAX)
		.regex(/^[0-9.]+$/, "Use digits or dots for an HS code."),
	hsRevision: z.string().trim().min(1).max(20),
	marketIso2: z
		.string()
		.trim()
		.length(PILOT_MARKET_LENGTH)
		.regex(/^[A-Za-z]{2}$/),
	ownerId: z.preprocess(blankAsUndefined, z.uuid().nullable().optional()),
	notes: z.preprocess(
		blankAsUndefined,
		z.string().trim().max(PILOT_NOTES_MAX).optional(),
	),
});
export type TPilotCreateInput = z.infer<typeof pilotCreateInputSchema>;

export const pilotUpdateInputSchema = z.object({
	id: z.uuid(),
	version: z.number().int().min(0),
	status: z.enum(PILOT_STATUS).optional(),
	ownerId: z.uuid().nullable().optional(),
	notes: z.string().trim().max(PILOT_NOTES_MAX).nullable().optional(),
});
export type TPilotUpdateInput = z.infer<typeof pilotUpdateInputSchema>;

export const pilotOwnerOptionSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.email(),
});
export type TPilotOwnerOption = z.infer<typeof pilotOwnerOptionSchema>;

export const pilotMarketOptionSchema = z.object({
	iso2: z.string().length(PILOT_MARKET_LENGTH),
	name: z.string(),
});
export type TPilotMarketOption = z.infer<typeof pilotMarketOptionSchema>;

export const pilotOptionsSchema = z.object({
	owners: z.array(pilotOwnerOptionSchema).readonly(),
	markets: z.array(pilotMarketOptionSchema).readonly(),
});
export type TPilotOptions = z.infer<typeof pilotOptionsSchema>;
