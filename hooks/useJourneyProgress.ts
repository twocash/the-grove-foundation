// hooks/useJourneyProgress.ts
// Journey progress tracking with implicit entry
// Sprint: adaptive-engagement-v1

import { useState, useCallback, useEffect, useMemo } from 'react';
import { telemetryCollector } from '../src/lib/telemetry';
import { useSessionTelemetry } from './useSessionTelemetry';
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
  const { telemetry } = useSessionTelemetry();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);

  // Sync with telemetry
  useEffect(() => {
    if (telemetry.activeJourney) {
      const journey = getJourneyById(telemetry.activeJourney.journeyId);
      setActiveJourney(journey ?? null);
    } else {
      setActiveJourney(null);
    }
  }, [telemetry.activeJourney?.journeyId]);

  const waypointIndex = telemetry.activeJourney?.currentWaypoint ?? 0;

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

  const startJourney = useCallback((journeyId: string, explicit = true) => {
    telemetryCollector.update({
      type: 'journey_start',
      payload: { journeyId, explicit },
    });
  }, []);

  const completeWaypoint = useCallback(() => {
    if (!telemetry.activeJourney) return;

    const nextWaypoint = waypointIndex + 1;
    telemetryCollector.update({
      type: 'journey_progress',
      payload: { waypoint: nextWaypoint },
    });
  }, [telemetry.activeJourney, waypointIndex]);

  const completeJourney = useCallback(() => {
    telemetryCollector.update({ type: 'journey_complete' });
  }, []);

  const dismissJourney = useCallback(() => {
    telemetryCollector.update({ type: 'journey_complete' });
  }, []);

  const checkImplicitEntry = useCallback((query: string): { journey: Journey; waypointIndex: number } | null => {
    // Don't check if already in a journey
    if (telemetry.activeJourney) return null;

    const normalizedQuery = query.toLowerCase();

    for (const journey of journeys) {
      // Skip if not allowing implicit entry
      if (!journey.allowImplicitEntry) continue;
      // Skip if already completed
      if (telemetry.completedJourneys.includes(journey.id)) continue;

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
  }, [telemetry.activeJourney, telemetry.completedJourneys]);

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
