import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { ComponentDetectorService } from './component-detector.service';

export interface ComponentAnalysisResult {
  components: ComponentInfo[];
  totalTasks: number;
  analyzedTasks: number;
}

export interface ComponentInfo {
  name: string;
  count: number;
  activeTasks: number;
  completedTasks: number;
  tasks: {
    id: number;
    title: string;
    description?: string;
    status: string;
    severity?: string;
  }[];
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor(
    private readonly client: OllamaClientService,
    private readonly detector: ComponentDetectorService,
  ) {}

  async isOllamaAvailable(config?: any): Promise<boolean> {
    return this.client.isAvailable(config);
  }

  async analyzeTasksForComponents(
    tasks: any[],
    useOllama: boolean,
    config?: any,
  ): Promise<ComponentAnalysisResult> {
    this.logger.log(
      `Starting component analysis for ${tasks.length} tasks (useOllama: ${useOllama})`,
    );

    const componentMap = new Map<string, ComponentInfo>();
    let analyzedCount = 0;

    for (const task of tasks) {
      const text = `${task.title || ''} ${task.description || ''}`.trim();
      if (!text) continue;

      let detectedComponents: string[] = [];

      if (useOllama) {
        try {
          const llmComponents = await this.client.extractComponentsWithLLM(
            text,
            config,
          );
          detectedComponents.push(...llmComponents);
        } catch (error) {
          this.logger.warn(
            `LLM extraction failed for task ${task.id}, falling back to pattern matching`,
          );
        }
      }

      if (detectedComponents.length === 0) {
        detectedComponents = this.detector.detectComponents(text, task.title);
      }

      if (detectedComponents.length > 0) {
        analyzedCount++;

        for (const componentName of detectedComponents) {
          const normalizedName = componentName.toLowerCase().trim();
          if (!normalizedName) continue;

          if (!componentMap.has(normalizedName)) {
            componentMap.set(normalizedName, {
              name: normalizedName,
              count: 0,
              activeTasks: 0,
              completedTasks: 0,
              tasks: [],
            });
          }

          const info = componentMap.get(normalizedName)!;
          info.count++;

          const isActive =
            task.status !== 'done' && task.status !== 'completed';
          if (isActive) {
            info.activeTasks++;
          } else {
            info.completedTasks++;
          }

          info.tasks.push({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            severity: task.severity,
          });
        }
      }
    }

    const components = Array.from(componentMap.values()).sort(
      (a, b) => b.activeTasks - a.activeTasks || b.count - a.count,
    );

    this.logger.log(
      `Analysis complete: ${components.length} unique components found, ${analyzedCount} tasks analyzed`,
    );

    return {
      components,
      totalTasks: tasks.length,
      analyzedTasks: analyzedCount,
    };
  }
}
