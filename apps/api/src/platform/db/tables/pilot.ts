import { PILOT_STATUS, type TPilotStatus } from "@app/schemas";
import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const pilotRequest = pgTable(
	"pilot_request",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		hsCode: text("hs_code").notNull(),
		hsRevision: text("hs_revision").notNull(),
		marketIso2: text("market_iso2").notNull(),
		status: text("status").$type<TPilotStatus>().notNull(),
		version: integer("version").notNull().default(0),
		ownerId: text("owner_id").references(() => user.id, {
			onDelete: "set null",
		}),
		notes: text("notes"),
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
		index("pilot_request_created_idx").on(table.createdAt),
		index("pilot_request_status_idx").on(table.status),
		index("pilot_request_product_idx").on(table.hsCode, table.hsRevision),
		index("pilot_request_market_idx").on(table.marketIso2),
		index("pilot_request_owner_idx").on(table.ownerId),
		check(
			"pilot_request_status_check",
			sql`${table.status} in ('new', 'in_review', 'approved', 'rejected', 'completed')`,
		),
	],
);

export const PILOT_DEFAULTS = {
	STATUS: PILOT_STATUS.NEW,
} as const;
