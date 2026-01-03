// hooks/useSuggestedPrompts.ts
// Context Fields-based prompt selection with 4D targeting
// Sprint: genesis-context-fields-v1 (Epic 4)
//
// Replaces legacy stage-prompts.ts imperative filtering with declarative
// Context Fields targeting (Stage, Entropy, Lens, Moment)

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useContextState } from './useContextState';
import { usePromptCollection } from './usePromptCollection';
import { applyHardFilters, rankPrompts } from '@core/context-fields';
import type { PromptObject, ScoringWeights, Stage } from '@core/context-fields';

export interface UseSuggestedPromptsOptions {
  maxPrompts?: number;
  includeGenerated?: boolean;
  scoringOverrides?: Partial<ScoringWeights>;
}

/**
 * Legacy-compatible prompt format for Terminal.tsx
 * Maps PromptObject properties to expected interface
 */
export interface LegacySuggestedPrompt {
  id: string;
  text: string;          // Maps from PromptObject.label
  command?: string;      // Extracted from tags (e.g., "command:/garden")
  journeyId?: string;    // Extracted from tags (e.g., "journey:simulation")
}

/**
 * Convert PromptObject to legacy format for Terminal.tsx compatibility
 */
function toLegacyPrompt(prompt: PromptObject): LegacySuggestedPrompt {
  // Extract command from tags (format: "command:/garden")
  const commandTag = prompt.tags.find(t => t.startsWith('command:'));
  const command = commandTag ? commandTag.replace('command:', '') : undefined;

  // Extract journeyId from tags (format: "journey:simulation")
  const journeyTag = prompt.tags.find(t => t.startsWith('journey:'));
  const journeyId = journeyTag ? journeyTag.replace('journey:', '') : undefined;

  return {
    id: prompt.id,
    text: prompt.label,
    command,
    journeyId,
  };
}

export interface UseSuggestedPromptsResult {
  prompts: LegacySuggestedPrompt[];
  stage: Stage;
  entropy: number;
  activeMoments: string[];
  isLoading: boolean;
  error: Error | null;
  refreshPrompts: () => void;
  trackSelection: (promptId: string) => void;
}

/**
 * Hook for getting context-aware prompt suggestions
 * Uses 4D targeting: Stage, Entropy, Lens, Moment
 */
export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { maxPrompts = 3, includeGenerated = true, scoringOverrides } = options;

  const context = useContextState();
  const { library, generated, usedIds, isLoading, error, trackSelection, generateForContext } = usePromptCollection();

  // Track previous interaction count to trigger generation
  const prevInteractionCount = useRef(context.interactionCount);

  // Trigger generation when interaction count changes (Epic 5)
  useEffect(() => {
    if (includeGenerated && context.interactionCount > prevInteractionCount.current) {
      prevInteractionCount.current = context.interactionCount;
      generateForContext(context);
    }
  }, [context.interactionCount, context, includeGenerated, generateForContext]);

  const prompts = useMemo(() => {
    // Combine sources
    let allPrompts = [...library];
    if (includeGenerated && context.interactionCount >= 2) {
      allPrompts = [...allPrompts, ...generated];
    }

    // Filter out already-used prompts (immediate refresh on click)
    const unused = allPrompts.filter(p => !usedIds.has(p.id));

    // Hard filters (stage, lens exclusion, minInteractions)
    const eligible = applyHardFilters(unused, context);

    // Soft scoring with optional overrides
    const weights = scoringOverrides ? { ...scoringOverrides } as ScoringWeights : undefined;
    const scored = rankPrompts(eligible, context, weights);

    // Return top N, converted to legacy format for Terminal.tsx compatibility
    return scored.slice(0, maxPrompts).map(s => toLegacyPrompt(s.prompt));
  }, [library, generated, usedIds, context, maxPrompts, includeGenerated, scoringOverrides]);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useSuggestedPrompts]', context.stage, '→', prompts.length, 'prompts');
    console.log('[useSuggestedPrompts] Active lens:', context.activeLensId);
    console.log('[useSuggestedPrompts] Prompt labels:', prompts.map(p => p.text.substring(0, 50) + '...'));
  }

  const refreshPrompts = useCallback(() => {
    // Force re-evaluation happens via context change
    // This is a placeholder for future explicit refresh logic
  }, []);

  return {
    prompts,
    stage: context.stage,
    entropy: context.entropy,
    activeMoments: context.activeMoments,
    isLoading,
    error,
    refreshPrompts,
    trackSelection,
  };
}
