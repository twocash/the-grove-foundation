// src/explore/hooks/usePromptSuggestions.ts
// Hook for getting contextual prompt suggestions
// Sprint: prompt-unification-v1
//
// @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
// This hook is preserved for backward compatibility only.
// Sprint: kinetic-suggested-prompts-v1

import { useMemo, useEffect } from 'react';
import { useGroveData } from '@core/data';
import type { Prompt, PromptPayload } from '@core/schema/prompt';
import { scorePrompt, type ExplorationContext } from '../utils/scorePrompt';

/**
 * Options for usePromptSuggestions hook
 */
export interface UsePromptSuggestionsOptions extends ExplorationContext {
  /** Maximum number of suggestions to return */
  limit?: number;
  /** Only include prompts from these sequences */
  sequenceFilter?: string[];
  /** Exclude prompts from these sequences */
  excludeSequences?: string[];
}

/**
 * Hook for getting contextual prompt suggestions
 *
 * @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
 * This hook is preserved for backward compatibility only.
 * Sprint: kinetic-suggested-prompts-v1
 *
 * Uses the unified Prompt scoring algorithm to surface the most
 * relevant prompts for the current exploration context.
 *
 * @example
 * ```tsx
 * const suggestions = usePromptSuggestions({
 *   stage: 'exploration',
 *   lensId: 'academic',
 *   entropy: 0.5,
 *   activeTopics: ['ratchet-effect'],
 *   activeMoments: [],
 *   interactions: 3,
 *   limit: 4
 * });
 * ```
 */
export function usePromptSuggestions(options: UsePromptSuggestionsOptions): Prompt[] {
  // Emit deprecation warning once per component
  useEffect(() => {
    console.warn(
      '[DEPRECATED] usePromptSuggestions - use useNavigationPrompts from @explore/hooks instead'
    );
  }, []);
  const { objects: prompts, loading } = useGroveData<PromptPayload>('prompt');

  const {
    limit = 6,
    sequenceFilter,
    excludeSequences,
    ...context
  } = options;

  return useMemo(() => {
    if (loading || !prompts.length) {
      return [];
    }

    // Apply sequence filters
    let filtered = prompts.filter((p) => p.meta.status === 'active');

    if (sequenceFilter?.length) {
      filtered = filtered.filter((p) =>
        p.payload.sequences?.some((s) => sequenceFilter.includes(s.groupId))
      );
    }

    if (excludeSequences?.length) {
      filtered = filtered.filter(
        (p) =>
          !p.payload.sequences?.some((s) => excludeSequences.includes(s.groupId))
      );
    }

    // Score and sort
    const scored = filtered
      .map((p) => ({ prompt: p, score: scorePrompt(p, context) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    // Return top N
    return scored.slice(0, limit).map(({ prompt }) => prompt);
  }, [prompts, loading, limit, sequenceFilter, excludeSequences, context]);
}

export default usePromptSuggestions;
