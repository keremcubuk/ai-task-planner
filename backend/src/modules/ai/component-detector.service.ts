import { Injectable, Logger } from '@nestjs/common';
import { getAllComponentNames, KNOWN_COMPONENTS } from './component-types';

@Injectable()
export class ComponentDetectorService {
  private readonly logger = new Logger(ComponentDetectorService.name);
  private readonly knownComponents: string[] = getAllComponentNames();

  /**
   * Extract component name from task title using pattern matching
   */
  extractComponentFromTitle(title: string): string | null {
    if (!title) return null;
    const lowerTitle = title.toLowerCase().trim();

    // Pattern 1: "[ComponentName] component[i]" at start
    for (const comp of this.knownComponents) {
      const pattern = new RegExp(`^${comp}\\s+component[ia]?\\b`, 'i');
      if (pattern.test(lowerTitle)) {
        return comp;
      }
    }

    // Pattern 2: Component name as first word
    const firstWord = lowerTitle.split(/\s+/)[0];
    if (firstWord && this.knownComponents.includes(firstWord.toLowerCase())) {
      return firstWord.toLowerCase();
    }

    return null;
  }

  /**
   * Extract CamelCase/PascalCase component names from text
   * Priority: Cfa* prefixed names > other PascalCase names > generic words
   */
  extractCamelCaseComponents(text: string): string[] {
    const components: string[] = [];

    // 1. Find Cfa-prefixed PascalCase names (highest priority)
    const cfaPascalCaseRegex = /\bCfa[A-Z][a-zA-Z0-9]*\b/g;
    const cfaPascalMatches = text.match(cfaPascalCaseRegex) || [];
    components.push(...cfaPascalMatches);

    // 2. Find cfa- prefixed kebab-case names
    const cfaKebabRegex = /\bcfa-[a-z0-9-]+\b/gi;
    const cfaKebabMatches = text.match(cfaKebabRegex) || [];
    components.push(...cfaKebabMatches);

    // 3. Find @cfa-web-components imports
    const importRegex = /@cfa-web-components\/([a-z0-9-]+)/gi;
    const importMatches = Array.from(text.matchAll(importRegex));
    for (const match of importMatches) {
      components.push(match[1]);
    }

    // 4. Find other PascalCase names (lower priority)
    const pascalCaseRegex = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g;
    const pascalMatches = text.match(pascalCaseRegex) || [];
    const filteredPascal = pascalMatches.filter(
      (name) =>
        !name.startsWith('Cfa') &&
        !this.isCommonWord(name) &&
        this.looksLikeComponentName(name),
    );
    components.push(...filteredPascal);

    return [...new Set(components)];
  }

  /**
   * Extract kebab-case component names from text
   */
  extractKebabCaseComponents(text: string): string[] {
    const components: string[] = [];

    // Match kebab-case patterns (e.g., my-component, data-table)
    const kebabRegex = /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/g;
    const matches = text.match(kebabRegex) || [];

    for (const match of matches) {
      if (this.looksLikeComponentName(match)) {
        components.push(match);
      }
    }

    return [...new Set(components)];
  }

  /**
   * Detect all components from text using multiple strategies
   */
  detectComponents(text: string, title?: string): string[] {
    const components: string[] = [];

    // Strategy 1: Title-based detection
    if (title) {
      const titleComponent = this.extractComponentFromTitle(title);
      if (titleComponent) {
        components.push(titleComponent);
      }
    }

    // Strategy 2: CamelCase/PascalCase detection
    const camelComponents = this.extractCamelCaseComponents(text);
    components.push(...camelComponents);

    // Strategy 3: kebab-case detection
    const kebabComponents = this.extractKebabCaseComponents(text);
    components.push(...kebabComponents);

    // Strategy 4: Known components from description
    const lowerText = text.toLowerCase();
    for (const comp of this.knownComponents) {
      if (lowerText.includes(comp.toLowerCase())) {
        components.push(comp);
      }
    }

    return [...new Set(components)];
  }

  /**
   * Match text against component-keywords.json aliases
   * Returns canonical component name if found
   * Uses word boundary matching for better accuracy
   */
  matchKeywords(text: string): string | null {
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
   * Filter and prioritize components:
   * - Prefer Cfa* and PascalCase names (more specific)
   * - Keep longer/more specific names over shorter ones
   */
  prioritizeComponents(components: string[]): string[] {
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
   * 7. Generic UI term extraction (last resort)
   */
  extractComponentForTask(task: {
    componentName?: string | null;
    title: string;
    description?: string | null;
  }): string[] {
    const results: string[] = [];

    // Priority 1: Use componentName if it exists (most accurate)
    if (task.componentName && task.componentName.trim().length > 0) {
      results.push(task.componentName.trim());
      return results;
    }

    // Priority 2: Check if title starts with a component name
    // This is VERY high priority because it's explicit user intent
    // Examples: "Datatable componenti içinde...", "Tooltip header hatası"
    const titleStartComponent = this.extractComponentFromTitle(
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

    // If all methods fail, return empty array
    // This means the task has no detectable component
    return results;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'String',
      'Number',
      'Boolean',
      'Object',
      'Array',
      'Date',
      'Error',
      'Function',
      'Promise',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Symbol',
      'BigInt',
      'Undefined',
      'Null',
      'NaN',
      'Infinity',
      'JSON',
      'Math',
      'Console',
      'Window',
      'Document',
      'Element',
      'Node',
      'Event',
      'Request',
      'Response',
      'Headers',
      'URL',
      'URLSearchParams',
      'FormData',
      'Blob',
      'File',
      'FileReader',
      'XMLHttpRequest',
      'WebSocket',
      'Worker',
      'SharedWorker',
      'ServiceWorker',
      'MessageChannel',
      'MessagePort',
      'BroadcastChannel',
      'ImageData',
      'ImageBitmap',
      'OffscreenCanvas',
      'Path2D',
      'TextMetrics',
      'TextEncoder',
      'TextDecoder',
      'AbortController',
      'AbortSignal',
    ];
    return commonWords.includes(word);
  }

  looksLikeComponentName(name: string): boolean {
    // Component names typically:
    // - Are not too short (>= 3 chars)
    // - Don't contain numbers at the start
    // - Have meaningful parts
    if (name.length < 3) return false;
    if (/^\d/.test(name)) return false;

    // Check for meaningful component-related keywords
    const componentKeywords = [
      'button',
      'input',
      'select',
      'modal',
      'dialog',
      'card',
      'list',
      'table',
      'form',
      'field',
      'label',
      'icon',
      'menu',
      'nav',
      'header',
      'footer',
      'sidebar',
      'panel',
      'tab',
      'accordion',
      'dropdown',
      'tooltip',
      'popover',
      'alert',
      'badge',
      'chip',
      'avatar',
      'progress',
      'spinner',
      'loader',
      'slider',
      'switch',
      'checkbox',
      'radio',
      'datepicker',
      'timepicker',
      'calendar',
      'grid',
      'row',
      'col',
      'container',
      'wrapper',
      'layout',
      'page',
      'section',
      'widget',
      'component',
    ];

    const lowerName = name.toLowerCase();
    return componentKeywords.some((keyword) => lowerName.includes(keyword));
  }
}
