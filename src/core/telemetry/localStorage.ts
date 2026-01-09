// src/core/telemetry/localStorage.ts
// Local Storage Persistence for Prompt Telemetry
// Sprint: experiences-console-recovery-v1 (stub created during recovery)
//
// NOTE: This is a minimal stub created during recovery.
// The full implementation was part of incomplete work from stash.
// Can be expanded in future sprint for full localStorage telemetry.

import type { PromptTelemetryEvent } from './types';

const STORAGE_KEY = 'grove-prompt-telemetry';
const MAX_EVENTS = 100;

/**
 * Persist a telemetry event to localStorage
 * Used for offline performance tracking
 */
export function persistTelemetryEvent(event: PromptTelemetryEvent): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const events: PromptTelemetryEvent[] = existing ? JSON.parse(existing) : [];

    // Add new event and trim to max size
    events.push(event);
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    // Silently fail on localStorage errors (quota exceeded, etc.)
    console.debug('[Telemetry] localStorage persist failed:', error);
  }
}

/**
 * Get stored telemetry events from localStorage
 */
export function getStoredEvents(): PromptTelemetryEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear stored telemetry events
 */
export function clearStoredEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

// Stub exports for compatibility with stash code
// These will be implemented in future sprint

export interface PromptStats {
  promptId: string;
  impressions: number;
  selections: number;
  ctr: number;
}

export function syncPromptStats(): Promise<void> {
  // Stub - sync to server in future sprint
  return Promise.resolve();
}

export function getPromptStats(promptId: string): PromptStats | null {
  // Stub - calculate from stored events in future sprint
  return null;
}
