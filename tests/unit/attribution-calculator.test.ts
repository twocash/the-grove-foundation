import { describe, test, expect } from 'vitest';
import {
  getQualityMultiplier,
  getReputationTier,
  getTierMultiplier,
  calculateTokens,
  calculateNetworkBonus,
  calculateReputationScore,
  updateReputationFromAttribution,
  updateTokenBalance,
  createAttributionEvent,
  createAttributionChain,
  addEventToChain,
  createEmptyTokenBalance,
  createEmptyReputationScore,
  calculateAttributionSummary,
  BASE_TOKENS,
  REPUTATION_TIER_CONFIGS,
  DEFAULT_CALCULATOR_CONFIG
} from '../../src/core/engine/attributionCalculator';
import type {
  TokenBalance,
  ReputationScore,
  AttributionEvent,
  ContentTierLevel
} from '../../src/core/schema/attribution';

describe('Attribution Calculator', () => {
  describe('Quality Multipliers', () => {
    test('returns 2.0x for scores >= 90', () => {
      expect(getQualityMultiplier(90)).toBe(2.0);
      expect(getQualityMultiplier(95)).toBe(2.0);
      expect(getQualityMultiplier(100)).toBe(2.0);
    });

    test('returns 1.8x for scores 80-89', () => {
      expect(getQualityMultiplier(80)).toBe(1.8);
      expect(getQualityMultiplier(85)).toBe(1.8);
      expect(getQualityMultiplier(89)).toBe(1.8);
    });

    test('returns 1.6x for scores 70-79', () => {
      expect(getQualityMultiplier(70)).toBe(1.6);
      expect(getQualityMultiplier(75)).toBe(1.6);
    });

    test('returns 1.4x for scores 60-69', () => {
      expect(getQualityMultiplier(60)).toBe(1.4);
      expect(getQualityMultiplier(65)).toBe(1.4);
    });

    test('returns 1.2x for scores 50-59', () => {
      expect(getQualityMultiplier(50)).toBe(1.2);
      expect(getQualityMultiplier(55)).toBe(1.2);
    });

    test('returns 1.0x for scores 40-49', () => {
      expect(getQualityMultiplier(40)).toBe(1.0);
      expect(getQualityMultiplier(45)).toBe(1.0);
    });

    test('returns 0.9x for scores 30-39', () => {
      expect(getQualityMultiplier(30)).toBe(0.9);
      expect(getQualityMultiplier(35)).toBe(0.9);
    });

    test('returns 0.8x for scores 20-29', () => {
      expect(getQualityMultiplier(20)).toBe(0.8);
      expect(getQualityMultiplier(25)).toBe(0.8);
    });

    test('returns 0.5x for scores < 20', () => {
      expect(getQualityMultiplier(0)).toBe(0.5);
      expect(getQualityMultiplier(10)).toBe(0.5);
      expect(getQualityMultiplier(19)).toBe(0.5);
    });
  });

  describe('Reputation Tiers', () => {
    test('returns legendary for scores >= 90', () => {
      expect(getReputationTier(90)).toBe('legendary');
      expect(getReputationTier(100)).toBe('legendary');
    });

    test('returns expert for scores 70-89', () => {
      expect(getReputationTier(70)).toBe('expert');
      expect(getReputationTier(85)).toBe('expert');
      expect(getReputationTier(89)).toBe('expert');
    });

    test('returns competent for scores 50-69', () => {
      expect(getReputationTier(50)).toBe('competent');
      expect(getReputationTier(65)).toBe('competent');
      expect(getReputationTier(69)).toBe('competent');
    });

    test('returns developing for scores 30-49', () => {
      expect(getReputationTier(30)).toBe('developing');
      expect(getReputationTier(45)).toBe('developing');
      expect(getReputationTier(49)).toBe('developing');
    });

    test('returns novice for scores < 30', () => {
      expect(getReputationTier(0)).toBe('novice');
      expect(getReputationTier(15)).toBe('novice');
      expect(getReputationTier(29)).toBe('novice');
    });
  });

  describe('Tier Multipliers', () => {
    test('legendary tier has 1.5x multiplier', () => {
      expect(getTierMultiplier('legendary')).toBe(1.5);
    });

    test('expert tier has 1.3x multiplier', () => {
      expect(getTierMultiplier('expert')).toBe(1.3);
    });

    test('competent tier has 1.1x multiplier', () => {
      expect(getTierMultiplier('competent')).toBe(1.1);
    });

    test('developing tier has 1.0x multiplier', () => {
      expect(getTierMultiplier('developing')).toBe(1.0);
    });

    test('novice tier has 0.9x multiplier', () => {
      expect(getTierMultiplier('novice')).toBe(0.9);
    });
  });

  describe('Token Calculation', () => {
    test('calculates base tokens for tier 1 (Sprout)', () => {
      const result = calculateTokens({
        tierLevel: 1,
        qualityScore: 50, // 1.2x multiplier
        networkBonus: 0,  // 1.0x network
        reputationTier: 'developing' // 1.0x reputation
      });

      expect(result.baseTokens).toBe(10);
      expect(result.qualityMultiplier).toBe(1.2);
      expect(result.finalTokens).toBe(12); // 10 * 1.2 * 1.0 * 1.0
    });

    test('calculates base tokens for tier 2 (Sapling)', () => {
      const result = calculateTokens({
        tierLevel: 2,
        qualityScore: 50,
        networkBonus: 0,
        reputationTier: 'developing'
      });

      expect(result.baseTokens).toBe(50);
      expect(result.finalTokens).toBe(60); // 50 * 1.2 * 1.0 * 1.0
    });

    test('calculates base tokens for tier 3 (Tree)', () => {
      const result = calculateTokens({
        tierLevel: 3,
        qualityScore: 50,
        networkBonus: 0,
        reputationTier: 'developing'
      });

      expect(result.baseTokens).toBe(250);
      expect(result.finalTokens).toBe(300); // 250 * 1.2 * 1.0 * 1.0
    });

    test('applies full formula: base × quality × (1+network) × reputation', () => {
      const result = calculateTokens({
        tierLevel: 1,        // 10 base tokens
        qualityScore: 90,    // 2.0x quality
        networkBonus: 0.5,   // 1.5x network
        reputationTier: 'legendary' // 1.5x reputation
      });

      // 10 * 2.0 * 1.5 * 1.5 = 45
      expect(result.baseTokens).toBe(10);
      expect(result.qualityMultiplier).toBe(2.0);
      expect(result.networkBonus).toBe(0.5);
      expect(result.reputationMultiplier).toBe(1.5);
      expect(result.finalTokens).toBe(45);
    });

    test('maximum token scenario (tier 3, perfect quality, max network, legendary)', () => {
      const result = calculateTokens({
        tierLevel: 3,        // 250 base tokens
        qualityScore: 100,   // 2.0x quality
        networkBonus: 2.0,   // 3.0x network (1 + 2.0)
        reputationTier: 'legendary' // 1.5x reputation
      });

      // 250 * 2.0 * 3.0 * 1.5 = 2250
      expect(result.finalTokens).toBe(2250);
    });

    test('minimum token scenario (tier 1, poor quality, no network, novice)', () => {
      const result = calculateTokens({
        tierLevel: 1,        // 10 base tokens
        qualityScore: 0,     // 0.5x quality
        networkBonus: 0,     // 1.0x network
        reputationTier: 'novice' // 0.9x reputation
      });

      // 10 * 0.5 * 1.0 * 0.9 = 4.5 → 4.5
      expect(result.finalTokens).toBe(4.5);
    });

    test('includes breakdown steps', () => {
      const result = calculateTokens({
        tierLevel: 1,
        qualityScore: 80,    // 1.8x
        networkBonus: 0.2,   // 1.2x
        reputationTier: 'expert' // 1.3x
      });

      // Breakdown: 10 * 1.8 = 18 → 18 * 1.2 = 21.6 → 21.6 * 1.3 = 28.08
      expect(result.breakdown.afterQuality).toBe(18);
      expect(result.breakdown.afterNetwork).toBeCloseTo(21.6, 1);
      expect(result.breakdown.afterReputation).toBeCloseTo(28.08, 1);
    });
  });

  describe('Network Bonus Calculation', () => {
    test('returns minimum bonus for 0 influence', () => {
      expect(calculateNetworkBonus(0)).toBe(0);
    });

    test('returns maximum bonus for 100 influence', () => {
      expect(calculateNetworkBonus(100)).toBe(2.0);
    });

    test('returns proportional bonus for middle values', () => {
      expect(calculateNetworkBonus(50)).toBe(1.0);
    });

    test('clamps values above 100', () => {
      expect(calculateNetworkBonus(150)).toBe(2.0);
    });

    test('clamps values below 0', () => {
      expect(calculateNetworkBonus(-10)).toBe(0);
    });
  });

  describe('Reputation Score Calculation', () => {
    test('returns 0 for no contributions', () => {
      expect(calculateReputationScore(0, 0)).toBe(0);
    });

    test('calculates average from quality-weighted score', () => {
      // 5 contributions, total quality-weighted 250 → avg 50
      expect(calculateReputationScore(5, 250)).toBe(50);
    });

    test('applies consistency bonus up to 10', () => {
      // Base 50 + 5 consistency = 55
      expect(calculateReputationScore(5, 250, 5)).toBe(55);
      // Base 50 + max 10 consistency = 60
      expect(calculateReputationScore(5, 250, 15)).toBe(60);
    });

    test('clamps to 0-100 range', () => {
      expect(calculateReputationScore(1, 110, 0)).toBe(100); // Capped at 100
      expect(calculateReputationScore(1, -10, 0)).toBe(0);   // Floor at 0
    });
  });

  describe('Update Reputation from Attribution', () => {
    test('updates reputation after attribution', () => {
      const current: ReputationScore = createEmptyReputationScore('grove-1');

      const updated = updateReputationFromAttribution(current, 80, 0.75);

      expect(updated.totalContributions).toBe(1);
      expect(updated.qualityWeightedScore).toBe(60); // 80 * 0.75
      expect(updated.reputationScore).toBe(60);
      expect(updated.currentTier).toBe('competent');
      expect(updated.tierMultiplier).toBe(1.1);
    });

    test('accumulates contributions correctly', () => {
      let reputation: ReputationScore = createEmptyReputationScore('grove-1');

      // First contribution: quality 80
      reputation = updateReputationFromAttribution(reputation, 80, 0.75);
      expect(reputation.totalContributions).toBe(1);

      // Second contribution: quality 60
      reputation = updateReputationFromAttribution(reputation, 60, 0.75);
      expect(reputation.totalContributions).toBe(2);
      expect(reputation.qualityWeightedScore).toBe(105); // 60 + 45
      expect(reputation.reputationScore).toBe(52.5); // 105 / 2
    });

    test('updates tier when threshold crossed', () => {
      const current: ReputationScore = {
        ...createEmptyReputationScore('grove-1'),
        reputationScore: 68,
        currentTier: 'competent',
        tierMultiplier: 1.1,
        totalContributions: 10,
        qualityWeightedScore: 680
      };

      // Add high-quality contribution to push over 70
      const updated = updateReputationFromAttribution(current, 90, 1.0);

      expect(updated.currentTier).toBe('expert');
      expect(updated.tierMultiplier).toBe(1.3);
      expect(updated.tierAchievedAt).toBeDefined();
    });
  });

  describe('Update Token Balance', () => {
    test('adds tokens to balance', () => {
      const balance = createEmptyTokenBalance('grove-1');

      const updated = updateTokenBalance(balance, 100);

      expect(updated.currentBalance).toBe(100);
      expect(updated.lifetimeEarned).toBe(100);
      expect(updated.totalAttributions).toBe(1);
      expect(updated.lastActivityAt).toBeDefined();
    });

    test('accumulates tokens correctly', () => {
      let balance = createEmptyTokenBalance('grove-1');

      balance = updateTokenBalance(balance, 100);
      balance = updateTokenBalance(balance, 50);

      expect(balance.currentBalance).toBe(150);
      expect(balance.lifetimeEarned).toBe(150);
      expect(balance.totalAttributions).toBe(2);
    });
  });

  describe('Create Attribution Event', () => {
    test('creates event with calculated tokens', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        tierLevel: 1,
        qualityScore: 80
      });

      expect(event.sourceGroveId).toBe('grove-1');
      expect(event.targetGroveId).toBe('grove-2');
      expect(event.tierLevel).toBe(1);
      expect(event.baseTokens).toBe(10);
      expect(event.qualityMultiplier).toBe(1.8);
      expect(event.networkBonus).toBe(0.2); // Default
      expect(event.reputationMultiplier).toBe(1.0); // No reputation provided
      expect(event.finalTokens).toBeGreaterThan(0);
    });

    test('uses provided network influence', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        tierLevel: 1,
        qualityScore: 50,
        networkInfluence: {
          id: 'inf-1',
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-2',
          influenceScore: 75,
          interactionCount: 10,
          totalTokensExchanged: 500,
          networkBonus: 1.5,
          isBidirectional: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });

      expect(event.networkBonus).toBe(1.5);
    });

    test('uses provided reputation', () => {
      const reputation = createEmptyReputationScore('grove-1');
      reputation.currentTier = 'expert';
      reputation.tierMultiplier = 1.3;

      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        tierLevel: 1,
        qualityScore: 50,
        sourceReputation: reputation
      });

      expect(event.reputationMultiplier).toBe(1.3);
    });
  });

  describe('Attribution Chains', () => {
    test('creates empty chain', () => {
      const chain = createAttributionChain('content-123');

      expect(chain.rootContentId).toBe('content-123');
      expect(chain.chainDepth).toBe(0);
      expect(chain.chainEvents).toHaveLength(0);
      expect(chain.totalTokens).toBe(0);
    });

    test('creates chain with initial event', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        tierLevel: 1,
        qualityScore: 50
      });

      const chain = createAttributionChain('content-123', event);

      expect(chain.chainDepth).toBe(1);
      expect(chain.chainEvents).toHaveLength(1);
      expect(chain.totalTokens).toBe(event.finalTokens);
    });

    test('adds events to chain', () => {
      let chain = createAttributionChain('content-123');

      const event1 = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        tierLevel: 1,
        qualityScore: 50
      });

      const event2 = createAttributionEvent({
        sourceGroveId: 'grove-2',
        targetGroveId: 'grove-3',
        tierLevel: 1,
        qualityScore: 60
      });

      chain = addEventToChain(chain, event1);
      chain = addEventToChain(chain, event2);

      expect(chain.chainDepth).toBe(2);
      expect(chain.chainEvents).toHaveLength(2);
      expect(chain.totalTokens).toBe(event1.finalTokens + event2.finalTokens);
      expect(chain.participantCount).toBe(3); // grove-1, grove-2, grove-3
    });
  });

  describe('Attribution Summary', () => {
    test('calculates summary for empty events', () => {
      const summary = calculateAttributionSummary([]);

      expect(summary.totalEvents).toBe(0);
      expect(summary.totalTokensDistributed).toBe(0);
      expect(summary.averageQuality).toBe(0);
      expect(summary.topContributors).toHaveLength(0);
    });

    test('calculates tier breakdown', () => {
      const events: AttributionEvent[] = [
        createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-2',
          tierLevel: 1,
          qualityScore: 50
        }),
        createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-3',
          tierLevel: 2,
          qualityScore: 50
        }),
        createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-4',
          tierLevel: 3,
          qualityScore: 50
        })
      ];

      const summary = calculateAttributionSummary(events);

      expect(summary.totalEvents).toBe(3);
      expect(summary.tierBreakdown[1].count).toBe(1);
      expect(summary.tierBreakdown[2].count).toBe(1);
      expect(summary.tierBreakdown[3].count).toBe(1);
    });

    test('identifies top contributors', () => {
      const events: AttributionEvent[] = [
        createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-2',
          tierLevel: 3,
          qualityScore: 90
        }),
        createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-3',
          tierLevel: 2,
          qualityScore: 80
        }),
        createAttributionEvent({
          sourceGroveId: 'grove-2',
          targetGroveId: 'grove-4',
          tierLevel: 1,
          qualityScore: 50
        })
      ];

      const summary = calculateAttributionSummary(events);

      expect(summary.topContributors[0].groveId).toBe('grove-1');
      expect(summary.topContributors[1].groveId).toBe('grove-2');
    });
  });

  describe('Base Token Constants', () => {
    test('tier 1 (Sprout) has 10 base tokens', () => {
      expect(BASE_TOKENS[1]).toBe(10);
    });

    test('tier 2 (Sapling) has 50 base tokens', () => {
      expect(BASE_TOKENS[2]).toBe(50);
    });

    test('tier 3 (Tree) has 250 base tokens', () => {
      expect(BASE_TOKENS[3]).toBe(250);
    });
  });

  describe('Reputation Tier Configs', () => {
    test('all tiers have required properties', () => {
      const tiers = ['novice', 'developing', 'competent', 'expert', 'legendary'] as const;

      for (const tier of tiers) {
        const config = REPUTATION_TIER_CONFIGS[tier];
        expect(config.tier).toBe(tier);
        expect(config.minScore).toBeDefined();
        expect(config.maxScore).toBeDefined();
        expect(config.multiplier).toBeDefined();
        expect(config.label).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.badgeIcon).toBeDefined();
      }
    });

    test('tier score ranges are contiguous', () => {
      expect(REPUTATION_TIER_CONFIGS.novice.maxScore).toBe(29);
      expect(REPUTATION_TIER_CONFIGS.developing.minScore).toBe(30);
      expect(REPUTATION_TIER_CONFIGS.developing.maxScore).toBe(49);
      expect(REPUTATION_TIER_CONFIGS.competent.minScore).toBe(50);
      expect(REPUTATION_TIER_CONFIGS.competent.maxScore).toBe(69);
      expect(REPUTATION_TIER_CONFIGS.expert.minScore).toBe(70);
      expect(REPUTATION_TIER_CONFIGS.expert.maxScore).toBe(89);
      expect(REPUTATION_TIER_CONFIGS.legendary.minScore).toBe(90);
    });
  });
});
