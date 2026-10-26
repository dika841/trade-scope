import { DATA_SOURCE_KIND, type TDataSourceKind } from "@app/schemas";
import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const dataSource = pgTable(
	"data_source",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		kind: text("kind").$type<TDataSourceKind>().notNull(),
		url: text("url").notNull(),
		secretCiphertext: text("secret_ciphertext"),
		secretHint: text("secret_hint"),
		isActive: boolean("is_active").notNull().default(true),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("data_source_active_idx").on(table.isActive),
		uniqueIndex("data_source_name_unique_idx").on(table.name),
		check("data_source_kind_check", sql`${table.kind} in ('csv')`),
	],
);

export const DATA_SOURCE_DEFAULT_KIND = DATA_SOURCE_KIND.CSV;
