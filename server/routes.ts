import type { Express } from "express";
import { createServer, type Server } from "http";
import { getReportsByUserId, storage } from "./storage";
import { scanner } from "./services/scanner";
import { advancedScanner } from "./services/advanced-scanner";
import { reportGenerator } from "./services/report";
import { insertScanSchema, scans } from "@shared/schema";
import { z } from "zod";
import { reports } from "@shared/schema";
import passport from "passport";
import db from "@shared/db";
import { authenticateJWT } from "./authenticateJWT";
import { and, eq } from "drizzle-orm";


export async function registerRoutes(app: Express): Promise<Server> {
  // Get all scans
  app.get("/api/scans", async (req, res) => {
    try {
      const scans = await storage.getAllScans();
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  // Get specific scan
  app.get("/api/scans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scan = await storage.getScan(id);
      
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      
      res.json(scan);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan" });
    }
  });

  // Get issues for a scan
  app.get("/api/scans/:id/issues", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const issues = await storage.getIssuesByScanId(id);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch issues" });
    }
  });

  // Create new scan
  app.post("/api/scans", async (req, res) => {
    try {
      const validatedData = insertScanSchema.parse(req.body);
      const scan = await storage.createScan(validatedData);
      // Determine which scanner to use based on scan levels
      const useAdvancedScanner = scan.scanLevels.some(level => 
        ['AAA', 'AODA', 'COGNITIVE', 'MULTIMEDIA'].includes(level)
      );
      
      // Start scanning in background
      if (useAdvancedScanner) {
        advancedScanner.scanWebsiteAdvanced(scan.id).catch(console.error);
      } else {
        scanner.scanWebsite(scan.id).catch(console.error);
      }
      
      const data = res.json(scan);
      // console.log(data);
      
      
    } catch (error) {
      console.log(error, "this is Err");
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create scan" });
    }
  });

  // Generate PDF report
  app.get("/api/scans/:id/report",async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scan = await storage.getScan(id);
      
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      
      if (scan.status !== 'completed') {
        return res.status(400).json({ error: "Scan not completed yet" });
      }
      
      const pdfBuffer = await reportGenerator.generatePDFReport(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="accessibility-report-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

//   app.get('/api/scans/:id/report', async (req, res) => {
//   try {
//     const id = Number(req.params.id);   // <-- this line was missing
//     if (!id) return res.status(400).json({ error: 'Missing or invalid id' });

//     const pdf = await reportGenerator.generatePDFReport(id);
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename="report-${id}.pdf"`
//     );
//     res.send(pdf);
//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ error: 'Failed to generate report' });
//   }
// });

  //get all reports
  app.get("/myReports", authenticateJWT, async (req, res)=> {
      try {
    const userId = (req as any).user.id; // Get user ID from JW
    const result = await db
      .select({
        scanId: reports.scanId,
        url: scans.url,
        createdAt: scans.createdAt,
        pdfContent: reports.pdfContent, // optional, remove if you don't want base64s here
      })
      .from(reports)
      .innerJoin(scans, eq(scans.id, reports.scanId))
      .where( eq(reports.userId, userId));

    res.json(result);
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  
  } })

  app.get("/myReports/:scanId", authenticateJWT, async (req, res) => {
  const userId = (req as any).user.id;
  const scanId = parseInt(req.params.scanId);

  if (isNaN(scanId)) {
    return res.status(400).json({ message: "Invalid scan ID" });
  }

  try {
    const report = await db
      .select({
        scanId: reports.scanId,
        url: scans.url,
        createdAt: scans.createdAt,
        pdfContent: reports.pdfContent,
      })
      .from(reports)
      .innerJoin(scans, eq(scans.id, reports.scanId))
      .where(and(eq(reports.userId, userId), eq(reports.scanId, scanId)));

    if (report.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report[0]);
  } catch (err) {
    console.error("Error fetching report:", err);
    res.status(500).json({ message: "Failed to fetch report" });
  }
});

   
  const httpServer = createServer(app);
  return httpServer;
}



