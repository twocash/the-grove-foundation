// tests/e2e/s11-sl-attribution/_test-data.ts
// Test data seeding utilities for S11-SL-Attribution E2E tests

import type { Page } from '@playwright/test';

// Storage keys matching useAttributionCapture.ts
const STORAGE_KEYS = {
  TOKEN_BALANCES: 'grove-token-balances',
  REPUTATION_SCORES: 'grove-reputation-scores',
  ATTRIBUTION_EVENTS: 'grove-attribution-events',
  SESSION_ID: 'grove-session-id'
};

// Test grove ID (consistent across tests)
const TEST_GROVE_ID = 'test-grove-e2e-001';

export type ReputationTier = 'novice' | 'developing' | 'competent' | 'expert' | 'legendary';

export interface SeedDataOptions {
  tokens?: number;
  tier?: ReputationTier;
  reputationScore?: number;
  totalContributions?: number;
  badges?: string[];
}

// Tier multipliers matching REPUTATION_TIER_CONFIGS
const TIER_MULTIPLIERS: Record<ReputationTier, number> = {
  novice: 1.0,
  developing: 1.1,
  competent: 1.25,
  expert: 1.5,
  legendary: 2.0
};

/**
 * Seed attribution data into localStorage before test
 * Data is created inside page.evaluate to ensure browser context
 */
export async function seedAttributionData(page: Page, options: SeedDataOptions = {}): Promise<void> {
  const {
    tokens = 125.5,
    tier = 'developing',
    reputationScore = 45,
    totalContributions = 12,
    badges = ['first-contribution', 'seedling']
  } = options;

  const tierMultiplier = TIER_MULTIPLIERS[tier];

  // Inject into localStorage via page.evaluate - create objects inside browser context
  await page.evaluate(({ keys, groveId, tokens, tier, tierMultiplier, reputationScore, totalContributions, badges }) => {
    const now = new Date().toISOString();

    // Generate UUIDs in browser context
    const genId = () => crypto.randomUUID();

    // Token balance data
    const tokenBalances = {
      [groveId]: {
        id: genId(),
        groveId,
        currentBalance: tokens,
        lifetimeEarned: tokens + 50,
        lifetimeSpent: 50,
        lastUpdated: now,
        createdAt: now,
        updatedAt: now
      }
    };

    // Reputation score data
    const reputationScores = {
      [groveId]: {
        id: genId(),
        groveId,
        reputationScore,
        currentTier: tier,
        tierMultiplier,
        totalContributions,
        qualityWeightedScore: reputationScore * 0.8,
        badges,
        tierAchievedAt: now,
        createdAt: now,
        updatedAt: now
      }
    };

    // Sample attribution events
    const attributionEvents = [
      {
        id: genId(),
        sourceGroveId: groveId,
        targetGroveId: groveId,
        contentId: 'sprout-001',
        tierLevel: 2,
        baseTokens: 15,
        qualityMultiplier: 1.2,
        tierMultiplier,
        networkBonus: 0,
        finalTokens: 18,
        qualityScore: 75,
        attributionStrength: 0.8,
        timestamp: now
      },
      {
        id: genId(),
        sourceGroveId: groveId,
        targetGroveId: groveId,
        contentId: 'sprout-002',
        tierLevel: 1,
        baseTokens: 10,
        qualityMultiplier: 1.0,
        tierMultiplier,
        networkBonus: 0,
        finalTokens: 10,
        qualityScore: 50,
        attributionStrength: 0.5,
        timestamp: now
      }
    ];

    // Set localStorage
    localStorage.setItem(keys.SESSION_ID, groveId);
    localStorage.setItem(keys.TOKEN_BALANCES, JSON.stringify(tokenBalances));
    localStorage.setItem(keys.REPUTATION_SCORES, JSON.stringify(reputationScores));
    localStorage.setItem(keys.ATTRIBUTION_EVENTS, JSON.stringify(attributionEvents));
  }, {
    keys: STORAGE_KEYS,
    groveId: TEST_GROVE_ID,
    tokens,
    tier,
    tierMultiplier,
    reputationScore,
    totalContributions,
    badges
  });
}

/**
 * Clear all attribution data from localStorage
 */
export async function clearAttributionData(page: Page): Promise<void> {
  await page.evaluate((keys) => {
    Object.values(keys).forEach(key => localStorage.removeItem(key));
  }, STORAGE_KEYS);
}

// Preset configurations for different test scenarios
export const TEST_PRESETS = {
  // New user - minimal data
  novice: {
    tokens: 15,
    tier: 'novice' as ReputationTier,
    reputationScore: 5,
    totalContributions: 2,
    badges: ['first-contribution']
  },

  // Active user - moderate progress
  developing: {
    tokens: 125.5,
    tier: 'developing' as ReputationTier,
    reputationScore: 45,
    totalContributions: 12,
    badges: ['first-contribution', 'seedling', 'cultivator']
  },

  // Experienced user - high engagement
  expert: {
    tokens: 850,
    tier: 'expert' as ReputationTier,
    reputationScore: 180,
    totalContributions: 75,
    badges: ['first-contribution', 'seedling', 'cultivator', 'arborist', 'forest-keeper', 'decathlete']
  },

  // Top contributor - legendary status
  legendary: {
    tokens: 2500,
    tier: 'legendary' as ReputationTier,
    reputationScore: 350,
    totalContributions: 200,
    badges: ['first-contribution', 'seedling', 'cultivator', 'arborist', 'forest-keeper', 'grove-elder', 'decathlete', 'centurion']
  }
};
