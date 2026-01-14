import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  ImportResult,
  getErrorMessage,
  getErrorStack,
} from '../../shared/types/common.types';
import { ImportParserService } from './import-parser.service';
import { ImportMapperService } from './import-mapper.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: ImportParserService,
    private readonly mapper: ImportMapperService,
  ) {}

  async importCsv(filePath: string): Promise<ImportResult> {
    try {
      const tasks = await this.parser.parseCsv(filePath);
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
      const tasks = await this.parser.parseXlsx(filePath);
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

  private async saveTasks(
    rawData: any[],
    defaultSource: string,
  ): Promise<number> {
    let count = 0;

    this.logger.log(`Processing ${rawData.length} rows`);

    for (const row of rawData) {
      const taskData = this.mapper.mapRowToTask(row, defaultSource);

      if (!taskData) {
        continue;
      }

      let existing = null;

      if (taskData.externalId) {
        existing = await this.prisma.task.findFirst({
          where: { externalId: taskData.externalId },
        });
      }

      if (!existing) {
        existing = await this.prisma.task.findFirst({
          where: { contentHash: taskData.contentHash },
        });
      }

      if (existing) {
        this.logger.log(
          `Updating existing task: ${taskData.title} (ID: ${existing.id})`,
        );
        await this.prisma.task.update({
          where: { id: existing.id },
          data: taskData,
        });
      } else {
        this.logger.log(`Creating new task: ${taskData.title}`);
        await this.prisma.task.create({ data: taskData });
      }

      count++;
    }

    this.logger.log(`Finished processing. Total count: ${count}`);
    return count;
  }
}
