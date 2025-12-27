// utils/stageComputation.ts
// Pure function for stage computation
// Sprint: engagement-consolidation-v1

import { EngagementState, SessionStage, StageThresholds } from '../src/core/schema/engagement';
import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

/**
 * computeSessionStage - Deterministic pure function
 *
 * Computes the user's engagement stage based on current state.
 * Stage progression: ARRIVAL → ORIENTED → EXPLORING → ENGAGED
 *
 * @param state - Current engagement state
 * @param thresholds - Configurable thresholds (declarative, DEX-compliant)
 * @returns SessionStage
 */
export function computeSessionStage(
  state: EngagementState,
  thresholds: StageThresholds = DEFAULT_STAGE_THRESHOLDS
): SessionStage {
  const t = thresholds;

  // ENGAGED: 1+ sprout OR (3+ visits AND 15+ total exchanges)
  if (
    state.sproutsCaptured >= (t.engaged.minSprouts ?? 1) ||
    (state.visitCount >= (t.engaged.minVisits ?? 3) &&
     state.totalExchangeCount >= (t.engaged.minTotalExchanges ?? 15))
  ) {
    return 'ENGAGED';
  }

  // EXPLORING: 5+ exchanges OR 2+ topics
  if (
    state.exchangeCount >= (t.exploring.minExchanges ?? 5) ||
    state.topicsExplored.length >= (t.exploring.minTopics ?? 2)
  ) {
    return 'EXPLORING';
  }

  // ORIENTED: 3+ exchanges OR 2+ visits
  if (
    state.exchangeCount >= (t.oriented.minExchanges ?? 3) ||
    state.visitCount >= (t.oriented.minVisits ?? 2)
  ) {
    return 'ORIENTED';
  }

  return 'ARRIVAL';
}
