// hooks/useJourneyProgress.ts
// Journey progress tracking with implicit entry
// Sprint: adaptive-engagement-v1
// Sprint: engagement-consolidation-v1 - Uses unified EngagementBus

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useEngagementState, useEngagementEmit } from './useEngagementBus';
import { journeys, getJourneyById } from '../src/data/journeys';
import type { Journey, JourneyWaypoint } from '../src/core/schema/journey';

interface UseJourneyProgressResult {
  activeJourney: Journey | null;
  currentWaypoint: JourneyWaypoint | null;
  waypointIndex: number;
  progress: number;
  isComplete: boolean;

  startJourney: (journeyId: string, explicit?: boolean) => void;
  completeWaypoint: () => void;
  completeJourney: () => void;
  checkImplicitEntry: (query: string) => { journey: Journey; waypointIndex: number } | null;
  dismissJourney: () => void;
}

export function useJourneyProgress(): UseJourneyProgressResult {
  const engagementState = useEngagementState();
  const emit = useEngagementEmit();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);

  // Sync with engagement state
  useEffect(() => {
    if (engagementState.activeJourney) {
      const journey = getJourneyById(engagementState.activeJourney.lensId);
      setActiveJourney(journey ?? null);
    } else {
      setActiveJourney(null);
    }
  }, [engagementState.activeJourney?.lensId]);

  const waypointIndex = engagementState.activeJourney?.currentPosition ?? 0;

  const currentWaypoint = useMemo(() => {
    if (!activeJourney) return null;
    return activeJourney.waypoints[waypointIndex] ?? null;
  }, [activeJourney, waypointIndex]);

  const progress = activeJourney
    ? waypointIndex / activeJourney.waypoints.length
    : 0;

  const isComplete = activeJourney
    ? waypointIndex >= activeJourney.waypoints.length
    : false;

  const startJourney = useCallback((journeyId: string, _explicit = true) => {
    const journey = getJourneyById(journeyId);
    if (journey) {
      emit.journeyStarted(journeyId, journey.waypoints.length);
    }
  }, [emit]);

  const completeWaypoint = useCallback(() => {
    // Note: EngagementBus doesn't track individual waypoints yet
    // This is a placeholder for future enhancement
    if (!engagementState.activeJourney) return;
    console.log('[useJourneyProgress] Waypoint completed:', waypointIndex + 1);
  }, [engagementState.activeJourney, waypointIndex]);

  const completeJourney = useCallback(() => {
    if (activeJourney) {
      const startedAt = engagementState.activeJourney?.startedAt;
      const durationMinutes = startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
        : 0;
      emit.journeyCompleted(activeJourney.id, durationMinutes, waypointIndex);
    }
  }, [activeJourney, engagementState.activeJourney, waypointIndex, emit]);

  const dismissJourney = useCallback(() => {
    completeJourney();
  }, [completeJourney]);

  const checkImplicitEntry = useCallback((query: string): { journey: Journey; waypointIndex: number } | null => {
    // Don't check if already in a journey
    if (engagementState.activeJourney) return null;

    const normalizedQuery = query.toLowerCase();

    for (const journey of journeys) {
      // Skip if not allowing implicit entry
      if (!journey.allowImplicitEntry) continue;
      // Skip if likely already completed (approximate check via journeysCompleted count)
      // Note: We don't track specific journey IDs in EngagementState

      for (let i = 0; i < journey.waypoints.length; i++) {
        const waypoint = journey.waypoints[i];
        if (!waypoint.entryPatterns) continue;

        for (const pattern of waypoint.entryPatterns) {
          try {
            if (new RegExp(pattern, 'i').test(normalizedQuery)) {
              return { journey, waypointIndex: i };
            }
          } catch {
            // Invalid regex, skip
          }
        }
      }
    }

    return null;
  }, [engagementState.activeJourney]);

  return {
    activeJourney,
    currentWaypoint,
    waypointIndex,
    progress,
    isComplete,
    startJourney,
    completeWaypoint,
    completeJourney,
    checkImplicitEntry,
    dismissJourney,
  };
}
