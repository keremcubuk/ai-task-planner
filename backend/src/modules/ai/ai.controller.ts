import { Controller, Post, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { OllamaService } from './ollama.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly ollamaService: OllamaService,
    private readonly prisma: PrismaService,
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
    const tasks = await this.prisma.task.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        severity: true,
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
}
