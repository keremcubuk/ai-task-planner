import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as fs from 'fs';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';

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

  /**
   * Title + Project + Source kombinasyonundan benzersiz bir hash oluşturur.
   * Bu hash, farklı kaynaklardan gelen aynı task'ları tespit etmek için kullanılır.
   */
  private generateContentHash(title: string, project?: string, source?: string): string {
    const normalizedTitle = (title || '').toLowerCase().trim();
    const normalizedProject = (project || '').toLowerCase().trim();
    const normalizedSource = (source || '').toLowerCase().trim();

    const content = `${normalizedTitle}|${normalizedProject}|${normalizedSource}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async saveTasks(rawData: any[], defaultSource: string) {
    let count = 0;
    let skippedDuplicates = 0;

    for (const row of rawData) {
      // Basic mapping - can be improved with a mapping object from frontend
      const title = row['Title'] || row['title'] || row['Task Name'] || row['Subject'];
      if (!title) continue;

      const description = row['Description'] || row['description'] || row['Notes'];
      const status = row['Status'] || row['status'] || row['Progress'] || row['progress']; // open, in_progress, done
      const severity = row['Severity'] || row['severity'] || row['Priority']; // critical, major, minor
      const dueDate = row['Due Date'] || row['Due date'] || row['due date'] || row['dueDate'] || row['Deadline'];
      const createdAt = row['Created Date'] || row['createdAt'] || row['Date Created'] || row['Start Date'];
      const externalId = row['Task ID'] || row['ID'] || row['TaskId'] || row['External ID'];
      const assignedTo = row['Assigned To'] || row['assignedTo'] || row['Owner'] || row['Assignee'];

      // Project Name kolonu - Excel'den oku
      const project = row['Project Name'] || row['Project  Name'] || row['project name'] || row['ProjectName'] || row['project'];

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
        description: description ? String(description) : undefined,
        source: source,
        project: project ? String(project) : undefined,
        status: this.normalizeStatus(status),
        severity: this.normalizeSeverity(severity),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        externalId: externalId ? String(externalId) : undefined,
        assignedTo: assignedTo ? String(assignedTo) : undefined,
        contentHash: contentHash,
        manualPriority: manualPriority !== undefined && manualPriority !== '' ? Number(manualPriority) : undefined,
        aiScore: aiScore !== undefined && aiScore !== '' ? Number(aiScore) : undefined,
        aiPriority: aiPriority !== undefined && aiPriority !== '' ? Number(aiPriority) : undefined,
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
        await this.prisma.task.update({
          where: { id: existing.id },
          data: taskData,
        });

        skippedDuplicates++;
      } else {
        // Yeni task oluştur
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
