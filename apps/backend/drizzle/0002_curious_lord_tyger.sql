CREATE TABLE IF NOT EXISTS "analytics_events" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar(128) NOT NULL,
	"user_id" uuid,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"platform" varchar(16) DEFAULT 'app' NOT NULL,
	"session_id" varchar(128),
	"device_id" varchar(128),
	"client_ip" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_name_created" ON "analytics_events" USING btree ("event_name","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_created" ON "analytics_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_created" ON "analytics_events" USING btree ("created_at");