import type { TCatalogProduct } from "@app/schemas";
import type { TCatalogProductRow } from "#/catalog/domain/catalog.ts";

export const toCatalogProductDto = (
	row: TCatalogProductRow,
): TCatalogProduct => ({
	id: row.id,
	hsCode: row.hsCode,
	hsRevision: row.hsRevision,
	description: row.description,
	parentHsCode: row.parentHsCode,
	level: row.level,
});
