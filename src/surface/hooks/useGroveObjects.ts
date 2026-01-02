// src/surface/hooks/useGroveObjects.ts
// Collection hook for Grove objects (Pattern 7: Object Model)
//
// DEPRECATION NOTE (grove-data-layer-v1):
// This hook uses the legacy useNarrativeEngine pattern.
// For new code, prefer the unified data layer:
// - useGroveData (src/core/data) for CRUD operations
// - useLensPickerData / useJourneyListData (src/explore/hooks) for runtime

import { useMemo, useCallback } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { GroveObject, GroveObjectMeta, GroveObjectType } from '@core/schema/grove-object';
import { Journey, TopicHub } from '@core/schema/narrative';
import { getFavorites, setFavorite as storeFavorite, isFavorite } from '../../lib/storage/user-preferences';

// ============================================================================
// TYPES
// ============================================================================

export interface UseGroveObjectsOptions {
  types?: GroveObjectType[];
  status?: ('active' | 'draft' | 'archived')[];
  tags?: string[];
  favorite?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UseGroveObjectsResult {
  objects: GroveObject[];
  loading: boolean;
  error: string | null;

  // Actions
  setFavorite: (id: string, favorite: boolean) => void;
  isFavorite: (id: string) => boolean;
}

// ============================================================================
// NORMALIZERS
// ============================================================================

function normalizeJourney(journey: Journey): GroveObject<Journey> {
  return {
    meta: {
      id: journey.id,
      type: 'journey',
      title: journey.title,
      description: journey.description,
      icon: journey.icon,
      color: journey.color,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
      status: journey.status,
      tags: journey.tags,
      favorite: isFavorite(journey.id),
    },
    payload: journey,
  };
}

function normalizeHub(hub: TopicHub): GroveObject<TopicHub> {
  return {
    meta: {
      id: hub.id,
      type: 'hub',
      title: hub.title,
      description: hub.expertFraming,
      icon: hub.icon,
      color: hub.color,
      createdAt: hub.createdAt,
      updatedAt: hub.updatedAt,
      createdBy: hub.createdBy,
      status: hub.status,
      tags: hub.tags,
      favorite: isFavorite(hub.id),
    },
    payload: hub,
  };
}

// Future: normalizeSprout, etc.

// ============================================================================
// HOOK
// ============================================================================

/**
 * Collection hook for Grove objects.
 *
 * @deprecated This hook uses the legacy useNarrativeEngine pattern.
 * For new code, prefer the unified data layer:
 * - `useGroveData` from `@core/data` for CRUD operations
 * - `useLensPickerData` / `useJourneyListData` from `src/explore/hooks` for runtime
 */
export function useGroveObjects(options: UseGroveObjectsOptions = {}): UseGroveObjectsResult {
  const { schema, loading } = useNarrativeEngine();

  const {
    types,
    status,
    tags,
    favorite,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;

  // Get hubs from schema (could be Record or from globalSettings.topicHubs array)
  const hubs = useMemo(() => {
    if (schema?.hubs) return schema.hubs;
    // Fallback: convert array to Record if using legacy format
    const topicHubsArray = schema?.globalSettings?.topicHubs;
    if (topicHubsArray && Array.isArray(topicHubsArray)) {
      return Object.fromEntries(topicHubsArray.map(h => [h.id, h]));
    }
    return {};
  }, [schema?.hubs, schema?.globalSettings?.topicHubs]);

  // Normalize all objects
  const allObjects = useMemo(() => {
    const result: GroveObject[] = [];

    // Add journeys (if type filter allows)
    if (!types || types.includes('journey')) {
      Object.values(schema?.journeys ?? {}).forEach(j => {
        result.push(normalizeJourney(j));
      });
    }

    // Add hubs (if type filter allows)
    if (!types || types.includes('hub')) {
      Object.values(hubs).forEach(h => {
        result.push(normalizeHub(h));
      });
    }

    // Future: Add sprouts, etc.

    return result;
  }, [schema?.journeys, hubs, types]);

  // Apply filters
  const filteredObjects = useMemo(() => {
    let result = allObjects;

    if (status?.length) {
      result = result.filter(o => o.meta.status && status.includes(o.meta.status as 'active' | 'draft' | 'archived'));
    }

    if (tags?.length) {
      result = result.filter(o =>
        o.meta.tags?.some(t => tags.includes(t))
      );
    }

    if (favorite !== undefined) {
      result = result.filter(o => o.meta.favorite === favorite);
    }

    return result;
  }, [allObjects, status, tags, favorite]);

  // Sort
  const sortedObjects = useMemo(() => {
    const sorted = [...filteredObjects];

    sorted.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'title') {
        comparison = a.meta.title.localeCompare(b.meta.title);
      } else {
        const aDate = a.meta[sortBy] ?? '';
        const bDate = b.meta[sortBy] ?? '';
        comparison = aDate.localeCompare(bDate);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [filteredObjects, sortBy, sortOrder]);

  // Actions
  const handleSetFavorite = useCallback((id: string, fav: boolean) => {
    storeFavorite(id, fav);
    // Note: This doesn't trigger re-render.
    // For reactivity, would need state or context.
  }, []);

  return {
    objects: sortedObjects,
    loading,
    error: null,
    setFavorite: handleSetFavorite,
    isFavorite,
  };
}
