import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { A } from "@mobily/ts-belt";
import { match } from "ts-pattern";
import { violationsFor, type TMigrationViolation } from "./migration-check.ts";
import { MIGRATION_SAFETY_MARKER } from "./migration-rules.ts";

const MIGRATIONS = new URL("../drizzle", import.meta.url).pathname;
const SQL_EXTENSION = ".sql";
const EXIT_FAILURE = 1;

const report = (violations: readonly TMigrationViolation[]): void => {
	A.forEach(violations, (v) => {
		process.stdout.write(
			`${v.file}:${v.line}\n  ${v.statement}\n  ${v.source}\n  ${v.remedy}\n  Deliberate? Add "-- ${MIGRATION_SAFETY_MARKER}" at the top of the file.\n\n`,
		);
	});
	process.stdout.write(
		`${violations.length} unsafe migration statement${violations.length === 1 ? "" : "s"}\n`,
	);
};

const violations = A.flat(
	A.map(
		A.filter(readdirSync(MIGRATIONS), (entry) => entry.endsWith(SQL_EXTENSION)),
		(file) => violationsFor(file, readFileSync(join(MIGRATIONS, file), "utf8")),
	),
);

report(violations);

match(A.isEmpty(violations))
	.with(false, () => process.exit(EXIT_FAILURE))
	.otherwise(() => undefined);
