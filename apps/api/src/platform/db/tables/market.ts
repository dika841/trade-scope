import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const tradeFlow = pgTable(
	"trade_flow",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		hsCode: text("hs_code").notNull(),
		hsRevision: text("hs_revision").notNull(),
		importerIso2: text("importer_iso2").notNull(),
		periodYear: integer("period_year").notNull(),
		tradeValueUsd: numeric("trade_value_usd", {
			precision: 20,
			scale: 2,
		}).notNull(),
		quantityKg: numeric("quantity_kg", { precision: 20, scale: 3 }),
		source: text("source").notNull(),
		sourceUrl: text("source_url"),
		retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("trade_flow_key_idx").on(
			table.hsCode,
			table.hsRevision,
			table.importerIso2,
			table.periodYear,
		),
		index("trade_flow_product_period_idx").on(
			table.hsCode,
			table.hsRevision,
			table.periodYear,
		),
		check(
			"trade_flow_year_check",
			sql`${table.periodYear} between 1900 and 2100`,
		),
		check(
			"trade_flow_value_check",
			sql`${table.tradeValueUsd} >= 0 and (${table.quantityKg} is null or ${table.quantityKg} >= 0)`,
		),
	],
);
