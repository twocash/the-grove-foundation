// src/bedrock/components/SchemaConsole.tsx
// Console Factory v2 - Schema-Driven Console Component
// Sprint: console-factory-v2
//
// DEX Principle: Declarative Sovereignty
// Entire console rendered from schema - no custom components needed.

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ConsoleSchema, ListSchema } from '../types/ConsoleSchema';
import type { BaseEntity } from '../services/types';
import { useConsoleData, type FilterState, type SortState } from '../hooks/useConsoleData';
import { useBedrockUI } from '../context/BedrockUIContext';
import { toFilterOptions, toSortOptions, getFieldValue } from '../utils/schema-adapters';
import { UniversalInspector } from './UniversalInspector';
import { getConsoleSchema } from '../config/consoles';

// Existing components
import { SearchInput } from './SearchInput';
import { FilterBar } from './FilterBar';
import { SortDropdown } from './SortDropdown';
import { FavoritesFilter } from './FavoriteToggle';
import { ViewModeToggle, type ViewMode } from './ViewModeToggle';
import { NoResultsState, NoItemsState } from './EmptyState';
import { MetricsRow } from '../primitives/MetricsRow';
import { GlassButton } from '../primitives/GlassButton';

// =============================================================================
// Types
// =============================================================================

export interface SchemaConsoleProps {
  /** Console schema ID or direct schema object */
  schema: string | ConsoleSchema;
  /** Optional external filters */
  externalFilters?: Record<string, string | string[]>;
  /** Optional header content slot */
  headerContent?: React.ReactNode;
  /** Optional external selection */
  externalSelectedId?: string | null;
}

// =============================================================================
// Universal Card Component
// =============================================================================

interface UniversalCardProps<T extends BaseEntity> {
  item: T;
  schema: ConsoleSchema;
  selected: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onFavoriteToggle: () => void;
}

function UniversalCard<T extends BaseEntity>({
  item,
  schema,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
}: UniversalCardProps<T>) {
  const listConfig = schema.list;
  const inspectorConfig = schema.inspector;

  // Get display values from item using schema paths
  const title = String(getFieldValue(item, inspectorConfig.titleField) || 'Untitled');
  const subtitle = inspectorConfig.subtitleField
    ? String(getFieldValue(item, inspectorConfig.subtitleField) || '')
    : undefined;

  // Get status if configured
  const isActive = inspectorConfig.statusField
    ? getFieldValue(item, inspectorConfig.statusField) === inspectorConfig.activeValue
    : undefined;

  // Get icon from item if available
  const iconValue = getFieldValue(item, 'meta.icon') || getFieldValue(item, 'icon');

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      className={`
        group relative rounded-xl border bg-[var(--glass-solid)] p-4
        transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-[var(--neon-cyan)] shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
        }
      `}
    >
      {/* Favorite Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10
          p-1 rounded-full hover:bg-[var(--glass-elevated)]
          ${isFavorite ? 'opacity-100' : ''}
        `}
      >
        <span className={`material-symbols-outlined text-lg ${isFavorite ? 'text-amber-400' : 'text-[var(--glass-text-muted)]'}`}>
          {isFavorite ? 'star' : 'star_border'}
        </span>
      </button>

      {/* Icon */}
      {iconValue && (
        <div className="mb-3 text-2xl">
          {typeof iconValue === 'string' && iconValue.length <= 2 ? (
            <span>{iconValue}</span>
          ) : (
            <span className="material-symbols-outlined text-[var(--neon-cyan)]">{iconValue}</span>
          )}
        </div>
      )}

      {/* Header: Title + Status */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] truncate flex-1">
          {title}
        </h3>
        {isActive !== undefined && (
          <span
            className={`
              px-2 py-0.5 text-xs rounded-full font-medium shrink-0
              ${isActive
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
              }
            `}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-[var(--glass-text-muted)] line-clamp-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
      }
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] p-4 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--glass-panel)]" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-[var(--glass-panel)] rounded mb-2" />
              <div className="h-3 w-1/2 bg-[var(--glass-panel)] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SchemaConsole<T extends BaseEntity>({
  schema: schemaInput,
  externalFilters,
  headerContent,
  externalSelectedId,
}: SchemaConsoleProps) {
  // Resolve schema from ID or use directly
  const schema = useMemo(() => {
    if (typeof schemaInput === 'string') {
      const resolved = getConsoleSchema(schemaInput);
      if (!resolved) {
        throw new Error(`Console schema not found: ${schemaInput}`);
      }
      return resolved;
    }
    return schemaInput;
  }, [schemaInput]);

  // BedrockUI context for inspector management
  const { openInspector, closeInspector, updateInspector } = useBedrockUI();

  // Data hook
  const data = useConsoleData<T>(schema);
  const {
    items,
    filteredItems,
    selectedItem,
    loading,
    error,
    filters,
    sort,
    searchQuery,
    draft,
    selectItem,
    setFilter,
    clearFilters,
    setSort,
    setSearchQuery,
    refresh,
    createItem,
    updateItem,
    deleteItem,
    loadDraft,
    updateDraft,
    saveDraft,
    resetDraft,
    getMetricValue,
  } = data;

  // Local UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(`${schema.id}-favorites`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Track last opened selection to prevent infinite loops
  const lastOpenedIdRef = useRef<string | null>(null);

  // Sync external selection
  useEffect(() => {
    if (externalSelectedId !== undefined && externalSelectedId !== null) {
      selectItem(externalSelectedId);
    }
  }, [externalSelectedId, selectItem]);

  // Favorites management
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(`${schema.id}-favorites`, JSON.stringify([...next]));
      return next;
    });
  }, [schema.id]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  // Apply favorites filter to results
  const displayItems = useMemo(() => {
    if (!showFavoritesOnly) return filteredItems;
    return filteredItems.filter((item) => favorites.has(item.id));
  }, [filteredItems, showFavoritesOnly, favorites]);

  // Compute metrics
  const metricsData = useMemo(() => {
    if (!schema.metrics) return [];
    return schema.metrics.map((metric) => ({
      id: metric.id,
      value: getMetricValue(metric.query),
    }));
  }, [schema.metrics, getMetricValue]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSelect = useCallback(
    (item: T) => {
      selectItem(item.id);
      loadDraft(item);
    },
    [selectItem, loadDraft]
  );

  const handleCreate = useCallback(async () => {
    // Create with default values - implementation depends on schema
    const defaultValues = {} as Omit<T, 'id'>;
    const result = await createItem(defaultValues);
    if (result.success && result.data) {
      selectItem(result.data.id);
      loadDraft(result.data);
    }
  }, [createItem, selectItem, loadDraft]);

  const handleSave = useCallback(async () => {
    await saveDraft();
  }, [saveDraft]);

  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    await deleteItem(selectedItem.id);
    selectItem(null);
    closeInspector();
  }, [selectedItem, deleteItem, selectItem, closeInspector]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedItem) return;
    // Create a copy of the selected item
    const { id, ...rest } = selectedItem as T & { id: string };
    const result = await createItem(rest as Omit<T, 'id'>);
    if (result.success && result.data) {
      selectItem(result.data.id);
      loadDraft(result.data);
    }
  }, [selectedItem, createItem, selectItem, loadDraft]);

  const handleClose = useCallback(() => {
    selectItem(null);
    closeInspector();
  }, [selectItem, closeInspector]);

  // Handle field update in draft
  const handleUpdateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      updateDraft(field, value);
    },
    [updateDraft]
  );

  // ==========================================================================
  // Inspector Registration
  // ==========================================================================

  useEffect(() => {
    if (selectedItem && selectedItem.id !== lastOpenedIdRef.current) {
      lastOpenedIdRef.current = selectedItem.id;
      openInspector({
        title: String(getFieldValue(selectedItem, schema.inspector.titleField) || 'Details'),
        subtitle: schema.inspector.subtitleField
          ? String(getFieldValue(selectedItem, schema.inspector.subtitleField) || '')
          : undefined,
        content: (
          <UniversalInspector
            schema={schema}
            item={selectedItem}
            draft={draft}
            onUpdateField={handleUpdateField}
            onClose={handleClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            loading={loading.saving}
          />
        ),
      });
    } else if (!selectedItem && lastOpenedIdRef.current) {
      lastOpenedIdRef.current = null;
      closeInspector();
    }
  }, [
    selectedItem,
    schema,
    draft,
    loading.saving,
    handleUpdateField,
    handleClose,
    handleSave,
    handleDelete,
    handleDuplicate,
    openInspector,
    closeInspector,
  ]);

  // Update inspector when draft changes
  useEffect(() => {
    if (selectedItem && selectedItem.id === lastOpenedIdRef.current) {
      updateInspector({
        title: String(getFieldValue(draft.draft || selectedItem, schema.inspector.titleField) || 'Details'),
        content: (
          <UniversalInspector
            schema={schema}
            item={selectedItem}
            draft={draft}
            onUpdateField={handleUpdateField}
            onClose={handleClose}
            onSave={handleSave}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            loading={loading.saving}
          />
        ),
      });
    }
  }, [draft, selectedItem, schema, loading.saving, handleUpdateField, handleClose, handleSave, handleDelete, handleDuplicate, updateInspector]);

  // Close inspector on unmount
  useEffect(() => {
    return () => closeInspector();
  }, [closeInspector]);

  // ==========================================================================
  // Filter Options
  // ==========================================================================

  const filterOptions = useMemo(() => toFilterOptions(schema.filters), [schema.filters]);
  const sortOptions = useMemo(() => toSortOptions(schema.list.sortOptions), [schema.list.sortOptions]);

  const isFiltering = searchQuery.length > 0 || Object.values(filters).some(Boolean) || showFavoritesOnly;

  // ==========================================================================
  // Render
  // ==========================================================================

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 text-sm bg-[var(--glass-elevated)] rounded-lg hover:bg-[var(--glass-panel)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          {headerContent}
        </div>
        <GlassButton onClick={handleCreate} variant="primary" size="sm" disabled={loading.fetching}>
          <span className="material-symbols-outlined text-lg">add</span>
          New {schema.identity.title.replace(/s$/, '')}
        </GlassButton>
      </div>

      {/* Metrics Row */}
      {schema.metrics && schema.metrics.length > 0 && (
        <div className="px-6 py-4 border-b border-[var(--glass-border)]">
          <MetricsRow
            configs={schema.metrics.map((m) => ({
              id: m.id,
              label: m.label,
              icon: m.icon,
              query: m.query,
            }))}
            data={metricsData}
            loading={loading.fetching}
          />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-[var(--glass-border-bright)] bg-[var(--glass-panel)]">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${schema.identity.title.toLowerCase()}...`}
          />
        </div>

        {/* Filters */}
        <FilterBar
          filterOptions={filterOptions}
          filters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          activeFilterCount={Object.values(filters).filter(Boolean).length}
        />

        {/* Favorites */}
        <FavoritesFilter
          showFavoritesOnly={showFavoritesOnly}
          onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
          favoritesCount={favorites.size}
        />

        {/* Sort */}
        <SortDropdown
          sortOptions={sortOptions}
          sortField={sort.field}
          sortDirection={sort.direction}
          onSortChange={(field, direction) => setSort({ field, direction })}
        />

        {/* View Mode */}
        {schema.list.viewToggle && (
          <ViewModeToggle
            mode={viewMode}
            onChange={setViewMode}
            availableModes={['grid', 'list']}
          />
        )}
      </div>

      {/* Results info */}
      <div className="px-6 py-2 text-xs text-[var(--glass-text-muted)] border-b border-[var(--glass-border)]">
        {loading.fetching ? (
          'Loading...'
        ) : (
          <>
            Showing {displayItems.length} of {items.length} {schema.identity.title.toLowerCase()}
            {isFiltering && ` (filtered)`}
          </>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading.fetching ? (
          <LoadingSkeleton viewMode={viewMode} />
        ) : displayItems.length === 0 ? (
          isFiltering ? (
            <NoResultsState
              description={`No ${schema.identity.title.toLowerCase()} match your search.`}
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
              title={`No ${schema.identity.title.toLowerCase()} yet`}
              description={`Create your first ${schema.identity.title.toLowerCase().replace(/s$/, '')} to get started.`}
              action={{
                label: `New ${schema.identity.title.replace(/s$/, '')}`,
                icon: 'add',
                onClick: handleCreate,
              }}
            />
          )
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayItems.map((item) => (
              <UniversalCard
                key={item.id}
                item={item}
                schema={schema}
                selected={selectedItem?.id === item.id}
                isFavorite={isFavorite(item.id)}
                onClick={() => handleSelect(item)}
                onFavoriteToggle={() => toggleFavorite(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`
                  flex items-center gap-4 p-3 rounded-lg cursor-pointer
                  transition-colors
                  ${selectedItem?.id === item.id
                    ? 'bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30'
                    : 'hover:bg-[var(--glass-elevated)] border border-transparent'
                  }
                `}
              >
                <span className="text-sm font-medium text-[var(--glass-text-primary)] flex-1">
                  {String(getFieldValue(item, schema.inspector.titleField) || 'Untitled')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className="p-1 rounded hover:bg-[var(--glass-panel)]"
                >
                  <span className={`material-symbols-outlined text-sm ${isFavorite(item.id) ? 'text-amber-400' : 'text-[var(--glass-text-muted)]'}`}>
                    {isFavorite(item.id) ? 'star' : 'star_border'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaConsole;
