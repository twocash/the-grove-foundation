// src/explore/hooks/useNavigationPrompts.ts
// Sprint: kinetic-suggested-prompts-v1
// Sprint: prompt-progression-v1 - Single prompt progression
// Wires 4D Context Fields to inline navigation prompts

import { useMemo } from 'react';
import { useContextState } from '@core/context-fields/useContextState';
import { selectPrompts } from '@core/context-fields/scoring';
import { promptsToForks } from '@core/context-fields/adapters';
import { libraryPrompts, getActivePrompts } from '@data/prompts';
import type { JourneyFork } from '@core/schema/stream';

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
  const result = useMemo(() => {
    // Get prompt pool
    const pool = activeOnly ? getActivePrompts() : libraryPrompts;

    // Select prompts using 4D scoring
    // Sprint: prompt-progression-v1 - Filters out already-selected prompts
    const selected = selectPrompts(pool, context, { maxPrompts, minScore });

    // Convert to navigation forks
    const forks = promptsToForks(selected);

    return {
      forks,
      eligibleCount: selected.length
    };
  }, [context, maxPrompts, minScore, activeOnly]);

  return {
    forks: result.forks,
    isReady: true,
    eligibleCount: result.eligibleCount
  };
}

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
      eligibleCount: 0
    };
  }
}
