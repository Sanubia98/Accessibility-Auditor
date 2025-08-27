CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_id" integer NOT NULL,
	"wcag_criteria" text NOT NULL,
	"severity" text NOT NULL,
	"category" text NOT NULL,
	"sub_category" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"element" text,
	"suggested_fix" text,
	"impact" text,
	"help_url" text,
	"testing_type" text,
	"reading_level" text,
	"cognitive_load" text,
	"multimedia_type" text
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"overall_score" integer,
	"compliance_level" text,
	"total_issues" integer DEFAULT 0,
	"critical_issues" integer DEFAULT 0,
	"major_issues" integer DEFAULT 0,
	"minor_issues" integer DEFAULT 0,
	"scan_levels" jsonb DEFAULT '["A","AA","AAA","AODA","none"]'::jsonb NOT NULL,
	"reading_level" text,
	"cognitive_score" integer,
	"multimedia_score" integer,
	"navigation_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE no action ON UPDATE no action;