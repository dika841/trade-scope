import { CATALOG_MESSAGE } from "@app/messages";
import type { TMarketDemand, TMarketInput } from "@app/schemas";
import { Effect } from "effect";
import { MarketRepo, type TMarketRepoId } from "#/market/domain/market.ts";
import { type EDatabase, ENotFound } from "#/shared/errors.ts";

const round1 = (value: number): number => Math.round(value * 10) / 10;

export const marketGet = Effect.fn("marketGet")(function* (
	input: TMarketInput,
): Effect.fn.Return<TMarketDemand, ENotFound | EDatabase, TMarketRepoId> {
	const repo = yield* MarketRepo;
	const row = yield* repo.demand(input);

	if (row.product === null) {
		return yield* new ENotFound({ message: CATALOG_MESSAGE.NOT_FOUND_TITLE });
	}

	return {
		hsCode: row.product.hsCode,
		hsRevision: row.product.hsRevision,
		periodYear: row.periodYear,
		previousPeriodYear: row.periodYear === null ? null : row.periodYear - 1,
		availablePeriods: row.availablePeriods,
		lastImportedAt:
			row.lastImportedAt === null ? null : row.lastImportedAt.toISOString(),
		totalValueUsd: row.totalValueUsd,
		items: row.items.map((item) => ({
			importerIso2: item.importerIso2,
			importerName: item.importerName,
			valueUsd: item.valueUsd,
			previousValueUsd: item.previousValueUsd,
			growthPercent:
				item.previousValueUsd === null || item.previousValueUsd <= 0
					? null
					: round1(
							((item.valueUsd - item.previousValueUsd) /
								item.previousValueUsd) *
								100,
						),
			sharePercent:
				row.totalValueUsd <= 0
					? 0
					: round1((item.valueUsd / row.totalValueUsd) * 100),
		})),
		provenance: row.provenance.map((entry) => ({
			source: entry.source,
			sourceUrl: entry.sourceUrl,
			retrievedAt: entry.retrievedAt.toISOString(),
		})),
	};
});
