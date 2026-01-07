// src/bedrock/patterns/useCollectionView.ts
// Reusable hook for filter/sort/favorite collections
// Sprint: bedrock-foundation-v1

import { useState, useMemo, useCallback } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type {
  CollectionViewConfig,
  CollectionViewState,
  SortDirection,
} from './collection-view.types';

// =============================================================================
// Extended Config with External Filters
// =============================================================================

export interface CollectionViewOptions extends CollectionViewConfig {
  /**
   * External filters that override internal state.
   * When set, these filters are applied in addition to user-selected filters.
   * Useful for parent components that need to constrain the view.
   * Sprint: extraction-pipeline-integration-v1
   */
  externalFilters?: Record<string, string | string[]>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useCollectionView<T extends GroveObject>(
  objects: T[],
  config: CollectionViewOptions
): CollectionViewState<T> {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});

  // Sort state
  const [sortField, setSortField] = useState(config.defaultSort.field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(config.defaultSort.direction);

  // Favorites state (persisted to localStorage)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(config.favoritesStorageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // =============================================================================
  // Filter Actions
  // =============================================================================

  const setFilter = useCallback((key: string, value: string | string[]) => {
    setFilters(prev => {
      // Clear filter if empty
      if (value === '' || (Array.isArray(value) && value.length === 0)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // =============================================================================
  // Sort Actions
  // =============================================================================

  const setSort = useCallback((field: string, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // =============================================================================
  // Favorite Actions
  // =============================================================================

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(config.favoritesStorageKey, JSON.stringify([...next]));
      }
      return next;
    });
  }, [config.favoritesStorageKey]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  // =============================================================================
  // Selection Actions
  // =============================================================================

  const toggleSelected = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  // =============================================================================
  // Computed Results
  // =============================================================================

  const { results, filteredCount } = useMemo(() => {
    let filtered = objects;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(obj =>
        config.searchFields.some(field => {
          const value = getNestedValue(obj, field);
          return String(value ?? '').toLowerCase().includes(query);
        })
      );
    }

    // Merge external filters with internal filters (external takes precedence)
    // Sprint: extraction-pipeline-integration-v1
    const mergedFilters = { ...filters, ...(config.externalFilters || {}) };

    // Field filters
    for (const [key, value] of Object.entries(mergedFilters)) {
      filtered = filtered.filter(obj => {
        const objValue = getNestedValue(obj, key);

        // Handle multi-select filters (filter value is array)
        if (Array.isArray(value)) {
          // If object value is also an array, check for intersection
          if (Array.isArray(objValue)) {
            return value.some(v => objValue.includes(v));
          }
          return value.includes(String(objValue));
        }

        // Handle array object values (filter value is single string)
        if (Array.isArray(objValue)) {
          return objValue.includes(value);
        }

        return String(objValue) === value;
      });
    }

    // Count before favorites filter
    const countBeforeFavorites = filtered.length;

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(obj => favorites.has(obj.meta.id));
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aVal = getNestedValue(a, sortField);
      const bVal = getNestedValue(b, sortField);

      // Handle undefined/null
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      // Handle dates
      if (sortField.includes('At') || sortField.includes('Date')) {
        const aDate = new Date(aVal).getTime();
        const bDate = new Date(bVal).getTime();
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return { results: filtered, filteredCount: countBeforeFavorites };
  }, [objects, searchQuery, filters, config.externalFilters, showFavoritesOnly, favorites, sortField, sortDirection, config.searchFields]);

  // Select all visible items
  const selectAll = useCallback(() => {
    setSelected(new Set(results.map(obj => obj.meta.id)));
  }, [results]);

  // =============================================================================
  // Return State
  // =============================================================================

  return {
    // Results
    results,
    totalCount: objects.length,
    filteredCount,

    // Search
    searchQuery,
    setSearchQuery,

    // Filters
    filters,
    setFilter,
    clearFilters,
    activeFilterCount: Object.keys(filters).length,

    // Sort
    sortField,
    sortDirection,
    setSort,

    // Favorites
    favorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,

    // Selection
    selected,
    toggleSelected,
    selectAll,
    clearSelection,
    isSelected,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'meta.title') or getNestedValue(obj, 'payload.status')
 */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current == null) return undefined;
    if (typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

export { getNestedValue };
