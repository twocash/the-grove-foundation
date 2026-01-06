// src/bedrock/patterns/console-factory.tsx
// Factory function for creating Bedrock consoles
// Sprint: hotfix/console-factory

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import type { ViewMode } from '../components/ViewModeToggle';
import type {
  BedrockConsoleOptions,
  MetricData,
} from './console-factory.types';

// Hooks
import { useBedrockUI } from '../context/BedrockUIContext';
import { useCollectionView } from './useCollectionView';
import { usePatchHistory } from './usePatchHistory';

// Utils
import { toMaterialIcon } from '../utils/icon-mapping';

// Primitives
import { GlassButton } from '../primitives/GlassButton';
import { MetricsRow } from '../primitives/MetricsRow';
import { BedrockCopilot } from '../primitives/BedrockCopilot';

// Components
import { SearchInput } from '../components/SearchInput';
import { FilterBar } from '../components/FilterBar';
import { SortDropdown } from '../components/SortDropdown';
import { FavoritesFilter } from '../components/FavoriteToggle';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { ObjectList } from '../components/ObjectList';
import { NoResultsState, NoItemsState } from '../components/EmptyState';

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Creates a Bedrock console component for managing a collection of Grove objects.
 *
 * @template T - The payload type for the Grove object
 * @param options - Console configuration and components
 * @returns A React component that renders the complete console
 *
 * @example
 * ```tsx
 * export const LensWorkshop = createBedrockConsole<LensPayload>({
 *   config: lensWorkshopConfig,
 *   useData: useLensData,
 *   CardComponent: LensCard,
 *   EditorComponent: LensEditor,
 * });
 * ```
 */
export function createBedrockConsole<T>(
  options: BedrockConsoleOptions<T>
): React.ComponentType {
  const {
    config,
    useData,
    CardComponent,
    EditorComponent,
    EmptyStateComponent,
    copilotTitle = `${config.title} Copilot`,
    copilotPlaceholder = 'Edit with AI...',
  } = options;

  // The actual console component
  function BedrockConsole() {
    const { openInspector, closeInspector, updateInspector } = useBedrockUI();

    // Data layer
    const {
      objects,
      loading,
      error,
      create,
      update,
      remove,
      duplicate,
    } = useData();

    // Collection view state
    const collectionState = useCollectionView(objects, {
      searchFields: config.collectionView.searchFields,
      defaultSort: config.collectionView.defaultSort,
      favoritesStorageKey: config.collectionView.favoritesKey,
    });

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

    // Local UI state
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(
      config.collectionView.defaultViewMode
    );
    const [hasChanges, setHasChanges] = useState(false);

    // Patch history for undo/redo
    const patchHistory = usePatchHistory({ objectId: selectedId || undefined });

    // Selected object
    const selectedObject = useMemo(() => {
      if (!selectedId) return null;
      return objects.find((o) => o.meta.id === selectedId) || null;
    }, [objects, selectedId]);

    // Compute metrics from config
    const metricsData = useMemo((): MetricData[] => {
      return config.metrics.map((metric) => {
        let value: number | string = 0;

        // Parse simple query expressions
        if (metric.query === 'count(*)') {
          value = objects.length;
        } else if (metric.query.startsWith('count(where:')) {
          // Extract field and expected value: count(where: field=value) or count(where: !field)
          const match = metric.query.match(/count\(where:\s*(\!?)(\w+)(?:=(\w+))?\)/);
          if (match) {
            const negate = match[1] === '!';
            const field = match[2];
            const expectedValue = match[3]; // e.g., 'pending', 'complete'
            value = objects.filter((o) => {
              const fieldValue = (o.payload as Record<string, unknown>)[field];
              if (expectedValue) {
                // Check equality against expected value
                const matches = fieldValue === expectedValue;
                return negate ? !matches : matches;
              } else {
                // Check existence/truthiness
                return negate ? !fieldValue : Boolean(fieldValue);
              }
            }).length;
          }
        } else if (metric.query.startsWith('max(')) {
          // Get most recent date
          const field = metric.query.match(/max\((\w+)\)/)?.[1];
          if (field && objects.length > 0) {
            const sorted = [...objects].sort((a, b) => {
              const aVal = (a.meta as Record<string, unknown>)[field] as string;
              const bVal = (b.meta as Record<string, unknown>)[field] as string;
              return new Date(bVal).getTime() - new Date(aVal).getTime();
            });
            const mostRecent = new Date(
              (sorted[0].meta as Record<string, unknown>)[field] as string
            );
            const diffMs = Date.now() - mostRecent.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays === 0) value = 'Today';
            else if (diffDays === 1) value = 'Yesterday';
            else if (diffDays < 7) value = `${diffDays} days ago`;
            else value = mostRecent.toLocaleDateString();
          } else {
            value = 'Never';
          }
        }

        return { id: metric.id, value };
      });
    }, [objects, config.metrics]);

    // ==========================================================================
    // Handlers
    // ==========================================================================

    const handleSelect = useCallback((object: GroveObject<T>) => {
      setSelectedId(object.meta.id);
      setHasChanges(false);
    }, []);

    const handleEdit = useCallback(
      (operations: PatchOperation[]) => {
        if (!selectedObject) return;
        patchHistory.applyPatch(operations, selectedObject, 'user');
        update(selectedObject.meta.id, operations);
        setHasChanges(true);
      },
      [selectedObject, patchHistory, update]
    );

    const handleSave = useCallback(() => {
      setHasChanges(false);
    }, []);

    const handleDelete = useCallback(() => {
      if (!selectedObject) return;
      remove(selectedObject.meta.id);
      setSelectedId(null);
      closeInspector();
    }, [selectedObject, remove, closeInspector]);

    const handleDuplicate = useCallback(async () => {
      if (!selectedObject) return;
      const newObject = await duplicate(selectedObject);
      setSelectedId(newObject.meta.id);
    }, [selectedObject, duplicate]);

    const handleCreate = useCallback(async () => {
      const newObject = await create();
      setSelectedId(newObject.meta.id);
    }, [create]);

    // ==========================================================================
    // Inspector Registration
    // ==========================================================================

    // Track the last opened selection to prevent infinite loops
    const lastOpenedIdRef = useRef<string | null>(null);

    // Track object version to prevent unnecessary updates
    const lastObjectVersionRef = useRef<string | null>(null);

    // Build inspector config (memoized to prevent unnecessary re-renders)
    const inspectorConfig = useMemo(() => {
      if (!selectedObject) return null;
      return {
        title: selectedObject.meta.title || `Untitled ${config.title}`,
        subtitle: selectedObject.meta.description,
        icon: toMaterialIcon(selectedObject.meta.icon),
      };
    }, [selectedObject?.meta.title, selectedObject?.meta.description, selectedObject?.meta.icon, config.title]);

    // Open/close inspector when selection changes
    useEffect(() => {
      if (selectedId && selectedId !== lastOpenedIdRef.current && inspectorConfig) {
        lastOpenedIdRef.current = selectedId;
        // Reset version tracking for new selection
        lastObjectVersionRef.current = `${selectedObject?.meta.modified}-${loading}-${hasChanges}`;
        openInspector({
          ...inspectorConfig,
          content: (
            <EditorComponent
              object={selectedObject!}
              onEdit={handleEdit}
              onSave={handleSave}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              loading={loading}
              hasChanges={hasChanges}
            />
          ),
          copilot: config.copilot.enabled ? (
            <BedrockCopilot
              consoleId={config.id}
              object={selectedObject!}
              onApplyPatch={handleEdit}
              title={copilotTitle}
              placeholder={copilotPlaceholder}
              defaultCollapsed={true}
            />
          ) : undefined,
        });
      } else if (!selectedId && lastOpenedIdRef.current) {
        lastOpenedIdRef.current = null;
        lastObjectVersionRef.current = null;
        closeInspector();
      }
    }, [selectedId, selectedObject, inspectorConfig, loading, hasChanges, openInspector, closeInspector]);

    // Use refs for handlers to avoid dependency array issues
    const handleEditRef = useRef(handleEdit);
    const handleSaveRef = useRef(handleSave);
    const handleDeleteRef = useRef(handleDelete);
    const handleDuplicateRef = useRef(handleDuplicate);
    
    // Keep refs up to date
    useEffect(() => {
      handleEditRef.current = handleEdit;
      handleSaveRef.current = handleSave;
      handleDeleteRef.current = handleDelete;
      handleDuplicateRef.current = handleDuplicate;
    });

    // Update inspector content when object data changes (but selection stays same)
    // Uses version tracking to prevent infinite loops from reference changes
    useEffect(() => {
      if (selectedObject && selectedId === lastOpenedIdRef.current) {
        // Create a version key from object modified timestamp and UI state
        const currentVersion = `${selectedObject.meta.modified}-${loading}-${hasChanges}`;

        // Only update if version actually changed
        if (currentVersion !== lastObjectVersionRef.current) {
          lastObjectVersionRef.current = currentVersion;
          updateInspector({
            ...inspectorConfig,
            content: (
              <EditorComponent
                object={selectedObject}
                onEdit={(ops) => handleEditRef.current(ops)}
                onSave={() => handleSaveRef.current()}
                onDelete={() => handleDeleteRef.current()}
                onDuplicate={() => handleDuplicateRef.current()}
                loading={loading}
                hasChanges={hasChanges}
              />
            ),
          });
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      selectedId,
      selectedObject,
      loading,
      hasChanges,
      inspectorConfig,
      updateInspector,
    ]);

    // Close inspector on unmount
    useEffect(() => {
      return () => closeInspector();
    }, [closeInspector]);

    // ==========================================================================
    // Filter bar config
    // ==========================================================================

    const filterOptions = config.collectionView.filterOptions.map((opt) => ({
      key: opt.field,
      label: opt.label,
      multiple: false,
      values: opt.options?.map((v) => ({ value: v, label: v })) || [],
    }));

    const isFiltering =
      searchQuery.length > 0 || activeFilterCount > 0 || showFavoritesOnly;

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
      <div className="flex flex-col h-full">
        {/* Header with primary action */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div />
          {config.primaryAction && (
            <GlassButton
              onClick={handleCreate}
              variant="primary"
              size="sm"
              disabled={loading}
            >
              {config.primaryAction.icon && (
                <span className="material-symbols-outlined text-lg">
                  {config.primaryAction.icon}
                </span>
              )}
              {config.primaryAction.label}
            </GlassButton>
          )}
        </div>

        {/* Metrics Row */}
        {config.metrics.length > 0 && (
          <div className="px-6 py-4 border-b border-[var(--glass-border)]">
            <MetricsRow
              configs={config.metrics}
              data={metricsData}
              loading={loading}
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
              placeholder={`Search ${config.title.toLowerCase()}...`}
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

          {/* Favorites */}
          <FavoritesFilter
            showFavoritesOnly={showFavoritesOnly}
            onToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
            favoritesCount={favorites.size}
          />

          {/* Sort */}
          <SortDropdown
            sortOptions={config.collectionView.sortOptions.map((s) => ({
              field: s.field,
              label: s.label,
              defaultDirection: s.direction,
            }))}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={setSort}
          />

          {/* View Mode */}
          <ViewModeToggle
            mode={viewMode}
            onChange={setViewMode}
            availableModes={config.collectionView.viewModes}
          />
        </div>

        {/* Results info */}
        <div className="px-6 py-2 text-xs text-[var(--glass-text-muted)] border-b border-[var(--glass-border)]">
          {loading ? (
            'Loading...'
          ) : (
            <>
              Showing {results.length} of {totalCount}{' '}
              {config.title.toLowerCase()}
              {isFiltering && ` (${filteredCount} filtered)`}
            </>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : results.length === 0 ? (
            isFiltering ? (
              <NoResultsState
                description={`No ${config.title.toLowerCase()} match your search.`}
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
            ) : EmptyStateComponent ? (
              <EmptyStateComponent onCreate={handleCreate} />
            ) : (
              <NoItemsState
                title={`No ${config.title.toLowerCase()} yet`}
                description={`Create your first ${config.title.toLowerCase().slice(0, -1)} to get started.`}
                action={
                  config.primaryAction
                    ? {
                        label: config.primaryAction.label,
                        icon: config.primaryAction.icon,
                        onClick: handleCreate,
                      }
                    : undefined
                }
              />
            )
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((object) => (
                <CardComponent
                  key={object.meta.id}
                  object={object}
                  selected={selectedId === object.meta.id}
                  isFavorite={isFavorite(object.meta.id)}
                  onClick={() => handleSelect(object)}
                  onFavoriteToggle={() => toggleFavorite(object.meta.id)}
                />
              ))}
            </div>
          ) : (
            <ObjectList
              objects={results}
              columns={[
                {
                  key: 'title',
                  label: 'Name',
                  field: 'meta.title',
                  sortable: true,
                  width: '50%',
                },
                {
                  key: 'tier',
                  label: 'Tier',
                  render: (obj) => {
                    const tier = (obj.payload as Record<string, unknown>)?.tier as string;
                    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '—';
                  },
                  sortable: true,
                },
                {
                  key: 'embedding_status',
                  label: 'Embedded',
                  render: (obj) => {
                    const status = (obj.payload as Record<string, unknown>)?.embedding_status as string;
                    if (status === 'complete') return '✓ Yes';
                    if (status === 'error') return '✗ Error';
                    if (status === 'pending') return '○ Pending';
                    return '—';
                  },
                  sortable: true,
                },
                {
                  key: 'createdAt',
                  label: 'Added',
                  field: 'meta.createdAt',
                  sortable: true,
                },
              ]}
              selectedId={selectedId}
              favorites={favorites}
              onSelect={handleSelect}
              onFavoriteToggle={toggleFavorite}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field) => {
                const dir =
                  sortField === field
                    ? sortDirection === 'asc'
                      ? 'desc'
                      : 'asc'
                    : 'asc';
                setSort(field, dir);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Set display name for debugging
  BedrockConsole.displayName = `BedrockConsole(${config.id})`;

  return BedrockConsole;
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
          : ''
      }
    >
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
  );
}

export default createBedrockConsole;
