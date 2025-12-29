// src/surface/hooks/useMoments.ts
// React Hook for Consuming Moments
// Sprint: engagement-orchestrator-v1

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from '@xstate/react';
import type { Moment, MomentSurface, MomentAction } from '@core/schema/moment';
import { getEligibleMoments, createDefaultEvaluationContext, type MomentEvaluationContext } from '@core/engagement/moment-evaluator';
import { useEngagement } from '@core/engagement/context';
import { useEngagementEmit } from '../../../hooks/useEngagementBus';
import { loadMoments } from '../../data/moments';

// =============================================================================
// Cached Moments (module level)
// =============================================================================

let cachedMoments: Moment[] | null = null;

function getMoments(): Moment[] {
  if (!cachedMoments) {
    cachedMoments = loadMoments();
  }
  return cachedMoments;
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
  const emit = useEngagementEmit();

  // Get moments at component mount
  const [allMoments] = useState(getMoments);

  // Select relevant state from XState actor
  const xstateContext = useSelector(actor, (state) => state.context);

  // Convert XState context to MomentEvaluationContext
  const evaluationContext = useMemo((): MomentEvaluationContext => {
    const base = createDefaultEvaluationContext();

    // Map XState context to evaluation context
    return {
      ...base,
      exchangeCount: xstateContext.streamHistory.filter(item => item.type === 'query').length,
      journeysCompleted: xstateContext.journey ? 1 : 0, // Simplified - future: track completions
      sproutsCaptured: 0, // Would need to track in context
      entropy: xstateContext.entropy,
      activeLens: xstateContext.lens,
      activeJourney: xstateContext.journey?.id || null,
      hasCustomLens: false, // Would need custom lens detection
      flags: xstateContext.flags,
      momentCooldowns: xstateContext.momentCooldowns,
    };
  }, [xstateContext]);

  // Evaluate eligible moments for this surface
  const moments = useMemo(() => {
    const eligible = getEligibleMoments(allMoments, evaluationContext, surface);

    // Apply limit (overlays typically show one at a time)
    const effectiveLimit = limit ?? (surface === 'overlay' ? 1 : undefined);
    return effectiveLimit ? eligible.slice(0, effectiveLimit) : eligible;
  }, [evaluationContext, surface, limit, allMoments]);

  const activeMoment = moments[0] ?? null;

  // Track moment shown
  useEffect(() => {
    if (activeMoment) {
      emit.momentShown(activeMoment.meta.id, surface);
    }
  }, [activeMoment?.meta.id, surface, emit]);

  // Execute action handler
  const executeAction = useCallback((momentId: string, actionId: string): MomentAction | undefined => {
    const moment = allMoments.find(m => m.meta.id === momentId);
    const action = moment?.payload.actions.find(a => a.id === actionId);

    if (!moment || !action) {
      console.warn('[Moments] Action not found:', momentId, actionId);
      return undefined;
    }

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

    // Emit telemetry
    emit.momentActioned(momentId, actionId, action.type);

    return action;
  }, [allMoments, actor, emit]);

  // Dismiss handler (convenience wrapper)
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
      emit.momentDismissed(momentId);
    }
  }, [allMoments, executeAction, actor, emit]);

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
