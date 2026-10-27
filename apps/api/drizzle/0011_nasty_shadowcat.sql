CREATE TABLE "pilot_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hs_code" text NOT NULL,
	"hs_revision" text NOT NULL,
	"market_iso2" text NOT NULL,
	"status" text NOT NULL,
	"owner_id" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_request_status_check" CHECK ("pilot_request"."status" in ('new', 'in_review', 'approved', 'rejected', 'completed'))
);
--> statement-breakpoint
ALTER TABLE "pilot_request" ADD CONSTRAINT "pilot_request_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_request" ADD CONSTRAINT "pilot_request_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pilot_request_created_idx" ON "pilot_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pilot_request_status_idx" ON "pilot_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pilot_request_product_idx" ON "pilot_request" USING btree ("hs_code","hs_revision");--> statement-breakpoint
CREATE INDEX "pilot_request_market_idx" ON "pilot_request" USING btree ("market_iso2");--> statement-breakpoint
CREATE INDEX "pilot_request_owner_idx" ON "pilot_request" USING btree ("owner_id");