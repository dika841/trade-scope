import { INGESTION_MESSAGE } from "@app/messages";
import { describe, expect, it } from "vitest";
import { ingestionTradeCsvParse } from "./ingestion-trade-csv.ts";

const HEADER =
	"hs_code,hs_revision,importer_iso2,year,trade_value_usd,source\n";

describe("ingestionTradeCsvParse", () => {
	it("parses a valid trade row and normalizes the market code", (): void => {
		const parsed = ingestionTradeCsvParse(
			`${HEADER}090121,HS2022,us,2023,1500000.50,Demo trade dataset\n`,
		);

		expect(parsed.totalRows).toBe(1);
		expect(parsed.failures).toEqual([]);
		expect(parsed.trades[0]).toEqual({
			hsCode: "090121",
			hsRevision: "HS2022",
			importerIso2: "US",
			periodYear: 2023,
			tradeValueUsd: 1_500_000.5,
			quantityKg: null,
			source: "Demo trade dataset",
			sourceUrl: null,
			retrievedAt: null,
		});
	});

	it("accepts optional quantity, URL and retrieval time", (): void => {
		const parsed = ingestionTradeCsvParse(
			`hs_code,hs_revision,importer_iso2,year,trade_value_usd,quantity_kg,source,source_url,retrieved_at\n090121,HS2022,JP,2023,760000,1200,Demo,https://example.com/trade.csv,2024-01-15\n`,
		);

		expect(parsed.failures).toEqual([]);
		expect(parsed.trades[0]).toMatchObject({
			quantityKg: 1200,
			sourceUrl: "https://example.com/trade.csv",
			retrievedAt: "2024-01-15T00:00:00.000Z",
		});
	});

	it("rejects invalid rows and duplicates while still reading every row", (): void => {
		const parsed = ingestionTradeCsvParse(
			`${HEADER}090121,HS2022,USA,2023,1000,Demo\n090121,HS2022,US,1800,1000,Demo\n090121,HS2022,US,2023,-1,Demo\n090121,HS2022,US,2023,1000,Demo\n090121,HS2022,US,2023,1000,Demo\n`,
		);

		expect(parsed.totalRows).toBe(5);
		expect(parsed.trades).toHaveLength(1);
		expect(parsed.failures.map((failure) => failure.row)).toEqual([2, 3, 4, 6]);
		expect(parsed.failures[3]?.message).toBe(
			INGESTION_MESSAGE.DUPLICATE_TRADE_ROW,
		);
	});

	it("rejects an unsupported header", (): void => {
		expect(() => ingestionTradeCsvParse("hs_code,year\n090121,2023")).toThrow(
			INGESTION_MESSAGE.INVALID_TRADE_HEADER,
		);
	});
});
