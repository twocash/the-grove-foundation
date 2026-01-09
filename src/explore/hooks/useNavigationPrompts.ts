// src/explore/hooks/useNavigationPrompts.ts
// Sprint: kinetic-suggested-prompts-v1
// Sprint: prompt-progression-v1 - Single prompt progression
// Sprint: 4d-prompt-refactor-telemetry-v1 - Expose scored prompts for telemetry
// Sprint: supabase-prompt-wiring-v1 - Switched from static JSON to Grove data layer
// Wires 4D Context Fields to inline navigation prompts

import { useMemo } from 'react';
import { useGroveData } from '@core/data';
import { useContextState } from '@core/context-fields/useContextState';
import { selectPromptsWithScoring } from '@core/context-fields/scoring';
import { promptsToForks } from '@core/context-fields/adapters';
import { getEffectiveStatus } from '@bedrock/consoles/PromptWorkshop/utils/libraryPromptOverrides';
import type { Prompt, PromptPayload } from '@core/schema/prompt';
import type { JourneyFork } from '@core/schema/stream';
import type { PromptObject, ScoredPrompt, ContextState } from '@core/context-fields/types';

// ─────────────────────────────────────────────────────────────────
// FORMAT CONVERTER
// Sprint: supabase-prompt-wiring-v1
// Converts GroveObject<PromptPayload> to flat PromptObject for scoring
// ─────────────────────────────────────────────────────────────────

function grovePromptToPromptObject(gp: Prompt): PromptObject {
  return {
    id: gp.meta.id,
    objectType: 'prompt',
    created: new Date(gp.meta.createdAt).getTime(),
    modified: new Date(gp.meta.updatedAt).getTime(),
    author: gp.payload.source === 'library' ? 'system' : gp.payload.source,
    label: gp.meta.title,
    description: gp.meta.description,
    executionPrompt: gp.payload.executionPrompt,
    systemContext: gp.payload.systemContext,
    icon: gp.meta.icon,
    tags: gp.meta.tags || [],
    topicAffinities: gp.payload.topicAffinities,
    lensAffinities: gp.payload.lensAffinities,
    targeting: gp.payload.targeting,
    baseWeight: gp.payload.baseWeight,
    stats: gp.payload.stats,
    status: gp.meta.status as 'draft' | 'active' | 'deprecated',
    source: gp.payload.source,
    provenance: gp.payload.provenance,
    surfaces: gp.payload.surfaces,
    highlightTriggers: gp.payload.highlightTriggers,
  };
}

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

  // Sprint: supabase-prompt-wiring-v1 - Use Grove data layer instead of static JSON
  // BUG FIX: useGroveData returns 'objects', not 'data'
  const { objects: allPrompts, loading } = useGroveData<PromptPayload>('prompt');

  // Get aggregated 4D context from engagement state
  const context = useContextState();

  // Select and convert prompts
  // Sprint: 4d-prompt-refactor-telemetry-v1 - Use selectPromptsWithScoring for telemetry
  // Sprint: supabase-prompt-wiring-v1 - Convert Grove format to flat PromptObject for scoring
  const result = useMemo(() => {
    // DIAGNOSTIC LOGGING - remove after fix verified
    console.log('[NavPrompts] loading:', loading, 'allPrompts:', allPrompts?.length);
    console.log('[NavPrompts] context.stage:', context.stage);
    
    if (loading || !allPrompts.length) {
      return { forks: [], scoredPrompts: [], eligibleCount: 0 };
    }

    // Get prompt pool - filter to active if requested
    // HOTFIX: Respect library prompt status overrides from localStorage
    const grovePool = activeOnly
      ? allPrompts.filter(p => {
          // Library prompts use localStorage overrides
          if (p.payload.source === 'library') {
            return getEffectiveStatus(p.meta.id, p.meta.status as 'active' | 'draft') === 'active';
          }
          return p.meta.status === 'active';
        })
      : allPrompts;

    console.log('[NavPrompts] grovePool (active):', grovePool.length);

    // HOTFIX: Use interaction count to determine genesis phase
    // First 5 interactions = genesis stage, show only genesis-welcome prompts
    let filteredPool = grovePool;
    const isGenesisPhase = context.interactionCount <= 5;
    console.log('[NavPrompts] interactionCount:', context.interactionCount, 'isGenesisPhase:', isGenesisPhase);
    
    if (isGenesisPhase) {
      const genesisTagged = grovePool.filter(p =>
        p.meta.tags?.includes('genesis-welcome')
      );
      console.log('[NavPrompts] GENESIS PHASE - found', genesisTagged.length, 'genesis-welcome prompts');
      if (genesisTagged.length > 0) {
        filteredPool = genesisTagged;
        console.log('[NavPrompts] Using genesis-welcome pool');
      } else {
        console.log('[NavPrompts] WARNING: No genesis-welcome prompts, using full pool');
      }
    }

    // Convert to flat PromptObject format for scoring functions
    const pool = filteredPool.map(grovePromptToPromptObject);
    console.log('[NavPrompts] final pool size:', pool.length);

    // Select prompts using 4D scoring - returns ScoredPrompt[] for telemetry
    const scoredPrompts = selectPromptsWithScoring(pool, context, { maxPrompts, minScore });
    console.log('[NavPrompts] scoredPrompts:', scoredPrompts.length, scoredPrompts.map(sp => sp.prompt.label));

    // Convert to navigation forks (extract prompts first)
    const forks = promptsToForks(scoredPrompts.map(sp => sp.prompt));
    console.log('[NavPrompts] forks:', forks.length);

    return {
      forks,
      scoredPrompts,
      eligibleCount: scoredPrompts.length
    };
  }, [allPrompts, loading, context, maxPrompts, minScore, activeOnly]);

  return {
    forks: result.forks,
    isReady: !loading && allPrompts.length > 0,
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
