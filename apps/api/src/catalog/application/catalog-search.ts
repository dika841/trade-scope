import type { TCatalogSearchInput, TCatalogSearchResult } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { Effect } from "effect";
import { toCatalogProductDto } from "#/catalog/application/to-catalog-product-dto.ts";
import { CatalogRepo, type TCatalogRepoId } from "#/catalog/domain/catalog.ts";
import type { EDatabase } from "#/shared/errors.ts";

export const catalogSearch = Effect.fn("catalogSearch")(function* (
	input: TCatalogSearchInput,
): Effect.fn.Return<TCatalogSearchResult, EDatabase, TCatalogRepoId> {
	const repo = yield* CatalogRepo;
	const result = yield* repo.search(input);

	return {
		items: A.map(result.items, toCatalogProductDto),
		ambiguous: result.items.length > 1 || result.hasMore,
		hasMore: result.hasMore,
		query: input.q,
	};
});
