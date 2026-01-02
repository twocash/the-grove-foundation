# Hotfix: Bedrock Console Factory Pattern

**ID:** HOTFIX-001-console-factory  
**Priority:** High  
**Branch:** `hotfix/console-factory`  
**Date:** December 30, 2024  

---

## Mission

Create a **reusable console factory** that makes building new Bedrock consoles trivial. Every Grove object type (lenses, personas, journeys, hubs, nodes, moments, sprouts) should be manageable through an identical pattern where you only provide:

1. **Console config** (declarative)
2. **Data hook** 
3. **Card component**
4. **Editor component**

Everything else—layout, collection view, inspector, copilot, metrics, filter bar, undo/redo—comes from the factory.

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         createBedrockConsole<T>                              │
│                                                                              │
│  Inputs (you provide):                    Outputs (factory provides):        │
│  ├── config: ConsoleConfig                ├── Three-column layout            │
│  ├── useData: () => T[]                   ├── Collection view (filter/sort)  │
│  ├── CardComponent                        ├── Inspector registration         │
│  └── EditorComponent                      ├── Copilot integration            │
│                                           ├── Metrics row                    │
│                                           ├── Patch history (undo/redo)      │
│                                           └── Empty states                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Usage:**
```typescript
// Building a console is just this:
export const LensWorkshop = createBedrockConsole<LensPayload>({
  config: lensWorkshopConfig,
  useData: useLensData,
  CardComponent: LensCard,
  EditorComponent: LensEditor,
});

// Future consoles follow same pattern:
export const PersonaGallery = createBedrockConsole<PersonaPayload>({...});
export const JourneyStudio = createBedrockConsole<JourneyPayload>({...});
export const HubTopology = createBedrockConsole<HubPayload>({...});
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/bedrock/patterns/console-factory.tsx` | The factory function |
| `src/bedrock/patterns/console-factory.types.ts` | Type interfaces for plugin points |
| `src/bedrock/patterns/ObjectCardWrapper.tsx` | Standard card wrapper with favorite toggle |
| `src/bedrock/patterns/ObjectEditorWrapper.tsx` | Standard editor wrapper |

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/context/BedrockUIContext.tsx` | Add inspector registration |
| `src/bedrock/BedrockWorkspace.tsx` | Read inspector from context |
| `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` | Refactor to use factory |
| `src/bedrock/consoles/LensWorkshop/index.ts` | Export factory-built console |
| `src/bedrock/patterns/index.ts` | Export factory |

---

## Implementation

### Step 1: Create Type Interfaces

**File:** `src/bedrock/patterns/console-factory.types.ts`

```typescript
// src/bedrock/patterns/console-factory.types.ts
// Type interfaces for the Bedrock Console Factory
// Sprint: hotfix/console-factory

import type { ReactNode } from 'react';
import type { GroveObject, GroveObjectMeta } from '../../core/schema/grove-object';
import type { ConsoleConfig } from '../types/console.types';
import type { PatchOperation } from '../types/copilot.types';

// =============================================================================
// Data Hook Interface
// =============================================================================

/**
 * Result shape from useData hooks
 */
export interface CollectionDataResult<T> {
  /** Array of objects */
  objects: GroveObject<T>[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch data */
  refetch: () => void;
  /** Create new object */
  create: (defaults?: Partial<T>) => Promise<GroveObject<T>>;
  /** Update object with patch operations */
  update: (id: string, operations: PatchOperation[]) => Promise<void>;
  /** Delete object */
  remove: (id: string) => Promise<void>;
  /** Duplicate object */
  duplicate: (object: GroveObject<T>) => Promise<GroveObject<T>>;
}

// =============================================================================
// Card Component Interface
// =============================================================================

/**
 * Props passed to card components
 */
export interface ObjectCardProps<T> {
  /** The object to render */
  object: GroveObject<T>;
  /** Whether this card is selected */
  selected: boolean;
  /** Whether this card is favorited */
  isFavorite: boolean;
  /** Click handler */
  onClick: () => void;
  /** Favorite toggle handler */
  onFavoriteToggle: () => void;
  /** Optional: additional class names */
  className?: string;
}

// =============================================================================
// Editor Component Interface
// =============================================================================

/**
 * Props passed to editor components
 */
export interface ObjectEditorProps<T> {
  /** The object being edited */
  object: GroveObject<T>;
  /** Handler for field changes - generates patch operations */
  onEdit: (operations: PatchOperation[]) => void;
  /** Save handler */
  onSave: () => void;
  /** Delete handler */
  onDelete: () => void;
  /** Duplicate handler */
  onDuplicate: () => void;
  /** Whether save is in progress */
  loading: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
}

// =============================================================================
// Factory Options Interface
// =============================================================================

/**
 * Options for createBedrockConsole factory
 */
export interface BedrockConsoleOptions<T> {
  /** Declarative console configuration */
  config: ConsoleConfig;
  
  /** Data hook - returns objects and CRUD operations */
  useData: () => CollectionDataResult<T>;
  
  /** Card component for grid/list view */
  CardComponent: React.ComponentType<ObjectCardProps<T>>;
  
  /** Editor component for inspector panel */
  EditorComponent: React.ComponentType<ObjectEditorProps<T>>;
  
  /** Optional: Custom empty state for no objects */
  EmptyStateComponent?: React.ComponentType<{ onCreate: () => void }>;
  
  /** Optional: Custom copilot title */
  copilotTitle?: string;
  
  /** Optional: Custom copilot placeholder */
  copilotPlaceholder?: string;
}

// =============================================================================
// Inspector Registration Interface
// =============================================================================

/**
 * Config for opening the inspector panel
 */
export interface InspectorConfig {
  /** Panel title */
  title: string;
  /** Panel subtitle (can be ReactNode for badges) */
  subtitle?: ReactNode;
  /** Material Symbols icon name */
  icon?: string;
  /** Inspector content (the editor) */
  content: ReactNode;
  /** Copilot panel content */
  copilot?: ReactNode;
}

// =============================================================================
// Metric Data Interface
// =============================================================================

/**
 * Computed metric values passed to MetricsRow
 */
export interface MetricData {
  id: string;
  value: number | string;
}
```

### Step 2: Extend BedrockUIContext

**File:** `src/bedrock/context/BedrockUIContext.tsx`

Replace the entire file with:

```typescript
// src/bedrock/context/BedrockUIContext.tsx
// UI context for Bedrock workspace - manages inspector and console state
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { InspectorConfig } from '../patterns/console-factory.types';

// =============================================================================
// Types
// =============================================================================

interface BedrockUIState {
  /** Currently active console ID */
  activeConsole: string;
  /** Currently selected object ID (for tracking) */
  selectedObjectId: string | null;
  
  // Inspector state
  /** Whether inspector is open */
  inspectorOpen: boolean;
  /** Inspector panel title */
  inspectorTitle: string;
  /** Inspector panel subtitle */
  inspectorSubtitle: ReactNode;
  /** Inspector panel icon */
  inspectorIcon: string | undefined;
  /** Inspector panel content (editor) */
  inspectorContent: ReactNode;
  /** Copilot panel content */
  copilotContent: ReactNode;
}

interface BedrockUIActions {
  /** Set active console ID */
  setActiveConsole: (id: string) => void;
  /** Set selected object ID */
  setSelectedObjectId: (id: string | null) => void;
  
  // Inspector actions
  /** Open inspector with config */
  openInspector: (config: InspectorConfig) => void;
  /** Close inspector */
  closeInspector: () => void;
  /** Update inspector content without closing */
  updateInspector: (config: Partial<InspectorConfig>) => void;
}

type BedrockUIContextValue = BedrockUIState & BedrockUIActions;

// =============================================================================
// Context
// =============================================================================

const BedrockUIContext = createContext<BedrockUIContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface BedrockUIProviderProps {
  children: ReactNode;
}

export function BedrockUIProvider({ children }: BedrockUIProviderProps) {
  // Console state
  const [activeConsole, setActiveConsole] = useState('dashboard');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  // Inspector state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTitle, setInspectorTitle] = useState('');
  const [inspectorSubtitle, setInspectorSubtitle] = useState<ReactNode>(null);
  const [inspectorIcon, setInspectorIcon] = useState<string | undefined>();
  const [inspectorContent, setInspectorContent] = useState<ReactNode>(null);
  const [copilotContent, setCopilotContent] = useState<ReactNode>(null);

  // Open inspector with full config
  const openInspector = useCallback((config: InspectorConfig) => {
    setInspectorTitle(config.title);
    setInspectorSubtitle(config.subtitle ?? null);
    setInspectorIcon(config.icon);
    setInspectorContent(config.content);
    setCopilotContent(config.copilot ?? null);
    setInspectorOpen(true);
  }, []);

  // Close inspector and clear content
  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    // Small delay before clearing content for smooth animation
    setTimeout(() => {
      setInspectorContent(null);
      setCopilotContent(null);
    }, 200);
  }, []);

  // Update inspector without closing (for live updates)
  const updateInspector = useCallback((config: Partial<InspectorConfig>) => {
    if (config.title !== undefined) setInspectorTitle(config.title);
    if (config.subtitle !== undefined) setInspectorSubtitle(config.subtitle);
    if (config.icon !== undefined) setInspectorIcon(config.icon);
    if (config.content !== undefined) setInspectorContent(config.content);
    if (config.copilot !== undefined) setCopilotContent(config.copilot);
  }, []);

  const value: BedrockUIContextValue = {
    // State
    activeConsole,
    selectedObjectId,
    inspectorOpen,
    inspectorTitle,
    inspectorSubtitle,
    inspectorIcon,
    inspectorContent,
    copilotContent,
    // Actions
    setActiveConsole,
    setSelectedObjectId,
    openInspector,
    closeInspector,
    updateInspector,
  };

  return (
    <BedrockUIContext.Provider value={value}>
      {children}
    </BedrockUIContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useBedrockUI(): BedrockUIContextValue {
  const context = useContext(BedrockUIContext);
  if (!context) {
    throw new Error('useBedrockUI must be used within a BedrockUIProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { BedrockUIState, BedrockUIActions, BedrockUIContextValue };
```

### Step 3: Create the Console Factory

**File:** `src/bedrock/patterns/console-factory.tsx`

```typescript
// src/bedrock/patterns/console-factory.tsx
// Factory function for creating Bedrock consoles
// Sprint: hotfix/console-factory

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import type { ViewMode } from '../components/ViewModeToggle';
import type {
  BedrockConsoleOptions,
  ObjectCardProps,
  MetricData,
} from './console-factory.types';

// Hooks
import { useBedrockUI } from '../context/BedrockUIContext';
import { useCollectionView } from './useCollectionView';
import { usePatchHistory } from './usePatchHistory';

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
          // Extract field and expected value
          const match = metric.query.match(/count\(where:\s*(\!?)(\w+)\)/);
          if (match) {
            const negate = match[1] === '!';
            const field = match[2];
            value = objects.filter((o) => {
              const fieldValue = (o.payload as Record<string, unknown>)[field];
              return negate ? !fieldValue : Boolean(fieldValue);
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

    const handleDuplicate = useCallback(() => {
      if (!selectedObject) return;
      duplicate(selectedObject);
    }, [selectedObject, duplicate]);

    const handleCreate = useCallback(async () => {
      const newObject = await create();
      setSelectedId(newObject.meta.id);
    }, [create]);

    // ==========================================================================
    // Inspector Registration
    // ==========================================================================

    useEffect(() => {
      if (selectedObject) {
        openInspector({
          title: selectedObject.meta.title || `Untitled ${config.title}`,
          subtitle: selectedObject.meta.description,
          icon: selectedObject.meta.icon,
          content: (
            <EditorComponent
              object={selectedObject}
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
              title={copilotTitle}
              placeholder={copilotPlaceholder}
              defaultCollapsed={true}
              maxHeight={280}
            />
          ) : undefined,
        });
      } else {
        closeInspector();
      }
    }, [
      selectedObject,
      handleEdit,
      handleSave,
      handleDelete,
      handleDuplicate,
      loading,
      hasChanges,
      openInspector,
      closeInspector,
    ]);

    // Update inspector when hasChanges changes (for save button state)
    useEffect(() => {
      if (selectedObject) {
        updateInspector({
          content: (
            <EditorComponent
              object={selectedObject}
              onEdit={handleEdit}
              onSave={handleSave}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              loading={loading}
              hasChanges={hasChanges}
            />
          ),
        });
      }
    }, [hasChanges, loading]);

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
              columns={[]} // Consoles can override via config if needed
              selectedId={selectedId}
              favorites={favorites}
              onSelect={handleSelect}
              onFavoriteToggle={toggleFavorite}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field) => {
                const dir = sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
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
```

### Step 4: Update BedrockWorkspace

**File:** `src/bedrock/BedrockWorkspace.tsx`

Replace the entire file with:

```typescript
// src/bedrock/BedrockWorkspace.tsx
// Main Bedrock workspace shell with routing and inspector management
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BedrockUIProvider, useBedrockUI } from './context/BedrockUIContext';
import { BedrockCopilotProvider, useBedrockCopilot } from './context/BedrockCopilotContext';
import { BedrockLayout } from './primitives/BedrockLayout';
import { BedrockNav } from './primitives/BedrockNav';
import { BedrockInspector } from './primitives/BedrockInspector';
import { BEDROCK_NAV_ITEMS, CONSOLE_METADATA, getCopilotActionsForConsole } from './config';

// =============================================================================
// Inner Workspace (uses contexts)
// =============================================================================

function BedrockWorkspaceInner() {
  const location = useLocation();
  
  // UI context - includes inspector state
  const {
    inspectorOpen,
    inspectorTitle,
    inspectorSubtitle,
    inspectorIcon,
    inspectorContent,
    copilotContent,
    closeInspector,
    setActiveConsole,
  } = useBedrockUI();
  
  // Copilot context
  const { setContext, setAvailableActions } = useBedrockCopilot();

  // Determine current console from path
  const currentConsoleId = getConsoleIdFromPath(location.pathname);
  const consoleMetadata = CONSOLE_METADATA[currentConsoleId] ?? CONSOLE_METADATA.dashboard;

  // Update context when console changes
  useEffect(() => {
    setActiveConsole(currentConsoleId);
    setContext({ consoleId: currentConsoleId });
    setAvailableActions(getCopilotActionsForConsole(currentConsoleId));
    
    // Close inspector when navigating to a different console
    closeInspector();
  }, [currentConsoleId, setActiveConsole, setContext, setAvailableActions, closeInspector]);

  return (
    <BedrockLayout
      consoleId={currentConsoleId}
      title={consoleMetadata.title}
      description={consoleMetadata.description}
      navigation={
        <BedrockNav
          items={BEDROCK_NAV_ITEMS}
          consoleId={currentConsoleId}
          header={
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">hub</span>
              <span className="font-semibold text-foreground-light dark:text-foreground-dark">
                Bedrock
              </span>
            </div>
          }
        />
      }
      content={<Outlet />}
      // Inspector from context (registered by consoles)
      inspector={
        inspectorOpen && inspectorContent ? (
          <BedrockInspector
            title={inspectorTitle}
            subtitle={inspectorSubtitle}
            icon={inspectorIcon}
            onClose={closeInspector}
          >
            {inspectorContent}
          </BedrockInspector>
        ) : undefined
      }
      // Copilot from context (registered by consoles)
      copilot={copilotContent}
      inspectorOpen={inspectorOpen}
    />
  );
}

// =============================================================================
// Main Export (wraps with providers)
// =============================================================================

export function BedrockWorkspace() {
  return (
    <BedrockUIProvider>
      <BedrockCopilotProvider>
        <BedrockWorkspaceInner />
      </BedrockCopilotProvider>
    </BedrockUIProvider>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getConsoleIdFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return 'dashboard';
  return segments[1] || 'dashboard';
}

export default BedrockWorkspace;
```

### Step 5: Refactor LensWorkshop to Use Factory

**File:** `src/bedrock/consoles/LensWorkshop/index.ts`

```typescript
// src/bedrock/consoles/LensWorkshop/index.ts
// Lens Workshop console - built with createBedrockConsole factory
// Sprint: hotfix/console-factory

import { createBedrockConsole } from '../../patterns/console-factory';
import { lensWorkshopConfig } from './LensWorkshop.config';
import { useLensData } from './useLensData';
import { LensCard } from './LensCard';
import { LensEditor } from './LensEditor';
import type { LensPayload } from '../../types/lens';

/**
 * Lens Workshop Console
 * 
 * Manages lens configurations - filters that control how content
 * is presented to different audiences.
 * 
 * Built using the Bedrock Console Factory pattern.
 */
export const LensWorkshop = createBedrockConsole<LensPayload>({
  config: lensWorkshopConfig,
  useData: useLensData,
  CardComponent: LensCard,
  EditorComponent: LensEditor,
  copilotTitle: 'Lens Copilot',
  copilotPlaceholder: 'Edit this lens with AI...',
});

// Re-export types and config for external use
export { lensWorkshopConfig } from './LensWorkshop.config';
export type { LensPayload } from '../../types/lens';

export default LensWorkshop;
```

### Step 6: Create useLensData Hook

**File:** `src/bedrock/consoles/LensWorkshop/useLensData.ts`

```typescript
// src/bedrock/consoles/LensWorkshop/useLensData.ts
// Data hook for Lens Workshop
// Sprint: hotfix/console-factory

import { useState, useCallback } from 'react';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';

// Mock data for development - replace with actual API calls
const MOCK_LENSES: GroveObject<LensPayload>[] = [
  {
    meta: {
      id: 'lens-1',
      type: 'lens',
      title: 'Technical Professionals',
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-28T00:00:00Z',
    },
    payload: {
      name: 'Technical Professionals',
      description: 'For engineers, developers, and technical architects',
      category: 'role',
      filters: [],
      sortPriority: 1,
      isActive: true,
      iconEmoji: '👨‍💻',
      color: '#22d3ee',
    },
  },
  {
    meta: {
      id: 'lens-2',
      type: 'lens',
      title: 'AI Curious',
      createdAt: '2024-12-05T00:00:00Z',
      updatedAt: '2024-12-25T00:00:00Z',
    },
    payload: {
      name: 'AI Curious',
      description: 'For those exploring AI possibilities',
      category: 'interest',
      filters: [],
      sortPriority: 2,
      isActive: true,
      iconEmoji: '🤖',
      color: '#a855f7',
    },
  },
  {
    meta: {
      id: 'lens-3',
      type: 'lens',
      title: 'Quick Overview',
      createdAt: '2024-12-10T00:00:00Z',
      updatedAt: '2024-12-20T00:00:00Z',
    },
    payload: {
      name: 'Quick Overview',
      description: 'Brief introduction for time-constrained visitors',
      category: 'context',
      filters: [],
      sortPriority: 3,
      isActive: false,
      iconEmoji: '⚡',
      color: '#fbbf24',
    },
  },
];

/**
 * Data hook for Lens Workshop
 * Provides CRUD operations for lens objects
 */
export function useLensData(): CollectionDataResult<LensPayload> {
  const [lenses, setLenses] = useState<GroveObject<LensPayload>[]>(MOCK_LENSES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    // TODO: Implement actual API fetch
    setLoading(true);
    setTimeout(() => {
      setLenses(MOCK_LENSES);
      setLoading(false);
    }, 500);
  }, []);

  const create = useCallback(async (defaults?: Partial<LensPayload>) => {
    const newLens: GroveObject<LensPayload> = {
      meta: {
        id: `lens-${Date.now()}`,
        type: 'lens',
        title: defaults?.name || 'New Lens',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      payload: {
        name: 'New Lens',
        description: '',
        category: 'custom',
        filters: [],
        sortPriority: lenses.length + 1,
        isActive: false,
        iconEmoji: '🔍',
        color: '#22d3ee',
        ...defaults,
      },
    };
    setLenses((prev) => [...prev, newLens]);
    return newLens;
  }, [lenses.length]);

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    setLenses((prev) =>
      prev.map((lens) => {
        if (lens.meta.id !== id) return lens;
        
        // Apply patch operations
        let updated = { ...lens, payload: { ...lens.payload } };
        for (const op of operations) {
          if (op.op === 'replace' && op.path.startsWith('/payload/')) {
            const field = op.path.replace('/payload/', '');
            (updated.payload as Record<string, unknown>)[field] = op.value;
          }
        }
        updated.meta.updatedAt = new Date().toISOString();
        return updated;
      })
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    setLenses((prev) => prev.filter((lens) => lens.meta.id !== id));
  }, []);

  const duplicate = useCallback(async (object: GroveObject<LensPayload>) => {
    const duplicated: GroveObject<LensPayload> = {
      meta: {
        ...object.meta,
        id: `lens-${Date.now()}`,
        title: `${object.meta.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      payload: {
        ...object.payload,
        name: `${object.payload.name} (Copy)`,
      },
    };
    setLenses((prev) => [...prev, duplicated]);
    return duplicated;
  }, []);

  return {
    objects: lenses,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

export default useLensData;
```

### Step 7: Update LensCard Props

**File:** `src/bedrock/consoles/LensWorkshop/LensCard.tsx`

Update the component to accept `ObjectCardProps`:

```typescript
// src/bedrock/consoles/LensWorkshop/LensCard.tsx
// Lens card component for grid view
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { LensPayload } from '../../types/lens';
import { LENS_CATEGORY_CONFIG } from './LensWorkshop.config';

/**
 * Card component for displaying a lens in grid/list view
 */
export function LensCard({
  object: lens,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<LensPayload>) {
  const category = LENS_CATEGORY_CONFIG[lens.payload.category] || LENS_CATEGORY_CONFIG.custom;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="lens-card"
    >
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${lens.payload.color}20` }}
        >
          {lens.payload.iconEmoji || (
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: lens.payload.color }}
            >
              {category.icon}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {lens.payload.name || lens.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{category.icon}</span>
            {category.label}
          </p>
        </div>
      </div>

      {/* Description */}
      {lens.payload.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {lens.payload.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`
            px-2 py-0.5 rounded-full
            ${lens.payload.isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-amber-500/20 text-amber-400'
            }
          `}
        >
          {lens.payload.isActive ? 'Active' : 'Draft'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {lens.payload.filters?.length || 0} filters
        </span>
      </div>
    </div>
  );
}

export default LensCard;
```

### Step 8: Update LensEditor Props

**File:** `src/bedrock/consoles/LensWorkshop/LensEditor.tsx`

Update to accept `ObjectEditorProps`:

```typescript
// src/bedrock/consoles/LensWorkshop/LensEditor.tsx
// Lens editor component for inspector panel
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { LensPayload } from '../../types/lens';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { LENS_CATEGORY_CONFIG, DEFAULT_LENS_COLORS } from './LensWorkshop.config';

/**
 * Editor component for editing a lens in the inspector panel
 */
export function LensEditor({
  object: lens,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<LensPayload>) {
  // Helper to create patch operation
  const patchField = (field: keyof LensPayload, value: unknown) => {
    const op: PatchOperation = {
      op: 'replace',
      path: `/payload/${field}`,
      value,
    };
    onEdit([op]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basic Info */}
        <InspectorSection title="Basic Info">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={lens.payload.name || ''}
                onChange={(e) => patchField('name', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Description
              </label>
              <textarea
                value={lens.payload.description || ''}
                onChange={(e) => patchField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Category
              </label>
              <select
                value={lens.payload.category}
                onChange={(e) => patchField('category', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {Object.entries(LENS_CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Appearance */}
        <InspectorSection title="Appearance">
          <div className="space-y-4">
            {/* Icon Emoji */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Icon Emoji
              </label>
              <input
                type="text"
                value={lens.payload.iconEmoji || ''}
                onChange={(e) => patchField('iconEmoji', e.target.value)}
                placeholder="🔍"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_LENS_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => patchField('color', color)}
                    className={`
                      w-8 h-8 rounded-lg transition-all
                      ${lens.payload.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--glass-solid)]' : ''}
                    `}
                    style={{ backgroundColor: color }}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Status */}
        <InspectorSection title="Status">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--glass-text-secondary)]">Active</span>
            <button
              onClick={() => patchField('isActive', !lens.payload.isActive)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${lens.payload.isActive ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'}
              `}
              disabled={loading}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                  ${lens.payload.isActive ? 'left-6' : 'left-1'}
                `}
              />
            </button>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Metadata */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs">
                {lens.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={onSave}
            variant="primary"
            size="sm"
            disabled={loading || !hasChanges}
            className="flex-1"
          >
            {hasChanges ? 'Save Changes' : 'Saved'}
          </GlassButton>
          <GlassButton
            onClick={onDuplicate}
            variant="ghost"
            size="sm"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </GlassButton>
          <GlassButton
            onClick={onDelete}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-red-400 hover:text-red-300"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default LensEditor;
```

### Step 9: Update Patterns Index

**File:** `src/bedrock/patterns/index.ts`

```typescript
// src/bedrock/patterns/index.ts
// Barrel export for Bedrock patterns

export { createBedrockConsole } from './console-factory';
export { useCollectionView } from './useCollectionView';
export { usePatchHistory } from './usePatchHistory';
export { GroveApi } from './GroveApi';

// Types
export type {
  CollectionDataResult,
  ObjectCardProps,
  ObjectEditorProps,
  BedrockConsoleOptions,
  InspectorConfig,
  MetricData,
} from './console-factory.types';

export type {
  CollectionViewConfig,
  CollectionViewState,
} from './collection-view.types';
```

### Step 10: Delete Old LensWorkshop.tsx

The old `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` file can be deleted since it's replaced by the factory-built version in `index.ts`.

---

## Testing

### Manual Verification

1. Navigate to `/bedrock/lenses`
2. Grid shows lens cards
3. Click a card → inspector opens with editor
4. Edit fields → "Save Changes" button enables
5. Click Save → changes persist
6. Click another card → inspector updates
7. Close inspector → panel closes
8. Copilot appears at bottom of inspector

### Verification Commands

```bash
# Types compile
npx tsc --noEmit

# Build succeeds
npm run build

# Dev server runs
npm run dev
# Then visit http://localhost:5173/bedrock/lenses
```

---

## Pattern Documentation

Add to `PROJECT_PATTERNS.md`:

```markdown
## Pattern 11: Bedrock Console Factory

**Problem:** Building admin consoles requires repetitive wiring of collection views, inspectors, copilot integration, and layouts.

**Solution:** Use `createBedrockConsole<T>()` factory to generate complete consoles from minimal inputs.

**Usage:**
```tsx
import { createBedrockConsole } from '../patterns';

export const MyConsole = createBedrockConsole<MyPayload>({
  config: myConsoleConfig,     // Declarative config
  useData: useMyData,          // Data hook with CRUD
  CardComponent: MyCard,       // Grid/list card
  EditorComponent: MyEditor,   // Inspector editor
});
```

**What you provide:**
1. `config: ConsoleConfig` — Metrics, filters, sort options, copilot config
2. `useData: () => CollectionDataResult<T>` — Objects + CRUD operations
3. `CardComponent` — Accepts `ObjectCardProps<T>`
4. `EditorComponent` — Accepts `ObjectEditorProps<T>`

**What the factory provides:**
- Three-column layout
- Collection view (filter/sort/favorites)
- Inspector registration via context
- Copilot integration
- Metrics row
- Empty states
- Loading skeletons

**Anti-pattern:** Do NOT render `<BedrockInspector>` or `<BedrockCopilot>` directly in console JSX. The factory handles this via context.
```

---

## Definition of Done

- [ ] `createBedrockConsole` factory function exists
- [ ] `LensWorkshop` uses factory (no manual inspector)
- [ ] Inspector opens via context registration
- [ ] Copilot renders at bottom of inspector
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] `/bedrock/lenses` works correctly
- [ ] Pattern documented in PROJECT_PATTERNS.md

---

## Future Consoles

With this pattern, adding new consoles becomes trivial:

```typescript
// PersonaGallery - ~50 lines total
export const PersonaGallery = createBedrockConsole<PersonaPayload>({
  config: personaGalleryConfig,
  useData: usePersonaData,
  CardComponent: PersonaCard,
  EditorComponent: PersonaEditor,
});

// JourneyStudio
export const JourneyStudio = createBedrockConsole<JourneyPayload>({...});

// HubTopology
export const HubTopology = createBedrockConsole<HubPayload>({...});

// NodeManager
export const NodeManager = createBedrockConsole<NodePayload>({...});
```

Each new console only needs:
1. Payload type definition (~20 lines)
2. Console config (~80 lines)
3. Card component (~60 lines)
4. Editor component (~150 lines)
5. Data hook (~100 lines)

**Total: ~400 lines per console vs ~800+ without factory**
