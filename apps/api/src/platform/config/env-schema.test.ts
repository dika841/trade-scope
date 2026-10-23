import { readFileSync } from "node:fs";
import { A, D } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { envSchema } from "#/platform/config/env-schema.ts";

const EXAMPLE_PATH = new URL("../../../.env.example", import.meta.url).pathname;

const exampleKeys = (): readonly string[] =>
	A.filterMap(readFileSync(EXAMPLE_PATH, "utf8").split("\n"), (line) => {
		const trimmed = line.trim();
		return trimmed === "" || trimmed.startsWith("#")
			? undefined
			: (trimmed.split("=")[0] ?? undefined);
	});

const schemaKeys = (): readonly string[] => D.keys(envSchema.shape);

const isRequired = (key: string): boolean =>
	!envSchema.shape[key as keyof typeof envSchema.shape].safeParse(undefined)
		.success;

describe("env example", () => {
	it("documents every variable the schema requires", () => {
		const documented = exampleKeys();
		const missing = A.reject(A.filter(schemaKeys(), isRequired), (key) =>
			A.includes(documented, key),
		);

		expect(missing).toEqual([]);
	});

	it("documents no variable the schema does not define", () => {
		const defined = schemaKeys();
		const stale = A.reject(exampleKeys(), (key) => A.includes(defined, key));

		expect(stale).toEqual([]);
	});

	it("documents every optional variable too, so the file is the full surface", () => {
		const documented = exampleKeys();
		const undocumented = A.reject(schemaKeys(), (key) =>
			A.includes(documented, key),
		);

		expect(undocumented).toEqual([]);
	});
});
