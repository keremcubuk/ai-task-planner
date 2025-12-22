import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Task } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { LocalLlmService } from './local-llm.service';
import { AiConfig, getErrorMessage } from '../../shared/types/common.types';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private config: AiConfig;

  constructor(
    private prisma: PrismaService,
    private localLlmService: LocalLlmService,
  ) {}

  onModuleInit() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = path.join(process.cwd(), 'ai.config.json');
      const configFile = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configFile) as AiConfig;
      this.logger.log('AI Config loaded successfully');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to load AI config, using defaults: ${errorMessage}`,
      );
      this.config = {
        severityWeight: 3,
        deadlineWeight: 2,
        transitionWeight: 4,
        ageWeight: 1,
        manualWeight: 5,
        mode: 'rulebased',
      };
    }
  }

  async prioritizeTasks() {
    // Only prioritize tasks that are not done or completed
    const tasks = await this.prisma.task.findMany({
      where: {
        status: {
          notIn: ['done', 'completed'],
        },
      },
    });

    this.logger.log(
      `Prioritizing ${tasks.length} tasks (excluding done/completed)`,
    );

    const updates = [];
    const now = new Date();

    for (const task of tasks) {
      let score = 0;
      if (
        this.config.mode === 'local-llm' &&
        this.config.localLlmPath &&
        this.config.modelPath
      ) {
        score = await this.localLlmService.generatePriority(
          `${task.title}: ${task.description || ''}`,
          {
            localLlmPath: this.config.localLlmPath,
            modelPath: this.config.modelPath,
          },
        );
      } else {
        score = this.calculateRuleBasedScore(task, now);
      }

      updates.push(
        this.prisma.task.update({
          where: { id: task.id },
          data: { aiScore: score, aiPriority: Math.round(score) },
        }),
      );
    }

    await Promise.all(updates);

    return {
      message: `Prioritized ${updates.length} tasks (excluded done/completed)`,
      count: updates.length,
    };
  }

  private calculateRuleBasedScore(task: Task, now: Date): number {
    const severityFactor = this.getSeverityFactor(task.severity);
    const deadlineFactor = this.getDeadlineFactor(task.dueDate, now);
    const transitionUrgency = this.getTransitionUrgency(
      task.transitionDate,
      now,
    );
    const taskAgeDays = this.getTaskAgeDays(task.createdAt, now);
    const manualPriorityNormalised = this.getManualPriorityNormalised(
      task.manualPriority,
    );

    const score =
      this.config.severityWeight * severityFactor +
      this.config.deadlineWeight * deadlineFactor +
      this.config.transitionWeight * transitionUrgency +
      this.config.ageWeight * taskAgeDays +
      this.config.manualWeight * manualPriorityNormalised;

    return parseFloat(score.toFixed(2));
  }

  private getSeverityFactor(severity: string | null): number {
    if (!severity) return 0.2;
    const s = severity.toLowerCase();
    if (s === 'critical') return 1.0;
    if (s === 'major') return 0.6;
    if (s === 'minor') return 0.2;
    return 0.2;
  }

  private getDeadlineFactor(dueDate: Date | null, now: Date): number {
    if (!dueDate) return 0;
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 1.0; // Overdue
    if (diffDays <= 1) return 0.9;
    if (diffDays <= 3) return 0.7;
    if (diffDays <= 7) return 0.5;
    return 0.2;
  }

  private getTransitionUrgency(transitionDate: Date | null, now: Date): number {
    if (!transitionDate) return 0;
    const diffTime = transitionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 1.0;
    if (diffDays <= 2) return 0.8;
    if (diffDays <= 5) return 0.5;
    return 0.1;
  }

  private getTaskAgeDays(createdAt: Date, now: Date): number {
    const diffTime = now.getTime() - createdAt.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    // Normalize age score: cap at 30 days to return 0-1 range
    // Old implementation was returning raw days (e.g. 100) which dominated the score
    return Math.min(days, 30) / 30;
  }

  private getManualPriorityNormalised(manualPriority: number | null): number {
    if (!manualPriority) return 0;
    if (manualPriority > 5) return 1;
    if (manualPriority < 1) return 0;
    return manualPriority / 5;
  }
}
