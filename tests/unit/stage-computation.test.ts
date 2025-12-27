// tests/unit/stage-computation.test.ts
// Unit tests for stage computation
// Sprint: engagement-consolidation-v1

import { describe, it, expect } from 'vitest';
import { computeSessionStage } from '../../utils/stageComputation';
import { DEFAULT_ENGAGEMENT_STATE } from '../../src/core/config';

describe('computeSessionStage', () => {
  const baseState = { ...DEFAULT_ENGAGEMENT_STATE };

  it('returns ARRIVAL for new user', () => {
    expect(computeSessionStage(baseState)).toBe('ARRIVAL');
  });

  it('returns ORIENTED at 3 exchanges', () => {
    expect(computeSessionStage({ ...baseState, exchangeCount: 3 })).toBe('ORIENTED');
  });

  it('returns ORIENTED at 2 visits', () => {
    expect(computeSessionStage({ ...baseState, visitCount: 2 })).toBe('ORIENTED');
  });

  it('returns EXPLORING at 5 exchanges', () => {
    expect(computeSessionStage({ ...baseState, exchangeCount: 5 })).toBe('EXPLORING');
  });

  it('returns EXPLORING at 2 topics', () => {
    expect(computeSessionStage({
      ...baseState,
      topicsExplored: ['topic1', 'topic2']
    })).toBe('EXPLORING');
  });

  it('returns ENGAGED at 1 sprout', () => {
    expect(computeSessionStage({ ...baseState, sproutsCaptured: 1 })).toBe('ENGAGED');
  });

  it('returns ENGAGED at 3 visits + 15 exchanges', () => {
    expect(computeSessionStage({
      ...baseState,
      visitCount: 3,
      totalExchangeCount: 15
    })).toBe('ENGAGED');
  });

  it('respects custom thresholds', () => {
    const customThresholds = {
      oriented: { minExchanges: 10, minVisits: 5 },
      exploring: { minExchanges: 20, minTopics: 5 },
      engaged: { minSprouts: 5, minVisits: 10, minTotalExchanges: 50 },
    };

    // With custom thresholds, 3 exchanges should still be ARRIVAL
    expect(computeSessionStage({ ...baseState, exchangeCount: 3 }, customThresholds)).toBe('ARRIVAL');

    // 10 exchanges should be ORIENTED with custom thresholds
    expect(computeSessionStage({ ...baseState, exchangeCount: 10 }, customThresholds)).toBe('ORIENTED');
  });

  it('prioritizes higher stages over lower', () => {
    // User with 1 sprout should be ENGAGED even if other metrics are low
    expect(computeSessionStage({
      ...baseState,
      sproutsCaptured: 1,
      exchangeCount: 1,
      visitCount: 1
    })).toBe('ENGAGED');
  });

  it('handles OR conditions correctly', () => {
    // EXPLORING: 5+ exchanges OR 2+ topics
    // With 5 exchanges but 0 topics, should be EXPLORING
    expect(computeSessionStage({
      ...baseState,
      exchangeCount: 5,
      topicsExplored: []
    })).toBe('EXPLORING');

    // With 1 exchange but 2 topics, should be EXPLORING
    expect(computeSessionStage({
      ...baseState,
      exchangeCount: 1,
      topicsExplored: ['a', 'b']
    })).toBe('EXPLORING');
  });

  it('handles AND conditions for ENGAGED', () => {
    // ENGAGED: 1+ sprout OR (3+ visits AND 15+ total exchanges)
    // 3 visits but only 10 total exchanges - should NOT be ENGAGED from visits alone
    expect(computeSessionStage({
      ...baseState,
      visitCount: 3,
      totalExchangeCount: 10,
      sproutsCaptured: 0
    })).not.toBe('ENGAGED');

    // 3 visits AND 15 total exchanges - should be ENGAGED
    expect(computeSessionStage({
      ...baseState,
      visitCount: 3,
      totalExchangeCount: 15,
      sproutsCaptured: 0
    })).toBe('ENGAGED');
  });
});
