# Sprint Breakdown: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## Epic 1: Core Infrastructure

### Story 1.1: Create Merge Configuration

**Task:** Create `src/core/versioning/merge-config.ts` with declarative field mappings.

**Implementation:**
```typescript
export interface MergeConfig {
  metaFields: Array<{ source: string; target: string }>;
  payloadFields: Array<{ source: string; target?: string }>;
}

export const MERGE_CONFIGS: Partial<Record<GroveObjectType, MergeConfig>> = {
  lens: { ... },
  journey: { ... },
};

export function applyMergeConfig<T>(item: T, stored: StoredObject, config: MergeConfig): T
```

**Tests:**
- Unit: `tests/unit/versioning/merge-config.test.ts`
  - `applyMergeConfig merges meta fields correctly`
  - `applyMergeConfig merges payload fields correctly`
  - `applyMergeConfig handles missing fields gracefully`

### Story 1.2: Export from Versioning Index

**Task:** Update `src/core/versioning/index.ts` to export merge config.

**Implementation:**
```typescript
export { MERGE_CONFIGS, applyMergeConfig } from './merge-config';
export type { MergeConfig } from './merge-config';
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 2: Generic Hook

### Story 2.1: Create useVersionedCollection Hook

**Task:** Create `hooks/useVersionedCollection.ts` implementing generic pattern.

**Implementation:**
```typescript
export function useVersionedCollection<T extends { id: string }>(
  schemaItems: T[],
  options: { objectType: GroveObjectType }
): {
  items: (T & VersionedMeta)[];
  loading: boolean;
  refresh: () => void;
  hasModifications: (id: string) => boolean;
}
```

**Key Logic:**
1. Memoize item IDs to prevent infinite loops
2. Load overrides from IndexedDB
3. Apply merge config to each item with override
4. Return merged items

### Story 2.2: Add Unit Tests

**Task:** Create `tests/unit/versioning/collection.test.ts`

**Tests:**
- `useVersionedCollection returns schema items when no overrides`
- `useVersionedCollection merges versioned data over schema`
- `useVersionedCollection refresh reloads from IndexedDB`
- `useVersionedCollection hasModifications returns correct boolean`

**Test Setup:**
```typescript
// Mock getVersionedObjectStore
vi.mock('@core/versioning', () => ({
  getVersionedObjectStore: vi.fn(),
  MERGE_CONFIGS: { ... },
}));
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 3: Event System

### Story 3.1: Add Event Subscription to WorkspaceUIContext

**Task:** Add `onInspectorClosed` to context value.

**Implementation:**
```typescript
// In WorkspaceUIContext.tsx
const [closedCallbacks] = useState<Set<() => void>>(() => new Set());

const onInspectorClosed = useCallback((cb: () => void) => {
  closedCallbacks.add(cb);
  return () => closedCallbacks.delete(cb);
}, [closedCallbacks]);

// Add to context value
value={{ ..., onInspectorClosed }}
```

### Story 3.2: Emit Event on Close

**Task:** Update `closeInspector` to emit event.

**Implementation:**
```typescript
const closeInspector = useCallback(() => {
  setInspector({ isOpen: false, mode: null });
  // Emit to all subscribers
  closedCallbacks.forEach(cb => cb());
}, [closedCallbacks]);
```

### Build Gate

```bash
npm run build && npm test
```

---

## Epic 4: Migrate Consumers

### Story 4.1: Update LensPicker

**Task:** Replace `useVersionedPersonas` with `useVersionedCollection`.

**Changes:**
```typescript
// Before
import { useVersionedPersonas } from '../../hooks/useVersionedPersonas';
const { personas, refresh } = useVersionedPersonas();

// After
import { useVersionedCollection } from '../../hooks/useVersionedCollection';
const { getEnabledPersonas } = useNarrativeEngine();
const schemaPersonas = getEnabledPersonas();
const { items: personas, refresh } = useVersionedCollection(schemaPersonas, { objectType: 'lens' });
```

**Also:**
- Remove imperative effect
- Subscribe to `onInspectorClosed`

### Story 4.2: Update JourneyList

**Task:** Same pattern as LensPicker for journeys.

**Changes:**
```typescript
const { items: journeys, refresh } = useVersionedCollection(schemaJourneys, { objectType: 'journey' });
```

### Story 4.3: Delete Old Hooks

**Task:** Remove deprecated files.

**Files to Delete:**
- `hooks/useVersionedPersonas.ts`
- `hooks/useVersionedJourneys.ts`

### Build Gate

```bash
npm run build && npm test
# Expect 196+ tests passing
```

---

## Epic 5: Verification

### Story 5.1: Full Test Suite

**Commands:**
```bash
npm run build    # Must compile
npm test         # All tests pass
```

### Story 5.2: Manual Testing

**Checklist:**
- [ ] Open LensPicker, edit a lens via Copilot, close inspector → card updates
- [ ] Open JourneyList, edit a journey via Copilot, close inspector → card updates
- [ ] Refresh page → versioned data persists
- [ ] No console errors

---

## Commit Sequence

| Commit | Epic | Message |
|--------|------|---------|
| 1 | 1.1-1.2 | `feat(versioning): add declarative merge configuration` |
| 2 | 2.1-2.2 | `feat(versioning): add generic useVersionedCollection hook` |
| 3 | 3.1-3.2 | `feat(workspace): add inspector lifecycle events` |
| 4 | 4.1-4.2 | `refactor(explore): use generic versioned collection hook` |
| 5 | 4.3 | `chore: remove deprecated versioned hooks` |
| 6 | 5.1-5.2 | `test: verify versioned collection refactor` |
