import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { containsWhere, likeEscape } from "#/platform/db/search.ts";
import { user } from "#/platform/db/tables/auth.ts";

const dialect = new PgDialect();

describe("likeEscape", () => {
	it("leaves ordinary text alone", () => {
		expect(likeEscape("hello world")).toBe("hello world");
	});

	it("escapes the wildcard and escape characters", () => {
		expect(likeEscape("50%_off\\")).toBe("50\\%\\_off\\\\");
	});
});

describe("containsWhere", () => {
	it("binds the escaped text as a parameter inside a contains pattern", () => {
		const query = dialect.sqlToQuery(containsWhere(user.name, "50%"));

		expect(query.sql).toContain("ilike");
		expect(query.params).toEqual(["%50\\%%"]);
	});
});
