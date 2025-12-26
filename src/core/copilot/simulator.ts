// src/core/copilot/simulator.ts
// Simulated model responses for MVP

import type { ParsedIntent, JsonPatch, ModelConfig, ValidationError } from './schema';

/**
 * Response templates for different intent types
 */
const RESPONSE_TEMPLATES: Record<string, (...args: unknown[]) => string> = {
  SET_FIELD: (field: unknown, value: unknown) =>
    `I've drafted a change to set **${field}** to "${value}". How does this look?`,

  UPDATE_FIELD: (field: unknown, modifier: unknown) =>
    `I've made the ${field} ${modifier}. Here's the proposed change:`,

  ADD_TAG: (tag: unknown) =>
    `I'll add the tag "${tag}" to this object.`,

  REMOVE_TAG: (tag: unknown) =>
    `I'll remove the tag "${tag}" from this object.`,

  TOGGLE_FAVORITE_TRUE: () =>
    `I'll mark this as a favorite. ⭐`,

  TOGGLE_FAVORITE_FALSE: () =>
    `I'll remove this from your favorites.`,

  APPLIED: () =>
    `✓ Changes applied successfully.`,

  EMPTY_PATCH: () =>
    `No changes needed - the object already has that value.`,

  UNKNOWN: () =>
    `I didn't quite understand that. Try something like:\n` +
    `• "Set title to 'New Title'"\n` +
    `• "Add tag 'important'"\n` +
    `• "Make description shorter"\n` +
    `• "Mark as favorite"`,

  VALIDATION_ERROR: (errors: unknown) =>
    `I can't make that change:\n` +
    (errors as ValidationError[]).map(e => `• ${e.message}`).join('\n'),
};

/**
 * Generate a response message for an intent
 */
export function generateResponseMessage(
  intent: ParsedIntent,
  patch: JsonPatch
): string {
  if (patch.length === 0 && intent.type !== 'UNKNOWN') {
    return RESPONSE_TEMPLATES.EMPTY_PATCH();
  }

  switch (intent.type) {
    case 'SET_FIELD':
      return RESPONSE_TEMPLATES.SET_FIELD(intent.field, intent.value);

    case 'UPDATE_FIELD':
      return RESPONSE_TEMPLATES.UPDATE_FIELD(intent.field, intent.modifier);

    case 'ADD_TAG':
      return RESPONSE_TEMPLATES.ADD_TAG(String(intent.value));

    case 'REMOVE_TAG':
      return RESPONSE_TEMPLATES.REMOVE_TAG(String(intent.value));

    case 'TOGGLE_FAVORITE':
      return intent.value
        ? RESPONSE_TEMPLATES.TOGGLE_FAVORITE_TRUE()
        : RESPONSE_TEMPLATES.TOGGLE_FAVORITE_FALSE();

    default:
      return RESPONSE_TEMPLATES.UNKNOWN();
  }
}

/**
 * Generate error message for validation failures
 */
export function generateValidationErrorMessage(errors: ValidationError[]): string {
  return RESPONSE_TEMPLATES.VALIDATION_ERROR(errors);
}

/**
 * Generate success message after applying patch
 */
export function generateAppliedMessage(): string {
  return RESPONSE_TEMPLATES.APPLIED();
}

/**
 * Simulate model processing delay
 */
export async function simulateDelay(config: ModelConfig): Promise<void> {
  const [min, max] = config.latencyMs;
  const delay = min + Math.random() * (max - min);
  await new Promise(resolve => setTimeout(resolve, delay));
}
