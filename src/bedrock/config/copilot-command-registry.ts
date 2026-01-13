// src/bedrock/config/copilot-command-registry.ts
// Global command registry for Inspector Copilots
// Sprint: inspector-copilot-v1
//
// This module defines the global commands available in all inspector copilots.
// Console-specific commands are merged with these at runtime.

import type { CopilotCommand, FieldMapping } from '../types/InspectorCopilotConfig';

// =============================================================================
// Global Commands (available in all inspector copilots)
// =============================================================================

export const GLOBAL_COMMANDS: CopilotCommand[] = [
  // -------------------------------------------------------------------------
  // Informational Commands
  // -------------------------------------------------------------------------
  {
    id: 'help',
    trigger: 'help',
    aliases: ['?', 'commands'],
    description: 'Show available commands and fields',
    icon: 'help',
    scope: 'global',
    handlerType: 'info',
  },
  {
    id: 'fields',
    trigger: 'fields',
    aliases: ['list-fields', 'props'],
    description: 'List editable fields for current object',
    icon: 'list',
    scope: 'global',
    handlerType: 'info',
  },

  // -------------------------------------------------------------------------
  // Status Management Commands
  // -------------------------------------------------------------------------
  {
    id: 'activate',
    trigger: 'activate',
    aliases: ['enable', 'on'],
    description: 'Set object status to active',
    icon: 'toggle_on',
    scope: 'global',
    handlerType: 'patch',
    targetPath: '/meta/status',
    patchValue: 'active',
    showWhen: { field: 'meta.status', operator: 'neq', value: 'active' },
  },
  {
    id: 'deactivate',
    trigger: 'deactivate',
    aliases: ['disable', 'off', 'draft'],
    description: 'Set object status to draft',
    icon: 'toggle_off',
    scope: 'global',
    handlerType: 'patch',
    targetPath: '/meta/status',
    patchValue: 'draft',
    showWhen: { field: 'meta.status', operator: 'eq', value: 'active' },
  },
  {
    id: 'archive',
    trigger: 'archive',
    description: 'Archive this object',
    icon: 'archive',
    scope: 'global',
    handlerType: 'patch',
    targetPath: '/meta/status',
    patchValue: 'archived',
    confirmPrompt: 'Archive this object? It will be hidden from default views.',
    showWhen: { field: 'meta.status', operator: 'neq', value: 'archived' },
  },

  // -------------------------------------------------------------------------
  // Field Manipulation Commands (use natural language parsing)
  // -------------------------------------------------------------------------
  {
    id: 'set',
    trigger: 'set',
    description: 'Set a field value (e.g., "set title to Hello")',
    icon: 'edit',
    scope: 'global',
    handlerType: 'patch',
    args: [
      { name: 'field', type: 'field', required: true, description: 'Field name' },
      { name: 'value', type: 'string', required: true, description: 'New value' },
    ],
  },
  {
    id: 'clear',
    trigger: 'clear',
    description: 'Clear a field (e.g., "clear description")',
    icon: 'clear',
    scope: 'global',
    handlerType: 'patch',
    args: [
      { name: 'field', type: 'field', required: true, description: 'Field to clear' },
    ],
  },
  {
    id: 'prepend',
    trigger: 'prepend',
    description: 'Prepend to a field (e.g., "prepend title with [WIP]")',
    icon: 'add',
    scope: 'global',
    handlerType: 'patch',
    args: [
      { name: 'field', type: 'field', required: true, description: 'Field name' },
      { name: 'value', type: 'string', required: true, description: 'Value to prepend' },
    ],
  },
];

// =============================================================================
// Common Field Mappings (shared across all Grove objects)
// =============================================================================

export const COMMON_FIELD_MAPPINGS: FieldMapping[] = [
  {
    aliases: ['title', 'name'],
    path: '/meta/title',
    type: 'string',
    description: 'Object title',
  },
  {
    aliases: ['description', 'desc'],
    path: '/meta/description',
    type: 'string',
    description: 'Object description',
  },
  {
    aliases: ['icon'],
    path: '/meta/icon',
    type: 'string',
    description: 'Icon name (Material Symbols)',
  },
  {
    aliases: ['tags'],
    path: '/meta/tags',
    type: 'array',
    description: 'Tags (comma-separated)',
  },
  {
    aliases: ['status'],
    path: '/meta/status',
    type: 'status',
    description: 'Status',
    validValues: ['active', 'draft', 'archived'],
  },
  {
    aliases: ['id'],
    path: '/meta/id',
    type: 'string',
    description: 'Object ID',
    readonly: true,
  },
  {
    aliases: ['created', 'created at'],
    path: '/meta/createdAt',
    type: 'string',
    description: 'Creation timestamp',
    readonly: true,
  },
  {
    aliases: ['updated', 'updated at'],
    path: '/meta/updatedAt',
    type: 'string',
    description: 'Last update timestamp',
    readonly: true,
  },
];

// =============================================================================
// Console-Specific Field Mappings
// These extend COMMON_FIELD_MAPPINGS for specific console types
// =============================================================================

/**
 * Field mappings for System Prompt console
 */
export const SYSTEM_PROMPT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    aliases: ['execution', 'prompt', 'execution prompt'],
    path: '/payload/executionPrompt',
    type: 'string',
    description: 'Main execution prompt text',
  },
  {
    aliases: ['weight', 'base weight'],
    path: '/payload/baseWeight',
    type: 'number',
    description: 'Base weight (0-100)',
  },
  {
    aliases: ['source'],
    path: '/payload/source',
    type: 'string',
    description: 'Source identifier',
  },
  {
    aliases: ['context', 'system', 'system context'],
    path: '/payload/systemContext',
    type: 'string',
    description: 'System context text',
  },
  {
    aliases: ['min interactions'],
    path: '/payload/targeting/minInteractions',
    type: 'number',
    description: 'Minimum interactions for targeting',
  },
  {
    aliases: ['min confidence'],
    path: '/payload/targeting/minConfidence',
    type: 'number',
    description: 'Minimum confidence score (0-1)',
  },
];

/**
 * Field mappings for Feature Flag console
 */
export const FEATURE_FLAG_FIELD_MAPPINGS: FieldMapping[] = [
  {
    aliases: ['available'],
    path: '/payload/available',
    type: 'boolean',
    description: 'Whether feature is available',
  },
  {
    aliases: ['enabled', 'default enabled'],
    path: '/payload/defaultEnabled',
    type: 'boolean',
    description: 'Default enabled state',
  },
  {
    aliases: ['category'],
    path: '/payload/category',
    type: 'string',
    description: 'Feature category',
  },
  {
    aliases: ['header', 'in header'],
    path: '/payload/inHeader',
    type: 'boolean',
    description: 'Show in header navigation',
  },
];

/**
 * Field mappings for Lens console
 */
export const LENS_FIELD_MAPPINGS: FieldMapping[] = [
  {
    aliases: ['color'],
    path: '/payload/color',
    type: 'string',
    description: 'Lens accent color',
  },
  {
    aliases: ['tone', 'tone guidance'],
    path: '/payload/toneGuidance',
    type: 'string',
    description: 'Tone guidance for AI',
  },
  {
    aliases: ['style', 'narrative style'],
    path: '/payload/narrativeStyle',
    type: 'string',
    description: 'Narrative style descriptor',
  },
  {
    aliases: ['vocabulary', 'vocabulary level'],
    path: '/payload/vocabularyLevel',
    type: 'string',
    description: 'Vocabulary complexity level',
  },
];

/**
 * Field mappings for Research Sprout console
 */
export const RESEARCH_SPROUT_FIELD_MAPPINGS: FieldMapping[] = [
  {
    aliases: ['hypothesis'],
    path: '/payload/hypothesis',
    type: 'string',
    description: 'Research hypothesis',
  },
  {
    aliases: ['goals'],
    path: '/payload/goals',
    type: 'array',
    description: 'Research goals',
  },
  {
    aliases: ['depth', 'search depth'],
    path: '/payload/searchDepth',
    type: 'string',
    description: 'Search depth level',
  },
];

// =============================================================================
// Registry Lookup
// =============================================================================

/**
 * Registry of field mappings by console ID
 * Used by copilot factory to merge with common mappings
 */
export const CONSOLE_FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  // System Prompt variations
  'prompts': SYSTEM_PROMPT_FIELD_MAPPINGS,
  'prompt-workshop': SYSTEM_PROMPT_FIELD_MAPPINGS,
  'system-prompt': SYSTEM_PROMPT_FIELD_MAPPINGS,

  // Feature Flag variations
  'feature-flag': FEATURE_FLAG_FIELD_MAPPINGS,
  'feature-flags': FEATURE_FLAG_FIELD_MAPPINGS,

  // Lens variations
  'lens-workshop': LENS_FIELD_MAPPINGS,
  'lenses': LENS_FIELD_MAPPINGS,

  // Research variations
  'research-sprout': RESEARCH_SPROUT_FIELD_MAPPINGS,
  'research-sprouts': RESEARCH_SPROUT_FIELD_MAPPINGS,
};

/**
 * Get field mappings for a console
 * Returns common + console-specific mappings merged
 */
export function getFieldMappingsForConsole(consoleId: string): FieldMapping[] {
  const consoleSpecific = CONSOLE_FIELD_MAPPINGS[consoleId] || [];
  return [...COMMON_FIELD_MAPPINGS, ...consoleSpecific];
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy field name matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Discover fields from an object structure dynamically
 * Sprint: inspector-copilot-v1 - Object-aware field discovery
 */
export function discoverFieldsFromObject(
  obj: Record<string, unknown>,
  prefix = ''
): FieldMapping[] {
  const discovered: FieldMapping[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}/${key}` : `/${key}`;
    const type = inferFieldType(value);

    // Skip complex nested objects (we'll recurse into them)
    if (type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into meta and payload
      if (key === 'meta' || key === 'payload') {
        discovered.push(...discoverFieldsFromObject(value as Record<string, unknown>, path));
      }
      continue;
    }

    discovered.push({
      aliases: [key, camelToWords(key)].filter((a, i, arr) => arr.indexOf(a) === i),
      path,
      type: type as FieldMapping['type'],
      description: `${camelToWords(key)} (discovered)`,
      validValues: inferValidValues(key, value),
    });
  }

  return discovered;
}

/**
 * Infer field type from value
 */
function inferFieldType(value: unknown): string {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'string';
}

/**
 * Convert camelCase to readable words
 */
function camelToWords(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
    .toLowerCase();
}

/**
 * Infer valid values for known field patterns
 */
function inferValidValues(key: string, value: unknown): string[] | undefined {
  const keyLower = key.toLowerCase();

  // Status fields
  if (keyLower === 'status') {
    return ['active', 'draft', 'archived'];
  }

  // Boolean fields
  if (typeof value === 'boolean') {
    return ['true', 'false'];
  }

  // Known enum patterns
  if (keyLower === 'category') {
    return ['experience', 'research', 'experimental', 'internal'];
  }

  if (keyLower === 'formality') {
    return ['casual', 'professional', 'academic', 'technical'];
  }

  if (keyLower === 'perspective') {
    return ['first person', 'third person', 'neutral'];
  }

  return undefined;
}

/**
 * Find a field mapping by alias with fuzzy matching
 * Sprint: inspector-copilot-v1 - Enhanced with fuzzy matching and object introspection
 *
 * @param fieldName - User input (can have typos)
 * @param consoleId - Console ID for static mappings
 * @param object - Optional current object for dynamic field discovery
 * @returns Matching field or null, plus suggestions if fuzzy matched
 */
export function findFieldMapping(
  fieldName: string,
  consoleId: string,
  object?: Record<string, unknown> | null
): FieldMapping | null {
  const normalized = fieldName.toLowerCase().trim();
  const allMappings = getFieldMappingsForConsole(consoleId);

  // 1. Exact match on registered aliases
  for (const field of allMappings) {
    if (field.aliases.some(a => a.toLowerCase() === normalized)) {
      return field;
    }
  }

  // 2. Dynamic discovery from object (if provided)
  if (object) {
    const discoveredFields = discoverFieldsFromObject(object);
    for (const field of discoveredFields) {
      if (field.aliases.some(a => a.toLowerCase() === normalized)) {
        return field;
      }
    }

    // 3. Fuzzy match on discovered fields (threshold: 0.7 similarity)
    const FUZZY_THRESHOLD = 0.7;
    let bestMatch: { field: FieldMapping; score: number } | null = null;

    const allFields = [...allMappings, ...discoveredFields];
    for (const field of allFields) {
      for (const alias of field.aliases) {
        const score = similarityScore(normalized, alias.toLowerCase());
        if (score >= FUZZY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { field, score };
        }
      }
    }

    if (bestMatch) {
      return bestMatch.field;
    }
  }

  // 4. Fuzzy match on static mappings only (fallback)
  const FUZZY_THRESHOLD = 0.7;
  let bestMatch: { field: FieldMapping; score: number } | null = null;

  for (const field of allMappings) {
    for (const alias of field.aliases) {
      const score = similarityScore(normalized, alias.toLowerCase());
      if (score >= FUZZY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { field, score };
      }
    }
  }

  return bestMatch?.field || null;
}

/**
 * Get field suggestions for partial input (autocomplete)
 * Sprint: inspector-copilot-v1
 */
export function getFieldSuggestions(
  partial: string,
  consoleId: string,
  object?: Record<string, unknown> | null,
  limit = 5
): { alias: string; path: string; score: number }[] {
  const normalized = partial.toLowerCase().trim();
  const allMappings = getFieldMappingsForConsole(consoleId);
  const discovered = object ? discoverFieldsFromObject(object) : [];
  const allFields = [...allMappings, ...discovered];

  const suggestions: { alias: string; path: string; score: number }[] = [];

  for (const field of allFields) {
    for (const alias of field.aliases) {
      const aliasLower = alias.toLowerCase();
      // Prefix match or fuzzy match
      if (aliasLower.startsWith(normalized)) {
        suggestions.push({ alias, path: field.path, score: 1 });
      } else {
        const score = similarityScore(normalized, aliasLower);
        if (score > 0.5) {
          suggestions.push({ alias, path: field.path, score });
        }
      }
    }
  }

  // Sort by score descending, take top N
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get all available commands for a console
 * Returns global + console-specific commands
 */
export function getCommandsForConsole(
  consoleId: string,
  consoleCommands?: CopilotCommand[]
): CopilotCommand[] {
  const commandMap = new Map<string, CopilotCommand>();

  // Add global commands first
  for (const cmd of GLOBAL_COMMANDS) {
    commandMap.set(cmd.id, cmd);
  }

  // Console-specific commands override globals with same ID
  if (consoleCommands) {
    for (const cmd of consoleCommands) {
      commandMap.set(cmd.id, cmd);
    }
  }

  return Array.from(commandMap.values());
}
