// src/core/events/hooks/provider.tsx
// Sprint: bedrock-event-hooks-v1

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GroveEventContext, STORAGE_KEY, LEGACY_STORAGE_KEY } from './context';
import type { GroveEventLog, GroveEvent } from '../types';
import { validateEvent } from '../schema';
import {
  createEventLog,
  appendEvent,
  startNewSession as storeStartNewSession,
} from '../store';
import {
  isCumulativeMetricsV2,
  isGroveEventLogV3,
  migrateFromCumulativeMetricsV2,
} from '../migration';

/**
 * Initialize the event log from storage or create fresh.
 * Handles V2 → V3 migration automatically.
 */
function initializeEventLog(): GroveEventLog {
  // Try to load V3 log first
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isGroveEventLogV3(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[GroveEvents] Failed to load V3 log:', e);
  }

  // Try to migrate from V2
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (isCumulativeMetricsV2(parsed)) {
        console.info('[GroveEvents] Migrating from V2 to V3');
        const migrated = migrateFromCumulativeMetricsV2(parsed);
        // Persist migrated log
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (e) {
    console.warn('[GroveEvents] Failed to migrate from V2:', e);
  }

  // Create fresh log
  console.info('[GroveEvents] Creating fresh event log');
  return createEventLog();
}

/**
 * Persist event log to localStorage.
 */
function persistEventLog(log: GroveEventLog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch (e) {
    console.error('[GroveEvents] Failed to persist log:', e);
  }
}

export interface GroveEventProviderProps {
  children: React.ReactNode;
  /** Optional initial log for testing */
  initialLog?: GroveEventLog;
  /** Disable persistence (for testing) */
  disablePersistence?: boolean;
}

/**
 * Provider component for Grove event system.
 * Manages event log state and persistence.
 */
export function GroveEventProvider({
  children,
  initialLog,
  disablePersistence = false,
}: GroveEventProviderProps) {
  const [log, setLog] = useState<GroveEventLog>(() =>
    initialLog ?? initializeEventLog()
  );

  // Dispatch an event with validation
  const dispatch = useCallback((event: GroveEvent) => {
    // Validate event before adding
    const validated = validateEvent(event);

    setLog(prev => {
      const updated = appendEvent(prev, validated);
      return updated;
    });
  }, []);

  // Start a new session
  const startNewSession = useCallback(() => {
    setLog(prev => storeStartNewSession(prev));
  }, []);

  // Persist on change
  useEffect(() => {
    if (!disablePersistence) {
      persistEventLog(log);
    }
  }, [log, disablePersistence]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    log,
    dispatch,
    startNewSession,
  }), [log, dispatch, startNewSession]);

  return (
    <GroveEventContext.Provider value={contextValue}>
      {children}
    </GroveEventContext.Provider>
  );
}
