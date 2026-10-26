import type { TMarketDemand } from "@app/schemas";
import { describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";

const HTTP_NOT_FOUND = 404;

describe("market demand endpoints", () => {
	it("ranks markets for a seeded product with provenance", async (): Promise<void> => {
		const result = await apiJson<TMarketDemand>({
			path: "/products/090121/markets?revision=HS2022&limit=5",
		});

		expect(result.hsCode).toBe("090121");
		expect(result.periodYear).toBe(2023);
		expect(result.previousPeriodYear).toBe(2022);
		expect(result.items[0]?.importerIso2).toBe("US");
		expect(result.items[0]?.importerName).toBe("United States");
		expect(result.items[0]?.valueUsd).toBe(1_500_000);
		expect(result.items[0]?.growthPercent).toBe(25);
		expect(result.provenance).toContainEqual(
			expect.objectContaining({ source: "Demo trade dataset" }),
		);
	});

	it("honors the result limit", async (): Promise<void> => {
		const result = await apiJson<TMarketDemand>({
			path: "/products/090121/markets?revision=HS2022&limit=2",
		});

		expect(result.items).toHaveLength(2);
	});

	it("returns 404 for a product that is not in the catalog", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/products/999999/markets?revision=HS2022",
		});

		expect(response.status).toBe(HTTP_NOT_FOUND);
	});
});
