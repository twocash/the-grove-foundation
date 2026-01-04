// tests/unit/events/migration.test.ts
// Sprint: bedrock-event-architecture-v1

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isCumulativeMetricsV2,
  isGroveEventLogV3,
  migrateFromCumulativeMetricsV2,
  verifyMigration,
  MIGRATED_SESSION_ID,
  LEGACY_METRICS_KEY,
} from '@core/events/migration';
import type { CumulativeMetricsV2 } from '@core/schema/telemetry';
import type { GroveEventLog } from '@core/events/types';

// ─────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────

const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC

function createV2Metrics(): CumulativeMetricsV2 {
  return {
    version: 2,
    fieldId: 'grove',
    journeyCompletions: [
      {
        fieldId: 'grove',
        timestamp: NOW - 86400000, // 1 day ago
        journeyId: 'ghost-journey',
        durationMs: 300000,
        waypointsVisited: 5,
      },
      {
        fieldId: 'grove',
        timestamp: NOW - 172800000, // 2 days ago
        journeyId: 'gardener-journey',
        durationMs: 600000,
        waypointsVisited: 8,
      },
    ],
    topicExplorations: [
      {
        fieldId: 'grove',
        timestamp: NOW - 3600000, // 1 hour ago
        topicId: 'ratchet-effect',
        hubId: 'ratchet-effect',
        queryTrigger: 'What is the ratchet effect?',
      },
    ],
    sproutCaptures: [
      {
        fieldId: 'grove',
        timestamp: NOW - 7200000, // 2 hours ago
        sproutId: 'sprout-123',
        journeyId: 'ghost-journey',
        hubId: 'ratchet-effect',
      },
    ],
    sessionCount: 5,
    lastSessionAt: NOW - 3600000,
  };
}

function createV3Log(): GroveEventLog {
  return {
    version: 3,
    fieldId: 'grove',
    currentSessionId: 'session-123',
    sessionEvents: [],
    cumulativeEvents: {
      journeyCompletions: [],
      topicExplorations: [],
      insightCaptures: [],
    },
    sessionCount: 1,
    lastSessionAt: NOW,
  };
}

// ─────────────────────────────────────────────────────────────────
// TYPE GUARD TESTS
// ─────────────────────────────────────────────────────────────────

describe('Migration Type Guards', () => {
  describe('isCumulativeMetricsV2', () => {
    it('returns true for valid V2 data', () => {
      const v2 = createV2Metrics();
      expect(isCumulativeMetricsV2(v2)).toBe(true);
    });

    it('returns false for V3 data', () => {
      const v3 = createV3Log();
      expect(isCumulativeMetricsV2(v3)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isCumulativeMetricsV2(null)).toBe(false);
    });

    it('returns false for wrong version', () => {
      const data = { ...createV2Metrics(), version: 1 };
      expect(isCumulativeMetricsV2(data)).toBe(false);
    });

    it('returns false for missing required fields', () => {
      const data = { version: 2, fieldId: 'grove' };
      expect(isCumulativeMetricsV2(data)).toBe(false);
    });
  });

  describe('isGroveEventLogV3', () => {
    it('returns true for valid V3 data', () => {
      const v3 = createV3Log();
      expect(isGroveEventLogV3(v3)).toBe(true);
    });

    it('returns false for V2 data', () => {
      const v2 = createV2Metrics();
      expect(isGroveEventLogV3(v2)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isGroveEventLogV3(null)).toBe(false);
    });

    it('returns false for wrong version', () => {
      const data = { ...createV3Log(), version: 2 };
      expect(isGroveEventLogV3(data)).toBe(false);
    });

    it('returns false for missing required fields', () => {
      const data = { version: 3, fieldId: 'grove' };
      expect(isGroveEventLogV3(data)).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// MIGRATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('migrateFromCumulativeMetricsV2', () => {
  it('creates V3 log with correct version', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.version).toBe(3);
  });

  it('preserves fieldId', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.fieldId).toBe(v2.fieldId);
  });

  it('generates new session ID', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.currentSessionId).toBeTruthy();
    expect(v3.currentSessionId).not.toBe(MIGRATED_SESSION_ID);
  });

  it('starts with empty session events', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.sessionEvents).toEqual([]);
  });

  it('migrates journey completions', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.cumulativeEvents.journeyCompletions).toHaveLength(2);

    const first = v3.cumulativeEvents.journeyCompletions[0];
    expect(first.type).toBe('JOURNEY_COMPLETED');
    expect(first.sessionId).toBe(MIGRATED_SESSION_ID);
    expect(first.journeyId).toBe('ghost-journey');
    expect(first.durationMs).toBe(300000);
    expect(first.waypointsVisited).toBe(5);
  });

  it('migrates topic explorations', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.cumulativeEvents.topicExplorations).toHaveLength(1);

    const first = v3.cumulativeEvents.topicExplorations[0];
    expect(first.type).toBe('TOPIC_EXPLORED');
    expect(first.sessionId).toBe(MIGRATED_SESSION_ID);
    expect(first.topicId).toBe('ratchet-effect');
    expect(first.hubId).toBe('ratchet-effect');
    expect(first.queryTrigger).toBe('What is the ratchet effect?');
  });

  it('migrates sprout captures to insight captures', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.cumulativeEvents.insightCaptures).toHaveLength(1);

    const first = v3.cumulativeEvents.insightCaptures[0];
    expect(first.type).toBe('INSIGHT_CAPTURED');
    expect(first.sessionId).toBe(MIGRATED_SESSION_ID);
    expect(first.sproutId).toBe('sprout-123');
    expect(first.journeyId).toBe('ghost-journey');
    expect(first.hubId).toBe('ratchet-effect');
  });

  it('preserves session count', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.sessionCount).toBe(5);
  });

  it('preserves lastSessionAt', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.lastSessionAt).toBe(v2.lastSessionAt);
  });

  it('handles empty V2 data', () => {
    const v2: CumulativeMetricsV2 = {
      version: 2,
      fieldId: 'grove',
      journeyCompletions: [],
      topicExplorations: [],
      sproutCaptures: [],
      sessionCount: 0,
      lastSessionAt: NOW,
    };

    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(v3.cumulativeEvents.journeyCompletions).toEqual([]);
    expect(v3.cumulativeEvents.topicExplorations).toEqual([]);
    expect(v3.cumulativeEvents.insightCaptures).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────
// VERIFICATION TESTS
// ─────────────────────────────────────────────────────────────────

describe('verifyMigration', () => {
  it('returns true for valid migration', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);

    expect(verifyMigration(v2, v3)).toBe(true);
  });

  it('returns false when journey completion count differs', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);
    v3.cumulativeEvents.journeyCompletions = [];

    expect(verifyMigration(v2, v3)).toBe(false);
  });

  it('returns false when topic exploration count differs', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);
    v3.cumulativeEvents.topicExplorations = [];

    expect(verifyMigration(v2, v3)).toBe(false);
  });

  it('returns false when insight capture count differs', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);
    v3.cumulativeEvents.insightCaptures = [];

    expect(verifyMigration(v2, v3)).toBe(false);
  });

  it('returns false when session count differs', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);
    v3.sessionCount = 999;

    expect(verifyMigration(v2, v3)).toBe(false);
  });

  it('returns false when lastSessionAt differs', () => {
    const v2 = createV2Metrics();
    const v3 = migrateFromCumulativeMetricsV2(v2);
    v3.lastSessionAt = 0;

    expect(verifyMigration(v2, v3)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// CONSTANTS TESTS
// ─────────────────────────────────────────────────────────────────

describe('Migration Constants', () => {
  it('MIGRATED_SESSION_ID is defined', () => {
    expect(MIGRATED_SESSION_ID).toBe('migrated');
  });

  it('LEGACY_METRICS_KEY is defined', () => {
    expect(LEGACY_METRICS_KEY).toBe('grove-cumulative-metrics');
  });
});
