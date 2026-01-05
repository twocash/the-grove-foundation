// tests/unit/navigation-pipeline/navigation-pipeline.test.tsx
// Integration tests for the navigation pipeline (4D prompts → forks)
// Sprint: feature-flag-cleanup-v1

import { describe, it, expect } from 'vitest';
import {
  inferForkType,
  promptToFork,
  promptsToForks,
} from '../../../src/core/context-fields';
import type { PromptObject } from '../../../src/core/context-fields/types';
import type { JourneyFork, JourneyForkType } from '../../../src/core/schema/stream';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockPrompt(overrides: Partial<PromptObject> = {}): PromptObject {
  return {
    id: `prompt-${Date.now()}`,
    objectType: 'prompt',
    created: Date.now(),
    modified: Date.now(),
    author: 'test',
    label: 'Test Prompt Label',
    executionPrompt: 'Execute this test prompt',
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
// Navigation Pipeline Tests
// =============================================================================

describe('Navigation Pipeline: promptsToForks', () => {
  it('converts PromptObject array to JourneyFork array with correct types', () => {
    const prompts: PromptObject[] = [
      createMockPrompt({ id: 'nav-1', label: 'Explore deeper' }),
      createMockPrompt({ id: 'nav-2', label: 'Switch topic', topicAffinities: [{ topicId: 'other', weight: 1 }] }),
      createMockPrompt({ id: 'nav-3', label: 'Stabilize', targeting: { entropyWindow: { min: 0.8 } } }),
    ];

    const forks = promptsToForks(prompts);

    expect(forks).toHaveLength(3);
    expect(forks[0].type).toBe('deep_dive');
    expect(forks[1].type).toBe('pivot');
    expect(forks[2].type).toBe('challenge');
  });

  it('maps executionPrompt to queryPayload for click handling', () => {
    const prompts = [
      createMockPrompt({
        id: 'exec-test',
        label: 'Display label',
        executionPrompt: 'This is the actual query to send',
      }),
    ];

    const forks = promptsToForks(prompts);

    expect(forks[0].label).toBe('Display label');
    expect(forks[0].queryPayload).toBe('This is the actual query to send');
  });

  it('preserves prompt IDs for event tracking', () => {
    const prompts = [
      createMockPrompt({ id: 'track-001' }),
      createMockPrompt({ id: 'track-002' }),
    ];

    const forks = promptsToForks(prompts);

    expect(forks[0].id).toBe('track-001');
    expect(forks[1].id).toBe('track-002');
  });

  it('handles prompts with systemContext for rich fork context', () => {
    const prompts = [
      createMockPrompt({
        id: 'ctx-test',
        systemContext: 'Focus on economic implications of the ratchet effect',
      }),
    ];

    const forks = promptsToForks(prompts);

    expect(forks[0].context).toBe('Focus on economic implications of the ratchet effect');
  });

  it('produces valid JourneyFork objects for NavigationBlock rendering', () => {
    const prompts = [
      createMockPrompt({
        id: 'valid-fork',
        label: 'Valid Navigation Option',
        executionPrompt: 'Query payload here',
        tags: ['synthesis'],
      }),
    ];

    const forks = promptsToForks(prompts);
    const fork = forks[0];

    // Verify all required JourneyFork properties
    expect(fork.id).toBeTruthy();
    expect(fork.label).toBeTruthy();
    expect(fork.type).toBeTruthy();
    expect(['deep_dive', 'pivot', 'apply', 'challenge']).toContain(fork.type);
    expect(fork.queryPayload).toBeTruthy();
  });
});
