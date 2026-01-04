// src/core/events/hooks/context.tsx
// Sprint: bedrock-event-hooks-v1

import { createContext } from 'react';
import type { GroveEventLog, GroveEvent } from '../types';

/**
 * Context value for Grove event system.
 * Provides access to the event log and dispatch function.
 */
export interface GroveEventContextValue {
  /** Current event log state */
  log: GroveEventLog;
  /** Dispatch an event to the log */
  dispatch: (event: GroveEvent) => void;
  /** Start a new session (clears session events, increments count) */
  startNewSession: () => void;
}

/**
 * React context for Grove event system.
 * Must be used within GroveEventProvider.
 */
export const GroveEventContext = createContext<GroveEventContextValue | null>(null);

/** Storage key for event log */
export const STORAGE_KEY = 'grove-event-log';

/** Legacy storage key for V2 metrics (migration source) */
export const LEGACY_STORAGE_KEY = 'grove-cumulative-metrics';
