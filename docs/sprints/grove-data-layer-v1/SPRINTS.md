# Sprint Breakdown: grove-data-layer-v1

**Sprint:** grove-data-layer-v1  
**Date:** January 1, 2026  
**Total Estimated Effort:** 8-11 days

---

## Epic Overview

| Epic | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| 1 | Core Abstraction | 2-3 days | None |
| 2 | Bedrock Migration | 1-2 days | Epic 1 |
| 3 | Runtime Migration | 2-3 days | Epic 1 |
| 4 | Deprecation & Cleanup | 1 day | Epics 2, 3 |
| 5 | Testing & Validation | 2 days | All above |

---

## Epic 1: Core Abstraction

**Goal:** Create GroveDataProvider interface and adapters without breaking changes.

### Story 1.1: Create Interface Definition

**Task:** Define GroveDataProvider interface and types.

**Files to create:**
- `src/core/data/grove-data-provider.ts`

**Implementation:**
```typescript
export interface GroveDataProvider {
  get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null>;
  list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]>;
  create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>>;
  update<T>(type: GroveObjectType, id: string, patches: PatchOperation[]): Promise<GroveObject<T>>;
  delete(type: GroveObjectType, id: string): Promise<void>;
  subscribe?<T>(type: GroveObjectType, callback: (objects: GroveObject<T>[]) => void): () => void;
}

export type GroveObjectType = 'lens' | 'journey' | 'node' | 'hub' | 'sprout' | 'card' | 'moment' | 'document';

export interface ListOptions {
  filter?: Record<string, unknown>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}
```

**Acceptance:**
- [ ] Interface exported
- [ ] Types complete
- [ ] No runtime code yet

---

### Story 1.2: Create LocalStorageAdapter

**Task:** Implement localStorage-based adapter for development.

**Files to create:**
- `src/core/data/adapters/local-storage-adapter.ts`

**Implementation:**
- Storage key pattern: `grove-data-{type}-v1`
- Load defaults on first access
- Notify subscribers on write

**Acceptance:**
- [ ] list() returns all objects of type
- [ ] get() returns single object by ID
- [ ] create() adds to storage
- [ ] update() applies patches
- [ ] delete() removes from storage
- [ ] subscribe() notifies on changes

**Tests:**
- Unit: `tests/unit/data/local-storage-adapter.test.ts`

---

### Story 1.3: Create SupabaseAdapter

**Task:** Implement Supabase-based adapter for production.

**Files to create:**
- `src/core/data/adapters/supabase-adapter.ts`
- `src/core/data/transforms/lens-transforms.ts`
- `src/core/data/transforms/journey-transforms.ts`

**Implementation:**
- Map GroveObjectType to table names
- Transform GroveObject ↔ DB row
- Handle Supabase errors gracefully

**Acceptance:**
- [ ] list() fetches from Supabase
- [ ] Transforms work correctly
- [ ] Errors don't crash

**Tests:**
- Unit: `tests/unit/data/supabase-adapter.test.ts` (mocked)

---

### Story 1.4: Create HybridAdapter

**Task:** Combine Supabase + localStorage cache.

**Files to create:**
- `src/core/data/adapters/hybrid-adapter.ts`

**Implementation:**
- Read: cache first, background refresh
- Write: Supabase first, then cache
- Fallback to defaults on error

**Acceptance:**
- [ ] Cache hit returns immediately
- [ ] Cache miss fetches from Supabase
- [ ] Writes go to both
- [ ] Falls back on error

**Tests:**
- Unit: `tests/unit/data/hybrid-adapter.test.ts`

---

### Story 1.5: Create useGroveData Hook

**Task:** React hook for consuming GroveDataProvider.

**Files to create:**
- `src/core/data/use-grove-data.ts`

**Implementation:**
```typescript
function useGroveData<T>(type: GroveObjectType): UseGroveDataResult<T> {
  const provider = useDataProvider();
  const [objects, setObjects] = useState<GroveObject<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ... implementation
}
```

**Acceptance:**
- [ ] Returns objects, loading, error
- [ ] Provides create, update, remove
- [ ] Subscribes to changes
- [ ] Cleans up on unmount

**Tests:**
- Unit: `tests/unit/data/use-grove-data.test.ts`

---

### Story 1.6: Create Context Provider

**Task:** React context for adapter selection.

**Files to create:**
- `src/core/data/grove-data-context.tsx`
- `src/core/data/index.ts`

**Implementation:**
- Select adapter based on environment
- Allow explicit override via prop
- Provide context to children

**Acceptance:**
- [ ] Development uses LocalStorageAdapter
- [ ] Production uses HybridAdapter
- [ ] Explicit override works

---

### Build Gate (Epic 1)

```bash
npm run build
npm test -- --grep "data"
```

---

## Epic 2: Bedrock Migration

**Goal:** Replace Bedrock console hooks with useGroveData.

### Story 2.1: Add GroveDataProvider to App

**Task:** Wrap application with GroveDataProvider.

**Files to modify:**
- `src/App.tsx`

**Implementation:**
```typescript
import { GroveDataProvider } from '@/core/data';

function App() {
  return (
    <GroveDataProvider>
      {/* existing content */}
    </GroveDataProvider>
  );
}
```

**Acceptance:**
- [ ] Provider wraps entire app
- [ ] No runtime errors
- [ ] Correct adapter selected

---

### Story 2.2: Migrate LensWorkshop

**Task:** Replace useLensData with useGroveData.

**Files to modify:**
- `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`

**Before:**
```typescript
const { objects, create, update, remove } = useLensData();
```

**After:**
```typescript
const { objects, create, update, remove } = useGroveData<LensPayload>('lens');
```

**Acceptance:**
- [ ] Lenses load correctly
- [ ] CRUD operations work
- [ ] Persists to localStorage

---

### Story 2.3: Deprecate useLensData

**Task:** Keep old hook as deprecated wrapper.

**Files to modify:**
- `src/bedrock/consoles/LensWorkshop/useLensData.ts`

**Implementation:**
```typescript
/**
 * @deprecated Use useGroveData<LensPayload>('lens') instead
 */
export function useLensData() {
  console.warn('useLensData is deprecated. Use useGroveData instead.');
  return useGroveData<LensPayload>('lens');
}
```

**Acceptance:**
- [ ] Deprecated annotation added
- [ ] Warning logged on use
- [ ] Still works for now

---

### Story 2.4: Migrate GardenConsole

**Task:** Replace useSproutApi with useGroveData.

**Files to modify:**
- `src/bedrock/consoles/GardenConsole.tsx`

**Acceptance:**
- [ ] Sprouts load correctly
- [ ] CRUD operations work
- [ ] No API calls on render

---

### Build Gate (Epic 2)

```bash
npm run build
npm test
npx playwright test tests/e2e/bedrock/
```

---

## Epic 3: Runtime Migration

**Goal:** Connect runtime surfaces to GroveDataProvider.

### Story 3.1: Migrate Engagement Context

**Task:** Use GroveDataProvider for personas in engagement context.

**Files to modify:**
- `src/core/engagement/context.tsx`

**Before:**
```typescript
const [personas] = useState(DEFAULT_PERSONAS);
```

**After:**
```typescript
const { objects: lenses } = useGroveData<LensPayload>('lens');
const personas = useMemo(() => lenses.map(lensToPersona), [lenses]);
```

**Acceptance:**
- [ ] Personas load from provider
- [ ] Fallback to defaults works
- [ ] No breaking changes

---

### Story 3.2: Migrate LensPicker

**Task:** Use useGroveData in LensPicker.

**Files to modify:**
- `src/explore/LensPicker.tsx`

**Acceptance:**
- [ ] Shows lenses from provider
- [ ] Selection still works
- [ ] Admin edits visible

---

### Story 3.3: Migrate JourneyPicker

**Task:** Use useGroveData for journeys.

**Files to modify:**
- `src/explore/JourneyPicker.tsx`

**Acceptance:**
- [ ] Shows journeys from provider
- [ ] Navigation still works

---

### Story 3.4: Verify End-to-End

**Task:** Test admin edit → runtime display.

**Acceptance:**
- [ ] Edit lens in LensWorkshop
- [ ] Refresh Terminal
- [ ] See updated lens

---

### Story 3.5: Embedding Pipeline Integration

**Task:** When document/sprout created via GroveDataProvider, optionally trigger embedding.

**Files to create:**
- `src/core/data/triggers/embedding-trigger.ts`

**Implementation:**
```typescript
interface CreateOptions {
  triggerEmbedding?: boolean;  // Default: false
}

// In SupabaseAdapter.create()
async create<T>(type: GroveObjectType, object: GroveObject<T>, options?: CreateOptions): Promise<GroveObject<T>> {
  const created = await this.insertToSupabase(type, object);
  
  if (options?.triggerEmbedding && (type === 'document' || type === 'sprout')) {
    // Trigger embedding pipeline (non-blocking)
    fetch('/api/knowledge/embed', { method: 'POST' }).catch(console.error);
  }
  
  return created;
}
```

**Acceptance:**
- [ ] Create document with triggerEmbedding=true → Embedding queued
- [ ] Create document without flag → No automatic embedding
- [ ] Pipeline Monitor shows new document

---

### Story 3.6: Create useKnowledgeSearch Hook

**Task:** Wrap lib/knowledge/search.js for React consumption.

**Files to create:**
- `src/core/data/use-knowledge-search.ts`

**Implementation:**
```typescript
export function useKnowledgeSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: SearchOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}&limit=${options?.limit || 10}`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, error };
}
```

**Acceptance:**
- [ ] Hook returns search function
- [ ] Results come from vector similarity
- [ ] Loading state works
- [ ] Errors handled gracefully

---

### Build Gate (Epic 3)

```bash
npm run build
npm test
npx playwright test
```

---

## Epic 4: Deprecation & Cleanup

**Goal:** Mark old patterns as deprecated.

### Story 4.1: Add Deprecation Warnings

**Task:** Add warnings to all legacy hooks.

**Files to modify:**
- All console-specific data hooks

**Acceptance:**
- [ ] Each deprecated hook logs warning
- [ ] JSDoc @deprecated added

---

### Story 4.2: Update Documentation

**Task:** Document new data access pattern.

**Files to create:**
- `docs/data-layer.md`

**Acceptance:**
- [ ] Usage examples
- [ ] Migration guide
- [ ] API reference

---

### Build Gate (Epic 4)

```bash
npm run build
npm test
```

---

## Epic 5: Testing & Validation

**Goal:** Comprehensive testing of the data layer.

### Story 5.1: Integration Tests

**Task:** Test full data flow.

**Tests to create:**
- `tests/integration/data-layer.test.ts`

**Scenarios:**
- [ ] Bedrock edit → localStorage persists
- [ ] Runtime loads → gets data
- [ ] Multiple types → all work

---

### Story 5.2: E2E Tests

**Task:** End-to-end data flow tests.

**Tests to create/update:**
- `tests/e2e/data-flow.spec.ts`

**Scenarios:**
- [ ] Edit lens in Bedrock → See in Terminal
- [ ] Create sprout → Appears in /explore
- [ ] Delete journey → Disappears from picker

---

### Story 5.3: Performance Validation

**Task:** Verify no performance regression.

**Acceptance:**
- [ ] Page load < 2s
- [ ] No additional network requests
- [ ] Cache hits logged

---

### Final Sprint Gate

```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Success Criteria Summary

| Criterion | Verified By |
|-----------|-------------|
| Single hook | useGroveData used everywhere |
| Bedrock→Runtime sync | E2E test passes |
| No regression | All existing tests pass |
| Performance | Page load < 2s |
| Type safety | No TypeScript errors |
