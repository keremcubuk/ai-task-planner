/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as crypto from 'crypto';
import {
  TransformedTask,
  transformTableData,
  extractProjectStatus,
  ConfluenceTableRow,
  PageInfo,
} from './confluence.transformer';

export interface CrawlResult {
  success: boolean;
  pageTitle: string;
  projectStatus: string;
  tasks: TransformedTask[];
  error?: string;
}

export interface ConfluenceCrawlRequest {
  url: string;
  cookies?: string;
  autoLogin?: boolean;
}

export interface ConfluencePreviewResponse {
  success: boolean;
  pageTitle: string;
  projectStatus: string;
  tasks: TransformedTask[];
  totalCount: number;
  url?: string;
  error?: string;
}

export interface ConfluenceConfirmRequest {
  tasks: TransformedTask[];
}

@Injectable()
export class ConfluenceService {
  private readonly logger = new Logger(ConfluenceService.name);

  constructor(private prisma: PrismaService) {}

  async extractCookiesWithLogin(
    baseUrl: string,
  ): Promise<{ success: boolean; cookies: string; error?: string }> {
    try {
      let puppeteer;
      try {
        puppeteer = await import('puppeteer');
      } catch {
        throw new BadRequestException(
          'Puppeteer is not installed. Please run: npm install puppeteer',
        );
      }

      // Launch browser in non-headless mode for user login
      const browser = await puppeteer.default.launch({
        headless: false, // User needs to see the browser to login
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // Navigate to the base URL
        await page.goto(baseUrl, {
          waitUntil: 'networkidle2',
          timeout: 120000, // 2 minutes for user to login
        });

        this.logger.log(
          'Browser opened. Please login manually. Waiting for navigation to complete...',
        );

        // Wait for user to complete login (detect URL change from login page)
        await page.waitForFunction(
          () => {
            const url = window.location.href;
            return (
              !url.includes('/login') &&
              !url.includes('/signin') &&
              !url.includes('login.microsoftonline.com') &&
              !url.includes('accounts.google.com')
            );
          },
          { timeout: 180000 }, // 3 minutes max wait
        );

        this.logger.log('Login detected, extracting cookies...');

        // Extract all cookies
        const cookies = await page.cookies();
        const cookiesJson = JSON.stringify(cookies, null, 2);

        await browser.close();

        // Save cookies to database
        const domain = new URL(baseUrl).hostname;
        await this.saveCookies(domain, cookiesJson);
        this.logger.log(`Cookies saved for domain: ${domain}`);

        return {
          success: true,
          cookies: cookiesJson,
        };
      } catch (error) {
        await browser.close();
        throw error;
      }
    } catch (error) {
      this.logger.error('Cookie extraction error:', error);
      return {
        success: false,
        cookies: '',
        error: error.message || 'Failed to extract cookies',
      };
    }
  }

  async saveCookies(domain: string, cookiesJson: string): Promise<void> {
    await this.prisma.confluenceCookie.upsert({
      where: { domain },
      update: { cookies: cookiesJson, updatedAt: new Date() },
      create: { domain, cookies: cookiesJson },
    });
  }

  async getSavedCookies(domain: string): Promise<string | null> {
    const record = await this.prisma.confluenceCookie.findUnique({
      where: { domain },
    });
    return record?.cookies || null;
  }

  async crawlPage(
    url: string,
    cookiesJson?: string,
  ): Promise<ConfluencePreviewResponse> {
    try {
      // If no cookies provided, try to load saved cookies
      if (!cookiesJson) {
        const domain = new URL(url).hostname;
        const savedCookies = await this.getSavedCookies(domain);
        if (savedCookies) {
          this.logger.log(`Using saved cookies for domain: ${domain}`);
          cookiesJson = savedCookies;
        } else {
          this.logger.warn(
            `No saved cookies found for domain: ${domain}. Please login first.`,
          );
          return {
            success: false,
            pageTitle: '',
            projectStatus: '',
            tasks: [],
            totalCount: 0,
            error:
              'No authentication cookies found. Please login first using the cookie extraction feature.',
          };
        }
      }

      // Puppeteer'ı dinamik olarak import et (kurumsal ortamda sorun olabilir)
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

        // User agent ayarla
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // Load cookies if available
        if (cookiesJson) {
          try {
            const cookies = this.parseCookies(cookiesJson);
            if (cookies.length === 0) {
              throw new Error('No valid cookies found in the provided data');
            }
            await page.setCookie(...cookies);
          } catch (error) {
            this.logger.error('Failed to parse or set cookies:', error);
            return {
              success: false,
              pageTitle: '',
              projectStatus: '',
              tasks: [],
              totalCount: 0,
              error:
                'Invalid or expired cookies. Please login again to get fresh cookies.',
            };
          }
        }

        // Sayfaya git
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        // Check if redirected to login page
        const currentUrl = page.url();
        if (this.isLoginPage(currentUrl)) {
          return {
            success: false,
            pageTitle: '',
            projectStatus: '',
            tasks: [],
            totalCount: 0,
            error:
              'Session expired or invalid cookies. Please login again to get fresh cookies.',
          };
        }

        // Sayfa bilgilerini çıkar
        const pageInfo = await this.extractPageInfo(page);

        // Tabloları çıkar
        const tables = await this.extractTables(page);

        if (tables.length === 0) {
          throw new BadRequestException('No tables found on the page.');
        }

        // Tüm tabloları birleştir ve dönüştür
        const allRows: ConfluenceTableRow[] = [];
        for (const table of tables) {
          allRows.push(...table.rows);
        }

        const tasks = transformTableData(allRows, pageInfo);

        return {
          success: true,
          pageTitle: pageInfo.title,
          projectStatus: pageInfo.projectStatus,
          tasks,
          totalCount: tasks.length,
          url,
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error('Confluence crawl error:', error);

      // For URL parsing errors
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        throw new BadRequestException('Invalid URL format');
      }

      // For other errors, return a structured error response instead of throwing
      return {
        success: false,
        pageTitle: '',
        projectStatus: '',
        tasks: [],
        totalCount: 0,
        error: `Failed to access Confluence page: ${error.message || 'Unknown error'}. Please check your credentials and try again.`,
      };
    }
  }

  async confirmAndSaveTasks(
    tasks: TransformedTask[],
  ): Promise<{ count: number; message: string }> {
    let count = 0;
    let updated = 0;

    for (const task of tasks) {
      const title = task.taskName;
      if (!title) continue;

      const contentHash = this.generateContentHash(
        title,
        task.projectName,
        'confluence',
      );

      // Safe date parsing
      const parseDueDate = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return undefined;
          return date;
        } catch {
          return undefined;
        }
      };

      const parseCreatedDate = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return new Date(); // Default to now
          return date;
        } catch {
          return new Date();
        }
      };

      const taskData = {
        title,
        description: task.description || undefined,
        source: 'confluence',
        project: task.projectName || undefined,
        status: task.progress,
        severity: this.mapPriorityToSeverity(task.priority),
        dueDate: parseDueDate(task.dueDate),
        createdAt: parseCreatedDate(task.createdDate),
        externalId: task.taskId || undefined,
        assignedTo: task.assignedTo || undefined,
        contentHash,
      };

      // Önce externalId ile kontrol et
      let existing = null;
      if (task.taskId) {
        existing = await this.prisma.task.findFirst({
          where: { externalId: task.taskId },
        });
      }

      // externalId ile bulunamadıysa, contentHash ile ara
      if (!existing) {
        existing = await this.prisma.task.findFirst({
          where: { contentHash },
        });
      }

      if (existing) {
        await this.prisma.task.update({
          where: { id: existing.id },
          data: taskData,
        });
        updated++;
      } else {
        await this.prisma.task.create({ data: taskData });
      }

      count++;
    }

    return {
      count,
      message: `Successfully imported ${count} tasks (${updated} updated, ${count - updated} new)`,
    };
  }

  private parseCookies(cookiesJson: string): any[] {
    try {
      const cookies = JSON.parse(cookiesJson);
      if (!Array.isArray(cookies)) {
        this.logger.warn('Cookies must be an array');
        return [];
      }

      // Filter and validate cookies
      return cookies
        .filter((cookie: any) => {
          // Cookie must have name and value
          if (!cookie.name || typeof cookie.name !== 'string') {
            this.logger.warn(`Invalid cookie: missing or invalid name`);
            return false;
          }
          if (cookie.value === undefined || cookie.value === null) {
            this.logger.warn(`Invalid cookie ${cookie.name}: missing value`);
            return false;
          }
          return true;
        })
        .map((cookie: any) => {
          // Build valid cookie object for Puppeteer
          const validCookie: any = {
            name: String(cookie.name),
            value: String(cookie.value),
            domain: cookie.domain || undefined,
            path: cookie.path || '/',
            secure:
              cookie.secure !== undefined ? Boolean(cookie.secure) : false,
            httpOnly:
              cookie.httpOnly !== undefined ? Boolean(cookie.httpOnly) : false,
            sameSite: this.normalizeSameSite(cookie.sameSite),
          };

          // Add optional fields only if they exist
          if (cookie.expires !== undefined) {
            validCookie.expires = Number(cookie.expires);
          }

          return validCookie;
        });
    } catch (error) {
      this.logger.warn(`Failed to parse cookies: ${error.message}`);
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

  private async extractPageInfo(page: any): Promise<PageInfo> {
    const result = await page.evaluate(() => {
      // Sayfa başlığını bul
      const titleSelectors = [
        '#title-text',
        '[data-testid="title-text"]',
        'h1',
        '.page-title',
      ];

      let title = '';
      for (const selector of titleSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent) {
          title = el.textContent.trim();
          break;
        }
      }

      // Sayfa metnini al (proje durumu için)
      const bodyText = document.body.innerText || '';

      return { title, bodyText };
    });

    return {
      title: result.title || 'Unknown Project',
      projectStatus: extractProjectStatus(result.bodyText),
    };
  }

  private async extractTables(
    page: any,
  ): Promise<{ headers: string[]; rows: ConfluenceTableRow[] }[]> {
    return await page.evaluate(() => {
      const tables: { headers: string[]; rows: any[] }[] = [];
      const tableElements = document.querySelectorAll('table');

      tableElements.forEach((table) => {
        const headers: string[] = [];
        const rows: any[] = [];

        // Find header row - look for <th> elements or first row with <td>
        const allRows = table.querySelectorAll('tr');
        let headerRowIndex = -1;
        const headerCellIndexesToSkip: number[] = [];

        // Try to find row with <th> elements
        for (let i = 0; i < allRows.length; i++) {
          const thCells = allRows[i].querySelectorAll('th');
          if (thCells.length > 0) {
            headerRowIndex = i;
            thCells.forEach((cell, index) => {
              // Skip if this th has class numberingColumn
              if (cell.classList.contains('numberingColumn')) {
                headerCellIndexesToSkip.push(index);
                return;
              }
              const headerText = (cell.textContent || '').trim();
              const finalHeader = headerText || `Column_${index}`;
              headers.push(finalHeader);
            });
            break;
          }
        }

        // If no <th> found, use first row as header
        if (headerRowIndex === -1 && allRows.length > 0) {
          headerRowIndex = 0;
          const firstRowCells = allRows[0].querySelectorAll('td');
          firstRowCells.forEach((cell, index) => {
            if (cell.classList.contains('numberingColumn')) {
              headerCellIndexesToSkip.push(index);
              return;
            }
            const headerText = (cell.textContent || '').trim();
            headers.push(headerText || `Column_${index}`);
          });
        }

        // Skip if no headers found
        if (headers.length === 0) {
          return;
        }

        // Extract data rows (skip header row)
        allRows.forEach((row, index) => {
          if (index <= headerRowIndex) return; // Skip header row

          const cells = row.querySelectorAll('td');
          if (cells.length === 0) return;

          const rowData: any = {};
          let dataCellIndex = 0;
          for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
            const cell = cells[cellIndex];
            if (
              headerCellIndexesToSkip.includes(cellIndex) ||
              cell.classList.contains('numberingColumn')
            ) {
              continue;
            }
            const cellValue = (cell.textContent || '').trim();
            const headerName = headers[dataCellIndex];
            if (headerName) {
              rowData[headerName] = cellValue;
            }
            dataCellIndex++;
          }

          // Skip empty rows
          const hasContent = Object.values(rowData).some(
            (v: unknown) => v && typeof v === 'string' && v.trim(),
          );
          if (hasContent) {
            rows.push(rowData);
          }
        });

        if (rows.length > 0) {
          tables.push({ headers, rows });
        }
      });

      return tables;
    });
  }

  private generateContentHash(
    title: string,
    project?: string,
    source?: string,
  ): string {
    const normalizedTitle = (title || '').toLowerCase().trim();
    const normalizedProject = (project || '').toLowerCase().trim();
    const normalizedSource = (source || '').toLowerCase().trim();

    const content = `${normalizedTitle}|${normalizedProject}|${normalizedSource}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private mapPriorityToSeverity(priority: string): string {
    const map: Record<string, string> = {
      critical: 'critical',
      high: 'critical',
      medium: 'major',
      low: 'minor',
    };
    return map[priority?.toLowerCase()] || 'minor';
  }
}
