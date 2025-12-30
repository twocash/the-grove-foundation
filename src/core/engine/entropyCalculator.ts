// src/core/engine/entropyCalculator.ts
// Pure entropy calculation function
// Sprint: entropy-calculation-v1

export interface EntropyInputs {
  hubsVisited: string[];           // Unique hub IDs touched this session
  exchangeCount: number;           // Total queries sent
  pivotCount: number;              // Concept span clicks
  journeyWaypointsHit: number;     // Waypoints completed (if on journey)
  journeyWaypointsTotal: number;   // Total waypoints in journey (0 if no journey)
  consecutiveHubRepeats: number;   // Same hub hit back-to-back
}

/**
 * Calculate entropy (0.0 - 1.0) representing conversation divergence
 *
 * High entropy = exploring many topics, jumping around
 * Low entropy = focused on one area, following journey
 *
 * Formula components:
 * - Hub diversity: uniqueHubs / min(exchanges, 8) * 0.4
 * - Journey divergence: (1 - waypointsHit/total) * 0.3 or 0.5 baseline
 * - Pivot bonus: min(pivots * 0.15, 0.3) * 0.2
 * - Focus penalty: min(consecutiveRepeats * 0.1, 0.3) * 0.1
 */
export function calculateEntropy(inputs: EntropyInputs): number {
  const {
    hubsVisited,
    exchangeCount,
    pivotCount,
    journeyWaypointsHit,
    journeyWaypointsTotal,
    consecutiveHubRepeats
  } = inputs;

  // No exchanges yet = baseline entropy
  if (exchangeCount === 0) {
    return 0;
  }

  // Hub diversity: How many unique hubs relative to exchanges
  // Cap denominator at 8 to prevent entropy from dropping as conversation grows
  const uniqueHubs = hubsVisited.length;
  const normalizedExchanges = Math.min(exchangeCount, 8);
  const hubDiversity = normalizedExchanges > 0
    ? Math.min(uniqueHubs / normalizedExchanges, 1.0)
    : 0;

  // Journey divergence: Are they following the path?
  // No journey = baseline 0.5, on journey = 1 - (progress%)
  let journeyDivergence = 0.5;
  if (journeyWaypointsTotal > 0) {
    journeyDivergence = 1 - (journeyWaypointsHit / journeyWaypointsTotal);
  }

  // Pivot bonus: Clicking concept spans signals exploration
  const pivotBonus = Math.min(pivotCount * 0.15, 0.3);

  // Focus penalty: Staying on same hub repeatedly
  const focusPenalty = Math.min(consecutiveHubRepeats * 0.1, 0.3);

  // Weighted combination
  const rawEntropy =
    (hubDiversity * 0.4) +
    (journeyDivergence * 0.3) +
    (pivotBonus * 0.2) -
    (focusPenalty * 0.1);

  // Clamp to [0, 1]
  const entropy = Math.max(0, Math.min(1, rawEntropy));

  console.log('[Entropy] Calculated:', {
    inputs: { uniqueHubs, exchangeCount, pivotCount, journeyWaypointsHit, journeyWaypointsTotal, consecutiveHubRepeats },
    components: { hubDiversity: hubDiversity.toFixed(2), journeyDivergence: journeyDivergence.toFixed(2), pivotBonus: pivotBonus.toFixed(2), focusPenalty: focusPenalty.toFixed(2) },
    result: entropy.toFixed(3)
  });

  return entropy;
}
