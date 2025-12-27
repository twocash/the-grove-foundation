// src/lib/telemetry/stage-computation.ts
// Computes session stage from telemetry
// Sprint: adaptive-engagement-v1

import {
  SessionTelemetry,
  SessionStage,
  StageThresholds,
  DEFAULT_THRESHOLDS
} from '../../core/schema/session-telemetry';

/**
 * Compute session stage from telemetry signals
 */
export function computeSessionStage(
  telemetry: Pick<SessionTelemetry,
    'visitCount' | 'exchangeCount' | 'totalExchangeCount' |
    'topicsExplored' | 'sproutsCaptured'
  >,
  thresholds: StageThresholds = DEFAULT_THRESHOLDS
): SessionStage {
  const {
    visitCount,
    exchangeCount,
    totalExchangeCount,
    topicsExplored,
    sproutsCaptured
  } = telemetry;

  // ENGAGED: Has captured sprouts OR is a power user
  if (
    sproutsCaptured >= (thresholds.engaged.minSprouts ?? 1) ||
    (visitCount >= (thresholds.engaged.minVisits ?? 3) &&
      totalExchangeCount >= (thresholds.engaged.minTotalExchanges ?? 15))
  ) {
    return 'ENGAGED';
  }

  // EXPLORING: Multiple topics, deeper engagement
  if (
    exchangeCount >= (thresholds.exploring.minExchanges ?? 5) ||
    topicsExplored.length >= (thresholds.exploring.minTopics ?? 2)
  ) {
    return 'EXPLORING';
  }

  // ORIENTED: Has some engagement or is returning
  if (
    exchangeCount >= (thresholds.oriented.minExchanges ?? 3) ||
    visitCount >= (thresholds.oriented.minVisits ?? 2)
  ) {
    return 'ORIENTED';
  }

  // ARRIVAL: New user, minimal engagement
  return 'ARRIVAL';
}
