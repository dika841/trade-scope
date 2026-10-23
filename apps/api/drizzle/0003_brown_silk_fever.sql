ALTER TABLE "activity_log" RENAME COLUMN "entity_type" TO "resource_type";--> statement-breakpoint
ALTER TABLE "activity_log" RENAME COLUMN "entity_id" TO "resource_id";--> statement-breakpoint
DROP INDEX "activity_log_entity_idx";--> statement-breakpoint
CREATE INDEX "activity_log_resource_idx" ON "activity_log" USING btree ("resource_type","resource_id");