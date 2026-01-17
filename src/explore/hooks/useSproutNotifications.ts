// src/explore/hooks/useSproutNotifications.ts
// Hook for detecting sprout status transitions and triggering notifications
// Sprint: sprout-status-panel-v1, Phase 2

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';
import { useResearchSprouts } from '@explore/context/ResearchSproutContext';
import { useToast } from '@explore/context/ToastContext';
import {
  type StatusTransitionEvent,
  type PulseState,
  type SproutNotificationType,
  NOTIFIABLE_TRANSITIONS,
  NOTIFICATION_CONFIG,
} from '@explore/types/sprout-status';

// =============================================================================
// Configuration
// =============================================================================

/** How long the pulse animation lasts (ms) */
const PULSE_DURATION = 3000;

/** Polling interval for status changes (ms) - 15 seconds to reduce network traffic */
const POLL_INTERVAL = 15000;

// =============================================================================
// Hook: useSproutNotifications
// =============================================================================

export interface UseSproutNotificationsOptions {
  /** Whether polling is enabled */
  enabled?: boolean;

  /** Custom poll interval (ms) */
  pollInterval?: number;

  /** Whether to show toast notifications */
  showToasts?: boolean;
}

export interface UseSproutNotificationsResult {
  /** Current pulse state */
  pulseState: PulseState;

  /** Clear the pulse state */
  clearPulse: () => void;

  /** Recent transitions (for debugging) */
  recentTransitions: StatusTransitionEvent[];

  /** Whether polling is active */
  isPolling: boolean;
}

/**
 * Hook that monitors sprout status changes and triggers notifications
 *
 * Features:
 * - Polls for status changes at configurable interval
 * - Detects transitions that should trigger notifications
 * - Fires toast notifications for ready/failed sprouts
 * - Manages pulse animation state for badge
 */
export function useSproutNotifications(
  options: UseSproutNotificationsOptions = {}
): UseSproutNotificationsResult {
  const {
    enabled = true,
    pollInterval = POLL_INTERVAL,
    showToasts = true,
  } = options;

  const { sprouts, refresh } = useResearchSprouts();
  const toast = useToast();

  // Track previous sprout states for transition detection
  const prevSproutsRef = useRef<Map<string, ResearchSproutStatus>>(new Map());

  // Pulse state
  const [pulseState, setPulseState] = useState<PulseState>({
    isPulsing: false,
    newReadyCount: 0,
    pulseSourceIds: [],
  });

  // Recent transitions (for debugging)
  const [recentTransitions, setRecentTransitions] = useState<StatusTransitionEvent[]>([]);

  // Polling state
  const [isPolling, setIsPolling] = useState(false);

  // Clear pulse
  const clearPulse = useCallback(() => {
    setPulseState({
      isPulsing: false,
      newReadyCount: 0,
      pulseSourceIds: [],
    });
  }, []);

  // Detect transitions
  const detectTransitions = useCallback((): StatusTransitionEvent[] => {
    const transitions: StatusTransitionEvent[] = [];
    const prevMap = prevSproutsRef.current;
    const now = new Date().toISOString();

    for (const sprout of sprouts) {
      const prevStatus = prevMap.get(sprout.id);

      // New sprout or status changed
      if (prevStatus && prevStatus !== sprout.status) {
        transitions.push({
          sproutId: sprout.id,
          from: prevStatus,
          to: sprout.status,
          detectedAt: now,
        });
      }
    }

    return transitions;
  }, [sprouts]);

  // Handle detected transitions
  const handleTransitions = useCallback((transitions: StatusTransitionEvent[]) => {
    if (transitions.length === 0) return;

    // Track new ready sprouts for pulse
    const newReadyIds: string[] = [];
    const now = new Date().toISOString();

    for (const transition of transitions) {
      // Check if this transition should trigger a notification
      const notifiable = NOTIFIABLE_TRANSITIONS.find(
        t => t.from === transition.from && t.to === transition.to
      );

      if (notifiable) {
        const sprout = sprouts.find(s => s.id === transition.sproutId);
        if (!sprout) continue;

        const config = NOTIFICATION_CONFIG[notifiable.notificationType];

        // Show toast
        if (showToasts) {
          const toastMethod = config.toastType === 'success'
            ? toast.success
            : config.toastType === 'error'
              ? toast.error
              : toast.info;

          toastMethod(`${config.emoji} ${config.title}`, {
            description: sprout.title,
            action: {
              label: 'View',
              onClick: () => {
                // TODO: Select sprout in tray
                console.log('[useSproutNotifications] View sprout:', sprout.id);
              },
            },
          });
        }

        // Track for pulse
        if (notifiable.notificationType === 'ready') {
          newReadyIds.push(transition.sproutId);
        }
      }
    }

    // Update pulse state if we have new ready sprouts
    if (newReadyIds.length > 0) {
      setPulseState(prev => ({
        isPulsing: true,
        newReadyCount: prev.newReadyCount + newReadyIds.length,
        pulseSourceIds: [...prev.pulseSourceIds, ...newReadyIds],
      }));

      // Auto-clear pulse after duration
      setTimeout(clearPulse, PULSE_DURATION);
    }

    // Track recent transitions
    setRecentTransitions(prev => [...transitions, ...prev].slice(0, 10));
  }, [sprouts, showToasts, toast, clearPulse]);

  // Update previous states map after processing
  const updatePrevStates = useCallback(() => {
    const newMap = new Map<string, ResearchSproutStatus>();
    for (const sprout of sprouts) {
      newMap.set(sprout.id, sprout.status);
    }
    prevSproutsRef.current = newMap;
  }, [sprouts]);

  // Poll and detect changes
  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval>;

    const poll = async () => {
      setIsPolling(true);
      try {
        await refresh();
      } catch (e) {
        console.error('[useSproutNotifications] Poll error:', e);
      } finally {
        setIsPolling(false);
      }
    };

    // Start polling
    intervalId = setInterval(poll, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, pollInterval, refresh]);

  // Detect transitions when sprouts change
  useEffect(() => {
    // Skip on first render (no previous state)
    if (prevSproutsRef.current.size === 0) {
      updatePrevStates();
      return;
    }

    const transitions = detectTransitions();
    handleTransitions(transitions);
    updatePrevStates();
  }, [sprouts, detectTransitions, handleTransitions, updatePrevStates]);

  return {
    pulseState,
    clearPulse,
    recentTransitions,
    isPolling,
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { UseSproutNotificationsOptions, UseSproutNotificationsResult };
