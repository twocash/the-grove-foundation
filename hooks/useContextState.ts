// hooks/useContextState.ts
// Context state aggregation hook
// Sprint: genesis-context-fields-v1 (Epic 3)

import { useMemo } from 'react';
import { useEngagementState } from './useEngagementBus';
import { useNarrativeEngine } from './useNarrativeEngine';
import type { ContextState } from '@core/context-fields/types';
import { mapSessionStageToStage } from '@core/context-fields/types';

/**
 * Hook that aggregates 4D context state from EngagementBus + NarrativeEngine
 * for use with Context Fields prompt targeting
 *
 * Note: activeLensId comes from NarrativeEngine (session.activeLens) because
 * the EngagementBus's activeLensId isn't synchronized with URL lens hydration.
 * This is a known architectural issue - two state systems that should eventually merge.
 */
export function useContextState(): ContextState {
  const engagement = useEngagementState();
  const { session } = useNarrativeEngine();

  const context = useMemo(() => ({
    stage: mapSessionStageToStage(engagement.stage),
    entropy: engagement.computedEntropy,
    // Use NarrativeEngine's lens (synced with URL hydration) instead of EngagementBus
    activeLensId: session.activeLens,
    activeMoments: engagement.activeMoments,
    interactionCount: engagement.exchangeCount,
    topicsExplored: engagement.topicsExplored || [],
    sproutsCaptured: engagement.sproutsCaptured,
    offTopicCount: 0, // TODO: Track in telemetry
  }), [engagement, session.activeLens]);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useContextState] activeLensId:', context.activeLensId);
  }

  return context;
}
