# Specification: grove-data-layer-v1

**Version:** 1.0  
**Date:** January 1, 2026  
**Status:** Draft  
**Branch:** `feature/grove-data-layer`

---

## Constitutional Reference

- [x] Read: PROJECT_PATTERNS.md
- [x] Read: The_Trellis_Architecture__First_Order_Directives.md
- [x] Read: kinetic-pipeline-v1 sprint artifacts
- [x] Read: bedrock-object-migration skill

---

## Executive Summary

This sprint creates the **GroveDataProvider** abstraction—a unified data access layer that connects Bedrock admin consoles to runtime surfaces. Both admin and runtime consume the same interface, with pluggable backends for different environments.

**Core insight:** Data access is currently fragmented across localStorage and direct API calls. This sprint consolidates into a single abstraction backed by Supabase (production) with localStorage caching.

**Scope clarification:** 
- GroveDataProvider handles **CRUD operations** for Grove objects
- Semantic search remains in `lib/knowledge/search.js` via separate `useKnowledgeSearch` hook
- This sprint is **Supabase-only** — legacy GCS paths are out of scope
- Embedding pipeline integration is addressed but pipeline itself is unchanged

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Generic REST client | GroveApi | Add provider pattern for multi-backend |
| Collection management | useCollectionView | Integrate with GroveDataProvider |
| Supabase operations | lib/knowledge/* | Wrap as SupabaseAdapter |

## New Patterns Proposed

### Proposed: GroveDataProvider

**Why existing patterns are insufficient:**

1. **GroveApi** is REST-only; doesn't support localStorage or direct Supabase
2. **lib/knowledge** is Supabase-only; no abstraction layer
3. **Console hooks** are duplicated per console; no sharing

**DEX compliance:**

| Principle | How GroveDataProvider Complies |
|-----------|-------------------------------|
| Declarative Sovereignty | Object types defined in schema, adapters in config |
| Capability Agnosticism | Works with localStorage, Supabase, or future backends |
| Provenance as Infrastructure | All writes include meta.updatedAt, updatedBy |
| Organic Scalability | Add object types without restructuring |

---

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-1 | Read any GroveObject by ID | Must | `get<T>(type, id)` |
| FR-2 | List all objects of a type | Must | `list<T>(type)` |
| FR-3 | Create new objects | Must | `create<T>(type, object)` |
| FR-4 | Update objects via patch | Must | `update<T>(type, id, patches)` |
| FR-5 | Delete objects | Must | `delete(type, id)` |
| FR-6 | Subscribe to changes | Should | Real-time UI updates |
| FR-7 | Support multiple backends | Must | localStorage, Supabase, Hybrid |
| FR-8 | Backward compatibility | Must | Legacy code still works |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Read latency | < 100ms local, < 500ms Supabase |
| NFR-2 | Write durability | Persist within 1s of change |
| NFR-3 | Error handling | Graceful fallback to defaults |
| NFR-4 | Type safety | Full TypeScript generics |

---

## Core Interface

```typescript
// src/core/data/grove-data-provider.ts

/**
 * GroveDataProvider - Unified data access interface
 * 
 * Provides CRUD operations for all Grove object types.
 * Implemented by adapters for different storage backends.
 */
interface GroveDataProvider {
  // Read operations
  get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null>;
  list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]>;
  
  // Write operations
  create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>>;
  update<T>(type: GroveObjectType, id: string, patches: PatchOperation[]): Promise<GroveObject<T>>;
  delete(type: GroveObjectType, id: string): Promise<void>;
  
  // Subscription (optional, for real-time)
  subscribe?<T>(
    type: GroveObjectType, 
    callback: (objects: GroveObject<T>[]) => void
  ): () => void;
}

type GroveObjectType = 
  | 'lens' 
  | 'journey' 
  | 'node' 
  | 'hub' 
  | 'sprout' 
  | 'card' 
  | 'moment'
  | 'document';

interface ListOptions {
  filter?: Record<string, unknown>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}
```

---

## Search Hook (Separate Concern)

**Important:** Semantic search is a separate concern from CRUD. Don't conflate them.

```typescript
// src/core/data/use-knowledge-search.ts

/**
 * useKnowledgeSearch - Semantic search hook
 * 
 * Wraps lib/knowledge/search.js for React consumption.
 * Separate from useGroveData because search is fundamentally
 * different from CRUD operations.
 * 
 * CRUD: "Give me the lens with ID abc123"
 * Search: "Find content semantically similar to 'distributed AI infrastructure'"
 */
interface UseKnowledgeSearchResult {
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
  findSimilar: (documentId: string, limit?: number) => Promise<SearchResult[]>;
  loading: boolean;
  error: string | null;
}

interface SearchOptions {
  limit?: number;
  threshold?: number;  // Minimum similarity (0-1)
  tiers?: string[];    // Filter by document tier
  expand?: boolean;    // Query expansion
}

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  similarity: number;
}

function useKnowledgeSearch(): UseKnowledgeSearchResult {
  // Wraps existing lib/knowledge/search.js
  // No new implementation needed — just React bindings
}
```

**Usage pattern:**

```typescript
// In a component that needs both CRUD and search
import { useGroveData } from '@/core/data';
import { useKnowledgeSearch } from '@/core/data';

function ExplorePanel() {
  // CRUD for managing objects
  const { objects: lenses } = useGroveData<LensPayload>('lens');
  
  // Semantic search for finding content
  const { search, loading } = useKnowledgeSearch();
  
  async function handleSearch(query: string) {
    const results = await search(query, { limit: 10, threshold: 0.5 });
    // results come from vector similarity in Supabase
  }
}
```

---

## Adapter Implementations

### Defaults Module

```typescript
// src/core/data/defaults.ts

/**
 * Default data for each object type.
 * Used when cache is empty AND network fails.
 * These are the same defaults currently in console code.
 */
import { DEFAULT_PERSONAS } from '@/core/engine/personas';
import { DEFAULT_JOURNEYS } from '@/core/engine/journeys';
import type { GroveObject } from '@/core/schema/grove-object';
import type { GroveObjectType } from './grove-data-provider';

const EMPTY_DEFAULTS: GroveObject<unknown>[] = [];

export function getDefaults<T>(type: GroveObjectType): GroveObject<T>[] {
  switch (type) {
    case 'lens':
      return DEFAULT_PERSONAS as GroveObject<T>[];
    case 'journey':
      return DEFAULT_JOURNEYS as GroveObject<T>[];
    default:
      // Most types have no defaults - empty array
      return EMPTY_DEFAULTS as GroveObject<T>[];
  }
}
```

**Note:** DEFAULT_PERSONAS and DEFAULT_JOURNEYS already exist in the codebase. This module just provides a unified access point.

---

### LocalStorageAdapter

```typescript
// src/core/data/adapters/local-storage-adapter.ts

/**
 * LocalStorageAdapter - Development/testing backend
 * 
 * Stores objects in localStorage with key pattern:
 * grove-data-{type}-v1
 */
class LocalStorageAdapter implements GroveDataProvider {
  private getStorageKey(type: GroveObjectType): string {
    return `grove-data-${type}-v1`;
  }

  async list<T>(type: GroveObjectType): Promise<GroveObject<T>[]> {
    const raw = localStorage.getItem(this.getStorageKey(type));
    return raw ? JSON.parse(raw) : this.getDefaults(type);
  }

  async get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null> {
    const all = await this.list<T>(type);
    return all.find(obj => obj.meta.id === id) || null;
  }

  async create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>> {
    const all = await this.list<T>(type);
    const withMeta = {
      ...object,
      meta: {
        ...object.meta,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
    all.push(withMeta);
    localStorage.setItem(this.getStorageKey(type), JSON.stringify(all));
    this.notify(type, all);
    return withMeta;
  }

  // ... update, delete, subscribe implementations
}
```

### SupabaseAdapter

```typescript
// src/core/data/adapters/supabase-adapter.ts

/**
 * SupabaseAdapter - Production backend
 * 
 * Maps GroveObject types to Supabase tables.
 */
class SupabaseAdapter implements GroveDataProvider {
  private supabase: SupabaseClient;
  
  private getTableName(type: GroveObjectType): string {
    const tableMap: Record<GroveObjectType, string> = {
      lens: 'knowledge.lenses',
      journey: 'knowledge.journeys',
      hub: 'knowledge.hubs',
      sprout: 'knowledge.documents',
      document: 'knowledge.documents',
      node: 'knowledge.journey_nodes',
      card: 'knowledge.cards',
      moment: 'knowledge.moments',
    };
    return tableMap[type];
  }

  async list<T>(type: GroveObjectType): Promise<GroveObject<T>[]> {
    const { data, error } = await this.supabase
      .from(this.getTableName(type))
      .select('*');
    
    if (error) throw new Error(error.message);
    return data.map(row => this.rowToGroveObject<T>(row, type));
  }

  // ... other implementations
}
```

**Explicit Table Schema Mapping:**

| GroveObjectType | Supabase Table | Existing? | Notes |
|-----------------|----------------|-----------|-------|
| `lens` | `knowledge.lenses` | ❌ Create | Stores personas/lenses |
| `journey` | `knowledge.journeys` | ✅ Exists | From kinetic-pipeline |
| `hub` | `knowledge.hubs` | ✅ Exists | From kinetic-pipeline |
| `sprout` | `knowledge.documents` | ✅ Exists | Filter by tier='sprout' |
| `document` | `knowledge.documents` | ✅ Exists | General documents |
| `node` | `knowledge.journey_nodes` | ❌ Create | Journey waypoints |
| `card` | `knowledge.cards` | ❌ Create | Exploration cards |
| `moment` | `knowledge.moments` | ❌ Create | Trigger-based interactions |

**Column Mapping (GroveObject → Supabase Row):**

```typescript
// src/core/data/transforms/column-mapping.ts

// GroveObject.meta fields → standard columns (all tables)
const META_COLUMN_MAP = {
  'meta.id': 'id',
  'meta.title': 'title',
  'meta.description': 'description',
  'meta.icon': 'icon',
  'meta.status': 'status',
  'meta.createdAt': 'created_at',
  'meta.updatedAt': 'updated_at',
};

// Payload fields are JSONB or flattened depending on table
// For lenses: flatten to columns (frequently queried)
// For cards/moments: store as JSONB payload column
```

---

### HybridAdapter (Read-Through Cache)

```typescript
// src/core/data/adapters/hybrid-adapter.ts

/**
 * HybridAdapter - Read-Through Cache Pattern
 * 
 * READS: Cache-first with background refresh
 * WRITES: Supabase-first (source of truth), then update cache
 * 
 * Simpler than full sync - no cache invalidation complexity.
 */
class HybridAdapter implements GroveDataProvider {
  private supabase: SupabaseAdapter;
  private localStorage: LocalStorageAdapter;
  private refreshing = new Set<GroveObjectType>();
  
  async list<T>(type: GroveObjectType): Promise<GroveObject<T>[]> {
    // 1. Check cache
    const cached = this.localStorage.getCached<T>(type);
    
    // 2. If cache exists, return immediately + background refresh
    if (cached && cached.length > 0) {
      this.backgroundRefresh(type);
      return cached;
    }
    
    // 3. Cache miss - blocking fetch from Supabase
    try {
      const fresh = await this.supabase.list<T>(type);
      this.localStorage.setCache(type, fresh);
      return fresh;
    } catch (error) {
      // 4. Network failure - return defaults
      console.warn(`[HybridAdapter] Supabase unavailable, using defaults for ${type}`);
      return getDefaults<T>(type);
    }
  }

  async create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>> {
    // Write to Supabase FIRST (source of truth)
    const created = await this.supabase.create<T>(type, object);
    // Update cache (non-blocking)
    this.localStorage.addToCache(type, created);
    return created;
  }

  async update<T>(type: GroveObjectType, id: string, patches: PatchOperation[]): Promise<GroveObject<T>> {
    // Write to Supabase FIRST
    const updated = await this.supabase.update<T>(type, id, patches);
    // Update cache (non-blocking)
    this.localStorage.updateInCache(type, id, updated);
    return updated;
  }

  async delete(type: GroveObjectType, id: string): Promise<void> {
    // Delete from Supabase FIRST
    await this.supabase.delete(type, id);
    // Update cache (non-blocking)
    this.localStorage.removeFromCache(type, id);
  }

  private backgroundRefresh<T>(type: GroveObjectType): void {
    // Prevent multiple concurrent refreshes for same type
    if (this.refreshing.has(type)) return;
    this.refreshing.add(type);
    
    this.supabase.list<T>(type)
      .then(fresh => {
        this.localStorage.setCache(type, fresh);
      })
      .catch(err => {
        console.warn(`[HybridAdapter] Background refresh failed for ${type}:`, err);
      })
      .finally(() => {
        this.refreshing.delete(type);
      });
  }
}
```

**Why Read-Through (not Write-Through or Write-Behind):**
- Simpler: No sync queue, no conflict resolution
- Cache is always eventually consistent
- Stale reads acceptable for admin content (refresh on next page load)
- Write failures surface immediately (don't hide in queue)

---

## React Hook

```typescript
// src/core/data/use-grove-data.ts

interface UseGroveDataResult<T> {
  objects: GroveObject<T>[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  create: (defaults?: Partial<T>) => Promise<GroveObject<T>>;
  update: (id: string, patches: PatchOperation[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  
  // Utilities
  getById: (id: string) => GroveObject<T> | undefined;
  refetch: () => Promise<void>;
}

/**
 * useGroveData - Universal data access hook
 * 
 * Usage:
 * const { objects, create, update } = useGroveData<LensPayload>('lens');
 */
function useGroveData<T>(type: GroveObjectType): UseGroveDataResult<T> {
  const provider = useDataProvider(); // From context
  const [objects, setObjects] = useState<GroveObject<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // Subscribe to changes if supported
    const unsubscribe = provider.subscribe?.<T>(type, setObjects);
    return () => unsubscribe?.();
  }, [type]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await provider.list<T>(type);
      setObjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ... create, update, remove implementations

  return { objects, loading, error, create, update, remove, getById, refetch };
}
```

---

## Provider Context

```typescript
// src/core/data/grove-data-context.tsx

const GroveDataContext = createContext<GroveDataProvider | null>(null);

interface GroveDataProviderProps {
  children: React.ReactNode;
  adapter?: 'local' | 'supabase' | 'hybrid';
}

/**
 * GroveDataProvider - Context wrapper
 * 
 * Selects adapter based on environment or prop.
 * Default: 'hybrid' in production, 'local' in development.
 */
function GroveDataProviderWrapper({ children, adapter }: GroveDataProviderProps) {
  const selectedAdapter = adapter || (
    process.env.NODE_ENV === 'production' ? 'hybrid' : 'local'
  );

  const provider = useMemo(() => {
    switch (selectedAdapter) {
      case 'local': return new LocalStorageAdapter();
      case 'supabase': return new SupabaseAdapter();
      case 'hybrid': return new HybridAdapter();
    }
  }, [selectedAdapter]);

  return (
    <GroveDataContext.Provider value={provider}>
      {children}
    </GroveDataContext.Provider>
  );
}
```

---

## Supabase Schema Additions

```sql
-- New table for lenses (personas)
CREATE TABLE knowledge.lenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Meta fields
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Payload fields
  color TEXT,
  tone_guidance TEXT,
  system_prompt TEXT,
  narrative_style TEXT,
  vocabulary_level TEXT,
  emotional_register TEXT,
  arc_emphasis JSONB DEFAULT '{}',
  opening_template TEXT,
  opening_phase TEXT,
  default_thread_length INTEGER DEFAULT 5,
  entry_points TEXT[],
  suggested_thread TEXT[]
);

-- New table for cards
CREATE TABLE knowledge.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  query TEXT,
  personas TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- New table for moments
CREATE TABLE knowledge.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  trigger JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for admin writes
ALTER TABLE knowledge.lenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.lenses FOR ALL USING (true);

ALTER TABLE knowledge.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.cards FOR ALL USING (true);

ALTER TABLE knowledge.moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.moments FOR ALL USING (true);
```

---

## Migration Strategy

### Phase 1: Create Abstraction (No Breaking Changes)

Build provider and adapters without touching existing code.

| What | How |
|------|-----|
| Create interface | New file, no imports yet |
| Create adapters | New files, self-contained |
| Create hook | New file, can coexist with old hooks |
| Create context | New file, optional usage |

### Phase 2: Migrate Bedrock Consoles

Replace console-specific hooks with `useGroveData`.

**Before:**
```typescript
// LensWorkshop.tsx
import { useLensData } from './useLensData';
const { objects, create, update } = useLensData();
```

**After:**
```typescript
// LensWorkshop.tsx
import { useGroveData } from '@/core/data';
const { objects, create, update } = useGroveData<LensPayload>('lens');
```

### Phase 3: Migrate Runtime

Refactor NarrativeEngine to consume GroveDataProvider.

**Before:**
```typescript
// NarrativeEngineContext.tsx
const [personas] = useState(DEFAULT_PERSONAS);
```

**After:**
```typescript
// NarrativeEngineContext.tsx
const { objects: lenses } = useGroveData<LensPayload>('lens');
const personas = useMemo(() => lenses.map(lensToPersona), [lenses]);
```

### Phase 4: Deprecate Legacy

Mark old hooks as deprecated.

```typescript
/**
 * @deprecated Use useGroveData<LensPayload>('lens') instead
 */
export function useLensData() {
  console.warn('useLensData deprecated. Use useGroveData.');
  return useGroveData<LensPayload>('lens');
}
```

---

## Testing Strategy

### Unit Tests

| Test | What It Verifies |
|------|------------------|
| LocalStorageAdapter.list() | Returns all objects |
| LocalStorageAdapter.create() | Adds to storage |
| LocalStorageAdapter.update() | Applies patches |
| SupabaseAdapter.list() | Fetches from table |
| HybridAdapter cache hit | Returns without API |
| HybridAdapter cache miss | Fetches and caches |

### Integration Tests

| Test | What It Verifies |
|------|------------------|
| Bedrock edit → Runtime sees | Full write path |
| Runtime load cold | No cache scenario |
| Concurrent edits | Last-write-wins |

### E2E Tests

```typescript
test('Edit lens in Bedrock appears in Terminal', async ({ page }) => {
  // Edit in Bedrock
  await page.goto('/bedrock/lens-workshop');
  await page.click('[data-testid="lens-card-academic"]');
  await page.fill('[data-testid="tone-guidance"]', 'Test change');
  await page.click('[data-testid="save-button"]');
  
  // Verify in Terminal
  await page.goto('/explore');
  await page.click('[data-testid="lens-picker"]');
  await expect(page.locator('text=Test change')).toBeVisible();
});
```

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Bedrock→Runtime sync | Edit lens → See in Terminal |
| No performance regression | Page load < 2s |
| Backward compatibility | All tests pass |
| Single hook | `useGroveData` replaces all |
| Type safety | Full generics, no `any` |

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| Cache TTL? | 5min / 10min / no-expiry | 5min for balance |
| Offline support? | Full / Partial / None | None for MVP |
| Conflict resolution? | Last-write / Merge / Lock | Last-write for MVP |
| Real-time sync? | Supabase realtime / Polling / None | Polling for MVP |

---

## Approvals

- [ ] Architecture review
- [ ] Supabase schema review
- [ ] DEX compliance verified
- [ ] Sprint ready for execution
