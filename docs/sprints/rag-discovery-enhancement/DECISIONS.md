# Architectural Decision Records — rag-discovery-enhancement-v1

## ADR-001: Hybrid Search Formula

### Status
Accepted

### Context
The current search uses pure vector similarity, ignoring enrichment metadata (keywords, utility scores, temporal classification). We need a formula that combines multiple signals into a unified score.

### Options Considered
1. **Simple addition** — Add all scores with equal weight
2. **Weighted linear combination** — Assign weights based on signal importance
3. **Learned weights** — Train ML model to optimize weights
4. **Reciprocal Rank Fusion** — Standard multi-retrieval fusion technique

### Decision
Use weighted linear combination with hardcoded weights:
```
final_score = (
  vector_similarity * 0.50 +
  keyword_overlap * 0.25 +
  utility_boost * 0.15 +
  freshness_boost * 0.10
) * temporal_weight
```

### Rationale
- **50% vector** — Semantic similarity remains primary signal (most robust)
- **25% keyword** — Explicit term matches are strong relevance signal
- **15% utility** — Usage patterns valuable but shouldn't dominate
- **10% freshness** — Cold start mitigation, decays over time
- Temporal weight as multiplier affects entire score
- Weights are empirically reasonable starting point
- Future iteration can tune based on feedback

### Consequences

**Positive:**
- Clear, interpretable scoring
- Easy to debug and explain
- Can tune weights without code changes (future config)

**Negative:**
- Optimal weights unknown until tested
- May need adjustment per corpus type

**Neutral:**
- Linear combination is standard practice

---

## ADR-002: Temporal Decay Strategy

### Status
Accepted

### Context
Documents have temporal classification (evergreen, current, dated, historical). Need to appropriately weight based on content freshness.

### Options Considered
1. **Binary filter** — Exclude dated/historical entirely
2. **Mild decay** — dated=0.9, historical=0.8
3. **Aggressive decay** — dated=0.7, historical=0.5
4. **Configurable per-query** — User specifies freshness preference

### Decision
Use aggressive decay as default: dated=0.7, historical=0.5

### Rationale
- Research corpus benefits from surfacing current knowledge
- Users explicitly searching for historical context can filter
- 50% reduction for historical prevents dated content from dominating
- Can be tuned via config in future sprint

### Consequences

**Positive:**
- Fresh, relevant content surfaces naturally
- Prevents stale content from clogging results

**Negative:**
- May underweight valuable older research
- Corpus with mostly historical content may suffer

**Neutral:**
- Configurable in future iteration

---

## ADR-003: Keyword Extraction Strategy

### Status
Accepted

### Context
Need to extract meaningful keywords from user queries for keyword matching. Options range from simple stopword removal to sophisticated NLP.

### Options Considered
1. **Simple stopword filter** — Remove common words, keep rest
2. **TF-IDF extraction** — Weight terms by document frequency
3. **Named Entity Recognition** — Extract entities only
4. **LLM-based extraction** — Use AI to identify key concepts

### Decision
Use simple stopword filtering:
- Split on whitespace
- Remove words ≤2 characters
- Remove common English stopwords
- Limit to 10 keywords

### Rationale
- Fast (no API calls, no NLP models)
- Sufficient for most queries
- Enriched document keywords already high-quality
- Can upgrade extraction later without architecture change

### Consequences

**Positive:**
- Zero latency added
- No additional dependencies
- Works offline

**Negative:**
- Won't extract compound concepts ("machine learning")
- Won't handle synonyms

**Neutral:**
- Document keywords do heavy lifting; query keywords are secondary signal

---

## ADR-004: Retrieval Tracking Design

### Status
Accepted

### Context
Need to track document retrievals to build utility scores. Must balance data quality with performance.

### Options Considered
1. **Synchronous tracking** — Track before returning results
2. **Asynchronous tracking** — Track after response, fire-and-forget
3. **Batched tracking** — Queue and flush periodically
4. **Client-side tracking** — Track when user views document

### Decision
Asynchronous fire-and-forget tracking:
- Call `track_document_retrieval` RPC after search completes
- Don't await result
- Log errors but don't block response
- Cap stored queries at 50 per document

### Rationale
- Search latency is critical; don't add tracking overhead
- Missing a few tracking events is acceptable
- Query cap prevents unbounded storage growth
- Database trigger updates utility_score automatically

### Consequences

**Positive:**
- Zero impact on search latency
- Graceful degradation if tracking fails

**Negative:**
- May miss some tracking events under load
- Eventual consistency for utility scores

**Neutral:**
- Acceptable tradeoff for MVP

---

## ADR-005: Backward Compatibility Approach

### Status
Accepted

### Context
Existing code uses `searchDocuments()` and `/api/knowledge/search` endpoint. Need to add hybrid search without breaking existing integrations.

### Options Considered
1. **Replace in-place** — Modify existing function to use hybrid
2. **New function, flag parameter** — Add `hybrid` param to existing
3. **Separate function and endpoint** — Create new parallel path
4. **Default switch** — New behavior default, opt-out available

### Decision
New function with flag parameter:
- Create `searchDocumentsHybrid()` alongside `searchDocuments()`
- Add `hybrid` parameter to API endpoint (default: false initially)
- After validation, switch default to true

### Rationale
- Existing code continues working unchanged
- Easy rollback (just set hybrid=false)
- Clean separation of concerns
- Can A/B test hybrid vs basic

### Consequences

**Positive:**
- Zero risk of breaking existing functionality
- Clean rollout path

**Negative:**
- Two code paths to maintain temporarily
- Need to eventually deprecate basic search

**Neutral:**
- Standard strangler fig pattern

---

## ADR-006: Bulk Enrichment Rate Limiting

### Status
Accepted

### Context
Bulk enrichment calls Gemini API for each document. Need to respect rate limits and provide progress feedback.

### Options Considered
1. **No rate limiting** — Process as fast as possible
2. **Fixed delay** — 1 second between documents
3. **Adaptive rate limiting** — Backoff on 429 errors
4. **Parallel with semaphore** — Process N documents concurrently

### Decision
Fixed 1-second delay between documents:
```javascript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Rationale
- Simple and predictable
- 60 docs/minute well within typical API limits
- Easy to adjust if needed
- Progress is transparent (N docs in ~N seconds)

### Consequences

**Positive:**
- Reliable, won't hit rate limits
- Predictable timing for progress UI

**Negative:**
- Slower than theoretically possible
- Large corpus takes significant time (150 docs = 2.5 minutes)

**Neutral:**
- Acceptable for background operation

---

## ADR-007: Testing Strategy

### Status
Accepted

### Context
Knowledge module currently has no automated tests. Need to establish testing approach for new functionality.

### Decision
Add integration tests for key behaviors:

### Test Categories
| Category | Tests | Purpose |
|----------|-------|---------|
| Integration | 8 | API endpoint contracts |
| Manual | 5 | SQL function verification |

### Test Philosophy
- Test API contracts, not implementation details
- Verify scoring produces expected relative rankings
- Don't test exact score values (implementation detail)
- Test error handling and edge cases

### Test Files
- `tests/integration/hybrid-search.test.js`
- `tests/integration/enrichment.test.js`

### Rationale
- API tests provide most value for effort
- Unit tests for pure functions (keyword extraction) as needed
- Avoid testing database internals (implementation detail)

---

## ADR-008: Scope Boundary

### Status
Accepted

### Context
Several potential enhancements were identified during planning. Need clear scope boundary for this sprint.

### In Scope
- Hybrid search function and RPC
- Keyword extraction from queries
- Retrieval tracking for utility scores
- Bulk enrichment pipeline
- API endpoints for search and enrichment
- Basic integration tests

### Out of Scope (Deferred)
- Question embedding matching (requires separate embedding storage)
- Full-text search with PostgreSQL tsvector
- Terminal integration (strangler fig)
- Configurable weights UI (future DEX compliance)
- GraphRAG / relationship traversal

### Decision
Focus on core hybrid search + enrichment. Defer advanced features.

### Rationale
- Core value: hybrid search using existing enrichment data
- Question matching adds complexity (separate embeddings)
- Full-text search is orthogonal enhancement
- Terminal unchanged per strangler fig pattern

### Consequences

**Positive:**
- Clear, achievable scope
- Delivers core value quickly

**Negative:**
- Won't match questions (strongest potential signal)
- No phrase matching

**Neutral:**
- Can add in follow-up sprints
