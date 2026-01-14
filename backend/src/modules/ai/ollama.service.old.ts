import { Injectable, Logger } from '@nestjs/common';
import * as http from 'http';
import { getAllComponentNames, KNOWN_COMPONENTS } from './component-types';

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

  // Component data loaded from component-keywords.json via component-types.ts
  private readonly knownComponents: string[] = getAllComponentNames();

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

  /**
   * Match text against component-keywords.json aliases
   * Returns canonical component name if found
   * Uses word boundary matching for better accuracy
   */
  private matchKeywords(text: string): string | null {
    const lowerText = text.toLowerCase();

    // Sort components by alias length (longest first) to prefer specific matches
    const sortedComponents = [...KNOWN_COMPONENTS].sort((a, b) => {
      const maxLenA = Math.max(...a.aliases.map((al: string) => al.length));
      const maxLenB = Math.max(...b.aliases.map((al: string) => al.length));
      return maxLenB - maxLenA;
    });

    for (const component of sortedComponents) {
      for (const alias of component.aliases) {
        // Try word boundary match first (more accurate)
        const wordBoundaryRegex = new RegExp(
          `\\b${this.escapeRegex(alias)}\\b`,
          'i',
        );
        if (wordBoundaryRegex.test(lowerText)) {
          return component.name;
        }
        // Fallback to simple includes for partial matches
        if (lowerText.includes(alias)) {
          return component.name;
        }
      }
    }
    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Extract component name from title if it starts with a component reference
   * Examples:
   * - "Datatable componenti içinde..." -> "datatable"
   * - "Tooltip component header hatası" -> "tooltip"
   * - "Button'da renk sorunu" -> "button"
   */
  private extractComponentFromTitleStart(title: string): string | null {
    const lowerTitle = title.toLowerCase().trim();

    // Pattern 1: "[ComponentName] component[i]" at start
    // Matches: "Datatable componenti", "Tooltip component", etc.
    for (const comp of this.knownComponents) {
      const pattern = new RegExp(`^${comp}\\s+component[ia]?\\b`, 'i');
      if (pattern.test(lowerTitle)) {
        return comp;
      }
    }

    // Pattern 2: Component name as first word
    // This catches cases like "Tooltip header hatası" or "Datatable içinde"
    const firstWord = lowerTitle.split(/\s+/)[0];
    if (firstWord && this.knownComponents.includes(firstWord.toLowerCase())) {
      return firstWord.toLowerCase();
    }

    return null;
  }

  /**
   * Extract CamelCase/PascalCase component names from text
   * Priority: Cfa* prefixed names > other PascalCase names > generic words
   * Example: "CfaMyComponent header hatası" -> ["CfaMyComponent"]
   */
  private extractCamelCaseComponents(text: string): string[] {
    const components: string[] = [];

    // 1. Find Cfa-prefixed PascalCase names (highest priority)
    // Matches: CfaButton, CfaMyComponent, etc.
    const cfaPascalCaseRegex = /\bCfa[A-Z][a-zA-Z0-9]*\b/g;
    const cfaPascalMatches = text.match(cfaPascalCaseRegex) || [];
    components.push(...cfaPascalMatches);

    // 2. Find cfa- prefixed kebab-case names
    // Matches: cfa-button, cfa-list-section, etc.
    const cfaKebabRegex = /\bcfa-[a-z0-9-]+\b/gi;
    const cfaKebabMatches = text.match(cfaKebabRegex) || [];
    components.push(...cfaKebabMatches);

    // 3. Find @cfa-web-components imports
    // Matches: @cfa-web-components/cfa-page-header
    const importRegex = /@cfa-web-components\/([a-z0-9-]+)/gi;
    const importMatches = Array.from(text.matchAll(importRegex));
    for (const match of importMatches) {
      components.push(match[1]); // Just the component name part
    }

    // 4. Find other PascalCase component names (lower priority than Cfa*)
    // Matches: ButtonComponent, InputField, etc.
    // But NOT generic single words like Header, Footer
    const pascalCaseRegex = /\b[A-Z][a-z]+(?:[A-Z][a-z0-9]*)+\b/g;
    const pascalMatches = text.match(pascalCaseRegex) || [];
    for (const match of pascalMatches) {
      // Skip if it's already captured as Cfa* component
      if (!match.startsWith('Cfa')) {
        components.push(match);
      }
    }

    return components;
  }

  /**
   * Filter and prioritize components:
   * - Prefer Cfa* and PascalCase names (more specific)
   * - Keep longer/more specific names over shorter ones
   */
  private prioritizeComponents(components: string[]): string[] {
    if (components.length === 0) return [];

    // Normalize and deduplicate
    const normalized = Array.from(
      new Set(components.map((c) => c.trim()).filter((c) => c.length > 0)),
    );

    // Sort by specificity: Cfa* > PascalCase > others, then by length
    normalized.sort((a, b) => {
      const aIsCfa = a.startsWith('Cfa') || a.startsWith('cfa-');
      const bIsCfa = b.startsWith('Cfa') || b.startsWith('cfa-');
      const aIsPascal = /^[A-Z][a-z]+(?:[A-Z][a-z0-9]*)+$/.test(a);
      const bIsPascal = /^[A-Z][a-z]+(?:[A-Z][a-z0-9]*)+$/.test(b);

      // Cfa* components have highest priority
      if (aIsCfa && !bIsCfa) return -1;
      if (!aIsCfa && bIsCfa) return 1;

      // PascalCase components have second priority
      if (aIsPascal && !bIsPascal) return -1;
      if (!aIsPascal && bIsPascal) return 1;

      // Otherwise sort by length (longer = more specific)
      return b.length - a.length;
    });

    // Filter out components that are substrings of longer ones
    const filtered: string[] = [];
    for (const comp of normalized) {
      const lowerComp = comp.toLowerCase();
      const isDuplicate = filtered.some((existing) =>
        existing.toLowerCase().includes(lowerComp),
      );
      if (!isDuplicate) {
        filtered.push(comp);
      }
    }

    return filtered;
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
    const results: string[] = [];

    // Priority 1: Use componentName if it exists (most accurate)
    if (task.componentName && task.componentName.trim().length > 0) {
      results.push(task.componentName.trim());
      return results;
    }

    // Priority 2: Check if title starts with a component name
    // This is VERY high priority because it's explicit user intent
    // Examples: "Datatable componenti içinde...", "Tooltip header hatası"
    const titleStartComponent = this.extractComponentFromTitleStart(
      task.title || '',
    );
    if (titleStartComponent) {
      results.push(titleStartComponent);
      return results;
    }

    // Priority 3: Match title against component-keywords.json
    const titleKeywordMatch = this.matchKeywords(task.title || '');
    if (titleKeywordMatch) {
      results.push(titleKeywordMatch);
      return results;
    }

    // Priority 4: Extract CamelCase/cfa-* components from title
    const titleCamelCase = this.extractCamelCaseComponents(task.title || '');
    const prioritizedTitle = this.prioritizeComponents(titleCamelCase);
    if (prioritizedTitle.length > 0) {
      results.push(...prioritizedTitle);
      return results;
    }

    // Priority 5: Check description if title didn't yield results
    if (task.description) {
      // 5a: Check if description mentions component explicitly
      // Pattern: "[component] componentinin" or "[component] component"
      const descComponentPattern =
        /\b([a-z]+(?:table|tooltip|dropdown|select|input|button|modal|dialog|popover|menu|card|list|grid|form|chart|editor|picker|slider|switch|checkbox|radio|badge|chip|avatar|calendar|tree|panel|toolbar|navbar|sidebar|footer|header))\s+component[iu]/gi;
      const descMatch = task.description.match(descComponentPattern);
      if (descMatch && descMatch[0]) {
        const componentName = descMatch[0]
          .replace(/\s+component[iu].*/gi, '')
          .trim()
          .toLowerCase();
        if (componentName) {
          results.push(componentName);
          return results;
        }
      }

      // 5b: Match description against keywords
      const descKeywordMatch = this.matchKeywords(task.description);
      if (descKeywordMatch) {
        results.push(descKeywordMatch);
        return results;
      }

      // 5c: Extract CamelCase/cfa-* from description
      const descCamelCase = this.extractCamelCaseComponents(task.description);
      const prioritizedDesc = this.prioritizeComponents(descCamelCase);
      if (prioritizedDesc.length > 0) {
        results.push(...prioritizedDesc);
        return results;
      }
    }

    // Priority 5: AI fallback (Ollama) - only if enabled and available
    if (useOllama) {
      const isAvailable = await this.isOllamaAvailable(config);
      if (isAvailable) {
        const textToAnalyze =
          `${task.title || ''} ${task.description || ''}`.trim();
        if (textToAnalyze) {
          try {
            const llmComponents = await this.extractComponentsWithLLM(
              textToAnalyze,
              config,
            );
            // Filter LLM results to prefer specific over generic
            const prioritizedLlm = this.prioritizeComponents(llmComponents);
            if (prioritizedLlm.length > 0) {
              results.push(...prioritizedLlm);
              return results;
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
    // This means the task has no detectable component
    return results;
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
      // Use the new priority-based extraction
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

    return {
      components,
      totalTasks: tasks.length,
      analyzedTasks: analyzedCount,
    };
  }
}
