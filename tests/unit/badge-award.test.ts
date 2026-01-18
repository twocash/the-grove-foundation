// tests/unit/badge-award.test.ts
// Badge Award Engine Unit Tests
// Sprint: S11-SL-Attribution v1 - Phase 3

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateCriteria,
  isNewlyEarned,
  detectTierChange,
  evaluateBadges,
  getNewlyEarnedBadges,
  awardBadge,
  awardBadges,
  calculateBadgeStatistics,
  type BadgeEvaluationContext
} from '../../src/core/engine/badgeAwardEngine';
import {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
  getAllBadgeDefinitions
} from '../../src/core/schema/badges';
import type { ReputationScore, TokenBalance } from '../../src/core/schema/attribution';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockReputation(overrides: Partial<ReputationScore> = {}): ReputationScore {
  return {
    id: 'rep-1',
    groveId: 'grove-1',
    reputationScore: 0,
    currentTier: 'novice',
    tierMultiplier: 0.9,
    totalContributions: 0,
    qualityWeightedScore: 0,
    badges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function createMockTokenBalance(overrides: Partial<TokenBalance> = {}): TokenBalance {
  return {
    id: 'bal-1',
    groveId: 'grove-1',
    currentBalance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    totalAttributions: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function createMockContext(overrides: Partial<BadgeEvaluationContext> = {}): BadgeEvaluationContext {
  return {
    reputation: createMockReputation(overrides.reputation as Partial<ReputationScore>),
    tokenBalance: createMockTokenBalance(overrides.tokenBalance as Partial<TokenBalance>),
    earnedBadges: overrides.earnedBadges || [],
    previousReputation: overrides.previousReputation
  };
}

// =============================================================================
// Badge Schema Tests
// =============================================================================

describe('Badge Definitions', () => {
  it('should have at least 10 pre-defined badges', () => {
    const badges = getAllBadgeDefinitions();
    expect(badges.length).toBeGreaterThanOrEqual(10);
  });

  it('should have 5 tier badges', () => {
    const tierBadges = getAllBadgeDefinitions().filter(b => b.category === 'tier');
    expect(tierBadges).toHaveLength(5);
  });

  it('should have badge definitions for all tier levels', () => {
    const tiers = ['novice', 'developing', 'competent', 'expert', 'legendary'];
    for (const tier of tiers) {
      const badge = getBadgeDefinition(`tier-${tier}`);
      expect(badge).toBeTruthy();
      expect(badge?.criteria.type).toBe('tier_reached');
      expect(badge?.criteria.value).toBe(tier);
    }
  });

  it('should have milestone badges', () => {
    const milestoneBadges = getAllBadgeDefinitions().filter(b => b.category === 'milestone');
    expect(milestoneBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('should have first contribution badge', () => {
    const badge = getBadgeDefinition('milestone-first');
    expect(badge).toBeTruthy();
    expect(badge?.criteria.type).toBe('contribution_count');
    expect(badge?.criteria.value).toBe(1);
  });

  it('should have valid rarity for all badges', () => {
    const validRarities = ['common', 'uncommon', 'rare', 'legendary'];
    const badges = getAllBadgeDefinitions();
    for (const badge of badges) {
      expect(validRarities).toContain(badge.rarity);
    }
  });
});

// =============================================================================
// Criteria Evaluation Tests
// =============================================================================

describe('evaluateCriteria', () => {
  it('should match tier_reached criteria when tier matches', () => {
    const badge = BADGE_DEFINITIONS['tier-novice'];
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore
    });

    expect(evaluateCriteria(badge, context)).toBe(true);
  });

  it('should not match tier_reached criteria when tier differs', () => {
    const badge = BADGE_DEFINITIONS['tier-expert'];
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore
    });

    expect(evaluateCriteria(badge, context)).toBe(false);
  });

  it('should match contribution_count when threshold met', () => {
    const badge = BADGE_DEFINITIONS['milestone-first'];
    const context = createMockContext({
      reputation: { totalContributions: 1 } as ReputationScore
    });

    expect(evaluateCriteria(badge, context)).toBe(true);
  });

  it('should match contribution_count when exceeding threshold', () => {
    const badge = BADGE_DEFINITIONS['milestone-decathlete'];
    const context = createMockContext({
      reputation: { totalContributions: 15 } as ReputationScore
    });

    expect(evaluateCriteria(badge, context)).toBe(true);
  });

  it('should not match contribution_count when below threshold', () => {
    const badge = BADGE_DEFINITIONS['milestone-decathlete'];
    const context = createMockContext({
      reputation: { totalContributions: 5 } as ReputationScore
    });

    expect(evaluateCriteria(badge, context)).toBe(false);
  });

  it('should match tokens_earned when threshold met', () => {
    const badge = BADGE_DEFINITIONS['tokens-century'];
    const context = createMockContext({
      tokenBalance: { lifetimeEarned: 100 } as TokenBalance
    });

    expect(evaluateCriteria(badge, context)).toBe(true);
  });
});

// =============================================================================
// New Badge Detection Tests
// =============================================================================

describe('isNewlyEarned', () => {
  it('should return true for newly earned badge', () => {
    const badge = BADGE_DEFINITIONS['tier-novice'];
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore,
      earnedBadges: []
    });

    expect(isNewlyEarned(badge, context)).toBe(true);
  });

  it('should return false for already earned badge', () => {
    const badge = BADGE_DEFINITIONS['tier-novice'];
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore,
      earnedBadges: ['tier-novice']
    });

    expect(isNewlyEarned(badge, context)).toBe(false);
  });

  it('should return false when criteria not met', () => {
    const badge = BADGE_DEFINITIONS['tier-expert'];
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore,
      earnedBadges: []
    });

    expect(isNewlyEarned(badge, context)).toBe(false);
  });
});

// =============================================================================
// Tier Change Detection Tests
// =============================================================================

describe('detectTierChange', () => {
  it('should detect tier advancement', () => {
    const context = createMockContext({
      reputation: { currentTier: 'developing' } as ReputationScore,
      previousReputation: { currentTier: 'novice' } as ReputationScore
    });

    const result = detectTierChange(context);
    expect(result.changed).toBe(true);
    expect(result.previousTier).toBe('novice');
    expect(result.currentTier).toBe('developing');
  });

  it('should detect no change when same tier', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore,
      previousReputation: { currentTier: 'novice' } as ReputationScore
    });

    const result = detectTierChange(context);
    expect(result.changed).toBe(false);
  });

  it('should handle missing previous reputation', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice' } as ReputationScore
    });

    const result = detectTierChange(context);
    expect(result.changed).toBe(false);
    expect(result.previousTier).toBeUndefined();
  });
});

// =============================================================================
// Full Badge Evaluation Tests
// =============================================================================

describe('evaluateBadges', () => {
  it('should award tier badge on first evaluation', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice', totalContributions: 1 } as ReputationScore,
      tokenBalance: { lifetimeEarned: 12 } as TokenBalance,
      earnedBadges: []
    });

    const result = evaluateBadges(context);

    expect(result.newBadges.length).toBeGreaterThan(0);
    expect(result.newBadges.some(b => b.badgeId === 'tier-novice')).toBe(true);
    expect(result.newBadges.some(b => b.badgeId === 'milestone-first')).toBe(true);
  });

  it('should not re-award already earned badges', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice', totalContributions: 1 } as ReputationScore,
      tokenBalance: { lifetimeEarned: 12 } as TokenBalance,
      earnedBadges: ['tier-novice', 'milestone-first']
    });

    const result = evaluateBadges(context);

    expect(result.newBadges.some(b => b.badgeId === 'tier-novice')).toBe(false);
    expect(result.newBadges.some(b => b.badgeId === 'milestone-first')).toBe(false);
  });

  it('should award decathlete badge at 10 contributions', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice', totalContributions: 10 } as ReputationScore,
      tokenBalance: { lifetimeEarned: 120 } as TokenBalance,
      earnedBadges: ['tier-novice', 'milestone-first']
    });

    const result = evaluateBadges(context);

    expect(result.newBadges.some(b => b.badgeId === 'milestone-decathlete')).toBe(true);
  });

  it('should award token century badge at 100 tokens', () => {
    const context = createMockContext({
      reputation: { currentTier: 'developing', totalContributions: 8 } as ReputationScore,
      tokenBalance: { lifetimeEarned: 105 } as TokenBalance,
      earnedBadges: ['tier-novice', 'tier-developing', 'milestone-first']
    });

    const result = evaluateBadges(context);

    expect(result.newBadges.some(b => b.badgeId === 'tokens-century')).toBe(true);
  });

  it('should include earnedValue for milestone badges', () => {
    const context = createMockContext({
      reputation: { currentTier: 'novice', totalContributions: 10 } as ReputationScore,
      tokenBalance: { lifetimeEarned: 120 } as TokenBalance,
      earnedBadges: ['tier-novice', 'milestone-first']
    });

    const result = evaluateBadges(context);
    const decathlete = result.newBadges.find(b => b.badgeId === 'milestone-decathlete');

    expect(decathlete).toBeTruthy();
    expect(decathlete?.earnedValue).toBe(10);
  });
});

// =============================================================================
// Badge Award Helper Tests
// =============================================================================

describe('awardBadge', () => {
  it('should add badge to empty list', () => {
    const result = awardBadge([], 'tier-novice');
    expect(result.badges).toEqual(['tier-novice']);
    expect(result.awarded).toBe(true);
  });

  it('should not add duplicate badge', () => {
    const result = awardBadge(['tier-novice'], 'tier-novice');
    expect(result.badges).toEqual(['tier-novice']);
    expect(result.awarded).toBe(false);
  });
});

describe('awardBadges', () => {
  it('should award multiple badges', () => {
    const result = awardBadges([], ['tier-novice', 'milestone-first']);
    expect(result.badges).toEqual(['tier-novice', 'milestone-first']);
    expect(result.newlyAwarded).toEqual(['tier-novice', 'milestone-first']);
  });

  it('should filter out already earned badges', () => {
    const result = awardBadges(['tier-novice'], ['tier-novice', 'milestone-first']);
    expect(result.badges).toEqual(['tier-novice', 'milestone-first']);
    expect(result.newlyAwarded).toEqual(['milestone-first']);
  });
});

// =============================================================================
// Badge Statistics Tests
// =============================================================================

describe('calculateBadgeStatistics', () => {
  it('should calculate correct percentages', () => {
    const allBadges = getAllBadgeDefinitions();
    const stats = calculateBadgeStatistics(['tier-novice', 'milestone-first']);

    expect(stats.totalBadges).toBe(allBadges.length);
    expect(stats.earnedCount).toBe(2);
    expect(stats.earnedPercentage).toBe(Math.round((2 / allBadges.length) * 100));
  });

  it('should group by category', () => {
    const stats = calculateBadgeStatistics(['tier-novice', 'tier-developing', 'milestone-first']);

    expect(stats.byCategory.tier.earned).toBe(2);
    expect(stats.byCategory.milestone.earned).toBe(1);
  });

  it('should group by rarity', () => {
    const stats = calculateBadgeStatistics(['tier-novice', 'tier-expert']);

    expect(stats.byRarity.common.earned).toBe(1); // novice
    expect(stats.byRarity.rare.earned).toBe(1); // expert
  });

  it('should track recently earned badges', () => {
    const stats = calculateBadgeStatistics(
      ['tier-novice', 'milestone-first', 'milestone-decathlete'],
      2
    );

    expect(stats.recentlyEarned).toHaveLength(2);
    // Most recent first
    expect(stats.recentlyEarned[0].id).toBe('milestone-decathlete');
    expect(stats.recentlyEarned[1].id).toBe('milestone-first');
  });

  it('should handle empty earned badges', () => {
    const stats = calculateBadgeStatistics([]);

    expect(stats.earnedCount).toBe(0);
    expect(stats.earnedPercentage).toBe(0);
    expect(stats.recentlyEarned).toHaveLength(0);
  });
});

// =============================================================================
// getNewlyEarnedBadges Tests
// =============================================================================

describe('getNewlyEarnedBadges', () => {
  it('should return badges in after but not in before', () => {
    const before = ['tier-novice'];
    const after = ['tier-novice', 'milestone-first', 'tier-developing'];

    const result = getNewlyEarnedBadges(before, after);

    expect(result).toHaveLength(2);
    expect(result.some(b => b.badgeId === 'milestone-first')).toBe(true);
    expect(result.some(b => b.badgeId === 'tier-developing')).toBe(true);
  });

  it('should return empty array when no new badges', () => {
    const before = ['tier-novice', 'milestone-first'];
    const after = ['tier-novice', 'milestone-first'];

    const result = getNewlyEarnedBadges(before, after);
    expect(result).toHaveLength(0);
  });

  it('should handle empty before array', () => {
    const before: string[] = [];
    const after = ['tier-novice'];

    const result = getNewlyEarnedBadges(before, after);
    expect(result).toHaveLength(1);
    expect(result[0].badgeId).toBe('tier-novice');
  });
});
