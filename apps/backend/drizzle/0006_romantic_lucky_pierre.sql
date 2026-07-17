CREATE TABLE IF NOT EXISTS "audit_logs" (
	"audit_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"target_id" uuid NOT NULL,
	"target_type" varchar(32) NOT NULL,
	"action" varchar(32) NOT NULL,
	"reason" varchar(128),
	"result" varchar(16) NOT NULL,
	"operator_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_audit_id_created_at_pk" PRIMARY KEY("audit_id","created_at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banned_users" (
	"ban_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" varchar(64) NOT NULL,
	"ban_until" timestamp with time zone,
	"banned_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_rooms" (
	"room_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(16) NOT NULL,
	"legion_id" uuid,
	"user_a" uuid,
	"user_b" uuid,
	"last_msg_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legion_members" (
	"membership_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legion_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(16) DEFAULT 'member' NOT NULL,
	"contribution" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legions" (
	"legion_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"slogan" varchar(140),
	"avatar_url" varchar(512),
	"theme_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"leader_id" uuid NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"activity_score" integer DEFAULT 0 NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"member_cap" integer DEFAULT 500 NOT NULL,
	"join_mode" varchar(16) DEFAULT 'approval' NOT NULL,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pk_wins" integer DEFAULT 0 NOT NULL,
	"pk_losses" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "legions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_reads" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_msg_id" uuid,
	CONSTRAINT "message_reads_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"message_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"msg_type" varchar(16) NOT NULL,
	"content" text,
	"extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_message_id_created_at_pk" PRIMARY KEY("message_id","created_at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"notif_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"title" varchar(140),
	"body" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"push_status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pk_matches" (
	"pk_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(16) NOT NULL,
	"legion_a" uuid NOT NULL,
	"legion_b" uuid NOT NULL,
	"theme" varchar(140) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" varchar(16) DEFAULT 'idle' NOT NULL,
	"score_a" numeric(10, 4) DEFAULT '0' NOT NULL,
	"score_b" numeric(10, 4) DEFAULT '0' NOT NULL,
	"winner_id" uuid,
	"mvp_user_id" uuid,
	"reward_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pk_votes" (
	"vote_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pk_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"legion_id" uuid NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"report_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" varchar(16) NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" varchar(64) NOT NULL,
	"detail" text,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"handler_id" uuid,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sensitive_words" (
	"word_id" bigserial PRIMARY KEY NOT NULL,
	"word" varchar(64) NOT NULL,
	"category" varchar(32) NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_operator_id_users_user_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_banned_by_users_user_id_fk" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_legion_id_legions_legion_id_fk" FOREIGN KEY ("legion_id") REFERENCES "public"."legions"("legion_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_user_a_users_user_id_fk" FOREIGN KEY ("user_a") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_user_b_users_user_id_fk" FOREIGN KEY ("user_b") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legion_members" ADD CONSTRAINT "legion_members_legion_id_legions_legion_id_fk" FOREIGN KEY ("legion_id") REFERENCES "public"."legions"("legion_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legion_members" ADD CONSTRAINT "legion_members_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "legions" ADD CONSTRAINT "legions_leader_id_users_user_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_room_id_chat_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("room_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_room_id_chat_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("room_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_matches" ADD CONSTRAINT "pk_matches_legion_a_legions_legion_id_fk" FOREIGN KEY ("legion_a") REFERENCES "public"."legions"("legion_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_matches" ADD CONSTRAINT "pk_matches_legion_b_legions_legion_id_fk" FOREIGN KEY ("legion_b") REFERENCES "public"."legions"("legion_id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_matches" ADD CONSTRAINT "pk_matches_winner_id_legions_legion_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."legions"("legion_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_matches" ADD CONSTRAINT "pk_matches_mvp_user_id_users_user_id_fk" FOREIGN KEY ("mvp_user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_votes" ADD CONSTRAINT "pk_votes_pk_id_pk_matches_pk_id_fk" FOREIGN KEY ("pk_id") REFERENCES "public"."pk_matches"("pk_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_votes" ADD CONSTRAINT "pk_votes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pk_votes" ADD CONSTRAINT "pk_votes_legion_id_legions_legion_id_fk" FOREIGN KEY ("legion_id") REFERENCES "public"."legions"("legion_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_handler_id_users_user_id_fk" FOREIGN KEY ("handler_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_target" ON "audit_logs" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_operator" ON "audit_logs" USING btree ("operator_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_banned_users_user" ON "banned_users" USING btree ("user_id","ban_until");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_rooms_legion" ON "chat_rooms" USING btree ("legion_id") WHERE "chat_rooms"."legion_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_rooms_private" ON "chat_rooms" USING btree ("user_a","user_b") WHERE "chat_rooms"."type" = 'private';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_rooms_last_msg" ON "chat_rooms" USING btree ("last_msg_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_legion_members" ON "legion_members" USING btree ("legion_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legion_members_user" ON "legion_members" USING btree ("user_id") WHERE "legion_members"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legion_members_legion" ON "legion_members" USING btree ("legion_id","contribution") WHERE "legion_members"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legion_members_role" ON "legion_members" USING btree ("role") WHERE "legion_members"."role" IN ('leader','vice_leader');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legions_level_activity" ON "legions" USING btree ("level","activity_score") WHERE "legions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legions_status" ON "legions" USING btree ("status") WHERE "legions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_legions_theme_tags" ON "legions" USING gin ("theme_tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_room_created" ON "messages" USING btree ("room_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_sender" ON "messages" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_messages_extra_gin" ON "messages" USING gin ("extra");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_unread" ON "notifications" USING btree ("user_id") WHERE "notifications"."is_read" = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_status_end" ON "pk_matches" USING btree ("status","end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_legion_a" ON "pk_matches" USING btree ("legion_a","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_legion_b" ON "pk_matches" USING btree ("legion_b","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_winner" ON "pk_matches" USING btree ("winner_id") WHERE "pk_matches"."winner_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_official" ON "pk_matches" USING btree ("is_official","start_at") WHERE "pk_matches"."is_official" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_votes_pk_legion" ON "pk_votes" USING btree ("pk_id","legion_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pk_votes_user_date" ON "pk_votes" USING btree ("user_id","voted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reports_target" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_sensitive_words" ON "sensitive_words" USING btree ("word","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sensitive_words_word_trgm" ON "sensitive_words" USING gin ("word" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sensitive_words_level" ON "sensitive_words" USING btree ("level") WHERE "sensitive_words"."enabled" = true;