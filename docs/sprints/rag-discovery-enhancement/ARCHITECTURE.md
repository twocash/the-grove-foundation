# Architecture — rag-discovery-enhancement-v1

## Overview

Extend the Knowledge Pipeline to use **hybrid search** combining vector similarity with enrichment metadata (keywords, utility scores, temporal classification). The architecture preserves backward compatibility while enabling smarter retrieval.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HYBRID SEARCH ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Query: "How does Raft consensus work?"                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    lib/knowledge/search.js                            │  │
│  │  ┌──────────────────┐    ┌────────────────────────────────────────┐  │  │
│  │  │ searchDocuments  │    │ searchDocumentsHybrid (NEW)            │  │  │
│  │  │ (vector only)    │    │                                        │  │  │
│  │  └────────┬─────────┘    │  1. Generate embedding                 │  │  │
│  │           │              │  2. Extract query keywords             │  │  │
│  │           │              │  3. Call search_documents_hybrid RPC   │  │  │
│  │           │              │  4. Track retrievals (async)           │  │  │
│  │           │              └────────────────────┬───────────────────┘  │  │
│  └───────────┼───────────────────────────────────┼──────────────────────┘  │
│              │                                   │                          │
│              ▼                                   ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SUPABASE (PostgreSQL)                         │   │
│  │                                                                      │   │
│  │  search_documents()         search_documents_hybrid() (NEW)         │   │
│  │  ┌──────────────────┐      ┌────────────────────────────────────┐  │   │
│  │  │ SELECT ... WHERE │      │ WITH scored AS (                   │  │   │
│  │  │ 1 - (embedding   │      │   SELECT ...                       │  │   │
│  │  │   <=> query)     │      │   vector_sim * 0.50 +              │  │   │
│  │  │   > threshold    │      │   keyword_score * 0.25 +           │  │   │
│  │  └──────────────────┘      │   utility_boost * 0.15 +           │  │   │
│  │                            │   freshness_boost * 0.10           │  │   │
│  │                            │ ) * temporal_weight                │  │   │
│  │                            │ AS final_score                     │  │   │
│  │                            └────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  Documents Table (enriched)                                         │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │ id │ title │ keywords │ utility_score │ temporal_class │...│    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## DEX Stack Design

### Configuration Layer (Future)

For full DEX compliance, weights should be stored in a config table:

```sql
-- Future: search_config table
CREATE TABLE search_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  weights JSONB DEFAULT '{"vector": 0.50, "keyword": 0.25, "utility": 0.15, "freshness": 0.10}',
  temporal_weights JSONB DEFAULT '{"evergreen": 1.0, "current": 1.0, "dated": 0.7, "historical": 0.5}',
  freshness_decay_days INTEGER DEFAULT 30
);
```

**For MVP:** Weights hardcoded in SQL function with comment noting future config.

### Engine Layer

The `search_documents_hybrid` function interprets scoring rules:

```sql
-- Hybrid scoring formula
final_score = (
  vector_similarity * weights.vector +      -- Semantic match
  keyword_overlap * weights.keyword +       -- Explicit term match
  utility_boost * weights.utility +         -- Usage-based quality
  freshness_boost * weights.freshness       -- New content visibility
) * temporal_weight                         -- Decay dated content
```

### Behavior Layer

Users experience:
- More relevant results when asking for specific terms
- Frequently-useful documents surfacing higher
- New documents getting fair visibility
- Dated content appropriately deprioritized

## Data Structures

### Hybrid Search Result

```typescript
interface HybridSearchResult {
  id: string;
  title: string;
  snippet: string;
  
  // Scoring breakdown
  similarity: number;        // Vector similarity (0-1)
  keyword_score: number;     // Keyword overlap (0-1)
  utility_score: number;     // Usage-based score
  freshness_score: number;   // Decay factor (0-1)
  temporal_weight: number;   // Temporal class factor
  final_score: number;       // Combined weighted score
  
  // Metadata
  keywords: string[];
  temporal_class: 'evergreen' | 'current' | 'dated' | 'historical';
}
```

### Query Keywords

```typescript
interface QueryKeywords {
  original: string;
  keywords: string[];      // Extracted meaningful terms
  expanded?: string;       // If query expansion was applied
}
```

## File Organization

```
lib/knowledge/
├── index.js           # Module exports (modify: add hybrid exports)
├── search.js          # Search functions (modify: add hybrid search)
├── enrich.js          # Bulk enrichment (NEW)
├── chunk.js           # Unchanged
├── cluster.js         # Unchanged
├── embed.js           # Unchanged
├── expand.js          # Unchanged
├── health.js          # Unchanged
├── ingest.js          # Unchanged
├── synthesize.js      # Unchanged
└── types.js           # Unchanged

supabase/migrations/
└── 005_hybrid_search.sql  # New database functions (NEW)
```

## Test Architecture

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/knowledge/` | Pure function validation |
| Integration | `tests/integration/` | API endpoint contracts |
| E2E | `tests/e2e/` | User behavior verification |

### Behavior Tests Needed

| User Action | Expected Outcome | Test File |
|-------------|------------------|-----------|
| Search with specific keyword | Docs with that keyword rank higher | `search.test.js` |
| Search general topic | Results ordered by combined score | `search.test.js` |
| Retrieve document | Utility score increments | `tracking.test.js` |
| Bulk enrich | Unenriched docs get metadata | `enrich.test.js` |

### Health Integration

Tests report via existing Health system when configured.

## API Contracts

### GET /api/knowledge/search

**Modified endpoint** — adds `hybrid` parameter

- **Method:** GET
- **Path:** /api/knowledge/search
- **Query Parameters:**
  - `q` (string, required) — Search query
  - `limit` (number, optional, default: 10) — Max results
  - `threshold` (number, optional, default: 0.5) — Min similarity
  - `hybrid` (boolean, optional, default: true after validation) — Use hybrid scoring
  - `tiers` (string[], optional) — Filter by tiers

**Response (hybrid=true):**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Document Title",
      "snippet": "First 300 chars...",
      "similarity": 0.85,
      "keyword_score": 0.6,
      "utility_score": 2.4,
      "freshness_score": 0.9,
      "temporal_weight": 1.0,
      "final_score": 0.78,
      "keywords": ["raft", "consensus"],
      "temporal_class": "evergreen"
    }
  ],
  "query": {
    "original": "How does Raft work?",
    "keywords": ["raft", "work"]
  }
}
```

### GET /api/knowledge/enrich/stats

**New endpoint** — Enrichment progress

- **Method:** GET
- **Path:** /api/knowledge/enrich/stats

**Response:**
```json
{
  "total": 156,
  "embedded": 150,
  "enriched": 42,
  "unenriched": 108,
  "enrichmentRate": 28
}
```

### POST /api/knowledge/enrich/batch

**New endpoint** — Bulk enrichment

- **Method:** POST
- **Path:** /api/knowledge/enrich/batch
- **Body:**
  ```json
  {
    "batchSize": 10,
    "operations": ["keywords", "summary", "entities", "type", "questions", "freshness"]
  }
  ```

**Response:**
```json
{
  "processed": 10,
  "errors": [],
  "enriched": [
    {"id": "uuid", "title": "Doc 1"},
    {"id": "uuid", "title": "Doc 2"}
  ]
}
```

## Integration Points

### Existing Systems

| System | Integration |
|--------|-------------|
| Pipeline Monitor | Enrichment stats visible in dashboard |
| Document Inspector | View hybrid scores after retrieval |
| Copilot | Uses hybrid search for RAG context |

### No Changes Required

- Terminal interface (strangler fig pattern)
- Embedding generation
- Document ingestion
