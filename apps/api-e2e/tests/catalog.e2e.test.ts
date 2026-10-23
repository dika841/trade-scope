import type { TCatalogProductDetail, TCatalogSearchResult } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { apiFetch, apiJson } from "../support/api-fetch.ts";

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;

describe("catalog public endpoints", () => {
	it("finds products by an Indonesian alias without a session", async (): Promise<void> => {
		const result = await apiJson<TCatalogSearchResult>({
			path: "/products?q=kopi&limit=10",
		});

		expect(result.query).toBe("kopi");
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.ambiguous).toBe(true);
		expect(
			A.some(result.items, (item) => item.description.includes("Coffee")),
		).toBe(true);
	});

	it("finds a product by an HS code prefix", async (): Promise<void> => {
		const result = await apiJson<TCatalogSearchResult>({
			path: "/products?q=0901&limit=10",
		});

		expect(A.some(result.items, (item) => item.hsCode.startsWith("0901"))).toBe(
			true,
		);
	});

	it("returns the product detail with its aliases", async (): Promise<void> => {
		const product = await apiJson<TCatalogProductDetail>({
			path: "/products/090121?revision=HS2022",
		});

		expect(product.hsCode).toBe("090121");
		expect(product.hsRevision).toBe("HS2022");
		expect(product.aliases).toEqual(expect.arrayContaining(["kopi sangrai"]));
	});

	it("rejects a query shorter than two characters", async (): Promise<void> => {
		const response = await apiFetch({ path: "/products?q=a" });

		expect(response.status).toBe(HTTP_BAD_REQUEST);
	});

	it("returns 404 for a product that is not in the catalog", async (): Promise<void> => {
		const response = await apiFetch({
			path: "/products/999999?revision=HS2022",
		});

		expect(response.status).toBe(HTTP_NOT_FOUND);
	});
});
