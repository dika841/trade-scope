import { CATALOG_MESSAGE } from "@app/messages";
import type { TCatalogProductDetail, TCatalogProductInput } from "@app/schemas";
import { Effect } from "effect";
import { toCatalogProductDto } from "#/catalog/application/to-catalog-product-dto.ts";
import { CatalogRepo, type TCatalogRepoId } from "#/catalog/domain/catalog.ts";
import { ENotFound, type EDatabase } from "#/shared/errors.ts";

export const catalogGet = Effect.fn("catalogGet")(function* (
	input: TCatalogProductInput,
): Effect.fn.Return<
	TCatalogProductDetail,
	ENotFound | EDatabase,
	TCatalogRepoId
> {
	const repo = yield* CatalogRepo;
	const row = yield* repo.findByCode(input);

	if (row === null) {
		return yield* new ENotFound({ message: CATALOG_MESSAGE.NOT_FOUND_TITLE });
	}

	const aliases = yield* repo.listAliases(row.id);

	return { ...toCatalogProductDto(row), aliases };
});
