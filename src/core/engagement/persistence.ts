// src/core/engagement/persistence.ts

import type {
  CumulativeMetricsV2,
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';

// Default Field ID for single-Field deployments
// Sprint: dex-telemetry-compliance-v1
const DEFAULT_FIELD_ID = 'grove';

export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
  cumulativeMetrics: 'grove-telemetry-cumulative',
  cumulativeMetricsV2: (fieldId: string = DEFAULT_FIELD_ID) =>
    `grove-telemetry-${fieldId}-cumulative-v2`,
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getLens(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.lens);
  } catch {
    return null;
  }
}

export function setLens(lens: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.lens, lens);
  } catch {
    console.warn('Failed to persist lens to localStorage');
  }
}

export function clearLens(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.lens);
  } catch {
    // Silently fail
  }
}

// Journey completion tracking
export function getCompletedJourneys(): string[] {
  if (!isBrowser()) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.completedJourneys);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markJourneyCompleted(journeyId: string): void {
  if (!isBrowser()) return;
  try {
    const completed = getCompletedJourneys();
    if (!completed.includes(journeyId)) {
      completed.push(journeyId);
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(completed));
    }
  } catch {
    console.warn('Failed to persist journey completion');
  }
}

export function isJourneyCompleted(journeyId: string): boolean {
  return getCompletedJourneys().includes(journeyId);
}

export function clearCompletedJourneys(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.completedJourneys);
  } catch {
    // Silently fail
  }
}

// Sprint: xstate-telemetry-v1
export interface CumulativeMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  sessionCount: number;
  lastSessionAt: number;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function getCumulativeMetrics(): CumulativeMetrics | null {
  if (!isBrowser()) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cumulativeMetrics);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCumulativeMetrics(metrics: CumulativeMetrics): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.cumulativeMetrics, JSON.stringify(metrics));
  } catch {
    console.warn('[Persistence] Failed to persist cumulative metrics');
  }
}

export function isNewSession(lastSessionAt: number | undefined): boolean {
  if (!lastSessionAt) return true;
  return Date.now() - lastSessionAt > SESSION_TIMEOUT_MS;
}

// Sprint: dex-telemetry-compliance-v1 - V2 with provenance

export function getCumulativeMetricsV2(
  fieldId: string = DEFAULT_FIELD_ID
): CumulativeMetricsV2 | null {
  if (!isBrowser()) return null;
  try {
    const key = STORAGE_KEYS.cumulativeMetricsV2(fieldId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      // Check for legacy v1 data and migrate
      const legacy = getCumulativeMetrics();
      if (legacy) {
        const migrated = migrateV1ToV2(legacy, fieldId);
        setCumulativeMetricsV2(migrated);
        return migrated;
      }
      return null;
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCumulativeMetricsV2(metrics: CumulativeMetricsV2): void {
  if (!isBrowser()) return;
  try {
    const key = STORAGE_KEYS.cumulativeMetricsV2(metrics.fieldId);
    localStorage.setItem(key, JSON.stringify(metrics));
  } catch {
    console.warn('[Persistence] Failed to persist cumulative metrics v2');
  }
}

function migrateV1ToV2(
  v1: CumulativeMetrics,
  fieldId: string
): CumulativeMetricsV2 {
  const now = Date.now();
  return {
    version: 2,
    fieldId,
    journeyCompletions: Array(v1.journeysCompleted)
      .fill(null)
      .map((_, i) => ({
        fieldId,
        timestamp: now - i * 1000,
        journeyId: `legacy-migration-${i}`,
      })),
    topicExplorations: v1.topicsExplored.map((topicId, i) => ({
      fieldId,
      timestamp: now - i * 1000,
      topicId,
      hubId: 'legacy-migration',
    })),
    sproutCaptures: Array(v1.sproutsCaptured)
      .fill(null)
      .map((_, i) => ({
        fieldId,
        timestamp: now - i * 1000,
        sproutId: `legacy-migration-${i}`,
      })),
    sessionCount: v1.sessionCount,
    lastSessionAt: v1.lastSessionAt,
  };
}

// Sprint: dex-telemetry-compliance-v1 - Context hydration with provenance
export interface HydratedContextOverrides {
  sessionStartedAt: number;
  sessionCount: number;
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
}

export function getHydratedContextOverrides(): HydratedContextOverrides {
  if (!isBrowser()) {
    return {
      sessionStartedAt: Date.now(),
      sessionCount: 1,
      journeyCompletions: [],
      topicExplorations: [],
      sproutCaptures: [],
    };
  }

  const stored = getCumulativeMetricsV2();

  if (stored) {
    const isNew = isNewSession(stored.lastSessionAt);
    return {
      sessionStartedAt: Date.now(),
      sessionCount: isNew ? stored.sessionCount + 1 : stored.sessionCount,
      journeyCompletions: stored.journeyCompletions,
      topicExplorations: stored.topicExplorations,
      sproutCaptures: stored.sproutCaptures,
    };
  }

  return {
    sessionStartedAt: Date.now(),
    sessionCount: 1,
    journeyCompletions: [],
    topicExplorations: [],
    sproutCaptures: [],
  };
}
