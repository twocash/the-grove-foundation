import { describe, it, expect } from 'vitest';
import {
  mergeHighlightPrompts,
  getOverlappingTriggers,
  findConflictingPrompts,
} from '@core/extraction/triggerMerge';
import type { PromptObject } from '@core/context-fields/types';

// Helper to create a minimal prompt for testing
function createTestPrompt(
  id: string,
  triggers: string[],
  confidence?: number
): PromptObject {
  return {
    id,
    objectType: 'prompt',
    created: Date.now(),
    modified: Date.now(),
    author: 'system',
    label: `Test Prompt ${id}`,
    executionPrompt: 'Test',
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
    source: 'generated',
    highlightTriggers: triggers.map((t) => ({ text: t, matchMode: 'exact' as const })),
    provenance: {
      type: 'extracted',
      reviewStatus: 'pending',
      extractionConfidence: confidence ?? 0.8,
    },
  };
}

describe('getOverlappingTriggers', () => {
  it('returns overlapping triggers', () => {
    const a = createTestPrompt('a', ['distributed ownership', 'local inference']);
    const b = createTestPrompt('b', ['distributed ownership', 'hybrid architecture']);

    const overlaps = getOverlappingTriggers(a, b);
    expect(overlaps).toEqual(['distributed ownership']);
  });

  it('returns empty array when no overlap', () => {
    const a = createTestPrompt('a', ['local inference']);
    const b = createTestPrompt('b', ['hybrid architecture']);

    const overlaps = getOverlappingTriggers(a, b);
    expect(overlaps).toEqual([]);
  });

  it('is case insensitive', () => {
    const a = createTestPrompt('a', ['Distributed Ownership']);
    const b = createTestPrompt('b', ['distributed ownership']);

    const overlaps = getOverlappingTriggers(a, b);
    expect(overlaps).toEqual(['distributed ownership']);
  });
});

describe('mergeHighlightPrompts', () => {
  it('adds non-overlapping prompts', () => {
    const existing = [createTestPrompt('a', ['distributed ownership'])];
    const newPrompts = [createTestPrompt('b', ['hybrid architecture'])];

    const merged = mergeHighlightPrompts(newPrompts, existing);
    expect(merged).toHaveLength(2);
  });

  it('favor-newer replaces existing on overlap', () => {
    const existing = [createTestPrompt('old', ['distributed ownership'], 0.7)];
    const newPrompts = [createTestPrompt('new', ['distributed ownership'], 0.9)];

    const merged = mergeHighlightPrompts(newPrompts, existing, 'favor-newer');
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('new');
  });

  it('favor-higher-confidence keeps higher confidence', () => {
    const existing = [createTestPrompt('old', ['distributed ownership'], 0.9)];
    const newPrompts = [createTestPrompt('new', ['distributed ownership'], 0.7)];

    const merged = mergeHighlightPrompts(newPrompts, existing, 'favor-higher-confidence');
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('old');
  });

  it('favor-higher-confidence replaces when new is higher', () => {
    const existing = [createTestPrompt('old', ['distributed ownership'], 0.6)];
    const newPrompts = [createTestPrompt('new', ['distributed ownership'], 0.9)];

    const merged = mergeHighlightPrompts(newPrompts, existing, 'favor-higher-confidence');
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('new');
  });

  it('keep-all keeps duplicates', () => {
    const existing = [createTestPrompt('old', ['distributed ownership'])];
    const newPrompts = [createTestPrompt('new', ['distributed ownership'])];

    const merged = mergeHighlightPrompts(newPrompts, existing, 'keep-all');
    expect(merged).toHaveLength(2);
  });
});

describe('findConflictingPrompts', () => {
  it('finds conflicts', () => {
    const prompts = [
      createTestPrompt('a', ['distributed ownership', 'local inference']),
      createTestPrompt('b', ['distributed ownership', 'hybrid architecture']),
      createTestPrompt('c', ['credit economy']),
    ];

    const conflicts = findConflictingPrompts(prompts);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].promptA.id).toBe('a');
    expect(conflicts[0].promptB.id).toBe('b');
    expect(conflicts[0].overlappingTriggers).toEqual(['distributed ownership']);
  });

  it('returns empty array when no conflicts', () => {
    const prompts = [
      createTestPrompt('a', ['distributed ownership']),
      createTestPrompt('b', ['hybrid architecture']),
    ];

    const conflicts = findConflictingPrompts(prompts);
    expect(conflicts).toEqual([]);
  });
});
