# Execution Prompt: grove-data-layer-v1

**Sprint:** grove-data-layer-v1  
**Start Date:** January 1, 2026  
**Target:** 8-11 days  
**Branch:** `feature/grove-data-layer`

---

## Context

You are implementing the **Grove Data Layer** — a unified data access abstraction that connects Bedrock admin consoles to runtime surfaces.

**Key insight:** Data access is currently fragmented. This sprint consolidates into a single `GroveDataProvider` interface with pluggable adapters.

**Critical distinction:** GroveDataProvider handles **CRUD operations**. Semantic search remains in `lib/knowledge/search.js` and is exposed via a **separate** `useKnowledgeSearch` hook. Don't conflate them.

### What You're Building

1. **GroveDataProvider interface** — get, list, create, update, delete, subscribe
2. **LocalStorageAdapter** — Development/testing backend
3. **SupabaseAdapter** — Production backend (source of truth)
4. **HybridAdapter** — Supabase + localStorage cache
5. **useGroveData hook** — React hook for CRUD operations
6. **useKnowledgeSearch hook** — React hook wrapping existing vector search
7. **Embedding trigger** — Optional pipeline integration on document create
8. **Migrations** — Update Bedrock consoles and runtime surfaces

---

## Pre-Execution Setup

### 1. Create Branch

```bash
git checkout bedrock
git pull origin bedrock
git checkout -b feature/grove-data-layer
```

### 2. Verify Environment

```bash
# Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Should both be set
```

### 3. Verify Existing Infrastructure

```bash
# Existing files to reference
cat lib/supabase.js              # Supabase client
cat src/core/schema/grove-object.ts  # GroveObject type
cat src/bedrock/patterns/GroveApi.ts # REST client pattern
```

---

## Epic 1: Core Abstraction

### Story 1.1: Create Interface

**Create:** `src/core/data/grove-data-provider.ts`

```typescript
// src/core/data/grove-data-provider.ts

import type { GroveObject, PatchOperation } from '../schema/grove-object';

export type GroveObjectType = 
  | 'lens' 
  | 'journey' 
  | 'node' 
  | 'hub' 
  | 'sprout' 
  | 'card' 
  | 'moment'
  | 'document';

export interface ListOptions {
  filter?: Record<string, unknown>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

export interface GroveDataProvider {
  get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null>;
  list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]>;
  create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>>;
  update<T>(type: GroveObjectType, id: string, patches: PatchOperation[]): Promise<GroveObject<T>>;
  delete(type: GroveObjectType, id: string): Promise<void>;
  subscribe?<T>(type: GroveObjectType, callback: (objects: GroveObject<T>[]) => void): () => void;
}
```

### Story 1.2: Create LocalStorageAdapter

**Create:** `src/core/data/defaults.ts` (dependency for adapters)

```typescript
// src/core/data/defaults.ts

/**
 * Default data for each object type.
 * Used when cache is empty AND network fails.
 */
import { DEFAULT_PERSONAS } from '@/core/engine/personas';
import type { GroveObject } from '@/core/schema/grove-object';
import type { GroveObjectType } from './grove-data-provider';

const EMPTY_DEFAULTS: GroveObject<unknown>[] = [];

export function getDefaults<T>(type: GroveObjectType): GroveObject<T>[] {
  switch (type) {
    case 'lens':
      // DEFAULT_PERSONAS already exists in codebase
      return DEFAULT_PERSONAS as GroveObject<T>[];
    default:
      return EMPTY_DEFAULTS as GroveObject<T>[];
  }
}
```

**Create:** `src/core/data/adapters/local-storage-adapter.ts`

```typescript
// src/core/data/adapters/local-storage-adapter.ts

import type { GroveObject, PatchOperation } from '../../schema/grove-object';
import type { GroveDataProvider, GroveObjectType, ListOptions } from '../grove-data-provider';
import { getDefaults } from './defaults';
import { applyPatches } from '../../copilot/patch-generator';

type Subscriber<T> = (objects: GroveObject<T>[]) => void;

export class LocalStorageAdapter implements GroveDataProvider {
  private subscribers = new Map<GroveObjectType, Set<Subscriber<unknown>>>();

  private getStorageKey(type: GroveObjectType): string {
    return `grove-data-${type}-v1`;
  }

  async list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]> {
    const raw = localStorage.getItem(this.getStorageKey(type));
    let objects: GroveObject<T>[] = raw ? JSON.parse(raw) : getDefaults(type);
    
    // Apply filters if specified
    if (options?.filter) {
      objects = objects.filter(obj => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (obj.payload as Record<string, unknown>)[key] === value;
        });
      });
    }
    
    // Apply sort if specified
    if (options?.sort) {
      const { field, direction } = options.sort;
      objects.sort((a, b) => {
        const aVal = (a.payload as Record<string, unknown>)[field];
        const bVal = (b.payload as Record<string, unknown>)[field];
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return objects;
  }

  async get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null> {
    const all = await this.list<T>(type);
    return all.find(obj => obj.meta.id === id) || null;
  }

  async create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>> {
    const all = await this.list<T>(type);
    const withMeta: GroveObject<T> = {
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

  async update<T>(type: GroveObjectType, id: string, patches: PatchOperation[]): Promise<GroveObject<T>> {
    const all = await this.list<T>(type);
    const index = all.findIndex(obj => obj.meta.id === id);
    if (index === -1) throw new Error(`Object not found: ${id}`);
    
    const updated = applyPatches(all[index], patches);
    updated.meta.updatedAt = new Date().toISOString();
    all[index] = updated;
    
    localStorage.setItem(this.getStorageKey(type), JSON.stringify(all));
    this.notify(type, all);
    return updated;
  }

  async delete(type: GroveObjectType, id: string): Promise<void> {
    const all = await this.list(type);
    const filtered = all.filter(obj => obj.meta.id !== id);
    localStorage.setItem(this.getStorageKey(type), JSON.stringify(filtered));
    this.notify(type, filtered);
  }

  subscribe<T>(type: GroveObjectType, callback: (objects: GroveObject<T>[]) => void): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback as Subscriber<unknown>);
    
    return () => {
      this.subscribers.get(type)?.delete(callback as Subscriber<unknown>);
    };
  }

  private notify<T>(type: GroveObjectType, objects: GroveObject<T>[]): void {
    this.subscribers.get(type)?.forEach(cb => cb(objects));
  }
}
```

### Story 1.3: Create SupabaseAdapter

**Create:** `src/core/data/adapters/supabase-adapter.ts`

Reference `lib/supabase.js` for client initialization.
Reference `lib/knowledge/*.js` for existing patterns.

Key implementation points:
- Map GroveObjectType to table name
- Transform GroveObject ↔ DB row (camelCase ↔ snake_case)
- Handle errors gracefully

### Story 1.4: Create HybridAdapter

**Create:** `src/core/data/adapters/hybrid-adapter.ts`

Combine LocalStorageAdapter (cache) + SupabaseAdapter (source of truth).

### Story 1.5: Create useGroveData Hook

**Create:** `src/core/data/use-grove-data.ts`

```typescript
// src/core/data/use-grove-data.ts

import { useState, useEffect, useCallback } from 'react';
import type { GroveObject, PatchOperation } from '../schema/grove-object';
import type { GroveObjectType } from './grove-data-provider';
import { useDataProvider } from './grove-data-context';

export interface UseGroveDataResult<T> {
  objects: GroveObject<T>[];
  loading: boolean;
  error: string | null;
  create: (object: GroveObject<T>) => Promise<GroveObject<T>>;
  update: (id: string, patches: PatchOperation[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => GroveObject<T> | undefined;
  refetch: () => Promise<void>;
}

export function useGroveData<T>(type: GroveObjectType): UseGroveDataResult<T> {
  const provider = useDataProvider();
  const [objects, setObjects] = useState<GroveObject<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await provider.list<T>(type);
      setObjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [provider, type]);

  useEffect(() => {
    loadData();
    const unsubscribe = provider.subscribe?.<T>(type, setObjects);
    return () => unsubscribe?.();
  }, [loadData, provider, type]);

  const create = useCallback(async (object: GroveObject<T>) => {
    return provider.create<T>(type, object);
  }, [provider, type]);

  const update = useCallback(async (id: string, patches: PatchOperation[]) => {
    await provider.update<T>(type, id, patches);
  }, [provider, type]);

  const remove = useCallback(async (id: string) => {
    await provider.delete(type, id);
  }, [provider, type]);

  const getById = useCallback((id: string) => {
    return objects.find(obj => obj.meta.id === id);
  }, [objects]);

  return {
    objects,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    refetch: loadData,
  };
}
```

### Story 1.6: Create Context & Barrel

**Create:** `src/core/data/grove-data-context.tsx`
**Create:** `src/core/data/index.ts`

---

## Build Gate (Epic 1)

```bash
npm run build
npm test -- --grep "data"

# Expected: Build passes, tests pass
```

---

## Epic 2: Bedrock Migration

### Story 2.1: Add Provider to App

**Modify:** `src/App.tsx`

Add `<GroveDataProvider>` wrapper around content.

### Story 2.2-2.4: Migrate Consoles

Replace console-specific hooks with `useGroveData`.

**Before:**
```typescript
import { useLensData } from './useLensData';
const { objects, create } = useLensData();
```

**After:**
```typescript
import { useGroveData } from '@/core/data';
const { objects, create } = useGroveData<LensPayload>('lens');
```

---

## Build Gate (Epic 2)

```bash
npm run build
npm test
npx playwright test tests/e2e/bedrock/
```

---

## Epic 3: Runtime Migration

### Key Changes

1. Update `src/core/engagement/context.tsx` to use provider
2. Update `src/explore/LensPicker.tsx` to use hook
3. Update `src/explore/JourneyPicker.tsx` to use hook

### Story 3.5: Create useKnowledgeSearch Hook

**Create:** `src/core/data/use-knowledge-search.ts`

```typescript
// src/core/data/use-knowledge-search.ts

import { useState, useCallback } from 'react';

export interface SearchOptions {
  limit?: number;
  threshold?: number;  // Minimum similarity (0-1)
  tiers?: string[];    // Filter by document tier
  expand?: boolean;    // Query expansion
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  similarity: number;
}

export interface UseKnowledgeSearchResult {
  search: (query: string, options?: SearchOptions) => Promise<SearchResult[]>;
  findSimilar: (documentId: string, limit?: number) => Promise<SearchResult[]>;
  loading: boolean;
  error: string | null;
}

/**
 * useKnowledgeSearch - Semantic search hook
 * 
 * Wraps lib/knowledge/search.js for React consumption.
 * Separate from useGroveData because search is fundamentally
 * different from CRUD operations.
 */
export function useKnowledgeSearch(): UseKnowledgeSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: SearchOptions): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query });
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.threshold) params.set('threshold', String(options.threshold));
      if (options?.expand) params.set('expand', 'true');
      if (options?.tiers) params.set('tiers', options.tiers.join(','));
      
      const response = await fetch(`/api/knowledge/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const findSimilar = useCallback(async (documentId: string, limit = 5): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/knowledge/similar/${documentId}?limit=${limit}`);
      if (!response.ok) throw new Error('Similar search failed');
      return await response.json();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, findSimilar, loading, error };
}
```

**Add to barrel:** `src/core/data/index.ts`

```typescript
export { useKnowledgeSearch } from './use-knowledge-search';
export type { SearchOptions, SearchResult, UseKnowledgeSearchResult } from './use-knowledge-search';
```

### Story 3.6: Add Embedding Trigger Option

**Create:** `src/core/data/triggers/embedding-trigger.ts`

```typescript
// src/core/data/triggers/embedding-trigger.ts

/**
 * Triggers embedding pipeline for a document.
 * Non-blocking - queues the embed operation.
 */
export async function triggerEmbedding(documentId?: string): Promise<void> {
  try {
    const body = documentId ? { documentId } : {};
    await fetch('/api/knowledge/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`[embedding-trigger] Queued embedding${documentId ? ` for ${documentId}` : ''}`);
  } catch (error) {
    // Non-blocking - log but don't throw
    console.error('[embedding-trigger] Failed to trigger embedding:', error);
  }
}
```

**Update SupabaseAdapter create method:**

```typescript
// In src/core/data/adapters/supabase-adapter.ts

import { triggerEmbedding } from '../triggers/embedding-trigger';

export interface CreateOptions {
  triggerEmbedding?: boolean;  // Default: false
}

// Modify create method signature
async create<T>(
  type: GroveObjectType, 
  object: GroveObject<T>, 
  options?: CreateOptions
): Promise<GroveObject<T>> {
  const created = await this.insertToSupabase(type, object);
  
  // Optionally trigger embedding pipeline (non-blocking)
  if (options?.triggerEmbedding && (type === 'document' || type === 'sprout')) {
    triggerEmbedding(created.meta.id);
  }
  
  return created;
}
```

---

## Build Gate (Epic 3)

```bash
npm run build
npm test
npx playwright test
```

---

## Epic 4-5: Cleanup & Testing

Add deprecation warnings, write integration tests, validate performance.

---

## Final Sprint Gate

```bash
# All tests pass
npm test
npx playwright test

# Build succeeds
npm run build

# Health checks pass
npm run health
```

### Key Scenarios to Verify

1. Edit lens in LensWorkshop → See change in Terminal LensPicker
2. Create sprout in Bedrock → Appears in /explore context
3. `useKnowledgeSearch` returns vector search results
4. Document created with `triggerEmbedding: true` → Pipeline queues embedding
5. Page load < 2s

---

## Rollback Plan

If migration breaks production, rollback per phase:

| Phase | Rollback Commands |
|-------|-------------------|
| Phase 1 (Core) | `git checkout bedrock -- src/core/data/` (or delete folder) |
| Phase 2 (Bedrock) | `git checkout bedrock -- src/bedrock/consoles/ src/App.tsx` |
| Phase 3 (Runtime) | `git checkout bedrock -- src/core/engagement/ src/explore/` |

**Quick reset:**
```bash
# Revert all changes, keep branch for debugging
git stash

# Or abandon entirely
git checkout bedrock
git branch -D feature/grove-data-layer
```

---

## Troubleshooting

### Supabase Connection Failed

```bash
# Check credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Check network
curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

### localStorage Not Persisting

```bash
# Check storage quota
# Chrome: DevTools → Application → Storage
# Clear if needed: localStorage.clear()
```

### Type Errors

Ensure GroveObject imports are from `@/core/schema/grove-object`.

---

## Completion Checklist

- [ ] Epic 1: Core abstraction complete
- [ ] Epic 2: Bedrock consoles migrated
- [ ] Epic 3: Runtime surfaces migrated
- [ ] Epic 4: Deprecation warnings added
- [ ] Epic 5: All tests pass
- [ ] Edit lens in Bedrock → See in Terminal
- [ ] Page load < 2s

---

## Log Progress

Update `DEVLOG.md` after each epic.
