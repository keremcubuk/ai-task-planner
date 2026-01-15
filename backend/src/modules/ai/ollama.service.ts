import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService, OllamaConfig } from './ollama-client.service';
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

  async isOllamaAvailable(config?: Partial<OllamaConfig>): Promise<boolean> {
    return this.client.isAvailable(config);
  }

  /**
   * Extract component for a single task using priority system:
   * 1. task.componentName (if exists) - most accurate
   * 2. Title starts with component name (e.g., "Datatable componenti...")
   * 3. Title match against keywords.json
   * 4. Title scan for cfa-* / CamelCase patterns
   * 5. Description match against keywords.json
   * 6. Description scan for cfa-* / CamelCase patterns
   * 7. AI fallback with CamelCase/PascalCase priority
   * 8. Generic UI term extraction (last resort)
   */
  async extractComponentForTask(
    task: {
      componentName?: string | null;
      title: string;
      description?: string | null;
    },
    useOllama: boolean = true,
    config?: Partial<OllamaConfig>,
  ): Promise<string[]> {
    // First try the priority-based pattern matching from detector
    const patternResults = this.detector.extractComponentForTask(task);
    if (patternResults.length > 0) {
      return patternResults;
    }

    // AI fallback (Ollama) - only if enabled and available
    if (useOllama) {
      const isAvailable = await this.client.isAvailable(config);
      if (isAvailable) {
        const textToAnalyze =
          `${task.title || ''} ${task.description || ''}`.trim();
        if (textToAnalyze) {
          try {
            const llmComponents = await this.client.extractComponentsWithLLM(
              textToAnalyze,
              config,
            );
            // Filter LLM results to prefer specific over generic
            const prioritizedLlm =
              this.detector.prioritizeComponents(llmComponents);
            if (prioritizedLlm.length > 0) {
              return prioritizedLlm;
            }
          } catch (error) {
            this.logger.warn(
              `LLM extraction failed for task: ${task.title}`,
              error,
            );
          }
        }
      }
    }

    // If all methods fail, return empty array
    return [];
  }

  async analyzeTasksForComponents(
    tasks: {
      id: number;
      title: string;
      description?: string | null;
      status: string | null;
      severity?: string | null;
      componentName?: string | null;
    }[],
    useOllama: boolean = true,
    config?: Partial<OllamaConfig>,
  ): Promise<ComponentAnalysisResult> {
    this.logger.log(
      `Starting component analysis for ${tasks.length} tasks (useOllama: ${useOllama})`,
    );

    const componentMap: Map<
      string,
      {
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
    > = new Map();

    let analyzedCount = 0;

    for (const task of tasks) {
      // Use the priority-based extraction
      const components = await this.extractComponentForTask(
        {
          componentName: task.componentName,
          title: task.title,
          description: task.description,
        },
        useOllama,
        config,
      );

      analyzedCount++;

      const isCompleted = task.status === 'done' || task.status === 'completed';

      for (const component of components) {
        // Normalize to lowercase for grouping
        const normalizedComponent = component.toLowerCase().trim();
        if (!normalizedComponent) continue;

        if (!componentMap.has(normalizedComponent)) {
          componentMap.set(normalizedComponent, {
            count: 0,
            activeTasks: 0,
            completedTasks: 0,
            tasks: [],
          });
        }

        const entry = componentMap.get(normalizedComponent)!;
        entry.count++;
        if (isCompleted) {
          entry.completedTasks++;
        } else {
          entry.activeTasks++;
        }
        entry.tasks.push({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          status: task.status || 'unknown',
          severity: task.severity || undefined,
        });
      }
    }

    const components: ComponentInfo[] = Array.from(componentMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        activeTasks: data.activeTasks,
        completedTasks: data.completedTasks,
        tasks: data.tasks,
      }))
      .sort((a, b) => {
        // Sort by active tasks first (critical components), then by total count
        if (a.activeTasks !== b.activeTasks) {
          return b.activeTasks - a.activeTasks;
        }
        return b.count - a.count;
      });

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
