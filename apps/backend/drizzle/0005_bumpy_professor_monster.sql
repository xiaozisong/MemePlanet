CREATE TABLE IF NOT EXISTS "ai_cost_logs" (
	"log_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"module" varchar(32) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"model" varchar(64) NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"images" integer DEFAULT 0 NOT NULL,
	"video_secs" numeric(8, 2) DEFAULT '0' NOT NULL,
	"cost_cents" integer NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'ok' NOT NULL,
	"request_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_cost_logs_log_id_created_at_pk" PRIMARY KEY("log_id","created_at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meme_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"is_god_comment" boolean DEFAULT false NOT NULL,
	"is_meme_card" boolean DEFAULT false NOT NULL,
	"ref_meme_id" uuid,
	"status" varchar(16) DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ratings" (
	"score_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"meme_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"star" smallint NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_judge" boolean DEFAULT false NOT NULL,
	"weight" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"is_god_trash_vote" boolean DEFAULT false NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_score_id_pk" PRIMARY KEY("score_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_cost_logs" ADD CONSTRAINT "ai_cost_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_meme_id_meme_cards_meme_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."meme_cards"("meme_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_ref_meme_id_meme_cards_meme_id_fk" FOREIGN KEY ("ref_meme_id") REFERENCES "public"."meme_cards"("meme_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "fk_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("comment_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings" ADD CONSTRAINT "ratings_meme_id_meme_cards_meme_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."meme_cards"("meme_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_user" ON "ai_cost_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_module" ON "ai_cost_logs" USING btree ("module","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_provider" ON "ai_cost_logs" USING btree ("provider","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_cost_daily" ON "ai_cost_logs" USING btree ("created_at","module");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_meme_created" ON "comments" USING btree ("meme_id","created_at") WHERE "comments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_parent" ON "comments" USING btree ("parent_id") WHERE "comments"."parent_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_user_created" ON "comments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_god_comment" ON "comments" USING btree ("meme_id") WHERE "comments"."is_god_comment" = true;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ratings_meme_user" ON "ratings" USING btree ("meme_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_meme_created" ON "ratings" USING btree ("meme_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_user_created" ON "ratings" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ratings_dimensions_gin" ON "ratings" USING gin ("dimensions");