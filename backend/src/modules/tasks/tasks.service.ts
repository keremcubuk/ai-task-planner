import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AnalyticsResponse,
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
      const allTasks = await this.prisma.task.findMany();
      const totalTasks = allTasks.length;

      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byAssignedTo: Record<string, number> = {};
      const byAssigneePerformance: Record<string, AssigneePerformance> = {};
      const byProject: Record<string, ProjectDetails> = {};

      let totalDurationMs = 0;
      let doneCount = 0;

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

      return {
        totalTasks,
        byStatus,
        bySeverity,
        byAssignedTo,
        byAssigneePerformance,
        byProject,
        avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in getAnalytics: ${errorMessage}`);
      throw error;
    }
  }
}
