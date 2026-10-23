import type { TPermission } from "@app/permissions";
import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const customRole = pgTable("custom_role", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: text("key").notNull().unique(),
	label: text("label").notNull(),
	description: text("description"),
	permissions: jsonb("permissions")
		.$type<readonly TPermission[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),
	createdBy: text("created_by").references(() => user.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
