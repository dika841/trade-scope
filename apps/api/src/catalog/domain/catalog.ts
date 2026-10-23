import type { TCatalogProductInput, TCatalogSearchInput } from "@app/schemas";
import { Context, type Effect } from "effect";
import type { EDatabase } from "#/shared/errors.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TCatalogProductRow = {
	id: string;
	hsCode: string;
	hsRevision: string;
	description: string;
	parentHsCode: string | null;
	level: number;
};

export type TCatalogSearchRows = {
	items: readonly TCatalogProductRow[];
	hasMore: boolean;
};

export type TCatalogRepo = {
	search: (
		input: TCatalogSearchInput,
	) => Effect.Effect<TCatalogSearchRows, EDatabase>;
	findByCode: (
		input: TCatalogProductInput,
	) => Effect.Effect<TCatalogProductRow | null, EDatabase>;
	listAliases: (
		hsProductId: string,
	) => Effect.Effect<readonly string[], EDatabase>;
};

export type TCatalogRepoId = TServiceId<typeof REPO_TAG.CATALOG>;

export const CatalogRepo = Context.Service<TCatalogRepoId, TCatalogRepo>(
	REPO_TAG.CATALOG,
);
