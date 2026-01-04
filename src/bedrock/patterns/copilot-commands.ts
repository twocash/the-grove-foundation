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
const CONSOLE_FIELDS: Record<string, FieldMapping[]> = {
  'prompt-workshop': [
    { aliases: ['execution', 'prompt', 'execution prompt'], path: '/payload/executionPrompt', type: 'string' },
    { aliases: ['weight', 'base weight'], path: '/payload/baseWeight', type: 'number' },
    { aliases: ['source'], path: '/payload/source', type: 'string' },
    { aliases: ['context', 'system', 'system context'], path: '/payload/systemContext', type: 'string' },
    { aliases: ['min interactions'], path: '/payload/targeting/minInteractions', type: 'number' },
    { aliases: ['min confidence'], path: '/payload/targeting/minConfidence', type: 'number' },
  ],
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

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse a natural language command and return patch operations
 */
export function parseCommand(
  input: string,
  consoleId: string,
  _object?: GroveObject
): CommandResult {
  const trimmed = input.trim();

  // Try each parser in order
  const parsers = [
    () => parseSetCommand(trimmed, consoleId),
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
      message: `Available commands:\n• set <field> to <value>\n• activate / deactivate\n• clear <field>\n\nAvailable fields:\n${fieldList}`,
    };
  }

  return {
    success: false,
    message: `I didn't understand that. Try "set title to New Title" or type "help" for available commands.`,
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
