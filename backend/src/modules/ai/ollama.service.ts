import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

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

  private readonly defaultConfig: OllamaConfig = {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2',
  };

  // Common UI component patterns for fallback detection
  private readonly componentPatterns: RegExp[] = [
    /\b(bottom\s*sheet)\b/gi,
    /\b(modal)\b/gi,
    /\b(dialog)\b/gi,
    /\b(popup)\b/gi,
    /\b(toast)\b/gi,
    /\b(snackbar)\b/gi,
    /\b(alert)\b/gi,
    /\b(button)\b/gi,
    /\b(input)\b/gi,
    /\b(text\s*field)\b/gi,
    /\b(text\s*input)\b/gi,
    /\b(dropdown)\b/gi,
    /\b(select)\b/gi,
    /\b(checkbox)\b/gi,
    /\b(radio\s*button)\b/gi,
    /\b(switch)\b/gi,
    /\b(toggle)\b/gi,
    /\b(slider)\b/gi,
    /\b(progress\s*bar)\b/gi,
    /\b(spinner)\b/gi,
    /\b(loader)\b/gi,
    /\b(loading)\b/gi,
    /\b(card)\b/gi,
    /\b(list)\b/gi,
    /\b(table)\b/gi,
    /\b(grid)\b/gi,
    /\b(tab)\b/gi,
    /\b(tabs)\b/gi,
    /\b(tab\s*bar)\b/gi,
    /\b(navigation)\b/gi,
    /\b(nav\s*bar)\b/gi,
    /\b(navbar)\b/gi,
    /\b(header)\b/gi,
    /\b(footer)\b/gi,
    /\b(sidebar)\b/gi,
    /\b(menu)\b/gi,
    /\b(drawer)\b/gi,
    /\b(accordion)\b/gi,
    /\b(carousel)\b/gi,
    /\b(image)\b/gi,
    /\b(avatar)\b/gi,
    /\b(badge)\b/gi,
    /\b(chip)\b/gi,
    /\b(tag)\b/gi,
    /\b(label)\b/gi,
    /\b(label\s*value)\b/gi,
    /\b(tooltip)\b/gi,
    /\b(icon)\b/gi,
    /\b(form)\b/gi,
    /\b(date\s*picker)\b/gi,
    /\b(time\s*picker)\b/gi,
    /\b(color\s*picker)\b/gi,
    /\b(file\s*upload)\b/gi,
    /\b(search\s*bar)\b/gi,
    /\b(search\s*field)\b/gi,
    /\b(pagination)\b/gi,
    /\b(stepper)\b/gi,
    /\b(breadcrumb)\b/gi,
    /\b(divider)\b/gi,
    /\b(separator)\b/gi,
    /\b(skeleton)\b/gi,
    /\b(placeholder)\b/gi,
    /\b(empty\s*state)\b/gi,
    /\b(error\s*state)\b/gi,
    /\b(success\s*state)\b/gi,
    /\b(banner)\b/gi,
    /\b(notification)\b/gi,
    /\b(fab)\b/gi,
    /\b(floating\s*action\s*button)\b/gi,
    /\b(scroll\s*view)\b/gi,
    /\b(webview)\b/gi,
    /\b(map)\b/gi,
    /\b(chart)\b/gi,
    /\b(graph)\b/gi,
    /\b(video\s*player)\b/gi,
    /\b(audio\s*player)\b/gi,
    /\b(player)\b/gi,
    /\b(rating)\b/gi,
    /\b(star\s*rating)\b/gi,
    /\b(review)\b/gi,
    /\b(comment)\b/gi,
    /\b(text\s*area)\b/gi,
    /\b(rich\s*text)\b/gi,
    /\b(editor)\b/gi,
    /\b(code\s*editor)\b/gi,
    /\b(syntax\s*highlighter)\b/gi,
    /\b(markdown)\b/gi,
    /\b(preview)\b/gi,
    /\b(thumbnail)\b/gi,
    /\b(gallery)\b/gi,
    /\b(lightbox)\b/gi,
    /\b(overlay)\b/gi,
    /\b(backdrop)\b/gi,
    /\b(sheet)\b/gi,
    /\b(panel)\b/gi,
    /\b(pane)\b/gi,
    /\b(section)\b/gi,
    /\b(container)\b/gi,
    /\b(wrapper)\b/gi,
    /\b(layout)\b/gi,
    /\b(view)\b/gi,
    /\b(screen)\b/gi,
    /\b(page)\b/gi,
    /\b(component)\b/gi,
    /\b(widget)\b/gi,
  ];

  async isOllamaAvailable(config?: Partial<OllamaConfig>): Promise<boolean> {
    const baseUrl = config?.baseUrl || this.defaultConfig.baseUrl;

    return new Promise((resolve) => {
      const url = new URL(baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/tags',
        method: 'GET',
        timeout: 3000,
      };

      const req = http.request(options, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  async extractComponentsWithLLM(
    text: string,
    config?: Partial<OllamaConfig>,
  ): Promise<string[]> {
    const baseUrl = config?.baseUrl || this.defaultConfig.baseUrl;
    const model = config?.model || this.defaultConfig.model;

    const prompt = `Analyze the following text and extract UI component names mentioned in it. 
UI components are things like: button, modal, dialog, bottom sheet, label, input, dropdown, card, list, table, etc.
Return ONLY a JSON array of component names found, nothing else. If no components found, return [].
Example output: ["bottom sheet", "label value", "button"]

Text to analyze: "${text}"

JSON array:`;

    return new Promise((resolve) => {
      const url = new URL(baseUrl);
      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0,
          num_predict: 100,
        },
      });

      const options = {
        hostname: url.hostname,
        port: url.port || 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 30000,
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data) as { response?: string };
            const responseText: string = response.response || '';

            // Try to extract JSON array from response
            const jsonMatch = responseText.match(/\[.*?\]/s);
            if (jsonMatch) {
              const components = JSON.parse(jsonMatch[0]) as unknown;
              if (Array.isArray(components)) {
                resolve(
                  components
                    .filter((c): c is string => typeof c === 'string')
                    .map((c) => c.toLowerCase().trim())
                    .filter((c) => c.length > 0),
                );
                return;
              }
            }
            resolve([]);
          } catch {
            this.logger.warn('Failed to parse LLM response');
            resolve([]);
          }
        });
      });

      req.on('error', (error) => {
        this.logger.warn('LLM request failed:', error);
        resolve([]);
      });

      req.on('timeout', () => {
        req.destroy();
        this.logger.warn('LLM request timed out');
        resolve([]);
      });

      req.write(postData);
      req.end();
    });
  }

  extractComponentsWithPatterns(text: string): string[] {
    const components: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    for (const pattern of this.componentPatterns) {
      const matches = lowerText.match(pattern);
      if (matches) {
        for (const match of matches) {
          components.add(match.toLowerCase().trim());
        }
      }
    }

    return Array.from(components);
  }

  async extractComponents(
    text: string,
    useOllama: boolean = true,
    config?: Partial<OllamaConfig>,
  ): Promise<string[]> {
    if (useOllama) {
      const isAvailable = await this.isOllamaAvailable(config);
      if (isAvailable) {
        const llmComponents = await this.extractComponentsWithLLM(text, config);
        if (llmComponents.length > 0) {
          return llmComponents;
        }
      } else {
        this.logger.warn(
          'Ollama is not available, falling back to pattern matching',
        );
      }
    }

    return this.extractComponentsWithPatterns(text);
  }

  async analyzeTasksForComponents(
    tasks: {
      id: number;
      title: string;
      description?: string | null;
      status: string | null;
      severity?: string | null;
    }[],
    useOllama: boolean = true,
    config?: Partial<OllamaConfig>,
  ): Promise<ComponentAnalysisResult> {
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
      const textToAnalyze = `${task.title} ${task.description || ''}`.trim();
      if (!textToAnalyze) continue;

      const components = await this.extractComponents(
        textToAnalyze,
        useOllama,
        config,
      );
      analyzedCount++;

      const isCompleted = task.status === 'done' || task.status === 'completed';

      for (const component of components) {
        const normalizedComponent = component.toLowerCase().trim();
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

    return {
      components,
      totalTasks: tasks.length,
      analyzedTasks: analyzedCount,
    };
  }
}
