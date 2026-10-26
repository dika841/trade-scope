CREATE TABLE "trade_flow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hs_code" text NOT NULL,
	"hs_revision" text NOT NULL,
	"importer_iso2" text NOT NULL,
	"period_year" integer NOT NULL,
	"trade_value_usd" numeric(20, 2) NOT NULL,
	"quantity_kg" numeric(20, 3),
	"source" text NOT NULL,
	"source_url" text,
	"retrieved_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_flow_year_check" CHECK ("trade_flow"."period_year" between 1900 and 2100),
	CONSTRAINT "trade_flow_value_check" CHECK ("trade_flow"."trade_value_usd" >= 0 and ("trade_flow"."quantity_kg" is null or "trade_flow"."quantity_kg" >= 0))
);
--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD COLUMN "kind" text DEFAULT 'catalog' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "trade_flow_key_idx" ON "trade_flow" USING btree ("hs_code","hs_revision","importer_iso2","period_year");--> statement-breakpoint
CREATE INDEX "trade_flow_product_period_idx" ON "trade_flow" USING btree ("hs_code","hs_revision","period_year");--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD CONSTRAINT "ingestion_run_kind_check" CHECK ("ingestion_run"."kind" in ('catalog', 'trade'));