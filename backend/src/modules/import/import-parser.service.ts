import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import { ImportedTask } from '../../shared/types/common.types';

@Injectable()
export class ImportParserService {
  private readonly logger = new Logger(ImportParserService.name);

  async parseCsv(filePath: string): Promise<ImportedTask[]> {
    const tasks: ImportedTask[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: ImportedTask) => tasks.push(data))
        .on('end', () => resolve())
        .on('error', (error: Error) => reject(error));
    });

    return tasks;
  }

  async parseXlsx(filePath: string): Promise<ImportedTask[]> {
    this.logger.log(`Starting XLSX parse from: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    this.logger.log(`Reading sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const tasks = XLSX.utils.sheet_to_json<ImportedTask>(sheet);
    this.logger.log(`Parsed ${tasks.length} rows from Excel`);
    return tasks;
  }

  safeCellToString(value: unknown): string {
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
}
