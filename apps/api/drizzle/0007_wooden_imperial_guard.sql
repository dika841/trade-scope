CREATE TABLE "data_source" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"secret_ciphertext" text,
	"secret_hint" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"retry_of_id" uuid,
	"mode" text NOT NULL,
	"file_name" text,
	"payload" text,
	"status" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"inserted_rows" integer DEFAULT 0 NOT NULL,
	"updated_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"message" text,
	"triggered_by" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_source" ADD CONSTRAINT "data_source_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD CONSTRAINT "ingestion_run_source_id_data_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."data_source"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD CONSTRAINT "ingestion_run_retry_of_id_ingestion_run_id_fk" FOREIGN KEY ("retry_of_id") REFERENCES "public"."ingestion_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD CONSTRAINT "ingestion_run_triggered_by_user_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_source_active_idx" ON "data_source" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "data_source_name_unique_idx" ON "data_source" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ingestion_run_created_idx" ON "ingestion_run" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ingestion_run_status_idx" ON "ingestion_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ingestion_run_source_idx" ON "ingestion_run" USING btree ("source_id");