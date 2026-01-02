# Sprint: grove-data-layer-v1

**Purpose:** Unify Bedrock admin and runtime data access through `GroveDataProvider` abstraction  
**Priority:** High — Unblocks Bedrock → Runtime integration  
**Status:** Planning  
**Branch:** `feature/grove-data-layer`

---

## Quick Links

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current data access patterns |
| [SPEC.md](./SPEC.md) | Full specification |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Data flow diagrams |
| [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff document |
| [DEVLOG.md](./DEVLOG.md) | Progress tracking |

---

## The Problem

Bedrock consoles and runtime surfaces currently use **disconnected data sources**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CURRENT STATE: DISCONNECTED DATA                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BEDROCK (Admin)                      RUNTIME (/explore, Terminal)          │
│  ┌─────────────────┐                  ┌─────────────────┐                   │
│  │ LensWorkshop    │                  │ Terminal        │                   │
│  │ useLensData()   │                  │ NarrativeEngine │                   │
│  └────────┬────────┘                  └────────┬────────┘                   │
│           │                                    │                            │
│           ▼                                    ▼                            │
│  localStorage:                        Supabase (kinetic-pipeline)           │
│  grove-bedrock-lenses-v2              knowledge.documents, embeddings       │
│           │                                    │                            │
│           └──────────── ✗ NOT CONNECTED ✗ ─────┘                            │
│                                                                             │
│  Edits in Bedrock don't flow to /explore.                                   │
│  Runtime doesn't see admin changes.                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Solution

Create **GroveDataProvider** abstraction that both admin and runtime consume:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TARGET STATE: UNIFIED DATA LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BEDROCK (Admin)                      RUNTIME (/explore, Terminal)          │
│  ┌─────────────────┐                  ┌─────────────────┐                   │
│  │ LensWorkshop    │                  │ Terminal        │                   │
│  │ useGroveData()  │                  │ useGroveData()  │                   │
│  └────────┬────────┘                  └────────┬────────┘                   │
│           │                                    │                            │
│           └──────────────┬─────────────────────┘                            │
│                          ▼                                                  │
│               ┌─────────────────────┐                                       │
│               │  GroveDataProvider  │                                       │
│               │  (unified interface)│                                       │
│               └──────────┬──────────┘                                       │
│                          │                                                  │
│           ┌──────────────┼──────────────┐                                   │
│           ▼              ▼              ▼                                   │
│   LocalStorageAdapter  SupabaseAdapter  HybridAdapter                       │
│   (dev/testing)        (production)     (Supabase + cache)                  │
│                                                                             │
│  One interface. Multiple backends. Unified data flow.                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scope

### In Scope

| Area | What's Included |
|------|-----------------|
| **GroveDataProvider interface** | get, list, create, update, delete, subscribe |
| **LocalStorageAdapter** | Development/testing backend |
| **SupabaseAdapter** | Production backend using existing kinetic-pipeline |
| **HybridAdapter** | Supabase + localStorage cache |
| **useGroveData hook** | React hook for CRUD operations |
| **useKnowledgeSearch hook** | Wraps existing vector search (separate concern) |
| **Bedrock console migration** | Replace console-specific hooks |
| **Runtime migration** | Replace NarrativeEngine data loading |
| **Embedding trigger option** | Optional pipeline trigger on document create |

### Out of Scope

| Area | Why Excluded |
|------|--------------|
| New object types | Use existing migration skill |
| Legacy /genesis migration | Separate deprecation effort |
| Publish workflows | Future sprint |
| Conflict resolution | Last-write-wins for MVP |
| Cross-tab sync | Supabase Realtime deferred |

### Critical Distinction

**GroveDataProvider ≠ Search.** This sprint creates:
- `useGroveData<T>(type)` — CRUD for Grove objects
- `useKnowledgeSearch()` — Wraps existing `lib/knowledge/search.js`

These are **complementary systems**, not competing. Don't conflate them.

---

## Success Criteria

1. Edit lens in LensWorkshop → See change in Terminal LensPicker
2. Create sprout in Bedrock → Appears in /explore context
3. `useKnowledgeSearch()` wraps existing vector search API
4. No performance regression (page load < 2s)
5. All existing tests pass
6. Single `useGroveData<T>(type)` hook for all CRUD operations

---

## Estimated Effort

| Phase | Effort | 
|-------|--------|
| Core abstraction | 2-3 days |
| Bedrock migration | 1-2 days |
| Runtime migration | 2-3 days |
| Testing & validation | 2 days |
| **Total** | **~8-11 days** |

---

## Dependencies

- ✅ Kinetic Pipeline complete (Supabase tables exist)
- ✅ Bedrock consoles exist (have UI to migrate)
- ✅ GroveApi pattern exists (REST client abstraction)
- ⚠️ Need to verify Supabase RLS policies for admin writes
