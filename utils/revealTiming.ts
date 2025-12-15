// utils/revealTiming.ts — Logic for when to show each reveal
// Reveal progression: Simulation → Custom Lens Offer → Terminator Mode → Founder Story

import { RevealState, ExtendedTerminalSession } from '../types/lens';

/**
 * Determine if Simulation Reveal should be shown
 * Trigger: After completing first journey
 */
export function shouldShowSimulationReveal(
  journeysCompleted: number,
  revealState: RevealState
): boolean {
  return (
    journeysCompleted >= 1 &&
    !revealState.simulationRevealShown
  );
}

/**
 * Determine if Custom Lens Offer should be shown
 * Trigger: After Simulation Reveal acknowledged, user doesn't have custom lens
 */
export function shouldOfferCustomLens(
  revealState: RevealState,
  hasCustomLens: boolean
): boolean {
  return (
    revealState.simulationRevealAcknowledged &&
    !hasCustomLens &&
    !revealState.customLensOfferShown
  );
}

/**
 * Determine if Terminator Mode should be unlocked
 * Trigger: After Simulation Reveal acknowledged AND (5+ topics OR has custom lens OR 10+ minutes)
 */
export function shouldUnlockTerminatorMode(
  revealState: RevealState,
  topicsExplored: number,
  hasCustomLens: boolean,
  minutesActive: number
): boolean {
  return (
    revealState.simulationRevealAcknowledged &&
    (
      topicsExplored >= 5 ||
      hasCustomLens ||
      minutesActive >= 10
    ) &&
    !revealState.terminatorModeUnlocked
  );
}

/**
 * Determine if Founder Story should be shown
 * Trigger: Terminator Mode activated OR 15+ minutes OR CTA viewed
 */
export function shouldShowFounderStory(
  revealState: RevealState,
  minutesActive: number
): boolean {
  return (
    (
      revealState.terminatorModeActive ||
      minutesActive >= 15 ||
      revealState.ctaViewed
    ) &&
    !revealState.founderStoryShown
  );
}

/**
 * Calculate minutes active from session start time
 */
export function calculateMinutesActive(startedAt: string): number {
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 60000);
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all applicable reveals for current session state
 * Returns array of reveal types that should be shown (in priority order)
 */
export function getApplicableReveals(
  session: Partial<ExtendedTerminalSession> & { revealState: RevealState }
): Array<'simulation' | 'custom-lens-offer' | 'terminator-prompt' | 'founder-prompt'> {
  const reveals: Array<'simulation' | 'custom-lens-offer' | 'terminator-prompt' | 'founder-prompt'> = [];
  const {
    revealState,
    journeysCompleted = 0,
    topicsExplored = 0,
    minutesActive = 0,
    isCustomLens = false
  } = session;

  // Check in order of priority (earlier reveals block later ones)
  if (shouldShowSimulationReveal(journeysCompleted, revealState)) {
    reveals.push('simulation');
    return reveals; // Only show one at a time
  }

  if (shouldOfferCustomLens(revealState, isCustomLens)) {
    reveals.push('custom-lens-offer');
    return reveals;
  }

  if (shouldUnlockTerminatorMode(revealState, topicsExplored, isCustomLens, minutesActive)) {
    reveals.push('terminator-prompt');
  }

  if (shouldShowFounderStory(revealState, minutesActive)) {
    reveals.push('founder-prompt');
  }

  return reveals;
}
