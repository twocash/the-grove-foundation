// src/shared/inspector/hooks/useVersionedObject.ts
// React hook for versioned object management

import { useState, useEffect, useCallback } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch } from '@core/copilot/schema';
import {
  type VersionActor,
  type VersionSource,
  type ObjectVersion,
  type StoredObject,
  getVersionedObjectStore,
  generateChangeMessage,
} from '@core/versioning';

/**
 * Version metadata for display
 */
export interface VersionMetadata {
  ordinal: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}

/**
 * Return type for useVersionedObject hook
 */
export interface UseVersionedObjectResult {
  /** Current object state (from store or initial) */
  object: GroveObject;
  /** Version metadata (null before loading) */
  version: VersionMetadata | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Apply a patch and create a new version */
  applyPatch: (
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ) => Promise<ObjectVersion>;
  /** Refresh from store */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing versioned Grove objects.
 *
 * Features:
 * - Auto-imports object on first access
 * - Caches with localStorage for fast loads
 * - Persists edits to IndexedDB
 * - Provides version metadata for display
 *
 * @param objectId - Unique ID of the object
 * @param initialObject - Initial object state (for auto-import)
 */
export function useVersionedObject(
  objectId: string,
  initialObject: GroveObject
): UseVersionedObjectResult {
  const [storedObject, setStoredObject] = useState<StoredObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load on mount or when objectId changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const store = await getVersionedObjectStore();

        let stored = await store.get(objectId);

        // Auto-import if not found
        if (!stored) {
          await store.importObject(initialObject, {
            type: 'system',
            model: null,
          });
          stored = await store.get(objectId);
        }

        if (!cancelled) {
          setStoredObject(stored);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [objectId, initialObject]);

  // Apply patch and create new version
  const applyPatch = useCallback(
    async (
      patch: JsonPatch,
      actor: VersionActor,
      source: VersionSource,
      message?: string
    ): Promise<ObjectVersion> => {
      const store = await getVersionedObjectStore();

      // Generate message if not provided
      const changeMessage = message || generateChangeMessage(patch);

      // Apply patch and create version
      const version = await store.applyPatch(
        objectId,
        patch,
        actor,
        source,
        changeMessage
      );

      // Refresh stored object
      const updated = await store.get(objectId);
      setStoredObject(updated);

      return version;
    },
    [objectId]
  );

  // Refresh from store
  const refresh = useCallback(async () => {
    const store = await getVersionedObjectStore();
    const stored = await store.get(objectId);
    setStoredObject(stored);
  }, [objectId]);

  // Extract version metadata
  const version: VersionMetadata | null = storedObject
    ? {
        ordinal: storedObject.versionCount,
        lastModifiedAt: storedObject.lastModifiedAt,
        lastModifiedBy: storedObject.lastModifiedBy,
      }
    : null;

  return {
    object: storedObject?.current ?? initialObject,
    version,
    loading,
    error,
    applyPatch,
    refresh,
  };
}
