// hooks/useVersionedCollection.ts
// Generic hook for versioned collections
// Sprint: versioned-collection-refactor-v1
//
// DEPRECATION NOTE (grove-data-layer-v1):
// For lens/journey data, prefer the new data layer hooks:
// - useLensPickerData (src/explore/hooks)
// - useJourneyListData (src/explore/hooks)
// - useGroveData (src/core/data)

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getVersionedObjectStore,
  type StoredObject,
  MERGE_CONFIGS,
  applyMergeConfig,
} from '../src/core/versioning';
import type { GroveObjectType } from '../src/core/schema/grove-object';

/**
 * Version metadata added to items with local modifications
 */
export interface VersionedMeta {
  versionOrdinal?: number;
  hasLocalModifications?: boolean;
}

interface UseVersionedCollectionOptions {
  /** Object type for merge config lookup */
  objectType: GroveObjectType;
}

interface UseVersionedCollectionResult<T> {
  /** Items with versioned overrides merged */
  items: (T & VersionedMeta)[];
  /** Loading state */
  loading: boolean;
  /** Force refresh from IndexedDB */
  refresh: () => void;
  /** Check if specific item has local modifications */
  hasModifications: (id: string) => boolean;
}

/**
 * Generic hook for loading versioned collections from IndexedDB.
 *
 * Merges versioned overrides from IndexedDB over schema items using
 * declarative merge configuration from MERGE_CONFIGS.
 *
 * @deprecated For lens/journey data, use the new data layer hooks instead:
 * - `useLensPickerData` from `src/explore/hooks`
 * - `useJourneyListData` from `src/explore/hooks`
 * - `useGroveData` from `@core/data` for direct CRUD
 *
 * @example
 * ```tsx
 * const { items: personas } = useVersionedCollection(schemaPersonas, { objectType: 'lens' });
 * const { items: journeys } = useVersionedCollection(schemaJourneys, { objectType: 'journey' });
 * ```
 */
export function useVersionedCollection<T extends { id: string }>(
  schemaItems: T[],
  options: UseVersionedCollectionOptions
): UseVersionedCollectionResult<T> {
  const { objectType } = options;
  const config = MERGE_CONFIGS[objectType];

  // Memoize item IDs to prevent effect re-runs on array reference changes
  const itemIds = useMemo(
    () => schemaItems.map(item => item.id).join(','),
    [schemaItems]
  );

  const [overrides, setOverrides] = useState<Map<string, StoredObject>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load versioned overrides from IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const store = await getVersionedObjectStore();
        const newOverrides = new Map<string, StoredObject>();

        for (const item of schemaItems) {
          const stored = await store.get(item.id);
          if (stored && stored.versionCount > 0) {
            newOverrides.set(item.id, stored);
          }
        }

        if (!cancelled) {
          setOverrides(newOverrides);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useVersionedCollection] Failed to load:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [itemIds, refreshKey]);

  // Merge schema items with versioned overrides
  const items = useMemo(() => {
    if (!config) {
      // No merge config for this type, return items as-is
      return schemaItems as (T & VersionedMeta)[];
    }

    return schemaItems.map((item) => {
      const stored = overrides.get(item.id);
      if (!stored) {
        return item as T & VersionedMeta;
      }
      return applyMergeConfig(item as T & Record<string, unknown>, stored, config);
    });
  }, [schemaItems, overrides, config]);

  // Force refresh from IndexedDB
  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Check if item has local modifications
  const hasModifications = useCallback(
    (id: string) => overrides.has(id),
    [overrides]
  );

  return { items, loading, refresh, hasModifications };
}
