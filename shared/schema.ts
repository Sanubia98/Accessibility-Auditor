import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status", { enum: ["pending", "scanning", "completed", "failed"] }).notNull().default("pending"),
  overallScore: integer("overall_score"),
  complianceLevel: text("compliance_level", { enum: ["A", "AA", "AAA", "AODA", "none"] }),
  totalIssues: integer("total_issues").default(0),
  criticalIssues: integer("critical_issues").default(0),
  majorIssues: integer("major_issues").default(0),
  minorIssues: integer("minor_issues").default(0),
  scanLevels: jsonb("scan_levels").$type<string[]>().notNull().default(["A", "AA"]),
  readingLevel: text("reading_level"),
  cognitiveScore: integer("cognitive_score"),
  multimediaScore: integer("multimedia_score"),
  navigationScore: integer("navigation_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => scans.id).notNull(),
  wcagCriteria: text("wcag_criteria").notNull(),
  severity: text("severity", { enum: ["critical", "major", "minor"] }).notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  element: text("element"),
  suggestedFix: text("suggested_fix"),
  impact: text("impact"),
  helpUrl: text("help_url"),
  testingType: text("testing_type", { enum: ["automated", "manual", "user_persona"] }),
  readingLevel: text("reading_level"),
  cognitiveLoad: text("cognitive_load"),
  multimediaType: text("multimedia_type"),
});

export const insertScanSchema = createInsertSchema(scans).pick({
  url: true,
  scanLevels: true,
});

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
});

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;
