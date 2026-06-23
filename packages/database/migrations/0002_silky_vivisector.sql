ALTER TABLE "chores" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
UPDATE "chores" SET "completed_at" = "updated_at" WHERE "status" = 'complete';
