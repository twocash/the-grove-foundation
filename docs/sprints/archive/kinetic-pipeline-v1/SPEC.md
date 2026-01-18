# Sprint: kinetic-pipeline-v1

**Version:** 1.0  
**Date:** December 30, 2025  
**Status:** Planning  
**Branch:** `bedrock`

---

## Domain Contract

**Applicable contract:** None (infrastructure sprint)  
**Note:** Creates Supabase infrastructure consumed by Bedrock consoles

---

## Constitutional Reference

- [x] Read: PROJECT_PATTERNS.md
- [x] Read: The_Trellis_Architecture__First_Order_Directives.md
- [x] Read: bedrock-foundation-v1/SPEC.md
- [x] Read: Grove_Sprout_System_Architecture.docx (Sprout lifecycle)

---

## Executive Summary

This sprint implements the **Kinetic Pipeline**—the organic knowledge system that replaces static GCS files with a dynamic, embedding-powered, Supabase-backed knowledge graph.

**The Core Insight:** Documents don't define structure—structure emerges from documents.

Instead of manually creating Hubs and Journeys, we:
1. Upload documents to Supabase
2. Generate embeddings via Gemini
3. Cluster embeddings → suggested Hubs emerge
4. Analyze graph → suggested Journeys synthesize
5. Admin applies constraints → structure solidifies

**The metaphor shift:** From "architect designs museum" to "gardener sets growing conditions."

---

## Goals

### Must Have
- [ ] Documents upload to Supabase with lifecycle tier assignment
- [ ] Embedding pipeline generates vectors for all documents
- [ ] Clustering algorithm suggests Hub groupings
- [ ] Graph synthesis proposes Journey paths
- [ ] /explore queries new pipeline (strangler fig)
- [ ] Pipeline Monitor console shows processing status

### Should Have
- [ ] Hub override system (freeze title, force include/exclude)
- [ ] Journey constraint system (must include, preferred order)
- [ ] `explain_path` provenance queries

### Won't Have (This Sprint)
- Full MCP server implementation (start with REST, evolve to MCP)
- Multi-domain support (Grove docs only first)
- Real-time recomputation (batch for now)
- Network synchronization (local only)

---

## Non-Goals

- **Not touching Genesis** — Strangler fig: Genesis stays on GCS
- **Not building full MCP** — REST endpoints first, MCP wrapper later
- **Not optimizing performance** — Prove the model, then optimize
- **Not implementing Moments** — Pure document/structure pipeline

---

## Success Criteria

| Criterion | Verification |
|-----------|--------------|
| Document uploads to Supabase | Insert returns ID; record visible in table |
| Embedding generates 768-dim vector | Vector stored; similarity search works |
| Clustering suggests ≥3 Hubs from 20+ docs | Suggestions visible in Pipeline Monitor |
| Journey synthesis proposes paths | At least one path per Hub |
| /explore uses new pipeline | Network tab shows Supabase queries, not GCS |
| Pipeline Monitor displays status | Console renders with queue and suggestions |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Embedding generation | `lib/embeddings.js` | Add batch processing, chunking |
| Supabase client | `lib/supabase.js` | Add typed helpers for new tables |
| RAG context loading | `src/core/engine/ragLoader.ts` | Create parallel Supabase-based loader |
| Console layout | Bedrock primitives | Use for Pipeline Monitor console |
| State management | BedrockUIContext | Extend for pipeline state |

## New Patterns Proposed

### Pattern: Computed Structure Emergence

**Why existing patterns are insufficient:**
Current RAG loader assumes humans define Hubs/Journeys. No pattern for structure emerging from content.

**The pattern:**
```typescript
interface ComputedHub {
  id: string;
  suggestedTitle: string;
  titleOverride?: string;  // Admin can freeze
  memberDocIds: string[];
  centroid: number[];  // Cluster center embedding
  confidence: number;  // Cluster quality metric
  frozen: boolean;  // Prevent recalculation
}

interface ComputedJourney {
  id: string;
  suggestedTitle: string;
  titleOverride?: string;
  nodeIds: string[];
  hubId: string;
  synthesisMethod: 'semantic' | 'chronological' | 'manual';
  constraints: JourneyConstraint[];
}

// Emergence flow
const pipeline = {
  // 1. Document entry
  ingest: (doc, tier) => documentId,
  
  // 2. Embedding
  embed: (docId) => embedding768,
  
  // 3. Clustering (batch)
  cluster: (embeddings) => ComputedHub[],
  
  // 4. Journey synthesis (per hub)
  synthesize: (hub) => ComputedJourney[],
  
  // 5. Override application
  applyOverrides: (structures, overrides) => FinalStructures,
};
```

**DEX Compliance:**
- Declarative Sovereignty: Overrides are config, not code
- Capability Agnosticism: Works with any embedding model
- Provenance: Every computation logged with inputs/outputs
- Organic Scalability: More docs → richer structure

### Pattern: Strangler Fig Migration

**Why existing patterns are insufficient:**
No documented approach for incremental backend replacement.

**The pattern:**
```typescript
// Feature flag determines which backend
const useNewPipeline = (route: string): boolean => {
  if (route.startsWith('/explore')) return true;  // New
  if (route.startsWith('/genesis')) return false; // Legacy
  return false;
};

// Unified interface, different implementations
interface KnowledgeProvider {
  getContext(query: string, options: ContextOptions): Promise<ContextResult>;
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}

// Legacy (GCS)
class GCSKnowledgeProvider implements KnowledgeProvider { ... }

// New (Supabase)
class SupabaseKnowledgeProvider implements KnowledgeProvider { ... }
```

---

## Canonical Source Audit

| Capability | Canonical Home | Current State | Action |
|------------|----------------|---------------|--------|
| Embedding generation | `lib/embeddings.js` | Works | **EXTEND** for batch |
| Supabase client | `lib/supabase.js` | Works | **EXTEND** with typed helpers |
| RAG loading | `src/core/engine/ragLoader.ts` | GCS-based | **PARALLEL** Supabase loader |
| Document storage | None | N/A | **CREATE** in Supabase |
| Clustering | None | N/A | **CREATE** new module |
| Graph synthesis | None | N/A | **CREATE** new module |
| Pipeline console | None | N/A | **CREATE** following Bedrock |

---

## DEX Compliance Matrix

### Feature: Document Ingestion

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Tier assignment via config, not code |
| Capability Agnosticism | ✅ | Any document format; parsing is separate |
| Provenance | ✅ | Upload timestamp, source, uploader tracked |
| Organic Scalability | ✅ | No limit on documents; batching scales |

### Feature: Structure Emergence

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Overrides via JSON; algorithm params configurable |
| Capability Agnosticism | ✅ | Clustering works regardless of embedding model |
| Provenance | ✅ | Each computed structure logs inputs/method |
| Organic Scalability | ✅ | More documents → more nuanced clusters |

### Feature: /explore Integration

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Lens filtering via URL params |
| Capability Agnosticism | ✅ | Same interface; different backend |
| Provenance | ✅ | Query logs show source (Supabase vs GCS) |
| Organic Scalability | ✅ | New content immediately searchable |

---

## Technical Architecture

### The Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KINETIC PIPELINE FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INGEST                                                              │
│  ──────                                                              │
│  Admin uploads doc → Assign tier (sapling|tree|grove)               │
│         ↓                                                            │
│  POST /api/knowledge/upload → Supabase: documents table             │
│         ↓                                                            │
│  Queue for embedding                                                 │
│                                                                      │
│  EMBED                                                               │
│  ─────                                                               │
│  Document chunks → Gemini text-embedding-004                        │
│         ↓                                                            │
│  768-dim vectors → Supabase: embeddings table (pgvector)            │
│                                                                      │
│  CLUSTER (Batch)                                                     │
│  ───────                                                             │
│  All embeddings → HDBSCAN clustering                                │
│         ↓                                                            │
│  Clusters → Supabase: suggested_hubs table                          │
│         ↓                                                            │
│  Apply overrides → Final hubs                                        │
│                                                                      │
│  SYNTHESIZE (Per Hub)                                                │
│  ──────────                                                          │
│  Hub members → Semantic ordering                                     │
│         ↓                                                            │
│  Paths → Supabase: suggested_journeys table                         │
│         ↓                                                            │
│  Apply constraints → Final journeys                                  │
│                                                                      │
│  SERVE                                                               │
│  ─────                                                               │
│  /explore query → Search embeddings → Filter by lens                │
│         ↓                                                            │
│  Build context → Return to chat                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
lib/
├── supabase.js                 # Existing client
├── embeddings.js               # Existing generator
├── knowledge/
│   ├── index.ts                # Main exports
│   ├── types.ts                # TypeScript interfaces
│   ├── ingest.ts               # Document upload/chunking
│   ├── embed.ts                # Batch embedding pipeline
│   ├── cluster.ts              # HDBSCAN clustering
│   ├── synthesize.ts           # Journey path synthesis
│   ├── search.ts               # Semantic search
│   ├── provider.ts             # KnowledgeProvider interface
│   └── supabase-provider.ts    # Supabase implementation

src/core/engine/
├── ragLoader.ts                # Legacy GCS (unchanged)
├── knowledgeLoader.ts          # NEW: Supabase-based loader
└── index.ts                    # Add new exports

src/bedrock/consoles/
├── PipelineMonitor/
│   ├── PipelineMonitor.tsx     # Main console
│   ├── UploadPanel.tsx         # Drag-drop upload UI
│   ├── ProcessingQueue.tsx     # Embedding queue status
│   ├── HubSuggestions.tsx      # Cluster visualization
│   ├── JourneySynthesis.tsx    # Path preview
│   ├── OverrideEditor.tsx      # Admin constraints
│   └── pipeline.config.ts      # Console navigation
└── index.ts                    # Export new console

src/explore/
├── hooks/
│   └── useKnowledgeProvider.ts # Provider selection hook
└── ...                         # Existing files unchanged
```

### Supabase Schema

```sql
-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Source documents with full metadata
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,  -- For deduplication
  
  -- Sprout lifecycle tier
  tier TEXT NOT NULL CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove')),
  tier_updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  source_type TEXT,  -- 'upload', 'capture', 'import'
  source_url TEXT,
  file_type TEXT,  -- 'md', 'txt', 'pdf', 'docx'
  
  -- Provenance
  created_by TEXT,  -- User ID or 'system'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Processing status
  embedding_status TEXT DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'complete', 'error')),
  embedding_error TEXT,
  
  -- Soft delete
  archived BOOLEAN DEFAULT false
);

-- Text chunks for fine-grained embedding
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(document_id, chunk_index)
);

-- Embeddings with pgvector
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  
  -- 768-dim vector from Gemini text-embedding-004
  embedding vector(768) NOT NULL,
  
  -- Embedding metadata
  model TEXT DEFAULT 'text-embedding-004',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Either document-level or chunk-level
  CONSTRAINT embedding_scope CHECK (
    (document_id IS NOT NULL AND chunk_id IS NULL) OR
    (document_id IS NULL AND chunk_id IS NOT NULL)
  )
);

-- Index for similarity search
CREATE INDEX embeddings_vector_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- COMPUTED STRUCTURES
-- ============================================================================

-- Suggested hubs from clustering
CREATE TABLE suggested_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Clustering output
  suggested_title TEXT NOT NULL,
  member_doc_ids UUID[] NOT NULL,
  centroid vector(768),
  cluster_quality FLOAT,  -- Silhouette score or similar
  
  -- Computation metadata
  algorithm TEXT DEFAULT 'hdbscan',
  computed_at TIMESTAMPTZ DEFAULT now(),
  input_doc_count INTEGER,
  
  -- Admin overrides
  title_override TEXT,
  frozen BOOLEAN DEFAULT false,
  force_include_ids UUID[],
  force_exclude_ids UUID[],
  
  -- State
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- Suggested journeys from synthesis
CREATE TABLE suggested_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID REFERENCES suggested_hubs(id) ON DELETE CASCADE,
  
  -- Synthesis output
  suggested_title TEXT NOT NULL,
  node_doc_ids UUID[] NOT NULL,  -- Ordered list
  synthesis_method TEXT DEFAULT 'semantic',
  
  -- Computation metadata
  computed_at TIMESTAMPTZ DEFAULT now(),
  
  -- Admin overrides
  title_override TEXT,
  must_include_ids UUID[],
  must_exclude_ids UUID[],
  preferred_order UUID[],  -- If set, overrides computed order
  
  -- State
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected'))
);

-- ============================================================================
-- GRAPH RELATIONSHIPS
-- ============================================================================

-- Edges between documents
CREATE TABLE knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Edge type and strength
  relationship_type TEXT NOT NULL,  -- 'similar', 'references', 'extends', 'contradicts'
  strength FLOAT NOT NULL,  -- 0-1, typically cosine similarity
  
  -- How edge was created
  created_by TEXT DEFAULT 'system',  -- 'system' or user ID
  method TEXT,  -- 'embedding_similarity', 'citation', 'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(source_doc_id, target_doc_id, relationship_type)
);

-- ============================================================================
-- PIPELINE STATE
-- ============================================================================

-- Track pipeline runs
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What ran
  stage TEXT NOT NULL,  -- 'embed', 'cluster', 'synthesize'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Stats
  documents_processed INTEGER DEFAULT 0,
  clusters_created INTEGER DEFAULT 0,
  journeys_created INTEGER DEFAULT 0,
  errors TEXT[],
  
  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'complete', 'error'))
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Semantic search function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_count INT DEFAULT 10,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  JOIN documents d ON e.document_id = d.id
  WHERE d.archived = false
    AND d.tier IN ('sapling', 'tree', 'grove')
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Get hub context (replaces GCS tier loading)
CREATE OR REPLACE FUNCTION get_hub_context(
  hub_id_param UUID,
  max_bytes INT DEFAULT 40000
)
RETURNS TEXT AS $$
DECLARE
  context_text TEXT := '';
  doc RECORD;
  current_bytes INT := 0;
BEGIN
  FOR doc IN 
    SELECT d.title, d.content
    FROM documents d
    JOIN suggested_hubs h ON d.id = ANY(h.member_doc_ids)
    WHERE h.id = hub_id_param
      AND d.archived = false
    ORDER BY d.created_at
  LOOP
    IF current_bytes + length(doc.content) > max_bytes THEN
      EXIT;
    END IF;
    context_text := context_text || E'\n\n--- ' || doc.title || E' ---\n' || doc.content;
    current_bytes := current_bytes + length(doc.content);
  END LOOP;
  
  RETURN context_text;
END;
$$ LANGUAGE plpgsql;
```

---

## API Endpoints

### Ingestion

```typescript
// Upload a document
POST /api/knowledge/upload
{
  title: string;
  content: string;
  tier: 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';
  sourceType?: 'upload' | 'capture' | 'import';
  sourceUrl?: string;
  fileType?: string;
}
Response: { id: string; status: 'pending' }

// Batch upload
POST /api/knowledge/batch-upload
{
  documents: Array<{
    title: string;
    content: string;
    tier?: string;
  }>;
  defaultTier: string;
}
Response: { ids: string[]; status: 'queued' }

// Update document tier
PATCH /api/knowledge/documents/:id/tier
{
  tier: string;
}
Response: { success: true }
```

### Pipeline Operations

```typescript
// Trigger embedding for a document (or batch)
POST /api/knowledge/embed
{
  documentIds?: string[];  // If empty, process all pending
}
Response: { processed: number; errors: string[] }

// Trigger clustering
POST /api/knowledge/cluster
{
  algorithm?: 'hdbscan' | 'kmeans';
  minClusterSize?: number;
}
Response: { hubsCreated: number; runId: string }

// Trigger journey synthesis
POST /api/knowledge/synthesize
{
  hubId?: string;  // If empty, all hubs
  method?: 'semantic' | 'chronological';
}
Response: { journeysCreated: number; runId: string }
```

### Read Operations

```typescript
// Get knowledge graph
GET /api/knowledge/graph?lens=:lens&hubId=:hubId
Response: {
  hubs: ComputedHub[];
  journeys: ComputedJourney[];
  edges: KnowledgeEdge[];
}

// Semantic search
GET /api/knowledge/search?q=:query&limit=:limit&threshold=:threshold
Response: {
  results: Array<{
    id: string;
    title: string;
    snippet: string;
    similarity: number;
  }>;
}

// Get context for chat (replaces GCS loader)
POST /api/knowledge/context
{
  message: string;
  lens?: string;
  hubIds?: string[];
  tier1Budget?: number;
  tier2Budget?: number;
}
Response: {
  context: string;
  tier1Bytes: number;
  tier2Bytes: number;
  matchedHub: string | null;
  filesLoaded: string[];
}

// Explain path between documents
GET /api/knowledge/explain-path?from=:docId&to=:docId
Response: {
  path: string[];
  explanation: string;
  method: 'semantic' | 'graph';
}
```

### Override Operations

```typescript
// Apply hub override
PATCH /api/knowledge/hubs/:id/override
{
  titleOverride?: string;
  frozen?: boolean;
  forceIncludeIds?: string[];
  forceExcludeIds?: string[];
  status?: 'suggested' | 'approved' | 'rejected';
}

// Apply journey constraint
PATCH /api/knowledge/journeys/:id/constraint
{
  titleOverride?: string;
  mustIncludeIds?: string[];
  mustExcludeIds?: string[];
  preferredOrder?: string[];
  status?: 'suggested' | 'approved' | 'rejected';
}
```

---

## URL-Driven Experience Engine

**Preserve and extend the `?lens=` pattern from Genesis:**

```typescript
interface ExperienceConfig {
  // URL parameters
  lens?: string;           // ?lens=academic
  journey?: string;        // ?journey=onboarding  
  hub?: string;            // ?hub=distributed-systems
  share?: string;          // ?share=<base64 config>
  
  // Computed from user state
  persona?: string;
  lifecycle?: 'new' | 'oriented' | 'engaged' | 'committed';
}

// URL → Experience
// /explore?lens=academic&hub=distributed-systems&journey=onboarding
// Generates: Academic-filtered view of distributed systems hub, onboarding journey active

function computeExperience(
  graph: KnowledgeGraph,
  config: ExperienceConfig
): CollapsedExperience {
  // 1. Filter graph by lens
  const filtered = config.lens 
    ? filterByLens(graph, config.lens)
    : graph;
  
  // 2. Focus on hub if specified
  const focused = config.hub
    ? focusOnHub(filtered, config.hub)
    : filtered;
  
  // 3. Activate journey if specified
  const withJourney = config.journey
    ? activateJourney(focused, config.journey)
    : autoSelectJourney(focused, config.lifecycle);
  
  // 4. Collapse to renderable state
  return collapse(withJourney);
}
```

**Power:** Same knowledge graph, infinite experiences through URL alone.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase pgvector performance | Medium | High | Index tuning; benchmark with real data |
| HDBSCAN clustering quality | Medium | Medium | Expose parameters; allow manual override |
| Embedding costs at scale | Low | Medium | Batch processing; cache embeddings |
| Migration breaks existing /explore | High | High | Strangler fig: parallel systems |
| Schema changes during sprint | Medium | Medium | Version tables; migration scripts |
| Pipeline Monitor complexity | Medium | Low | Start with status display only |

---

## Dependencies

### External
- Supabase pgvector extension (already enabled)
- Gemini text-embedding-004 API (already integrated)
- HDBSCAN library (hdbscan npm package)

### Internal
- BedrockLayout primitives (from bedrock-foundation-v1)
- Existing embeddings.js module
- Existing supabase.js client

### Sequencing
1. **Epic 1:** Supabase schema — No dependencies
2. **Epic 2:** Embedding pipeline — Needs schema
3. **Epic 3:** Clustering — Needs embeddings
4. **Epic 4:** Journey synthesis — Needs clusters
5. **Epic 5:** /explore integration — Needs all above
6. **Epic 6:** Pipeline Monitor console — Needs working pipeline

---

## Timeline

| Week | Focus | Exit Criteria |
|------|-------|---------------|
| 1 | Schema + Upload | Documents insert; embeddings store |
| 2 | Embedding pipeline | Batch embedding works; search returns results |
| 3 | Clustering + synthesis | Hubs suggested; Journeys proposed |
| 4 | /explore integration | /explore queries Supabase, not GCS |
| 5 | Pipeline Monitor | Console displays status and suggestions |
| 6 | Polish + override system | Admin can apply constraints |

---

## Open Questions

1. **Chunking strategy:** Overlap? Fixed size or semantic boundaries?
2. **Cluster naming:** LLM-generated titles or keyword extraction?
3. **Edge weight threshold:** What similarity score creates an edge?
4. **Recomputation trigger:** Manual only or on document threshold?

---

## Acceptance Tests

```gherkin
Feature: Document Ingestion
  Scenario: Admin uploads a document
    Given I am on Pipeline Monitor
    When I drag a markdown file to the upload area
    And I set tier to "sapling"
    And I click Upload
    Then I see "Document uploaded" confirmation
    And the document appears in the processing queue

Feature: Embedding Pipeline
  Scenario: Document gets embedded
    Given there is a pending document
    When I trigger the embedding pipeline
    Then the document status changes to "processing"
    And eventually changes to "complete"
    And I can search for content from that document

Feature: Clustering
  Scenario: Hubs emerge from documents
    Given there are 20+ embedded documents
    When I trigger clustering
    Then suggested hubs appear in Pipeline Monitor
    And each hub shows member documents
    And I can approve or reject suggestions

Feature: /explore Integration
  Scenario: Search uses new pipeline
    Given there are embedded documents in Supabase
    When I go to /explore
    And I ask a question
    Then the context is loaded from Supabase
    And the response references uploaded content
```

---

## Approvals

- [ ] Architecture review complete
- [ ] DEX compliance verified
- [ ] Supabase schema reviewed
- [ ] Sprint ready for execution
