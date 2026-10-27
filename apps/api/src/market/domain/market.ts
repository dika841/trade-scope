import type { TMarketInput } from "@app/schemas";
import { Context, type Effect } from "effect";
import type { EDatabase } from "#/shared/errors.ts";
import type { TServiceId } from "#/shared/service-id.ts";
import { REPO_TAG } from "#/shared/repo-tags.ts";

export type TMarketItemRow = {
	importerIso2: string;
	importerName: string;
	valueUsd: number;
	previousValueUsd: number | null;
};

export type TMarketProvenanceRow = {
	source: string;
	sourceUrl: string | null;
	retrievedAt: Date;
};

export type TMarketDemandRow = {
	product: { hsCode: string; hsRevision: string } | null;
	periodYear: number | null;
	availablePeriods: readonly number[];
	lastImportedAt: Date | null;
	totalValueUsd: number;
	items: readonly TMarketItemRow[];
	provenance: readonly TMarketProvenanceRow[];
};

export type TMarketRepo = {
	demand: (input: TMarketInput) => Effect.Effect<TMarketDemandRow, EDatabase>;
};

export type TMarketRepoId = TServiceId<typeof REPO_TAG.MARKET>;

export const MarketRepo = Context.Service<TMarketRepoId, TMarketRepo>(
	REPO_TAG.MARKET,
);
