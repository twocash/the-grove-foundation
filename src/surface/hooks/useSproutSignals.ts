// src/surface/hooks/useSproutSignals.ts
// Sprint: S6-SL-ObservableSignals v1
// Phase 2 of Observable Knowledge System EPIC
// "We're not building analytics. We're building the nervous system for emergent quality."

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SproutEventType,
  EventProvenance,
  SproutViewedEvent,
  SproutRetrievedEvent,
  SproutReferencedEvent,
  SproutSearchedEvent,
  SproutRatedEvent,
  SproutExportedEvent,
  SproutPromotedEvent,
  SproutRefinedEvent,
} from '@core/schema/sprout-signals';

// ============================================================================
// CONSTANTS
// ============================================================================

const SESSION_ID_KEY = 'grove-signal-session-id';
const OFFLINE_QUEUE_KEY = 'grove-signal-offline-queue';
const VIEW_DEBOUNCE_MS = 2000; // Debounce view events by 2 seconds
const BATCH_INTERVAL_MS = 5000; // Batch events every 5 seconds
const MAX_QUEUE_SIZE = 100; // Max offline queue size

// ============================================================================
// SUPABASE CLIENT (lazy singleton)
// ============================================================================

let _supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[SproutSignals] Supabase not configured');
    return null;
  }

  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
}

// ============================================================================
// SESSION ID MANAGEMENT
// ============================================================================

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// ============================================================================
// OFFLINE QUEUE
// ============================================================================

interface QueuedEvent {
  sproutId: string;
  eventType: SproutEventType;
  metadata: Record<string, unknown>;
  provenance: EventProvenance;
  sessionId: string;
  queuedAt: string;
}

function loadOfflineQueue(): QueuedEvent[] {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: QueuedEvent[]): void {
  try {
    // Keep queue size bounded
    const trimmed = queue.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[SproutSignals] Failed to save offline queue:', e);
  }
}

function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ============================================================================
// METADATA TYPE DEFINITIONS
// ============================================================================

type ViewedMetadata = SproutViewedEvent['metadata'];
type RetrievedMetadata = SproutRetrievedEvent['metadata'];
type ReferencedMetadata = SproutReferencedEvent['metadata'];
type SearchedMetadata = SproutSearchedEvent['metadata'];
type RatedMetadata = SproutRatedEvent['metadata'];
type ExportedMetadata = SproutExportedEvent['metadata'];
type PromotedMetadata = SproutPromotedEvent['metadata'];
type RefinedMetadata = SproutRefinedEvent['metadata'];

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface SproutSignalsAPI {
  // Core emit function
  emit: (
    eventType: SproutEventType,
    sproutId: string,
    metadata: Record<string, unknown>,
    provenance?: Partial<EventProvenance>
  ) => Promise<void>;

  // Type-safe event emitters
  emitViewed: (sproutId: string, metadata: ViewedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitRetrieved: (sproutId: string, metadata: RetrievedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitReferenced: (sproutId: string, metadata: ReferencedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitSearched: (sproutId: string, metadata: SearchedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitRated: (sproutId: string, metadata: RatedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitExported: (sproutId: string, metadata: ExportedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitPromoted: (sproutId: string, metadata: PromotedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;
  emitRefined: (sproutId: string, metadata: RefinedMetadata, provenance?: Partial<EventProvenance>) => Promise<void>;

  // Utilities
  flushQueue: () => Promise<void>;
  getSessionId: () => string;
  isOnline: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSproutSignals(defaultProvenance?: Partial<EventProvenance>): SproutSignalsAPI {
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const queueRef = useRef<QueuedEvent[]>(loadOfflineQueue());
  const pendingBatchRef = useRef<QueuedEvent[]>([]);
  const viewDebounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isOnlineRef = useRef<boolean>(navigator.onLine);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      // Sync queued events when coming back online
      flushQueueToSupabase();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Batch timer setup
  useEffect(() => {
    batchTimerRef.current = setInterval(() => {
      if (pendingBatchRef.current.length > 0) {
        flushBatchToSupabase();
      }
    }, BATCH_INTERVAL_MS);

    return () => {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }
    };
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      viewDebounceRef.current.forEach((timer) => clearTimeout(timer));
      viewDebounceRef.current.clear();
    };
  }, []);

  // Flush batch to Supabase
  const flushBatchToSupabase = useCallback(async () => {
    if (pendingBatchRef.current.length === 0) return;
    if (!isOnlineRef.current) {
      // Move batch to offline queue
      queueRef.current = [...queueRef.current, ...pendingBatchRef.current];
      saveOfflineQueue(queueRef.current);
      pendingBatchRef.current = [];
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      // No client, move to offline queue
      queueRef.current = [...queueRef.current, ...pendingBatchRef.current];
      saveOfflineQueue(queueRef.current);
      pendingBatchRef.current = [];
      return;
    }

    const batch = [...pendingBatchRef.current];
    pendingBatchRef.current = [];

    try {
      const records = batch.map((event) => ({
        sprout_id: event.sproutId,
        event_type: event.eventType,
        session_id: event.sessionId,
        provenance: event.provenance,
        metadata: event.metadata,
        created_at: event.queuedAt,
      }));

      const { error } = await client.from('sprout_usage_events').insert(records);

      if (error) {
        console.error('[SproutSignals] Batch insert failed:', error);
        // Move failed batch to offline queue
        queueRef.current = [...queueRef.current, ...batch];
        saveOfflineQueue(queueRef.current);
      }
    } catch (e) {
      console.error('[SproutSignals] Batch insert error:', e);
      // Move failed batch to offline queue
      queueRef.current = [...queueRef.current, ...batch];
      saveOfflineQueue(queueRef.current);
    }
  }, []);

  // Flush offline queue to Supabase
  const flushQueueToSupabase = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    if (!isOnlineRef.current) return;

    const client = getSupabaseClient();
    if (!client) return;

    const queue = [...queueRef.current];
    queueRef.current = [];

    try {
      const records = queue.map((event) => ({
        sprout_id: event.sproutId,
        event_type: event.eventType,
        session_id: event.sessionId,
        provenance: event.provenance,
        metadata: event.metadata,
        created_at: event.queuedAt,
      }));

      const { error } = await client.from('sprout_usage_events').insert(records);

      if (error) {
        console.error('[SproutSignals] Queue flush failed:', error);
        // Restore queue on failure
        queueRef.current = queue;
        saveOfflineQueue(queueRef.current);
      } else {
        clearOfflineQueue();
        console.log(`[SproutSignals] Flushed ${queue.length} queued events`);
      }
    } catch (e) {
      console.error('[SproutSignals] Queue flush error:', e);
      queueRef.current = queue;
      saveOfflineQueue(queueRef.current);
    }
  }, []);

  // Core emit function
  const emit = useCallback(
    async (
      eventType: SproutEventType,
      sproutId: string,
      metadata: Record<string, unknown>,
      provenance?: Partial<EventProvenance>
    ) => {
      const fullProvenance: EventProvenance = {
        ...defaultProvenance,
        ...provenance,
      };

      const event: QueuedEvent = {
        sproutId,
        eventType,
        metadata,
        provenance: fullProvenance,
        sessionId: sessionIdRef.current,
        queuedAt: new Date().toISOString(),
      };

      // Add to pending batch
      pendingBatchRef.current.push(event);

      // For high-frequency events, batch. For important events, flush immediately
      const immediateFlushTypes: SproutEventType[] = [
        'sprout_rated',
        'sprout_exported',
        'sprout_promoted',
        'sprout_refined',
      ];

      if (immediateFlushTypes.includes(eventType)) {
        await flushBatchToSupabase();
      }
    },
    [defaultProvenance, flushBatchToSupabase]
  );

  // Debounced view emit (prevents rapid-fire view events)
  const emitViewed = useCallback(
    async (sproutId: string, metadata: ViewedMetadata, provenance?: Partial<EventProvenance>) => {
      // Cancel existing debounce for this sprout
      const existingTimer = viewDebounceRef.current.get(sproutId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        emit('sprout_viewed', sproutId, metadata, provenance);
        viewDebounceRef.current.delete(sproutId);
      }, VIEW_DEBOUNCE_MS);

      viewDebounceRef.current.set(sproutId, timer);
    },
    [emit]
  );

  // Type-safe emitters
  const emitRetrieved = useCallback(
    (sproutId: string, metadata: RetrievedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_retrieved', sproutId, metadata, provenance),
    [emit]
  );

  const emitReferenced = useCallback(
    (sproutId: string, metadata: ReferencedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_referenced', sproutId, metadata, provenance),
    [emit]
  );

  const emitSearched = useCallback(
    (sproutId: string, metadata: SearchedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_searched', sproutId, metadata, provenance),
    [emit]
  );

  const emitRated = useCallback(
    (sproutId: string, metadata: RatedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_rated', sproutId, metadata, provenance),
    [emit]
  );

  const emitExported = useCallback(
    (sproutId: string, metadata: ExportedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_exported', sproutId, metadata, provenance),
    [emit]
  );

  const emitPromoted = useCallback(
    (sproutId: string, metadata: PromotedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_promoted', sproutId, metadata, provenance),
    [emit]
  );

  const emitRefined = useCallback(
    (sproutId: string, metadata: RefinedMetadata, provenance?: Partial<EventProvenance>) =>
      emit('sprout_refined', sproutId, metadata, provenance),
    [emit]
  );

  // Public flush function
  const flushQueue = useCallback(async () => {
    await flushBatchToSupabase();
    await flushQueueToSupabase();
  }, [flushBatchToSupabase, flushQueueToSupabase]);

  // Memoized API
  const api = useMemo<SproutSignalsAPI>(
    () => ({
      emit,
      emitViewed,
      emitRetrieved,
      emitReferenced,
      emitSearched,
      emitRated,
      emitExported,
      emitPromoted,
      emitRefined,
      flushQueue,
      getSessionId: () => sessionIdRef.current,
      isOnline: isOnlineRef.current,
    }),
    [
      emit,
      emitViewed,
      emitRetrieved,
      emitReferenced,
      emitSearched,
      emitRated,
      emitExported,
      emitPromoted,
      emitRefined,
      flushQueue,
    ]
  );

  return api;
}

// ============================================================================
// STANDALONE SIGNAL RECORDER (for server-side/non-React contexts)
// ============================================================================

/**
 * Record a signal event directly to Supabase.
 * Use this in server-side contexts or where React hooks aren't available.
 */
export async function recordSproutSignal(
  eventType: SproutEventType,
  sproutId: string,
  metadata: Record<string, unknown>,
  provenance: EventProvenance,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    const { error } = await client.from('sprout_usage_events').insert({
      sprout_id: sproutId,
      event_type: eventType,
      session_id: sessionId || `server-${Date.now()}`,
      provenance,
      metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[SproutSignals] Record failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[SproutSignals] Record error:', message);
    return { success: false, error: message };
  }
}

export default useSproutSignals;
