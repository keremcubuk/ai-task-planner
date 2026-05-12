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

    // Track which tasks need Ollama processing
    const tasksNeedingOllama: typeof tasks = [];

    // Phase 1: Fast pattern-based extraction for all tasks (synchronous)
    for (const task of tasks) {
      const components = this.detector.extractComponentForTask({
        componentName: task.componentName,
        title: task.title,
        description: task.description,
      });

      if (components.length > 0) {
        // Pattern matching found components, add to map
        const isCompleted = task.status === 'done' || task.status === 'completed';
        for (const component of components) {
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
      } else if (useOllama) {
        // No pattern match found, needs Ollama
        tasksNeedingOllama.push(task);
      }
    }

    this.logger.log(
      `Pattern matching: ${tasks.length - tasksNeedingOllama.length}/${tasks.length} tasks resolved, ${tasksNeedingOllama.length} need Ollama`,
    );

    // Phase 2: Batch Ollama processing for remaining tasks
    if (tasksNeedingOllama.length > 0 && useOllama) {
      const isAvailable = await this.client.isAvailable(config);
      if (isAvailable) {
        try {
          const batchResults = await this.extractComponentsBatchWithLLM(
            tasksNeedingOllama,
            config,
          );

          // Apply Ollama results to component map
          for (const result of batchResults) {
            const task = tasksNeedingOllama.find((t) => t.id === result.taskId);
            if (!task || result.components.length === 0) continue;

            const isCompleted = task.status === 'done' || task.status === 'completed';

            for (const component of result.components) {
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
        } catch (error) {
          this.logger.warn(`Batch Ollama processing failed: ${error}`);
        }
      } else {
        this.logger.warn('Ollama not available for batch processing');
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
      `Analysis complete: ${components.length} unique components found, ${tasks.length} tasks analyzed`,
    );

    return {
      components,
      totalTasks: tasks.length,
      analyzedTasks: tasks.length,
    };
  }

  /**
   * Batch extract components from multiple tasks using chunked LLM calls
   * Process in chunks of 50 to avoid timeouts
   */
  private async extractComponentsBatchWithLLM(
    tasks: { id: number; title: string; description?: string | null }[],
    config?: Partial<OllamaConfig>,
  ): Promise<{ taskId: number; components: string[] }[]> {
    if (tasks.length === 0) return [];

    const CHUNK_SIZE = 10;
    const allResults: { taskId: number; components: string[] }[] = [];

    // Process in chunks to avoid timeout
    for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
      const chunk = tasks.slice(i, i + CHUNK_SIZE);
      const chunkResults = await this.processChunkWithLLM(chunk, i, config);
      allResults.push(...chunkResults);
      
      this.logger.log(
        `Processed chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(tasks.length / CHUNK_SIZE)} (${chunk.length} tasks)`,
      );
    }

    this.logger.log(
      `Batch LLM processed ${tasks.length} tasks in ${Math.ceil(tasks.length / CHUNK_SIZE)} chunks`,
    );
    return allResults;
  }

  private async processChunkWithLLM(
    tasks: { id: number; title: string; description?: string | null }[],
    offset: number,
    config?: Partial<OllamaConfig>,
  ): Promise<{ taskId: number; components: string[] }[]> {
    const taskTexts = tasks
      .map(
        (t, i) =>
          `[${offset + i}] ID:${t.id} | ${t.title}${t.description ? ' | ' + t.description.slice(0, 100) : ''}`,
      )
      .join('\n');

    const prompt = `Analyze the following ${tasks.length} task titles and extract UI component names for each.
UI components are: button, modal, dialog, dropdown, table, tooltip, label, input, card, etc.

Tasks:
${taskTexts}

Return ONLY a JSON object where keys are task indices [${offset}], [${offset + 1}], etc. and values are arrays of component names found.
Example: {"[${offset}]": ["button", "modal"], "[${offset + 1}]": ["table"], "[${offset + 2}]": []}

JSON response:`;

    try {
      const response = await this.client.generateCompletion(prompt, {
        ...config,
        numPredict: 1000,
        temperature: 0.1,
        timeoutMs: 120000, // 120 seconds per chunk
      });

      const cleaned = response
        .trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      try {
        const parsed = JSON.parse(cleaned);
        const results: { taskId: number; components: string[] }[] = [];

        for (let i = 0; i < tasks.length; i++) {
          const key = `[${offset + i}]`;
          const components = parsed[key];
          if (Array.isArray(components)) {
            const prioritized = this.detector.prioritizeComponents(
              components.filter((c) => typeof c === 'string'),
            );
            results.push({ taskId: tasks[i].id, components: prioritized });
          } else {
            results.push({ taskId: tasks[i].id, components: [] });
          }
        }

        return results;
      } catch {
        this.logger.warn(`Failed to parse chunk LLM response: ${cleaned}`);
        return tasks.map((t) => ({ taskId: t.id, components: [] }));
      }
    } catch (error) {
      this.logger.error(`Chunk LLM extraction failed: ${error}`);
      return tasks.map((t) => ({ taskId: t.id, components: [] }));
    }
  }
}
