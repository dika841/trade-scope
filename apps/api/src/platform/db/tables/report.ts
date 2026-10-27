import type { TReportPayload } from "@app/schemas";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const report = pgTable(
	"report",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: text("title").notNull(),
		hsCode: text("hs_code").notNull(),
		hsRevision: text("hs_revision").notNull(),
		productDescription: text("product_description").notNull(),
		periodYear: integer("period_year"),
		payload: jsonb("payload").$type<TReportPayload>().notNull(),
		shareToken: text("share_token").notNull(),
		revokedAt: timestamp("revoked_at", { withTimezone: true }),
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
		uniqueIndex("report_share_token_idx").on(table.shareToken),
		index("report_created_idx").on(table.createdAt),
		index("report_product_idx").on(table.hsCode, table.hsRevision),
		index("report_created_by_idx").on(table.createdBy),
	],
);
