CREATE TABLE "country" (
	"iso2" text PRIMARY KEY NOT NULL,
	"iso3" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hs_alias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias" text NOT NULL,
	"hs_product_id" uuid NOT NULL,
	"language" text DEFAULT 'id' NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hs_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hs_code" text NOT NULL,
	"hs_revision" text NOT NULL,
	"description" text NOT NULL,
	"parent_hs_code" text,
	"level" integer NOT NULL,
	"source" text NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hs_alias" ADD CONSTRAINT "hs_alias_hs_product_id_hs_product_id_fk" FOREIGN KEY ("hs_product_id") REFERENCES "public"."hs_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "country_iso3_idx" ON "country" USING btree ("iso3");--> statement-breakpoint
CREATE UNIQUE INDEX "hs_alias_alias_product_language_idx" ON "hs_alias" USING btree ("alias","hs_product_id","language");--> statement-breakpoint
CREATE INDEX "hs_alias_alias_idx" ON "hs_alias" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "hs_alias_product_idx" ON "hs_alias" USING btree ("hs_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hs_product_code_revision_idx" ON "hs_product" USING btree ("hs_code","hs_revision");--> statement-breakpoint
CREATE INDEX "hs_product_code_idx" ON "hs_product" USING btree ("hs_code");