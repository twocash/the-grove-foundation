// src/surface/hooks/useGroveObjects.ts
// Collection hook for Grove objects (Pattern 7: Object Model)

import { useMemo, useCallback } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { GroveObject, GroveObjectMeta, GroveObjectType } from '@core/schema/grove-object';
import { Journey } from '@core/schema/narrative';
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

// Future: normalizeHub, normalizeSprout, etc.

// ============================================================================
// HOOK
// ============================================================================

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

  // Normalize all objects
  const allObjects = useMemo(() => {
    const result: GroveObject[] = [];

    // Add journeys (if type filter allows)
    if (!types || types.includes('journey')) {
      Object.values(schema?.journeys ?? {}).forEach(j => {
        result.push(normalizeJourney(j));
      });
    }

    // Future: Add hubs, sprouts, etc.

    return result;
  }, [schema?.journeys, types]);

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
