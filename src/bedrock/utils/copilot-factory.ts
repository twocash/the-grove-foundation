// src/bedrock/utils/copilot-factory.ts
// Factory for resolving Inspector Copilot configuration
// Sprint: inspector-copilot-v1
//
// This module provides the factory function that resolves copilot configuration
// by merging global defaults with console-specific overrides.

import type {
  InspectorCopilotConfig,
  ResolvedCopilotConfig,
  CopilotCommand,
  FieldMapping,
} from '../types/InspectorCopilotConfig';
import {
  GLOBAL_COMMANDS,
  COMMON_FIELD_MAPPINGS,
  CONSOLE_FIELD_MAPPINGS,
  getCommandsForConsole,
} from '../config/copilot-command-registry';

// =============================================================================
// Default Configuration Values
// =============================================================================

/**
 * Default values for InspectorCopilotConfig
 * These reflect the user-approved decisions:
 * - maxDisplayMessages: 3 (minimal terminal style)
 * - quickActions: [] (none by default - maximum minimalism)
 */
const DEFAULT_CONFIG: Omit<ResolvedCopilotConfig, 'commands' | 'fieldMappings'> = {
  enabled: true,
  title: 'Copilot',
  placeholder: 'Try "set title to X" or /help',
  defaultCollapsed: true,
  quickActions: [], // None by default (per user decision)
  historyPersistence: 'none',
  maxMessages: 10,
  maxDisplayMessages: 3, // Minimal terminal style (per user decision)
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Resolve copilot configuration for a console
 *
 * Merges:
 * - Default values
 * - Global commands
 * - Console-specific commands (override globals with same ID)
 * - Console-specific field mappings
 * - Schema config overrides
 *
 * @param consoleId - The console identifier (e.g., 'prompts', 'feature-flag')
 * @param schemaConfig - Optional config from ConsoleSchema.inspector.copilot
 * @returns Fully resolved configuration ready for InspectorCopilot component
 */
export function resolveCopilotConfig(
  consoleId: string,
  schemaConfig?: InspectorCopilotConfig
): ResolvedCopilotConfig {
  // If explicitly disabled, return minimal disabled config
  if (schemaConfig?.enabled === false) {
    return {
      ...DEFAULT_CONFIG,
      enabled: false,
      commands: [],
      fieldMappings: [],
    };
  }

  // Merge commands: global + console-specific (console overrides global)
  const commands = getCommandsForConsole(consoleId, schemaConfig?.commands);

  // Merge field mappings: common + console-specific + schema-provided
  const fieldMappings = mergeFieldMappings(
    consoleId,
    schemaConfig?.fieldMappings
  );

  // Build resolved config
  return {
    enabled: schemaConfig?.enabled ?? DEFAULT_CONFIG.enabled,
    title: schemaConfig?.title ?? DEFAULT_CONFIG.title,
    placeholder: schemaConfig?.placeholder ?? DEFAULT_CONFIG.placeholder,
    defaultCollapsed: schemaConfig?.defaultCollapsed ?? DEFAULT_CONFIG.defaultCollapsed,
    commands,
    quickActions: schemaConfig?.quickActions ?? DEFAULT_CONFIG.quickActions,
    fieldMappings,
    actionHandlerKey: schemaConfig?.actionHandlerKey,
    welcomeMessage: schemaConfig?.welcomeMessage,
    historyPersistence: schemaConfig?.historyPersistence ?? DEFAULT_CONFIG.historyPersistence,
    maxMessages: schemaConfig?.maxMessages ?? DEFAULT_CONFIG.maxMessages,
    maxDisplayMessages: schemaConfig?.maxDisplayMessages ?? DEFAULT_CONFIG.maxDisplayMessages,
  };
}

/**
 * Merge field mappings from multiple sources
 * Order of precedence (later overrides earlier):
 * 1. Common field mappings
 * 2. Console-specific field mappings
 * 3. Schema-provided field mappings
 */
function mergeFieldMappings(
  consoleId: string,
  schemaFieldMappings?: FieldMapping[]
): FieldMapping[] {
  const fieldMap = new Map<string, FieldMapping>();

  // Add common fields first
  for (const field of COMMON_FIELD_MAPPINGS) {
    // Use first alias as key
    fieldMap.set(field.aliases[0], field);
  }

  // Add console-specific fields (override common)
  const consoleFields = CONSOLE_FIELD_MAPPINGS[consoleId] || [];
  for (const field of consoleFields) {
    fieldMap.set(field.aliases[0], field);
  }

  // Add schema-provided fields (override all)
  if (schemaFieldMappings) {
    for (const field of schemaFieldMappings) {
      fieldMap.set(field.aliases[0], field);
    }
  }

  return Array.from(fieldMap.values());
}

// =============================================================================
// Command Lookup Utilities
// =============================================================================

/**
 * Find a command by trigger or alias
 *
 * @param input - User input (e.g., '/activate' or 'enable')
 * @param commands - Resolved command list
 * @returns Matching command or null
 */
export function findCommand(
  input: string,
  commands: CopilotCommand[]
): CopilotCommand | null {
  const normalized = input.toLowerCase().trim().replace(/^\//, '');

  for (const cmd of commands) {
    if (cmd.trigger.toLowerCase() === normalized) {
      return cmd;
    }
    if (cmd.aliases?.some(a => a.toLowerCase() === normalized)) {
      return cmd;
    }
  }

  return null;
}

/**
 * Check if a command's showWhen condition is met
 *
 * @param command - Command to check
 * @param object - Current object to evaluate against
 * @returns true if command should be shown
 */
export function isCommandVisible<T extends Record<string, unknown>>(
  command: CopilotCommand,
  object: T | null
): boolean {
  if (!command.showWhen) {
    return true;
  }

  if (!object) {
    return command.showWhen.operator === 'missing';
  }

  const { field, operator, value } = command.showWhen;
  const fieldValue = getNestedValue(object, field);

  switch (operator) {
    case 'eq':
      return fieldValue === value;
    case 'neq':
      return fieldValue !== value;
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'missing':
      return fieldValue === undefined || fieldValue === null;
    default:
      return true;
  }
}

/**
 * Get nested value from object using dot notation
 * e.g., 'meta.status' -> object.meta.status
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

// =============================================================================
// Help Text Generation
// =============================================================================

/**
 * Generate help text for available commands
 *
 * @param commands - Resolved command list
 * @param object - Current object (for filtering by showWhen)
 * @returns Formatted help text (markdown)
 */
export function generateHelpText<T extends Record<string, unknown>>(
  commands: CopilotCommand[],
  object: T | null
): string {
  const visibleCommands = commands.filter(cmd => isCommandVisible(cmd, object));

  const lines = ['**Available commands:**', ''];

  for (const cmd of visibleCommands) {
    const trigger = cmd.trigger;
    const aliases = cmd.aliases?.length ? ` (${cmd.aliases.join(', ')})` : '';
    lines.push(`• \`/${trigger}\`${aliases} - ${cmd.description}`);
  }

  return lines.join('\n');
}

/**
 * Generate field list for /fields command
 * Sprint: inspector-copilot-v1 - Enhanced with dynamic field discovery
 *
 * @param fieldMappings - Resolved field mappings
 * @param object - Optional current object for dynamic discovery
 * @returns Formatted field list (markdown)
 */
export function generateFieldList(
  fieldMappings: FieldMapping[],
  object?: Record<string, unknown> | null
): string {
  // Import dynamic discovery if object is provided
  let allFields = [...fieldMappings];

  if (object) {
    // Dynamic import to avoid circular dependency
    const { discoverFieldsFromObject } = require('../config/copilot-command-registry');
    const discovered = discoverFieldsFromObject(object);

    // Merge discovered fields that aren't already in mappings
    const existingPaths = new Set(fieldMappings.map(f => f.path));
    for (const field of discovered) {
      if (!existingPaths.has(field.path)) {
        allFields.push(field);
      }
    }
  }

  const editableFields = allFields.filter(f => !f.readonly);
  const readonlyFields = allFields.filter(f => f.readonly);

  const lines = ['**Editable fields:**', ''];

  for (const field of editableFields) {
    const alias = field.aliases[0];
    const typeInfo = field.validValues?.length
      ? `${field.type}: ${field.validValues.join('|')}`
      : field.type;
    const desc = field.description || typeInfo;
    lines.push(`• \`${alias}\` (${typeInfo}) - ${desc}`);
  }

  if (readonlyFields.length > 0) {
    lines.push('', '**Read-only fields:**', '');
    for (const field of readonlyFields) {
      const alias = field.aliases[0];
      const desc = field.description || field.type;
      lines.push(`• \`${alias}\` - ${desc}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Export for type usage
// =============================================================================

export type { ResolvedCopilotConfig };
