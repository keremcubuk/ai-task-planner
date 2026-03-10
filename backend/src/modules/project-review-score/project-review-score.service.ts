/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  parseReviewMarkdown,
  getScoreStatus,
  parseTurkishDate,
  ParsedReviewScore,
} from './markdown-parser.util';

export interface ReviewScoreSummary {
  id: number;
  projectName: string;
  projectId: string | null;
  overallScore: number;
  status: string;
  reportDate: string;
  confluenceUrl: string | null;
  categorySummary: { name: string; score: number; maxScore: number }[];
}

export interface ReviewScoreDetail extends ReviewScoreSummary {
  categories: string;
  criticalIssues: string | null;
  strengths: string | null;
  closedIssues: string | null;
  remainingIssues: string | null;
  rawMarkdown: string;
}

export interface CrawlReviewRequest {
  url: string;
  cookies?: string;
}

export interface CrawlReviewResponse {
  success: boolean;
  projectName: string;
  overallScore: number;
  status: string;
  parsed: ParsedReviewScore;
  error?: string;
}

@Injectable()
export class ProjectReviewScoreService {
  private readonly logger = new Logger(ProjectReviewScoreService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all review scores (latest per project)
   */
  async getAllScores(): Promise<ReviewScoreSummary[]> {
    const scores = await this.prisma.projectReviewScore.findMany({
      orderBy: [{ projectName: 'asc' }, { reportDate: 'desc' }],
    });

    // Group by project, take latest
    const latestByProject = new Map<string, typeof scores[0]>();
    for (const score of scores) {
      if (!latestByProject.has(score.projectName)) {
        latestByProject.set(score.projectName, score);
      }
    }

    return Array.from(latestByProject.values()).map((s) =>
      this.toSummary(s),
    );
  }

  /**
   * Get all scores for a specific project (history)
   */
  async getProjectScores(projectName: string): Promise<ReviewScoreSummary[]> {
    const scores = await this.prisma.projectReviewScore.findMany({
      where: { projectName },
      orderBy: { reportDate: 'desc' },
    });

    return scores.map((s) => this.toSummary(s));
  }

  /**
   * Get single score detail
   */
  async getScoreDetail(
    projectName: string,
    scoreId?: number,
  ): Promise<ReviewScoreDetail | null> {
    let score;
    if (scoreId) {
      score = await this.prisma.projectReviewScore.findUnique({
        where: { id: scoreId },
      });
    } else {
      // Get latest for project
      score = await this.prisma.projectReviewScore.findFirst({
        where: { projectName },
        orderBy: { reportDate: 'desc' },
      });
    }

    if (!score) return null;

    return {
      ...this.toSummary(score),
      categories: score.categories,
      criticalIssues: score.criticalIssues,
      strengths: score.strengths,
      closedIssues: score.closedIssues,
      remainingIssues: score.remainingIssues,
      rawMarkdown: score.rawMarkdown,
    };
  }

  /**
   * Crawl a Confluence page for review score markdown content
   */
  async crawlReviewScore(
    url: string,
    cookiesJson?: string,
  ): Promise<CrawlReviewResponse> {
    try {
      // If no cookies provided, try to load saved cookies
      if (!cookiesJson) {
        const domain = new URL(url).hostname;
        const savedCookies = await this.prisma.confluenceCookie.findUnique({
          where: { domain },
        });
        if (savedCookies) {
          this.logger.log(`Using saved cookies for domain: ${domain}`);
          cookiesJson = savedCookies.cookies;
        } else {
          return {
            success: false,
            projectName: '',
            overallScore: 0,
            status: '',
            parsed: {} as ParsedReviewScore,
            error:
              'No authentication cookies found. Please login first using the Confluence cookie extraction feature.',
          };
        }
      }

      let puppeteer;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        throw new BadRequestException(
          'Puppeteer is not installed. Please run: npm install puppeteer',
        );
      }

      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
        ],
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // Load cookies
        if (cookiesJson) {
          const cookies = this.parseCookies(cookiesJson);
          if (cookies.length > 0) {
            await page.setCookie(...cookies);
          }
        }

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        // Check login redirect
        const currentUrl = page.url();
        if (this.isLoginPage(currentUrl)) {
          return {
            success: false,
            projectName: '',
            overallScore: 0,
            status: '',
            parsed: {} as ParsedReviewScore,
            error:
              'Session expired or invalid cookies. Please login again.',
          };
        }

        // Extract page content as markdown/text
        const markdownContent = await page.evaluate(() => {
          const contentEl =
            document.querySelector('#main-content') ||
            document.querySelector('[data-testid="page-content"]') ||
            document.querySelector('.wiki-content') ||
            document.querySelector('article') ||
            document.querySelector('#content-body') ||
            document.body;

          return contentEl ? (contentEl as HTMLElement).innerText : '';
        });

        // Also try to get the raw HTML content and convert key patterns
        const rawHtml = await page.evaluate(() => {
          const contentEl =
            document.querySelector('#main-content') ||
            document.querySelector('[data-testid="page-content"]') ||
            document.querySelector('.wiki-content') ||
            document.querySelector('article') ||
            document.querySelector('#content-body') ||
            document.body;

          return contentEl ? contentEl.innerHTML : '';
        });

        // Get page title
        const pageTitle = await page.evaluate(() => {
          const titleSelectors = [
            '#title-text',
            '[data-testid="title-text"]',
            'h1',
            '.page-title',
          ];
          for (const sel of titleSelectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent) return el.textContent.trim();
          }
          return '';
        });

        // Use the text content for parsing (Confluence renders markdown as HTML)
        // We need to reconstruct the markdown-like structure from the text
        const fullContent = this.reconstructMarkdown(
          markdownContent,
          rawHtml,
          pageTitle,
        );

        const parsed = parseReviewMarkdown(fullContent);

        // Use page title as fallback for project name
        if (!parsed.projectName && pageTitle) {
          parsed.projectName = pageTitle;
        }

        return {
          success: true,
          projectName: parsed.projectName,
          overallScore: parsed.overallScore,
          status: getScoreStatus(parsed.overallScore),
          parsed,
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error('Review score crawl error:', error);
      return {
        success: false,
        projectName: '',
        overallScore: 0,
        status: '',
        parsed: {} as ParsedReviewScore,
        error: `Failed to crawl review score: ${error.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Save a crawled review score to database
   */
  async saveReviewScore(
    parsed: ParsedReviewScore,
    confluenceUrl?: string,
  ): Promise<{ id: number; message: string }> {
    const reportDate = parseTurkishDate(parsed.reportDate);
    const status = getScoreStatus(parsed.overallScore);

    // Try to match with existing project in tasks
    const matchedProject = await this.findMatchingProject(parsed.projectName);

    const data = {
      projectName: parsed.projectName,
      projectId: matchedProject || null,
      overallScore: parsed.overallScore,
      previousScore: parsed.previousScore,
      status,
      reportDate,
      categories: JSON.stringify(parsed.categories),
      criticalIssues: JSON.stringify(parsed.criticalIssues),
      strengths: JSON.stringify(parsed.strengths),
      closedIssues: JSON.stringify(parsed.closedIssues),
      remainingIssues: JSON.stringify(parsed.remainingIssues),
      rawMarkdown: JSON.stringify(parsed),
      confluenceUrl: confluenceUrl || null,
    };

    // Upsert: update if same project+date exists
    const existing = await this.prisma.projectReviewScore.findFirst({
      where: {
        projectName: parsed.projectName,
        reportDate,
      },
    });

    let record;
    if (existing) {
      record = await this.prisma.projectReviewScore.update({
        where: { id: existing.id },
        data,
      });
    } else {
      record = await this.prisma.projectReviewScore.create({ data });
    }

    return {
      id: record.id,
      message: existing
        ? `Updated review score for "${parsed.projectName}"`
        : `Created review score for "${parsed.projectName}"`,
    };
  }

  /**
   * Import a raw markdown string directly (for manual/file import)
   */
  async importFromMarkdown(
    markdown: string,
    confluenceUrl?: string,
  ): Promise<{ id: number; parsed: ParsedReviewScore; message: string }> {
    const parsed = parseReviewMarkdown(markdown);

    if (!parsed.projectName) {
      throw new BadRequestException(
        'Could not extract project name from markdown',
      );
    }

    if (parsed.overallScore === 0 && parsed.categories.length === 0) {
      throw new BadRequestException(
        'Could not extract score data from markdown',
      );
    }

    const result = await this.saveReviewScore(parsed, confluenceUrl);
    return { ...result, parsed };
  }

  /**
   * Delete a review score by ID
   */
  async deleteScore(id: number): Promise<{ message: string }> {
    const score = await this.prisma.projectReviewScore.findUnique({
      where: { id },
    });

    if (!score) {
      throw new BadRequestException(`Review score with ID ${id} not found`);
    }

    await this.prisma.projectReviewScore.delete({ where: { id } });

    return {
      message: `Deleted review score for "${score.projectName}" (${score.reportDate.toISOString().split('T')[0]})`,
    };
  }

  /**
   * Find matching project name in Tasks table
   */
  private async findMatchingProject(
    projectName: string,
  ): Promise<string | null> {
    if (!projectName) return null;

    // Exact match first
    const exactMatch = await this.prisma.task.findFirst({
      where: { project: projectName },
      select: { project: true },
    });
    if (exactMatch?.project) return exactMatch.project;

    // Case-insensitive match
    const allProjects = await this.prisma.task.findMany({
      distinct: ['project'],
      where: { project: { not: null } },
      select: { project: true },
    });

    const normalizedSearch = projectName.toLowerCase().trim();
    for (const p of allProjects) {
      if (p.project && p.project.toLowerCase().trim() === normalizedSearch) {
        return p.project;
      }
    }

    // Partial match (project name contains or is contained)
    for (const p of allProjects) {
      if (!p.project) continue;
      const normalizedProject = p.project.toLowerCase().trim();
      if (
        normalizedProject.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedProject)
      ) {
        return p.project;
      }
    }

    return null;
  }

  /**
   * Reconstruct markdown-like content from Confluence page text
   */
  private reconstructMarkdown(
    textContent: string,
    _htmlContent: string,
    pageTitle: string,
  ): string {
    // Confluence renders markdown as HTML; the innerText preserves structure
    // We add markdown markers back where needed
    let content = textContent;

    // If the content doesn't have markdown markers, add basic structure
    if (!content.includes('**Proje:**') && pageTitle) {
      content = `**Proje:** ${pageTitle}\n${content}`;
    }

    return content;
  }

  private parseCookies(cookiesJson: string): any[] {
    try {
      const cookies = JSON.parse(cookiesJson);
      if (!Array.isArray(cookies)) return [];

      return cookies
        .filter(
          (cookie: any) => cookie.name && typeof cookie.name === 'string',
        )
        .map((cookie: any) => ({
          name: String(cookie.name),
          value: String(cookie.value || ''),
          domain: cookie.domain || undefined,
          path: cookie.path || '/',
          secure: Boolean(cookie.secure),
          httpOnly: Boolean(cookie.httpOnly),
          sameSite: this.normalizeSameSite(cookie.sameSite),
          ...(cookie.expires !== undefined
            ? { expires: Number(cookie.expires) }
            : {}),
        }));
    } catch {
      return [];
    }
  }

  private normalizeSameSite(sameSite: string): 'Strict' | 'Lax' | 'None' {
    if (!sameSite) return 'Lax';
    const s = sameSite.toLowerCase();
    if (s === 'strict') return 'Strict';
    if (s === 'none') return 'None';
    return 'Lax';
  }

  private isLoginPage(url: string): boolean {
    const loginPatterns = [
      '/login',
      '/signin',
      'login.microsoftonline.com',
      'accounts.google.com',
      'okta.com',
      'auth0.com',
    ];
    return loginPatterns.some((pattern) => url.includes(pattern));
  }

  private toSummary(score: any): ReviewScoreSummary {
    let categorySummary: { name: string; score: number; maxScore: number }[] =
      [];
    try {
      const cats = JSON.parse(score.categories);
      categorySummary = cats.map((c: any) => ({
        name: c.name,
        score: c.score,
        maxScore: c.maxScore,
      }));
    } catch {
      // ignore parse errors
    }

    return {
      id: score.id,
      projectName: score.projectName,
      projectId: score.projectId,
      overallScore: score.overallScore,
      status: score.status,
      reportDate: score.reportDate.toISOString
        ? score.reportDate.toISOString()
        : String(score.reportDate),
      confluenceUrl: score.confluenceUrl,
      categorySummary,
    };
  }
}
