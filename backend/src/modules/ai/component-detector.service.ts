import { Injectable, Logger } from '@nestjs/common';
import { getAllComponentNames } from './component-types';

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

  private looksLikeComponentName(name: string): boolean {
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
