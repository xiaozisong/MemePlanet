CREATE TABLE IF NOT EXISTS "user_badges" (
	"user_id" uuid NOT NULL,
	"badge_code" varchar(64) NOT NULL,
	"badge_type" varchar(16) NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "user_badges_user_id_badge_code_pk" PRIMARY KEY("user_id","badge_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_follows" (
	"follower_id" uuid NOT NULL,
	"followee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_follower_id_followee_id_pk" PRIMARY KEY("follower_id","followee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_interest_tags" (
	"user_id" uuid NOT NULL,
	"tag" varchar(32) NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_interest_tags_user_id_tag_pk" PRIMARY KEY("user_id","tag")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"interest_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notification_pref" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"teen_mode_until" timestamp with time zone,
	"nickname_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_uid" uuid,
	"phone" varchar(20),
	"email" text,
	"nickname" varchar(32) NOT NULL,
	"avatar_url" varchar(512),
	"gender" varchar(16),
	"birthday" date,
	"bio" varchar(140),
	"level" integer DEFAULT 1 NOT NULL,
	"meme_power" integer DEFAULT 0 NOT NULL,
	"defense_value" integer DEFAULT 0 NOT NULL,
	"energy_balance" integer DEFAULT 100 NOT NULL,
	"legion_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"is_pro" boolean DEFAULT false NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_supabase_uid_unique" UNIQUE("supabase_uid"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followee_id_users_user_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_interest_tags" ADD CONSTRAINT "user_interest_tags_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_badges_type" ON "user_badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_follows_followee" ON "user_follows" USING btree ("followee_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_interest_tags_tag" ON "user_interest_tags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_profiles_interest_tags" ON "user_profiles" USING gin ("interest_tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_nickname_trgm" ON "users" USING gin ("nickname" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" USING btree ("status") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_is_pro" ON "users" USING btree ("is_pro") WHERE "users"."is_pro" = true;