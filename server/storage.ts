import {
  scans,
  issues,
  type Scan,
  type InsertScan,
  type Issue,
  type InsertIssue,
} from "@shared/schema";
import db from "@shared/db";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { users } from "@shared/schema";
import { InsertUser, User } from "@shared/schema";
import { reports, InsertReport } from "@shared/schema";

export interface IStorage {
  // Scan operations
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: number): Promise<Scan | undefined>;
  updateScan(id: number, updates: Partial<Scan>): Promise<Scan | undefined>;
  getAllScans(): Promise<Scan[]>;

  // Issue operations
  createIssue(issue: InsertIssue): Promise<Issue>;
  getIssuesByScanId(scanId: number): Promise<Issue[]>;
  deleteIssuesByScanId(scanId: number): Promise<void>;
  
  //Report operations
  createReport(data: InsertReport): Promise<InsertReport>;
  getReportByScanId(scanId: number): Promise<InsertReport | undefined>;
  getReportsByUserId(userId: string): Promise<InsertReport[]>;
  getReportsByScanId(scanId: number): Promise<InsertReport[]>
  updateReport(scanId: number, updates: Partial<InsertReport>): Promise<void>;
}

export class MemStorage implements IStorage {
  private scans: Map<number, Scan>;
  private issues: Map<number, Issue>;
  private currentScanId: number;
  private currentIssueId: number;
  private reports: Map<number, InsertReport>;
  private currentReportId: number;

  constructor() {
    this.scans = new Map();
    this.issues = new Map();
    this.reports = new Map();
    this.currentScanId = 1;
    this.currentIssueId = 1;
    this.currentReportId = 1;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const [scan] = await db
      .insert(scans)
      .values({
        url: insertScan.url,
        scanLevels: Array.isArray(insertScan.scanLevels)
          ? insertScan.scanLevels
          : [],
        status: "pending",
        overallScore: null,
        complianceLevel: null,
        totalIssues: 0,
        criticalIssues: 0,
        majorIssues: 0,
        minorIssues: 0,
        readingLevel: null,
        cognitiveScore: null,
        multimediaScore: null,
        navigationScore: null,
        createdAt: new Date(),
        completedAt: null,
      })
      .returning(); // ✅ this is required to get back the inserted row

    // console.log("Scan created:", scan);
    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    const [scan] = await db.select().from(scans).where(eq(scans.id, id));
    return scan;
  }

  async updateScan(id: number, updates: Partial<Scan>): Promise<void> {
    await db.update(scans).set(updates).where(eq(scans.id, id));
  }

 async getReportsByScanId(scanId: number): Promise<InsertReport[]> {
    return await db.select().from(reports).where(eq(reports.scanId, scanId));
  }

  async updateReport(
    scanId: number,
    updates: Partial<InsertReport>
  ): Promise<void> {
    await db.update(reports).set(updates).where(eq(reports.scanId, scanId));
  }

  // Get all scans from DB
  async getAllScans(): Promise<Scan[]> {
    return await db.select().from(scans).orderBy(desc(scans.createdAt));
  }

  // Create issue in DB
  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const [issue] = await db.insert(issues).values(insertIssue).returning();
    return issue;
  }

  // Get issues by scanId from DB
  async getIssuesByScanId(scanId: number): Promise<Issue[]> {
    return await db.select().from(issues).where(eq(issues.scanId, scanId));
  }

  // Delete issues by scanId from DB
  async deleteIssuesByScanId(scanId: number): Promise<void> {
    await db.delete(issues).where(eq(issues.scanId, scanId));
  }
}
export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}
// Get user by ID
export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createReport(data: InsertReport) {
  return await db.insert(reports).values(data).returning();
}

export async function saveReportToDatabase({
  userId,
  scanId,
  pdfContent,
}: {
  userId: string;
  scanId: number;
  pdfContent: string;
}) {
  await db.insert(reports).values({
    userId,
    scanId,
    pdfContent,
  });
}

export async function getReportsByUserId(userId: string): Promise<InsertReport[]> {
  return await db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));
}

export async function getReportByScanId(scanId: number): Promise<InsertReport | undefined> {
  const [report] = await db.select().from(reports).where(eq(reports.scanId, scanId));
  return report;
}


export const storage = new MemStorage();
