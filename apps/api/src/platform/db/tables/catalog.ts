import {
	boolean,
	date,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const country = pgTable(
	"country",
	{
		iso2: text("iso2").primaryKey(),
		iso3: text("iso3").notNull(),
		name: text("name").notNull(),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [uniqueIndex("country_iso3_idx").on(table.iso3)],
);

export const hsProduct = pgTable(
	"hs_product",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		hsCode: text("hs_code").notNull(),
		hsRevision: text("hs_revision").notNull(),
		description: text("description").notNull(),
		parentHsCode: text("parent_hs_code"),
		level: integer("level").notNull(),
		source: text("source").notNull(),
		validFrom: date("valid_from"),
		validTo: date("valid_to"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("hs_product_code_revision_idx").on(
			table.hsCode,
			table.hsRevision,
		),
		index("hs_product_code_idx").on(table.hsCode),
	],
);

export const hsAlias = pgTable(
	"hs_alias",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		alias: text("alias").notNull(),
		hsProductId: uuid("hs_product_id")
			.notNull()
			.references(() => hsProduct.id, { onDelete: "cascade" }),
		language: text("language").notNull().default("id"),
		source: text("source").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex("hs_alias_alias_product_language_idx").on(
			table.alias,
			table.hsProductId,
			table.language,
		),
		index("hs_alias_alias_idx").on(table.alias),
		index("hs_alias_product_idx").on(table.hsProductId),
	],
);
