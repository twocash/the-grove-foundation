// src/bedrock/patterns/copilot-commands.ts
// Generic copilot command parser for any Grove object
// Sprint: prompt-editor-standardization-v1

import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';

// =============================================================================
// Types
// =============================================================================

export interface CommandResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  /** Clickable suggestions for follow-up actions */
  suggestions?: Array<{ label: string; template: string; icon?: string }>;
}

export interface FieldMapping {
  aliases: string[];
  path: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'status';
  description?: string;
}

// =============================================================================
// Common Field Mappings (shared across all Grove objects)
// =============================================================================

const COMMON_META_FIELDS: FieldMapping[] = [
  { aliases: ['title', 'name'], path: '/meta/title', type: 'string', description: 'Object title' },
  { aliases: ['description', 'desc'], path: '/meta/description', type: 'string', description: 'Object description' },
  { aliases: ['icon'], path: '/meta/icon', type: 'string', description: 'Icon name' },
  { aliases: ['tags'], path: '/meta/tags', type: 'array', description: 'Tags (comma-separated)' },
  { aliases: ['status', 'active'], path: '/meta/status', type: 'status', description: 'Status (active/draft/archived)' },
];

// Console-specific field mappings
const PROMPT_FIELDS: FieldMapping[] = [
  { aliases: ['execution', 'prompt', 'execution prompt'], path: '/payload/executionPrompt', type: 'string' },
  { aliases: ['weight', 'base weight'], path: '/payload/baseWeight', type: 'number' },
  { aliases: ['source'], path: '/payload/source', type: 'string' },
  { aliases: ['context', 'system', 'system context'], path: '/payload/systemContext', type: 'string' },
  { aliases: ['min interactions'], path: '/payload/targeting/minInteractions', type: 'number' },
  { aliases: ['min confidence'], path: '/payload/targeting/minConfidence', type: 'number' },
];

const CONSOLE_FIELDS: Record<string, FieldMapping[]> = {
  // Support both 'prompts' (config id) and 'prompt-workshop' (legacy)
  'prompts': PROMPT_FIELDS,
  'prompt-workshop': PROMPT_FIELDS,
  'lens-workshop': [
    { aliases: ['color'], path: '/payload/color', type: 'string' },
    { aliases: ['tone', 'tone guidance'], path: '/payload/toneGuidance', type: 'string' },
    { aliases: ['style', 'narrative style'], path: '/payload/narrativeStyle', type: 'string' },
    { aliases: ['vocabulary', 'vocabulary level'], path: '/payload/vocabularyLevel', type: 'string' },
  ],
};

// =============================================================================
// Value Parsers
// =============================================================================

function parseValue(value: string, type: FieldMapping['type']): unknown {
  const trimmed = value.trim().replace(/^["']|["']$/g, '');

  switch (type) {
    case 'number':
      const num = Number(trimmed);
      return isNaN(num) ? null : num;

    case 'boolean':
      const lower = trimmed.toLowerCase();
      if (['true', 'yes', 'on', '1'].includes(lower)) return true;
      if (['false', 'no', 'off', '0'].includes(lower)) return false;
      return null;

    case 'status':
      const statusMap: Record<string, string> = {
        active: 'active', live: 'active', enabled: 'active', on: 'active',
        draft: 'draft', inactive: 'draft', disabled: 'draft', off: 'draft',
        archived: 'archived', deleted: 'archived',
      };
      return statusMap[trimmed.toLowerCase()] || trimmed;

    case 'array':
      return trimmed.split(',').map(t => t.trim()).filter(Boolean);

    case 'string':
    default:
      return trimmed;
  }
}

/**
 * Strip common articles from field names
 * "the title" → "title", "a description" → "description"
 */
function stripArticles(text: string): string {
  return text.replace(/^(the|a|an)\s+/i, '').trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Sprint: inspector-copilot-v1 - Fuzzy matching support
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
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

function findFieldMapping(fieldName: string, consoleId: string): FieldMapping | null {
  // Strip articles and normalize
  const normalized = stripArticles(fieldName.toLowerCase().trim());

  const allFields = [
    ...(CONSOLE_FIELDS[consoleId] || []),
    ...COMMON_META_FIELDS,
  ];

  // First pass: exact match
  for (const field of allFields) {
    if (field.aliases.some(a => a === normalized)) {
      return field;
    }
  }

  // Second pass: fuzzy match with threshold
  const SIMILARITY_THRESHOLD = 0.7;
  let bestMatch: { field: FieldMapping; score: number } | null = null;

  for (const field of allFields) {
    for (const alias of field.aliases) {
      const score = similarityScore(normalized, alias);
      if (score >= SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { field, score };
      }
    }
  }

  return bestMatch?.field || null;
}

/**
 * Get field suggestions for autocomplete/error messages
 * Sprint: inspector-copilot-v1
 */
function getFieldSuggestions(partial: string, consoleId: string, limit = 3): string[] {
  const normalized = stripArticles(partial.toLowerCase().trim());

  const allFields = [
    ...(CONSOLE_FIELDS[consoleId] || []),
    ...COMMON_META_FIELDS,
  ];

  // Score each field by similarity
  const scored = allFields.flatMap(field =>
    field.aliases.map(alias => ({
      alias,
      score: similarityScore(normalized, alias)
    }))
  );

  // Sort by score descending and return top matches
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.alias);
}

// =============================================================================
// Command Parsers
// =============================================================================

/**
 * Parse "set <field> to <value>" commands
 * Sprint: inspector-copilot-v1 - Enhanced with fuzzy matching and suggestions
 */
function parseSetCommand(input: string, consoleId: string): CommandResult {
  const match = input.match(/^set\s+(.+?)\s+to\s+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, rawFieldName, rawValue] = match;
  // Strip articles: "the title" → "title"
  const fieldName = stripArticles(rawFieldName);
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    const suggestions = getFieldSuggestions(fieldName, consoleId, 3);
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(', ')}?`
      : 'Type /help to see available fields.';
    return {
      success: false,
      message: `Unknown field: "${fieldName}". ${suggestionText}`,
    };
  }

  const parsedValue = parseValue(rawValue, field.type);
  if (parsedValue === null) {
    return {
      success: false,
      message: `Invalid value "${rawValue}" for field type ${field.type}`,
    };
  }

  return {
    success: true,
    message: `Set ${field.aliases[0]} to "${parsedValue}"`,
    operations: [{ op: 'replace', path: field.path, value: parsedValue }],
  };
}

/**
 * Parse "activate" / "deactivate" commands
 */
function parseActivateCommand(input: string): CommandResult {
  const lower = input.toLowerCase().trim();

  if (lower === 'activate' || lower === 'enable' || lower === 'make active') {
    return {
      success: true,
      message: 'Activated',
      operations: [{ op: 'replace', path: '/meta/status', value: 'active' }],
    };
  }

  if (lower === 'deactivate' || lower === 'disable' || lower === 'make draft') {
    return {
      success: true,
      message: 'Set to draft',
      operations: [{ op: 'replace', path: '/meta/status', value: 'draft' }],
    };
  }

  return { success: false, message: '' };
}

/**
 * Parse "clear <field>" commands
 * Sprint: inspector-copilot-v1 - Enhanced with fuzzy matching and suggestions
 */
function parseClearCommand(input: string, consoleId: string): CommandResult {
  const match = input.match(/^clear\s+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, rawFieldName] = match;
  // Strip articles: "the title" → "title"
  const fieldName = stripArticles(rawFieldName);
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    const suggestions = getFieldSuggestions(fieldName, consoleId, 3);
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(', ')}?`
      : 'Type /help to see available fields.';
    return { success: false, message: `Unknown field: "${fieldName}". ${suggestionText}` };
  }

  const emptyValue = field.type === 'array' ? [] : field.type === 'number' ? 0 : '';

  return {
    success: true,
    message: `Cleared ${field.aliases[0]}`,
    operations: [{ op: 'replace', path: field.path, value: emptyValue }],
  };
}

/**
 * Parse "reprocess" command for document enrichment
 * Sprint: upload-pipeline-unification-v1
 */
async function parseReprocessCommand(input: string, object?: GroveObject): Promise<CommandResult> {
  const lower = input.toLowerCase().trim();
  if (lower !== 'reprocess' && lower !== 're-process') {
    return { success: false, message: '' };
  }

  // GroveObject has ID at meta.id, not at top level
  const objectId = object?.meta?.id || (object as unknown as { id?: string })?.id;
  if (!objectId) {
    return { success: false, message: 'No document selected. Select a document first.' };
  }

  try {
    const response = await fetch(`/api/knowledge/documents/${objectId}/reprocess`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: `Reprocess failed: ${errorData.error || response.statusText}`,
      };
    }

    const result = await response.json();
    const e = result.enrichment || {};

    return {
      success: true,
      message: `✓ Document reprocessed and saved!\n\nKeywords: ${e.keywords || 0}\nSummary: ${e.summary || 'none'}\nEntities: ${e.entities || 0}\nType: ${e.type || 'unknown'}\nQuestions: ${e.questions || 0}\nFreshness: ${e.freshness || 'unknown'}\n\nRefresh to see updated data.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Reprocess error: ${(error as Error).message}`,
    };
  }
}

/**
 * Parse "prepend <field> with <value>" commands
 * Prepends value to the existing field content
 * Sprint: prompt-wiring-v1
 * Sprint: inspector-copilot-v1 - Enhanced with fuzzy matching and suggestions
 */
export function parsePrependCommand(input: string, consoleId: string, object?: GroveObject): CommandResult {
  const match = input.match(/^prepend\s+(.+?)\s+with[:\s]+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, rawFieldName, rawValue] = match;
  // Strip articles: "the title" → "title"
  const fieldName = stripArticles(rawFieldName);
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    const suggestions = getFieldSuggestions(fieldName, consoleId, 3);
    const suggestionText = suggestions.length > 0
      ? `Did you mean: ${suggestions.join(', ')}?`
      : 'Type /help to see available fields.';
    return {
      success: false,
      message: `Unknown field: "${fieldName}". ${suggestionText}`,
    };
  }

  if (field.type !== 'string') {
    return {
      success: false,
      message: `Cannot prepend to ${field.type} field. Only string fields support prepend.`,
    };
  }

  const prependValue = rawValue.trim();

  // Get existing value from object
  const existingValue = object ? getNestedValue(object, field.path) : '';
  const newValue = existingValue
    ? `${prependValue} ${existingValue}`.trim()
    : prependValue;

  return {
    success: true,
    message: `Prepended "${prependValue}" to ${field.aliases[0]}`,
    operations: [{ op: 'replace', path: field.path, value: newValue }],
  };
}

/**
 * Get nested value from object using JSON pointer path
 */
function getNestedValue(obj: GroveObject, path: string): string {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return '';
    }
  }

  return typeof current === 'string' ? current : '';
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Check if object is an active singleton (read-only mode)
 * Sprint: inspector-copilot-v1 - Active configuration UX
 */
function isActiveConfiguration(object?: GroveObject): boolean {
  return object?.meta?.status === 'active';
}

/**
 * Check if input is asking to duplicate/clone
 * Sprint: inspector-copilot-v1
 */
function isDuplicateRequest(input: string): boolean {
  const duplicatePatterns = [
    /^duplicate\s*(this)?$/i,
    /^clone\s*(this)?$/i,
    /^copy\s*(this)?$/i,
    /^make\s+a?\s*copy$/i,
  ];
  return duplicatePatterns.some(p => p.test(input.trim()));
}

/**
 * Check if input is a read-only command (help, fields, etc.)
 * Sprint: inspector-copilot-v1
 */
function isReadOnlyCommand(input: string): boolean {
  const lower = input.toLowerCase().trim();
  const readOnlyCommands = ['help', '/help', '?', '/?', 'commands', '/commands', 'fields', '/fields'];
  return readOnlyCommands.includes(lower);
}

/**
 * Parse a natural language command and return patch operations
 * Sprint: upload-pipeline-unification-v1 - Made async to support reprocess command
 * Sprint: inspector-copilot-v1 - Added active configuration read-only mode
 */
export async function parseCommand(
  input: string,
  consoleId: string,
  object?: GroveObject
): Promise<CommandResult> {
  const trimmed = input.trim();

  // Sprint: inspector-copilot-v1 - Handle duplicate request for active configs
  if (isDuplicateRequest(trimmed)) {
    return {
      success: true,
      message: `To duplicate this ${object?.meta?.title || 'item'}, use the duplicate button in the toolbar.`,
      suggestions: [
        { label: 'View fields', template: '/fields', icon: 'list' },
        { label: 'Help', template: '/help', icon: 'help' },
      ],
    };
  }

  // Sprint: inspector-copilot-v1 - Active configuration read-only mode
  // Only allow help/fields commands, not edits
  if (isActiveConfiguration(object) && !isReadOnlyCommand(trimmed)) {
    return {
      success: false,
      message: `This is an active configuration and cannot be edited directly. To make changes, duplicate it first or deactivate it.\n\nType /help to see available commands.`,
      suggestions: [
        { label: 'Duplicate', template: 'duplicate this', icon: 'content_copy' },
        { label: 'Deactivate', template: 'deactivate', icon: 'pause' },
        { label: 'Help', template: '/help', icon: 'help' },
      ],
    };
  }

  // Check for reprocess command first (async)
  // Sprint: upload-pipeline-unification-v1
  const reprocessResult = await parseReprocessCommand(trimmed, object);
  if (reprocessResult.success || reprocessResult.message) {
    return reprocessResult;
  }

  // Try each parser in order
  const parsers = [
    () => parseSetCommand(trimmed, consoleId),
    () => parsePrependCommand(trimmed, consoleId, object),
    () => parseActivateCommand(trimmed),
    () => parseClearCommand(trimmed, consoleId),
  ];

  for (const parser of parsers) {
    const result = parser();
    if (result.success || result.message) {
      return result;
    }
  }

  // Fields command - list available fields
  // Sprint: inspector-copilot-v1
  const fieldsAliases = ['fields', '/fields'];
  if (fieldsAliases.includes(trimmed.toLowerCase())) {
    const fields = [
      ...COMMON_META_FIELDS,
      ...(CONSOLE_FIELDS[consoleId] || []),
    ];
    const fieldList = fields.map(f => `• **${f.aliases[0]}** (${f.type}) - ${f.description || 'No description'}`).join('\n');
    return {
      success: true,
      message: `**Available fields:**\n${fieldList}`,
    };
  }

  // Help command - support with or without slash
  // Sprint: inspector-copilot-v1 - Added /help, /commands, /? aliases
  const helpAliases = ['help', '/help', '?', '/?', 'commands', '/commands'];
  if (helpAliases.includes(trimmed.toLowerCase())) {
    const fields = [
      ...COMMON_META_FIELDS,
      ...(CONSOLE_FIELDS[consoleId] || []),
    ];
    const fieldList = fields.map(f => `• ${f.aliases[0]}: ${f.description || f.type}`).join('\n');
    return {
      success: true,
      message: `**Available commands:**
• set <field> to <value> - Update a field
• prepend <field> with <value> - Add to beginning
• activate / deactivate - Change status
• clear <field> - Reset a field
• /fields - List available fields
• reprocess - Re-run enrichment (documents only)

**Available fields:**
${fieldList}`,
    };
  }

  return {
    success: false,
    message: `I didn't understand that. Try "set title to New Title" or type /help for available commands.`,
  };
}

/**
 * Get available fields for a console (for UI hints)
 */
export function getAvailableFields(consoleId: string): FieldMapping[] {
  return [
    ...COMMON_META_FIELDS,
    ...(CONSOLE_FIELDS[consoleId] || []),
  ];
}

export default parseCommand;
