import { z } from "zod";
import { catalogProductInputSchema } from "../catalog/catalog.ts";

export const MARKET_DEFAULT_LIMIT = 10;
export const MARKET_MAX_LIMIT = 50;

export const marketInputSchema = catalogProductInputSchema.extend({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MARKET_MAX_LIMIT)
		.default(MARKET_DEFAULT_LIMIT),
});
export type TMarketInput = z.infer<typeof marketInputSchema>;

export const marketItemSchema = z.object({
	importerIso2: z.string().length(2),
	importerName: z.string(),
	valueUsd: z.number().nonnegative(),
	previousValueUsd: z.number().nonnegative().nullable(),
	growthPercent: z.number().nullable(),
	sharePercent: z.number().nonnegative(),
});
export type TMarketItem = z.infer<typeof marketItemSchema>;

export const marketProvenanceSchema = z.object({
	source: z.string(),
	sourceUrl: z.string().nullable(),
	retrievedAt: z.iso.datetime(),
});
export type TMarketProvenance = z.infer<typeof marketProvenanceSchema>;

export const marketDemandSchema = z.object({
	hsCode: z.string(),
	hsRevision: z.string(),
	periodYear: z.number().int().nullable(),
	previousPeriodYear: z.number().int().nullable(),
	totalValueUsd: z.number().nonnegative(),
	items: z.array(marketItemSchema).readonly(),
	provenance: z.array(marketProvenanceSchema).readonly(),
});
export type TMarketDemand = z.infer<typeof marketDemandSchema>;
