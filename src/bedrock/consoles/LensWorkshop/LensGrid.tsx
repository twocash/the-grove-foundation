// src/bedrock/consoles/LensWorkshop/LensGrid.tsx
// Lens grid/list content area with filtering controls
// Sprint: bedrock-foundation-v1 (Epic 5, Story 5.4)

import React from 'react';
import type { Lens } from '../../types/lens';
import type { CollectionViewState } from '../../patterns/collection-view.types';
import { LensCard } from './LensCard';
import { SearchInput } from '../../components/SearchInput';
import { FilterBar } from '../../components/FilterBar';
import { SortDropdown } from '../../components/SortDropdown';
import { FavoritesFilter } from '../../components/FavoriteToggle';
import { ViewModeToggle, type ViewMode } from '../../components/ViewModeToggle';
import { ObjectList, type ObjectListColumn } from '../../components/ObjectList';
import { NoResultsState, NoItemsState } from '../../components/EmptyState';
import { lensWorkshopConfig, LENS_CATEGORY_CONFIG } from './LensWorkshop.config';

// =============================================================================
// Types
// =============================================================================

export interface LensGridProps {
  /** Collection view state from useCollectionView */
  collectionState: CollectionViewState<Lens>;
  /** Currently selected lens ID */
  selectedId?: string | null;
  /** Callback when a lens is selected */
  onSelect?: (lens: Lens) => void;
  /** Callback to create a new lens */
  onCreate?: () => void;
  /** View mode (grid or list) */
  viewMode: ViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// List Column Definitions
// =============================================================================

const listColumns: ObjectListColumn<Lens['payload']>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '30%',
    sortable: true,
    render: (lens) => (
      <div className="flex items-center gap-3">
        {lens.payload.iconEmoji ? (
          <span className="text-lg">{lens.payload.iconEmoji}</span>
        ) : (
          <span className="material-symbols-outlined text-lg text-[var(--glass-text-muted)]">
            {LENS_CATEGORY_CONFIG[lens.payload.category]?.icon || 'filter_alt'}
          </span>
        )}
        <span className="font-medium">{lens.payload.name || lens.meta.title}</span>
      </div>
    ),
  },
  {
    key: 'category',
    label: 'Category',
    width: '15%',
    sortable: true,
    render: (lens) => (
      <span className="text-[var(--glass-text-muted)]">
        {LENS_CATEGORY_CONFIG[lens.payload.category]?.label || lens.payload.category}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '10%',
    render: (lens) => (
      lens.payload.isActive ? (
        <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
          Active
        </span>
      ) : (
        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
          Draft
        </span>
      )
    ),
  },
  {
    key: 'filters',
    label: 'Filters',
    width: '10%',
    align: 'center',
    render: (lens) => (
      <span className="text-[var(--glass-text-muted)]">
        {lens.payload.filters?.length || 0}
      </span>
    ),
  },
  {
    key: 'updated',
    label: 'Updated',
    width: '15%',
    sortable: true,
    field: 'meta.updatedAt',
  },
];

// =============================================================================
// Component
// =============================================================================

export function LensGrid({
  collectionState,
  selectedId,
  onSelect,
  onCreate,
  viewMode,
  onViewModeChange,
  loading = false,
  className = '',
}: LensGridProps) {
  const {
    results,
    totalCount,
    filteredCount,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    setSort,
    favorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
  } = collectionState;

  const config = lensWorkshopConfig.collectionView;

  // Build filter options for FilterBar
  const filterOptions = config.filterOptions.map((opt) => ({
    key: opt.field,
    label: opt.label,
    icon: undefined,
    multiple: false,
    values: opt.options?.map((v) => ({ value: v, label: v })) || [],
  }));

  // Check if we're actively filtering
  const isFiltering = searchQuery.length > 0 || activeFilterCount > 0 || showFavoritesOnly;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar - Quantum Glass styling for better contrast */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-[var(--glass-border-bright)] bg-[var(--glass-panel)]">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search lenses..."
          />
        </div>

        {/* Filters */}
        <FilterBar
          filterOptions={filterOptions}
          filters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Favorites Filter */}
        <FavoritesFilter
          showFavoritesOnly={showFavoritesOnly}
          onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
          favoritesCount={favorites.size}
        />

        {/* Sort */}
        <SortDropdown
          sortOptions={config.sortOptions.map((s) => ({
            field: s.field,
            label: s.label,
            defaultDirection: s.direction,
          }))}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={setSort}
        />

        {/* View Mode Toggle */}
        <ViewModeToggle
          mode={viewMode}
          onChange={onViewModeChange}
          availableModes={config.viewModes}
        />
      </div>

      {/* Results Info */}
      <div className="px-6 py-2 text-xs text-[var(--glass-text-muted)] border-b border-[var(--glass-border)]">
        {loading ? (
          'Loading...'
        ) : (
          <>
            Showing {results.length} of {totalCount} lenses
            {isFiltering && ` (${filteredCount} filtered)`}
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          // Loading skeleton
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : ''}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] p-4 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--glass-panel)]" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-[var(--glass-panel)] rounded mb-2" />
                    <div className="h-3 w-1/2 bg-[var(--glass-panel)] rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-[var(--glass-panel)] rounded mb-2" />
                <div className="h-3 w-2/3 bg-[var(--glass-panel)] rounded" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          // Empty state
          isFiltering ? (
            <NoResultsState
              description={`No lenses match your search. ${totalCount} total lenses available.`}
              action={{
                label: 'Clear filters',
                icon: 'filter_list_off',
                onClick: () => {
                  clearFilters();
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                },
              }}
            />
          ) : (
            <NoItemsState
              title="No lenses yet"
              description="Create your first lens to organize how content is presented."
              action={
                onCreate
                  ? {
                      label: 'Create Lens',
                      icon: 'add',
                      onClick: onCreate,
                    }
                  : undefined
              }
            />
          )
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((lens) => (
              <LensCard
                key={lens.meta.id}
                lens={lens}
                selected={selectedId === lens.meta.id}
                isFavorite={isFavorite(lens.meta.id)}
                onClick={() => onSelect?.(lens)}
                onFavoriteToggle={() => toggleFavorite(lens.meta.id)}
              />
            ))}
          </div>
        ) : (
          // List view
          <ObjectList
            objects={results}
            columns={listColumns}
            selectedId={selectedId}
            favorites={favorites}
            onSelect={onSelect}
            onFavoriteToggle={toggleFavorite}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field) => {
              const currentDir = sortField === field ? sortDirection : 'asc';
              setSort(field, currentDir === 'asc' ? 'desc' : 'asc');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default LensGrid;
