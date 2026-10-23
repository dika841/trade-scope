export const MIGRATION_SAFETY_MARKER = "migration-safety: contract-phase";

export const UNSAFE_STATEMENT = {
	DROP_COLUMN: "DROP COLUMN",
	RENAME_COLUMN: "RENAME COLUMN",
	DROP_TABLE: "DROP TABLE",
	SET_NOT_NULL: "SET NOT NULL",
} as const;

export type TUnsafeStatement =
	(typeof UNSAFE_STATEMENT)[keyof typeof UNSAFE_STATEMENT];

export const UNSAFE_STATEMENTS: readonly TUnsafeStatement[] = [
	UNSAFE_STATEMENT.DROP_COLUMN,
	UNSAFE_STATEMENT.RENAME_COLUMN,
	UNSAFE_STATEMENT.DROP_TABLE,
	UNSAFE_STATEMENT.SET_NOT_NULL,
];

export const PRE_POLICY_MIGRATIONS: readonly string[] = [
	"0003_brown_silk_fever.sql",
];

export const REMEDY: Readonly<Record<TUnsafeStatement, string>> = {
	[UNSAFE_STATEMENT.DROP_COLUMN]:
		"Add the replacement column first, write to both for one release, then drop the old one in the next.",
	[UNSAFE_STATEMENT.RENAME_COLUMN]:
		"A rename breaks every running replica the moment it lands. Add the new column, backfill, write to both, then drop the old one in a later release.",
	[UNSAFE_STATEMENT.DROP_TABLE]:
		"Stop reading the table in one release, then drop it in the next, so a rollback still has its data.",
	[UNSAFE_STATEMENT.SET_NOT_NULL]:
		"Backfill the column and add a CHECK constraint first. Tightening a column that running code still writes as null fails on the next insert.",
};
