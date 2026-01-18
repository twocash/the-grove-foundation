# Kinetic Foundation v1.0 — Execution Prompt

**Sprint:** `kinetic-foundation-v1`  
**For:** Claude Code CLI  
**Date:** December 24, 2024

---

## Context

You are executing the Kinetic Foundation v1.0 sprint for The Grove Foundation project. This sprint extracts reusable patterns from NarrativeArchitect and creates a unified DEX object model.

**Repository:** `C:\GitHub\the-grove-foundation`  
**Branch:** Create `feature/kinetic-foundation-v1` from `main`

**Key Files to Reference:**
- `src/foundation/consoles/NarrativeArchitect.tsx` (571 lines) — Source of patterns to extract
- `src/foundation/hooks/useNarrativeSchema.ts` (337 lines) — Hook to refactor
- `src/foundation/FoundationUIContext.tsx` (153 lines) — Inspector state reference
- `src/shared/` — Target for new components

**Sprint Docs:** `docs/sprints/kinetic-foundation-v1/`
- SPEC.md — Goals and acceptance criteria
- ARCHITECTURE.md — Target architecture and type definitions
- MIGRATION_MAP.md — File-by-file change plan
- DECISIONS.md — ADRs explaining choices
- SPRINTS.md — Epic/story breakdown

---

## Execution Instructions

### Pre-Flight Checks
```bash
cd C:\GitHub\the-grove-foundation
git checkout main
git pull origin main
git checkout -b feature/kinetic-foundation-v1
npm install
npm run build   # Verify clean build
npm test        # Verify tests pass
```

### Epic 1: DEX Type System

**Create `src/core/schema/dex.ts`:**

```typescript
// src/core/schema/dex.ts
// DEX Object Model — Kinetic Architecture Foundation

/**
 * Object types in the DEX system
 */
export type DEXObjectType = 'lens' | 'journey' | 'node' | 'hub' | 'card' | 'sprout';

/**
 * Version entry for evolution tracking
 */
export interface DEXVersionEntry {
  version: number;
  timestamp: string;
  changedBy: 'human' | 'agent';
  agentId?: string;
  changeDescription: string;
  diff?: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Base interface for all DEX-compliant objects
 */
export interface DEXObject {
  // Identity
  id: string;
  type: DEXObjectType;
  
  // Display
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Lifecycle
  status: 'draft' | 'active' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Kinetic metadata (future agent support)
  proposedBy?: 'human' | 'agent';
  approvedBy?: string;
  telemetryScore?: number;
  evolutionHistory?: DEXVersionEntry[];
  
  // Capture provenance (entropy integration)
  captureContext?: DEXCaptureContext;
}

/**
 * Capture context for provenance tracking
 * Records conditions under which an object was created
 */
export interface DEXCaptureContext {
  entropyScore?: number;                    // Complexity at capture (0-1)
  entropyLevel?: 'low' | 'medium' | 'high'; // Discretized complexity
  sessionId?: string;                       // Conversation session
  journeyId?: string;                       // If captured during journey
  nodeId?: string;                          // Specific journey step
  lensId?: string;                          // Active persona/lens
}

/**
 * Journey — Structured narrative path
 */
export interface DEXJourney extends DEXObject {
  type: 'journey';
  title: string;
  entryNodeId?: string;
  estimatedMinutes?: number;
  linkedHubId?: string;
}

/**
 * Node — Step within a journey
 */
export interface DEXNode extends DEXObject {
  type: 'node';
  query: string;
  contextSnippet?: string;
  journeyId: string;
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
  hubId?: string;
  sectionId?: string;
}

/**
 * Hub — Topic routing configuration
 */
export interface DEXHub extends DEXObject {
  type: 'hub';
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;
  supportingSources: string[];
  expertFraming: string;
  keyPoints: string[];
}

/**
 * Lens — Persona/perspective configuration
 */
export interface DEXLens extends DEXObject {
  type: 'lens';
  publicLabel: string;
  enabled: boolean;
  toneGuidance: string;
  narrativeStyle: string;
  arcEmphasis: Record<string, number>;
  openingPhase: string;
  defaultThreadLength: number;
  entryPoints: string[];
  suggestedThread: string[];
}

/**
 * Card — Legacy V2.0 navigation unit
 */
export interface DEXCard extends DEXObject {
  type: 'card';
  query: string;
  contextSnippet?: string;
  personas: string[];
  next: string[];
  sectionId?: string;
  hubId?: string;
}

/**
 * Type guards
 */
export function isDEXJourney(obj: DEXObject): obj is DEXJourney {
  return obj.type === 'journey';
}

export function isDEXNode(obj: DEXObject): obj is DEXNode {
  return obj.type === 'node';
}

export function isDEXHub(obj: DEXObject): obj is DEXHub {
  return obj.type === 'hub';
}

export function isDEXLens(obj: DEXObject): obj is DEXLens {
  return obj.type === 'lens';
}
```

**Update `src/core/schema/index.ts`:**
```typescript
export * from './dex';
// Keep existing exports
```

**Build Gate:**
```bash
npm run build
npx tsc --noEmit
```

---

### Epic 2: DEX Registry

**Create `src/core/registry/DEXRegistry.tsx`:**

```typescript
// src/core/registry/DEXRegistry.tsx
// Centralized object store for DEX objects

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { DEXObject, DEXObjectType, DEXJourney, DEXNode, DEXHub, DEXLens, DEXCard } from '../schema/dex';

// State shape
interface DEXRegistryState {
  objects: {
    journey: Record<string, DEXJourney>;
    node: Record<string, DEXNode>;
    hub: Record<string, DEXHub>;
    lens: Record<string, DEXLens>;
    card: Record<string, DEXCard>;
    sprout: Record<string, DEXObject>;
  };
  loading: boolean;
  saving: boolean;
  status: string | null;
}

const initialState: DEXRegistryState = {
  objects: {
    journey: {},
    node: {},
    hub: {},
    lens: {},
    card: {},
    sprout: {},
  },
  loading: false,
  saving: false,
  status: null,
};

// Actions
type DEXRegistryAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_STATUS'; status: string | null }
  | { type: 'HYDRATE'; objects: DEXRegistryState['objects'] }
  | { type: 'UPDATE_OBJECT'; objectType: DEXObjectType; id: string; updates: Partial<DEXObject> }
  | { type: 'DELETE_OBJECT'; objectType: DEXObjectType; id: string }
  | { type: 'CREATE_OBJECT'; objectType: DEXObjectType; object: DEXObject };

function reducer(state: DEXRegistryState, action: DEXRegistryAction): DEXRegistryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'HYDRATE':
      return { ...state, objects: action.objects, loading: false };
    case 'UPDATE_OBJECT': {
      const typeStore = state.objects[action.objectType];
      const existing = typeStore[action.id];
      if (!existing) return state;
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectType]: {
            ...typeStore,
            [action.id]: { ...existing, ...action.updates, updatedAt: new Date().toISOString() },
          },
        },
      };
    }
    case 'DELETE_OBJECT': {
      const typeStore = { ...state.objects[action.objectType] };
      delete typeStore[action.id];
      return {
        ...state,
        objects: { ...state.objects, [action.objectType]: typeStore },
      };
    }
    case 'CREATE_OBJECT': {
      return {
        ...state,
        objects: {
          ...state.objects,
          [action.objectType]: {
            ...state.objects[action.objectType],
            [action.object.id]: action.object,
          },
        },
      };
    }
    default:
      return state;
  }
}

// Context
interface DEXRegistryContextValue {
  state: DEXRegistryState;
  
  // Read
  get: <T extends DEXObject>(type: DEXObjectType, id: string) => T | null;
  getAll: <T extends DEXObject>(type: DEXObjectType) => T[];
  filter: <T extends DEXObject>(type: DEXObjectType, predicate: (item: T) => boolean) => T[];
  
  // Write
  update: <T extends DEXObject>(type: DEXObjectType, id: string, updates: Partial<T>) => void;
  remove: (type: DEXObjectType, id: string) => void;
  create: <T extends DEXObject>(type: DEXObjectType, partial: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => string;
  
  // Lifecycle
  hydrate: (objects: DEXRegistryState['objects']) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setStatus: (status: string | null) => void;
}

const DEXRegistryContext = createContext<DEXRegistryContextValue | null>(null);

export function DEXRegistryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const get = useCallback(<T extends DEXObject>(type: DEXObjectType, id: string): T | null => {
    return (state.objects[type][id] as T) ?? null;
  }, [state.objects]);

  const getAll = useCallback(<T extends DEXObject>(type: DEXObjectType): T[] => {
    return Object.values(state.objects[type]) as T[];
  }, [state.objects]);

  const filter = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    predicate: (item: T) => boolean
  ): T[] => {
    return (Object.values(state.objects[type]) as T[]).filter(predicate);
  }, [state.objects]);

  const update = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    id: string,
    updates: Partial<T>
  ) => {
    dispatch({ type: 'UPDATE_OBJECT', objectType: type, id, updates });
  }, []);

  const remove = useCallback((type: DEXObjectType, id: string) => {
    dispatch({ type: 'DELETE_OBJECT', objectType: type, id });
  }, []);

  const create = useCallback(<T extends DEXObject>(
    type: DEXObjectType,
    partial: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): string => {
    const now = new Date().toISOString();
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const object = {
      ...partial,
      id,
      type,
      version: 1,
      createdAt: now,
      updatedAt: now,
    } as DEXObject;
    dispatch({ type: 'CREATE_OBJECT', objectType: type, object });
    return id;
  }, []);

  const hydrate = useCallback((objects: DEXRegistryState['objects']) => {
    dispatch({ type: 'HYDRATE', objects });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    dispatch({ type: 'SET_SAVING', saving });
  }, []);

  const setStatus = useCallback((status: string | null) => {
    dispatch({ type: 'SET_STATUS', status });
  }, []);

  const value = useMemo(() => ({
    state,
    get,
    getAll,
    filter,
    update,
    remove,
    create,
    hydrate,
    setLoading,
    setSaving,
    setStatus,
  }), [state, get, getAll, filter, update, remove, create, hydrate, setLoading, setSaving, setStatus]);

  return (
    <DEXRegistryContext.Provider value={value}>
      {children}
    </DEXRegistryContext.Provider>
  );
}

export function useDEXRegistry(): DEXRegistryContextValue {
  const ctx = useContext(DEXRegistryContext);
  if (!ctx) {
    throw new Error('useDEXRegistry must be used within DEXRegistryProvider');
  }
  return ctx;
}
```

**Create `src/core/registry/index.ts`:**
```typescript
export { DEXRegistryProvider, useDEXRegistry } from './DEXRegistry';
```

**Build Gate:**
```bash
npm run build
npm test
```

---

### Epic 3: Shared Components

**Create `src/shared/SegmentedControl.tsx`:**

```typescript
// src/shared/SegmentedControl.tsx
// Generic segmented control for view switching

import React from 'react';

interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const sizeClasses = size === 'sm' ? 'text-xs py-1 px-2' : 'text-sm py-1.5 px-3';

  return (
    <div
      className={`
        inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`
            ${sizeClasses}
            rounded-md font-medium transition-all duration-150
            flex items-center gap-1.5
            ${fullWidth ? 'flex-1 justify-center' : ''}
            ${value === option.id
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          {option.icon && (
            <span className="material-symbols-outlined text-base">{option.icon}</span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
```

**Create `src/shared/ObjectList.tsx`:**

```typescript
// src/shared/ObjectList.tsx
// Generic list component with selection and inspector highlighting

import React from 'react';

interface ObjectListItem {
  id: string;
  label: string;
  count?: number;
  status?: 'active' | 'inactive' | 'draft';
}

interface ObjectListProps<T> {
  items: T[];
  selectedId: string | null;
  activeInspectorId: string | null;
  onSelect: (id: string) => void;
  getItemProps: (item: T) => ObjectListItem;
  emptyMessage?: string;
  className?: string;
}

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  draft: 'bg-amber-500',
};

export function ObjectList<T>({
  items,
  selectedId,
  activeInspectorId,
  onSelect,
  getItemProps,
  emptyMessage = 'No items',
  className = '',
}: ObjectListProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`text-slate-400 text-sm py-4 text-center ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item) => {
        const { id, label, count, status } = getItemProps(item);
        const isSelected = selectedId === id;
        const isInspected = activeInspectorId === id;

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`
              w-full text-left px-3 py-2 rounded-lg transition-colors
              flex items-center justify-between gap-2
              ${isInspected
                ? 'bg-primary/10 border border-primary/30'
                : isSelected
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              {status && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status] || statusDot.inactive}`} />
              )}
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {label}
              </span>
            </div>
            {count !== undefined && (
              <span className="text-xs text-slate-400 flex-shrink-0">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ObjectList;
```

**Create `src/shared/ObjectGrid.tsx`:**

```typescript
// src/shared/ObjectGrid.tsx
// Generic grid component for displaying DEX objects

import React from 'react';
import { EmptyState } from './feedback';

interface ObjectCardBadge {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface ObjectCardProps {
  id: string;
  title: string;
  subtitle: string;
  badges?: ObjectCardBadge[];
}

interface ObjectGridProps<T> {
  items: T[];
  activeInspectorId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  getCardProps: (item: T) => ObjectCardProps;
  emptyMessage?: string;
  emptySearchMessage?: string;
  columns?: 2 | 3 | 4;
  maxHeight?: string;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
};

const columnClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ObjectGrid<T>({
  items,
  activeInspectorId,
  searchQuery,
  onSelect,
  getCardProps,
  emptyMessage = 'No items',
  emptySearchMessage = 'No items match your search',
  columns = 2,
  maxHeight = '50vh',
  className = '',
}: ObjectGridProps<T>) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={searchQuery ? 'search_off' : 'inventory_2'}
        title={searchQuery ? 'No results' : emptyMessage}
        description={searchQuery ? emptySearchMessage : undefined}
      />
    );
  }

  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <div className={`grid ${columnClasses[columns]} gap-3 p-1`}>
        {items.map((item) => {
          const { id, title, subtitle, badges = [] } = getCardProps(item);
          const isInspected = activeInspectorId === id;

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`
                text-left p-3 rounded-lg border transition-all
                ${isInspected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h4>
                {badges.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {badges.map((badge, i) => (
                      <span
                        key={i}
                        className={`
                          px-1.5 py-0.5 text-xs rounded
                          ${badgeVariants[badge.variant || 'default']}
                        `}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ObjectGrid;
```

**Update `src/shared/index.ts`:**
```diff
+ export { SegmentedControl } from './SegmentedControl';
+ export { ObjectList } from './ObjectList';
+ export { ObjectGrid } from './ObjectGrid';
```

**Build Gate:**
```bash
npm run build
npm test
```

---

### Epic 4: NarrativeArchitect Migration

**Modify `src/foundation/consoles/NarrativeArchitect.tsx`:**

1. Add imports at top:
```typescript
import { SegmentedControl, ObjectList, ObjectGrid } from '../../shared';
```

2. Remove inline ViewToggle component (lines ~45-95)

3. Replace ViewToggle usage:
```tsx
// Before
<ViewToggle options={viewOptions} value={viewMode} onChange={setViewMode} />

// After
<SegmentedControl
  options={viewOptions}
  value={viewMode}
  onChange={setViewMode}
/>
```

4. Replace JourneyList (in journey view):
```tsx
// Before: inline map with custom rendering

// After:
<ObjectList
  items={allJourneys}
  selectedId={selectedJourneyId}
  activeInspectorId={inspector.mode.type === 'journey' ? inspector.mode.journeyId : null}
  onSelect={(id) => openInspector({ type: 'journey', journeyId: id })}
  getItemProps={(j) => ({
    id: j.id,
    label: j.title || j.id,
    count: allNodes.filter(n => n.journeyId === j.id).length,
    status: j.status === 'active' ? 'active' : 'inactive',
  })}
  emptyMessage="No journeys yet"
/>
```

5. Replace NodeGrid:
```tsx
<ObjectGrid
  items={filteredNodes}
  activeInspectorId={inspector.mode.type === 'node' ? inspector.mode.nodeId : null}
  searchQuery={searchQuery}
  onSelect={(id) => openInspector({ type: 'node', nodeId: id })}
  getCardProps={(node) => ({
    id: node.id,
    title: node.label || node.id,
    subtitle: node.id,
    badges: [
      node.sequenceOrder !== undefined && { label: `#${node.sequenceOrder}`, variant: 'success' as const },
      { label: node.primaryNext ? '→' : '∅', variant: 'default' as const },
    ].filter(Boolean) as ObjectCardBadge[],
  })}
  emptyMessage="No nodes yet"
/>
```

**Build Gate:**
```bash
npm run build
npm test
npx playwright test tests/e2e/foundation/
```

---

### Epic 5: Hook Migration

**Wrap app with DEXRegistryProvider:**

In `src/foundation/FoundationWorkspace.tsx` or app root:
```tsx
import { DEXRegistryProvider } from '../core/registry';

// Wrap the workspace
<DEXRegistryProvider>
  <FoundationUIProvider>
    {/* existing content */}
  </FoundationUIProvider>
</DEXRegistryProvider>
```

**Refactor `useNarrativeSchema.ts`:**

Keep existing public API, but delegate internal state management to DEXRegistry. This is an internal refactor — all existing consumers continue working.

---

## Verification Commands

After each epic:
```bash
npm run build              # Must compile
npm test                   # Unit tests pass
npx tsc --noEmit           # No type errors
```

After Epic 4 and 5:
```bash
npx playwright test        # E2E tests pass
```

Manual verification:
1. Open Foundation at `/foundation/narrative`
2. Click a journey → Inspector opens
3. Click a node → Node inspector opens
4. Toggle between Journeys/Nodes view
5. Search filters correctly
6. Save to Production works

---

## Troubleshooting

**Type errors after creating DEX types:**
- Ensure `src/core/schema/index.ts` exports all types
- Check import paths use `@core/schema`

**Registry context error:**
- Ensure DEXRegistryProvider wraps the component tree
- Check provider is above FoundationWorkspace

**Inspector not opening:**
- Verify `openInspector` is called with correct shape
- Check FoundationUIContext is available

**Components not rendering:**
- Verify exports in `src/shared/index.ts`
- Check import paths

---

## Completion Checklist

- [ ] Epic 1: DEX types created and exported
- [ ] Epic 2: Registry provider and hook working
- [ ] Epic 3: All three components created
- [ ] Epic 4: NarrativeArchitect uses new components
- [ ] Epic 5: Hook delegates to registry
- [ ] All tests pass
- [ ] Manual verification complete
- [ ] DEVLOG.md updated
