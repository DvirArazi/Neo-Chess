ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_subject" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_subject_unique" UNIQUE("google_subject");