import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

type ExportFilter = {
  status?: string;
  severity?: string;
};

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportToXlsx(filter?: ExportFilter, type: 'raw' | 'stats' = 'raw') {
    const where: Prisma.TaskWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.severity) where.severity = filter.severity;

    const tasks: Task[] = await this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const projectStatusByName = this.computeProjectStatusByName(tasks);

    const workbook = XLSX.utils.book_new();

    if (type === 'raw') {
      // Import servisi ile tam uyumlu sütun isimleri
      const rawData = tasks.map((t) => ({
        'Task ID': t.externalId || String(t.id),
        Title: t.title,
        Description: t.description || '',
        Status: this.formatStatus(t.status),
        Severity: this.formatSeverity(t.severity),
        'Due Date': t.dueDate ? this.formatDateForExcel(t.dueDate) : '',
        'Created Date': t.createdAt ? this.formatDateForExcel(t.createdAt) : '',
        'Assigned To': t.assignedTo || '',
        'Project Name': t.project || '',
        'Project Status': t.project ? projectStatusByName[t.project] || '' : '',
        'Manual Priority': t.manualPriority ?? '',
        Source: t.source || '',
        'AI Score': t.aiScore ?? '',
        'AI Priority': t.aiPriority ?? '',
      }));
      const worksheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    } else {
      // Stats Sheet
      const total = tasks.length;
      const byStatus = this.groupBy(tasks, 'status');
      const bySeverity = this.groupBy(tasks, 'severity');
      const byProject = this.groupBy(tasks, 'project');

      const statsData = [
        { Metric: 'Total Tasks', Value: total },
        { Metric: '', Value: '' },
        { Metric: 'By Status', Value: '' },
        ...Object.entries(byStatus).map(([k, v]) => ({
          Metric: this.formatStatus(k),
          Value: v,
        })),
        { Metric: '', Value: '' },
        { Metric: 'By Severity', Value: '' },
        ...Object.entries(bySeverity).map(([k, v]) => ({
          Metric: this.formatSeverity(k),
          Value: v,
        })),
        { Metric: '', Value: '' },
        { Metric: 'By Project', Value: '' },
        ...Object.entries(byProject).map(([k, v]) => ({
          Metric: k || 'No Project',
          Value: v,
        })),
      ];

      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

      // Detailed Data Sheet
      const detailedData = tasks.map((t) => ({
        ...t,
        status: this.formatStatus(t.status),
        severity: this.formatSeverity(t.severity),
      }));
      const dataSheet = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'All Tasks');
    }

    const fileName = `tasks_export_${type}_${Date.now()}.xlsx`;
    const exportPath = path.resolve(__dirname, '../../../../exports', fileName);

    const dir = path.dirname(exportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    XLSX.writeFile(workbook, exportPath);

    return { filePath: exportPath, fileName };
  }

  private formatStatus(status: string | null) {
    if (!status) return '';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'done') return 'Completed';
    if (status === 'open') return 'Not Started';
    return status;
  }

  private formatSeverity(severity: string | null) {
    return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : '';
  }

  private formatDateForExcel(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private groupBy(array: Task[], key: keyof Task): Record<string, number> {
    return array.reduce(
      (result: Record<string, number>, currentValue: Task) => {
        const rawKey = currentValue[key];
        const groupKey =
          rawKey === null || rawKey === undefined || rawKey === ''
            ? 'Unknown'
            : String(rawKey);
        if (!result[groupKey]) {
          result[groupKey] = 0;
        }
        result[groupKey]++;
        return result;
      },
      {},
    );
  }

  private computeProjectStatusByName(
    tasks: Task[],
  ): Record<string, 'done' | 'in_progress'> {
    const status: Record<string, { total: number; completed: number }> = {};

    for (const t of tasks) {
      const projectName = t.project;
      if (!projectName) continue;
      if (!status[projectName]) {
        status[projectName] = { total: 0, completed: 0 };
      }
      status[projectName].total++;
      if (t.status === 'done' || t.status === 'completed') {
        status[projectName].completed++;
      }
    }

    return Object.fromEntries(
      Object.entries(status).map(([name, s]) => [
        name,
        s.total > 0 && s.completed === s.total ? 'done' : 'in_progress',
      ]),
    );
  }
}
