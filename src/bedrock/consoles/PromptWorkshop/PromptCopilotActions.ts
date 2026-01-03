// src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts
// Prompt-specific Copilot action handlers
// Sprint: prompt-schema-rationalization-v1 (Epic 3)

import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, PromptTargeting } from '@core/schema/prompt';
import type { PatchOperation } from '../../types/copilot.types';

// =============================================================================
// Types
// =============================================================================

export interface PromptCopilotContext {
  consoleId: 'prompt-workshop';
  selectedPrompt: GroveObject<PromptPayload> | null;
  prompts: GroveObject<PromptPayload>[];
}

export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestedPrompt?: Partial<PromptPayload>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// Field Path Normalization
// =============================================================================

/**
 * Maps natural language field names to JSON Pointer paths
 * Note: title, description, icon, tags are now in meta (not payload)
 */
const FIELD_ALIASES: Record<string, string> = {
  // Meta fields
  title: '/meta/title',
  name: '/meta/title',
  label: '/meta/title', // Legacy alias
  description: '/meta/description',
  desc: '/meta/description',
  icon: '/meta/icon',
  tags: '/meta/tags',
  status: '/meta/status',
  // Payload fields
  execution: '/payload/executionPrompt',
  prompt: '/payload/executionPrompt',
  'execution prompt': '/payload/executionPrompt',
  context: '/payload/systemContext',
  system: '/payload/systemContext',
  'system context': '/payload/systemContext',
  variant: '/payload/variant',
  weight: '/payload/baseWeight',
  'base weight': '/payload/baseWeight',
  source: '/payload/source',
};

// =============================================================================
// Command Parsing
// =============================================================================

/**
 * Parse "set <field> to <value>" natural language commands
 */
export function parseSetCommand(input: string): PatchOperation[] | null {
  // Pattern: "set <field> to <value>"
  const match = input.match(/^set\s+(.+?)\s+to\s+(.+)$/i);
  if (!match) return null;

  const [, field, value] = match;
  const path = FIELD_ALIASES[field.toLowerCase().trim()];
  if (!path) return null;

  let parsedValue: unknown = value.trim();

  // Remove quotes if present
  if (
    (parsedValue as string).startsWith('"') &&
    (parsedValue as string).endsWith('"')
  ) {
    parsedValue = (parsedValue as string).slice(1, -1);
  }

  // Parse numbers
  if (/^\d+$/.test(parsedValue as string)) {
    parsedValue = parseInt(parsedValue as string, 10);
  }

  // Parse arrays (comma-separated) for tags
  if (field.toLowerCase().trim() === 'tags') {
    parsedValue = (parsedValue as string)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Parse status aliases
  if (field.toLowerCase().trim() === 'status') {
    const statusMap: Record<string, string> = {
      active: 'active',
      live: 'active',
      draft: 'draft',
      inactive: 'draft',
      archived: 'archived',
    };
    parsedValue = statusMap[(parsedValue as string).toLowerCase()] || parsedValue;
  }

  return [{ op: 'replace', path, value: parsedValue }];
}

// =============================================================================
// Suggestion Generators
// =============================================================================

/**
 * Generate a suggested prompt template based on context
 */
export function suggestPrompt(context: PromptCopilotContext): Partial<PromptPayload> {
  return {
    executionPrompt: 'Explore this topic with the user...',
    variant: 'default',
    baseWeight: 50,
    topicAffinities: [],
    lensAffinities: [],
    targeting: {},
  };
}

/**
 * Suggest targeting configuration based on current prompt content
 */
export function suggestTargeting(
  prompt: GroveObject<PromptPayload>
): PromptTargeting {
  const suggestions: PromptTargeting = {};

  // If prompt has topic affinities, suggest related targeting
  if (prompt.payload.topicAffinities.length > 0) {
    suggestions.minConfidence = 0.5;
  }

  // If prompt has lens affinities, suggest those lens IDs
  if (prompt.payload.lensAffinities.length > 0) {
    suggestions.lensIds = prompt.payload.lensAffinities.map((a) => a.lensId);
  }

  // Suggest not requiring moment by default
  suggestions.requireMoment = false;

  return suggestions;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a prompt configuration
 */
export function validatePrompt(
  prompt: GroveObject<PromptPayload>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title validation (now in meta)
  if (!prompt.meta.title || prompt.meta.title.length === 0) {
    errors.push('Title is required');
  } else if (prompt.meta.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  // Execution prompt validation
  if (
    !prompt.payload.executionPrompt ||
    prompt.payload.executionPrompt.length === 0
  ) {
    errors.push('Execution prompt is required');
  }

  // Base weight validation
  if (prompt.payload.baseWeight < 0 || prompt.payload.baseWeight > 100) {
    errors.push('Base weight must be between 0 and 100');
  }

  // Affinity warnings
  if (
    prompt.payload.topicAffinities.length === 0 &&
    prompt.payload.lensAffinities.length === 0
  ) {
    warnings.push('No affinities defined - prompt may not surface contextually');
  }

  // Targeting warnings
  if (Object.keys(prompt.payload.targeting).length === 0) {
    warnings.push('No targeting defined - prompt may surface in all contexts');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Action Dispatcher
// =============================================================================

/**
 * Main dispatcher for copilot actions
 */
export async function handleCopilotAction(
  actionId: string,
  context: PromptCopilotContext,
  userInput?: string
): Promise<CopilotActionResult> {
  switch (actionId) {
    case 'suggest-prompt':
      return {
        success: true,
        message: 'Generated prompt suggestion',
        suggestedPrompt: suggestPrompt(context),
      };

    case 'validate':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      const validation = validatePrompt(context.selectedPrompt);
      return {
        success: validation.valid,
        message: validation.valid
          ? 'Prompt is valid'
          : `Validation failed: ${validation.errors.join(', ')}`,
      };

    case 'suggest-targeting':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      const targeting = suggestTargeting(context.selectedPrompt);
      return {
        success: true,
        message: 'Generated targeting suggestion',
        operations: [
          { op: 'replace', path: '/payload/targeting', value: targeting },
        ],
      };

    case 'activate':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      return {
        success: true,
        message: 'Prompt activated',
        operations: [{ op: 'replace', path: '/meta/status', value: 'active' }],
      };

    case 'deactivate':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      return {
        success: true,
        message: 'Prompt deactivated',
        operations: [{ op: 'replace', path: '/meta/status', value: 'draft' }],
      };

    default:
      // Try parsing as natural language command
      if (userInput) {
        const ops = parseSetCommand(userInput);
        if (ops) {
          return {
            success: true,
            message: `Applied: ${userInput}`,
            operations: ops,
          };
        }
      }
      return { success: false, message: `Unknown action: ${actionId}` };
  }
}

export default handleCopilotAction;
