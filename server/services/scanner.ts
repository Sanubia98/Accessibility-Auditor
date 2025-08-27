import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { storage } from '../storage';
import { type Scan, type InsertIssue } from '@shared/schema';
import{reportGenerator} from './report';
import db from '../../shared/db';
import { eq } from "drizzle-orm";
import { reports } from "@shared/schema";


interface AxeResult {
  violations: Array<{
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    help: string;
    helpUrl: string;
    tags: string[];
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary: string;
    }>;
  }>;
}

export class AccessibilityScanner {
  private mapImpactToSeverity(impact: string): 'critical' | 'major' | 'minor' {
    switch (impact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'major';
      case 'moderate':
      case 'minor':
        return 'minor';
      default:
        return 'minor';
    }
  }

  private getIssueCategory(tags: string[]): string {
    if (tags.includes('color-contrast')) return 'Color Contrast';
    if (tags.includes('wcag2a') && tags.includes('cat.text-alternatives')) return 'Missing Alt Text';
    if (tags.includes('keyboard')) return 'Keyboard Navigation';
    if (tags.includes('cat.aria')) return 'ARIA Attributes';
    if (tags.includes('cat.structure')) return 'Heading Structure';
    if (tags.includes('cat.name-role-value')) return 'Link Context';
    if (tags.includes('cat.forms')) return 'Form Labels';
    if (tags.includes('cat.tables')) return 'Table Headers';
    return 'Other';
  }

  private generateSuggestedFix(ruleId: string, description: string): string {
    const fixes: Record<string, string> = {
      'color-contrast': 'Increase color contrast ratio to at least 4.5:1 for normal text or 3:1 for large text',
      'image-alt': 'Add meaningful alt text that describes the image content or purpose',
      'link-name': 'Provide descriptive link text that explains the link destination',
      'button-name': 'Ensure buttons have accessible names via text content or aria-label',
      'form-field-multiple-labels': 'Use a single label element or aria-labelledby for each form field',
      'heading-order': 'Use heading elements in sequential order (h1, h2, h3, etc.)',
      'landmark-unique': 'Ensure each landmark has a unique accessible name',
      'aria-hidden-focus': 'Do not use aria-hidden on focusable elements',
      'tabindex': 'Avoid positive tabindex values; use 0 or -1 instead',
    };

    return fixes[ruleId] || 'Review the accessibility documentation for this issue and implement appropriate fixes';
  }

  private getWcagCriteria(tags: string[]): string {
    // Map common axe-core tags to WCAG criteria
    const criteriaMap: Record<string, string> = {
      'wcag111': 'WCAG 2.1 A - 1.1.1',
      'wcag141': 'WCAG 2.1 A - 1.4.1',
      'wcag143': 'WCAG 2.1 AA - 1.4.3',
      'wcag211': 'WCAG 2.1 A - 2.1.1',
      'wcag241': 'WCAG 2.1 A - 2.4.1',
      'wcag244': 'WCAG 2.1 A - 2.4.4',
      'wcag246': 'WCAG 2.1 AA - 2.4.6',
      'wcag321': 'WCAG 2.1 A - 3.2.1',
      'wcag331': 'WCAG 2.1 A - 3.3.1',
      'wcag412': 'WCAG 2.1 A - 4.1.2',
    };

    for (const tag of tags) {
      if (criteriaMap[tag]) {
        return criteriaMap[tag];
      }
    }

    // Default based on level
    if (tags.includes('wcag2a')) return 'WCAG 2.1 A';
    if (tags.includes('wcag2aa')) return 'WCAG 2.1 AA';
    if (tags.includes('wcag2aaa')) return 'WCAG 2.1 AAA';
    
    return 'WCAG 2.1';
  }

  async scanWebsite(scanId: number): Promise<void> {
    const scan = await storage.getScan(scanId);
    if (!scan) {
      throw new Error('Scan not found');
    }

    try {
      // Update scan status
      await storage.updateScan(scanId, { status: 'scanning' });

      console.log("START", scanId)
      // Launch browser
      const browser = await puppeteer.launch();

      //    {
      //   headless: true, // process.env.PUPPETEER_EXECUTABLE_PATH || || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
      //   executablePath:'C:\Users\Sameer\Downloads\chromium-win64\chrome-win\chrome.exe',
      //   args: [
      //     '--no-sandbox',
      //     '--disable-setuid-sandbox',
      //     '--disable-dev-shm-usage',
      //     '--disable-gpu',
      //     '--disable-web-security',
      //     '--disable-extensions',
      //     '--no-first-run',
      //     '--disable-default-apps',
      //     '--disable-background-timer-throttling',
      //     '--disable-backgrounding-occluded-windows',
      //     '--disable-renderer-backgrounding',
      //     '--disable-audio-output',
      //     '--no-audio',
      //     '--disable-audio-input',
      //     '--disable-audio-support',
      //     '--disable-notifications',
      //     '--disable-popup-blocking',
      //     '--disable-translate',
      //     '--disable-sync',
      //     '--disable-background-networking',
      //     '--disable-features=VizDisplayCompositor',
      //   ],
      // }
      const page = await browser.newPage();
      
      // Navigate to URL
      await page.goto(scan.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Configure axe-core based on scan levels
      const axeConfig = {
        tags: scan.scanLevels.map(level => `wcag2${level.toLowerCase()}`),
      };

      // Run accessibility scan
      const axe = new AxePuppeteer(page);
      const results: AxeResult = await axe.configure(axeConfig).analyze();

      await browser.close();

      // Clear existing issues for this scan
      await storage.deleteIssuesByScanId(scanId);

      // Process violations and create issues
      const issues: InsertIssue[] = [];
      let criticalCount = 0;
      let majorCount = 0;
      let minorCount = 0;

      for (const violation of results.violations) {
        for (const node of violation.nodes) {
          const severity = this.mapImpactToSeverity(violation.impact);
          const category = this.getIssueCategory(violation.tags);
          const wcagCriteria = this.getWcagCriteria(violation.tags);
          const suggestedFix = this.generateSuggestedFix(violation.id, violation.description);

          const issue: InsertIssue = {
            scanId,
            wcagCriteria,
            severity,
            category,
            title: violation.help,
            description: violation.description,
            element: node.html,
            suggestedFix,
            impact: violation.impact,
            helpUrl: violation.helpUrl,
          };

          issues.push(issue);

          // Count by severity
          switch (severity) {
            case 'critical':
              criticalCount++;
              break;
            case 'major':
              majorCount++;
              break;
            case 'minor':
              minorCount++;
              break;
          }
        }
      }

      // Save all issues
      for (const issue of issues) {
        await storage.createIssue(issue);
      }

      // Calculate overall score and compliance level
      const totalIssues = issues.length;
      const overallScore = Math.max(0, Math.round(100 - (criticalCount * 10 + majorCount * 5 + minorCount * 2)));
      
      let complianceLevel: 'A' | 'AA' | 'AAA' | 'none' = 'none';
      if (criticalCount === 0 && majorCount === 0) {
        complianceLevel = 'AAA';
      } else if (criticalCount === 0) {
        complianceLevel = 'AA';
      } else if (criticalCount <= 2) {
        complianceLevel = 'A';
      }

      // Update scan with results
      await storage.updateScan(scanId, {
        status: 'completed',
        overallScore,
        complianceLevel,
        totalIssues,
        criticalIssues: criticalCount,
        majorIssues: majorCount,
        minorIssues: minorCount,
        completedAt: new Date(),
      });
      
      

    } catch (error) {
      console.error('Scan failed:', error);
      await storage.updateScan(scanId, { 
        status: 'failed',
        completedAt: new Date(),
      });
      throw error;
    }
   
  }}



  


export const scanner = new AccessibilityScanner();
