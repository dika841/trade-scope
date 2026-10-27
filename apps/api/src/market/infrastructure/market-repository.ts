import { and, desc, eq, max, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import {
	MarketRepo,
	type TMarketDemandRow,
	type TMarketRepo,
} from "#/market/domain/market.ts";
import { DbService, dbServiceLayer } from "#/platform/db/db-service.ts";
import { dbActive } from "#/platform/db/transaction.ts";
import { country, hsProduct } from "#/platform/db/tables/catalog.ts";
import { tradeFlow } from "#/platform/db/tables/market.ts";
import { EDatabase } from "#/shared/errors.ts";

const digitsOf = (value: string): string => value.replace(/[^0-9]/g, "");

const empty = (
	product: { hsCode: string; hsRevision: string } | null,
): TMarketDemandRow => ({
	product,
	periodYear: null,
	availablePeriods: [],
	lastImportedAt: null,
	totalValueUsd: 0,
	items: [],
	provenance: [],
});

export const marketRepoLayer = Layer.effect(
	MarketRepo,
	Effect.gen(function* () {
		const { db } = yield* DbService;

		const demand: TMarketRepo["demand"] = (input) =>
			Effect.tryPromise({
				try: async (): Promise<TMarketDemandRow> => {
					const connection = dbActive(db);
					const hsCode = digitsOf(input.hsCode);

					const [product] = await connection
						.select({
							hsCode: hsProduct.hsCode,
							hsRevision: hsProduct.hsRevision,
						})
						.from(hsProduct)
						.where(
							and(
								eq(hsProduct.hsCode, hsCode),
								eq(hsProduct.hsRevision, input.revision),
							),
						)
						.limit(1);

					if (product === undefined) {
						return empty(null);
					}

					const periodRows = await connection
						.selectDistinct({ periodYear: tradeFlow.periodYear })
						.from(tradeFlow)
						.where(
							and(
								eq(tradeFlow.hsCode, hsCode),
								eq(tradeFlow.hsRevision, input.revision),
							),
						)
						.orderBy(desc(tradeFlow.periodYear));

					const availablePeriods = periodRows.map((row) => row.periodYear);
					const [lastRow] = await connection
						.select({ value: max(tradeFlow.updatedAt) })
						.from(tradeFlow)
						.where(
							and(
								eq(tradeFlow.hsCode, hsCode),
								eq(tradeFlow.hsRevision, input.revision),
							),
						);
					const lastImportedAt =
						(lastRow?.value as Date | null | undefined) ?? null;
					const periodYear = input.periodYear ?? availablePeriods[0] ?? null;

					if (periodYear === null) {
						return {
							...empty(product),
							availablePeriods,
							lastImportedAt,
						};
					}

					const currentRows = await connection
						.select({
							importerIso2: tradeFlow.importerIso2,
							importerName: country.name,
							valueUsd: sql<string>`sum(${tradeFlow.tradeValueUsd})`,
						})
						.from(tradeFlow)
						.leftJoin(country, eq(country.iso2, tradeFlow.importerIso2))
						.where(
							and(
								eq(tradeFlow.hsCode, hsCode),
								eq(tradeFlow.hsRevision, input.revision),
								eq(tradeFlow.periodYear, periodYear),
							),
						)
						.groupBy(tradeFlow.importerIso2, country.name);

					const current = currentRows
						.map((row) => ({
							importerIso2: row.importerIso2,
							importerName: row.importerName ?? row.importerIso2,
							valueUsd: Number(row.valueUsd),
						}))
						.sort(
							(left, right) =>
								right.valueUsd - left.valueUsd ||
								left.importerIso2.localeCompare(right.importerIso2),
						);

					const totalValueUsd = current.reduce(
						(sum, row) => sum + row.valueUsd,
						0,
					);

					const previousRows = await connection
						.select({
							importerIso2: tradeFlow.importerIso2,
							valueUsd: sql<string>`sum(${tradeFlow.tradeValueUsd})`,
						})
						.from(tradeFlow)
						.where(
							and(
								eq(tradeFlow.hsCode, hsCode),
								eq(tradeFlow.hsRevision, input.revision),
								eq(tradeFlow.periodYear, periodYear - 1),
							),
						)
						.groupBy(tradeFlow.importerIso2);

					const previous = new Map(
						previousRows.map((row) => [row.importerIso2, Number(row.valueUsd)]),
					);

					const provenanceRows = await connection
						.select({
							source: tradeFlow.source,
							sourceUrl: tradeFlow.sourceUrl,
							retrievedAt: max(tradeFlow.retrievedAt),
						})
						.from(tradeFlow)
						.where(
							and(
								eq(tradeFlow.hsCode, hsCode),
								eq(tradeFlow.hsRevision, input.revision),
								eq(tradeFlow.periodYear, periodYear),
							),
						)
						.groupBy(tradeFlow.source, tradeFlow.sourceUrl)
						.orderBy(tradeFlow.source);

					return {
						product,
						periodYear,
						availablePeriods,
						lastImportedAt,
						totalValueUsd,
						items: current.slice(0, input.limit).map((row) => ({
							...row,
							previousValueUsd: previous.get(row.importerIso2) ?? null,
						})),
						provenance: provenanceRows.flatMap((row) =>
							row.retrievedAt === null
								? []
								: [
										{
											source: row.source,
											sourceUrl: row.sourceUrl,
											retrievedAt: row.retrievedAt,
										},
									],
						),
					};
				},
				catch: (cause) => new EDatabase({ cause }),
			});

		return MarketRepo.of({ demand });
	}),
).pipe(Layer.provide(dbServiceLayer));
