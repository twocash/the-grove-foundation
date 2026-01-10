// src/core/context-fields/useContextState.ts
// Sprint: kinetic-suggested-prompts-v1
// Aggregates EngagementContext → ContextState for 4D prompt targeting

import { useMemo } from 'react';
import { useSelector } from '@xstate/react';
import { useEngagement } from '@core/engagement/context';
import type { ContextState, Stage } from './types';
import type { StreamItem } from '../schema/stream';

/**
 * Hook that aggregates EngagementContext into a ContextState
 * for use with the 4D prompt targeting system.
 */
export function useContextState(): ContextState {
  const { actor } = useEngagement();

  const contextState = useSelector(actor, (state) => {
    const ctx = state.context;

    // Count interactions from stream history
    const interactionCount = ctx.streamHistory?.filter(
      (i: StreamItem) => i.type === 'query'
    ).length ?? 0;

    // Count sprouts captured
    const sproutCount = ctx.sproutCaptures?.length ?? 0;

    // Get topics explored
    const topicsExplored = ctx.topicExplorations?.map(t => t.topicId) ?? [];

    // Evaluate active moments
    const activeMoments = evaluateMoments(ctx);

    return {
      stage: computeStage(interactionCount, sproutCount),
      entropy: ctx.entropy ?? 0,
      activeLensId: ctx.lens ?? null,
      activeMoments,
      interactionCount,
      topicsExplored,
      sproutsCaptured: sproutCount,
      offTopicCount: 0, // Future: track off-topic queries
      // Prompt progression tracking (Sprint: prompt-progression-v1)
      promptsSelected: ctx.promptsSelected ?? []
    } satisfies ContextState;
  });

  return contextState;
}

/**
 * Compute the user's stage based on interaction metrics.
 *
 * - genesis: New user, first 5 interactions (onboarding period)
 * - exploration: Early engagement (6-14 interactions)
 * - synthesis: Deeper exploration (15+ interactions, no captures)
 * - advocacy: Contributing back (has captured sprouts)
 *
 * Sprint: navigation-dex-cleanup-v1 - Extended genesis to 0-5 interactions
 * to match the onboarding prompt targeting window.
 */
function computeStage(interactionCount: number, sproutCount: number): Stage {
  if (sproutCount > 0) return 'advocacy';
  if (interactionCount <= 5) return 'genesis';
  if (interactionCount <= 15) return 'exploration';
  return 'synthesis';
}

/**
 * Evaluate which moments are currently active based on context.
 */
function evaluateMoments(ctx: {
  entropy?: number;
  streamHistory?: StreamItem[];
  hubsVisited?: string[];
  flags?: Record<string, boolean>;
}): string[] {
  const moments: string[] = [];

  // High entropy moment: user is exploring widely
  if ((ctx.entropy ?? 0) > 0.7) {
    moments.push('high_entropy');
  }

  // Low entropy moment: user is focused on narrow topic
  if ((ctx.entropy ?? 0) < 0.2 && (ctx.streamHistory?.length ?? 0) > 3) {
    moments.push('low_entropy');
  }

  // First visit moment
  if ((ctx.streamHistory?.length ?? 0) === 0) {
    moments.push('first_visit');
  }

  // Deep dive moment: many queries in same hub
  const hubCount = ctx.hubsVisited?.length ?? 0;
  const queryCount = ctx.streamHistory?.filter(i => i.type === 'query').length ?? 0;
  if (hubCount === 1 && queryCount >= 5) {
    moments.push('deep_dive');
  }

  // Check for explicit flags
  if (ctx.flags?.journeyCompleted) {
    moments.push('journey_complete');
  }

  return moments;
}

/**
 * Create a default/empty ContextState for testing or fallback.
 */
export function createDefaultContextState(): ContextState {
  return {
    stage: 'genesis',
    entropy: 0,
    activeLensId: null,
    activeMoments: ['first_visit'],
    interactionCount: 0,
    topicsExplored: [],
    sproutsCaptured: 0,
    offTopicCount: 0,
    // Prompt progression tracking (Sprint: prompt-progression-v1)
    promptsSelected: []
  };
}
