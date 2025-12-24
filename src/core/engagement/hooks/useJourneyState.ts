// src/core/engagement/hooks/useJourneyState.ts

import { useCallback, useMemo, useSyncExternalStore, useEffect } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import type { Journey, JourneyStep } from '../types';
import {
  getCompletedJourneys,
  markJourneyCompleted,
  isJourneyCompleted as checkCompleted
} from '../persistence';

export interface UseJourneyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseJourneyStateReturn {
  // State from machine
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  isActive: boolean;
  isComplete: boolean;

  // Computed
  currentStep: JourneyStep | null;
  progressPercent: number;

  // Actions
  startJourney: (journey: Journey) => void;
  advanceStep: () => void;
  completeJourney: () => void;
  exitJourney: () => void;

  // Completion tracking
  isJourneyCompleted: (journeyId: string) => boolean;
  completedJourneys: string[];
}

export function useJourneyState({ actor }: UseJourneyStateOptions): UseJourneyStateReturn {
  // Subscribe to machine state
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  // Derive state from machine
  const { journey, journeyProgress, journeyTotal } = snapshot.context;
  const isActive = snapshot.matches('session.journeyActive');
  const isComplete = snapshot.matches('session.journeyComplete');

  // Computed values
  const currentStep = useMemo(() => {
    if (!journey || !journey.steps) return null;
    return journey.steps[journeyProgress] ?? null;
  }, [journey, journeyProgress]);

  const progressPercent = useMemo(() => {
    if (journeyTotal === 0) return 0;
    return Math.round(((journeyProgress + 1) / journeyTotal) * 100);
  }, [journeyProgress, journeyTotal]);

  // Completion tracking (from localStorage)
  const completedJourneys = useMemo(() => getCompletedJourneys(), []);

  // Persist completion when journey completes
  useEffect(() => {
    if (isComplete && journey) {
      markJourneyCompleted(journey.id);
    }
  }, [isComplete, journey]);

  // Actions
  const startJourney = useCallback((newJourney: Journey) => {
    actor.send({ type: 'START_JOURNEY', journey: newJourney });
  }, [actor]);

  const advanceStep = useCallback(() => {
    actor.send({ type: 'ADVANCE_STEP' });
  }, [actor]);

  const completeJourney = useCallback(() => {
    actor.send({ type: 'COMPLETE_JOURNEY' });
  }, [actor]);

  const exitJourney = useCallback(() => {
    actor.send({ type: 'EXIT_JOURNEY' });
  }, [actor]);

  const isJourneyCompleted = useCallback((journeyId: string) => {
    return checkCompleted(journeyId);
  }, []);

  return {
    journey,
    journeyProgress,
    journeyTotal,
    isActive,
    isComplete,
    currentStep,
    progressPercent,
    startJourney,
    advanceStep,
    completeJourney,
    exitJourney,
    isJourneyCompleted,
    completedJourneys,
  };
}
