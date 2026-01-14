import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  AnalyticsResponse,
  BucketCategoryBreakdown,
  OpenedByStats,
  ProjectDetails,
  AssigneePerformance,
  AssigneeDetailedStats,
  ComponentBucketStats,
  getErrorMessage,
} from '../../shared/types/common.types';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * openedBy değerinin geçerli bir isim formatında olup olmadığını kontrol eder.
   * Geçerli format: "[İsim Soyisim] ([Şirket Adı])"
   * Şirket: "Tesla" veya "Contractor"
   */
  private isValidOpenedBy(value: string | null | undefined): boolean {
    if (!value) return false;
    const pattern = /^[\p{L}][\p{L} .'-]+\s*\([^()]{1,80}\)$/u;
    return pattern.test(value.trim());
  }

  async getTicketsByOpenerAndComponent(openedBy?: string, component?: string) {
    try {
      const where: Prisma.TaskWhereInput = {};

      if (openedBy) {
        where.openedBy = openedBy;
      }

      if (component) {
        if (component === 'Unknown') {
          where.OR = [
            { componentName: null },
            { componentName: '' },
            { componentName: 'Unknown' },
          ];
        } else {
          where.componentName = component;
        }
      }

      const tasks = await this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          severity: true,
          project: true,
          componentName: true,
          openedBy: true,
          assignedTo: true,
          bucketName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return tasks;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Error in getTicketsByOpenerAndComponent: ${errorMessage}`,
      );
      throw error;
    }
  }

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
      const byOpenerComponent: Record<string, Record<string, number>> = {};
      const byAssigneeDetailed: Record<string, AssigneeDetailedStats> = {};
      const byComponentBucket: Record<string, ComponentBucketStats> = {};

      const emptyBucketBreakdown = (): BucketCategoryBreakdown => ({
        solvedInComponent: 0,
        solvedInProject: 0,
        declined: 0,
        design: 0,
        other: 0,
        none: 0,
      });

      const categorizeBucketName = (
        bucketName?: string | null,
      ):
        | 'solvedInComponent'
        | 'solvedInProject'
        | 'declined'
        | 'design'
        | 'other'
        | 'none' => {
        if (!bucketName) return 'none';
        const s = String(bucketName).toLowerCase();
        if (s.startsWith('done') && s.includes('component'))
          return 'solvedInComponent';
        if (s.startsWith('done') && s.includes('proje'))
          return 'solvedInProject';
        if (
          s.includes('declined') ||
          s.includes('discarded') ||
          s.includes('no need')
        )
          return 'declined';
        if (s.includes('tasarım') || s.includes('tasarim')) return 'design';
        return 'other';
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

        // openedBy: sadece geçerli formattaki isimleri say (diğerleri 'unknown' olarak gruplanır)
        const rawOpenedBy = task.openedBy;
        const openedBy = this.isValidOpenedBy(rawOpenedBy)
          ? rawOpenedBy!
          : 'unknown';
        if (!byOpenedBy[openedBy]) {
          byOpenedBy[openedBy] = {
            total: 0,
            issuesPerWeek: 0,
            last30Days: 0,
            bucketBreakdown: emptyBucketBreakdown(),
            topComponents: [],
            stuckComponents: [],
            solvedInProjectComponents: [],
            completionRate: 0,
            qualityScore: 0,
            componentDiversity: 0,
          };
          byOpenerComponent[openedBy] = {};
        }
        byOpenedBy[openedBy].total++;

        // Track components per opener
        const componentName = task.componentName || 'Unknown';
        byOpenerComponent[openedBy][componentName] =
          (byOpenerComponent[openedBy][componentName] || 0) + 1;

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

        // Assignee Detailed Stats
        if (!byAssigneeDetailed[assignee]) {
          byAssigneeDetailed[assignee] = {
            total: 0,
            completed: 0,
            open: 0,
            inProgress: 0,
            avgPerMonth: 0,
          };
        }
        byAssigneeDetailed[assignee].total++;
        if (s === 'done' || s === 'completed') {
          byAssigneeDetailed[assignee].completed++;
        } else if (s === 'open') {
          byAssigneeDetailed[assignee].open++;
        } else if (s === 'in_progress') {
          byAssigneeDetailed[assignee].inProgress++;
        }
        if (createdAt) {
          const createdMs = createdAt.getTime();
          const firstMs = byAssigneeDetailed[assignee].firstTaskAt
            ? new Date(byAssigneeDetailed[assignee].firstTaskAt).getTime()
            : undefined;
          const lastMs = byAssigneeDetailed[assignee].lastTaskAt
            ? new Date(byAssigneeDetailed[assignee].lastTaskAt).getTime()
            : undefined;
          if (!firstMs || createdMs < firstMs) {
            byAssigneeDetailed[assignee].firstTaskAt = createdAt.toISOString();
          }
          if (!lastMs || createdMs > lastMs) {
            byAssigneeDetailed[assignee].lastTaskAt = createdAt.toISOString();
          }
        }

        // Component Bucket Stats
        if (!byComponentBucket[componentName]) {
          byComponentBucket[componentName] = {
            total: 0,
            bucketBreakdown: emptyBucketBreakdown(),
            solvedInProjectPercent: 0,
            solvedInComponentPercent: 0,
          };
        }
        byComponentBucket[componentName].total++;
        byComponentBucket[componentName].bucketBreakdown[bucketCategory]++;

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

      // Calculate issuesPerWeek and topComponents for each opener
      for (const [opener, stats] of Object.entries(byOpenedBy)) {
        if (!stats.firstCreatedAt || !stats.lastCreatedAt) {
          stats.issuesPerWeek = stats.total;
        } else {
          const first = new Date(stats.firstCreatedAt);
          const last = new Date(stats.lastCreatedAt);
          const rangeMs = Math.max(0, last.getTime() - first.getTime());
          const rangeWeeks = Math.max(1, rangeMs / (1000 * 60 * 60 * 24 * 7));
          stats.issuesPerWeek =
            Math.round((stats.total / rangeWeeks) * 10) / 10;
        }

        // Calculate top components for this opener
        const compCounts = byOpenerComponent[opener] || {};
        stats.topComponents = Object.entries(compCounts)
          .map(([component, count]) => ({ component, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate stuck components (high frequency of solvedInProject or open)
        const componentDetails: Record<
          string,
          {
            total: number;
            solvedInProject: number;
            open: number;
          }
        > = {};

        // Track bucket breakdown per component for this opener
        for (const task of allTasks) {
          const taskOpener = this.isValidOpenedBy(task.openedBy)
            ? task.openedBy!
            : 'unknown';
          if (taskOpener !== opener) continue;

          const comp = task.componentName || 'Unknown';
          if (!componentDetails[comp]) {
            componentDetails[comp] = {
              total: 0,
              solvedInProject: 0,
              open: 0,
            };
          }
          componentDetails[comp].total++;

          const bucket = categorizeBucketName(task.bucketName);
          if (bucket === 'solvedInProject')
            componentDetails[comp].solvedInProject++;

          const s = task.status?.toLowerCase() || 'unknown';
          if (s === 'open' || s === 'in_progress')
            componentDetails[comp].open++;
        }

        // Calculate stuck components (solvedInProject + open >= 3)
        stats.stuckComponents = Object.entries(componentDetails)
          .map(([component, details]) => ({
            component,
            total: details.total,
            solvedInProject: details.solvedInProject,
            open: details.open,
            stuckCount: details.solvedInProject + details.open,
          }))
          .filter((item) => item.stuckCount >= 3)
          .sort((a, b) => b.stuckCount - a.stuckCount)
          .slice(0, 5);

        // Calculate solved in project components (high solvedInProject rate)
        stats.solvedInProjectComponents = Object.entries(componentDetails)
          .filter(([, details]) => details.total > 2)
          .map(([component, details]) => ({
            component,
            total: details.total,
            solvedInProject: details.solvedInProject,
            solvedRate: Math.round(
              (details.solvedInProject / details.total) * 100,
            ),
          }))
          .filter((item) => item.solvedInProject > 0)
          .sort((a, b) => b.solvedRate - a.solvedRate)
          .slice(0, 5);

        // Calculate completion rate (solvedInProject + solvedInComponent / total)
        const completed =
          stats.bucketBreakdown.solvedInProject +
          stats.bucketBreakdown.solvedInComponent;
        stats.completionRate =
          stats.total > 0 ? Math.round((completed / stats.total) * 100) : 0;

        // Calculate quality score
        // Component & Design: 100 points (High quality)
        // Other: 50 points (Neutral)
        // SolvedInProject: 20 points (Low quality - simple fixes)
        // Declined: 0 points (Bad quality)
        let qualityWeightedSum = 0;
        if (stats.total > 0) {
          qualityWeightedSum += stats.bucketBreakdown.solvedInComponent * 1.0;
          qualityWeightedSum += stats.bucketBreakdown.design * 1.0;
          qualityWeightedSum += stats.bucketBreakdown.other * 0.5;
          qualityWeightedSum += stats.bucketBreakdown.solvedInProject * 0.2;
          // Declined counts as 0

          stats.qualityScore = Math.round(
            (qualityWeightedSum / stats.total) * 100,
          );
        } else {
          stats.qualityScore = 0;
        }

        // Calculate component diversity (unique components / total issues)
        const uniqueComponents = Object.keys(compCounts).length;
        stats.componentDiversity =
          stats.total > 0
            ? Math.round((uniqueComponents / stats.total) * 100)
            : 0;
      }

      // Calculate avgPerMonth for each assignee
      for (const stats of Object.values(byAssigneeDetailed)) {
        if (!stats.firstTaskAt || !stats.lastTaskAt) {
          stats.avgPerMonth = stats.completed;
        } else {
          const first = new Date(stats.firstTaskAt);
          const last = new Date(stats.lastTaskAt);
          const rangeMs = Math.max(0, last.getTime() - first.getTime());
          const rangeMonths = Math.max(1, rangeMs / (1000 * 60 * 60 * 24 * 30));
          stats.avgPerMonth =
            Math.round((stats.completed / rangeMonths) * 10) / 10;
        }
      }

      // Calculate percentages for component bucket stats
      for (const stats of Object.values(byComponentBucket)) {
        if (stats.total > 0) {
          stats.solvedInProjectPercent = Math.round(
            (stats.bucketBreakdown.solvedInProject / stats.total) * 100,
          );
          stats.solvedInComponentPercent = Math.round(
            (stats.bucketBreakdown.solvedInComponent / stats.total) * 100,
          );
        }
      }

      // Calculate project count and top projects
      const projectCount = Object.keys(byProject).length;
      const topProjectsByTickets = Object.entries(byProject)
        .map(([project, stats]) => ({ project, count: stats.total }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalTasks,
        byStatus,
        bySeverity,
        byAssignedTo,
        byAssigneePerformance,
        byAssigneeDetailed,
        byProject,
        byOpenedBy,
        byBucketCategory,
        byComponentBucket,
        avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
        projectCount,
        topProjectsByTickets,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`Error in getAnalytics: ${errorMessage}`);
      throw error;
    }
  }
}
