# Architecture: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## Target Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI COMPONENTS                            │
│                                                                  │
│    ┌─────────────────────┐         ┌─────────────────────┐      │
│    │    LensPicker       │         │    JourneyList      │      │
│    │                     │         │                     │      │
│    │  useVersionedCollection       │  useVersionedCollection     │
│    │  (type: 'lens')     │         │  (type: 'journey')  │      │
│    └──────────┬──────────┘         └──────────┬──────────┘      │
│               │                               │                  │
└───────────────┼───────────────────────────────┼──────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────┐
│                    ┌──────────▼──────────┐                    │
│                    │ useVersionedCollection │                  │
│       HOOKS        │    <T extends Item>    │                  │
│                    │                        │                  │
│                    │  - loads from store    │                  │
│                    │  - merges via config   │                  │
│                    │  - subscribes to events │                 │
│                    └──────────┬─────────────┘                  │
│                               │                                │
└───────────────────────────────┼────────────────────────────────┘
                                │
┌───────────────────────────────┼────────────────────────────────┐
│                    ┌──────────▼──────────┐                     │
│                    │   MERGE_CONFIGS     │  ← Declarative      │
│       CORE         │  (src/core/versioning)                    │
│                    └─────────────────────┘                     │
│                                                                │
│                    ┌─────────────────────┐                     │
│                    │ VersionedObjectStore │                    │
│                    │   (IndexedDB)        │                    │
│                    └─────────────────────┘                     │
└────────────────────────────────────────────────────────────────┘
```

## Data Structures

### MergeConfig (New)

```typescript
// src/core/versioning/merge-config.ts

import type { GroveObjectType } from '@core/schema/grove-object';

/**
 * Declarative configuration for merging versioned data over schema data.
 * Follows DEX principle: domain logic in config, not code.
 */
export interface MergeConfig {
  /** Fields from versioned.current.meta that override schema item */
  metaFields: MetaFieldMapping[];
  /** Fields from versioned.current.payload that override schema item */
  payloadFields: PayloadFieldMapping[];
}

interface MetaFieldMapping {
  /** Field name in versioned meta (e.g., 'title') */
  source: string;
  /** Field name in schema item (e.g., 'publicLabel') */
  target: string;
}

interface PayloadFieldMapping {
  /** Field name in versioned payload */
  source: string;
  /** Field name in schema item (same name by default) */
  target?: string;
}

/**
 * Registry of merge configs per object type.
 * To add a new versioned collection, add an entry here.
 */
export const MERGE_CONFIGS: Partial<Record<GroveObjectType, MergeConfig>> = {
  lens: {
    metaFields: [
      { source: 'title', target: 'publicLabel' },
      { source: 'description', target: 'description' },
      { source: 'icon', target: 'icon' },
    ],
    payloadFields: [
      { source: 'color' },
      { source: 'toneGuidance' },
      { source: 'narrativeStyle' },
    ],
  },
  journey: {
    metaFields: [
      { source: 'title', target: 'title' },
      { source: 'description', target: 'description' },
    ],
    payloadFields: [
      { source: 'targetAha' },
      { source: 'estimatedMinutes' },
    ],
  },
};
```

### VersionedItem (Extended Type)

```typescript
// Added to items returned by useVersionedCollection

export interface VersionedMeta {
  /** Version ordinal if modified from IndexedDB */
  versionOrdinal?: number;
  /** Whether this item has local modifications */
  hasLocalModifications?: boolean;
}

// Usage: T & VersionedMeta
```

### useVersionedCollection Hook

```typescript
// hooks/useVersionedCollection.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getVersionedObjectStore, type StoredObject } from '@core/versioning';
import { MERGE_CONFIGS, type MergeConfig } from '@core/versioning/merge-config';
import type { GroveObjectType } from '@core/schema/grove-object';

interface VersionedMeta {
  versionOrdinal?: number;
  hasLocalModifications?: boolean;
}

interface UseVersionedCollectionOptions {
  /** Object type for merge config lookup */
  objectType: GroveObjectType;
  /** Optional custom merge config (overrides registry) */
  mergeConfig?: MergeConfig;
}

interface UseVersionedCollectionResult<T> {
  /** Items with versioned overrides merged */
  items: (T & VersionedMeta)[];
  /** Loading state */
  loading: boolean;
  /** Force refresh from IndexedDB */
  refresh: () => void;
  /** Check if specific item has modifications */
  hasModifications: (id: string) => boolean;
}

export function useVersionedCollection<T extends { id: string }>(
  schemaItems: T[],
  options: UseVersionedCollectionOptions
): UseVersionedCollectionResult<T> {
  // Implementation follows...
}
```

## Event System

### WorkspaceUIContext Events

```typescript
// src/workspace/WorkspaceUIContext.tsx

interface WorkspaceUIContextValue {
  // Existing...
  inspector: InspectorState;
  openInspector(mode: InspectorMode): void;
  closeInspector(): void;

  // NEW: Event subscription
  onInspectorClosed(callback: () => void): () => void;  // Returns unsubscribe
}

// Implementation uses simple event emitter pattern
const [inspectorClosedCallbacks] = useState<Set<() => void>>(new Set());

const closeInspector = useCallback(() => {
  setInspector({ isOpen: false, mode: null });
  // Emit event
  inspectorClosedCallbacks.forEach(cb => cb());
}, [inspectorClosedCallbacks]);

const onInspectorClosed = useCallback((callback: () => void) => {
  inspectorClosedCallbacks.add(callback);
  return () => inspectorClosedCallbacks.delete(callback);
}, [inspectorClosedCallbacks]);
```

## Data Flow

### Current (Imperative)

```
Inspector closes
     ↓
useEffect sees inspectorOpen = false
     ↓
Calls refresh()
     ↓
Re-fetches from IndexedDB
```

**Problem:** Effect fires on mount, watches wrong signal

### Target (Event-Driven)

```
Inspector closes
     ↓
closeInspector() emits 'inspector-closed' event
     ↓
useVersionedCollection subscriber triggers refresh
     ↓
Re-fetches from IndexedDB
```

**Benefit:** Precise, only fires when inspector actually closes

## File Organization

### New Files

```
src/core/versioning/
├── merge-config.ts      # MergeConfig type + MERGE_CONFIGS registry
└── index.ts             # Export merge-config

hooks/
└── useVersionedCollection.ts  # Generic hook
```

### Modified Files

```
hooks/
├── useVersionedPersonas.ts    # DELETE
└── useVersionedJourneys.ts    # DELETE

src/explore/
├── LensPicker.tsx             # Use generic hook
└── JourneyList.tsx            # Use generic hook

src/workspace/
└── WorkspaceUIContext.tsx     # Add event emission
```

## API Contract

### useVersionedCollection

```typescript
// Input
const { items, loading, refresh, hasModifications } = useVersionedCollection(
  schemaItems,    // T[] - items from schema
  {
    objectType: 'lens',  // GroveObjectType
    mergeConfig: {...},  // Optional override
  }
);

// Output
items: (T & VersionedMeta)[]  // Merged items
loading: boolean
refresh: () => void
hasModifications: (id: string) => boolean
```

### WorkspaceUIContext Events

```typescript
// Subscribe
const unsubscribe = workspaceUI.onInspectorClosed(() => {
  refresh();
});

// Cleanup
useEffect(() => unsubscribe, [unsubscribe]);
```

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | `MERGE_CONFIGS` defines field mappings, not code |
| **Capability Agnosticism** | Generic hook works for any type with `{ id: string }` |
| **Provenance** | Existing versioning tracks actor/source |
| **Organic Scalability** | Add new type by adding config entry only |
