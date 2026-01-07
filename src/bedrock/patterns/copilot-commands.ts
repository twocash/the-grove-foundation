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

function findFieldMapping(fieldName: string, consoleId: string): FieldMapping | null {
  const normalized = fieldName.toLowerCase().trim();

  // Check console-specific fields first
  const consoleFields = CONSOLE_FIELDS[consoleId] || [];
  for (const field of consoleFields) {
    if (field.aliases.some(a => a === normalized)) {
      return field;
    }
  }

  // Then check common meta fields
  for (const field of COMMON_META_FIELDS) {
    if (field.aliases.some(a => a === normalized)) {
      return field;
    }
  }

  return null;
}

// =============================================================================
// Command Parsers
// =============================================================================

/**
 * Parse "set <field> to <value>" commands
 */
function parseSetCommand(input: string, consoleId: string): CommandResult {
  const match = input.match(/^set\s+(.+?)\s+to\s+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, fieldName, rawValue] = match;
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    const availableFields = [
      ...COMMON_META_FIELDS,
      ...(CONSOLE_FIELDS[consoleId] || []),
    ].flatMap(f => f.aliases);
    return {
      success: false,
      message: `Unknown field: "${fieldName}". Available fields: ${availableFields.slice(0, 10).join(', ')}...`,
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
 */
function parseClearCommand(input: string, consoleId: string): CommandResult {
  const match = input.match(/^clear\s+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, fieldName] = match;
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    return { success: false, message: `Unknown field: "${fieldName}"` };
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
 */
export function parsePrependCommand(input: string, consoleId: string, object?: GroveObject): CommandResult {
  const match = input.match(/^prepend\s+(.+?)\s+with[:\s]+(.+)$/i);
  if (!match) return { success: false, message: '' };

  const [, fieldName, rawValue] = match;
  const field = findFieldMapping(fieldName, consoleId);

  if (!field) {
    const availableFields = [
      ...COMMON_META_FIELDS,
      ...(CONSOLE_FIELDS[consoleId] || []),
    ].flatMap(f => f.aliases);
    return {
      success: false,
      message: `Unknown field: "${fieldName}". Available fields: ${availableFields.slice(0, 10).join(', ')}...`,
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
 * Parse a natural language command and return patch operations
 * Sprint: upload-pipeline-unification-v1 - Made async to support reprocess command
 */
export async function parseCommand(
  input: string,
  consoleId: string,
  object?: GroveObject
): Promise<CommandResult> {
  const trimmed = input.trim();

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

  // Help command
  if (trimmed.toLowerCase() === 'help' || trimmed === '?') {
    const fields = [
      ...COMMON_META_FIELDS,
      ...(CONSOLE_FIELDS[consoleId] || []),
    ];
    const fieldList = fields.map(f => `• ${f.aliases[0]}: ${f.description || f.type}`).join('\n');
    return {
      success: true,
      message: `Available commands:\n• reprocess - Run all enrichment and save (Pipeline Monitor)\n• set <field> to <value>\n• prepend <field> with <value>\n• activate / deactivate\n• clear <field>\n\nAvailable fields:\n${fieldList}`,
    };
  }

  return {
    success: false,
    message: `I didn't understand that. Try "reprocess", "set title to New Title", or type "help" for available commands.`,
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
