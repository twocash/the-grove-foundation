// src/core/events/hooks/useEventBridge.ts
// Sprint: bedrock-event-integration-v1
// Bridge hook for dual-mode event dispatch (new system + legacy for backward compat)

import { useCallback, useMemo, useContext } from 'react';
import { GroveEventContext } from './context';
import { useIsEventSystemEnabled } from './ExploreEventProvider';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface EventBridgeEmit {
  /**
   * Emit when a user submits a query
   */
  querySubmitted: (
    queryId: string,
    content: string,
    intent?: 'deep_dive' | 'pivot' | 'apply' | 'challenge'
  ) => void;

  /**
   * Emit when a response stream completes
   */
  responseCompleted: (
    responseId: string,
    queryId: string,
    options?: { hubId?: string; hasNavigation?: boolean; spanCount?: number }
  ) => void;

  /**
   * Emit when a lens is activated
   */
  lensActivated: (
    lensId: string,
    source: 'url' | 'selection' | 'system' | 'localStorage',
    isCustom: boolean
  ) => void;

  /**
   * Emit when a journey starts
   */
  journeyStarted: (journeyId: string, lensId: string, waypointCount: number) => void;

  /**
   * Emit when a journey completes
   */
  journeyCompleted: (journeyId: string, durationMs?: number, waypointsVisited?: number) => void;

  /**
   * Emit when a hub is entered
   */
  hubEntered: (hubId: string, source: 'query' | 'navigation' | 'pivot' | 'journey') => void;

  /**
   * Emit when an insight/sprout is captured
   */
  insightCaptured: (sproutId: string, options?: { journeyId?: string; hubId?: string }) => void;

  /**
   * Session started event
   */
  sessionStarted: (isReturning?: boolean, previousSessionId?: string) => void;

  /**
   * Emit when a navigation fork is selected
   * Sprint: kinetic-suggested-prompts-v1
   */
  forkSelected: (
    forkId: string,
    forkType: 'deep_dive' | 'pivot' | 'apply' | 'challenge',
    label: string,
    responseId: string
  ) => void;
}

export interface EventBridgeAPI {
  /**
   * Unified emit methods that route to correct system
   */
  emit: EventBridgeEmit;

  /**
   * Whether the new event system is enabled
   */
  isNewSystemEnabled: boolean;

  /**
   * Whether the new system provider is available (in tree)
   */
  isProviderAvailable: boolean;
}

// ─────────────────────────────────────────────────────────────────
// LAZY IMPORTS FOR LEGACY SYSTEM
// ─────────────────────────────────────────────────────────────────

// Lazy-load legacy engagement bus to avoid circular dependencies
let legacyBus: {
  emit: (type: string, payload: Record<string, unknown>) => void;
} | null = null;

async function getLegacyBus() {
  if (!legacyBus) {
    try {
      // Dynamic import to avoid bundling issues
      const module = await import('../../../../hooks/useEngagementBus');
      const bus = module.getEngagementBus();
      legacyBus = {
        emit: (type: string, payload: Record<string, unknown>) => {
          bus.emit(type as any, payload as any);
        }
      };
    } catch (e) {
      console.warn('[EventBridge] Legacy engagement bus not available:', e);
    }
  }
  return legacyBus;
}

// ─────────────────────────────────────────────────────────────────
// HOOK IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────

/**
 * Bridge hook for dual-mode event dispatch.
 *
 * When the new event system is enabled:
 * - Primary events go to GroveEventProvider
 * - Dual-write to legacy engagement bus for backward compatibility
 *
 * When disabled:
 * - Only legacy engagement bus receives events
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { emit, isNewSystemEnabled } = useEventBridge();
 *
 *   const handleSubmit = (query: string) => {
 *     emit.querySubmitted('q-123', query, 'explore');
 *   };
 * }
 * ```
 */
export function useEventBridge(): EventBridgeAPI {
  // Check if new system is enabled via feature flag
  const isNewSystemEnabled = useIsEventSystemEnabled();

  // Check if we're inside GroveEventProvider (safe to use new hooks)
  const groveContext = useContext(GroveEventContext);
  const isProviderAvailable = groveContext !== null;

  // Get new system dispatch if available
  const newDispatch = groveContext?.dispatch ?? null;
  const fieldId = groveContext?.log.fieldId ?? 'grove';
  const sessionId = groveContext?.log.currentSessionId ?? '';

  // Create dual-write emit functions
  const emit = useMemo<EventBridgeEmit>(() => {
    const now = () => Date.now();
    const genResponseId = () => `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      querySubmitted: (queryId, content, intent) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'QUERY_SUBMITTED',
            fieldId,
            sessionId,
            timestamp: now(),
            queryId,
            content,
            intent
          });
        }

        // Legacy dual-write (async, fire-and-forget)
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('EXCHANGE_SENT', { query: content, responseLength: 0 });
          }
        });
      },

      responseCompleted: (responseId, queryId, options) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'RESPONSE_COMPLETED',
            fieldId,
            sessionId,
            timestamp: now(),
            responseId,
            queryId,
            hubId: options?.hubId,
            hasNavigation: options?.hasNavigation ?? false,
            spanCount: options?.spanCount ?? 0
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus && options?.hubId) {
            bus.emit('CARD_VISITED', { cardId: options.hubId, cardLabel: options.hubId });
          }
        });
      },

      lensActivated: (lensId, source, isCustom) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'LENS_ACTIVATED',
            fieldId,
            sessionId,
            timestamp: now(),
            lensId,
            source,
            isCustom
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('LENS_SELECTED', { lensId, isCustom });
          }
        });
      },

      journeyStarted: (journeyId, lensId, waypointCount) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'JOURNEY_STARTED',
            fieldId,
            sessionId,
            timestamp: now(),
            journeyId,
            lensId,
            waypointCount
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('JOURNEY_STARTED', { lensId, threadLength: waypointCount });
          }
        });
      },

      journeyCompleted: (journeyId, durationMs, waypointsVisited) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'JOURNEY_COMPLETED',
            fieldId,
            sessionId,
            timestamp: now(),
            journeyId,
            durationMs,
            waypointsVisited
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('JOURNEY_COMPLETED', {
              lensId: journeyId,
              durationMinutes: Math.floor((durationMs ?? 0) / 60000),
              cardsVisited: waypointsVisited ?? 0
            });
          }
        });
      },

      hubEntered: (hubId, source) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'HUB_ENTERED',
            fieldId,
            sessionId,
            timestamp: now(),
            hubId,
            source
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('TOPIC_EXPLORED', { topicId: hubId, topicLabel: hubId });
            bus.emit('HUB_VISITED', { hubId });
          }
        });
      },

      insightCaptured: (sproutId, options) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'INSIGHT_CAPTURED',
            fieldId,
            sessionId,
            timestamp: now(),
            sproutId,
            journeyId: options?.journeyId,
            hubId: options?.hubId
          });
        }

        // Legacy dual-write
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('SPROUT_CAPTURED', { sproutId, tags: [] });
          }
        });
      },

      sessionStarted: (isReturning, previousSessionId) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'SESSION_STARTED',
            fieldId,
            sessionId,
            timestamp: now(),
            isReturning: isReturning ?? false,
            previousSessionId
          });
        }

        // Legacy doesn't have explicit session start event
      },

      forkSelected: (forkId, forkType, label, responseId) => {
        // New system
        if (isNewSystemEnabled && newDispatch) {
          newDispatch({
            type: 'FORK_SELECTED',
            fieldId,
            sessionId,
            timestamp: now(),
            forkId,
            forkType,
            label,
            responseId
          });
        }

        // Legacy: Fork selection triggers a query-like event
        getLegacyBus().then(bus => {
          if (bus) {
            bus.emit('CARD_VISITED', { cardId: forkId, cardLabel: label });
          }
        });
      }
    };
  }, [isNewSystemEnabled, newDispatch, fieldId, sessionId]);

  return {
    emit,
    isNewSystemEnabled,
    isProviderAvailable
  };
}

/**
 * Safe version of useEventBridge that works outside of providers.
 * Returns no-op emit functions if no provider is available.
 */
export function useSafeEventBridge(): EventBridgeAPI {
  try {
    return useEventBridge();
  } catch {
    // Return no-op version if outside providers
    return {
      emit: {
        querySubmitted: () => {},
        responseCompleted: () => {},
        lensActivated: () => {},
        journeyStarted: () => {},
        journeyCompleted: () => {},
        hubEntered: () => {},
        insightCaptured: () => {},
        sessionStarted: () => {},
        forkSelected: () => {}
      },
      isNewSystemEnabled: false,
      isProviderAvailable: false
    };
  }
}
