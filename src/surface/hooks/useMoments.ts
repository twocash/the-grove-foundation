// src/surface/hooks/useMoments.ts
// React Hook for Consuming Moments
// Sprint: moment-ui-integration-v1

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from '@xstate/react';
import type { Moment, MomentSurface, MomentAction } from '@core/schema/moment';
import { getEligibleMoments, createDefaultEvaluationContext, type MomentEvaluationContext } from '@core/engagement/moment-evaluator';
import { computeMomentStage } from '@core/config/defaults';
import { computeMetrics, type CumulativeMetricsV2 } from '@core/schema/telemetry';
import { useEngagement } from '@core/engagement/context';
import { loadMoments } from '../../data/moments';
import { useMomentActions } from './useMomentActions';

// =============================================================================
// Cached Moments (module level) - Invalidated on HMR
// =============================================================================

let cachedMoments: Moment[] | null = null;

function getMoments(): Moment[] {
  if (!cachedMoments) {
    cachedMoments = loadMoments();
  }
  return cachedMoments;
}

// Invalidate cache on HMR (Vite dev mode)
if (import.meta.hot) {
  import.meta.hot.accept('../../data/moments', () => {
    cachedMoments = null;
    console.log('[Moments] Cache invalidated via HMR');
  });
}

// =============================================================================
// Hook Options & Return Types
// =============================================================================

export interface UseMomentsOptions {
  surface: MomentSurface;
  limit?: number;  // Max moments to return (default: 1 for overlay, unlimited for others)
}

export interface UseMomentsReturn {
  moments: Moment[];
  activeMoment: Moment | null;  // Highest priority
  executeAction: (momentId: string, actionId: string) => MomentAction | undefined;
  dismissMoment: (momentId: string) => void;
  isLoading: boolean;
}

// =============================================================================
// useMoments Hook
// =============================================================================

export function useMoments(options: UseMomentsOptions): UseMomentsReturn {
  const { surface, limit } = options;
  const { actor } = useEngagement();
  const { executeAction: executeMomentAction } = useMomentActions();

  // Get moments at component mount
  const [allMoments] = useState(() => getMoments());

  // Select relevant state from XState actor
  const xstateContext = useSelector(actor, (state) => state.context);

  // Convert XState context to MomentEvaluationContext
  // Sprint: dex-telemetry-compliance-v1 - Uses declarative stage and computed metrics
  const evaluationContext = useMemo((): MomentEvaluationContext => {
    const base = createDefaultEvaluationContext();
    const exchangeCount = xstateContext.streamHistory.filter(item => item.type === 'query').length;

    // Sprint: dex-telemetry-compliance-v1 - Declarative stage computation
    const stage = computeMomentStage(exchangeCount);

    // Compute minutesActive from sessionStartedAt
    const minutesActive = Math.floor((Date.now() - xstateContext.sessionStartedAt) / 60000);

    // Sprint: dex-telemetry-compliance-v1 - Compute metrics from provenance arrays
    const metricsV2: CumulativeMetricsV2 = {
      version: 2,
      fieldId: 'grove',
      journeyCompletions: xstateContext.journeyCompletions,
      topicExplorations: xstateContext.topicExplorations,
      sproutCaptures: xstateContext.sproutCaptures,
      sessionCount: xstateContext.sessionCount,
      lastSessionAt: Date.now(),
    };
    const computed = computeMetrics(metricsV2);

    // Map XState context to evaluation context
    return {
      ...base,
      stage,
      exchangeCount,
      journeysCompleted: computed.journeysCompleted,
      sproutsCaptured: computed.sproutsCaptured,
      topicsExplored: computed.topicsExplored,
      entropy: xstateContext.entropy,
      minutesActive,
      sessionCount: xstateContext.sessionCount,
      activeLens: xstateContext.lens,
      activeJourney: xstateContext.journey?.id || null,
      hasCustomLens: xstateContext.hasCustomLens,
      flags: xstateContext.flags,
      momentCooldowns: xstateContext.momentCooldowns,
    };
  }, [xstateContext]);

  // Evaluate eligible moments for this surface
  const moments = useMemo(() => {
    console.log('[Moments] Evaluating for surface:', surface, 'context:', {
      exchangeCount: evaluationContext.exchangeCount,
      stage: evaluationContext.stage,
      entropy: evaluationContext.entropy,
      flags: evaluationContext.flags
    });
    const eligible = getEligibleMoments(allMoments, evaluationContext, surface);
    console.log('[Moments] Eligible moments:', eligible.map(m => m.meta.id));

    // Apply limit (overlays typically show one at a time)
    const effectiveLimit = limit ?? (surface === 'overlay' ? 1 : undefined);
    return effectiveLimit ? eligible.slice(0, effectiveLimit) : eligible;
  }, [evaluationContext, surface, limit, allMoments]);

  const activeMoment = moments[0] ?? null;

  // Track moment shown - Sprint: xstate-telemetry-v1
  useEffect(() => {
    if (activeMoment) {
      actor.send({ type: 'MOMENT_SHOWN', momentId: activeMoment.meta.id, surface });
    }
  }, [activeMoment?.meta.id, surface, actor]);

  // Execute action handler
  const executeAction = useCallback((momentId: string, actionId: string): MomentAction | undefined => {
    const moment = allMoments.find(m => m.meta.id === momentId);
    const action = moment?.payload.actions.find(a => a.id === actionId);

    if (!moment || !action) {
      console.warn('[Moments] Action not found:', momentId, actionId);
      return undefined;
    }

    // Execute the action type-specific behavior (journey start, lens select, etc.)
    executeMomentAction(action);

    // Apply flag side effects via XState
    if (action.setFlags) {
      Object.entries(action.setFlags).forEach(([key, value]) => {
        actor.send({ type: 'SET_FLAG', key, value: value as boolean });
      });
    }

    // Mark once moments as shown
    if (moment.payload.once) {
      actor.send({ type: 'SET_FLAG', key: `moment_${moment.meta.id}_shown`, value: true });
    }

    // Update cooldown
    if (moment.payload.cooldown) {
      actor.send({ type: 'SET_COOLDOWN', momentId: moment.meta.id, timestamp: Date.now() });
    }

    // Emit telemetry - Sprint: xstate-telemetry-v1
    actor.send({ type: 'MOMENT_ACTIONED', momentId, actionId, actionType: action.type });

    return action;
  }, [allMoments, actor, executeMomentAction]);

  // Dismiss handler (convenience wrapper) - Sprint: xstate-telemetry-v1
  const dismissMoment = useCallback((momentId: string) => {
    const moment = allMoments.find(m => m.meta.id === momentId);
    if (!moment) return;

    // Find dismiss action or create implicit one
    const dismissAction = moment.payload.actions.find(a => a.type === 'dismiss');
    if (dismissAction) {
      executeAction(momentId, dismissAction.id);
    } else {
      // Implicit dismiss
      if (moment.payload.once) {
        actor.send({ type: 'SET_FLAG', key: `moment_${moment.meta.id}_shown`, value: true });
      }
      if (moment.payload.cooldown) {
        actor.send({ type: 'SET_COOLDOWN', momentId: moment.meta.id, timestamp: Date.now() });
      }
      actor.send({ type: 'MOMENT_DISMISSED', momentId });
    }
  }, [allMoments, executeAction, actor]);

  return {
    moments,
    activeMoment,
    executeAction,
    dismissMoment,
    isLoading: false
  };
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Get all moments for a specific surface without limit
 */
export function useSurfaceMoments(surface: MomentSurface): Moment[] {
  const { moments } = useMoments({ surface });
  return moments;
}

/**
 * Get the single highest-priority moment for overlay surface
 */
export function useOverlayMoment(): Moment | null {
  const { activeMoment } = useMoments({ surface: 'overlay', limit: 1 });
  return activeMoment;
}

/**
 * Get all welcome surface moments
 */
export function useWelcomeMoments(): Moment[] {
  const { moments } = useMoments({ surface: 'welcome' });
  return moments;
}
