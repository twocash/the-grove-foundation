// src/core/context-fields/lookup.ts
// Prompt lookup by highlight text
// Sprint: kinetic-highlights-v1

import type { PromptObject, HighlightTrigger } from './types';
import { canRenderOnSurface } from './types';

export interface HighlightLookupContext {
  lensId?: string;
  stage?: string;
}

/**
 * Find the best prompt for a highlighted text span
 */
export function findPromptForHighlight(
  spanText: string,
  prompts: PromptObject[],
  context?: HighlightLookupContext
): PromptObject | null {
  // Filter to highlight-capable prompts with triggers
  const highlightPrompts = prompts.filter(p =>
    canRenderOnSurface(p, 'highlight') &&
    p.highlightTriggers?.length
  );

  if (highlightPrompts.length === 0) {
    return null;
  }

  // Priority 1: Exact match
  const exactMatch = findByMatchMode(highlightPrompts, spanText, 'exact');
  if (exactMatch) return exactMatch;

  // Priority 2: Contains match
  const containsMatch = findByMatchMode(highlightPrompts, spanText, 'contains');
  if (containsMatch) return containsMatch;

  // Priority 3: Context-aware affinity
  if (context?.lensId || context?.stage) {
    return findByAffinity(highlightPrompts, context);
  }

  return null;
}

function findByMatchMode(
  prompts: PromptObject[],
  spanText: string,
  mode: 'exact' | 'contains'
): PromptObject | null {
  for (const prompt of prompts) {
    for (const trigger of prompt.highlightTriggers!) {
      if (trigger.matchMode !== mode) continue;

      const span = trigger.caseSensitive ? spanText : spanText.toLowerCase();
      const text = trigger.caseSensitive ? trigger.text : trigger.text.toLowerCase();

      if (mode === 'exact' && span === text) {
        return prompt;
      }
      if (mode === 'contains' && span.includes(text)) {
        return prompt;
      }
    }
  }
  return null;
}

function findByAffinity(
  prompts: PromptObject[],
  context: HighlightLookupContext
): PromptObject | null {
  let bestPrompt: PromptObject | null = null;
  let bestScore = 0;

  for (const prompt of prompts) {
    let score = 0;

    if (context.lensId) {
      const lensAffinity = prompt.lensAffinities?.find(a => a.lensId === context.lensId);
      if (lensAffinity) score += lensAffinity.weight * 10;
    }

    if (context.stage) {
      const hasStage = prompt.targeting?.stages?.includes(context.stage as any);
      if (hasStage) score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPrompt = prompt;
    }
  }

  return bestPrompt;
}

/**
 * Get all prompts that can render as highlights
 */
export function getHighlightPrompts(prompts: PromptObject[]): PromptObject[] {
  return prompts.filter(p => canRenderOnSurface(p, 'highlight'));
}

/**
 * Check if any prompt matches a highlight trigger
 */
export function hasMatchingPrompt(
  spanText: string,
  prompts: PromptObject[]
): boolean {
  return findPromptForHighlight(spanText, prompts) !== null;
}
