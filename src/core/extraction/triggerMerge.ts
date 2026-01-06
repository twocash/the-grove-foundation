/**
 * Merge logic for highlight prompts with overlapping triggers
 * @sprint highlight-extraction-v1
 */
import type { PromptObject } from '@core/context-fields/types';

export type MergeStrategy = 'favor-newer' | 'favor-higher-confidence' | 'keep-all';

/**
 * Check if two prompts have overlapping triggers
 */
function hasOverlappingTriggers(a: PromptObject, b: PromptObject): boolean {
  const aTriggers = a.highlightTriggers?.map((t) => t.text.toLowerCase()) || [];
  const bTriggers = b.highlightTriggers?.map((t) => t.text.toLowerCase()) || [];

  return aTriggers.some((t) => bTriggers.includes(t));
}

/**
 * Get overlapping trigger terms between two prompts
 */
export function getOverlappingTriggers(a: PromptObject, b: PromptObject): string[] {
  const aTriggers = a.highlightTriggers?.map((t) => t.text.toLowerCase()) || [];
  const bTriggers = b.highlightTriggers?.map((t) => t.text.toLowerCase()) || [];

  return aTriggers.filter((t) => bTriggers.includes(t));
}

/**
 * Merge new prompts with existing, handling duplicates by strategy
 *
 * @param newPrompts - Newly extracted prompts
 * @param existingPrompts - Existing prompts in library
 * @param strategy - How to handle duplicates
 * @returns Merged array
 */
export function mergeHighlightPrompts(
  newPrompts: PromptObject[],
  existingPrompts: PromptObject[],
  strategy: MergeStrategy = 'favor-newer'
): PromptObject[] {
  if (strategy === 'keep-all') {
    return [...existingPrompts, ...newPrompts];
  }

  const result = [...existingPrompts];

  for (const newPrompt of newPrompts) {
    const existingIndex = result.findIndex((existing) => hasOverlappingTriggers(existing, newPrompt));

    if (existingIndex === -1) {
      // No overlap, add new prompt
      result.push(newPrompt);
    } else {
      // Overlap found, apply strategy
      const existing = result[existingIndex];

      if (strategy === 'favor-newer') {
        result[existingIndex] = newPrompt;
      } else if (strategy === 'favor-higher-confidence') {
        const existingConf = existing.provenance?.extractionConfidence ?? 0;
        const newConf = newPrompt.provenance?.extractionConfidence ?? 0;

        if (newConf > existingConf) {
          result[existingIndex] = newPrompt;
        }
      }
    }
  }

  return result;
}

/**
 * Find prompts with conflicting triggers (for review UI)
 */
export function findConflictingPrompts(
  prompts: PromptObject[]
): Array<{ promptA: PromptObject; promptB: PromptObject; overlappingTriggers: string[] }> {
  const conflicts: Array<{ promptA: PromptObject; promptB: PromptObject; overlappingTriggers: string[] }> = [];

  for (let i = 0; i < prompts.length; i++) {
    for (let j = i + 1; j < prompts.length; j++) {
      const overlapping = getOverlappingTriggers(prompts[i], prompts[j]);
      if (overlapping.length > 0) {
        conflicts.push({
          promptA: prompts[i],
          promptB: prompts[j],
          overlappingTriggers: overlapping,
        });
      }
    }
  }

  return conflicts;
}
