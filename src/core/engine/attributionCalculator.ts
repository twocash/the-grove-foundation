// src/core/engine/attributionCalculator.ts
// Attribution Economy Calculator
// Sprint: S11-SL-Attribution v1.0
// Calculates token rewards based on tier, quality, network, and reputation

import {
  type ContentTierLevel,
  type ReputationTier,
  type TokenCalculationInput,
  type TokenCalculationResult,
  type AttributionEvent,
  type TokenBalance,
  type ReputationScore,
  type NetworkInfluence,
  type ChainEvent,
  type AttributionChain,
  BASE_TOKENS,
  getQualityMultiplier,
  getReputationTier,
  getTierMultiplier,
  REPUTATION_TIER_CONFIGS,
  calculateTokens
} from '../schema/attribution';

// =============================================================================
// Attribution Calculator Service
// =============================================================================

export interface AttributionCalculatorConfig {
  /** Default attribution strength when not calculated */
  defaultAttributionStrength: number;
  /** Default network bonus when no influence data */
  defaultNetworkBonus: number;
  /** Minimum network bonus (floor) */
  minNetworkBonus: number;
  /** Maximum network bonus (cap) */
  maxNetworkBonus: number;
}

export const DEFAULT_CALCULATOR_CONFIG: AttributionCalculatorConfig = {
  defaultAttributionStrength: 0.75,
  defaultNetworkBonus: 0.2,
  minNetworkBonus: 0.0,
  maxNetworkBonus: 2.0
};

/**
 * Calculate network bonus based on influence score
 * Maps 0-100 influence to minNetworkBonus-maxNetworkBonus range
 */
export function calculateNetworkBonus(
  influenceScore: number,
  config: AttributionCalculatorConfig = DEFAULT_CALCULATOR_CONFIG
): number {
  const { minNetworkBonus, maxNetworkBonus } = config;
  const normalizedScore = Math.max(0, Math.min(100, influenceScore)) / 100;
  return minNetworkBonus + normalizedScore * (maxNetworkBonus - minNetworkBonus);
}

/**
 * Calculate reputation score from contribution history
 * Uses quality-weighted average of contributions
 */
export function calculateReputationScore(
  totalContributions: number,
  qualityWeightedScore: number,
  consistencyBonus: number = 0
): number {
  if (totalContributions === 0) return 0;

  // Base score from quality-weighted average (0-100)
  const baseScore = qualityWeightedScore / totalContributions;

  // Apply consistency bonus (up to 10 points for consistent quality)
  const adjustedScore = baseScore + Math.min(consistencyBonus, 10);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, adjustedScore));
}

/**
 * Update reputation score after a new attribution event
 */
export function updateReputationFromAttribution(
  currentReputation: ReputationScore,
  qualityScore: number,
  attributionStrength: number
): ReputationScore {
  const newTotalContributions = currentReputation.totalContributions + 1;
  const newQualityWeightedScore =
    currentReputation.qualityWeightedScore + qualityScore * attributionStrength;

  const newReputationScore = calculateReputationScore(
    newTotalContributions,
    newQualityWeightedScore,
    currentReputation.consistencyScore || 0
  );

  const newTier = getReputationTier(newReputationScore);
  const tierChanged = newTier !== currentReputation.currentTier;

  return {
    ...currentReputation,
    reputationScore: newReputationScore,
    currentTier: newTier,
    tierMultiplier: getTierMultiplier(newTier),
    totalContributions: newTotalContributions,
    qualityWeightedScore: newQualityWeightedScore,
    averageQuality: newQualityWeightedScore / newTotalContributions,
    tierAchievedAt: tierChanged ? new Date().toISOString() : currentReputation.tierAchievedAt,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Update token balance after a new attribution event
 */
export function updateTokenBalance(
  currentBalance: TokenBalance,
  tokensEarned: number
): TokenBalance {
  return {
    ...currentBalance,
    currentBalance: currentBalance.currentBalance + tokensEarned,
    lifetimeEarned: currentBalance.lifetimeEarned + tokensEarned,
    totalAttributions: currentBalance.totalAttributions + 1,
    lastActivityAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Update network influence between two groves
 */
export function updateNetworkInfluence(
  current: NetworkInfluence | null,
  tokensExchanged: number
): NetworkInfluence {
  const now = new Date().toISOString();

  if (!current) {
    // Create new influence record
    const initialInfluence: NetworkInfluence = {
      id: crypto.randomUUID(),
      sourceGroveId: '',  // Must be set by caller
      targetGroveId: '',  // Must be set by caller
      influenceScore: 10, // Start with base influence
      interactionCount: 1,
      totalTokensExchanged: tokensExchanged,
      networkBonus: calculateNetworkBonus(10),
      isBidirectional: false,
      firstInteractionAt: now,
      lastInteractionAt: now,
      createdAt: now,
      updatedAt: now
    };
    return initialInfluence;
  }

  // Update existing influence
  const newInteractionCount = current.interactionCount + 1;
  const newTotalTokens = current.totalTokensExchanged + tokensExchanged;

  // Influence grows with interactions (logarithmic scale, max 100)
  const newInfluenceScore = Math.min(
    100,
    10 + Math.log10(1 + newInteractionCount) * 20 + Math.log10(1 + newTotalTokens / 100) * 10
  );

  return {
    ...current,
    influenceScore: newInfluenceScore,
    interactionCount: newInteractionCount,
    totalTokensExchanged: newTotalTokens,
    networkBonus: calculateNetworkBonus(newInfluenceScore),
    lastInteractionAt: now,
    updatedAt: now
  };
}

/**
 * Create a new attribution event with full calculation
 */
export interface CreateAttributionEventInput {
  sourceGroveId: string;
  targetGroveId: string;
  contentId?: string;
  tierLevel: ContentTierLevel;
  qualityScore?: number;
  networkInfluence?: NetworkInfluence;
  sourceReputation?: ReputationScore;
}

export function createAttributionEvent(
  input: CreateAttributionEventInput,
  config: AttributionCalculatorConfig = DEFAULT_CALCULATOR_CONFIG
): AttributionEvent {
  const { sourceGroveId, targetGroveId, contentId, tierLevel, qualityScore = 50, networkInfluence, sourceReputation } = input;

  // Calculate all components
  const baseTokens = BASE_TOKENS[tierLevel];
  const qualityMultiplier = getQualityMultiplier(qualityScore);

  // Network bonus from influence relationship or default
  const networkBonus = networkInfluence
    ? networkInfluence.networkBonus
    : config.defaultNetworkBonus;

  // Reputation multiplier from source grove's reputation
  const reputationMultiplier = sourceReputation
    ? sourceReputation.tierMultiplier
    : 1.0;

  // Calculate final tokens
  const calculation = calculateTokens({
    tierLevel,
    qualityScore,
    networkBonus,
    reputationTier: sourceReputation?.currentTier
  });

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    sourceGroveId,
    targetGroveId,
    contentId,
    tierLevel,
    qualityScore,
    attributionStrength: config.defaultAttributionStrength,
    baseTokens,
    qualityMultiplier,
    networkBonus,
    reputationMultiplier,
    finalTokens: calculation.finalTokens,
    createdAt: now,
    updatedAt: now
  };
}

// =============================================================================
// Attribution Chain Management
// =============================================================================

/**
 * Add an event to an attribution chain
 */
export function addEventToChain(
  chain: AttributionChain,
  event: AttributionEvent
): AttributionChain {
  const newChainEvent: ChainEvent = {
    eventId: event.id,
    sourceGroveId: event.sourceGroveId,
    targetGroveId: event.targetGroveId,
    tokens: event.finalTokens,
    timestamp: event.createdAt
  };

  const newChainEvents = [...chain.chainEvents, newChainEvent];
  const uniqueParticipants = new Set<string>();
  let totalQuality = 0;
  let qualityCount = 0;

  for (const ce of newChainEvents) {
    uniqueParticipants.add(ce.sourceGroveId);
    uniqueParticipants.add(ce.targetGroveId);
  }

  // Calculate average quality if available
  // chain.chainDepth = number of events currently in chain (before adding this one)
  // chain.averageQuality = average of those chainDepth events
  if (event.qualityScore !== undefined) {
    totalQuality = (chain.averageQuality || 0) * chain.chainDepth + event.qualityScore;
    qualityCount = chain.chainDepth + 1;
  }

  return {
    ...chain,
    chainDepth: chain.chainDepth + 1,
    chainEvents: newChainEvents,
    totalTokens: chain.totalTokens + event.finalTokens,
    participantCount: uniqueParticipants.size,
    averageQuality: qualityCount > 0 ? totalQuality / qualityCount : chain.averageQuality,
    lastEventAt: event.createdAt,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Create a new attribution chain from a root content
 */
export function createAttributionChain(
  rootContentId: string,
  initialEvent?: AttributionEvent
): AttributionChain {
  const now = new Date().toISOString();

  const chain: AttributionChain = {
    id: crypto.randomUUID(),
    rootContentId,
    chainDepth: 0,
    chainEvents: [],
    totalTokens: 0,
    participantCount: 0,
    chainStartedAt: now,
    lastEventAt: now,
    createdAt: now,
    updatedAt: now
  };

  if (initialEvent) {
    return addEventToChain(chain, initialEvent);
  }

  return chain;
}

// =============================================================================
// Default Balance/Reputation Factories
// =============================================================================

/**
 * Create a new empty token balance for a grove
 */
export function createEmptyTokenBalance(groveId: string): TokenBalance {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    groveId,
    currentBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    totalAttributions: 0,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Create a new reputation score for a grove (starts as Novice)
 */
export function createEmptyReputationScore(groveId: string): ReputationScore {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    groveId,
    reputationScore: 0,
    currentTier: 'novice',
    tierMultiplier: REPUTATION_TIER_CONFIGS.novice.multiplier,
    totalContributions: 0,
    qualityWeightedScore: 0,
    badges: [],
    tierAchievedAt: now,
    createdAt: now,
    updatedAt: now
  };
}

// =============================================================================
// Summary Statistics
// =============================================================================

export interface AttributionSummary {
  totalEvents: number;
  totalTokensDistributed: number;
  averageQuality: number;
  averageTokensPerEvent: number;
  tierBreakdown: Record<ContentTierLevel, { count: number; tokens: number }>;
  topContributors: Array<{ groveId: string; tokens: number }>;
}

/**
 * Calculate summary statistics from attribution events
 */
export function calculateAttributionSummary(
  events: AttributionEvent[],
  maxTopContributors: number = 10
): AttributionSummary {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      totalTokensDistributed: 0,
      averageQuality: 0,
      averageTokensPerEvent: 0,
      tierBreakdown: {
        1: { count: 0, tokens: 0 },
        2: { count: 0, tokens: 0 },
        3: { count: 0, tokens: 0 }
      },
      topContributors: []
    };
  }

  let totalTokens = 0;
  let totalQuality = 0;
  let qualityCount = 0;

  const tierBreakdown: Record<ContentTierLevel, { count: number; tokens: number }> = {
    1: { count: 0, tokens: 0 },
    2: { count: 0, tokens: 0 },
    3: { count: 0, tokens: 0 }
  };

  const contributorTokens = new Map<string, number>();

  for (const event of events) {
    totalTokens += event.finalTokens;

    if (event.qualityScore !== undefined) {
      totalQuality += event.qualityScore;
      qualityCount++;
    }

    tierBreakdown[event.tierLevel].count++;
    tierBreakdown[event.tierLevel].tokens += event.finalTokens;

    const currentContributorTokens = contributorTokens.get(event.sourceGroveId) || 0;
    contributorTokens.set(event.sourceGroveId, currentContributorTokens + event.finalTokens);
  }

  // Sort contributors by tokens
  const topContributors = Array.from(contributorTokens.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopContributors)
    .map(([groveId, tokens]) => ({ groveId, tokens }));

  return {
    totalEvents: events.length,
    totalTokensDistributed: totalTokens,
    averageQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
    averageTokensPerEvent: totalTokens / events.length,
    tierBreakdown,
    topContributors
  };
}

// =============================================================================
// Exports for testing
// =============================================================================

export {
  calculateTokens,
  getQualityMultiplier,
  getReputationTier,
  getTierMultiplier,
  BASE_TOKENS,
  REPUTATION_TIER_CONFIGS
};
