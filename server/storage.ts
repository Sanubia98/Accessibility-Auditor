import { scans, issues, type Scan, type InsertScan, type Issue, type InsertIssue } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private scans: Map<number, Scan>;
  private issues: Map<number, Issue>;
  private currentScanId: number;
  private currentIssueId: number;

  constructor() {
    this.scans = new Map();
    this.issues = new Map();
    this.currentScanId = 1;
    this.currentIssueId = 1;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.currentScanId++;
    const scan: Scan = {
      ...insertScan,
      id,
      status: "pending",
      overallScore: null,
      complianceLevel: null,
      totalIssues: 0,
      criticalIssues: 0,
      majorIssues: 0,
      minorIssues: 0,
      createdAt: new Date(),
      completedAt: null,
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async updateScan(id: number, updates: Partial<Scan>): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;
    
    const updatedScan = { ...scan, ...updates };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async getAllScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createIssue(insertIssue: InsertIssue): Promise<Issue> {
    const id = this.currentIssueId++;
    const issue: Issue = { ...insertIssue, id };
    this.issues.set(id, issue);
    return issue;
  }

  async getIssuesByScanId(scanId: number): Promise<Issue[]> {
    return Array.from(this.issues.values())
      .filter(issue => issue.scanId === scanId)
      .sort((a, b) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  async deleteIssuesByScanId(scanId: number): Promise<void> {
    for (const [id, issue] of this.issues.entries()) {
      if (issue.scanId === scanId) {
        this.issues.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
