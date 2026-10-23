import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { importsOf, violationsFor } from "./architecture-check.ts";

const rulesOf = (file: string, source: string): readonly string[] =>
	A.map(violationsFor(file, source), (violation) => violation.rule);

describe("importsOf", () => {
	it("finds a static import", () => {
		expect(
			importsOf('import { a } from "#/user/domain/user.ts";'),
		).toMatchObject([{ line: 1, target: "user/domain/user.ts" }]);
	});

	it("finds a dynamic import, which a static-only scan would miss", () => {
		expect(importsOf('await import("#/user/domain/user.ts");')).toMatchObject([
			{ target: "user/domain/user.ts" },
		]);
	});

	it("finds a single-quoted specifier", () => {
		expect(
			importsOf("import { a } from '#/user/domain/user.ts';"),
		).toMatchObject([{ target: "user/domain/user.ts" }]);
	});

	it("finds a re-export", () => {
		expect(
			importsOf('export { a } from "#/user/domain/user.ts";'),
		).toMatchObject([{ target: "user/domain/user.ts" }]);
	});

	it("finds a side-effect import and a require", () => {
		expect(importsOf('import "#/user/domain/user.ts";')).toHaveLength(1);
		expect(importsOf('require("#/user/domain/user.ts")')).toHaveLength(1);
	});

	it("reports the line each import sits on", () => {
		expect(importsOf('\n\nimport { a } from "#/user/index.ts";')).toMatchObject(
			[{ line: 3 }],
		);
	});
});

describe("layer boundaries", () => {
	it("rejects domain importing application", () => {
		expect(
			rulesOf(
				"role/domain/role.ts",
				'import { a } from "#/role/application/to-role-dto.ts";',
			),
		).toEqual(["layer-boundary"]);
	});

	it("rejects application importing infrastructure", () => {
		expect(
			rulesOf(
				"role/application/role-list.ts",
				'import { a } from "#/role/infrastructure/role-repository.ts";',
			),
		).toEqual(["layer-boundary"]);
	});

	it("allows application importing domain", () => {
		expect(
			rulesOf(
				"role/application/role-list.ts",
				'import { a } from "#/role/domain/role.ts";',
			),
		).toEqual([]);
	});

	it("allows presentation importing application", () => {
		expect(
			rulesOf(
				"role/presentation/role-router.ts",
				'import { a } from "#/role/application/role-list.ts";',
			),
		).toEqual([]);
	});
});

describe("module isolation", () => {
	it("rejects reaching into another module's internals", () => {
		expect(
			rulesOf(
				"role/application/role-list.ts",
				'import { a } from "#/user/domain/user.ts";',
			),
		).toEqual(["module-isolation"]);
	});

	it("rejects an unlisted edge even through the surface", () => {
		expect(
			rulesOf(
				"role/application/role-list.ts",
				'import { a } from "#/user/index.ts";',
			),
		).toEqual(["module-isolation"]);
	});

	it("allows a listed edge through the surface", () => {
		expect(
			rulesOf(
				"user/application/user-create.ts",
				'import { a } from "#/role/index.ts";',
			),
		).toEqual([]);
	});

	it("allows a module importing shared and platform", () => {
		expect(
			rulesOf(
				"role/application/role-list.ts",
				'import { a } from "#/shared/errors.ts";\nimport { b } from "#/platform/db/client.ts";',
			),
		).toEqual([]);
	});
});

describe("area boundaries", () => {
	it("rejects shared depending on anything but shared", () => {
		expect(
			rulesOf(
				"shared/errors.ts",
				'import { a } from "#/platform/db/client.ts";',
			),
		).toEqual(["area-boundary"]);
	});

	it("rejects platform reaching into a module", () => {
		expect(
			rulesOf("platform/db/client.ts", 'import { a } from "#/role/index.ts";'),
		).toEqual(["area-boundary"]);
	});

	it("allows the composition root to reach into modules", () => {
		expect(
			rulesOf("bootstrap/compose.ts", 'import { a } from "#/role/index.ts";'),
		).toEqual([]);
	});

	it("rejects a bootstrap file outside the composition root reaching into a module", () => {
		expect(
			rulesOf("bootstrap/tracing.ts", 'import { a } from "#/role/index.ts";'),
		).toEqual(["area-boundary"]);
	});
});

describe("fail-closed behaviour", () => {
	it("allows index.ts to sit at the module root as its surface", () => {
		expect(
			rulesOf("role/index.ts", 'export { a } from "#/role/domain/role.ts";'),
		).toEqual([]);
	});

	it("rejects a helper dropped at the module root, which would bypass the layer rules", () => {
		expect(
			rulesOf(
				"role/helpers.ts",
				'import { a } from "#/role/infrastructure/role-repository.ts";',
			),
		).toContain("module-layer");
	});

	it("rejects a directory inside a module that is not a layer", () => {
		expect(
			rulesOf(
				"role/helpers/format.ts",
				'import { a } from "#/role/domain/role.ts";',
			),
		).toContain("module-layer");
	});

	it("leaves a file inside a real layer alone", () => {
		expect(
			rulesOf(
				"role/application/role-create.ts",
				'import { a } from "#/role/domain/role.ts";',
			),
		).toEqual([]);
	});

	it("rejects a top-level directory that is neither a module nor an area", () => {
		expect(rulesOf("billing/domain/plan.ts", "")).toEqual([
			"unclassified-path",
		]);
	});

	it("rejects a relative path that escapes the file's own directory", () => {
		expect(
			rulesOf(
				"role/domain/role.ts",
				'import { a } from "../../user/domain/user.ts";',
			),
		).toEqual(["relative-escape"]);
	});
});
