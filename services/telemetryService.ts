// services/telemetryService.ts
// Client-side telemetry sync service
// Sprint: adaptive-engagement-v1

import type { SessionTelemetry, SessionStage } from '../src/core/schema/session-telemetry';

const STORAGE_MODE = import.meta.env.VITE_SPROUT_STORAGE || 'local';

interface SyncResult {
  success: boolean;
  mode: 'server' | 'local';
  error?: string;
}

/**
 * Sync session telemetry to server
 * Falls back gracefully if server is unavailable
 */
export async function syncTelemetryToServer(
  telemetry: SessionTelemetry
): Promise<SyncResult> {
  if (STORAGE_MODE !== 'server') {
    return { success: true, mode: 'local' };
  }

  try {
    const response = await fetch('/api/telemetry/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: telemetry.sessionId,
        visitCount: telemetry.visitCount,
        totalExchangeCount: telemetry.totalExchangeCount,
        allTopicsExplored: telemetry.allTopicsExplored,
        sproutsCaptured: telemetry.sproutsCaptured,
        completedJourneys: telemetry.completedJourneys,
        stage: telemetry.stage,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.mode === 'local') {
        // Database not configured, fall back to local
        return { success: true, mode: 'local' };
      }
      return { success: false, mode: 'server', error: data.error || 'Sync failed' };
    }

    return { success: true, mode: 'server' };
  } catch (error) {
    console.warn('[Telemetry] Sync failed, falling back to local:', error);
    return { success: true, mode: 'local' };
  }
}

/**
 * Load telemetry from server if available
 */
export async function loadTelemetryFromServer(
  sessionId: string
): Promise<Partial<SessionTelemetry> | null> {
  if (STORAGE_MODE !== 'server') {
    return null;
  }

  try {
    const response = await fetch(`/api/telemetry/session/${sessionId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      visitCount: data.visitCount,
      totalExchangeCount: data.totalExchangeCount,
      allTopicsExplored: data.allTopicsExplored,
      sproutsCaptured: data.sproutsCaptured,
      completedJourneys: data.completedJourneys,
      stage: data.stage as SessionStage,
    };
  } catch {
    return null;
  }
}

/**
 * Sync journey progress to server
 */
export async function syncJourneyProgress(
  sessionId: string,
  journeyId: string,
  currentWaypoint: number,
  explicit: boolean,
  completed: boolean = false
): Promise<SyncResult> {
  if (STORAGE_MODE !== 'server') {
    return { success: true, mode: 'local' };
  }

  try {
    const response = await fetch('/api/telemetry/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        journeyId,
        currentWaypoint,
        explicit,
        completed,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data.mode === 'local') {
        return { success: true, mode: 'local' };
      }
      return { success: false, mode: 'server', error: data.error || 'Sync failed' };
    }

    return { success: true, mode: 'server' };
  } catch (error) {
    console.warn('[Telemetry] Journey sync failed:', error);
    return { success: true, mode: 'local' };
  }
}

/**
 * Load journey progress from server
 */
export async function loadJourneyProgress(
  sessionId: string,
  journeyId: string
): Promise<{ currentWaypoint: number; explicit: boolean } | null> {
  if (STORAGE_MODE !== 'server') {
    return null;
  }

  try {
    const response = await fetch(`/api/telemetry/journey/${sessionId}/${journeyId}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      currentWaypoint: data.currentWaypoint,
      explicit: data.explicit,
    };
  } catch {
    return null;
  }
}
