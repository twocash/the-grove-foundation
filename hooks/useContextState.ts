// hooks/useContextState.ts
// Context state aggregation hook
// Sprint: genesis-context-fields-v1 (Epic 3)

import { useMemo } from 'react';
import { useEngagementState } from './useEngagementBus';
import type { ContextState } from '@core/context-fields/types';
import { mapSessionStageToStage } from '@core/context-fields/types';

/**
 * Hook that aggregates 4D context state from EngagementBus
 * for use with Context Fields prompt targeting
 *
 * FIX: Now uses EngagementBus activeLensId instead of NarrativeEngine session.activeLens
 * The Engagement Machine hydrates lens from URL first, then syncs to EngagementBus.
 * NarrativeEngine is legacy and no longer the source of truth for lens.
 */
export function useContextState(): ContextState {
  const engagement = useEngagementState();

  const context = useMemo(() => ({
    stage: mapSessionStageToStage(engagement.stage),
    entropy: engagement.computedEntropy,
    // FIX: Use EngagementBus lens (synced with Engagement Machine) 
    activeLensId: engagement.activeLensId,
    activeMoments: engagement.activeMoments,
    interactionCount: engagement.exchangeCount,
    topicsExplored: engagement.topicsExplored || [],
    sproutsCaptured: engagement.sproutsCaptured,
    offTopicCount: 0, // TODO: Track in telemetry
  }), [engagement]);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useContextState] activeLensId:', context.activeLensId);
  }

  return context;
}
