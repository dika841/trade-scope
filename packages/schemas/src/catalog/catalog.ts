import { VALIDATION_MESSAGE } from "@app/messages";
import { z } from "zod";

export const CATALOG_SEARCH_MIN_LENGTH = 2;
export const CATALOG_SEARCH_MAX_LENGTH = 80;
export const CATALOG_SEARCH_DEFAULT_LIMIT = 10;
export const CATALOG_SEARCH_MAX_LIMIT = 20;

const catalogQuerySchema = z
	.string()
	.trim()
	.min(CATALOG_SEARCH_MIN_LENGTH, VALIDATION_MESSAGE.CATALOG_QUERY_TOO_SHORT)
	.max(CATALOG_SEARCH_MAX_LENGTH, VALIDATION_MESSAGE.CATALOG_QUERY_TOO_LONG);

export const catalogSearchInputSchema = z.object({
	q: catalogQuerySchema,
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(CATALOG_SEARCH_MAX_LIMIT)
		.default(CATALOG_SEARCH_DEFAULT_LIMIT),
});
export type TCatalogSearchInput = z.infer<typeof catalogSearchInputSchema>;

export const catalogSearchParamsSchema = z.object({
	q: z.string().trim().max(CATALOG_SEARCH_MAX_LENGTH).optional(),
});
export type TCatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>;

export const catalogProductInputSchema = z.object({
	hsCode: z
		.string()
		.trim()
		.min(2)
		.max(12)
		.regex(/^[0-9.]+$/, "Use digits or dots for an HS code."),
	revision: z.string().trim().min(1).max(20),
});
export type TCatalogProductInput = z.infer<typeof catalogProductInputSchema>;

export const catalogProductSchema = z.object({
	id: z.uuid(),
	hsCode: z.string(),
	hsRevision: z.string(),
	description: z.string(),
	parentHsCode: z.string().nullable(),
	level: z.number().int(),
});
export type TCatalogProduct = z.infer<typeof catalogProductSchema>;

export const catalogProductDetailSchema = catalogProductSchema.extend({
	aliases: z.array(z.string()).readonly(),
});
export type TCatalogProductDetail = z.infer<typeof catalogProductDetailSchema>;

export const catalogProductSearchSchema = z.object({
	revision: z.string().trim().max(20).optional(),
});
export type TCatalogProductSearch = z.infer<typeof catalogProductSearchSchema>;

export const catalogSearchResultSchema = z.object({
	items: z.array(catalogProductSchema).readonly(),
	ambiguous: z.boolean(),
	hasMore: z.boolean(),
	query: z.string(),
});
export type TCatalogSearchResult = z.infer<typeof catalogSearchResultSchema>;
