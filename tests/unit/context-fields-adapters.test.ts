// tests/unit/context-fields-adapters.test.ts
// Unit tests for Context Fields adapters (PromptObject → JourneyFork)
// Sprint: kinetic-suggested-prompts-v1

import { describe, it, expect } from 'vitest';
import {
  inferForkType,
  promptToFork,
  promptsToForks,
  diversifyForks,
  type PromptObject,
} from '../../src/core/context-fields';
import type { JourneyFork } from '../../src/core/schema/stream';

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

// =============================================================================
// inferForkType Tests
// =============================================================================

describe('inferForkType', () => {
  it('returns deep_dive for default prompts with no special targeting', () => {
    const prompt = createPrompt({});
    expect(inferForkType(prompt)).toBe('deep_dive');
  });

  it('returns challenge for high entropy window prompts', () => {
    const prompt = createPrompt({
      targeting: { entropyWindow: { min: 0.7, max: 1.0 } },
    });
    expect(inferForkType(prompt)).toBe('challenge');
  });

  it('returns challenge for urgent variant prompts', () => {
    const prompt = createPrompt({ variant: 'urgent' });
    expect(inferForkType(prompt)).toBe('challenge');
  });

  it('returns pivot for prompts with topic affinities', () => {
    const prompt = createPrompt({
      topicAffinities: [{ topicId: 'ratchet-effect', weight: 0.9 }],
    });
    expect(inferForkType(prompt)).toBe('pivot');
  });

  it('returns apply for synthesis-tagged prompts', () => {
    const prompt = createPrompt({ tags: ['synthesis', 'other'] });
    expect(inferForkType(prompt)).toBe('apply');
  });

  it('returns apply for reflection-tagged prompts', () => {
    const prompt = createPrompt({ tags: ['reflection'] });
    expect(inferForkType(prompt)).toBe('apply');
  });

  it('returns apply for action-tagged prompts', () => {
    const prompt = createPrompt({ tags: ['action'] });
    expect(inferForkType(prompt)).toBe('apply');
  });

  it('returns apply for contribution-tagged prompts', () => {
    const prompt = createPrompt({ tags: ['contribution'] });
    expect(inferForkType(prompt)).toBe('apply');
  });

  it('returns apply for apply-tagged prompts', () => {
    const prompt = createPrompt({ tags: ['apply'] });
    expect(inferForkType(prompt)).toBe('apply');
  });

  it('prioritizes challenge over pivot (entropy takes precedence)', () => {
    const prompt = createPrompt({
      targeting: { entropyWindow: { min: 0.7 } },
      topicAffinities: [{ topicId: 'test', weight: 0.5 }],
    });
    expect(inferForkType(prompt)).toBe('challenge');
  });

  it('prioritizes urgent variant over other signals', () => {
    const prompt = createPrompt({
      variant: 'urgent',
      topicAffinities: [{ topicId: 'test', weight: 0.5 }],
      tags: ['synthesis'],
    });
    expect(inferForkType(prompt)).toBe('challenge');
  });
});

// =============================================================================
// promptToFork Tests
// =============================================================================

describe('promptToFork', () => {
  it('converts prompt id to fork id', () => {
    const prompt = createPrompt({ id: 'my-prompt-id' });
    const fork = promptToFork(prompt);
    expect(fork.id).toBe('my-prompt-id');
  });

  it('infers type from prompt targeting', () => {
    const prompt = createPrompt({ variant: 'urgent' });
    const fork = promptToFork(prompt);
    expect(fork.type).toBe('challenge');
  });

  it('uses prompt label for fork label', () => {
    const prompt = createPrompt({ label: 'Explore the Ratchet Effect' });
    const fork = promptToFork(prompt);
    expect(fork.label).toBe('Explore the Ratchet Effect');
  });

  it('uses executionPrompt for queryPayload', () => {
    const prompt = createPrompt({
      executionPrompt: 'Tell me about the ratchet effect in detail',
    });
    const fork = promptToFork(prompt);
    expect(fork.queryPayload).toBe('Tell me about the ratchet effect in detail');
  });

  it('includes systemContext if present', () => {
    const prompt = createPrompt({
      systemContext: 'Focus on economic implications',
    });
    const fork = promptToFork(prompt);
    expect(fork.context).toBe('Focus on economic implications');
  });

  it('returns undefined context if no systemContext', () => {
    const prompt = createPrompt({});
    const fork = promptToFork(prompt);
    expect(fork.context).toBeUndefined();
  });
});

// =============================================================================
// promptsToForks Tests
// =============================================================================

describe('promptsToForks', () => {
  it('converts empty array to empty array', () => {
    const forks = promptsToForks([]);
    expect(forks).toEqual([]);
  });

  it('converts single prompt to single fork', () => {
    const prompts = [createPrompt({ id: 'p1' })];
    const forks = promptsToForks(prompts);
    expect(forks).toHaveLength(1);
    expect(forks[0].id).toBe('p1');
  });

  it('converts multiple prompts to forks', () => {
    const prompts = [
      createPrompt({ id: 'p1', label: 'First' }),
      createPrompt({ id: 'p2', label: 'Second' }),
      createPrompt({ id: 'p3', label: 'Third' }),
    ];
    const forks = promptsToForks(prompts);
    expect(forks).toHaveLength(3);
    expect(forks[0].label).toBe('First');
    expect(forks[1].label).toBe('Second');
    expect(forks[2].label).toBe('Third');
  });

  it('preserves order of prompts', () => {
    const prompts = [
      createPrompt({ id: 'a' }),
      createPrompt({ id: 'b' }),
      createPrompt({ id: 'c' }),
    ];
    const forks = promptsToForks(prompts);
    expect(forks.map((f) => f.id)).toEqual(['a', 'b', 'c']);
  });
});

// =============================================================================
// diversifyForks Tests
// =============================================================================

describe('diversifyForks', () => {
  function createFork(type: 'deep_dive' | 'pivot' | 'apply' | 'challenge'): JourneyFork {
    return {
      id: `fork-${type}`,
      type,
      label: `${type} fork`,
      queryPayload: 'test',
    };
  }

  it('returns empty array for empty input', () => {
    expect(diversifyForks([])).toEqual([]);
  });

  it('returns single fork unchanged', () => {
    const forks = [createFork('deep_dive')];
    expect(diversifyForks(forks)).toEqual(forks);
  });

  it('returns diverse forks unchanged', () => {
    const forks = [
      createFork('deep_dive'),
      createFork('pivot'),
      createFork('apply'),
    ];
    const result = diversifyForks(forks);
    expect(result).toEqual(forks);
  });

  it('returns homogeneous forks unchanged (caller responsibility)', () => {
    const forks = [
      createFork('deep_dive'),
      createFork('deep_dive'),
      createFork('deep_dive'),
    ];
    const result = diversifyForks(forks);
    expect(result).toEqual(forks);
  });
});
