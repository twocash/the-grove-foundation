# Repository Audit: grove-data-layer-v1

**Date:** January 1, 2026  
**Sprint:** grove-data-layer-v1  
**Auditor:** Claude

---

## Current Data Access Patterns

### 1. Bedrock Consoles (Admin)

| Console | Current Data Source | Hook | Location |
|---------|---------------------|------|----------|
| LensWorkshop | localStorage + DEFAULT_PERSONAS | `useLensData()` | Inline in console |
| GardenConsole | API `/api/sprouts` | `useSproutApi()` | `src/bedrock/api/sprouts.ts` |
| PipelineMonitor | API `/api/knowledge/*` | Direct fetch | Inline in console |

**Pattern:** Each console implements its own data loading strategy. No shared abstraction.

### 2. Runtime Surfaces

| Surface | Data Source | Loader | Location |
|---------|-------------|--------|----------|
| Terminal/Chat | Supabase (kinetic-pipeline) | `/api/knowledge/context` | `lib/knowledge/search.js` |
| LensPicker | DEFAULT_PERSONAS + localStorage | NarrativeEngineContext | `src/core/engine/` |
| JourneyPicker | Supabase | `/api/knowledge/journeys` | `lib/knowledge/synthesize.js` |

**Pattern:** Kinetic Pipeline provides Supabase-backed RAG. Bedrock consoles use localStorage. No unified access layer between them.

---

## File Inventory

### Data Access Files

```
src/core/engine/
├── ragLoader.ts           # GCS-based RAG (legacy) - 382 lines
├── topicRouter.ts         # Hub routing
└── entropyCalculator.ts   # Entropy detection

lib/
├── supabase.js            # Supabase client singleton
├── embeddings.js          # Gemini embedding generation
└── knowledge/             # Kinetic Pipeline
    ├── index.js           # Barrel export
    ├── ingest.js          # Document upload
    ├── chunk.js           # Text chunking
    ├── embed.js           # Embedding generation
    ├── search.js          # Vector similarity search
    ├── cluster.js         # HDBSCAN-style clustering
    ├── synthesize.js      # Journey generation
    └── types.js           # TypeScript types

src/bedrock/
├── api/
│   ├── sprouts.ts         # Sprout CRUD client
│   └── index.ts           # Barrel
└── patterns/
    ├── GroveApi.ts        # Generic REST client
    └── useCollectionView.ts # Collection filtering/sorting
```

### API Endpoints (Existing)

| Endpoint | Method | Purpose | Handler |
|----------|--------|---------|---------|
| `/api/knowledge/upload` | POST | Document ingestion | `lib/knowledge/ingest.js` |
| `/api/knowledge/documents` | GET | List documents | `lib/knowledge/index.js` |
| `/api/knowledge/embed` | POST | Trigger embeddings | `lib/knowledge/embed.js` |
| `/api/knowledge/search` | GET | Semantic search | `lib/knowledge/search.js` |
| `/api/knowledge/cluster` | POST | Cluster into hubs | `lib/knowledge/cluster.js` |
| `/api/knowledge/hubs` | GET | List suggested hubs | `lib/knowledge/cluster.js` |
| `/api/knowledge/synthesize` | POST | Generate journeys | `lib/knowledge/synthesize.js` |
| `/api/knowledge/journeys` | GET | List journeys | `lib/knowledge/synthesize.js` |
| `/api/knowledge/context` | POST | Get RAG context | `lib/knowledge/search.js` |
| `/api/sprouts` | CRUD | Sprout management | Express routes |

---

## Supabase Schema (kinetic-pipeline)

```sql
-- Documents table (source of truth)
CREATE TABLE knowledge.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove')),
  source_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks table (for embedding)
CREATE TABLE knowledge.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hubs table (clustered topics)
CREATE TABLE knowledge.hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  representative_chunk_id UUID REFERENCES knowledge.chunks(id),
  member_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'suggested',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hub members (join table)
CREATE TABLE knowledge.hub_members (
  hub_id UUID REFERENCES knowledge.hubs(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES knowledge.chunks(id) ON DELETE CASCADE,
  similarity FLOAT,
  PRIMARY KEY (hub_id, chunk_id)
);

-- Journeys table (synthesized paths)
CREATE TABLE knowledge.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  waypoints JSONB NOT NULL,
  source_type TEXT DEFAULT 'synthesized',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Patterns to Extend

### 1. GroveApi (src/bedrock/patterns/GroveApi.ts)

**Already exists.** Generic REST client with:
- CRUD operations (list, get, create, update, delete)
- Pagination support
- Error handling
- GroveObject envelope unwrapping

**Extension:** Add provider pattern to support multiple backends (localStorage, Supabase).

### 2. useCollectionView (src/bedrock/patterns/useCollectionView.ts)

**Already exists.** Collection management with:
- Filtering
- Sorting
- Favorites
- View mode (grid/list)

**Extension:** Integrate with GroveDataProvider for data source.

### 3. knowledge/* (lib/knowledge/)

**Already exists.** Supabase-backed knowledge operations.

**Extension:** Expose as GroveDataProvider adapter for 'sprout', 'hub', 'journey' types.

---

## Patterns NOT to Duplicate

| Pattern | Why Not |
|---------|---------|
| NarrativeEngineContext | Replace with GroveDataProvider, don't create parallel |
| Console-specific hooks | Consolidate into useGroveData |
| Direct fetch in components | Use GroveDataProvider abstraction |

---

## Critical Gaps

### Gap 1: No Unified Provider Interface

Current state has disconnected data loading patterns:
1. GroveApi (REST for sprouts)
2. Direct Supabase calls (lib/knowledge/*)
3. localStorage (Bedrock consoles)

**Need:** Single GroveDataProvider interface with pluggable backends.

### Gap 2: No Write Path from Bedrock to Supabase

Bedrock consoles write to localStorage. Supabase tables aren't updated.

**Need:** SupabaseAdapter that writes to knowledge.* tables.

### Gap 3: No Lens/Journey Tables in Supabase

Kinetic Pipeline created documents, chunks, hubs, journeys tables.
No tables for lenses (personas) or admin-defined journeys.

**Need:** Either extend existing tables or create lens/journey tables.

---

## Recommendations

### Recommendation 1: Create GroveDataProvider Interface

```typescript
interface GroveDataProvider {
  get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null>;
  list<T>(type: GroveObjectType): Promise<GroveObject<T>[]>;
  create<T>(type: GroveObjectType, object: GroveObject<T>): Promise<GroveObject<T>>;
  update<T>(type: GroveObjectType, id: string, patch: PatchOperation[]): Promise<GroveObject<T>>;
  delete(type: GroveObjectType, id: string): Promise<void>;
  subscribe<T>(type: GroveObjectType, callback: (objects: GroveObject<T>[]) => void): () => void;
}
```

### Recommendation 2: Create Adapters

| Adapter | Backend | Use Case |
|---------|---------|----------|
| LocalStorageAdapter | localStorage | Development, testing |
| SupabaseAdapter | Supabase | Production |
| HybridAdapter | Supabase + localStorage cache | Production with caching |

### Recommendation 3: Phased Migration

| Phase | What Changes |
|-------|--------------|
| 1 | Create GroveDataProvider + adapters (no breaking changes) |
| 2 | Migrate Bedrock consoles to useGroveData |
| 3 | Migrate runtime surfaces to useGroveData |
| 4 | Deprecate legacy hooks, add warnings |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/core/data/grove-data-provider.ts` | Interface definition |
| `src/core/data/grove-data-context.tsx` | React context provider |
| `src/core/data/use-grove-data.ts` | CRUD React hook |
| `src/core/data/use-knowledge-search.ts` | Search hook (wraps lib/knowledge/search.js) |
| `src/core/data/adapters/local-storage-adapter.ts` | Dev adapter |
| `src/core/data/adapters/supabase-adapter.ts` | Prod adapter |
| `src/core/data/adapters/hybrid-adapter.ts` | Cached adapter |
| `src/core/data/triggers/embedding-trigger.ts` | Optional pipeline trigger |
| `src/core/data/transforms/*.ts` | GroveObject ↔ DB row transforms |
| `src/core/data/index.ts` | Barrel export |

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/consoles/LensWorkshop/*.tsx` | Replace useLensData with useGroveData |
| `src/bedrock/consoles/GardenConsole.tsx` | Replace useSproutApi with useGroveData |
| `src/core/engagement/context.tsx` | Use GroveDataProvider for personas |
| `src/explore/Terminal.tsx` | Use GroveDataProvider for context |

## Files to Deprecate

| File | Replacement |
|------|-------------|
| Console-specific data hooks | useGroveData |
| Inline data loading in consoles | GroveDataProvider |
