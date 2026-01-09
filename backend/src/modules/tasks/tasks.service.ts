import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AnalyticsResponse,
  BucketCategoryBreakdown,
  OpenedByStats,
  ProjectDetails,
  AssigneePerformance,
  getErrorMessage,
} from '../../shared/types/common.types';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data });
  }

  findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TaskWhereUniqueInput;
    where?: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.task.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { aiScore: 'desc' }, // Default sort by AI score
    });
  }

  findOne(id: number) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }

  async reorder(ids: number[]) {
    const updates = ids.map((id, index) =>
      this.prisma.task.update({
        where: { id },
        data: { position: index },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  async deleteAll() {
    return this.prisma.task.deleteMany();
  }

  async getProjectsStats() {
    const allTasks = await this.prisma.task.findMany();
    const projects: Record<
      string,
      { total: number; completed: number; critical: number }
    > = {};

    for (const task of allTasks) {
      const p = task.project || 'No Project';
      if (!projects[p]) projects[p] = { total: 0, completed: 0, critical: 0 };
      projects[p].total++;
      if (task.status === 'done' || task.status === 'completed')
        projects[p].completed++;
      if (task.severity === 'critical') projects[p].critical++;
    }

    return Object.entries(projects).map(([name, stats]) => ({
      name,
      ...stats,
      projectStatus:
        stats.total > 0 && stats.completed === stats.total
          ? 'done'
          : 'in_progress',
    }));
  }

  async getAnalytics(): Promise<AnalyticsResponse> {
    try {
      const allTasks = (await this.prisma.task.findMany()) as Array<
        Prisma.TaskGetPayload<object> & {
          openedBy?: string | null;
          bucketName?: string | null;
        }
      >;
      const totalTasks = allTasks.length;

      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byAssignedTo: Record<string, number> = {};
      const byAssigneePerformance: Record<string, AssigneePerformance> = {};
      const byProject: Record<string, ProjectDetails> = {};
      const byOpenedBy: Record<string, OpenedByStats> = {};

      const emptyBucketBreakdown = (): BucketCategoryBreakdown => ({
        done: 0,
        projectSolved: 0,
        declined: 0,
        design: 0,
        other: 0,
        none: 0,
      });

      const categorizeBucketName = (bucketName?: string | null) => {
        if (!bucketName) return 'none' as const;
        const s = String(bucketName).toLowerCase();
        if (s === 'done') return 'done' as const;
        if (s.startsWith('done') && s.includes('proje'))
          return 'projectSolved' as const;
        if (
          s.includes('declined') ||
          s.includes('discarded') ||
          s.includes('no need')
        )
          return 'declined' as const;
        if (s.includes('tasarım') || s.includes('tasarim'))
          return 'design' as const;
        return 'other' as const;
      };

      const byBucketCategory = emptyBucketBreakdown();

      let totalDurationMs = 0;
      let doneCount = 0;

      const now = new Date();
      const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const task of allTasks) {
        // Status count
        const s = task.status || 'unknown';
        byStatus[s] = (byStatus[s] || 0) + 1;

        // Severity count
        const sev = task.severity || 'unknown';
        bySeverity[sev] = (bySeverity[sev] || 0) + 1;

        // AssignedTo count
        const assignee = task.assignedTo || 'unassigned';
        byAssignedTo[assignee] = (byAssignedTo[assignee] || 0) + 1;

        const openedBy = task.openedBy || 'unknown';
        if (!byOpenedBy[openedBy]) {
          byOpenedBy[openedBy] = {
            total: 0,
            issuesPerWeek: 0,
            last30Days: 0,
            bucketBreakdown: emptyBucketBreakdown(),
          };
        }
        byOpenedBy[openedBy].total++;

        const bucketCategory = categorizeBucketName(task.bucketName);
        byBucketCategory[bucketCategory]++;
        byOpenedBy[openedBy].bucketBreakdown[bucketCategory]++;

        const createdAt = task.createdAt;
        if (createdAt) {
          const stats = byOpenedBy[openedBy];
          const createdMs = createdAt.getTime();
          const firstMs = stats.firstCreatedAt
            ? new Date(stats.firstCreatedAt).getTime()
            : undefined;
          const lastMs = stats.lastCreatedAt
            ? new Date(stats.lastCreatedAt).getTime()
            : undefined;

          if (!firstMs || createdMs < firstMs) {
            stats.firstCreatedAt = createdAt.toISOString();
          }
          if (!lastMs || createdMs > lastMs) {
            stats.lastCreatedAt = createdAt.toISOString();
          }
          if (createdAt >= cutoff30) {
            stats.last30Days++;
          }
        }

        // Project Stats
        const project = task.project || 'No Project';
        if (!byProject[project]) {
          byProject[project] = {
            total: 0,
            closed: 0,
            inProgress: 0,
            critical: 0,
            minor: 0,
          };
        }
        byProject[project].total++;
        if (s === 'done' || s === 'completed') byProject[project].closed++;
        if (s === 'in_progress') byProject[project].inProgress++;
        if (sev === 'critical') byProject[project].critical++;
        if (sev === 'minor' || sev === 'low') byProject[project].minor++;

        // Assignee Performance
        if (!byAssigneePerformance[assignee]) {
          byAssigneePerformance[assignee] = { total: 0, completed: 0 };
        }
        byAssigneePerformance[assignee].total++;
        if (s === 'done') {
          byAssigneePerformance[assignee].completed++;
        }

        // Avg time calculation
        if (task.status === 'done' && task.createdAt && task.updatedAt) {
          const duration = task.updatedAt.getTime() - task.createdAt.getTime();
          if (duration > 0) {
            totalDurationMs += duration;
            doneCount++;
          }
        }
      }

      const avgCompletionTimeDays =
        doneCount > 0 ? totalDurationMs / doneCount / (1000 * 60 * 60 * 24) : 0;

      for (const stats of Object.values(byOpenedBy)) {
        if (!stats.firstCreatedAt || !stats.lastCreatedAt) {
          stats.issuesPerWeek = stats.total;
          continue;
        }
        const first = new Date(stats.firstCreatedAt);
        const last = new Date(stats.lastCreatedAt);
        const rangeMs = Math.max(0, last.getTime() - first.getTime());
        const rangeWeeks = Math.max(1, rangeMs / (1000 * 60 * 60 * 24 * 7));
        stats.issuesPerWeek = Math.round((stats.total / rangeWeeks) * 10) / 10;
      }

      return {
        totalTasks,
        byStatus,
        bySeverity,
        byAssignedTo,
        byAssigneePerformance,
        byProject,
        byOpenedBy,
        byBucketCategory,
        avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in getAnalytics: ${errorMessage}`);
      throw error;
    }
  }
}
