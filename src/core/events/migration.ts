// src/core/events/migration.ts
// Sprint: bedrock-event-architecture-v1

import type {
  GroveEventLog,
  JourneyCompletedEvent,
  TopicExploredEvent,
  InsightCapturedEvent,
} from './types';
import type { CumulativeMetricsV2 } from '../schema/telemetry';
import { generateSessionId, DEFAULT_FIELD_ID } from './store';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

/** Session ID used for migrated events */
export const MIGRATED_SESSION_ID = 'migrated';

/** localStorage keys for legacy data */
export const LEGACY_METRICS_KEY = 'grove-cumulative-metrics';
export const LEGACY_ENGAGEMENT_KEY = 'grove-engagement-state';

// ─────────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────────

/**
 * Check if data is CumulativeMetricsV2.
 */
export function isCumulativeMetricsV2(data: unknown): data is CumulativeMetricsV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    (data as { version: unknown }).version === 2 &&
    'fieldId' in data &&
    'journeyCompletions' in data &&
    'topicExplorations' in data &&
    'sproutCaptures' in data
  );
}

/**
 * Check if data is GroveEventLog v3.
 */
export function isGroveEventLogV3(data: unknown): data is GroveEventLog {
  return (
    typeof data === 'object' &&
    data !== null &&
    'version' in data &&
    (data as { version: unknown }).version === 3 &&
    'sessionEvents' in data &&
    'cumulativeEvents' in data
  );
}

// ─────────────────────────────────────────────────────────────────
// MIGRATION: V2 → V3
// ─────────────────────────────────────────────────────────────────

/**
 * Migrate CumulativeMetricsV2 to GroveEventLog v3.
 *
 * Preserves cumulative data while establishing new event structure.
 * Migrated events get a special sessionId to indicate origin.
 *
 * @param v2 - CumulativeMetricsV2 data to migrate
 * @returns GroveEventLog v3
 */
export function migrateFromCumulativeMetricsV2(v2: CumulativeMetricsV2): GroveEventLog {
  return {
    version: 3,
    fieldId: v2.fieldId,
    currentSessionId: generateSessionId(),
    sessionEvents: [], // Fresh session starts empty
    cumulativeEvents: {
      journeyCompletions: v2.journeyCompletions.map((jc): JourneyCompletedEvent => ({
        fieldId: jc.fieldId,
        timestamp: jc.timestamp,
        type: 'JOURNEY_COMPLETED',
        sessionId: MIGRATED_SESSION_ID,
        journeyId: jc.journeyId,
        durationMs: jc.durationMs,
        waypointsVisited: jc.waypointsVisited,
      })),
      topicExplorations: v2.topicExplorations.map((te): TopicExploredEvent => ({
        fieldId: te.fieldId,
        timestamp: te.timestamp,
        type: 'TOPIC_EXPLORED',
        sessionId: MIGRATED_SESSION_ID,
        topicId: te.topicId,
        hubId: te.hubId,
        queryTrigger: te.queryTrigger,
      })),
      insightCaptures: v2.sproutCaptures.map((sc): InsightCapturedEvent => ({
        fieldId: sc.fieldId,
        timestamp: sc.timestamp,
        type: 'INSIGHT_CAPTURED',
        sessionId: MIGRATED_SESSION_ID,
        sproutId: sc.sproutId,
        journeyId: sc.journeyId,
        hubId: sc.hubId,
      })),
    },
    sessionCount: v2.sessionCount,
    lastSessionAt: v2.lastSessionAt,
  };
}

// ─────────────────────────────────────────────────────────────────
// AUTO-MIGRATION
// ─────────────────────────────────────────────────────────────────

/**
 * Load or migrate event log from localStorage.
 *
 * Checks for existing v3 data first, then falls back to v2 migration.
 *
 * @returns GroveEventLog (existing or migrated)
 */
export function loadOrMigrateEventLog(): GroveEventLog {
  // Check for existing v3 data
  const v3Raw = typeof window !== 'undefined'
    ? localStorage.getItem('grove-event-log')
    : null;

  if (v3Raw) {
    try {
      const v3Data = JSON.parse(v3Raw);
      if (isGroveEventLogV3(v3Data)) {
        return v3Data;
      }
    } catch {
      // Invalid JSON, continue to migration
    }
  }

  // Check for v2 data to migrate
  const v2Raw = typeof window !== 'undefined'
    ? localStorage.getItem(LEGACY_METRICS_KEY)
    : null;

  if (v2Raw) {
    try {
      const v2Data = JSON.parse(v2Raw);
      if (isCumulativeMetricsV2(v2Data)) {
        const migrated = migrateFromCumulativeMetricsV2(v2Data);
        // Save migrated data
        if (typeof window !== 'undefined') {
          localStorage.setItem('grove-event-log', JSON.stringify(migrated));
        }
        return migrated;
      }
    } catch {
      // Invalid JSON, create fresh
    }
  }

  // No existing data, create fresh log
  return {
    version: 3,
    fieldId: DEFAULT_FIELD_ID,
    currentSessionId: generateSessionId(),
    sessionEvents: [],
    cumulativeEvents: {
      journeyCompletions: [],
      topicExplorations: [],
      insightCaptures: [],
    },
    sessionCount: 1,
    lastSessionAt: Date.now(),
  };
}

/**
 * Save event log to localStorage.
 */
export function saveEventLog(log: GroveEventLog): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('grove-event-log', JSON.stringify(log));
  }
}

// ─────────────────────────────────────────────────────────────────
// MIGRATION VALIDATION
// ─────────────────────────────────────────────────────────────────

/**
 * Verify migration preserved all data.
 *
 * @param original - Original V2 data
 * @param migrated - Migrated V3 data
 * @returns true if migration is valid
 */
export function verifyMigration(
  original: CumulativeMetricsV2,
  migrated: GroveEventLog
): boolean {
  // Check counts match
  if (original.journeyCompletions.length !== migrated.cumulativeEvents.journeyCompletions.length) {
    return false;
  }
  if (original.topicExplorations.length !== migrated.cumulativeEvents.topicExplorations.length) {
    return false;
  }
  if (original.sproutCaptures.length !== migrated.cumulativeEvents.insightCaptures.length) {
    return false;
  }

  // Check session count preserved
  if (original.sessionCount !== migrated.sessionCount) {
    return false;
  }

  // Check timestamps preserved
  if (original.lastSessionAt !== migrated.lastSessionAt) {
    return false;
  }

  return true;
}
