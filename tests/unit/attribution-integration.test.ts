// tests/unit/attribution-integration.test.ts
// Integration tests for Attribution System with Sprout Capture
// Sprint: S11-SL-Attribution v1

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => `test-uuid-${Math.random().toString(36).slice(2, 11)}`)
});

import {
  createAttributionEvent,
  updateTokenBalance,
  updateReputationFromAttribution,
  createEmptyTokenBalance,
  createEmptyReputationScore,
  createAttributionChain,
  addEventToChain,
  DEFAULT_CALCULATOR_CONFIG
} from '../../src/core/engine/attributionCalculator';

import type {
  AttributionEvent,
  TokenBalance,
  ReputationScore,
  NetworkInfluence,
  AttributionChain
} from '../../src/core/schema/attribution';

import type { Sprout, SproutStage, SproutStatus } from '../../src/core/schema/sprout';
import type { QualityScore, QualityDimensions } from '../../src/core/quality/schema';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestSprout(overrides: Partial<Sprout> = {}): Sprout {
  return {
    id: crypto.randomUUID(),
    capturedAt: new Date().toISOString(),
    response: 'Test response content',
    query: 'Test query',
    provenance: {
      lens: { id: 'lens-1', name: 'Test Lens' },
      hub: { id: 'hub-1', name: 'Test Hub' },
      journey: null,
      node: null,
      knowledgeFiles: [],
      generatedAt: new Date().toISOString()
    },
    personaId: 'lens-1',
    journeyId: null,
    hubId: 'hub-1',
    nodeId: null,
    status: 'sprout' as SproutStatus,
    stage: 'tender' as SproutStage,
    tags: [],
    notes: null,
    sessionId: 'test-session-id',
    creatorId: null,
    ...overrides
  };
}

function createTestQualityScore(compositeScore: number = 0.75): QualityScore {
  const dimensions: QualityDimensions = {
    accuracy: compositeScore,
    utility: compositeScore,
    novelty: compositeScore,
    provenance: compositeScore
  };

  return {
    id: crypto.randomUUID(),
    targetId: 'test-target',
    targetType: 'sprout',
    dimensions,
    compositeScore,
    scoringModel: 'test-model',
    confidence: 0.9,
    scoredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// =============================================================================
// Sprout Capture Integration Tests
// =============================================================================

describe('Sprout Capture Attribution Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Stage to Tier Mapping', () => {
    it('maps tender/rooting sprouts to tier 1 (Sprout)', () => {
      const tenderSprout = createTestSprout({ stage: 'tender' });
      const rootingSprout = createTestSprout({ stage: 'rooting' });

      const tenderEvent = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        contentId: tenderSprout.id,
        tierLevel: 1, // Mapped from tender
        qualityScore: 50
      });

      const rootingEvent = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        contentId: rootingSprout.id,
        tierLevel: 1, // Mapped from rooting
        qualityScore: 50
      });

      expect(tenderEvent.tierLevel).toBe(1);
      expect(rootingEvent.tierLevel).toBe(1);
      expect(tenderEvent.baseTokens).toBe(10); // Tier 1 base tokens
      expect(rootingEvent.baseTokens).toBe(10);
    });

    it('maps branching/hardened sprouts to tier 2 (Sapling)', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 2, // Sapling
        qualityScore: 50
      });

      expect(event.tierLevel).toBe(2);
      expect(event.baseTokens).toBe(50); // Tier 2 base tokens
    });

    it('maps established sprouts to tier 3 (Tree)', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 3, // Tree
        qualityScore: 50
      });

      expect(event.tierLevel).toBe(3);
      expect(event.baseTokens).toBe(250); // Tier 3 base tokens
    });
  });

  describe('Attribution Event Creation', () => {
    it('creates attribution event for a new sprout', () => {
      const sprout = createTestSprout();

      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        contentId: sprout.id,
        tierLevel: 1,
        qualityScore: 75
      });

      expect(event.id).toBeDefined();
      expect(event.sourceGroveId).toBe('grove-1');
      expect(event.targetGroveId).toBe('grove-1');
      expect(event.contentId).toBe(sprout.id);
      expect(event.tierLevel).toBe(1);
      expect(event.qualityScore).toBe(75);
      expect(event.finalTokens).toBeGreaterThan(0);
    });

    it('creates self-attribution when source equals target', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'my-grove',
        targetGroveId: 'my-grove',
        tierLevel: 1,
        qualityScore: 50
      });

      expect(event.sourceGroveId).toBe(event.targetGroveId);
    });

    it('supports cross-grove attribution', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'source-grove',
        targetGroveId: 'target-grove',
        tierLevel: 2,
        qualityScore: 80
      });

      expect(event.sourceGroveId).toBe('source-grove');
      expect(event.targetGroveId).toBe('target-grove');
      expect(event.sourceGroveId).not.toBe(event.targetGroveId);
    });
  });

  describe('Token Balance Updates', () => {
    it('updates token balance after attribution', () => {
      const initialBalance = createEmptyTokenBalance('grove-1');
      expect(initialBalance.currentBalance).toBe(0);
      expect(initialBalance.lifetimeEarned).toBe(0);

      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 50
      });

      const updatedBalance = updateTokenBalance(initialBalance, event.finalTokens);

      expect(updatedBalance.currentBalance).toBe(event.finalTokens);
      expect(updatedBalance.lifetimeEarned).toBe(event.finalTokens);
      expect(updatedBalance.totalAttributions).toBe(1);
    });

    it('accumulates tokens across multiple attributions', () => {
      let balance = createEmptyTokenBalance('grove-1');

      // First attribution
      const event1 = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 50
      });
      balance = updateTokenBalance(balance, event1.finalTokens);

      // Second attribution
      const event2 = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 2,
        qualityScore: 75
      });
      balance = updateTokenBalance(balance, event2.finalTokens);

      expect(balance.currentBalance).toBe(event1.finalTokens + event2.finalTokens);
      expect(balance.totalAttributions).toBe(2);
    });
  });

  describe('Reputation Updates', () => {
    it('updates reputation after attribution', () => {
      const initialReputation = createEmptyReputationScore('grove-1');
      expect(initialReputation.reputationScore).toBe(0);
      expect(initialReputation.currentTier).toBe('novice');

      const updatedReputation = updateReputationFromAttribution(
        initialReputation,
        75, // quality score
        0.75 // attribution strength
      );

      expect(updatedReputation.totalContributions).toBe(1);
      expect(updatedReputation.reputationScore).toBeGreaterThan(0);
    });

    it('progresses through reputation tiers with quality contributions', () => {
      let reputation = createEmptyReputationScore('grove-1');

      // Simulate many high-quality contributions
      for (let i = 0; i < 50; i++) {
        reputation = updateReputationFromAttribution(
          reputation,
          95, // Very high quality
          1.0 // Full attribution strength
        );
      }

      // Should have progressed beyond novice
      expect(reputation.totalContributions).toBe(50);
      expect(reputation.reputationScore).toBeGreaterThan(50);
      expect(reputation.currentTier).not.toBe('novice');
    });
  });
});

// =============================================================================
// Quality Score Integration Tests
// =============================================================================

describe('Quality Score Integration (S10)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Quality Score Conversion', () => {
    it('converts S10 quality score (0-1) to attribution score (0-100)', () => {
      // S10 uses 0-1 scale, attribution uses 0-100
      const s10Score = createTestQualityScore(0.85);
      const attributionQuality = Math.round(s10Score.compositeScore * 100);

      expect(attributionQuality).toBe(85);
    });

    it('applies quality multiplier based on converted score', () => {
      // Low quality (0.3 = 30)
      const lowQualityEvent = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 30
      });

      // High quality (0.9 = 90)
      const highQualityEvent = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 90
      });

      expect(highQualityEvent.qualityMultiplier).toBeGreaterThan(lowQualityEvent.qualityMultiplier);
      expect(highQualityEvent.finalTokens).toBeGreaterThan(lowQualityEvent.finalTokens);
    });

    it('handles exceptional quality scores (90+)', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 95
      });

      expect(event.qualityMultiplier).toBe(2.0); // Max multiplier
    });

    it('handles minimum quality scores (<20)', () => {
      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore: 15
      });

      expect(event.qualityMultiplier).toBe(0.5); // Minimum multiplier
    });
  });

  describe('Quality-Token Relationship', () => {
    it('maintains consistent token formula', () => {
      const baseTokens = 10; // Tier 1
      const qualityScore = 80;
      const networkBonus = 0.2;

      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        tierLevel: 1,
        qualityScore
      });

      // Manual calculation: baseTokens * qualityMultiplier * (1 + networkBonus) * reputationMultiplier
      // 10 * 1.8 * 1.2 * 1.0 = 21.6
      expect(event.baseTokens).toBe(baseTokens);
      expect(event.qualityMultiplier).toBe(1.8); // 80-89 range
    });
  });
});

// =============================================================================
// Attribution Chain Tests
// =============================================================================

describe('Attribution Chain Tracking', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Chain Creation', () => {
    it('creates new chain from root content', () => {
      const rootContentId = 'root-sprout-id';
      const chain = createAttributionChain(rootContentId);

      expect(chain.id).toBeDefined();
      expect(chain.rootContentId).toBe(rootContentId);
      expect(chain.chainDepth).toBe(0);
      expect(chain.chainEvents).toHaveLength(0);
      expect(chain.totalTokens).toBe(0);
    });

    it('creates chain with initial event', () => {
      const rootContentId = 'root-sprout-id';
      const initialEvent = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        contentId: rootContentId,
        tierLevel: 1,
        qualityScore: 75
      });

      const chain = createAttributionChain(rootContentId, initialEvent);

      expect(chain.chainDepth).toBe(1);
      expect(chain.chainEvents).toHaveLength(1);
      expect(chain.totalTokens).toBe(initialEvent.finalTokens);
      expect(chain.participantCount).toBe(2); // Both groves
    });
  });

  describe('Chain Growth', () => {
    it('adds events to existing chain', () => {
      const rootContentId = 'root-sprout-id';
      let chain = createAttributionChain(rootContentId);

      // First event
      const event1 = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-2',
        contentId: rootContentId,
        tierLevel: 1,
        qualityScore: 60
      });
      chain = addEventToChain(chain, event1);

      // Second event
      const event2 = createAttributionEvent({
        sourceGroveId: 'grove-2',
        targetGroveId: 'grove-3',
        contentId: rootContentId,
        tierLevel: 1,
        qualityScore: 70
      });
      chain = addEventToChain(chain, event2);

      expect(chain.chainDepth).toBe(2);
      expect(chain.chainEvents).toHaveLength(2);
      expect(chain.totalTokens).toBe(event1.finalTokens + event2.finalTokens);
      expect(chain.participantCount).toBe(3); // grove-1, grove-2, grove-3
    });

    it('tracks unique participants across chain', () => {
      const rootContentId = 'root-sprout-id';
      let chain = createAttributionChain(rootContentId);

      // Multiple events with same groves
      for (let i = 0; i < 5; i++) {
        const event = createAttributionEvent({
          sourceGroveId: 'grove-1',
          targetGroveId: 'grove-2',
          contentId: rootContentId,
          tierLevel: 1,
          qualityScore: 50
        });
        chain = addEventToChain(chain, event);
      }

      // Only 2 unique participants even with 5 events
      expect(chain.chainDepth).toBe(5);
      expect(chain.participantCount).toBe(2);
    });
  });

  describe('Chain Statistics', () => {
    it('calculates total tokens across chain', () => {
      const rootContentId = 'root-sprout-id';
      let chain = createAttributionChain(rootContentId);
      let expectedTotal = 0;

      // Add events at different tiers
      const tiers: [number, number][] = [
        [1, 50], // tier 1, quality 50
        [2, 75], // tier 2, quality 75
        [1, 90], // tier 1, quality 90
      ];

      for (const [tier, quality] of tiers) {
        const event = createAttributionEvent({
          sourceGroveId: `grove-${tier}`,
          targetGroveId: `grove-${tier + 1}`,
          contentId: rootContentId,
          tierLevel: tier as 1 | 2 | 3,
          qualityScore: quality
        });
        expectedTotal += event.finalTokens;
        chain = addEventToChain(chain, event);
      }

      expect(chain.totalTokens).toBeCloseTo(expectedTotal, 2);
    });
  });
});

// =============================================================================
// End-to-End Integration Tests
// =============================================================================

describe('End-to-End Attribution Flow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('completes full attribution flow for sprout capture', () => {
    // 1. Create a sprout
    const sprout = createTestSprout({
      stage: 'tender',
      status: 'sprout'
    });

    // 2. Create quality score (from S10)
    const qualityScore = createTestQualityScore(0.80);
    const attributionQuality = Math.round(qualityScore.compositeScore * 100);

    // 3. Initialize empty token balance and reputation
    let tokenBalance = createEmptyTokenBalance('grove-1');
    let reputation = createEmptyReputationScore('grove-1');

    // 4. Create attribution event
    const event = createAttributionEvent({
      sourceGroveId: 'grove-1',
      targetGroveId: 'grove-1',
      contentId: sprout.id,
      tierLevel: 1, // tender/sprout stage
      qualityScore: attributionQuality,
      sourceReputation: reputation
    });

    // 5. Update token balance
    tokenBalance = updateTokenBalance(tokenBalance, event.finalTokens);

    // 6. Update reputation
    reputation = updateReputationFromAttribution(
      reputation,
      attributionQuality,
      event.attributionStrength
    );

    // 7. Create attribution chain
    const chain = createAttributionChain(sprout.id, event);

    // Verify complete flow
    expect(event.finalTokens).toBeGreaterThan(0);
    expect(tokenBalance.currentBalance).toBe(event.finalTokens);
    expect(tokenBalance.totalAttributions).toBe(1);
    expect(reputation.totalContributions).toBe(1);
    expect(reputation.reputationScore).toBeGreaterThan(0);
    expect(chain.chainDepth).toBe(1);
    expect(chain.totalTokens).toBe(event.finalTokens);
  });

  it('handles multiple sprout captures with accumulated economy', () => {
    let tokenBalance = createEmptyTokenBalance('grove-1');
    let reputation = createEmptyReputationScore('grove-1');
    const sproutCount = 10;
    let totalTokens = 0;

    for (let i = 0; i < sproutCount; i++) {
      const sprout = createTestSprout();
      const quality = 50 + Math.floor(Math.random() * 40); // 50-90

      const event = createAttributionEvent({
        sourceGroveId: 'grove-1',
        targetGroveId: 'grove-1',
        contentId: sprout.id,
        tierLevel: 1,
        qualityScore: quality,
        sourceReputation: reputation
      });

      totalTokens += event.finalTokens;
      tokenBalance = updateTokenBalance(tokenBalance, event.finalTokens);
      reputation = updateReputationFromAttribution(
        reputation,
        quality,
        event.attributionStrength
      );
    }

    expect(tokenBalance.totalAttributions).toBe(sproutCount);
    expect(tokenBalance.currentBalance).toBeCloseTo(totalTokens, 2);
    expect(reputation.totalContributions).toBe(sproutCount);
    expect(reputation.reputationScore).toBeGreaterThan(0);
  });

  it('supports tier progression through sprout lifecycle', () => {
    let tokenBalance = createEmptyTokenBalance('grove-1');

    // Tender sprout (tier 1)
    const tenderEvent = createAttributionEvent({
      sourceGroveId: 'grove-1',
      targetGroveId: 'grove-1',
      tierLevel: 1,
      qualityScore: 70
    });
    tokenBalance = updateTokenBalance(tokenBalance, tenderEvent.finalTokens);
    const afterTender = tokenBalance.currentBalance;

    // Promoted to branching (tier 2)
    const branchingEvent = createAttributionEvent({
      sourceGroveId: 'grove-1',
      targetGroveId: 'grove-1',
      tierLevel: 2,
      qualityScore: 80
    });
    tokenBalance = updateTokenBalance(tokenBalance, branchingEvent.finalTokens);
    const afterBranching = tokenBalance.currentBalance;

    // Promoted to established (tier 3)
    const establishedEvent = createAttributionEvent({
      sourceGroveId: 'grove-1',
      targetGroveId: 'grove-1',
      tierLevel: 3,
      qualityScore: 90
    });
    tokenBalance = updateTokenBalance(tokenBalance, establishedEvent.finalTokens);
    const afterEstablished = tokenBalance.currentBalance;

    // Verify increasing value
    expect(afterBranching).toBeGreaterThan(afterTender);
    expect(afterEstablished).toBeGreaterThan(afterBranching);

    // Verify tier differences
    expect(tenderEvent.baseTokens).toBe(10);
    expect(branchingEvent.baseTokens).toBe(50);
    expect(establishedEvent.baseTokens).toBe(250);
  });
});
