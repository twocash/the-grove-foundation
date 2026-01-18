// src/bedrock/hooks/useQualityFilter.ts
// Quality filter state management with URL persistence
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Declarative Sovereignty - filter state persists to URL for deep linking

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { QualityFilterState, QualityFilterPreset } from '@core/schema';
import {
  parseQualityFilterFromURL,
  serializeQualityFilterToURL,
  QUALITY_FILTER_PRESETS,
  passesQualityFilter,
} from '@core/schema';
import type { SproutQualityMeta } from '@core/schema';

// =============================================================================
// Types
// =============================================================================

export interface UseQualityFilterOptions {
  /** Whether to persist filter state to URL */
  persistToURL?: boolean;
  /** Initial filter state (overridden by URL if persistToURL is true) */
  initialFilter?: QualityFilterState;
  /** URL parameter prefix (default: '') */
  urlPrefix?: string;
}

export interface UseQualityFilterResult {
  /** Current filter state */
  filter: QualityFilterState;
  /** Update the entire filter state */
  setFilter: (filter: QualityFilterState) => void;
  /** Update a single filter field */
  updateFilter: <K extends keyof QualityFilterState>(key: K, value: QualityFilterState[K]) => void;
  /** Apply a preset filter */
  applyPreset: (preset: QualityFilterPreset) => void;
  /** Clear all filters */
  clearFilter: () => void;
  /** Check if an item passes the current filter */
  passesFilter: (qualityMeta: SproutQualityMeta | undefined) => boolean;
  /** Detected active preset (if current filter matches a preset exactly) */
  activePreset: QualityFilterPreset | undefined;
  /** Whether any filter is active */
  hasActiveFilter: boolean;
  /** Number of active filter conditions */
  activeFilterCount: number;
}

// =============================================================================
// Default Filter State
// =============================================================================

const DEFAULT_FILTER: QualityFilterState = {
  includeUnscored: true,
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing quality filter state with optional URL persistence
 *
 * @example
 * ```tsx
 * const { filter, setFilter, passesFilter, activePreset } = useQualityFilter({
 *   persistToURL: true,
 * });
 *
 * // Filter a list of items
 * const filteredItems = items.filter(item => passesFilter(item.qualityMeta));
 *
 * // Apply a preset
 * <button onClick={() => applyPreset('top-performers')}>Top Performers</button>
 * ```
 */
export function useQualityFilter(options: UseQualityFilterOptions = {}): UseQualityFilterResult {
  const {
    persistToURL = false,
    initialFilter = DEFAULT_FILTER,
    urlPrefix = '',
  } = options;

  // Initialize state from URL if persistence is enabled
  const [filter, setFilterState] = useState<QualityFilterState>(() => {
    if (persistToURL && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlFilter = parseQualityFilterFromURL(params);
      // If URL has any quality params, use them; otherwise use initial
      const hasURLFilter = Object.keys(urlFilter).length > 0;
      return hasURLFilter ? urlFilter : initialFilter;
    }
    return initialFilter;
  });

  // Sync to URL when filter changes
  useEffect(() => {
    if (!persistToURL || typeof window === 'undefined') return;

    const currentParams = new URLSearchParams(window.location.search);
    const filterParams = serializeQualityFilterToURL(filter);

    // Remove old quality filter params
    ['quality', 'accuracy', 'utility', 'novelty', 'provenance', 'unscored'].forEach(key => {
      const prefixedKey = urlPrefix ? `${urlPrefix}${key}` : key;
      currentParams.delete(prefixedKey);
    });

    // Add new params
    filterParams.forEach((value, key) => {
      const prefixedKey = urlPrefix ? `${urlPrefix}${key}` : key;
      currentParams.set(prefixedKey, value);
    });

    // Update URL without navigation
    const newURL = currentParams.toString()
      ? `${window.location.pathname}?${currentParams.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newURL);
  }, [filter, persistToURL, urlPrefix]);

  // Set entire filter state
  const setFilter = useCallback((newFilter: QualityFilterState) => {
    setFilterState(newFilter);
  }, []);

  // Update single filter field
  const updateFilter = useCallback(<K extends keyof QualityFilterState>(
    key: K,
    value: QualityFilterState[K]
  ) => {
    setFilterState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Apply preset filter
  const applyPreset = useCallback((preset: QualityFilterPreset) => {
    const presetConfig = QUALITY_FILTER_PRESETS[preset];
    setFilterState({
      ...presetConfig.filter,
      // Clear dimension filters when applying preset
      minAccuracy: undefined,
      minUtility: undefined,
      minNovelty: undefined,
      minProvenance: undefined,
    });
  }, []);

  // Clear all filters
  const clearFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  // Check if item passes current filter
  const passesFilterFn = useCallback((qualityMeta: SproutQualityMeta | undefined) => {
    return passesQualityFilter(qualityMeta, filter);
  }, [filter]);

  // Detect active preset
  const activePreset = useMemo((): QualityFilterPreset | undefined => {
    const presets = Object.entries(QUALITY_FILTER_PRESETS) as [QualityFilterPreset, typeof QUALITY_FILTER_PRESETS[QualityFilterPreset]][];

    for (const [key, config] of presets) {
      const f = config.filter;
      if (
        f.minQuality === filter.minQuality &&
        f.includeUnscored === filter.includeUnscored &&
        !filter.minAccuracy &&
        !filter.minUtility &&
        !filter.minNovelty &&
        !filter.minProvenance
      ) {
        return key;
      }
    }
    return undefined;
  }, [filter]);

  // Check if any filter is active
  const hasActiveFilter = useMemo(() => {
    return (
      filter.minQuality !== undefined ||
      filter.minAccuracy !== undefined ||
      filter.minUtility !== undefined ||
      filter.minNovelty !== undefined ||
      filter.minProvenance !== undefined ||
      filter.includeUnscored === false
    );
  }, [filter]);

  // Count active filter conditions
  const activeFilterCount = useMemo(() => {
    return [
      filter.minQuality !== undefined,
      filter.minAccuracy !== undefined,
      filter.minUtility !== undefined,
      filter.minNovelty !== undefined,
      filter.minProvenance !== undefined,
      filter.includeUnscored === false,
    ].filter(Boolean).length;
  }, [filter]);

  return {
    filter,
    setFilter,
    updateFilter,
    applyPreset,
    clearFilter,
    passesFilter: passesFilterFn,
    activePreset,
    hasActiveFilter,
    activeFilterCount,
  };
}

export default useQualityFilter;
