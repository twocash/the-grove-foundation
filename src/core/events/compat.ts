// src/core/events/compat.ts
// Sprint: bedrock-event-architecture-v1
// Backward compatibility layer for legacy systems

import type { GroveEventLog } from './types';
import type { CumulativeMetricsV2 } from '../schema/telemetry';
import { projectToCumulativeMetricsV2 } from './projections/telemetry';
import { LEGACY_METRICS_KEY } from './migration';

// ─────────────────────────────────────────────────────────────────
// LEGACY ROUTE DETECTION
// ─────────────────────────────────────────────────────────────────

/**
 * Check if the legacy engagement system is active.
 * Used during migration period to determine which system to use.
 *
 * Legacy system is considered active if:
 * - We're on /genesis route (legacy dashboard)
 * - Feature flag `useLegacyEngagement` is set
 */
export function isLegacySystemActive(): boolean {
  if (typeof window === 'undefined') return false;

  // Check route
  const pathname = window.location.pathname;
  if (pathname.startsWith('/genesis')) {
    return true;
  }

  // Check feature flag in localStorage
  const flags = localStorage.getItem('grove-feature-flags');
  if (flags) {
    try {
      const parsed = JSON.parse(flags);
      return parsed.useLegacyEngagement === true;
    } catch {
      return false;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────
// SYNC TO LEGACY FORMAT
// ─────────────────────────────────────────────────────────────────

/**
 * Sync event log to legacy CumulativeMetricsV2 format.
 * Writes to legacy localStorage key for backward compatibility.
 *
 * @param log - Event log to sync
 */
export function syncToLegacyFormat(log: GroveEventLog): void {
  if (typeof window === 'undefined') return;

  const v2 = projectToCumulativeMetricsV2(log);
  localStorage.setItem(LEGACY_METRICS_KEY, JSON.stringify(v2));
}

/**
 * Get CumulativeMetricsV2 projection from event log.
 * For use when legacy systems need V2 format.
 *
 * @param log - Event log to project
 * @returns CumulativeMetricsV2
 */
export function getLegacyMetrics(log: GroveEventLog): CumulativeMetricsV2 {
  return projectToCumulativeMetricsV2(log);
}

// ─────────────────────────────────────────────────────────────────
// LEGACY ENGAGEMENT STATE BRIDGE
// ─────────────────────────────────────────────────────────────────

/**
 * Bridge type for legacy engagement state.
 * Maps event log projections to legacy EngagementContext fields.
 */
export interface LegacyEngagementBridge {
  /** Sync event log to legacy engagement state */
  syncToEngagementState: (log: GroveEventLog) => void;
  /** Read legacy engagement state */
  readEngagementState: () => Record<string, unknown> | null;
}

/**
 * Create a bridge to legacy engagement state.
 *
 * @returns Bridge object with sync and read methods
 */
export function createLegacyBridge(): LegacyEngagementBridge {
  const ENGAGEMENT_KEY = 'grove-engagement-state';

  return {
    syncToEngagementState(log: GroveEventLog): void {
      if (typeof window === 'undefined') return;

      // Project to legacy format
      const metrics = projectToCumulativeMetricsV2(log);

      // Read existing engagement state
      const existingRaw = localStorage.getItem(ENGAGEMENT_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};

      // Merge metrics into engagement state
      const updated = {
        ...existing,
        journeyCompletions: metrics.journeyCompletions,
        topicExplorations: metrics.topicExplorations,
        sproutCaptures: metrics.sproutCaptures,
        sessionCount: metrics.sessionCount,
        lastSessionAt: metrics.lastSessionAt,
      };

      localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(updated));
    },

    readEngagementState(): Record<string, unknown> | null {
      if (typeof window === 'undefined') return null;

      const raw = localStorage.getItem(ENGAGEMENT_KEY);
      if (!raw) return null;

      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// DUAL-WRITE HELPER
// ─────────────────────────────────────────────────────────────────

/**
 * Write event log to both V3 and legacy formats.
 * Use during migration period for maximum compatibility.
 *
 * @param log - Event log to save
 */
export function dualWrite(log: GroveEventLog): void {
  if (typeof window === 'undefined') return;

  // Write V3 format
  localStorage.setItem('grove-event-log', JSON.stringify(log));

  // Write legacy format
  syncToLegacyFormat(log);
}

/**
 * Check if dual-write is needed.
 * Returns true during migration period.
 */
export function needsDualWrite(): boolean {
  // During migration period, always dual-write
  // TODO: Remove after migration complete
  return true;
}
