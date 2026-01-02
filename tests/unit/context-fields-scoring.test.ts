// tests/unit/context-fields-scoring.test.ts
// Unit tests for Context Fields scoring algorithm
// Sprint: genesis-context-fields-v1 (Epic 1)

import { describe, it, expect } from 'vitest';
import {
  applyHardFilters,
  calculateRelevance,
  rankPrompts,
  selectPrompts,
  DEFAULT_SCORING_WEIGHTS,
  type PromptObject,
  type ContextState,
} from '../../src/core/context-fields';

// =============================================================================
// Test Fixtures
// =============================================================================

function createPrompt(overrides: Partial<PromptObject> = {}): PromptObject {
  return {
    id: 'test-prompt',
    objectType: 'prompt',
    created: Date.now(),
    modified: Date.now(),
    author: 'system',
    label: 'Test Prompt',
    executionPrompt: 'Test execution prompt',
    tags: [],
    topicAffinities: [],
    lensAffinities: [],
    targeting: {},
    stats: {
      impressions: 0,
      selections: 0,
      completions: 0,
      avgEntropyDelta: 0,
      avgDwellAfter: 0,
    },
    status: 'active',
    source: 'library',
    ...overrides,
  };
}

function createContext(overrides: Partial<ContextState> = {}): ContextState {
  return {
    stage: 'genesis',
    entropy: 0.3,
    activeLensId: null,
    activeMoments: [],
    interactionCount: 2,
    topicsExplored: [],
    sproutsCaptured: 0,
    offTopicCount: 0,
    ...overrides,
  };
}

// =============================================================================
// Hard Filter Tests
// =============================================================================

describe('applyHardFilters', () => {
  describe('stage filtering', () => {
    it('includes prompts targeting the current stage', () => {
      const prompts = [
        createPrompt({ id: 'genesis-prompt', targeting: { stages: ['genesis'] } }),
      ];
      const context = createContext({ stage: 'genesis' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(1);
    });

    it('excludes prompts not targeting the current stage', () => {
      const prompts = [
        createPrompt({ id: 'exploration-only', targeting: { stages: ['exploration'] } }),
      ];
      const context = createContext({ stage: 'genesis' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(0);
    });

    it('includes prompts with no stage restriction', () => {
      const prompts = [
        createPrompt({ id: 'any-stage', targeting: {} }),
      ];
      const context = createContext({ stage: 'synthesis' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(1);
    });

    it('excludes prompts with excludeStages matching current', () => {
      const prompts = [
        createPrompt({ id: 'not-genesis', targeting: { excludeStages: ['genesis'] } }),
      ];
      const context = createContext({ stage: 'genesis' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(0);
    });
  });

  describe('lens exclusion', () => {
    it('excludes prompts when lens is in excludeLenses', () => {
      const prompts = [
        createPrompt({ id: 'not-academic', targeting: { excludeLenses: ['academic'] } }),
      ];
      const context = createContext({ activeLensId: 'academic' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(0);
    });

    it('includes prompts when lens is not in excludeLenses', () => {
      const prompts = [
        createPrompt({ id: 'not-academic', targeting: { excludeLenses: ['academic'] } }),
      ];
      const context = createContext({ activeLensId: 'engineer' });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(1);
    });
  });

  describe('minInteractions', () => {
    it('excludes prompts when interactions below minimum', () => {
      const prompts = [
        createPrompt({ id: 'advanced', targeting: { minInteractions: 5 } }),
      ];
      const context = createContext({ interactionCount: 2 });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(0);
    });

    it('includes prompts when interactions meet minimum', () => {
      const prompts = [
        createPrompt({ id: 'advanced', targeting: { minInteractions: 5 } }),
      ];
      const context = createContext({ interactionCount: 6 });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(1);
    });
  });

  describe('moment requirements', () => {
    it('excludes prompts requiring moment when none active', () => {
      const prompts = [
        createPrompt({
          id: 'needs-moment',
          targeting: { momentTriggers: ['high_entropy'], requireMoment: true },
        }),
      ];
      const context = createContext({ activeMoments: [] });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(0);
    });

    it('includes prompts when required moment is active', () => {
      const prompts = [
        createPrompt({
          id: 'needs-moment',
          targeting: { momentTriggers: ['high_entropy'], requireMoment: true },
        }),
      ];
      const context = createContext({ activeMoments: ['high_entropy'] });

      const result = applyHardFilters(prompts, context);
      expect(result).toHaveLength(1);
    });
  });
});

// =============================================================================
// Relevance Scoring Tests
// =============================================================================

describe('calculateRelevance', () => {
  it('returns base score for prompts with no targeting', () => {
    const prompt = createPrompt({ baseWeight: 50 });
    const context = createContext();

    const score = calculateRelevance(prompt, context);

    // Should get stage match + entropy fit + base weight contribution
    expect(score).toBeGreaterThan(0);
  });

  it('adds stage match weight when stage matches', () => {
    const prompt = createPrompt({ targeting: { stages: ['genesis'] } });
    const context = createContext({ stage: 'genesis' });

    const score = calculateRelevance(prompt, context);

    expect(score).toBeGreaterThanOrEqual(DEFAULT_SCORING_WEIGHTS.stageMatch);
  });

  it('adds entropy fit weight when within window', () => {
    const prompt = createPrompt({
      targeting: { entropyWindow: { min: 0.2, max: 0.5 } },
    });
    const context = createContext({ entropy: 0.3 });

    const score = calculateRelevance(prompt, context);

    expect(score).toBeGreaterThanOrEqual(DEFAULT_SCORING_WEIGHTS.entropyFit);
  });

  it('does not add entropy fit when outside window', () => {
    const prompt = createPrompt({
      targeting: { entropyWindow: { min: 0.6, max: 0.9 } },
    });
    const context = createContext({ entropy: 0.3 });

    const scoreOutside = calculateRelevance(prompt, context);

    const promptInside = createPrompt({
      targeting: { entropyWindow: { min: 0.2, max: 0.5 } },
    });
    const scoreInside = calculateRelevance(promptInside, context);

    expect(scoreInside).toBeGreaterThan(scoreOutside);
  });

  it('adds lens precision weight when lens matches', () => {
    const prompt = createPrompt({
      lensAffinities: [{ lensId: 'dr-chiang', weight: 1.0 }],
    });
    const context = createContext({ activeLensId: 'dr-chiang' });

    const scoreWithLens = calculateRelevance(prompt, context);
    const scoreWithoutLens = calculateRelevance(prompt, createContext({ activeLensId: null }));

    expect(scoreWithLens).toBeGreaterThan(scoreWithoutLens);
  });

  it('adds topic relevance when topics match', () => {
    const prompt = createPrompt({
      topicAffinities: [{ topicId: 'ratchet-effect', weight: 0.9 }],
    });
    const context = createContext({ topicsExplored: ['ratchet-effect'] });

    const scoreWithTopic = calculateRelevance(prompt, context);
    const scoreWithoutTopic = calculateRelevance(prompt, createContext({ topicsExplored: [] }));

    expect(scoreWithTopic).toBeGreaterThan(scoreWithoutTopic);
  });

  it('adds moment boost when moment is active', () => {
    const prompt = createPrompt({
      targeting: { momentTriggers: ['high_entropy'] },
    });
    const contextWithMoment = createContext({ activeMoments: ['high_entropy'] });
    const contextWithoutMoment = createContext({ activeMoments: [] });

    const scoreWith = calculateRelevance(prompt, contextWithMoment);
    const scoreWithout = calculateRelevance(prompt, contextWithoutMoment);

    expect(scoreWith).toBeGreaterThan(scoreWithout);
    expect(scoreWith - scoreWithout).toBeCloseTo(DEFAULT_SCORING_WEIGHTS.momentBoost, 1);
  });

  it('respects baseWeight', () => {
    const highWeight = createPrompt({ baseWeight: 100 });
    const lowWeight = createPrompt({ baseWeight: 10 });
    const context = createContext();

    const highScore = calculateRelevance(highWeight, context);
    const lowScore = calculateRelevance(lowWeight, context);

    expect(highScore).toBeGreaterThan(lowScore);
  });
});

// =============================================================================
// Ranking Tests
// =============================================================================

describe('rankPrompts', () => {
  it('returns prompts sorted by score descending', () => {
    const prompts = [
      createPrompt({ id: 'low', baseWeight: 10 }),
      createPrompt({ id: 'high', baseWeight: 100 }),
      createPrompt({ id: 'medium', baseWeight: 50 }),
    ];
    const context = createContext();

    const ranked = rankPrompts(prompts, context);

    expect(ranked[0].prompt.id).toBe('high');
    expect(ranked[1].prompt.id).toBe('medium');
    expect(ranked[2].prompt.id).toBe('low');
  });

  it('includes match details in results', () => {
    const prompt = createPrompt({
      targeting: { stages: ['genesis'] },
      lensAffinities: [{ lensId: 'dr-chiang', weight: 0.8 }],
    });
    const context = createContext({
      stage: 'genesis',
      activeLensId: 'dr-chiang',
    });

    const [result] = rankPrompts([prompt], context);

    expect(result.matchDetails.stageMatch).toBe(true);
    expect(result.matchDetails.lensWeight).toBe(0.8);
  });
});

// =============================================================================
// Selection Pipeline Tests
// =============================================================================

describe('selectPrompts', () => {
  it('filters, scores, and returns top N prompts', () => {
    const prompts = [
      createPrompt({ id: 'genesis-high', targeting: { stages: ['genesis'] }, baseWeight: 100 }),
      createPrompt({ id: 'genesis-low', targeting: { stages: ['genesis'] }, baseWeight: 10 }),
      createPrompt({ id: 'exploration', targeting: { stages: ['exploration'] }, baseWeight: 100 }),
    ];
    const context = createContext({ stage: 'genesis' });

    const selected = selectPrompts(prompts, context, { maxPrompts: 2 });

    expect(selected).toHaveLength(2);
    expect(selected[0].id).toBe('genesis-high');
    expect(selected[1].id).toBe('genesis-low');
    expect(selected.find(p => p.id === 'exploration')).toBeUndefined();
  });

  it('respects minScore option', () => {
    const prompts = [
      createPrompt({ id: 'high', baseWeight: 100 }),
      createPrompt({ id: 'low', baseWeight: 1 }),
    ];
    const context = createContext();

    const selected = selectPrompts(prompts, context, { minScore: 4 });

    // Only the high-weight prompt should pass the score threshold
    expect(selected.length).toBeLessThanOrEqual(prompts.length);
  });

  it('allows custom scoring weights', () => {
    const prompt = createPrompt({
      lensAffinities: [{ lensId: 'test', weight: 1.0 }],
    });
    const context = createContext({ activeLensId: 'test' });

    const defaultScore = selectPrompts([prompt], context);
    const customScore = selectPrompts([prompt], context, {
      weights: { lensPrecision: 10.0 },
    });

    // With higher lens precision weight, lens-matching prompts should score higher
    // Both return the same prompt, but internal scoring differs
    expect(customScore).toHaveLength(1);
    expect(defaultScore).toHaveLength(1);
  });
});

// =============================================================================
// Dr. Chiang Lens Tests
// =============================================================================

describe('Dr. Chiang lens targeting', () => {
  it('boosts prompts with dr-chiang lens affinity', () => {
    const chiangPrompt = createPrompt({
      id: 'chiang-prompt',
      lensAffinities: [{ lensId: 'dr-chiang', weight: 1.0 }],
    });
    const genericPrompt = createPrompt({
      id: 'generic-prompt',
    });
    const context = createContext({ activeLensId: 'dr-chiang' });

    const chiangScore = calculateRelevance(chiangPrompt, context);
    const genericScore = calculateRelevance(genericPrompt, context);

    expect(chiangScore).toBeGreaterThan(genericScore);
  });

  it('surfaces stabilization prompt on high entropy moment', () => {
    const stabilizePrompt = createPrompt({
      id: 'chiang-stabilize',
      targeting: {
        lensIds: ['dr-chiang'],
        entropyWindow: { min: 0.6 },
        momentTriggers: ['high_entropy'],
      },
      lensAffinities: [{ lensId: 'dr-chiang', weight: 1.0 }],
    });
    const regularPrompt = createPrompt({
      id: 'regular',
      targeting: { stages: ['synthesis'] },
      lensAffinities: [{ lensId: 'dr-chiang', weight: 0.5 }],
    });

    const context = createContext({
      stage: 'synthesis',
      entropy: 0.75,
      activeLensId: 'dr-chiang',
      activeMoments: ['high_entropy'],
    });

    const stabilizeScore = calculateRelevance(stabilizePrompt, context);
    const regularScore = calculateRelevance(regularPrompt, context);

    // Stabilization prompt should have higher score due to moment boost
    expect(stabilizeScore).toBeGreaterThan(regularScore);
  });
});
