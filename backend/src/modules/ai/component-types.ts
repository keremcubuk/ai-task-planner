import * as fs from 'fs';
import * as path from 'path';

/**
 * UI Component Type Definitions
 * Loaded dynamically from component-keywords.json
 */

export interface ComponentTypeDefinition {
  name: string;
  aliases: string[];
}

/**
 * Load component definitions from JSON file
 */
function loadComponentDefinitions(): ComponentTypeDefinition[] {
  try {
    const keywordsPath = path.resolve(
      __dirname,
      '../../../../component-keywords.json',
    );
    const content = fs.readFileSync(keywordsPath, 'utf-8');
    const json = JSON.parse(content) as Record<string, string[]>;

    return Object.entries(json).map(([name, aliases]) => ({
      name,
      aliases: aliases.map((a) => a.toLowerCase()),
    }));
  } catch (error) {
    console.warn('Failed to load component-keywords.json:', error);
    return [];
  }
}

/**
 * Comprehensive list of known UI component types
 * Loaded from component-keywords.json
 */
export const KNOWN_COMPONENTS: ComponentTypeDefinition[] =
  loadComponentDefinitions();

/**
 * Get all component names (including aliases)
 */
export function getAllComponentNames(): string[] {
  const names: string[] = [];
  for (const comp of KNOWN_COMPONENTS) {
    names.push(comp.name);
    names.push(...comp.aliases);
  }
  return names;
}

/**
 * Get canonical component name (resolves aliases)
 */
export function getCanonicalComponentName(name: string): string {
  const lowerName = name.toLowerCase();
  const component = KNOWN_COMPONENTS.find(
    (c) => c.name === lowerName || c.aliases.includes(lowerName),
  );
  return component?.name ?? lowerName;
}
