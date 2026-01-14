import { Injectable, Logger } from '@nestjs/common';
import { ImportedTask } from '../../shared/types/common.types';
import { ImportValidatorService } from './import-validator.service';
import { ImportParserService } from './import-parser.service';
import * as crypto from 'crypto';

export interface MappedTaskData {
  title: string;
  description?: string;
  source: string;
  project?: string;
  status: string;
  severity: string;
  dueDate?: Date;
  createdAt: Date;
  externalId?: string;
  assignedTo?: string;
  openedBy?: string;
  bucketName?: string;
  componentName?: string;
  contentHash: string;
  manualPriority?: number;
  aiScore?: number;
  aiPriority?: number;
}

@Injectable()
export class ImportMapperService {
  private readonly logger = new Logger(ImportMapperService.name);

  constructor(
    private readonly validator: ImportValidatorService,
    private readonly parser: ImportParserService,
  ) {}

  mapRowToTask(row: ImportedTask, defaultSource: string): MappedTaskData | null {
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
      title = this.parser.safeCellToString(titleRaw).trim();
    }

    if (!title) {
      this.logger.warn(
        `Skipping row without title. Available columns: ${Object.keys(row).join(', ')}`,
      );
      return null;
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
      description = this.parser.safeCellToString(descriptionRaw);
    }

    const openerFromDescription =
      this.validator.extractOpenerFromDescription(description);

    const status =
      row['Status'] ||
      row['status'] ||
      row['STATUS'] ||
      row['Progress'] ||
      row['progress'] ||
      row['State'] ||
      row['state'];

    const bucketName = row['Bucket Name'] || row['bucketName'];

    const statusStr = status ? this.parser.safeCellToString(status).trim() : '';
    const bucketNameStr = bucketName
      ? this.parser.safeCellToString(bucketName).trim()
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
      const items = checklistRaw
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
    } else if (checklistRaw) {
      const str = this.parser.safeCellToString(checklistRaw);
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

    if (!project) {
      project =
        row['Project Name'] ||
        row['Project  Name'] ||
        row['project name'] ||
        row['ProjectName'] ||
        row['project'];
    }

    const sourceFromExcel = row['Source'] || row['source'];
    const source = sourceFromExcel ? String(sourceFromExcel) : defaultSource;

    const manualPriority = row['Manual Priority'] || row['manualPriority'];
    const aiScore = row['AI Score'] || row['aiScore'];
    const aiPriority = row['AI Priority'] || row['aiPriority'];

    const contentHash = this.generateContentHash(title, project, source);

    return {
      title,
      description,
      source,
      project: project ? String(project) : undefined,
      status:
        statusStr !== ''
          ? this.validator.normalizeStatus(statusStr)
          : this.validator.normalizeBucketStatus(bucketNameStr) || 'open',
      severity: this.validator.normalizeSeverity(severity),
      dueDate: this.validator.safeParseDate(dueDate),
      createdAt: this.validator.safeParseDate(createdAt) || new Date(),
      externalId: externalId ? String(externalId) : undefined,
      assignedTo: assignedTo ? String(assignedTo) : undefined,
      openedBy: openerFromDescription,
      bucketName: bucketNameStr !== '' ? bucketNameStr : undefined,
      componentName,
      contentHash,
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
}
