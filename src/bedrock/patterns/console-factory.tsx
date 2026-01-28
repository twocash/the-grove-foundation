// src/bedrock/patterns/console-factory.tsx
// Factory function for creating Bedrock consoles
// Sprint: hotfix/console-factory
//
// =============================================================================
// ARCHITECTURE NOTE: Input Race Condition in Inspector Editors
// =============================================================================
//
// The console factory uses version tracking (line ~329) to re-render the inspector
// when object data changes. This creates a race condition with controlled inputs:
//
//   1. User types in input field
//   2. onChange fires, calling onEdit([patch])
//   3. Parent updates state, changing `updatedAt`
//   4. Version tracking detects change, triggers updateInspector()
//   5. Editor re-renders with potentially stale prop values
//   6. Characters are lost or duplicated
//
// SOLUTION: Use BufferedInput/BufferedTextarea from '@bedrock/primitives'
//
// These components buffer input state locally and sync to parent:
//   - On blur (user leaves field)
//   - After debounce timeout (user pauses typing)
//   - Never while user is actively typing
//
// @see src/bedrock/primitives/BufferedInput.tsx
// @see docs/hotfixes/HOTFIX-002-inspector-input-race.md
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import type { ViewMode } from '../components/ViewModeToggle';
import type {
  BedrockConsoleOptions,
  BedrockConsoleProps,
  MetricData,
  SingletonOps,
} from './console-factory.types';

// Hooks
import { useBedrockUI } from '../context/BedrockUIContext';
import { useCollectionView, getNestedValue } from './useCollectionView';
import { usePatchHistory } from './usePatchHistory';

// Utils
import { toMaterialIcon } from '../utils/icon-mapping';
import {
  getNestedValue as getNestedFieldValue,
  toJsonPointer,
} from '../utils/nested-field';

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
import { CreateDropdown } from '../components/CreateDropdown';
import { TypeAwareEmptyState } from '../components/TypeAwareEmptyState';

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
): React.ComponentType<BedrockConsoleProps> {
  const {
    config,
    useData,
    CardComponent,
    EditorComponent,
    EmptyStateComponent,
    copilotTitle = `${config.title} Copilot`,
    copilotPlaceholder = 'Edit with AI...',
    actionHandler,
    createOptions,
  } = options;

  // The actual console component
  // Sprint: extraction-pipeline-integration-v1 - Added props support for external filters and selection
  function BedrockConsole({ externalFilters, headerContent, externalSelectedId }: BedrockConsoleProps) {
    const { openInspector, closeInspector, updateInspector, metricsBarVisible } = useBedrockUI();

    // Data layer
    // Sprint: experience-console-cleanup-v1 - added createTyped for polymorphic consoles
    // Sprint: prompt-template-architecture-v1 - added refetch for fork flow sync
    const {
      objects,
      loading,
      error,
      create,
      update,
      remove,
      duplicate,
      createTyped,
      refetch,
    } = useData();

    // Collection view state
    // Sprint: extraction-pipeline-integration-v1 - Pass external filters from props
    // Sprint: experience-console-cleanup-v1 - Pass custom filter match functions
    const customFilterFns = useMemo(() => {
      const fns: Record<string, (obj: unknown, filterValue: string) => boolean> = {};
      for (const opt of config.collectionView.filterOptions) {
        if (opt.matchFn) {
          fns[opt.field] = opt.matchFn;
        }
      }
      return Object.keys(fns).length > 0 ? fns : undefined;
    }, [config.collectionView.filterOptions]);

    const collectionState = useCollectionView(objects, {
      searchFields: config.collectionView.searchFields,
      defaultSort: config.collectionView.defaultSort,
      favoritesStorageKey: config.collectionView.favoritesKey,
      externalFilters,
      customFilterFns,
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

    // Copilot input state (for external population, e.g., from Fix/Refine buttons)
    const [copilotInput, setCopilotInput] = useState<string | undefined>(undefined);
    const clearCopilotInput = useCallback(() => setCopilotInput(undefined), []);

    // Sprint: extraction-pipeline-integration-v1 - Sync external selection with internal state
    // When externalSelectedId changes, update internal selection to open inspector
    useEffect(() => {
      if (externalSelectedId !== undefined && externalSelectedId !== selectedId) {
        setSelectedId(externalSelectedId);
        setHasChanges(false);
      }
    }, [externalSelectedId]);

    // S27-OT-FIX: Reset hasChanges when selection changes programmatically
    // This covers the fork flow where onSelectObject(id) calls setSelectedId directly
    // without going through handleSelect (which already resets hasChanges)
    const prevSelectedIdRef = useRef<string | null>(null);
    useEffect(() => {
      if (selectedId !== prevSelectedIdRef.current) {
        // Only reset if we're switching to a DIFFERENT object (not initial mount)
        if (prevSelectedIdRef.current !== null) {
          setHasChanges(false);
        }
        prevSelectedIdRef.current = selectedId;
      }
    }, [selectedId]);

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
          // Sprint: experience-console-cleanup-v1 — support dotted paths (e.g., meta.status)
          const match = metric.query.match(/count\(where:\s*(\!?)([\w.]+)(?:=([\w-]+))?\)/);
          if (match) {
            const negate = match[1] === '!';
            const field = match[2];
            const expectedValue = match[3]; // e.g., 'pending', 'complete', 'active'
            value = objects.filter((o) => {
              const fieldValue = getNestedValue(o, field);
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
      async (operations: PatchOperation[]) => {
        if (!selectedObject) return;
        patchHistory.applyPatch(operations, selectedObject, 'user');
        await update(selectedObject.meta.id, operations);
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

    // Sprint: singleton-pattern-factory-v1 - Singleton-aware duplicate
    // When duplicating a singleton, always create as draft with reset versioning
    const handleDuplicate = useCallback(async () => {
      if (!selectedObject) return;

      let overrides: Record<string, unknown> | undefined;

      if (config.singleton?.enabled) {
        const { statusField, draftValue, versioning } = config.singleton;
        overrides = {};

        // Force draft status
        overrides[statusField] = draftValue;

        // Reset versioning if configured
        if (versioning) {
          overrides[versioning.versionField] = 1;
          overrides[versioning.previousIdField] = undefined;
          if (versioning.changelogField) {
            overrides[versioning.changelogField] = undefined;
          }
        }
      }

      const newObject = await duplicate(selectedObject, overrides);
      setSelectedId(newObject.meta.id);
    }, [selectedObject, duplicate, config.singleton]);

    const handleCreate = useCallback(async () => {
      const newObject = await create();
      setSelectedId(newObject.meta.id);
    }, [create]);

    // Sprint: experience-console-cleanup-v1 - Typed create for polymorphic consoles
    const handleCreateTyped = useCallback(async (type: string) => {
      if (createTyped) {
        const newObject = await createTyped(type);
        setSelectedId(newObject.meta.id);
      } else {
        // Fallback to default create if createTyped not available
        const newObject = await create();
        setSelectedId(newObject.meta.id);
      }
    }, [create, createTyped]);

    // ==========================================================================
    // Singleton Operations
    // Sprint: singleton-pattern-factory-v1
    // ==========================================================================

    // Compute singleton state for selected object
    const singletonOps = useMemo((): SingletonOps | undefined => {
      if (!config.singleton?.enabled || !selectedObject) return undefined;

      const { statusField, activeValue, draftValue, archivedValue, typeField } = config.singleton;
      const currentStatus = getNestedFieldValue<string>(selectedObject, statusField);
      const currentType = typeField ? getNestedFieldValue<string>(selectedObject, typeField) : null;

      // Determine state
      const isActive = currentStatus === activeValue;
      const isDraft = currentStatus === draftValue;
      const isArchived = currentStatus === archivedValue;

      // Activate: archive current active of same type, then set this to active
      const activate = async () => {
        if (!selectedObject) return;

        // Find current active of same type
        const currentActive = objects.find(o => {
          if (o.meta.id === selectedObject.meta.id) return false;
          const objStatus = getNestedFieldValue<string>(o, statusField);
          if (objStatus !== activeValue) return false;
          // Check type match for polymorphic consoles
          if (typeField) {
            const objType = getNestedFieldValue<string>(o, typeField);
            return objType === currentType;
          }
          return true;
        });

        // Archive-first pattern: archive old before activating new
        if (currentActive) {
          await update(currentActive.meta.id, [
            { op: 'replace', path: toJsonPointer(statusField), value: archivedValue },
          ]);
        }

        // Activate target
        await update(selectedObject.meta.id, [
          { op: 'replace', path: toJsonPointer(statusField), value: activeValue },
        ]);

        // Cache invalidation if configured
        if (config.singleton.cacheInvalidationEndpoint) {
          try {
            await fetch(config.singleton.cacheInvalidationEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: config.singleton.cacheInvalidationType }),
            });
          } catch (err) {
            console.warn('[Console] Cache invalidation failed:', err);
          }
        }

        setHasChanges(false);
      };

      // Archive: set status to archived
      const archive = async () => {
        if (!selectedObject) return;
        await update(selectedObject.meta.id, [
          { op: 'replace', path: toJsonPointer(statusField), value: archivedValue },
        ]);
        setHasChanges(false);
      };

      // Restore as draft: set status to draft
      const restoreAsDraft = async () => {
        if (!selectedObject) return;
        await update(selectedObject.meta.id, [
          { op: 'replace', path: toJsonPointer(statusField), value: draftValue },
        ]);
        setHasChanges(false);
      };

      return {
        isActive,
        isDraft,
        isArchived,
        activate,
        archive,
        restoreAsDraft,
      };
    }, [config.singleton, selectedObject, objects, update]);

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
      console.log('[Inspector Effect] selectedId:', selectedId, 'lastOpened:', lastOpenedIdRef.current, 'inspectorConfig:', !!inspectorConfig, 'selectedObject:', !!selectedObject);
      if (selectedId && selectedId !== lastOpenedIdRef.current && inspectorConfig) {
        console.log('[Inspector Effect] Opening inspector for:', selectedId);
        lastOpenedIdRef.current = selectedId;
        // Reset version tracking for new selection
        lastObjectVersionRef.current = `${selectedObject?.meta.updatedAt}-${loading}-${hasChanges}`;
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
              onSetCopilotInput={setCopilotInput}
              onSelectObject={setSelectedId}
              singletonOps={singletonOps}
              onRefresh={refetch}
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
              externalInput={copilotInput}
              onExternalInputConsumed={clearCopilotInput}
              onAction={actionHandler ? async (actionId, userInput) => {
                return actionHandler(actionId, userInput, {
                  consoleId: config.id,
                  selectedObject: selectedObject!,
                  objects,
                });
              } : undefined}
              quickActions={config.copilot.quickActions}
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
    const setCopilotInputRef = useRef(setCopilotInput);

    // Keep refs up to date
    useEffect(() => {
      handleEditRef.current = handleEdit;
      handleSaveRef.current = handleSave;
      handleDeleteRef.current = handleDelete;
      handleDuplicateRef.current = handleDuplicate;
      setCopilotInputRef.current = setCopilotInput;
    });

    // Update inspector content when object data changes (but selection stays same)
    // Uses version tracking to prevent infinite loops from reference changes
    useEffect(() => {
      if (selectedObject && selectedId === lastOpenedIdRef.current) {
        // Create a version key from object modified timestamp and UI state
        const currentVersion = `${selectedObject.meta.updatedAt}-${loading}-${hasChanges}`;

        // Only update if version actually changed OR copilot input changed
        const copilotKey = copilotInput || '';
        const versionWithCopilot = `${currentVersion}-${copilotKey}`;
        if (versionWithCopilot !== lastObjectVersionRef.current) {
          lastObjectVersionRef.current = versionWithCopilot;
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
                onSetCopilotInput={(input) => setCopilotInputRef.current(input)}
                onSelectObject={setSelectedId}
                singletonOps={singletonOps}
                onRefresh={refetch}
              />
            ),
            copilot: config.copilot.enabled ? (
              <BedrockCopilot
                consoleId={config.id}
                object={selectedObject}
                onApplyPatch={(ops) => handleEditRef.current(ops)}
                title={copilotTitle}
                placeholder={copilotPlaceholder}
                defaultCollapsed={true}
                externalInput={copilotInput}
                onExternalInputConsumed={clearCopilotInput}
                onAction={actionHandler ? async (actionId, userInput) => {
                  return actionHandler(actionId, userInput, {
                    consoleId: config.id,
                    selectedObject,
                    objects,
                  });
                } : undefined}
                quickActions={config.copilot.quickActions}
              />
            ) : undefined,
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
      copilotInput,
      clearCopilotInput,
    ]);

    // Close inspector on unmount
    useEffect(() => {
      return () => closeInspector();
    }, [closeInspector]);

    // ==========================================================================
    // Filter bar config
    // ==========================================================================

    // Sprint: genesis-sequence-v1 - Support dynamic filter options
    const filterOptions = config.collectionView.filterOptions.map((opt) => {
      let values: { value: string; label: string }[] = [];

      if (opt.dynamic) {
        // Compute options from data dynamically
        const threshold = opt.dynamicThreshold ?? 5;
        const counts: Record<string, number> = {};

        for (const obj of objects) {
          // Use safe nested field access
          const fieldValue = getNestedValue(obj, opt.field);

          if (Array.isArray(fieldValue)) {
            for (const item of fieldValue) {
              if (typeof item === 'string') {
                counts[item] = (counts[item] || 0) + 1;
              }
            }
          } else if (typeof fieldValue === 'string' && fieldValue) {
            counts[fieldValue] = (counts[fieldValue] || 0) + 1;
          }
        }

        values = Object.entries(counts)
          .filter(([, count]) => count >= threshold)
          .sort((a, b) => b[1] - a[1])
          .map(([v, count]) => ({ value: v, label: `${v} (${count})` }));
      } else {
        values = opt.options?.map((v) => ({ value: v, label: v })) || [];
      }

      return {
        key: opt.field,
        label: opt.label,
        multiple: false,
        values,
      };
    });

    const isFiltering =
      searchQuery.length > 0 || activeFilterCount > 0 || showFavoritesOnly;

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
      <div className="flex flex-col h-full">
        {/* Header with primary action */}
        {/* Sprint: extraction-pipeline-integration-v1 - Added headerContent slot for review queue button */}
        {/* Sprint: experience-console-cleanup-v1 - Added dropdown support for polymorphic consoles */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            {headerContent}
          </div>
          {config.primaryAction && (
            createOptions && createOptions.length > 0 ? (
              <CreateDropdown
                options={createOptions}
                onSelect={handleCreateTyped}
                disabled={loading}
                label={config.primaryAction.label}
              />
            ) : (
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
            )
          )}
        </div>

        {/* Metrics Row - conditionally rendered based on user preference */}
        {config.metrics.length > 0 && metricsBarVisible && (
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
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
            ) : createOptions && createOptions.length > 0 ? (
              /* Sprint: experience-console-cleanup-v1 - Type-aware empty state */
              <TypeAwareEmptyState
                config={config}
                activeTypeFilter={filters['meta.type'] as string | undefined}
                createOptions={createOptions}
                onCreateTyped={handleCreateTyped}
                onCreateDefault={handleCreate}
              />
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
