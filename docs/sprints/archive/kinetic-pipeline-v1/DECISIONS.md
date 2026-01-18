# Architectural Decision Records: kinetic-pipeline-v1

---

## ADR-001: Use Gemini text-embedding-004

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Need consistent embedding model for the knowledge pipeline. Options: OpenAI ada-002, Gemini text-embedding-004, local model.

### Decision
Use Gemini text-embedding-004 for all embeddings.

### Rationale
- Already integrated in `lib/embeddings.js`
- 768 dimensions (good balance of quality and storage)
- Cost-effective at scale
- Fast inference
- Existing API access via GEMINI_API_KEY

### Consequences
- All embeddings are 768-dimensional vectors
- Consistent semantic space enables clustering
- Minor lock-in to Gemini (acceptable; migration path exists)

---

## ADR-002: HDBSCAN for Document Clustering

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Need algorithm to discover natural document groupings without predefined cluster count.

### Decision
Use HDBSCAN (Hierarchical Density-Based Spatial Clustering of Applications with Noise).

### Rationale
- Discovers arbitrary cluster shapes
- Identifies noise (unclustered documents)
- No need to prespecify K
- Well-suited for semantic embedding spaces
- Handles varying cluster densities

### Alternatives Considered
- **K-means:** Requires predefined K; assumes spherical clusters
- **LDA:** Topic modeling; less suitable for pre-embedded documents
- **Manual curation:** Defeats organic emergence goal

### Consequences
- Cluster count may vary between runs
- Quality depends on `min_cluster_size` tuning
- Some documents may be "noise" (not assigned to any hub)
- Need silhouette score or similar for quality metrics

---

## ADR-003: Strangler Fig Migration Pattern

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Need to migrate from GCS-based RAG to Supabase without breaking production.

### Decision
Implement strangler fig pattern:
- `/explore` routes use NEW pipeline (Supabase)
- `/genesis` routes use OLD pipeline (GCS)

### Rationale
- Proves new model without production risk
- Clear separation reduces debugging complexity
- Easy rollback if issues emerge
- Allows A/B comparison of retrieval quality

### Implementation
```typescript
const useNewPipeline = (route: string) => {
  return route.startsWith('/explore') || route.startsWith('/terminal');
};

const provider = useNewPipeline(req.path)
  ? new SupabaseKnowledgeProvider()
  : new GCSKnowledgeProvider();
```

### Consequences
- Two code paths temporarily
- Must maintain interface parity
- Clear migration timeline needed

---

## ADR-004: Document Chunking Strategy

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Long documents need chunking for quality embeddings.

### Decision
Use 1000 character chunks with 200 character overlap.

### Rationale
- 1000 chars ≈ 250 tokens (within model limits)
- 200 char overlap preserves cross-boundary context
- Simple implementation
- Can tune based on retrieval quality

### Alternatives Considered
- **Semantic chunking:** Complex; unclear benefit for this use case
- **Sentence-based:** Inconsistent sizes; splitting challenges
- **No chunking:** Poor retrieval quality for long documents

### Consequences
- Some redundancy in embedding storage
- Need both chunk-level and document-level embeddings
- Chunk metadata required for source attribution

---

## ADR-005: Override Schema Design

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Need admin ability to constrain computed structures (hubs, journeys).

### Decision
Store overrides as nullable columns on computed structure tables, not as separate tables.

### Rationale
- Simpler queries (no joins)
- Clear computed vs override separation
- Null = use computed value
- Non-null = use override

### Schema Pattern
```sql
CREATE TABLE suggested_hubs (
  -- Computed (always populated)
  suggested_title TEXT NOT NULL,
  member_doc_ids UUID[] NOT NULL,
  
  -- Override (nullable)
  title_override TEXT,      -- If set, use instead of suggested
  frozen BOOLEAN DEFAULT false,  -- If true, don't recalculate
  force_include_ids UUID[], -- Always include these
  force_exclude_ids UUID[]  -- Never include these
);
```

### Consequences
- Schema more complex than pure computed
- Need clear UI for override management
- Override history not tracked (add audit table later if needed)

---

## ADR-006: PostgreSQL pgvector for Embeddings

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Need vector storage and similarity search capability.

### Decision
Use Supabase's pgvector extension.

### Rationale
- Already available in Supabase
- Native PostgreSQL integration
- IVFFlat indexing for approximate search
- No separate vector database needed
- SQL-based queries

### Alternatives Considered
- **Pinecone:** Additional service; cost; complexity
- **Milvus:** Self-hosted; operational overhead
- **In-memory:** Doesn't scale; no persistence

### Consequences
- Limited to PostgreSQL-compatible deployments
- Index tuning required for large corpora
- Query syntax slightly different from standard SQL

---

## ADR-007: Lifecycle Tier System

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Documents have different validation levels; need to distinguish.

### Decision
Implement Sprout lifecycle tiers for documents:
- `seed`: Raw LLM output (ephemeral)
- `sprout`: Captured, processing
- `sapling`: Validated, searchable **(bulk uploads enter here)**
- `tree`: Connected to graph
- `grove`: Network-wide adoption

### Rationale
- Aligns with existing Sprout system design
- Clear progression path
- Allows filtering by trust level
- Bulk uploads skip early validation (already validated externally)

### Consequences
- RAG queries filter by tier
- UI needs tier visibility
- Tier transitions require tracking

---

## ADR-008: REST Before MCP

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Planned MCP server for knowledge pipeline; need to prioritize.

### Decision
Build REST API first, wrap with MCP later.

### Rationale
- Faster initial development
- Easier testing and debugging
- MCP adds complexity without immediate benefit
- REST works with existing infrastructure
- MCP wrapper can be added non-disruptively

### Consequences
- Temporary non-MCP implementation
- Need interface abstraction for later MCP wrap
- Manual tool for now; Copilot integration later

---

## ADR-009: Batch Processing Over Real-Time

**Status:** Accepted  
**Date:** December 30, 2025

### Context
Pipeline operations (embedding, clustering) could be real-time or batch.

### Decision
Use batch processing for all pipeline operations.

### Rationale
- Simpler implementation
- Easier to debug
- Controlled resource usage
- Recompute-on-demand sufficient for now

### Implementation
```typescript
// Manual triggers
POST /api/knowledge/embed    // Process pending
POST /api/knowledge/cluster  // Recompute all
POST /api/knowledge/synthesize  // Generate journeys
```

### Consequences
- Not real-time; some latency
- Manual trigger required
- Future: add threshold-based auto-trigger
