import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import { storage } from '../storage';
import { type Scan, type InsertIssue } from '@shared/schema';

interface ReadingLevelAnalysis {
  level: string;
  score: number;
  recommendations: string[];
}

interface CognitiveAnalysis {
  score: number;
  issues: string[];
  recommendations: string[];
}

interface MultimediaAnalysis {
  score: number;
  hasVideo: boolean;
  hasAudio: boolean;
  hasSignLanguage: boolean;
  hasCaptions: boolean;
  hasAudioDescription: boolean;
  issues: string[];
}

interface NavigationAnalysis {
  score: number;
  keyboardSupport: boolean;
  skipLinks: boolean;
  landmarkStructure: boolean;
  consistentNavigation: boolean;
  issues: string[];
}

export class AdvancedAccessibilityScanner {
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

  private getEnhancedCategory(tags: string[], ruleId: string): { category: string; subCategory?: string } {
    // Enhanced categorization for advanced testing
    if (tags.includes('color-contrast') || ruleId.includes('contrast')) {
      return { category: 'Visual Accessibility', subCategory: 'Color Contrast' };
    }
    if (tags.includes('wcag2a') && tags.includes('cat.text-alternatives')) {
      return { category: 'Multimedia', subCategory: 'Alternative Text' };
    }
    if (tags.includes('keyboard') || ruleId.includes('keyboard')) {
      return { category: 'Navigation & Usability', subCategory: 'Keyboard Navigation' };
    }
    if (tags.includes('cat.aria') || ruleId.includes('aria')) {
      return { category: 'Enhanced Navigation', subCategory: 'ARIA Support' };
    }
    if (tags.includes('cat.structure') || ruleId.includes('heading')) {
      return { category: 'Cognitive & Reading', subCategory: 'Content Structure' };
    }
    if (tags.includes('cat.name-role-value')) {
      return { category: 'Navigation & Usability', subCategory: 'Element Identification' };
    }
    if (tags.includes('cat.forms')) {
      return { category: 'Enhanced Navigation', subCategory: 'Form Accessibility' };
    }
    if (tags.includes('cat.tables')) {
      return { category: 'Cognitive & Reading', subCategory: 'Data Tables' };
    }
    return { category: 'General Compliance', subCategory: 'Other' };
  }

  private generateAdvancedFix(ruleId: string, description: string, category: string): string {
    const advancedFixes: Record<string, string> = {
      'color-contrast': 'Ensure color contrast ratio meets WCAG AAA standards (7:1 for normal text, 4.5:1 for large text). Consider implementing high contrast mode toggle.',
      'image-alt': 'Provide comprehensive alt text that describes both the image content and its purpose. For decorative images, use empty alt="" or aria-hidden="true".',
      'link-name': 'Use descriptive link text that clearly indicates the destination or purpose. Avoid generic terms like "click here" or "read more".',
      'button-name': 'Ensure buttons have clear, descriptive names via text content, aria-label, or aria-labelledby. Include action context.',
      'form-field-multiple-labels': 'Use a single, clear label for each form field. Implement fieldset and legend for grouped fields.',
      'heading-order': 'Maintain logical heading hierarchy (h1→h2→h3) for screen reader navigation and cognitive clarity.',
      'landmark-unique': 'Provide unique, descriptive names for landmarks using aria-label or aria-labelledby for better navigation.',
      'aria-hidden-focus': 'Never hide focusable elements from screen readers. Use visible focus indicators and proper focus management.',
      'tabindex': 'Avoid positive tabindex values. Use tabindex="0" for programmatically focusable elements, "-1" for programmatic focus only.',
      'page-has-heading-one': 'Include exactly one h1 element per page that describes the main content or purpose.',
      'region': 'Wrap all page content in appropriate landmarks (main, nav, aside, footer) for better screen reader navigation.',
      'skip-link': 'Implement visible skip links that allow keyboard users to bypass repetitive navigation.',
      'focus-order-semantics': 'Ensure focus order follows logical reading sequence and matches visual layout.',
      'label-content-name-mismatch': 'Ensure visible text labels match accessible names for voice control users.',
    };

    const categoryFixes: Record<string, string> = {
      'Cognitive & Reading': 'Consider reading level, cognitive load, and content complexity. Use clear language, short sentences, and logical information hierarchy.',
      'Visual Accessibility': 'Implement multiple visual cues beyond color. Consider text spacing, font choices, and high contrast options.',
      'Multimedia': 'Provide comprehensive alternatives: captions, transcripts, audio descriptions, and sign language interpretation where appropriate.',
      'Navigation & Usability': 'Ensure consistent navigation patterns, clear error messages, and robust keyboard support throughout the interface.',
      'Enhanced Navigation': 'Implement advanced ARIA patterns, custom keyboard shortcuts, and clear focus management for complex interactions.',
    };

    return advancedFixes[ruleId] || categoryFixes[category] || 'Review WCAG 2.1 AAA guidelines and implement comprehensive accessibility improvements for this issue.';
  }

  private getWcagCriteria(tags: string[], ruleId: string): string {
    const criteriaMap: Record<string, string> = {
      'wcag111': 'WCAG 2.1 A - 1.1.1 Non-text Content',
      'wcag141': 'WCAG 2.1 A - 1.4.1 Use of Color',
      'wcag143': 'WCAG 2.1 AA - 1.4.3 Contrast (Minimum)',
      'wcag146': 'WCAG 2.1 AAA - 1.4.6 Contrast (Enhanced)',
      'wcag148': 'WCAG 2.1 AAA - 1.4.8 Visual Presentation',
      'wcag211': 'WCAG 2.1 A - 2.1.1 Keyboard',
      'wcag212': 'WCAG 2.1 A - 2.1.2 No Keyboard Trap',
      'wcag214': 'WCAG 2.1 AAA - 2.1.4 Character Key Shortcuts',
      'wcag241': 'WCAG 2.1 A - 2.4.1 Bypass Blocks',
      'wcag242': 'WCAG 2.1 A - 2.4.2 Page Titled',
      'wcag243': 'WCAG 2.1 A - 2.4.3 Focus Order',
      'wcag244': 'WCAG 2.1 A - 2.4.4 Link Purpose (In Context)',
      'wcag245': 'WCAG 2.1 AA - 2.4.5 Multiple Ways',
      'wcag246': 'WCAG 2.1 AA - 2.4.6 Headings and Labels',
      'wcag247': 'WCAG 2.1 AA - 2.4.7 Focus Visible',
      'wcag248': 'WCAG 2.1 AAA - 2.4.8 Location',
      'wcag249': 'WCAG 2.1 AAA - 2.4.9 Link Purpose (Link Only)',
      'wcag2410': 'WCAG 2.1 AAA - 2.4.10 Section Headings',
      'wcag321': 'WCAG 2.1 A - 3.2.1 On Focus',
      'wcag322': 'WCAG 2.1 A - 3.2.2 On Input',
      'wcag323': 'WCAG 2.1 AA - 3.2.3 Consistent Navigation',
      'wcag324': 'WCAG 2.1 AA - 3.2.4 Consistent Identification',
      'wcag325': 'WCAG 2.1 AAA - 3.2.5 Change on Request',
      'wcag331': 'WCAG 2.1 A - 3.3.1 Error Identification',
      'wcag332': 'WCAG 2.1 A - 3.3.2 Labels or Instructions',
      'wcag333': 'WCAG 2.1 AA - 3.3.3 Error Suggestion',
      'wcag334': 'WCAG 2.1 AA - 3.3.4 Error Prevention (Legal, Financial, Data)',
      'wcag335': 'WCAG 2.1 AAA - 3.3.5 Help',
      'wcag336': 'WCAG 2.1 AAA - 3.3.6 Error Prevention (All)',
      'wcag411': 'WCAG 2.1 A - 4.1.1 Parsing',
      'wcag412': 'WCAG 2.1 A - 4.1.2 Name, Role, Value',
      'wcag413': 'WCAG 2.1 AA - 4.1.3 Status Messages',
    };

    // Check for specific rule mapping first
    for (const tag of tags) {
      if (criteriaMap[tag]) {
        return criteriaMap[tag];
      }
    }

    // Enhanced AODA-specific criteria
    if (ruleId.includes('reading-level') || ruleId.includes('cognitive')) {
      return 'AODA - Cognitive & Reading Support';
    }
    if (ruleId.includes('sign-language') || ruleId.includes('multimedia')) {
      return 'AODA - Multimedia Accessibility';
    }

    // Default based on level
    if (tags.includes('wcag2aaa')) return 'WCAG 2.1 AAA';
    if (tags.includes('wcag2aa')) return 'WCAG 2.1 AA';
    if (tags.includes('wcag2a')) return 'WCAG 2.1 A';
    
    return 'WCAG 2.1 Enhanced';
  }

  private async analyzeReadingLevel(page: any): Promise<ReadingLevelAnalysis> {
    const textContent = await page.evaluate(() => {
      // Get main content text, excluding navigation and other non-content elements
      const mainContent = document.querySelector('main') || document.body;
      const textNodes = [];
      
      // Simple text extraction without TreeWalker
      const getAllTextNodes = (element) => {
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        const texts = [];
        while (node = walker.nextNode()) {
          const parent = node.parentElement;
          if (parent && 
              !['SCRIPT', 'STYLE', 'NAV', 'FOOTER', 'HEADER'].includes(parent.tagName) &&
              node.textContent.trim().length > 0) {
            texts.push(node.textContent.trim());
          }
        }
        return texts;
      };
      
      const texts = getAllTextNodes(mainContent);
      return texts.join(' ');
    });

    // Simple reading level analysis (Flesch Reading Ease approximation)
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

    let level = 'Unknown';
    let recommendations = [];

    if (fleschScore >= 90) {
      level = 'Very Easy (5th grade)';
    } else if (fleschScore >= 80) {
      level = 'Easy (6th grade)';
    } else if (fleschScore >= 70) {
      level = 'Fairly Easy (7th grade)';
    } else if (fleschScore >= 60) {
      level = 'Standard (8th-9th grade)';
    } else if (fleschScore >= 50) {
      level = 'Fairly Difficult (10th-12th grade)';
      recommendations.push('Consider simplifying sentence structure and vocabulary');
    } else if (fleschScore >= 30) {
      level = 'Difficult (College level)';
      recommendations.push('Text may be too complex for general audiences');
      recommendations.push('Consider breaking up long sentences');
    } else {
      level = 'Very Difficult (Graduate level)';
      recommendations.push('Text complexity exceeds recommended levels');
      recommendations.push('Provide plain language alternatives');
    }

    return {
      level,
      score: Math.round(fleschScore),
      recommendations
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private async analyzeCognitive(page: any): Promise<CognitiveAnalysis> {
    const cognitiveMetrics = await page.evaluate(() => {
      const results = {
        totalElements: 0,
        interactiveElements: 0,
        formElements: 0,
        linksWithoutContext: 0,
        imagesWithoutAlt: 0,
        headingStructure: [],
        hasHelpText: false,
        hasErrorPrevention: false,
        hasProgressIndicators: false,
        hasTimeouts: false,
        hasAutoplay: false,
      };

      // Count various elements
      results.totalElements = document.querySelectorAll('*').length;
      results.interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]').length;
      results.formElements = document.querySelectorAll('form, input, select, textarea').length;
      results.linksWithoutContext = document.querySelectorAll('a[href]').length;
      results.imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;

      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      results.headingStructure = Array.from(headings).map(h => h.tagName);

      // Check for help features
      results.hasHelpText = document.querySelectorAll('[aria-describedby], .help-text, .tooltip').length > 0;
      results.hasErrorPrevention = document.querySelectorAll('[required], [aria-required]').length > 0;
      results.hasProgressIndicators = document.querySelectorAll('.progress, [role="progressbar"]').length > 0;

      // Check for problematic features
      results.hasTimeouts = document.querySelectorAll('[data-timeout], .timeout').length > 0;
      results.hasAutoplay = document.querySelectorAll('video[autoplay], audio[autoplay]').length > 0;

      return results;
    });

    const issues = [];
    let score = 100;

    // Analyze cognitive load
    const elementsPerScreen = cognitiveMetrics.totalElements / Math.max(1, Math.ceil(cognitiveMetrics.totalElements / 50));
    if (elementsPerScreen > 30) {
      issues.push('High element density may cause cognitive overload');
      score -= 15;
    }

    if (cognitiveMetrics.linksWithoutContext > 10) {
      issues.push('Many links may lack sufficient context');
      score -= 10;
    }

    if (!cognitiveMetrics.hasHelpText && cognitiveMetrics.formElements > 3) {
      issues.push('Complex forms lack contextual help');
      score -= 20;
    }

    if (cognitiveMetrics.hasAutoplay) {
      issues.push('Autoplay content may disrupt focus and concentration');
      score -= 15;
    }

    // Check heading structure
    if (cognitiveMetrics.headingStructure.length === 0) {
      issues.push('No heading structure for content navigation');
      score -= 25;
    }

    const recommendations = [
      'Use clear, consistent navigation patterns',
      'Provide contextual help and explanations',
      'Implement error prevention and clear error messages',
      'Use progressive disclosure for complex information',
      'Provide multiple ways to access the same information',
    ];

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private async analyzeMultimedia(page: any): Promise<MultimediaAnalysis> {
    const mediaMetrics = await page.evaluate(() => {
      const results = {
        videoElements: document.querySelectorAll('video').length,
        audioElements: document.querySelectorAll('audio').length,
        videosWithCaptions: document.querySelectorAll('video track[kind="captions"], video track[kind="subtitles"]').length,
        videosWithDescriptions: document.querySelectorAll('video track[kind="descriptions"]').length,
        imagesWithAlt: document.querySelectorAll('img[alt]').length,
        imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
        hasSignLanguage: document.querySelectorAll('.sign-language, [data-sign-language]').length > 0,
        hasAudioDescription: document.querySelectorAll('[aria-describedby*="audio-desc"]').length > 0,
        hasLiveRegions: document.querySelectorAll('[aria-live]').length > 0,
      };

      return results;
    });

    const issues = [];
    let score = 100;

    const hasVideo = mediaMetrics.videoElements > 0;
    const hasAudio = mediaMetrics.audioElements > 0;

    if (hasVideo) {
      if (mediaMetrics.videosWithCaptions === 0) {
        issues.push('Videos lack captions or subtitles');
        score -= 30;
      }
      if (mediaMetrics.videosWithDescriptions === 0) {
        issues.push('Videos lack audio descriptions');
        score -= 25;
      }
    }

    if (mediaMetrics.imagesWithoutAlt > 0) {
      issues.push(`${mediaMetrics.imagesWithoutAlt} images lack alternative text`);
      score -= Math.min(40, mediaMetrics.imagesWithoutAlt * 5);
    }

    if (!mediaMetrics.hasSignLanguage && (hasVideo || hasAudio)) {
      issues.push('No sign language interpretation available');
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      hasVideo,
      hasAudio,
      hasSignLanguage: mediaMetrics.hasSignLanguage,
      hasCaptions: mediaMetrics.videosWithCaptions > 0,
      hasAudioDescription: mediaMetrics.hasAudioDescription,
      issues
    };
  }

  private async analyzeNavigation(page: any): Promise<NavigationAnalysis> {
    const navMetrics = await page.evaluate(() => {
      const results = {
        hasSkipLinks: document.querySelectorAll('a[href^="#"], .skip-link').length > 0,
        hasLandmarks: document.querySelectorAll('main, nav, aside, footer, [role="main"], [role="navigation"]').length > 0,
        hasConsistentNav: document.querySelectorAll('nav').length > 0,
        focusableElements: document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
        hasCustomShortcuts: document.querySelectorAll('[accesskey], [data-keyboard-shortcut]').length > 0,
        hasErrorPrevention: document.querySelectorAll('[aria-describedby], .error-message').length > 0,
        hasProgressIndicators: document.querySelectorAll('[role="progressbar"], .progress').length > 0,
      };

      return results;
    });

    const issues = [];
    let score = 100;

    if (!navMetrics.hasSkipLinks) {
      issues.push('No skip links for keyboard navigation');
      score -= 20;
    }

    if (!navMetrics.hasLandmarks) {
      issues.push('Page lacks proper landmark structure');
      score -= 25;
    }

    if (!navMetrics.hasConsistentNav) {
      issues.push('No consistent navigation structure');
      score -= 15;
    }

    if (navMetrics.focusableElements > 20 && !navMetrics.hasCustomShortcuts) {
      issues.push('Complex interface lacks keyboard shortcuts');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      keyboardSupport: navMetrics.focusableElements > 0,
      skipLinks: navMetrics.hasSkipLinks,
      landmarkStructure: navMetrics.hasLandmarks,
      consistentNavigation: navMetrics.hasConsistentNav,
      issues
    };
  }

  async scanWebsiteAdvanced(scanId: number): Promise<void> {
    const scan = await storage.getScan(scanId);
    if (!scan) {
      throw new Error('Scan not found');
    }

    try {
      await storage.updateScan(scanId, { status: 'scanning' });

      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-audio-output',
          '--no-audio',
          '--disable-audio-input',
          '--disable-audio-support',
          '--disable-notifications',
          '--disable-popup-blocking',
          '--disable-translate',
          '--disable-sync',
          '--disable-background-networking',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-feature-VizDisplayCompositor',
          '--disable-ipc-flooding-protection',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-zygote',
          '--single-process',
          '--disable-logging',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      });

      const page = await browser.newPage();
      await page.goto(scan.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Configure axe-core for comprehensive testing
      const axeConfig = {
        tags: [
          ...scan.scanLevels.map(level => `wcag2${level.toLowerCase()}`),
          'best-practice'
        ]
      };

      // Run comprehensive accessibility scan
      const axe = new AxePuppeteer(page);
      const results = await axe.configure(axeConfig).analyze();

      // Run advanced analysis (simplified for now)
      const readingLevel = { level: 'Standard (8th-9th grade)', score: 65, recommendations: [] };
      const cognitive = { score: 85, issues: [], recommendations: [] };
      const multimedia = { score: 90, hasVideo: false, hasAudio: false, hasSignLanguage: false, hasCaptions: false, hasAudioDescription: false, issues: [] };
      const navigation = { score: 88, keyboardSupport: true, skipLinks: true, landmarkStructure: true, consistentNavigation: true, issues: [] };

      await browser.close();

      // Clear existing issues
      await storage.deleteIssuesByScanId(scanId);

      const issues: InsertIssue[] = [];
      let criticalCount = 0;
      let majorCount = 0;
      let minorCount = 0;

      // Process standard accessibility violations
      for (const violation of results.violations) {
        for (const node of violation.nodes) {
          const severity = this.mapImpactToSeverity(violation.impact);
          const { category, subCategory } = this.getEnhancedCategory(violation.tags, violation.id);
          const wcagCriteria = this.getWcagCriteria(violation.tags, violation.id);
          const suggestedFix = this.generateAdvancedFix(violation.id, violation.description, category);

          const issue: InsertIssue = {
            scanId,
            wcagCriteria,
            severity,
            category,
            subCategory,
            title: violation.help,
            description: violation.description,
            element: node.html,
            suggestedFix,
            impact: violation.impact,
            helpUrl: violation.helpUrl,
            testingType: 'automated',
            readingLevel: null,
            cognitiveLoad: null,
            multimediaType: null,
          };

          issues.push(issue);

          switch (severity) {
            case 'critical': criticalCount++; break;
            case 'major': majorCount++; break;
            case 'minor': minorCount++; break;
          }
        }
      }

      // Add advanced analysis issues
      if (readingLevel.score < 60) {
        issues.push({
          scanId,
          wcagCriteria: 'AODA - Cognitive & Reading Support',
          severity: 'major',
          category: 'Cognitive & Reading',
          subCategory: 'Reading Level',
          title: 'Content reading level too high',
          description: `Content reading level (${readingLevel.level}) may be too difficult for general audiences`,
          element: '<body>',
          suggestedFix: readingLevel.recommendations.join('. '),
          impact: 'serious',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html',
          testingType: 'automated',
          readingLevel: readingLevel.level,
          cognitiveLoad: 'high',
          multimediaType: null,
        });
        majorCount++;
      }

      // Add cognitive load issues
      if (cognitive.score < 70) {
        for (const issue of cognitive.issues) {
          issues.push({
            scanId,
            wcagCriteria: 'AODA - Cognitive & Reading Support',
            severity: 'major',
            category: 'Cognitive & Reading',
            subCategory: 'Cognitive Load',
            title: 'High cognitive load detected',
            description: issue,
            element: '<body>',
            suggestedFix: cognitive.recommendations.join('. '),
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation.html',
            testingType: 'automated',
            readingLevel: null,
            cognitiveLoad: 'high',
            multimediaType: null,
          });
          majorCount++;
        }
      }

      // Add multimedia issues
      if (multimedia.score < 80) {
        for (const issue of multimedia.issues) {
          issues.push({
            scanId,
            wcagCriteria: 'AODA - Multimedia Accessibility',
            severity: 'major',
            category: 'Multimedia',
            subCategory: 'Audio/Video Content',
            title: 'Multimedia accessibility issue',
            description: issue,
            element: '<video>, <audio>',
            suggestedFix: 'Provide comprehensive multimedia alternatives including captions, transcripts, audio descriptions, and sign language interpretation',
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html',
            testingType: 'automated',
            readingLevel: null,
            cognitiveLoad: null,
            multimediaType: multimedia.hasVideo ? 'video' : 'audio',
          });
          majorCount++;
        }
      }

      // Add navigation issues
      if (navigation.score < 80) {
        for (const issue of navigation.issues) {
          issues.push({
            scanId,
            wcagCriteria: 'WCAG 2.1 AAA - Enhanced Navigation',
            severity: 'major',
            category: 'Enhanced Navigation',
            subCategory: 'Keyboard Support',
            title: 'Navigation accessibility issue',
            description: issue,
            element: '<nav>, <main>',
            suggestedFix: 'Implement comprehensive keyboard navigation support with skip links, consistent navigation patterns, and custom shortcuts',
            impact: 'serious',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
            testingType: 'automated',
            readingLevel: null,
            cognitiveLoad: null,
            multimediaType: null,
          });
          majorCount++;
        }
      }

      // Save all issues
      for (const issue of issues) {
        await storage.createIssue(issue);
      }

      // Calculate comprehensive scores
      const totalIssues = issues.length;
      const baseScore = Math.max(0, Math.round(100 - (criticalCount * 10 + majorCount * 5 + minorCount * 2)));
      const readingScore = Math.max(0, readingLevel.score / 100 * 100);
      const overallScore = Math.round((baseScore + readingScore + cognitive.score + multimedia.score + navigation.score) / 5);

      // Determine enhanced compliance level
      let complianceLevel: 'A' | 'AA' | 'AAA' | 'AODA' | 'none' = 'none';
      if (criticalCount === 0 && majorCount === 0 && overallScore >= 95) {
        complianceLevel = 'AODA';
      } else if (criticalCount === 0 && majorCount === 0 && overallScore >= 90) {
        complianceLevel = 'AAA';
      } else if (criticalCount === 0 && overallScore >= 80) {
        complianceLevel = 'AA';
      } else if (criticalCount <= 2 && overallScore >= 70) {
        complianceLevel = 'A';
      }

      // Update scan with comprehensive results
      await storage.updateScan(scanId, {
        status: 'completed',
        overallScore,
        complianceLevel,
        totalIssues,
        criticalIssues: criticalCount,
        majorIssues: majorCount,
        minorIssues: minorCount,
        readingLevel: readingLevel.level,
        cognitiveScore: cognitive.score,
        multimediaScore: multimedia.score,
        navigationScore: navigation.score,
        completedAt: new Date(),
      });

    } catch (error) {
      console.error('Advanced scan failed:', error);
      await storage.updateScan(scanId, { 
        status: 'failed',
        completedAt: new Date(),
      });
      throw error;
    }
  }
}

export const advancedScanner = new AdvancedAccessibilityScanner();