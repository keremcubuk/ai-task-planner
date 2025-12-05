import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async importCsv(filePath: string) {
    const tasks: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => tasks.push(data))
        .on('end', async () => {
          try {
            const count = await this.saveTasks(tasks, 'csv');
            resolve({ count, message: 'CSV imported successfully' });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: any) => reject(error));
    });
  }

  async importXlsx(filePath: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const tasks = XLSX.utils.sheet_to_json(sheet);
      const count = await this.saveTasks(tasks, 'xlsx');
      return { count, message: 'XLSX imported successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to process XLSX file: ' + error.message);
    }
  }

  private async saveTasks(rawData: any[], source: string) {
    let count = 0;
    for (const row of rawData) {
      // Basic mapping - can be improved with a mapping object from frontend
      const title = row['Title'] || row['title'] || row['Task Name'] || row['Subject'];
      if (!title) continue;

      const description = row['Description'] || row['description'] || row['Notes'];
      const status = row['Status'] || row['status'] || row['Progress'] || row['progress']; // open, in_progress, done
      const severity = row['Severity'] || row['severity'] || row['Priority']; // critical, major, minor
      const dueDate = row['Due Date'] || row['dueDate'] || row['Deadline'];
      const createdAt = row['Created Date'] || row['createdAt'] || row['Date Created'] || row['Start Date'];
      const externalId = row['Task ID'] || row['ID'] || row['TaskId'] || row['External ID'];
      const assignedTo = row['Assigned To'] || row['assignedTo'] || row['Owner'] || row['Assignee'];

      const taskData = {
        title,
        description: description ? String(description) : undefined,
        source: source,
        status: this.normalizeStatus(status),
        severity: this.normalizeSeverity(severity),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        externalId: externalId ? String(externalId) : undefined,
        assignedTo: assignedTo ? String(assignedTo) : undefined,
      };

      if (externalId) {
        const existing = await this.prisma.task.findFirst({
          where: { externalId: String(externalId) },
        });

        if (existing) {
          await this.prisma.task.update({
            where: { id: existing.id },
            data: taskData,
          });
        } else {
          await this.prisma.task.create({ data: taskData });
        }
      } else {
        await this.prisma.task.create({ data: taskData });
      }

      count++;
    }
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

    if (s.includes('done') || s.includes('complete') || s === '100%') return 'done';
    if (s.includes('progress')) return 'in_progress';
    return 'open';
  }

  private normalizeSeverity(severity: any): string {
    if (!severity) return 'minor';
    const s = String(severity).toLowerCase();
    if (s.includes('critical') || s.includes('high')) return 'critical';
    if (s.includes('major') || s.includes('medium')) return 'major';
    return 'minor';
  }
}
