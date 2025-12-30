import { describe, it, expect } from 'vitest';
import { computeMetrics, type CumulativeMetricsV2 } from '../../src/core/schema/telemetry';

describe('computeMetrics', () => {
  const createMetrics = (overrides: Partial<CumulativeMetricsV2> = {}): CumulativeMetricsV2 => ({
    version: 2,
    fieldId: 'grove',
    journeyCompletions: [],
    topicExplorations: [],
    sproutCaptures: [],
    sessionCount: 1,
    lastSessionAt: Date.now(),
    ...overrides,
  });

  it('computes journeysCompleted from array length', () => {
    const metrics = createMetrics({
      journeyCompletions: [
        { fieldId: 'grove', timestamp: 1, journeyId: 'a' },
        { fieldId: 'grove', timestamp: 2, journeyId: 'b' },
      ],
    });
    expect(computeMetrics(metrics).journeysCompleted).toBe(2);
  });

  it('computes sproutsCaptured from array length', () => {
    const metrics = createMetrics({
      sproutCaptures: [
        { fieldId: 'grove', timestamp: 1, sproutId: 'x' },
        { fieldId: 'grove', timestamp: 2, sproutId: 'y' },
        { fieldId: 'grove', timestamp: 3, sproutId: 'z' },
      ],
    });
    expect(computeMetrics(metrics).sproutsCaptured).toBe(3);
  });

  it('deduplicates topicsExplored by topicId', () => {
    const metrics = createMetrics({
      topicExplorations: [
        { fieldId: 'grove', timestamp: 1, topicId: 'ratchet', hubId: 'hub1' },
        { fieldId: 'grove', timestamp: 2, topicId: 'ratchet', hubId: 'hub2' },
        { fieldId: 'grove', timestamp: 3, topicId: 'observer', hubId: 'hub1' },
      ],
    });
    expect(computeMetrics(metrics).topicsExplored).toEqual(['ratchet', 'observer']);
  });

  it('returns empty arrays for empty metrics', () => {
    const metrics = createMetrics();
    const computed = computeMetrics(metrics);
    expect(computed.journeysCompleted).toBe(0);
    expect(computed.sproutsCaptured).toBe(0);
    expect(computed.topicsExplored).toEqual([]);
  });

  it('preserves order of first occurrence for topics', () => {
    const metrics = createMetrics({
      topicExplorations: [
        { fieldId: 'grove', timestamp: 1, topicId: 'observer', hubId: 'hub1' },
        { fieldId: 'grove', timestamp: 2, topicId: 'ratchet', hubId: 'hub2' },
        { fieldId: 'grove', timestamp: 3, topicId: 'observer', hubId: 'hub3' },
        { fieldId: 'grove', timestamp: 4, topicId: 'governance', hubId: 'hub1' },
      ],
    });
    expect(computeMetrics(metrics).topicsExplored).toEqual(['observer', 'ratchet', 'governance']);
  });

  it('handles journey completions with optional fields', () => {
    const metrics = createMetrics({
      journeyCompletions: [
        { fieldId: 'grove', timestamp: 1, journeyId: 'a', durationMs: 5000 },
        { fieldId: 'grove', timestamp: 2, journeyId: 'b' },
        { fieldId: 'grove', timestamp: 3, journeyId: 'c', durationMs: 10000, waypointsVisited: 5 },
      ],
    });
    expect(computeMetrics(metrics).journeysCompleted).toBe(3);
  });

  it('handles sprout captures with optional context', () => {
    const metrics = createMetrics({
      sproutCaptures: [
        { fieldId: 'grove', timestamp: 1, sproutId: 'a', journeyId: 'j1', hubId: 'h1' },
        { fieldId: 'grove', timestamp: 2, sproutId: 'b', journeyId: 'j1' },
        { fieldId: 'grove', timestamp: 3, sproutId: 'c' },
      ],
    });
    expect(computeMetrics(metrics).sproutsCaptured).toBe(3);
  });
});
