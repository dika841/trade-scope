CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"hs_code" text NOT NULL,
	"hs_revision" text NOT NULL,
	"product_description" text NOT NULL,
	"period_year" integer,
	"payload" jsonb NOT NULL,
	"share_token" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "report_share_token_idx" ON "report" USING btree ("share_token");--> statement-breakpoint
CREATE INDEX "report_created_idx" ON "report" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_product_idx" ON "report" USING btree ("hs_code","hs_revision");--> statement-breakpoint
CREATE INDEX "report_created_by_idx" ON "report" USING btree ("created_by");