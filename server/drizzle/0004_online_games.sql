CREATE TABLE "online_games" (
	"id" uuid PRIMARY KEY NOT NULL,
	"white_user_id" uuid NOT NULL,
	"black_user_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"time_control_id" text NOT NULL,
	"state" jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"is_finished" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "online_games" ADD CONSTRAINT "online_games_white_user_id_users_id_fk" FOREIGN KEY ("white_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "online_games" ADD CONSTRAINT "online_games_black_user_id_users_id_fk" FOREIGN KEY ("black_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "online_games_white_user_id_idx" ON "online_games" USING btree ("white_user_id");
--> statement-breakpoint
CREATE INDEX "online_games_black_user_id_idx" ON "online_games" USING btree ("black_user_id");
--> statement-breakpoint
CREATE INDEX "online_games_updated_at_idx" ON "online_games" USING btree ("updated_at");
