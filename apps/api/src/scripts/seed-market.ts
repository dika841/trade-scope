import { sql } from "drizzle-orm";
import { Effect } from "effect";
import { DbService, type TDbServiceId } from "#/platform/db/db-service.ts";
import { tradeFlow } from "#/platform/db/tables/market.ts";

export type TMarketSeedResult = {
	rows: number;
};

const HS_REVISION = "HS2022";
const PERIODS = [2022, 2023] as const;
const SOURCE = "Demo trade dataset";
const SOURCE_URL = "https://example.com/trade/demo.csv";
const RETRIEVED_AT = new Date("2024-01-15T00:00:00Z");

type TMarketValues = Readonly<Record<string, readonly [number, number]>>;

const PRODUCTS: readonly { hsCode: string; markets: TMarketValues }[] = [
	{
		hsCode: "090121",
		markets: {
			US: [1_200_000, 1_500_000],
			JP: [800_000, 760_000],
			SG: [450_000, 620_000],
			NL: [300_000, 330_000],
			DE: [250_000, 210_000],
		},
	},
	{
		hsCode: "090111",
		markets: {
			US: [900_000, 980_000],
			JP: [600_000, 550_000],
			SG: [380_000, 410_000],
			NL: [210_000, 260_000],
			DE: [180_000, 150_000],
		},
	},
	{
		hsCode: "610910",
		markets: {
			US: [4_500_000, 5_200_000],
			DE: [2_100_000, 1_900_000],
			NL: [900_000, 1_100_000],
			JP: [700_000, 650_000],
			SG: [300_000, 360_000],
		},
	},
	{
		hsCode: "851713",
		markets: {
			US: [8_000_000, 7_600_000],
			JP: [3_200_000, 3_500_000],
			SG: [1_500_000, 1_800_000],
			NL: [800_000, 950_000],
			DE: [700_000, 620_000],
		},
	},
	{
		hsCode: "151110",
		markets: {
			NL: [2_200_000, 2_400_000],
			DE: [1_500_000, 1_450_000],
			SG: [900_000, 1_050_000],
			JP: [600_000, 580_000],
			US: [500_000, 650_000],
		},
	},
	{
		hsCode: "847130",
		markets: {
			US: [3_000_000, 3_300_000],
			JP: [1_800_000, 1_700_000],
			SG: [900_000, 1_200_000],
			DE: [700_000, 650_000],
			NL: [400_000, 450_000],
		},
	},
];

export const marketSeed = Effect.fn("marketSeed")(
	function* (): Effect.fn.Return<TMarketSeedResult, never, TDbServiceId> {
		const { db } = yield* DbService;

		return yield* Effect.promise(async (): Promise<TMarketSeedResult> => {
			let rows = 0;

			for (const product of PRODUCTS) {
				for (const [importerIso2, values] of Object.entries(product.markets)) {
					for (let index = 0; index < PERIODS.length; index += 1) {
						const periodYear = PERIODS[index];
						const value = values[index];

						if (periodYear === undefined || value === undefined) {
							continue;
						}

						await db
							.insert(tradeFlow)
							.values({
								hsCode: product.hsCode,
								hsRevision: HS_REVISION,
								importerIso2,
								periodYear,
								tradeValueUsd: value.toFixed(2),
								source: SOURCE,
								sourceUrl: SOURCE_URL,
								retrievedAt: RETRIEVED_AT,
							})
							.onConflictDoUpdate({
								target: [
									tradeFlow.hsCode,
									tradeFlow.hsRevision,
									tradeFlow.importerIso2,
									tradeFlow.periodYear,
								],
								set: {
									tradeValueUsd: sql`excluded.trade_value_usd`,
									source: sql`excluded.source`,
									sourceUrl: sql`excluded.source_url`,
									retrievedAt: sql`excluded.retrieved_at`,
									updatedAt: sql`now()`,
								},
							});

						rows += 1;
					}
				}
			}

			return { rows };
		});
	},
);
