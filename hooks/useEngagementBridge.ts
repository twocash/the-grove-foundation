// hooks/useEngagementBridge.ts - Backward-compatible bridge to Engagement Bus
// Sprint 7: Allows gradual migration from scattered state to unified bus

import { useCallback, useEffect } from 'react';
import {
  useEngagementBus,
  useEngagementState,
  useRevealQueue,
  useEngagementEmit
} from './useEngagementBus';
import { RevealType } from '../types/engagement';
import { ArchetypeId } from '../types/lens';

/**
 * Bridge hook that provides the same API as the old useRevealState
 * but uses the new Engagement Bus internally
 *
 * This allows Terminal.tsx to migrate incrementally:
 * 1. Replace useRevealState import with useEngagementBridge
 * 2. Everything works the same
 * 3. Gradually simplify to use direct Engagement Bus APIs
 */
export function useEngagementBridge() {
  const bus = useEngagementBus();
  const state = useEngagementState();
  const queue = useRevealQueue();
  const emit = useEngagementEmit();

  // Compute reveal flags from queue (what SHOULD be shown)
  const showSimulationReveal = queue.some(r => r.type === 'simulation') &&
                               !state.revealsShown.includes('simulation');

  const showCustomLensOffer = queue.some(r => r.type === 'customLensOffer') &&
                              !state.revealsShown.includes('customLensOffer');

  const showTerminatorPrompt = queue.some(r => r.type === 'terminatorPrompt') &&
                               !state.revealsShown.includes('terminatorPrompt');

  const showFounderPrompt = queue.some(r => r.type === 'founderStory') &&
                            !state.revealsShown.includes('founderStory');

  const showJourneyCompletion = queue.some(r => r.type === 'journeyCompletion') &&
                                !state.revealsShown.includes('journeyCompletion');

  // Legacy-compatible actions
  const acknowledgeSimulationReveal = useCallback(() => {
    emit.revealShown('simulation');
    bus.acknowledgeReveal('simulation', 'accepted');
  }, [emit, bus]);

  const dismissCustomLensOffer = useCallback(() => {
    emit.revealShown('customLensOffer');
    bus.acknowledgeReveal('customLensOffer', 'dismissed');
  }, [emit, bus]);

  const unlockTerminatorMode = useCallback(() => {
    emit.revealShown('terminatorPrompt');
  }, [emit]);

  const activateTerminatorMode = useCallback(() => {
    emit.revealShown('terminatorPrompt');
    bus.acknowledgeReveal('terminatorPrompt', 'accepted');
  }, [emit, bus]);

  const deactivateTerminatorMode = useCallback(() => {
    // This is a toggle, not a reveal acknowledgment
    // We'd need to add this to the bus state if needed
  }, []);

  const markFounderStoryShown = useCallback(() => {
    emit.revealShown('founderStory');
  }, [emit]);

  const dismissFounderStory = useCallback(() => {
    bus.acknowledgeReveal('founderStory', 'dismissed');
  }, [bus]);

  const markCTAViewed = useCallback(() => {
    emit.revealShown('conversionCTA');
  }, [emit]);

  // Session tracking actions (now emit events)
  const incrementJourneysCompleted = useCallback(() => {
    emit.journeyCompleted(
      state.activeLensId || 'unknown',
      state.minutesActive,
      state.cardsVisited.length
    );
  }, [emit, state]);

  const incrementTopicsExplored = useCallback((topicId?: string, topicLabel?: string) => {
    emit.topicExplored(topicId || 'unknown', topicLabel || 'Unknown Topic');
  }, [emit]);

  const updateActiveMinutes = useCallback(() => {
    // Now handled automatically by the bus
  }, []);

  const setCustomLens = useCallback((isCustom: boolean) => {
    // This is tracked when lens is selected
  }, []);

  const setArchetype = useCallback((archetypeId: ArchetypeId | null) => {
    // This is tracked when lens is selected
  }, []);

  const resetRevealState = useCallback(() => {
    bus.reset();
  }, [bus]);

  const getMinutesActive = useCallback(() => {
    return state.minutesActive;
  }, [state.minutesActive]);

  // Return legacy-compatible interface
  return {
    // State (mapped from engagement state)
    revealState: {
      simulationRevealShown: state.revealsShown.includes('simulation'),
      simulationRevealAcknowledged: state.revealsAcknowledged.includes('simulation'),
      customLensOfferShown: state.revealsShown.includes('customLensOffer'),
      terminatorModeUnlocked: state.terminatorModeUnlocked,
      terminatorModeActive: state.terminatorModeActive,
      founderStoryShown: state.revealsShown.includes('founderStory'),
      ctaViewed: state.revealsShown.includes('conversionCTA')
    },
    sessionState: {
      sessionId: state.sessionId,
      startedAt: state.sessionStartedAt,
      lastActivityAt: state.lastActivityAt,
      journeysCompleted: state.journeysCompleted,
      topicsExplored: state.topicsExplored.length,
      minutesActive: state.minutesActive,
      isCustomLens: state.hasCustomLens,
      currentArchetypeId: state.currentArchetypeId
    },

    // Reveal checks
    showSimulationReveal,
    showCustomLensOffer,
    showTerminatorPrompt,
    showFounderPrompt,
    showJourneyCompletion,
    terminatorModeActive: state.terminatorModeActive,

    // Actions
    acknowledgeSimulationReveal,
    dismissCustomLensOffer,
    unlockTerminatorMode,
    activateTerminatorMode,
    deactivateTerminatorMode,
    markFounderStoryShown,
    showFounderStory: markFounderStoryShown,
    dismissFounderStory,
    markCTAViewed,
    incrementJourneysCompleted,
    incrementTopicsExplored,
    updateActiveMinutes,
    setCustomLens,
    setArchetype,
    resetRevealState,
    getMinutesActive,

    // NEW: Direct bus access for advanced usage
    bus,
    engagementState: state,
    revealQueue: queue,
    emit
  };
}

/**
 * Bridge hook for useNarrativeEngine session tracking
 * Integrates exchange counting and card visiting with Engagement Bus
 */
export function useNarrativeEngagementBridge() {
  const emit = useEngagementEmit();
  const state = useEngagementState();

  const trackExchange = useCallback((query: string, responseLength: number, cardId?: string) => {
    emit.exchangeSent(query, responseLength, cardId);
  }, [emit]);

  const trackCardVisit = useCallback((cardId: string, cardLabel: string, fromCard?: string) => {
    emit.cardVisited(cardId, cardLabel, fromCard);
  }, [emit]);

  const trackLensSelection = useCallback((lensId: string, isCustom: boolean, archetypeId?: ArchetypeId) => {
    emit.lensSelected(lensId, isCustom, archetypeId);
  }, [emit]);

  const trackJourneyStart = useCallback((lensId: string, threadLength: number) => {
    emit.journeyStarted(lensId, threadLength);
  }, [emit]);

  return {
    trackExchange,
    trackCardVisit,
    trackLensSelection,
    trackJourneyStart,
    exchangeCount: state.exchangeCount,
    cardsVisited: state.cardsVisited
  };
}
