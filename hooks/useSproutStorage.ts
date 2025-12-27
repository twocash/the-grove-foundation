// hooks/useSproutStorage.ts
// Sprint: Sprout System
// localStorage CRUD operations for sprout persistence with optional server sync

import { useState, useCallback, useEffect } from 'react';
import {
  Sprout,
  SproutStorage,
  SproutProvenance,
  isValidSproutStorage,
  migrateStorageToV2,
  SPROUT_STORAGE_KEY,
  CURRENT_STORAGE_VERSION
} from '../src/core/schema/sprout';
import { getSessionId } from '../src/lib/session';

// Check storage mode from environment variable
// @ts-expect-error - Vite env variable
const STORAGE_MODE = import.meta.env?.VITE_SPROUT_STORAGE || 'local';

/**
 * Generate a session ID for this browser instance
 * Uses the same pattern as engagement bus for consistency
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get or create the session ID from localStorage
 */
function getOrCreateSessionId(): string {
  const existingId = localStorage.getItem('grove-session-id');
  if (existingId) return existingId;

  const newId = generateSessionId();
  localStorage.setItem('grove-session-id', newId);
  return newId;
}

/**
 * Load sprout storage from localStorage
 */
function loadStorage(): SproutStorage {
  try {
    const raw = localStorage.getItem(SPROUT_STORAGE_KEY);
    if (!raw) {
      return {
        version: CURRENT_STORAGE_VERSION,
        sprouts: [],
        sessionId: getOrCreateSessionId()
      };
    }

    const parsed = JSON.parse(raw);
    if (isValidSproutStorage(parsed)) {
      // Migrate if needed, ensure session ID is current
      const migrated = migrateStorageToV2(parsed);
      return {
        ...migrated,
        sessionId: getOrCreateSessionId()
      };
    }

    // Invalid storage, reset
    console.warn('[SproutStorage] Invalid storage format, resetting');
    return {
      version: CURRENT_STORAGE_VERSION,
      sprouts: [],
      sessionId: getOrCreateSessionId()
    };
  } catch (error) {
    console.error('[SproutStorage] Failed to load storage:', error);
    return {
      version: CURRENT_STORAGE_VERSION,
      sprouts: [],
      sessionId: getOrCreateSessionId()
    };
  }
}

/**
 * Save sprout storage to localStorage
 */
function saveStorage(storage: SproutStorage): boolean {
  try {
    localStorage.setItem(SPROUT_STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (error) {
    console.error('[SproutStorage] Failed to save storage:', error);
    return false;
  }
}

/**
 * Hook for sprout storage operations
 *
 * Provides CRUD operations for sprouts with localStorage persistence.
 * Storage is synced across browser tabs via the storage event.
 */
export function useSproutStorage() {
  const [storage, setStorage] = useState<SproutStorage>(() => loadStorage());

  // Sync with localStorage on mount and tab changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SPROUT_STORAGE_KEY) {
        setStorage(loadStorage());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Add a new sprout to storage (supports both local and server modes)
   */
  const addSprout = useCallback(async (sprout: Sprout): Promise<boolean> => {
    // Server mode: POST to API, fall back to local on failure
    if (STORAGE_MODE === 'server') {
      try {
        const response = await fetch('/api/sprouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: sprout.query,
            response: sprout.response,
            provenance: sprout.provenance,
            tags: sprout.tags,
            note: sprout.notes,
            sessionId: getSessionId(),
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const { sprout: serverSprout } = await response.json();

        // Map server response to client schema
        const mappedSprout: Sprout = {
          id: serverSprout.id,
          query: serverSprout.query,
          response: serverSprout.response,
          provenance: serverSprout.provenance as SproutProvenance | undefined,
          personaId: serverSprout.provenance?.lens?.id || null,
          journeyId: serverSprout.provenance?.journey?.id || null,
          hubId: serverSprout.provenance?.hub?.id || null,
          nodeId: serverSprout.provenance?.node?.id || null,
          tags: serverSprout.tags || [],
          notes: serverSprout.note,
          status: serverSprout.lifecycle || 'sprout',
          capturedAt: serverSprout.captured_at,
          sessionId: serverSprout.session_id || getSessionId(),
          creatorId: null,
        };

        // Also save locally for offline access
        const newStorage: SproutStorage = {
          ...storage,
          sprouts: [mappedSprout, ...storage.sprouts]
        };
        saveStorage(newStorage);
        setStorage(newStorage);

        console.log('[SproutStorage] Server saved sprout:', mappedSprout.id.slice(0, 8));
        return true;
      } catch (error) {
        console.warn('[SproutStorage] Server save failed, falling back to local:', error);
        // Fall through to local save
      }
    }

    // Local mode (default or fallback)
    try {
      const newStorage: SproutStorage = {
        ...storage,
        sprouts: [...storage.sprouts, sprout]
      };

      const success = saveStorage(newStorage);
      if (success) {
        setStorage(newStorage);
        console.log('[SproutStorage] Added sprout:', sprout.id.slice(0, 8));
      }
      return success;
    } catch (error) {
      console.error('[SproutStorage] Failed to add sprout:', error);
      return false;
    }
  }, [storage]);

  /**
   * Get all sprouts
   */
  const getSprouts = useCallback((): Sprout[] => {
    return storage.sprouts;
  }, [storage.sprouts]);

  /**
   * Get sprouts from the current session only
   */
  const getSessionSprouts = useCallback((): Sprout[] => {
    return storage.sprouts.filter(s => s.sessionId === storage.sessionId);
  }, [storage]);

  /**
   * Get a specific sprout by ID
   */
  const getSprout = useCallback((id: string): Sprout | undefined => {
    return storage.sprouts.find(s => s.id === id);
  }, [storage.sprouts]);

  /**
   * Update an existing sprout
   */
  const updateSprout = useCallback((id: string, updates: Partial<Sprout>): boolean => {
    try {
      const index = storage.sprouts.findIndex(s => s.id === id);
      if (index === -1) {
        console.warn('[SproutStorage] Sprout not found:', id);
        return false;
      }

      const updatedSprouts = [...storage.sprouts];
      updatedSprouts[index] = { ...updatedSprouts[index], ...updates };

      const newStorage: SproutStorage = {
        ...storage,
        sprouts: updatedSprouts
      };

      const success = saveStorage(newStorage);
      if (success) {
        setStorage(newStorage);
        console.log('[SproutStorage] Updated sprout:', id.slice(0, 8));
      }
      return success;
    } catch (error) {
      console.error('[SproutStorage] Failed to update sprout:', error);
      return false;
    }
  }, [storage]);

  /**
   * Delete a sprout by ID
   */
  const deleteSprout = useCallback((id: string): boolean => {
    try {
      const newStorage: SproutStorage = {
        ...storage,
        sprouts: storage.sprouts.filter(s => s.id !== id)
      };

      const success = saveStorage(newStorage);
      if (success) {
        setStorage(newStorage);
        console.log('[SproutStorage] Deleted sprout:', id.slice(0, 8));
      }
      return success;
    } catch (error) {
      console.error('[SproutStorage] Failed to delete sprout:', error);
      return false;
    }
  }, [storage]);

  /**
   * Clear all sprouts from the current session
   */
  const clearSessionSprouts = useCallback((): boolean => {
    try {
      const newStorage: SproutStorage = {
        ...storage,
        sprouts: storage.sprouts.filter(s => s.sessionId !== storage.sessionId)
      };

      const success = saveStorage(newStorage);
      if (success) {
        setStorage(newStorage);
        console.log('[SproutStorage] Cleared session sprouts');
      }
      return success;
    } catch (error) {
      console.error('[SproutStorage] Failed to clear session:', error);
      return false;
    }
  }, [storage]);

  /**
   * Get sprouts count
   */
  const getSproutsCount = useCallback((): number => {
    return storage.sprouts.length;
  }, [storage.sprouts]);

  /**
   * Get session sprouts count
   */
  const getSessionSproutsCount = useCallback((): number => {
    return storage.sprouts.filter(s => s.sessionId === storage.sessionId).length;
  }, [storage]);

  return {
    // Data
    sessionId: storage.sessionId,

    // CRUD operations
    addSprout,
    getSprouts,
    getSessionSprouts,
    getSprout,
    updateSprout,
    deleteSprout,
    clearSessionSprouts,

    // Stats helpers
    getSproutsCount,
    getSessionSproutsCount
  };
}

export default useSproutStorage;
