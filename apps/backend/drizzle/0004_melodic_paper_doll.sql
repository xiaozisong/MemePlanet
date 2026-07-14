CREATE TABLE IF NOT EXISTS "meme_card_tags" (
	"meme_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "meme_card_tags_meme_id_tag_id_pk" PRIMARY KEY("meme_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meme_cards" (
	"meme_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"creation_id" uuid,
	"type" varchar(16) NOT NULL,
	"cover_url" varchar(512),
	"title" text NOT NULL,
	"title_tsv" "tsvector",
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legion_id" uuid,
	"score_avg" numeric(3, 2) DEFAULT '0' NOT NULL,
	"score_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"completion_rate" numeric(4, 3) DEFAULT '0' NOT NULL,
	"hot_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"god_trash_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"is_ai_generated" boolean DEFAULT true NOT NULL,
	"watermarked" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meme_tags" (
	"tag_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(32) NOT NULL,
	"category" varchar(32),
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meme_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meme_card_tags" ADD CONSTRAINT "meme_card_tags_meme_id_meme_cards_meme_id_fk" FOREIGN KEY ("meme_id") REFERENCES "public"."meme_cards"("meme_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meme_card_tags" ADD CONSTRAINT "meme_card_tags_tag_id_meme_tags_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."meme_tags"("tag_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meme_cards" ADD CONSTRAINT "meme_cards_author_id_users_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meme_cards" ADD CONSTRAINT "meme_cards_creation_id_creations_creation_id_fk" FOREIGN KEY ("creation_id") REFERENCES "public"."creations"("creation_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_card_tags_tag" ON "meme_card_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_author_created" ON "meme_cards" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_legion_status" ON "meme_cards" USING btree ("legion_id","status") WHERE "meme_cards"."legion_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_hot_score" ON "meme_cards" USING btree ("hot_score") WHERE "meme_cards"."status" = 'published' AND "meme_cards"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_status_published" ON "meme_cards" USING btree ("status","published_at") WHERE "meme_cards"."status" = 'published';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_god_trash" ON "meme_cards" USING btree ("god_trash_status") WHERE "meme_cards"."god_trash_status" <> 'pending';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_tags_gin" ON "meme_cards" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_title_tsv" ON "meme_cards" USING gin ("title_tsv");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_meme_cards_title_trgm" ON "meme_cards" USING gin ("title" gin_trgm_ops);