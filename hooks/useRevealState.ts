// useRevealState - Hook for managing reveal progression state
// Handles persistence and reveal timing logic

import { useState, useEffect, useCallback } from 'react';
import {
  RevealState,
  DEFAULT_REVEAL_STATE,
  ExtendedTerminalSession,
  DEFAULT_EXTENDED_SESSION,
  ArchetypeId
} from '../types/lens';
import {
  shouldShowSimulationReveal,
  shouldOfferCustomLens,
  shouldUnlockTerminatorMode,
  shouldShowFounderStory,
  calculateMinutesActive,
  generateSessionId
} from '../utils/revealTiming';

const REVEAL_STATE_KEY = 'grove-reveal-state';
const SESSION_STATE_KEY = 'grove-extended-session';

interface UseRevealStateReturn {
  // State
  revealState: RevealState;
  sessionState: ExtendedTerminalSession;

  // Reveal checks
  showSimulationReveal: boolean;
  showCustomLensOffer: boolean;
  showTerminatorPrompt: boolean;
  showFounderPrompt: boolean;
  terminatorModeActive: boolean;

  // Actions
  acknowledgeSimulationReveal: () => void;
  dismissCustomLensOffer: () => void;
  unlockTerminatorMode: () => void;
  activateTerminatorMode: () => void;
  deactivateTerminatorMode: () => void;
  showFounderStory: () => void;
  dismissFounderStory: () => void;
  markCTAViewed: () => void;

  // Session tracking
  incrementJourneysCompleted: () => void;
  incrementTopicsExplored: () => void;
  updateActiveMinutes: () => void;
  setCustomLens: (isCustom: boolean) => void;
  setArchetype: (archetypeId: ArchetypeId | null) => void;

  // Utilities
  resetRevealState: () => void;
  getMinutesActive: () => number;
}

export function useRevealState(): UseRevealStateReturn {
  const [revealState, setRevealState] = useState<RevealState>(DEFAULT_REVEAL_STATE);
  const [sessionState, setSessionState] = useState<ExtendedTerminalSession>({
    ...DEFAULT_EXTENDED_SESSION,
    sessionId: generateSessionId(),
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString()
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedReveal = localStorage.getItem(REVEAL_STATE_KEY);
      const storedSession = localStorage.getItem(SESSION_STATE_KEY);

      if (storedReveal) {
        setRevealState(JSON.parse(storedReveal));
      }

      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        // Keep existing session but update activity timestamp
        setSessionState({
          ...parsed,
          lastActivityAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to load reveal state:', err);
    }
  }, []);

  // Persist reveal state changes
  useEffect(() => {
    try {
      localStorage.setItem(REVEAL_STATE_KEY, JSON.stringify(revealState));
    } catch (err) {
      console.error('Failed to persist reveal state:', err);
    }
  }, [revealState]);

  // Persist session state changes
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(sessionState));
    } catch (err) {
      console.error('Failed to persist session state:', err);
    }
  }, [sessionState]);

  // Calculate current minutes active
  const getMinutesActive = useCallback(() => {
    return calculateMinutesActive(sessionState.startedAt);
  }, [sessionState.startedAt]);

  // Update minutes active periodically
  const updateActiveMinutes = useCallback(() => {
    const minutes = getMinutesActive();
    setSessionState(prev => ({
      ...prev,
      minutesActive: minutes,
      lastActivityAt: new Date().toISOString()
    }));
  }, [getMinutesActive]);

  // Reveal condition checks
  const showSimulationReveal = shouldShowSimulationReveal(
    sessionState.journeysCompleted,
    revealState
  );

  const showCustomLensOffer = shouldOfferCustomLens(
    revealState,
    sessionState.isCustomLens
  );

  const showTerminatorPrompt = shouldUnlockTerminatorMode(
    revealState,
    sessionState.topicsExplored,
    sessionState.isCustomLens,
    sessionState.minutesActive
  );

  const showFounderPrompt = shouldShowFounderStory(
    revealState,
    sessionState.minutesActive
  );

  // Reveal actions
  const acknowledgeSimulationReveal = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      simulationRevealShown: true,
      simulationRevealAcknowledged: true
    }));
  }, []);

  const dismissCustomLensOffer = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      customLensOfferShown: true
    }));
  }, []);

  const unlockTerminatorMode = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      terminatorModeUnlocked: true
    }));
  }, []);

  const activateTerminatorMode = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      terminatorModeUnlocked: true,
      terminatorModeActive: true
    }));
  }, []);

  const deactivateTerminatorMode = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      terminatorModeActive: false
    }));
  }, []);

  const showFounderStory = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      founderStoryShown: true
    }));
  }, []);

  const dismissFounderStory = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      founderStoryShown: true
    }));
  }, []);

  const markCTAViewed = useCallback(() => {
    setRevealState(prev => ({
      ...prev,
      ctaViewed: true
    }));
  }, []);

  // Session tracking actions
  const incrementJourneysCompleted = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      journeysCompleted: prev.journeysCompleted + 1,
      lastActivityAt: new Date().toISOString()
    }));
  }, []);

  const incrementTopicsExplored = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      topicsExplored: prev.topicsExplored + 1,
      lastActivityAt: new Date().toISOString()
    }));
  }, []);

  const setCustomLens = useCallback((isCustom: boolean) => {
    setSessionState(prev => ({
      ...prev,
      isCustomLens: isCustom,
      lastActivityAt: new Date().toISOString()
    }));
  }, []);

  const setArchetype = useCallback((archetypeId: ArchetypeId | null) => {
    // This would be used for tracking archetype for conversion routing
    // The actual archetype is determined by the active lens
  }, []);

  // Reset for testing
  const resetRevealState = useCallback(() => {
    setRevealState(DEFAULT_REVEAL_STATE);
    setSessionState({
      ...DEFAULT_EXTENDED_SESSION,
      sessionId: generateSessionId(),
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    });
    localStorage.removeItem(REVEAL_STATE_KEY);
    localStorage.removeItem(SESSION_STATE_KEY);
  }, []);

  return {
    revealState,
    sessionState,
    showSimulationReveal,
    showCustomLensOffer,
    showTerminatorPrompt,
    showFounderPrompt,
    terminatorModeActive: revealState.terminatorModeActive,
    acknowledgeSimulationReveal,
    dismissCustomLensOffer,
    unlockTerminatorMode,
    activateTerminatorMode,
    deactivateTerminatorMode,
    showFounderStory,
    dismissFounderStory,
    markCTAViewed,
    incrementJourneysCompleted,
    incrementTopicsExplored,
    updateActiveMinutes,
    setCustomLens,
    setArchetype,
    resetRevealState,
    getMinutesActive
  };
}

export default useRevealState;
