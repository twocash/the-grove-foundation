# Architecture: grove-data-layer-v1

**Sprint:** grove-data-layer-v1  
**Date:** January 1, 2026  
**Status:** Draft

---

## Architectural Vision

The Grove Data Layer creates a **single point of truth** for all Grove object data. Instead of scattered data access patterns, all surfaces consume the same `GroveDataProvider` interface.

**Critical distinction:** GroveDataProvider handles **CRUD operations** for Grove objects. It is **complementary to** (not a replacement for) the existing embedding pipeline in `lib/knowledge/*`.

---

## System Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM BOUNDARIES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  lib/knowledge/*                    GroveDataProvider                       │
│  (Embedding Pipeline)               (Object CRUD)                           │
│  ─────────────────────              ────────────────                        │
│  ingest → chunk → embed             get / list / create                     │
│  cluster → synthesize               update / delete                         │
│  search (vector similarity)         subscribe                               │
│                                                                             │
│  Tables managed:                    Tables managed:                         │
│  ┌─────────────────────┐            ┌─────────────────────┐                 │
│  │ knowledge.documents │ ◄────────► │ knowledge.documents │  (shared)       │
│  │ knowledge.chunks    │            │ knowledge.lenses    │                 │
│  │ knowledge.embeddings│            │ knowledge.cards     │                 │
│  │ knowledge.hubs      │            │ knowledge.moments   │                 │
│  │ knowledge.hub_members│           │ knowledge.journeys  │  (shared)       │
│  └─────────────────────┘            └─────────────────────┘                 │
│                                                                             │
│  INTEGRATION POINT:                                                         │
│  Documents created via GroveDataProvider can optionally trigger             │
│  the embedding pipeline for vector search indexing.                         │
│                                                                             │
│  SEARCH ACCESS:                                                             │
│  Semantic search remains in lib/knowledge/search.js                         │
│  Exposed via separate useKnowledgeSearch() hook                             │
│  CRUD and search are separate concerns — don't conflate them.               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key principle:** These systems are **complementary, not competing**. CRUD is about managing objects. Embedding/search is about making content discoverable.

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GROVE DATA LAYER CONTEXT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          USER INTERFACES                              │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  BEDROCK (Admin)          TERMINAL (Chat)          GENESIS (Story)    │   │
│  │  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐    │   │
│  │  │ LensWorkshop│          │ LensPicker  │          │ HubExplorer │    │   │
│  │  │ GardenConsole│          │ JourneyNav  │          │ JourneyView │    │   │
│  │  │ PipelineMonitor│        │ ChatStream  │          │ ContentPanel│    │   │
│  │  └──────┬──────┘          └──────┬──────┘          └──────┬──────┘    │   │
│  │         │                        │                        │           │   │
│  └─────────┼────────────────────────┼────────────────────────┼───────────┘   │
│            │                        │                        │               │
│            └────────────────────────┼────────────────────────┘               │
│                                     ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       GROVE DATA LAYER                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │              GroveDataProvider (Interface)                       │ │   │
│  │  │  get() | list() | create() | update() | delete() | subscribe()  │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                               │                                       │   │
│  │         ┌─────────────────────┼─────────────────────┐                │   │
│  │         │                     │                     │                │   │
│  │         ▼                     ▼                     ▼                │   │
│  │  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐        │   │
│  │  │ LocalStorage│       │  Supabase   │       │   Hybrid    │        │   │
│  │  │   Adapter   │       │   Adapter   │       │   Adapter   │        │   │
│  │  └──────┬──────┘       └──────┬──────┘       └──────┬──────┘        │   │
│  │         │                     │                     │                │   │
│  └─────────┼─────────────────────┼─────────────────────┼────────────────┘   │
│            │                     │                     │                    │
│            ▼                     ▼                     ▼                    │
│  ┌──────────────┐     ┌──────────────────────────────────────────────┐     │
│  │ localStorage │     │                  SUPABASE                     │     │
│  │ (browser)    │     │  knowledge.lenses | knowledge.journeys       │     │
│  └──────────────┘     │  knowledge.hubs   | knowledge.documents      │     │
│                       └──────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Write Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WRITE PATH                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin edits lens in LensWorkshop                                        │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const { update } = useGroveData<LensPayload>('lens');               │ │
│     │ await update(id, [{ op: 'replace', path: '/toneGuidance', value }]);│ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  2. GroveDataProvider.update() called                                       │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ provider.update('lens', id, patches)                                │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│              ┌──────────────────────┴──────────────────────┐                │
│              │                                             │                │
│              ▼ (HybridAdapter)                             ▼                │
│  ┌───────────────────────────────┐           ┌───────────────────────────┐  │
│  │ 3a. Write to Supabase         │           │ 3b. Update localStorage   │  │
│  │     (source of truth)         │           │     (cache)               │  │
│  │                               │           │                           │  │
│  │ supabase.from('lenses')       │           │ localStorage.setItem(     │  │
│  │   .update(payload)            │           │   'grove-data-lens-v1',   │  │
│  │   .eq('id', id);              │           │   updated                 │  │
│  └───────────────────────────────┘           │ );                        │  │
│                                              └───────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  4. Notify subscribers                                                      │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ subscribers.forEach(cb => cb(updatedObjects));                      │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  5. Runtime surfaces re-render with new data                                │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ Terminal LensPicker shows updated toneGuidance                      │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Read Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              READ PATH                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Component mounts                                                        │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const { objects, loading } = useGroveData<LensPayload>('lens');     │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  2. Hook calls provider.list('lens')                                        │
│                                     │                                       │
│              ┌──────────────────────┴──────────────────────┐                │
│              │ HybridAdapter                               │                │
│              ▼                                             │                │
│  ┌───────────────────────────────┐                         │                │
│  │ 3a. Check localStorage cache  │                         │                │
│  │                               │                         │                │
│  │ const cached = localStorage   │                         │                │
│  │   .getItem('grove-data-lens');│                         │                │
│  └───────────────────────────────┘                         │                │
│              │                                             │                │
│              ├── Cache HIT ──────────────────────────────► │                │
│              │   Return immediately                        │                │
│              │   Schedule background refresh               │                │
│              │                                             │                │
│              └── Cache MISS ─────────────────────────────► │                │
│                                                            ▼                │
│                               ┌───────────────────────────────────────────┐ │
│                               │ 3b. Fetch from Supabase                   │ │
│                               │                                           │ │
│                               │ const { data } = await supabase           │ │
│                               │   .from('knowledge.lenses')               │ │
│                               │   .select('*');                           │ │
│                               └───────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│                               ┌───────────────────────────────────────────┐ │
│                               │ 3c. Update cache                          │ │
│                               │                                           │ │
│                               │ localStorage.setItem(                     │ │
│                               │   'grove-data-lens-v1',                   │ │
│                               │   JSON.stringify(data)                    │ │
│                               │ );                                        │ │
│                               └───────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  4. Return GroveObject<LensPayload>[] to component                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/core/data/                                                             │
│  ├── grove-data-provider.ts       # Interface definition                    │
│  ├── grove-data-context.tsx       # React context + provider selection      │
│  ├── use-grove-data.ts            # Main hook for consumers                 │
│  ├── index.ts                     # Barrel export                           │
│  │                                                                          │
│  ├── adapters/                                                              │
│  │   ├── local-storage-adapter.ts # Dev/test backend                       │
│  │   ├── supabase-adapter.ts      # Production backend                     │
│  │   ├── hybrid-adapter.ts        # Supabase + cache                       │
│  │   └── index.ts                                                          │
│  │                                                                          │
│  ├── transforms/                                                            │
│  │   ├── lens-transforms.ts       # GroveObject ↔ Supabase row             │
│  │   ├── journey-transforms.ts                                              │
│  │   └── index.ts                                                          │
│  │                                                                          │
│  └── __tests__/                                                             │
│      ├── local-storage-adapter.test.ts                                      │
│      ├── supabase-adapter.test.ts                                           │
│      ├── hybrid-adapter.test.ts                                             │
│      └── use-grove-data.test.ts                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Adapter Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ADAPTER SELECTION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Environment                        Adapter Selected                        │
│  ─────────────                      ────────────────                        │
│                                                                             │
│  NODE_ENV=development          →    LocalStorageAdapter                     │
│  - Fast iteration                   - No network calls                      │
│  - Works offline                    - Persists across refresh               │
│  - Default for dev                  - Easy to reset (clear storage)         │
│                                                                             │
│  NODE_ENV=production           →    HybridAdapter                           │
│  - Real data                        - Supabase as source of truth           │
│  - Multi-user                       - localStorage as cache                 │
│  - Default for prod                 - Background refresh                    │
│                                                                             │
│  NODE_ENV=test                 →    LocalStorageAdapter                     │
│  - Deterministic                    - No external deps                      │
│  - Fast                             - Mockable                              │
│                                                                             │
│  Explicit override:                                                         │
│  <GroveDataProvider adapter="supabase">                                     │
│    ...                              - Forces specific adapter               │
│  </GroveDataProvider>                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GROVE OBJECT TO SUPABASE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GroveObject<LensPayload>                  Supabase: knowledge.lenses       │
│  ───────────────────────                   ─────────────────────────        │
│                                                                             │
│  meta.id                              →    id                               │
│  meta.title                           →    title                            │
│  meta.description                     →    description                      │
│  meta.icon                            →    icon                             │
│  meta.status                          →    status                           │
│  meta.createdAt                       →    created_at                       │
│  meta.updatedAt                       →    updated_at                       │
│                                                                             │
│  payload.color                        →    color                            │
│  payload.toneGuidance                 →    tone_guidance                    │
│  payload.systemPrompt                 →    system_prompt                    │
│  payload.narrativeStyle               →    narrative_style                  │
│  payload.vocabularyLevel              →    vocabulary_level                 │
│  payload.emotionalRegister            →    emotional_register               │
│  payload.arcEmphasis                  →    arc_emphasis (JSONB)             │
│  payload.openingTemplate              →    opening_template                 │
│  payload.openingPhase                 →    opening_phase                    │
│  payload.defaultThreadLength          →    default_thread_length            │
│  payload.entryPoints                  →    entry_points (TEXT[])            │
│  payload.suggestedThread              →    suggested_thread (TEXT[])        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Subscription Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUBSCRIPTION MODEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OPTION A: In-Memory Pub/Sub (MVP)                                          │
│  ─────────────────────────────────                                          │
│                                                                             │
│  ┌─────────────────┐    write    ┌─────────────────┐                        │
│  │ LensWorkshop    │ ──────────► │ GroveDataProvider│                       │
│  │ (subscriber A)  │             │                  │                       │
│  └────────▲────────┘             │ subscribers:     │                       │
│           │                      │ - A: callback_a  │                       │
│  notify() │                      │ - B: callback_b  │                       │
│           │                      └────────┬─────────┘                       │
│  ┌────────┴────────┐                      │                                 │
│  │ Terminal        │ ◄───────── notify() ─┘                                 │
│  │ (subscriber B)  │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
│  OPTION B: Supabase Realtime (Future)                                       │
│  ────────────────────────────────────                                       │
│                                                                             │
│  ┌─────────────────┐             ┌─────────────────┐                        │
│  │ LensWorkshop    │ ──write───► │    Supabase     │                        │
│  └────────▲────────┘             │                 │                        │
│           │                      │ REALTIME channel│                        │
│   realtime│                      └────────┬────────┘                        │
│           │                               │                                 │
│  ┌────────┴────────┐ ◄─── broadcast ──────┘                                 │
│  │ Terminal        │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
│  MVP uses Option A. Option B is future enhancement.                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ERROR HANDLING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario                          Response                                 │
│  ────────                          ────────                                 │
│                                                                             │
│  Supabase unreachable          →   Return cached data + warning             │
│  - Network offline                 - Log error                              │
│  - Supabase down                   - Set error state                        │
│                                    - UI shows stale indicator               │
│                                                                             │
│  Cache empty + Supabase down   →   Return defaults + error                  │
│  - First load, no network          - Load DEFAULT_* data                    │
│                                    - Set error state                        │
│                                    - UI shows offline mode                  │
│                                                                             │
│  Write fails                   →   Queue for retry + error                  │
│  - Network flaky                   - Keep in localStorage                   │
│                                    - Retry on reconnect                     │
│                                    - UI shows pending indicator             │
│                                                                             │
│  Invalid data shape            →   Skip + log                               │
│  - Schema mismatch                 - Continue with valid objects            │
│                                    - Log warning for debugging              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Considerations

| Concern | Strategy |
|---------|----------|
| Initial load | Cache-first: return localStorage immediately, refresh in background |
| Large lists | Pagination support in ListOptions (limit, offset) |
| Frequent writes | Debounce in useGroveData (300ms default) |
| Bundle size | Tree-shakeable adapters; only include what's used |
| Memory | WeakMap for subscription cleanup |
