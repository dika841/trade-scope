import {
	INGESTION_MODE,
	INGESTION_STATUS,
	type TIngestionMode,
	type TIngestionRowError,
	type TIngestionStatus,
} from "@app/schemas";
import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { dataSource } from "./data-source.ts";

export const ingestionRun = pgTable(
	"ingestion_run",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sourceId: uuid("source_id").references(() => dataSource.id, {
			onDelete: "set null",
		}),
		retryOfId: uuid("retry_of_id").references(
			(): AnyPgColumn => ingestionRun.id,
			{ onDelete: "set null" },
		),
		mode: text("mode").$type<TIngestionMode>().notNull(),
		fileName: text("file_name"),
		payload: text("payload"),
		status: text("status").$type<TIngestionStatus>().notNull(),
		totalRows: integer("total_rows").notNull().default(0),
		insertedRows: integer("inserted_rows").notNull().default(0),
		updatedRows: integer("updated_rows").notNull().default(0),
		failedRows: integer("failed_rows").notNull().default(0),
		errors: jsonb("errors")
			.$type<readonly TIngestionRowError[]>()
			.notNull()
			.default([]),
		message: text("message"),
		triggeredBy: text("triggered_by").references(() => user.id, {
			onDelete: "set null",
		}),
		startedAt: timestamp("started_at", { withTimezone: true }),
		finishedAt: timestamp("finished_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("ingestion_run_created_idx").on(table.createdAt),
		index("ingestion_run_status_idx").on(table.status),
		index("ingestion_run_source_idx").on(table.sourceId),
		check(
			"ingestion_run_mode_check",
			sql`${table.mode} in ('upload', 'source')`,
		),
		check(
			"ingestion_run_status_check",
			sql`${table.status} in ('queued', 'running', 'succeeded', 'partial', 'failed')`,
		),
		check(
			"ingestion_run_counts_check",
			sql`${table.totalRows} >= 0 and ${table.insertedRows} >= 0 and ${table.updatedRows} >= 0 and ${table.failedRows} >= 0`,
		),
	],
);

export const INGESTION_DEFAULTS = {
	MODE: INGESTION_MODE.UPLOAD,
	STATUS: INGESTION_STATUS.QUEUED,
} as const;
