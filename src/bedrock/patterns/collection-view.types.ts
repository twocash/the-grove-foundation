// src/bedrock/patterns/collection-view.types.ts
// Type definitions for the Collection View pattern
// Sprint: bedrock-foundation-v1

import type { GroveObject } from '../../core/schema/grove-object';

// =============================================================================
// Filter Types
// =============================================================================

/**
 * A single filter option value
 */
export interface FilterValue {
  /** The actual value to filter by */
  value: string;
  /** Display label for the UI */
  label: string;
  /** Optional count of matching items */
  count?: number;
}

/**
 * Configuration for a filterable field
 */
export interface FilterOption {
  /** Field key (supports dot notation for nested fields) */
  key: string;
  /** Display label for the filter group */
  label: string;
  /** Available filter values */
  values: FilterValue[];
  /** Optional icon for the filter group */
  icon?: string;
  /** Whether this filter supports multiple selection */
  multiple?: boolean;
}

// =============================================================================
// Sort Types
// =============================================================================

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Configuration for a sortable field
 */
export interface SortOption {
  /** Field key (supports dot notation for nested fields) */
  field: string;
  /** Display label */
  label: string;
  /** Default direction when first selected */
  defaultDirection?: SortDirection;
}

// =============================================================================
// Collection View Config
// =============================================================================

/**
 * Full configuration for a collection view
 */
export interface CollectionViewConfig {
  /** Fields to search across (supports dot notation) */
  searchFields: string[];

  /** Available filters */
  filterOptions: FilterOption[];

  /** Available sort options */
  sortOptions: SortOption[];

  /** Default sort configuration */
  defaultSort: {
    field: string;
    direction: SortDirection;
  };

  /** Default filter values applied on initial load */
  defaultFilters?: Record<string, string | string[]>;

  /** localStorage key for favorites persistence */
  favoritesStorageKey: string;

  /** Optional: Debounce delay for search (ms) */
  searchDebounceMs?: number;

  /** Optional: Enable keyboard navigation */
  keyboardNavigation?: boolean;
}

// =============================================================================
// Collection View State
// =============================================================================

/**
 * State returned by useCollectionView hook
 */
export interface CollectionViewState<T extends GroveObject> {
  // Results
  /** Filtered and sorted results */
  results: T[];
  /** Total count before filtering */
  totalCount: number;
  /** Filtered count (before favorites filter) */
  filteredCount: number;

  // Search
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;

  // Filters
  /** Active filters */
  filters: Record<string, string | string[]>;
  /** Set a filter value */
  setFilter: (key: string, value: string | string[]) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Number of active filters */
  activeFilterCount: number;

  // Sort
  /** Current sort field */
  sortField: string;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Set sort field and direction */
  setSort: (field: string, direction: SortDirection) => void;

  // Favorites
  /** Set of favorite IDs */
  favorites: Set<string>;
  /** Toggle favorite status */
  toggleFavorite: (id: string) => void;
  /** Check if item is favorited */
  isFavorite: (id: string) => boolean;
  /** Show only favorites */
  showFavoritesOnly: boolean;
  /** Set show favorites only */
  setShowFavoritesOnly: (show: boolean) => void;

  // Selection (optional, for bulk operations)
  /** Selected item IDs */
  selected: Set<string>;
  /** Toggle selection */
  toggleSelected: (id: string) => void;
  /** Select all visible */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Check if item is selected */
  isSelected: (id: string) => boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  /** Filter configuration */
  filterOptions: FilterOption[];
  /** Active filters */
  filters: Record<string, string | string[]>;
  /** Callback when filter changes */
  onFilterChange: (key: string, value: string | string[]) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** Number of active filters */
  activeFilterCount: number;
}

/**
 * Props for SortDropdown component
 */
export interface SortDropdownProps {
  /** Sort options */
  sortOptions: SortOption[];
  /** Current sort field */
  sortField: string;
  /** Current sort direction */
  sortDirection: SortDirection;
  /** Callback when sort changes */
  onSortChange: (field: string, direction: SortDirection) => void;
}

/**
 * Props for FavoriteToggle component
 */
export interface FavoriteToggleProps {
  /** Whether item is favorited */
  isFavorite: boolean;
  /** Callback to toggle */
  onToggle: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label */
  label?: string;
}

/**
 * Props for SearchInput component
 */
export interface SearchInputProps {
  /** Current value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay (ms) */
  debounceMs?: number;
}
