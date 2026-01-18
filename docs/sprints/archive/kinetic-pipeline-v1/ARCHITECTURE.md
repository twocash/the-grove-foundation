# Architecture: kinetic-pipeline-v1

**Sprint:** kinetic-pipeline-v1  
**Date:** December 30, 2025  
**Status:** Approved

---

## Architectural Vision

The Kinetic Pipeline transforms Grove's knowledge system from static file serving to dynamic structure emergence. Instead of humans manually defining Hubs and Journeys, the system suggests structure based on content relationships—then humans apply constraints.

**The metaphor:** From "architect designs museum" to "gardener sets growing conditions."

---

## Core Principles

### 1. Structure Emerges from Content

Documents don't define structure—structure emerges from documents. The pipeline:
1. Embeds documents into semantic space
2. Clusters similar documents into suggested Hubs
3. Synthesizes paths through Hubs into suggested Journeys
4. Admin applies overrides to solidify structure

### 2. Strangler Fig Migration

/explore uses new pipeline while Genesis stays on GCS. This allows:
- Proving the model without breaking production
- Gradual migration as confidence increases
- Easy rollback if issues emerge

### 3. Provenance as Infrastructure

Every computation is logged:
- Document upload: who, when, from where
- Embedding: which model, when computed
- Clustering: algorithm, parameters, quality metrics
- Override: who approved, when, reasoning

### 4. Declarative Overrides

Admins don't edit code—they apply constraints:
- `titleOverride`: "Call this hub 'Distributed Systems'"
- `frozen`: "Don't recalculate this hub"
- `mustInclude`: "This document must be in this journey"
- `preferredOrder`: "Show these in this sequence"

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KINETIC PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   INGEST     │    │    EMBED     │    │   CLUSTER    │                   │
│  │              │    │              │    │              │                   │
│  │  Upload API  │───>│   Gemini     │───>│   HDBSCAN    │                   │
│  │  Tier assign │    │   768-dim    │    │   Quality    │                   │
│  │  Chunking    │    │   pgvector   │    │   Metrics    │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SUPABASE                                     │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │ documents │  │ embeddings│  │   hubs    │  │ journeys  │        │    │
│  │  │ + chunks  │  │ (pgvector)│  │ suggested │  │ suggested │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  SYNTHESIZE  │    │    SERVE     │    │   OVERRIDE   │                   │
│  │              │    │              │    │              │                   │
│  │  Path build  │───>│  /explore    │<───│  Admin UI    │                   │
│  │  Semantic    │    │  Context     │    │  Constraints │                   │
│  │  Order       │    │  Search      │    │  Approvals   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Document Ingestion

```
Admin uploads document
        │
        ▼
┌───────────────────┐
│ Validate format   │ (md, txt, pdf, docx)
│ Extract text      │
│ Compute hash      │ (deduplication)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Assign tier       │ (sapling for uploads)
│ Create chunks     │ (1000 chars, 200 overlap)
│ Store in Supabase │
└───────────────────┘
        │
        ▼
Queue for embedding
```

### 2. Embedding Pipeline

```
Pending documents
        │
        ▼
┌───────────────────┐
│ For each chunk:   │
│   Generate embed  │ (Gemini text-embedding-004)
│   Store vector    │ (pgvector)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Also generate     │
│ document-level    │ (concatenated chunks)
│ embedding         │
└───────────────────┘
        │
        ▼
Mark document complete
```

### 3. Clustering (Batch)

```
All document embeddings
        │
        ▼
┌───────────────────┐
│ HDBSCAN cluster   │
│ min_cluster_size  │ = 3
│ min_samples       │ = 2
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ For each cluster: │
│   Extract centroid│
│   Compute quality │ (silhouette)
│   Suggest title   │ (keywords or LLM)
└───────────────────┘
        │
        ▼
Store suggested_hubs
```

### 4. Journey Synthesis

```
For each hub
        │
        ▼
┌───────────────────┐
│ Get member docs   │
│ Compute pairwise  │
│ similarities      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Find optimal path │ (TSP-like ordering)
│ Or chronological  │ (by created_at)
│ Or manual         │ (admin specified)
└───────────────────┘
        │
        ▼
Store suggested_journeys
```

### 5. Context Serving

```
User query from /explore
        │
        ▼
┌───────────────────┐
│ Generate query    │
│ embedding         │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Search embeddings │ (cosine similarity)
│ Get top matches   │
│ Identify hub      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Load hub context  │ (Tier 2 equivalent)
│ Add default       │ (Tier 1 equivalent)
│ Return to chat    │
└───────────────────┘
```

---

## Key Decisions

### ADR-001: Gemini text-embedding-004

**Decision:** Use Gemini text-embedding-004 for all embeddings.

**Context:** Need consistent embedding model. Options: OpenAI ada-002, Gemini, local model.

**Rationale:**
- Already integrated (`lib/embeddings.js`)
- 768 dimensions (good balance of quality and storage)
- Cheap at scale
- Fast inference

**Consequences:**
- All embeddings are 768-dim vectors
- Consistent semantic space for clustering
- Lock-in to Gemini (acceptable; can migrate later)

### ADR-002: HDBSCAN for Clustering

**Decision:** Use HDBSCAN algorithm for document clustering.

**Context:** Need to discover natural groupings without predefined cluster count.

**Rationale:**
- Discovers arbitrary cluster shapes
- Identifies noise (unclustered documents)
- No need to specify K
- Well-suited for semantic embeddings

**Alternatives considered:**
- K-means: Requires predefined K; spherical clusters only
- LDA: Topic modeling; less suitable for embeddings
- Manual: Defeats the purpose

**Consequences:**
- May produce different cluster counts on each run
- Quality depends on min_cluster_size tuning
- Some documents may be "noise" (not in any hub)

### ADR-003: Strangler Fig Pattern

**Decision:** /explore uses new pipeline; Genesis stays on GCS.

**Context:** Need to migrate without breaking production.

**Rationale:**
- /explore is the "proving ground"
- Genesis is stable and doesn't need change
- Clear separation reduces risk
- Easy to compare behaviors

**Implementation:**
```typescript
// In server.js or route handler
const useNewPipeline = (route: string) => {
  return route.startsWith('/explore') || route.startsWith('/terminal');
};

const provider = useNewPipeline(req.path)
  ? new SupabaseKnowledgeProvider()
  : new GCSKnowledgeProvider();
```

### ADR-004: Document Chunking Strategy

**Decision:** 1000 character chunks with 200 character overlap.

**Context:** Long documents need chunking for quality embeddings.

**Rationale:**
- 1000 chars ≈ 250 tokens (well within model limits)
- 200 char overlap preserves context across boundaries
- Simple implementation
- Can tune later based on retrieval quality

**Alternatives considered:**
- Semantic chunking: More complex; benefits unclear
- Sentence-based: Inconsistent sizes
- No chunking: Poor for long documents

### ADR-005: Override Schema Design

**Decision:** Overrides stored as nullable columns, not separate table.

**Context:** Need admin ability to constrain computed structures.

**Rationale:**
- Simpler queries (no joins)
- Clear separation: computed vs override
- Null = use computed value
- Non-null = use override

**Schema pattern:**
```sql
CREATE TABLE suggested_hubs (
  -- Computed
  suggested_title TEXT NOT NULL,
  member_doc_ids UUID[] NOT NULL,
  
  -- Override (nullable)
  title_override TEXT,      -- If set, use instead of suggested
  frozen BOOLEAN DEFAULT false,  -- If true, don't recalculate
  force_include_ids UUID[], -- Always include these
  force_exclude_ids UUID[]  -- Never include these
);
```

---

## Interface Contracts

### KnowledgeProvider Interface

```typescript
interface KnowledgeProvider {
  // Context for RAG (replaces GCS loader)
  getContext(
    message: string,
    options: ContextOptions
  ): Promise<ContextResult>;
  
  // Semantic search
  search(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]>;
  
  // Graph access
  getGraph(lens?: string): Promise<KnowledgeGraph>;
  
  // Provenance
  explainPath(
    fromId: string,
    toId: string
  ): Promise<PathExplanation>;
}

// Implementations
class GCSKnowledgeProvider implements KnowledgeProvider { ... }
class SupabaseKnowledgeProvider implements KnowledgeProvider { ... }
```

### Document Lifecycle

```typescript
type DocumentTier = 
  | 'seed'      // Raw, ephemeral
  | 'sprout'    // Captured, processing
  | 'sapling'   // Validated, in RAG
  | 'tree'      // Connected to graph
  | 'grove';    // Network-wide

interface Document {
  id: string;
  title: string;
  content: string;
  tier: DocumentTier;
  tierUpdatedAt: Date;
  
  // Provenance
  sourceType: 'upload' | 'capture' | 'import';
  sourceUrl?: string;
  createdBy: string;
  createdAt: Date;
  
  // Processing
  embeddingStatus: 'pending' | 'processing' | 'complete' | 'error';
}
```

### Computed Structures

```typescript
interface ComputedHub {
  id: string;
  suggestedTitle: string;
  memberDocIds: string[];
  centroid: number[];
  clusterQuality: number;
  
  // Overrides
  titleOverride?: string;
  frozen: boolean;
  forceIncludeIds: string[];
  forceExcludeIds: string[];
  
  // State
  status: 'suggested' | 'approved' | 'rejected';
}

interface ComputedJourney {
  id: string;
  hubId: string;
  suggestedTitle: string;
  nodeDocIds: string[];  // Ordered
  synthesisMethod: 'semantic' | 'chronological' | 'manual';
  
  // Constraints
  titleOverride?: string;
  mustIncludeIds: string[];
  mustExcludeIds: string[];
  preferredOrder?: string[];
  
  // State
  status: 'suggested' | 'approved' | 'rejected';
}
```

---

## Security Considerations

### API Security
- All endpoints require authentication
- Admin-only for: upload, override, pipeline triggers
- Read-only for: search, context, graph

### Data Isolation
- Documents tagged with `created_by`
- Future: multi-tenant isolation

### Rate Limiting
- Embedding endpoint: 100/minute (Gemini limits)
- Search endpoint: 1000/minute
- Upload endpoint: 50/minute

---

## Performance Considerations

### Embedding
- Batch processing (10 docs at a time)
- Background job queue
- Cache computed embeddings

### Search
- pgvector IVFFlat index
- Approximate nearest neighbor
- Tune `lists` parameter based on corpus size

### Clustering
- Triggered manually or on threshold
- O(n log n) with HDBSCAN
- Cache results until corpus changes

---

## Monitoring & Observability

### Pipeline Metrics
- Documents pending/processing/complete
- Embedding latency (p50, p99)
- Clustering quality scores
- Search latency

### Health Checks
- Supabase connection
- Embedding API availability
- Queue depth alerts

### Logging
- All pipeline operations logged
- Error details for debugging
- Audit trail for overrides
