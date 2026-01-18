// src/core/engine/badgeAwardEngine.ts
// Badge Award Engine
// Sprint: S11-SL-Attribution v1.0 - Phase 3
// Pure TypeScript engine for evaluating and awarding badges

import {
  type BadgeDefinition,
  type BadgeAwardResult,
  type BadgeEvaluationResult,
  type EarnedBadge,
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  getAllBadgeDefinitions
} from '../schema/badges';

import type {
  ReputationScore,
  TokenBalance,
  ReputationTier
} from '../schema/attribution';

// =============================================================================
// Badge Evaluation Context
// =============================================================================

/**
 * Context for evaluating badge eligibility
 */
export interface BadgeEvaluationContext {
  /** Current reputation score */
  reputation: ReputationScore;
  /** Current token balance */
  tokenBalance: TokenBalance;
  /** Previously earned badges */
  earnedBadges: string[];
  /** Optional: previous reputation state (for detecting tier changes) */
  previousReputation?: ReputationScore;
  /** Optional: previous token balance (for detecting token milestones) */
  previousTokenBalance?: TokenBalance;
}

// =============================================================================
// Badge Criteria Evaluation
// =============================================================================

/**
 * Check if a single badge criteria is met
 */
export function evaluateCriteria(
  badge: BadgeDefinition,
  context: BadgeEvaluationContext
): boolean {
  const { criteria } = badge;
  const { reputation, tokenBalance } = context;

  switch (criteria.type) {
    case 'tier_reached':
      return reputation.currentTier === criteria.value;

    case 'contribution_count':
      return reputation.totalContributions >= (criteria.value as number);

    case 'tokens_earned':
      return tokenBalance.lifetimeEarned >= (criteria.value as number);

    case 'quality_streak':
      // Quality streak requires consecutive high-quality contributions
      // For now, check if average quality meets threshold
      const threshold = criteria.value as number;
      return (reputation.averageQuality || 0) >= threshold;

    case 'special_event':
      // Special events are awarded manually, not auto-evaluated
      return false;

    default:
      return false;
  }
}

/**
 * Check if badge was NEWLY earned (not earned before, criteria now met)
 */
export function isNewlyEarned(
  badge: BadgeDefinition,
  context: BadgeEvaluationContext
): boolean {
  // Already earned? Not new
  if (context.earnedBadges.includes(badge.id)) {
    return false;
  }

  // Check if criteria is now met
  return evaluateCriteria(badge, context);
}

// =============================================================================
// Tier Change Detection
// =============================================================================

/**
 * Detect if tier has changed (for tier badges)
 */
export function detectTierChange(context: BadgeEvaluationContext): {
  changed: boolean;
  previousTier?: ReputationTier;
  currentTier: ReputationTier;
} {
  const currentTier = context.reputation.currentTier;
  const previousTier = context.previousReputation?.currentTier;

  return {
    changed: previousTier !== undefined && previousTier !== currentTier,
    previousTier,
    currentTier
  };
}

// =============================================================================
// Badge Award Logic
// =============================================================================

/**
 * Evaluate all badges and return newly earned ones
 */
export function evaluateBadges(context: BadgeEvaluationContext): BadgeEvaluationResult {
  const allBadges = getAllBadgeDefinitions();
  const newBadges: BadgeAwardResult[] = [];
  const now = new Date().toISOString();

  for (const badge of allBadges) {
    if (isNewlyEarned(badge, context)) {
      // Determine earned value based on criteria type
      let earnedValue: number | undefined;
      switch (badge.criteria.type) {
        case 'contribution_count':
          earnedValue = context.reputation.totalContributions;
          break;
        case 'tokens_earned':
          earnedValue = context.tokenBalance.lifetimeEarned;
          break;
      }

      newBadges.push({
        badgeId: badge.id,
        badge,
        earnedAt: now,
        earnedValue,
        isNew: true
      });
    }
  }

  // Combine previously earned with newly earned
  const earnedBadges = [
    ...context.earnedBadges,
    ...newBadges.map(b => b.badgeId)
  ];

  return {
    earnedBadges,
    newBadges,
    allBadges
  };
}

/**
 * Get newly earned badges by comparing before/after states
 */
export function getNewlyEarnedBadges(
  beforeBadges: string[],
  afterBadges: string[]
): BadgeAwardResult[] {
  const newBadgeIds = afterBadges.filter(id => !beforeBadges.includes(id));
  const now = new Date().toISOString();

  return newBadgeIds
    .map(id => {
      const badge = getBadgeDefinition(id);
      if (!badge) return null;
      return {
        badgeId: id,
        badge,
        earnedAt: now,
        isNew: true
      };
    })
    .filter((b): b is BadgeAwardResult => b !== null);
}

// =============================================================================
// Badge Award Helpers
// =============================================================================

/**
 * Award a badge to a user's earned badges list
 */
export function awardBadge(
  earnedBadges: string[],
  badgeId: string
): { badges: string[]; awarded: boolean } {
  if (earnedBadges.includes(badgeId)) {
    return { badges: earnedBadges, awarded: false };
  }

  return {
    badges: [...earnedBadges, badgeId],
    awarded: true
  };
}

/**
 * Award multiple badges at once
 */
export function awardBadges(
  earnedBadges: string[],
  badgeIds: string[]
): { badges: string[]; newlyAwarded: string[] } {
  const newlyAwarded: string[] = [];
  let badges = [...earnedBadges];

  for (const badgeId of badgeIds) {
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      newlyAwarded.push(badgeId);
    }
  }

  return { badges, newlyAwarded };
}

/**
 * Convert earned badge IDs to full EarnedBadge records
 */
export function toEarnedBadgeRecords(
  badgeIds: string[],
  earnedAt?: string
): EarnedBadge[] {
  const timestamp = earnedAt || new Date().toISOString();
  return badgeIds.map(badgeId => ({
    badgeId,
    earnedAt: timestamp
  }));
}

// =============================================================================
// Badge Statistics
// =============================================================================

export interface BadgeStatistics {
  totalBadges: number;
  earnedCount: number;
  earnedPercentage: number;
  byCategory: Record<string, { total: number; earned: number }>;
  byRarity: Record<string, { total: number; earned: number }>;
  recentlyEarned: BadgeDefinition[];
}

/**
 * Calculate badge statistics for a user
 */
export function calculateBadgeStatistics(
  earnedBadges: string[],
  recentCount: number = 3
): BadgeStatistics {
  const allBadges = getAllBadgeDefinitions();
  const earnedSet = new Set(earnedBadges);

  // Initialize category and rarity counts
  const byCategory: Record<string, { total: number; earned: number }> = {};
  const byRarity: Record<string, { total: number; earned: number }> = {};

  for (const badge of allBadges) {
    // Category
    if (!byCategory[badge.category]) {
      byCategory[badge.category] = { total: 0, earned: 0 };
    }
    byCategory[badge.category].total++;
    if (earnedSet.has(badge.id)) {
      byCategory[badge.category].earned++;
    }

    // Rarity
    if (!byRarity[badge.rarity]) {
      byRarity[badge.rarity] = { total: 0, earned: 0 };
    }
    byRarity[badge.rarity].total++;
    if (earnedSet.has(badge.id)) {
      byRarity[badge.rarity].earned++;
    }
  }

  // Get recently earned badges (last N from the list)
  const recentlyEarned = earnedBadges
    .slice(-recentCount)
    .reverse()
    .map(id => getBadgeDefinition(id))
    .filter((b): b is BadgeDefinition => b !== null);

  return {
    totalBadges: allBadges.length,
    earnedCount: earnedBadges.length,
    earnedPercentage: allBadges.length > 0
      ? Math.round((earnedBadges.length / allBadges.length) * 100)
      : 0,
    byCategory,
    byRarity,
    recentlyEarned
  };
}

// =============================================================================
// Exports
// =============================================================================

export {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  getAllBadgeDefinitions
} from '../schema/badges';
