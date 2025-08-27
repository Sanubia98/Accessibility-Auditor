ALTER TABLE "scans" DROP CONSTRAINT "scans_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "scans" DROP COLUMN "user_id";