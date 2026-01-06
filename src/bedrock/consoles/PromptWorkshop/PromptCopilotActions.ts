// src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts
// Prompt-specific Copilot action handlers
// Sprint: prompt-schema-rationalization-v1 (Epic 3)

import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, PromptTargeting } from '@core/schema/prompt';
import type { PatchOperation } from '../../types/copilot.types';
import { generateVariants, toConceptName } from '@core/utils/TitleTransforms';
import { inferTargetingFromSalience } from './utils/TargetingInference';

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

      // Call AI-powered targeting suggestion API
      // Send prompt data in body to support both library and Supabase prompts
      try {
        const response = await fetch(`/api/prompts/${context.selectedPrompt.meta.id}/suggest-targeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: {
              title: context.selectedPrompt.meta.title,
              description: context.selectedPrompt.meta.description,
              payload: context.selectedPrompt.payload,
            },
          }),
        });

        if (!response.ok) {
          // Log error for debugging
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`[suggest-targeting] API error ${response.status}:`, errorText);

          // Fallback to rule-based inference if API fails - still apply operations
          const salienceDimensions = context.selectedPrompt.payload.salienceDimensions || [];
          const interestingBecause = context.selectedPrompt.payload.interestingBecause || '';
          const fallbackSuggestion = inferTargetingFromSalience(salienceDimensions, interestingBecause);
          const stageList = fallbackSuggestion.suggestedStages.join(' → ');
          const lensIds = fallbackSuggestion.lensAffinities.map(l => l.lensId);

          return {
            success: true,
            message: `(API error ${response.status} - applied rule-based targeting)\n\n` +
              `**Stages:** ${stageList}\n` +
              `**Lens IDs:** ${lensIds.join(', ')}\n\n` +
              `**Reasoning:** ${fallbackSuggestion.reasoning}`,
            operations: [
              { op: 'replace', path: '/payload/targeting/stages', value: fallbackSuggestion.suggestedStages },
              { op: 'replace', path: '/payload/targeting/lensIds', value: lensIds },
              { op: 'replace', path: '/payload/lensAffinities', value: fallbackSuggestion.lensAffinities.map(l => ({
                lensId: l.lensId,
                weight: l.weight,
              })) },
            ],
          };
        }

        const data = await response.json();
        const suggestedStages = data.suggestedStages || ['genesis'];
        const lensAffinities = (data.lensAffinities || []) as { lensId: string; weight: number; reasoning?: string }[];
        const stageList = suggestedStages.join(' → ');
        const lensIds = lensAffinities.map(l => l.lensId);

        // Build operations to apply all targeting suggestions
        const operations: PatchOperation[] = [
          // Set stages in targeting
          { op: 'replace', path: '/payload/targeting/stages', value: suggestedStages },
          // Set lens IDs in targeting (for filtering)
          { op: 'replace', path: '/payload/targeting/lensIds', value: lensIds },
          // Set full lens affinities with weights
          { op: 'replace', path: '/payload/lensAffinities', value: lensAffinities.map(l => ({
            lensId: l.lensId,
            weight: l.weight,
          })) },
        ];

        return {
          success: true,
          message: `**AI Targeting Applied ✓**\n\n` +
            `**Stages:** ${stageList}\n` +
            `_${data.stageReasoning || ''}_\n\n` +
            `**Lens IDs:** ${lensIds.join(', ')}\n\n` +
            `**Affinities:**\n` +
            lensAffinities.slice(0, 4).map(l =>
              `- **${l.lensId}** (${(l.weight * 100).toFixed(0)}%): ${l.reasoning || ''}`
            ).join('\n') +
            `\n\n_${data.overallReasoning || ''}_`,
          operations,
        };
      } catch (err) {
        // Fallback on network error - still apply operations
        const salienceDimensions = context.selectedPrompt.payload.salienceDimensions || [];
        const interestingBecause = context.selectedPrompt.payload.interestingBecause || '';
        const fallbackSuggestion = inferTargetingFromSalience(salienceDimensions, interestingBecause);
        const stageList = fallbackSuggestion.suggestedStages.join(' → ');
        const lensIds = fallbackSuggestion.lensAffinities.map(l => l.lensId);

        return {
          success: true,
          message: `(Network error - using rule-based inference)\n\n` +
            `**Stages:** ${stageList}\n` +
            `**Lens IDs:** ${lensIds.join(', ')}\n\n` +
            `**Reasoning:** ${fallbackSuggestion.reasoning}`,
          operations: [
            { op: 'replace', path: '/payload/targeting/stages', value: fallbackSuggestion.suggestedStages },
            { op: 'replace', path: '/payload/targeting/lensIds', value: lensIds },
            { op: 'replace', path: '/payload/lensAffinities', value: fallbackSuggestion.lensAffinities.map(l => ({
              lensId: l.lensId,
              weight: l.weight,
            })) },
          ],
        };
      }

    case 'make-compelling':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }

      // Call AI-powered title suggestion API
      // Send prompt data in body to support both library and Supabase prompts
      try {
        const response = await fetch(`/api/prompts/${context.selectedPrompt.meta.id}/suggest-titles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: {
              title: context.selectedPrompt.meta.title,
              description: context.selectedPrompt.meta.description,
              payload: context.selectedPrompt.payload,
            },
          }),
        });

        if (!response.ok) {
          // Fallback to mechanical transforms if API fails
          const currentTitle = context.selectedPrompt.meta?.title || 'Untitled';
          const conceptName = toConceptName(currentTitle);
          const fallbackVariants = generateVariants(conceptName, 3);
          return {
            success: true,
            message: `(API unavailable - using basic transforms)\n\n` +
              fallbackVariants.map((v, i) =>
                `${i + 1}. ${v.title}\n   _Format: ${v.format}_`
              ).join('\n\n') +
              `\n\nCopy the full title, e.g.:\nset title to ${fallbackVariants[0]?.title || 'Your Title'}`,
          };
        }

        const data = await response.json();
        const aiVariants = data.variants || [];

        if (aiVariants.length === 0) {
          return { success: false, message: 'No title suggestions generated. Try again.' };
        }

        return {
          success: true,
          message: `Here are 3 AI-generated title suggestions:\n\n` +
            aiVariants.map((v: { title: string; format: string; reasoning?: string }, i: number) =>
              `${i + 1}. ${v.title}\n   _${v.format}_ — ${v.reasoning || ''}`
            ).join('\n\n') +
            `\n\nCopy the full title, e.g.:\nset title to ${aiVariants[0]?.title || 'Your Title'}`,
        };
      } catch (err) {
        // Fallback on network error
        const currentTitle = context.selectedPrompt.meta?.title || 'Untitled';
        const conceptName = toConceptName(currentTitle);
        const fallbackVariants = generateVariants(conceptName, 3);
        return {
          success: true,
          message: `(Network error - using basic transforms)\n\n` +
            fallbackVariants.map((v, i) =>
              `${i + 1}. ${v.title}\n   _Format: ${v.format}_`
            ).join('\n\n') +
            `\n\nCopy the full title, e.g.:\nset title to ${fallbackVariants[0]?.title || 'Your Title'}`,
        };
      }

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
