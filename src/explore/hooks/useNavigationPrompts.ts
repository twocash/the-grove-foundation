// src/explore/hooks/useNavigationPrompts.ts
// Sprint: kinetic-suggested-prompts-v1
// Sprint: prompt-progression-v1 - Single prompt progression
// Sprint: 4d-prompt-refactor-telemetry-v1 - Expose scored prompts for telemetry
// Wires 4D Context Fields to inline navigation prompts

import { useMemo } from 'react';
import { useContextState } from '@core/context-fields/useContextState';
import { selectPromptsWithScoring } from '@core/context-fields/scoring';
import { promptsToForks } from '@core/context-fields/adapters';
import { libraryPrompts, getActivePrompts } from '@data/prompts';
import type { JourneyFork } from '@core/schema/stream';
import type { ScoredPrompt, ContextState } from '@core/context-fields/types';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface UseNavigationPromptsOptions {
  /**
   * Maximum number of prompts to return.
   * Sprint: prompt-progression-v1 - Changed default from 3 to 1
   * Shows prompts one at a time in logical progression.
   */
  maxPrompts?: number;
  /** Minimum score threshold. Default: 1.0 */
  minScore?: number;
  /** Only use active prompts. Default: true */
  activeOnly?: boolean;
}

export interface NavigationPromptsResult {
  /** Array of navigation forks ready for rendering */
  forks: JourneyFork[];
  /** Whether the context is ready for prompt selection */
  isReady: boolean;
  /** Number of prompts that passed hard filters */
  eligibleCount: number;
  /** Sprint: 4d-prompt-refactor-telemetry-v1 - Scored prompts for telemetry */
  scoredPrompts: ScoredPrompt[];
  /** Sprint: 4d-prompt-refactor-telemetry-v1 - Context snapshot for telemetry */
  context: ContextState;
}

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────

/**
 * Hook that selects navigation prompts based on 4D context.
 *
 * Uses the existing Context Fields infrastructure:
 * 1. Aggregates engagement state via useContextState
 * 2. Filters/scores prompts via selectPrompts
 * 3. Converts to JourneyForks via promptsToForks
 *
 * @example
 * ```tsx
 * function ResponseFooter() {
 *   const { forks, isReady } = useNavigationPrompts({ maxPrompts: 3 });
 *
 *   if (!isReady || forks.length === 0) return null;
 *
 *   return <NavigationBlock forks={forks} />;
 * }
 * ```
 */
export function useNavigationPrompts(
  options: UseNavigationPromptsOptions = {}
): NavigationPromptsResult {
  // Sprint: prompt-progression-v1 - Default to 1 prompt at a time
  const { maxPrompts = 1, minScore = 1.0, activeOnly = true } = options;

  // Get aggregated 4D context from engagement state
  const context = useContextState();

  // Select and convert prompts
  // Sprint: 4d-prompt-refactor-telemetry-v1 - Use selectPromptsWithScoring for telemetry
  const result = useMemo(() => {
    // Get prompt pool
    const pool = activeOnly ? getActivePrompts() : libraryPrompts;

    // Select prompts using 4D scoring - returns ScoredPrompt[] for telemetry
    const scoredPrompts = selectPromptsWithScoring(pool, context, { maxPrompts, minScore });

    // Convert to navigation forks (extract prompts first)
    const forks = promptsToForks(scoredPrompts.map(sp => sp.prompt));

    return {
      forks,
      scoredPrompts,
      eligibleCount: scoredPrompts.length
    };
  }, [context, maxPrompts, minScore, activeOnly]);

  return {
    forks: result.forks,
    isReady: true,
    eligibleCount: result.eligibleCount,
    scoredPrompts: result.scoredPrompts,
    context
  };
}

// Default context for safe fallback
const DEFAULT_CONTEXT: ContextState = {
  stage: 'genesis',
  activeLensId: null,
  entropy: 0,
  interactionCount: 0,
  topicsExplored: [],
  activeMoments: [],
  promptsSelected: [],
};

/**
 * Safe version that returns empty forks when outside EngagementProvider.
 */
export function useSafeNavigationPrompts(
  options: UseNavigationPromptsOptions = {}
): NavigationPromptsResult {
  try {
    return useNavigationPrompts(options);
  } catch {
    return {
      forks: [],
      isReady: false,
      eligibleCount: 0,
      scoredPrompts: [],
      context: DEFAULT_CONTEXT
    };
  }
}
