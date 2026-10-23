import { A } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { violationsFor } from "./migration-check.ts";
import {
	MIGRATION_SAFETY_MARKER,
	PRE_POLICY_MIGRATIONS,
	UNSAFE_STATEMENT,
} from "./migration-rules.ts";

const FILE = "0099_example.sql";
const RENAME = 'ALTER TABLE "item" RENAME COLUMN "body" TO "content";';
const ADD =
	'ALTER TABLE "item" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;';

describe("violationsFor", () => {
	it("passes an additive migration, including one that adds a NOT NULL column", () => {
		expect(violationsFor(FILE, ADD)).toHaveLength(0);
	});

	it("passes CREATE TABLE and CREATE INDEX", () => {
		const sql =
			'CREATE TABLE "thing" ("id" uuid);\nCREATE INDEX "i" ON "thing" ("id");';

		expect(violationsFor(FILE, sql)).toHaveLength(0);
	});

	it("rejects a column rename and explains the release it would break", () => {
		const [violation] = violationsFor(FILE, RENAME);

		expect(violation?.statement).toBe(UNSAFE_STATEMENT.RENAME_COLUMN);
		expect(violation?.line).toBe(1);
		expect(violation?.remedy).toContain("running replica");
	});

	it("rejects dropping a column and dropping a table", () => {
		const sql = 'ALTER TABLE "item" DROP COLUMN "body";\nDROP TABLE "old";';
		const found = violationsFor(FILE, sql);

		expect(A.map(found, (v) => v.statement)).toStrictEqual([
			UNSAFE_STATEMENT.DROP_COLUMN,
			UNSAFE_STATEMENT.DROP_TABLE,
		]);
	});

	it("rejects tightening an existing column to NOT NULL", () => {
		const sql = 'ALTER TABLE "item" ALTER COLUMN "body" SET NOT NULL;';

		expect(violationsFor(FILE, sql)).toHaveLength(1);
	});

	it("catches a statement split across lines", () => {
		const sql = 'ALTER TABLE "item" DROP\n  COLUMN "body";';
		const [violation] = violationsFor(FILE, sql);

		expect(violation?.statement).toBe(UNSAFE_STATEMENT.DROP_COLUMN);
		expect(violation?.line).toBe(1);
	});

	it("catches a statement padded with extra whitespace", () => {
		const sql = 'ALTER TABLE "item" DROP    COLUMN "body";';

		expect(violationsFor(FILE, sql)).toHaveLength(1);
	});

	it("catches a statement interrupted by a comment", () => {
		const sql = 'ALTER TABLE "item" DROP -- why\nCOLUMN "body";';

		expect(violationsFor(FILE, sql)).toHaveLength(1);
	});

	it("reports the line the statement starts on, not the line it ends on", () => {
		const sql = 'SELECT 1;\nALTER TABLE "item"\n  RENAME\n  COLUMN "a" TO "b";';
		const [violation] = violationsFor(FILE, sql);

		expect(violation?.statement).toBe(UNSAFE_STATEMENT.RENAME_COLUMN);
		expect(violation?.line).toBe(3);
	});

	it("catches a statement interrupted by a block comment", () => {
		const sql = 'ALTER TABLE "item" DROP /* deliberate */ COLUMN "body";';

		expect(violationsFor(FILE, sql)).toHaveLength(1);
	});

	it("catches a statement interrupted by a block comment spanning lines", () => {
		const sql =
			'ALTER TABLE "item" DROP /* spans\n  two lines */ COLUMN "body";';
		const [violation] = violationsFor(FILE, sql);

		expect(violation?.statement).toBe(UNSAFE_STATEMENT.DROP_COLUMN);
		expect(violation?.line).toBe(1);
	});

	it("keeps line numbers accurate for statements after a block comment", () => {
		const sql = '/* header\n   notes */\nSELECT 1;\nDROP TABLE "old";';
		const [violation] = violationsFor(FILE, sql);

		expect(violation?.statement).toBe(UNSAFE_STATEMENT.DROP_TABLE);
		expect(violation?.line).toBe(4);
	});

	it("lets a deliberate contract phase through when the file is marked", () => {
		const sql = `-- ${MIGRATION_SAFETY_MARKER}\n${RENAME}`;

		expect(violationsFor(FILE, sql)).toHaveLength(0);
	});

	it("leaves migrations that predate the policy alone", () => {
		const [first] = PRE_POLICY_MIGRATIONS;

		expect(violationsFor(first ?? "", RENAME)).toHaveLength(0);
	});
});
