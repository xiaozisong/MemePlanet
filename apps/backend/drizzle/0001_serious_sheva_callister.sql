CREATE TABLE IF NOT EXISTS "prompt_templates" (
	"template_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" varchar(16) NOT NULL,
	"name" varchar(64) NOT NULL,
	"system_prompt" text NOT NULL,
	"user_template" text NOT NULL,
	"style" varchar(32),
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"example_output" jsonb,
	"is_official" boolean DEFAULT false NOT NULL,
	"creator_id" uuid,
	"use_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_creator_id_users_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prompt_templates_mode" ON "prompt_templates" USING btree ("mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prompt_templates_official" ON "prompt_templates" USING btree ("is_official","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prompt_templates_use_count" ON "prompt_templates" USING btree ("use_count");