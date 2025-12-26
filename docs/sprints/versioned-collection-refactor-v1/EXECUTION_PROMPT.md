# Execution Prompt: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**For:** Claude Code Execution Agent

## Context

You are refactoring the versioning integration for Grove collections (personas, journeys). The goal is to replace two nearly identical hooks with one generic hook, add declarative merge configuration, and implement event-driven refresh.

## Pre-Execution Verification

```bash
# Verify current state
cd C:\GitHub\the-grove-foundation
npm run build    # Should compile
npm test         # Should have 196 tests passing
```

## Epic 1: Core Infrastructure

### 1.1 Create merge-config.ts

Create `src/core/versioning/merge-config.ts`:

```typescript
// src/core/versioning/merge-config.ts
// Declarative merge configuration for versioned collections
// Sprint: versioned-collection-refactor-v1

import type { GroveObjectType } from '@core/schema/grove-object';
import type { StoredObject } from './schema';

export interface MetaFieldMapping {
  source: string;
  target: string;
}

export interface PayloadFieldMapping {
  source: string;
  target?: string;
}

export interface MergeConfig {
  metaFields: MetaFieldMapping[];
  payloadFields: PayloadFieldMapping[];
}

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

export function applyMergeConfig<T extends Record<string, unknown>>(
  item: T,
  stored: StoredObject,
  config: MergeConfig
): T & { versionOrdinal: number; hasLocalModifications: true } {
  const meta = stored.current.meta as Record<string, unknown>;
  const payload = stored.current.payload as Record<string, unknown>;

  const merged = { ...item } as Record<string, unknown>;

  // Apply meta field mappings
  for (const { source, target } of config.metaFields) {
    if (meta[source] !== undefined) {
      merged[target] = meta[source];
    }
  }

  // Apply payload field mappings
  for (const { source, target } of config.payloadFields) {
    const targetKey = target ?? source;
    if (payload[source] !== undefined) {
      merged[targetKey] = payload[source];
    }
  }

  return {
    ...merged,
    versionOrdinal: stored.versionCount,
    hasLocalModifications: true,
  } as T & { versionOrdinal: number; hasLocalModifications: true };
}
```

### 1.2 Export from index

Update `src/core/versioning/index.ts`:

```typescript
// Add to exports
export { MERGE_CONFIGS, applyMergeConfig } from './merge-config';
export type { MergeConfig, MetaFieldMapping, PayloadFieldMapping } from './merge-config';
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 2: Generic Hook

### 2.1 Create useVersionedCollection

Create `hooks/useVersionedCollection.ts`:

```typescript
// hooks/useVersionedCollection.ts
// Generic hook for versioned collections
// Sprint: versioned-collection-refactor-v1

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getVersionedObjectStore,
  type StoredObject,
  MERGE_CONFIGS,
  applyMergeConfig,
} from '../src/core/versioning';
import type { GroveObjectType } from '../src/core/schema/grove-object';

export interface VersionedMeta {
  versionOrdinal?: number;
  hasLocalModifications?: boolean;
}

interface UseVersionedCollectionOptions {
  objectType: GroveObjectType;
}

interface UseVersionedCollectionResult<T> {
  items: (T & VersionedMeta)[];
  loading: boolean;
  refresh: () => void;
  hasModifications: (id: string) => boolean;
}

export function useVersionedCollection<T extends { id: string }>(
  schemaItems: T[],
  options: UseVersionedCollectionOptions
): UseVersionedCollectionResult<T> {
  const { objectType } = options;
  const config = MERGE_CONFIGS[objectType];

  // Memoize item IDs to prevent effect re-runs
  const itemIds = useMemo(
    () => schemaItems.map(item => item.id).join(','),
    [schemaItems]
  );

  const [overrides, setOverrides] = useState<Map<string, StoredObject>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load versioned overrides from IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const store = await getVersionedObjectStore();
        const newOverrides = new Map<string, StoredObject>();

        for (const item of schemaItems) {
          const stored = await store.get(item.id);
          if (stored && stored.versionCount > 0) {
            newOverrides.set(item.id, stored);
          }
        }

        if (!cancelled) {
          setOverrides(newOverrides);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useVersionedCollection] Failed to load:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [itemIds, refreshKey]);

  // Merge schema items with versioned overrides
  const items = useMemo(() => {
    if (!config) {
      // No merge config for this type, return as-is
      return schemaItems as (T & VersionedMeta)[];
    }

    return schemaItems.map((item) => {
      const stored = overrides.get(item.id);
      if (!stored) {
        return item as T & VersionedMeta;
      }
      return applyMergeConfig(item as T & Record<string, unknown>, stored, config);
    });
  }, [schemaItems, overrides, config]);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const hasModifications = useCallback(
    (id: string) => overrides.has(id),
    [overrides]
  );

  return { items, loading, refresh, hasModifications };
}
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 3: Event System

### 3.1-3.2 Update WorkspaceUIContext

In `src/workspace/WorkspaceUIContext.tsx`, add:

```typescript
// Add to context value type
interface WorkspaceUIContextValue {
  // ... existing
  onInspectorClosed: (callback: () => void) => () => void;
}

// Inside provider component, add:
const [inspectorClosedCallbacks] = useState<Set<() => void>>(() => new Set());

const onInspectorClosed = useCallback((callback: () => void) => {
  inspectorClosedCallbacks.add(callback);
  return () => {
    inspectorClosedCallbacks.delete(callback);
  };
}, [inspectorClosedCallbacks]);

// Modify closeInspector:
const closeInspector = useCallback(() => {
  setInspector({ isOpen: false, mode: null });
  // Emit event to all subscribers
  inspectorClosedCallbacks.forEach(cb => cb());
}, [inspectorClosedCallbacks]);

// Add to context value
const value = useMemo(() => ({
  // ... existing
  onInspectorClosed,
}), [/* ... existing, */ onInspectorClosed]);
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 4: Migrate Consumers

### 4.1 Update LensPicker

In `src/explore/LensPicker.tsx`:

```typescript
// Replace import
import { useVersionedCollection } from '../../hooks/useVersionedCollection';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';

// In component:
const { getEnabledPersonas } = useNarrativeEngine();
const schemaPersonas = getEnabledPersonas();
const { items: personas, refresh: refreshPersonas } = useVersionedCollection(
  schemaPersonas,
  { objectType: 'lens' }
);

// Remove old imperative effect, replace with:
const { onInspectorClosed } = useOptionalWorkspaceUI() ?? {};
useEffect(() => {
  if (!onInspectorClosed) return;
  return onInspectorClosed(refreshPersonas);
}, [onInspectorClosed, refreshPersonas]);
```

### 4.2 Update JourneyList

Same pattern in `src/explore/JourneyList.tsx`:

```typescript
const { items: journeys, refresh: refreshJourneys } = useVersionedCollection(
  schemaJourneys,
  { objectType: 'journey' }
);

useEffect(() => {
  if (!onInspectorClosed) return;
  return onInspectorClosed(refreshJourneys);
}, [onInspectorClosed, refreshJourneys]);
```

### 4.3 Delete Old Hooks

```bash
rm hooks/useVersionedPersonas.ts
rm hooks/useVersionedJourneys.ts
```

### Build Gate

```bash
npm run build && npm test
# Expect 196+ tests passing
```

---

## Epic 5: Verification

### 5.1 Run Full Test Suite

```bash
npm run build    # Must compile
npm test         # All tests pass
```

### 5.2 Manual Testing

1. Start dev server: `npm run dev`
2. Open workspace, navigate to Lens Picker
3. Click a lens card to open inspector
4. Use Copilot to change description
5. Close inspector
6. Verify card shows updated description
7. Repeat for Journey List

---

## Commit Messages

```bash
# After Epic 1
git add src/core/versioning/merge-config.ts src/core/versioning/index.ts
git commit -m "feat(versioning): add declarative merge configuration"

# After Epic 2
git add hooks/useVersionedCollection.ts
git commit -m "feat(versioning): add generic useVersionedCollection hook"

# After Epic 3
git add src/workspace/WorkspaceUIContext.tsx
git commit -m "feat(workspace): add inspector lifecycle events"

# After Epic 4
git add src/explore/LensPicker.tsx src/explore/JourneyList.tsx
git rm hooks/useVersionedPersonas.ts hooks/useVersionedJourneys.ts
git commit -m "refactor(explore): use generic versioned collection hook"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Type errors in merge-config | Ensure `GroveObjectType` includes 'lens' and 'journey' |
| Infinite re-renders | Check `itemIds` memoization is stable |
| Event not firing | Verify `closeInspector` calls `forEach` on callbacks |
| Old hooks still imported | Run `npm run build` to catch stale imports |

---

## Success Criteria

- [ ] `npm run build` compiles without errors
- [ ] `npm test` passes with 196+ tests
- [ ] LensPicker uses `useVersionedCollection`
- [ ] JourneyList uses `useVersionedCollection`
- [ ] `useVersionedPersonas.ts` deleted
- [ ] `useVersionedJourneys.ts` deleted
- [ ] Inspector close triggers refresh (verified manually)
