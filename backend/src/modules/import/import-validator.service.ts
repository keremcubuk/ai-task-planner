import { Injectable, Logger } from '@nestjs/common';
import { getErrorMessage } from '../../shared/types/common.types';

@Injectable()
export class ImportValidatorService {
  private readonly logger = new Logger(ImportValidatorService.name);

  extractOpenerFromDescription(description?: string): string | undefined {
    if (!description) return undefined;
    const raw = String(description).trim();
    if (!raw) return undefined;

    const nameWithCompanyRegex = /^([\p{L}][\p{L} .'-]+)\s*\(([^()]{1,80})\)/u;

    const match = nameWithCompanyRegex.exec(raw);
    if (match) {
      const name = match[1].trim();
      const company = match[2].trim();
      return `${name} (${company})`;
    }

    return undefined;
  }

  normalizeStatus(status: any): string {
    if (!status) return 'open';
    
    if (typeof status === 'number' || !isNaN(Number(status))) {
      const num = Number(status);
      if (num === 100) return 'done';
      if (num > 0) return 'in_progress';
      return 'open';
    }

    const s = String(status).toLowerCase().trim();

    if (s === 'completed') return 'done';
    if (s === 'in progress') return 'in_progress';
    if (s === 'not started') return 'open';

    if (s.includes('done') || s.includes('complete') || s === '100%')
      return 'done';
    if (s.includes('progress')) return 'in_progress';
    return 'open';
  }

  normalizeBucketStatus(bucketName: unknown): string | undefined {
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

    if (s === 'done' || s.startsWith('done')) return 'done';

    if (
      s.includes('declined') ||
      s.includes('discarded') ||
      s.includes('no need')
    )
      return 'done';

    if (s.includes('tasarım') || s.includes('tasarim')) return 'in_progress';

    return undefined;
  }

  normalizeSeverity(severity: any): string {
    if (!severity) return 'minor';
    const s = String(severity).toLowerCase();
    if (s.includes('critical') || s.includes('high')) return 'critical';
    if (s.includes('major') || s.includes('medium')) return 'major';
    return 'minor';
  }

  safeParseDate(dateValue: unknown): Date | undefined {
    if (!dateValue) return undefined;

    if (typeof dateValue === 'string' && dateValue.trim() === '')
      return undefined;
    if (dateValue === '-' || dateValue === 'N/A' || dateValue === 'n/a')
      return undefined;

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
        if (dateValue < 100) {
          this.logger.warn(
            `Suspicious numeric date value: ${dateValue}, skipping`,
          );
          return undefined;
        }
        const excelEpoch = new Date(1900, 0, 1);
        const daysOffset = dateValue - 2;
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

      if (isNaN(date.getTime())) {
        this.logger.warn(
          `Invalid date format: ${dateValueToString(dateValue)}`,
        );
        return undefined;
      }

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
