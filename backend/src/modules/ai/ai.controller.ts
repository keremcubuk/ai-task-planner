import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { OllamaService } from './ollama.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CompIssueSummaryService,
  SummaryScope,
} from './component-issue-summary.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly ollamaService: OllamaService,
    private readonly prisma: PrismaService,
    private readonly compIssueSummaryService: CompIssueSummaryService,
  ) {}

  @Post('prioritize')
  async prioritize() {
    return this.aiService.prioritizeTasks();
  }

  @Get('ollama-status')
  async getOllamaStatus() {
    const isAvailable = await this.ollamaService.isOllamaAvailable();
    return {
      available: isAvailable,
      message: isAvailable
        ? 'Ollama is running and available'
        : 'Ollama is not available. Make sure it is running on localhost:11434',
    };
  }

  @Get('component-analysis')
  async getComponentAnalysis(
    @Query('useOllama') useOllama?: string,
    @Query('model') model?: string,
  ) {
    // Include ALL tasks (active and completed) for historical analysis
    // Also include componentName for priority-based extraction
    const tasks = await this.prisma.task.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        severity: true,
        componentName: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const shouldUseOllama = useOllama !== 'false';
    const config = model ? { model } : undefined;

    const result = await this.ollamaService.analyzeTasksForComponents(
      tasks,
      shouldUseOllama,
      config,
    );

    return result;
  }

  @Get('component-issue-summary')
  async getComponentIssueSummary(
    @Query('componentName') componentName?: string,
    @Query('scope') scope?: string,
  ) {
    if (!componentName) {
      throw new BadRequestException('componentName is required');
    }
    const safeScope = this.parseScope(scope);
    const summary = await this.compIssueSummaryService.getSummary(
      componentName,
      safeScope,
    );
    if (!summary) {
      throw new NotFoundException('No cached summary found');
    }
    return summary;
  }

  @Post('component-issue-summary/generate')
  async generateComponentIssueSummary(
    @Body()
    body: {
      componentName?: string;
      scope?: string;
      force?: boolean;
      model?: string;
    },
  ) {
    if (!body?.componentName) {
      throw new BadRequestException('componentName is required');
    }
    const safeScope = this.parseScope(body.scope);
    const config = body.model ? { model: body.model } : undefined;
    return this.compIssueSummaryService.generateSummary(
      body.componentName,
      safeScope,
      Boolean(body.force),
      config,
    );
  }

  private parseScope(scope?: string): SummaryScope {
    if (scope === 'open' || scope === 'all') return scope;
    throw new BadRequestException("scope must be 'open' or 'all'");
  }
}
