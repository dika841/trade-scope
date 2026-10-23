import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const activityLog = pgTable(
	"activity_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		actorId: text("actor_id"),
		action: text("action").notNull(),
		resourceType: text("resource_type").notNull(),
		resourceId: text("resource_id").notNull(),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("activity_log_resource_idx").on(table.resourceType, table.resourceId),
		index("activity_log_actor_id_idx").on(table.actorId),
		index("activity_log_created_at_idx").on(table.createdAt),
	],
);
