import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import {
  ImportedTask,
  ImportResult,
  getErrorMessage,
  getErrorStack,
} from '../../shared/types/common.types';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private prisma: PrismaService) {}

  private extractOpenerFromDescription(
    description?: string,
  ): string | undefined {
    if (!description) return undefined;
    const raw = String(description).trim();
    if (!raw) return undefined;

    // Pattern: İsim Soyisim (Tesla) veya İsim Soyisim (Contractor)
    // İsim: Unicode harfler, boşluk, nokta, tire, apostrof içerebilir
    // Şirket: Tesla veya Contractor
    const nameWithCompanyRegex = /^([\p{L}][\p{L} .'-]+)\s*\(([^()]{1,80})\)/u;

    const match = nameWithCompanyRegex.exec(raw);
    if (match) {
      const name = match[1].trim();
      const company = match[2].trim();

      return `${name} (${company})`;
    }

    // Eğer pattern eşleşmezse unknown döndür
    return undefined;
  }

  private safeCellToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'symbol') return value.toString();
    return '';
  }

  async importCsv(filePath: string): Promise<ImportResult> {
    const tasks: ImportedTask[] = [];

    try {
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data: ImportedTask) => tasks.push(data))
          .on('end', () => resolve())
          .on('error', (error: Error) => reject(error));
      });

      const count = await this.saveTasks(tasks, 'csv');
      return { count, message: 'CSV imported successfully' };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`CSV import failed: ${errorMessage}`, errorStack);
      throw new BadRequestException(
        `Failed to process CSV file: ${errorMessage}`,
      );
    }
  }

  async importXlsx(filePath: string): Promise<ImportResult> {
    try {
      this.logger.log(`Starting XLSX import from: ${filePath}`);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      this.logger.log(`Reading sheet: ${sheetName}`);
      const sheet = workbook.Sheets[sheetName];
      const tasks = XLSX.utils.sheet_to_json<ImportedTask>(sheet);
      this.logger.log(`Parsed ${tasks.length} rows from Excel`);
      this.logger.log(`First row sample: ${JSON.stringify(tasks[0] || {})}`);
      const count = await this.saveTasks(tasks, 'xlsx');
      this.logger.log(`Successfully saved ${count} tasks`);
      return { count, message: 'XLSX imported successfully' };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);
      this.logger.error(`XLSX import failed: ${errorMessage}`, errorStack);
      throw new BadRequestException(
        `Failed to process XLSX file: ${errorMessage}`,
      );
    }
  }

  /**
   * Title + Project + Source kombinasyonundan benzersiz bir hash oluşturur.
   * Bu hash, farklı kaynaklardan gelen aynı task'ları tespit etmek için kullanılır.
   */
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

  private async saveTasks(
    rawData: ImportedTask[],
    defaultSource: string,
  ): Promise<number> {
    let count = 0;

    this.logger.log(`Processing ${rawData.length} rows`);

    for (const row of rawData) {
      // Flexible column mapping - supports many common column name variations
      const titleRaw =
        row['Title'] ||
        row['title'] ||
        row['TITLE'] ||
        row['Task Name'] ||
        row['Task'] ||
        row['task'] ||
        row['Subject'] ||
        row['subject'] ||
        row['Name'] ||
        row['name'] ||
        row['Summary'] ||
        row['summary'];

      let title = '';
      if (titleRaw && typeof titleRaw === 'string') {
        title = titleRaw.trim();
      } else if (titleRaw) {
        title = this.safeCellToString(titleRaw).trim();
      }

      if (!title) {
        this.logger.warn(
          `Skipping row without title. Available columns: ${Object.keys(row).join(', ')}`,
        );
        continue;
      }

      const descriptionRaw =
        row['Description'] ||
        row['description'] ||
        row['DESCRIPTION'] ||
        row['Notes'] ||
        row['notes'] ||
        row['Details'] ||
        row['details'] ||
        row['Comment'] ||
        row['comment'];

      let description: string | undefined;
      if (descriptionRaw && typeof descriptionRaw === 'string') {
        description = descriptionRaw;
      } else if (descriptionRaw) {
        description = this.safeCellToString(descriptionRaw);
      }

      const openerFromDescription =
        this.extractOpenerFromDescription(description);

      const status =
        row['Status'] ||
        row['status'] ||
        row['STATUS'] ||
        row['Progress'] ||
        row['progress'] ||
        row['State'] ||
        row['state'];

      const bucketName = row['Bucket Name'] || row['bucketName'];

      const statusStr = status ? this.safeCellToString(status).trim() : '';
      const bucketNameStr = bucketName
        ? this.safeCellToString(bucketName).trim()
        : '';

      const severity =
        row['Severity'] ||
        row['severity'] ||
        row['SEVERITY'] ||
        row['Priority'] ||
        row['priority'] ||
        row['PRIORITY'] ||
        row['Importance'] ||
        row['importance'];
      const dueDate =
        row['Due Date'] ||
        row['Due date'] ||
        row['due date'] ||
        row['dueDate'] ||
        row['Deadline'];
      const createdAt =
        row['Created Date'] ||
        row['createdAt'] ||
        row['Date Created'] ||
        row['Start Date'];
      const externalId =
        row['Task ID'] || row['ID'] || row['TaskId'] || row['External ID'];
      const assignedTo =
        row['Assigned To'] ||
        row['assignedTo'] ||
        row['Owner'] ||
        row['Assignee'];

      // Checklist Items: kebab-case olanlar componentName, diğerleri project olarak ayıklanacak
      const checklistRaw =
        row['Checklist Items'] ||
        row['checklist items'] ||
        row['Component Name'] ||
        row['componentName'] ||
        row['Component'] ||
        row['component'];

      let componentName: string | undefined = undefined;
      let project: string | undefined = undefined;
      if (checklistRaw && typeof checklistRaw === 'string') {
        // Split by semicolon, trim, filter empty
        const items = checklistRaw
          .split(';')
          .map((i) => i.trim())
          .filter(Boolean);
        for (const item of items) {
          if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(item)) {
            // kebab-case: componentName
            componentName = item;
          } else {
            // not kebab-case: project
            project = item;
          }
        }
      } else if (checklistRaw) {
        // fallback: try to stringify
        const str = this.safeCellToString(checklistRaw);
        const items = str
          .split(';')
          .map((i) => i.trim())
          .filter(Boolean);
        for (const item of items) {
          if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(item)) {
            componentName = item;
          } else {
            project = item;
          }
        }
      }

      // Project Name kolonu - Excel'den oku, eğer Checklist Items'dan gelmediyse
      if (!project) {
        project =
          row['Project Name'] ||
          row['Project  Name'] ||
          row['project name'] ||
          row['ProjectName'] ||
          row['project'];
      }

      // ...project assignment is now handled above...

      // Source kolonu - Excel'de varsa onu kullan, yoksa default (xlsx/csv)
      const sourceFromExcel = row['Source'] || row['source'];
      const source = sourceFromExcel ? String(sourceFromExcel) : defaultSource;

      // AI ve Manual Priority alanları
      const manualPriority = row['Manual Priority'] || row['manualPriority'];
      const aiScore = row['AI Score'] || row['aiScore'];
      const aiPriority = row['AI Priority'] || row['aiPriority'];

      // Content hash oluştur - duplicate detection için
      const contentHash = this.generateContentHash(title, project, source);

      const taskData = {
        title,
        description: description,
        source: source,
        project: project ? String(project) : undefined,
        status:
          statusStr !== ''
            ? this.normalizeStatus(statusStr)
            : this.normalizeBucketStatus(bucketNameStr) || 'open',
        severity: this.normalizeSeverity(severity),
        dueDate: this.safeParseDate(dueDate),
        createdAt: this.safeParseDate(createdAt) || new Date(), // Default to now if invalid/missing
        externalId: externalId ? String(externalId) : undefined,
        assignedTo: assignedTo ? String(assignedTo) : undefined,
        openedBy: openerFromDescription,
        bucketName: bucketNameStr !== '' ? bucketNameStr : undefined,
        componentName: componentName,
        contentHash: contentHash,
        manualPriority:
          manualPriority !== undefined && manualPriority !== ''
            ? Number(manualPriority)
            : undefined,
        aiScore:
          aiScore !== undefined && aiScore !== '' ? Number(aiScore) : undefined,
        aiPriority:
          aiPriority !== undefined && aiPriority !== ''
            ? Number(aiPriority)
            : undefined,
      };

      // Önce externalId ile kontrol et (güvenilir kaynaklardan gelen ID)
      // Sonra contentHash ile kontrol et (scrapper gibi değişken ID'li kaynaklar için)
      let existing = null;

      if (externalId) {
        existing = await this.prisma.task.findFirst({
          where: { externalId: String(externalId) },
        });
      }

      // externalId ile bulunamadıysa, contentHash ile ara
      if (!existing) {
        existing = await this.prisma.task.findFirst({
          where: { contentHash: contentHash },
        });
      }

      if (existing) {
        // Mevcut task'ı güncelle
        this.logger.log(
          `Updating existing task: ${title} (ID: ${existing.id})`,
        );
        await this.prisma.task.update({
          where: { id: existing.id },
          data: taskData,
        });
      } else {
        // Yeni task oluştur
        this.logger.log(`Creating new task: ${title}`);
        await this.prisma.task.create({ data: taskData });
      }

      count++;
    }

    this.logger.log(`Finished processing. Total count: ${count}`);
    return count;
  }

  private normalizeStatus(status: any): string {
    if (!status) return 'open';
    // Handle numeric progress (0-100)
    if (typeof status === 'number' || !isNaN(Number(status))) {
      const num = Number(status);
      if (num === 100) return 'done';
      if (num > 0) return 'in_progress';
      return 'open';
    }

    const s = String(status).toLowerCase().trim();

    // Specific mappings requested by user
    if (s === 'completed') return 'done';
    if (s === 'in progress') return 'in_progress';
    if (s === 'not started') return 'open';

    if (s.includes('done') || s.includes('complete') || s === '100%')
      return 'done';
    if (s.includes('progress')) return 'in_progress';
    return 'open';
  }

  private normalizeBucketStatus(bucketName: unknown): string | undefined {
    if (!bucketName) return undefined;
    let raw = '';
    if (typeof bucketName === 'string') {
      raw = bucketName;
    } else if (
      typeof bucketName === 'number' ||
      typeof bucketName === 'boolean'
    ) {
      raw = String(bucketName);
    } else if (bucketName instanceof Date) {
      raw = bucketName.toISOString();
    } else {
      return undefined;
    }

    raw = raw.trim();
    if (!raw) return undefined;

    const s = raw.toLowerCase();

    // Provided bucket statuses
    // - "Done" / "Done - Proje Çözüldü" => done
    if (s === 'done' || s.startsWith('done')) return 'done';

    // - "No Need / Declined /Discarded" => done (closed), but bucketName preserves declined meaning
    if (
      s.includes('declined') ||
      s.includes('discarded') ||
      s.includes('no need')
    )
      return 'done';

    // - "Tasarım" => in progress
    if (s.includes('tasarım') || s.includes('tasarim')) return 'in_progress';

    return undefined;
  }

  private normalizeSeverity(severity: any): string {
    if (!severity) return 'minor';
    const s = String(severity).toLowerCase();
    if (s.includes('critical') || s.includes('high')) return 'critical';
    if (s.includes('major') || s.includes('medium')) return 'major';
    return 'minor';
  }

  private safeParseDate(dateValue: unknown): Date | undefined {
    if (!dateValue) return undefined;

    // Handle empty strings, null, undefined, or just whitespace
    if (typeof dateValue === 'string' && dateValue.trim() === '')
      return undefined;
    if (dateValue === '-' || dateValue === 'N/A' || dateValue === 'n/a')
      return undefined;

    // Helper function to safely convert dateValue to string
    const dateValueToString = (value: unknown): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    };

    try {
      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'number') {
        // Excel dates are stored as numbers (days since 1900-01-01)
        // If number is less than 100, it's likely not a valid Excel date
        if (dateValue < 100) {
          this.logger.warn(
            `Suspicious numeric date value: ${dateValue}, skipping`,
          );
          return undefined;
        }
        // Convert Excel date number to JavaScript Date
        // Excel epoch: 1900-01-01 (but Excel incorrectly treats 1900 as leap year)
        const excelEpoch = new Date(1900, 0, 1);
        const daysOffset = dateValue - 2; // -2 to account for Excel's leap year bug and 0-indexing
        date = new Date(
          excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000,
        );
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        this.logger.warn(
          `Invalid date type: ${typeof dateValue}, value: ${dateValueToString(dateValue)}`,
        );
        return undefined;
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        this.logger.warn(
          `Invalid date format: ${dateValueToString(dateValue)}`,
        );
        return undefined;
      }

      // Reject dates before 2000 or after 2100 as likely errors
      const year = date.getFullYear();
      if (year < 2000 || year > 2100) {
        this.logger.warn(
          `Date year ${year} is out of reasonable range (2000-2100), skipping date: ${dateValueToString(dateValue)}`,
        );
        return undefined;
      }

      return date;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.warn(
        `Error parsing date '${dateValueToString(dateValue)}': ${errorMessage}`,
      );
      return undefined;
    }
  }
}
