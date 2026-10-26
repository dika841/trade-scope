import type { TMarketDemand, TMarketInput } from "@app/schemas";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { marketGet } from "#/market/application/market-get.ts";
import { MarketRepo, type TMarketDemandRow } from "#/market/domain/market.ts";
import { ENotFound } from "#/shared/errors.ts";

const INPUT: TMarketInput = {
	hsCode: "090121",
	revision: "HS2022",
	limit: 10,
};

const repoLayer = (
	row: TMarketDemandRow,
): Layer.Layer<typeof MarketRepo.Identifier> =>
	Layer.succeed(
		MarketRepo,
		MarketRepo.of({ demand: () => Effect.succeed(row) }),
	);

const run = (row: TMarketDemandRow): Promise<TMarketDemand> =>
	Effect.runPromise(marketGet(INPUT).pipe(Effect.provide(repoLayer(row))));

const ROW: TMarketDemandRow = {
	product: { hsCode: "090121", hsRevision: "HS2022" },
	periodYear: 2023,
	totalValueUsd: 2_000,
	items: [
		{
			importerIso2: "US",
			importerName: "United States",
			valueUsd: 1_500,
			previousValueUsd: 1_200,
		},
		{
			importerIso2: "JP",
			importerName: "Japan",
			valueUsd: 500,
			previousValueUsd: null,
		},
	],
	provenance: [
		{
			source: "Demo trade dataset",
			sourceUrl: "https://example.com/trade.csv",
			retrievedAt: new Date("2024-01-15T00:00:00Z"),
		},
	],
};

describe("marketGet", () => {
	it("ranks markets and derives growth and share", async (): Promise<void> => {
		const result = await run(ROW);

		expect(result.periodYear).toBe(2023);
		expect(result.previousPeriodYear).toBe(2022);
		expect(result.totalValueUsd).toBe(2_000);
		expect(result.items[0]).toEqual({
			importerIso2: "US",
			importerName: "United States",
			valueUsd: 1_500,
			previousValueUsd: 1_200,
			growthPercent: 25,
			sharePercent: 75,
		});
		expect(result.items[1]?.growthPercent).toBeNull();
		expect(result.items[1]?.sharePercent).toBe(25);
		expect(result.provenance[0]?.retrievedAt).toBe("2024-01-15T00:00:00.000Z");
	});

	it("returns an empty period when no trade data exists", async (): Promise<void> => {
		const result = await run({
			product: { hsCode: "090121", hsRevision: "HS2022" },
			periodYear: null,
			totalValueUsd: 0,
			items: [],
			provenance: [],
		});

		expect(result.periodYear).toBeNull();
		expect(result.previousPeriodYear).toBeNull();
		expect(result.items).toEqual([]);
	});

	it("fails when the product is not in the catalog", async (): Promise<void> => {
		const error = await Effect.runPromise(
			marketGet(INPUT).pipe(
				Effect.provide(
					repoLayer({
						product: null,
						periodYear: null,
						totalValueUsd: 0,
						items: [],
						provenance: [],
					}),
				),
				Effect.flip,
			),
		);

		expect(error).toBeInstanceOf(ENotFound);
	});
});
