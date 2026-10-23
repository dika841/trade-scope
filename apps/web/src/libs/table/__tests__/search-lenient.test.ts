import { USER_SORT, userListInputSchema, SORT_DIRECTION } from "@app/schemas";
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { searchLenient } from "#/libs/table/search-lenient.ts";

type TRawUserSearch = Parameters<
	ReturnType<typeof searchLenient<typeof userListInputSchema>>
>[0];

const validate = searchLenient(userListInputSchema);

const fromUrl = (value: Record<string, unknown>): TRawUserSearch =>
	value as TRawUserSearch;

const expectedType = (value: z.output<typeof userListInputSchema>): unknown =>
	value;

describe("searchLenient", () => {
	it("keeps every valid value", (): void => {
		expect(
			validate(fromUrl({ page: 2, sortBy: USER_SORT.NAME, search: "hello" })),
		).toMatchObject({ page: 2, sortBy: USER_SORT.NAME, search: "hello" });
	});

	it("falls back to the default for a value the schema rejects", (): void => {
		expect(validate(fromUrl({ page: 0, sortBy: "nonsense" }))).toMatchObject({
			page: 1,
			sortBy: USER_SORT.CREATED_AT,
			sortDir: SORT_DIRECTION.ASC,
		});
	});

	it("drops only the bad value and keeps the rest", (): void => {
		expect(validate(fromUrl({ page: -3, search: "kept" }))).toMatchObject({
			page: 1,
			search: "kept",
		});
	});

	it("ignores a key the schema does not know", (): void => {
		expect(validate(fromUrl({ unknown: "value" }))).not.toHaveProperty(
			"unknown",
		);
	});

	it("returns the schema's own output type", (): void => {
		expect(expectedType(validate(fromUrl({})))).toMatchObject({ page: 1 });
	});
});
