CREATE TABLE IF NOT EXISTS "creation_candidates" (
	"candidate_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creation_id" uuid NOT NULL,
	"idx" integer NOT NULL,
	"content" text,
	"image_url" varchar(512),
	"self_score" numeric(4, 2),
	"self_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creation_candidates_creation_id_idx_pk" PRIMARY KEY("creation_id","idx")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creations" (
	"creation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" varchar(16) NOT NULL,
	"agent_mode" boolean DEFAULT false NOT NULL,
	"agent_job_id" uuid,
	"prompt" text NOT NULL,
	"prompt_hash" varchar(64),
	"style" varchar(32),
	"template_id" uuid,
	"chosen_candidate" integer,
	"energy_cost" integer DEFAULT 0 NOT NULL,
	"model_version" varchar(64),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creation_candidates" ADD CONSTRAINT "creation_candidates_creation_id_creations_creation_id_fk" FOREIGN KEY ("creation_id") REFERENCES "public"."creations"("creation_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creations" ADD CONSTRAINT "creations_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creations" ADD CONSTRAINT "creations_template_id_prompt_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("template_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creation_candidates_creation" ON "creation_candidates" USING btree ("creation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creations_user_created" ON "creations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creations_prompt_hash" ON "creations" USING btree ("prompt_hash") WHERE "creations"."prompt_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creations_agent_mode" ON "creations" USING btree ("agent_mode","status") WHERE "creations"."agent_mode" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creations_status_created" ON "creations" USING btree ("status","created_at");