# Architecture Decision Records: grove-data-layer-v1

**Sprint:** grove-data-layer-v1  
**Date:** January 1, 2026

---

## ADR-001: Use Provider Pattern for Data Access

**Status:** Accepted

**Context:**
Currently, data access is fragmented:
- Bedrock consoles use localStorage
- Runtime uses Supabase (kinetic-pipeline)
- Legacy code uses GCS

Need unified access that supports multiple backends.

**Decision:**
Implement `GroveDataProvider` interface with pluggable adapters.

**Consequences:**
- ✅ Single interface for all consumers
- ✅ Easy to swap backends
- ✅ Testable with mock adapter
- ⚠️ Additional abstraction layer
- ⚠️ Must maintain adapter parity

---

## ADR-002: Default to HybridAdapter in Production

**Status:** Accepted

**Context:**
Production needs:
- Supabase as source of truth (multi-user, durable)
- Fast reads (don't wait for network every time)
- Offline resilience (show something when network fails)

**Decision:**
Use `HybridAdapter` as production default:
1. Read from localStorage cache first
2. Return immediately if cache hit
3. Refresh from Supabase in background
4. Write to both Supabase and cache

**Consequences:**
- ✅ Fast reads (cache-first)
- ✅ Eventual consistency
- ✅ Graceful degradation
- ⚠️ Stale data possible (mitigated by background refresh)
- ⚠️ Cache invalidation complexity

---

## ADR-003: Use localStorage for Development

**Status:** Accepted

**Context:**
Development needs:
- Fast iteration (no network latency)
- Works offline
- Easy to reset state
- No Supabase credentials required

**Decision:**
Use `LocalStorageAdapter` as default in development.
Developers can override to test with Supabase.

**Consequences:**
- ✅ Zero setup for new developers
- ✅ Fast feedback loop
- ⚠️ Behavior may differ from production
- ⚠️ Data not shared between browsers

---

## ADR-004: Last-Write-Wins for Conflicts

**Status:** Accepted

**Context:**
With multiple users or tabs, writes can conflict.
Options:
1. Last-write-wins (simple)
2. Optimistic locking (version check)
3. CRDT (complex, no conflicts)

**Decision:**
Use last-write-wins for MVP. Most admin workflows are single-user.
Add optimistic locking in future if conflicts become a problem.

**Consequences:**
- ✅ Simple implementation
- ✅ No UI for conflict resolution needed
- ⚠️ Data loss possible in multi-user scenarios
- ⚠️ No warning when overwriting

---

## ADR-005: In-Memory Subscriptions (Not Supabase Realtime)

**Status:** Accepted

**Context:**
Need to notify subscribers when data changes.
Options:
1. In-memory pub/sub (simple, single-tab)
2. Supabase Realtime (multi-tab, more complex)
3. Polling (simple, wasteful)

**Decision:**
Use in-memory subscriptions for MVP.
When write happens, notify all local subscribers.
Cross-tab sync is out of scope for now.

**Consequences:**
- ✅ Simple implementation
- ✅ No additional Supabase features needed
- ⚠️ Changes don't sync across tabs
- ⚠️ Must refresh page to see changes from other tabs

---

## ADR-006: Extend Existing Supabase Schema

**Status:** Accepted

**Context:**
Kinetic Pipeline created `knowledge.*` tables for documents, chunks, hubs, journeys.
Need to add tables for lenses, cards, moments.

**Decision:**
Add new tables in `knowledge` schema:
- `knowledge.lenses`
- `knowledge.cards`
- `knowledge.moments`

Follow existing naming conventions and column patterns.

**Consequences:**
- ✅ Consistent schema
- ✅ Same RLS patterns
- ✅ Reuse existing transforms
- ⚠️ Must deploy schema migration

---

## ADR-007: Transform Between GroveObject and DB Rows

**Status:** Accepted

**Context:**
GroveObject uses camelCase (JavaScript convention).
Supabase/PostgreSQL uses snake_case (SQL convention).
Need consistent translation.

**Decision:**
Create `transforms/` module with bidirectional functions:
- `groveObjectToRow(obj)` → DB row
- `rowToGroveObject(row)` → GroveObject

Each object type has its own transform file.

**Consequences:**
- ✅ Clear mapping
- ✅ Centralized transformation logic
- ⚠️ Must maintain transforms when schema changes
- ⚠️ Additional code to write

---

## ADR-008: Phased Migration (No Big Bang)

**Status:** Accepted

**Context:**
Changing all data access at once is risky.
Need incremental approach.

**Decision:**
Four-phase migration:
1. Create abstraction (no breaking changes)
2. Migrate Bedrock consoles
3. Migrate runtime surfaces
4. Deprecate legacy hooks

Each phase independently deployable.

**Consequences:**
- ✅ Low risk per phase
- ✅ Can rollback individual phases
- ✅ Incremental verification
- ⚠️ Longer total timeline
- ⚠️ Must maintain both old and new paths temporarily

---

## ADR-009: Single useGroveData Hook

**Status:** Accepted

**Context:**
Currently multiple hooks:
- `useLensData`
- `useSproutApi`
- `useJourneyData`
- etc.

**Decision:**
Single `useGroveData<T>(type)` hook replaces all.
Type parameter provides type safety.
Object type determines storage table.

**Consequences:**
- ✅ Consistent API
- ✅ Less code duplication
- ✅ Easier to learn
- ⚠️ Less specialized per-type functionality
- ⚠️ Must migrate existing hook usages

---

## ADR-010: Load Defaults on Cache Miss + Network Failure

**Status:** Accepted

**Context:**
What happens when:
- Cache is empty (first load)
- Network is down (can't reach Supabase)

User expects to see *something*, not an error.

**Decision:**
Fall back to `DEFAULT_*` data from static files:
- `DEFAULT_PERSONAS` for lenses
- `DEFAULT_JOURNEYS` for journeys
- etc.

These are bundled with the app, always available.

**Consequences:**
- ✅ Always shows content
- ✅ Graceful degradation
- ⚠️ User may not realize they're seeing defaults
- ⚠️ Must maintain default data files

---

## ADR-011: Search as Separate Concern from CRUD

**Status:** Accepted

**Context:**
The existing `lib/knowledge/search.js` provides vector similarity search via Supabase pgvector. Should search be part of GroveDataProvider interface?

Options:
1. Add `search(query)` method to GroveDataProvider
2. Keep search separate via `useKnowledgeSearch` hook
3. Treat search as a specialized read operation

**Decision:**
Keep search separate (Option 2). Create `useKnowledgeSearch` hook that wraps existing `lib/knowledge/search.js`.

**Rationale:**
- CRUD and search are fundamentally different operations
- CRUD: "Give me object with ID X" (exact)
- Search: "Find semantically similar to query" (fuzzy)
- Conflating them creates awkward interface
- Existing search implementation already works well

**Consequences:**
- ✅ Clean separation of concerns
- ✅ Reuses existing search infrastructure
- ✅ Simpler GroveDataProvider interface
- ⚠️ Two hooks to learn instead of one
- ⚠️ Must coordinate when creating searchable content

---

## ADR-012: Supabase-Only Scope (No GCS)

**Status:** Accepted

**Context:**
Legacy code paths use GCS (Google Cloud Storage) for knowledge assets. The kinetic-pipeline-v1 sprint moved RAG to Supabase. Should this sprint handle GCS migration?

**Decision:**
This sprint is **Supabase-only**. Legacy GCS paths are out of scope.

**Rationale:**
- /bedrock is intended as reference implementation of Trellis DEX
- Reference implementations shouldn't carry legacy debt
- GCS paths only matter for /genesis (which stays on legacy branch)
- Mixing concerns increases risk

**Consequences:**
- ✅ Cleaner implementation
- ✅ Clear boundary between reference and legacy
- ✅ Reduced scope
- ⚠️ /genesis remains on separate data path
- ⚠️ Must deprecate /genesis separately

---

## ADR-013: Optional Embedding Pipeline Trigger

**Status:** Accepted

**Context:**
When a document is created via GroveDataProvider, should it automatically be sent through the embedding pipeline?

Options:
1. Always trigger embedding on document create
2. Never trigger (manual via Pipeline Monitor)
3. Optional flag on create

**Decision:**
Optional flag (Option 3). Add `triggerEmbedding?: boolean` to create options. Default: false.

**Rationale:**
- Not all documents need embedding (e.g., draft content)
- Pipeline Monitor provides manual control
- Decouples CRUD from pipeline
- Caller decides based on context

**Consequences:**
- ✅ Flexible per use case
- ✅ Doesn't overload pipeline with unfinished content
- ✅ Explicit intent
- ⚠️ Caller must remember to set flag
- ⚠️ Content won't be searchable until embedded
