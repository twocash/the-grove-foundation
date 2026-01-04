# Pipeline Inspector & Copilot Specification v2
## Sprint: pipeline-inspector-v1

**Status**: Draft v2 (Aligned with Sprout System & Knowledge Commons)
**Created**: 2025-01-03
**Author**: Grove Foundation

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract
**Contract version:** 1.0
**Additional requirements:** Console pattern, Copilot mandate, GroveObject alignment

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Inspector Panel | BedrockInspector (Pattern 6) | Wire document-specific config |
| Copilot commands | BedrockCopilot (Pattern 6) | Add enrichment command handlers |
| Tag/chip UI | Token Namespaces (Pattern 4) | Create TagArray, GroupedChips with `--card-*` tokens |
| Quality signals | Engagement Machine (Pattern 2) | None - read-only utility display |
| Tier selection | Existing tier system | Fix terminology, add grove tier |

## New Patterns Proposed

None required. All needs met by extending existing Bedrock and token patterns.

---

## Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Document list | DocumentsView.tsx | ✓ Canonical | Keep |
| Document card | DocumentCard.tsx | ✓ Canonical | Extend with tier fix |
| Inspector panel | BedrockInspector | ✓ Canonical | Invoke with config |
| Copilot UI | BedrockCopilot | ✓ Canonical | Invoke with config |
| Tag array | None | None | CREATE in primitives |
| Grouped chips | None | None | CREATE in primitives |
| Utility bar | None | None | CREATE in primitives |

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities.
All new components (TagArray, GroupedChips, UtilityBar) fill gaps in the primitives library.

---

## Executive Summary

Extend the Pipeline Monitor console with Inspector Panel and Copilot support, aligned with Grove's Knowledge Commons architecture. Documents follow the same botanical lifecycle as Sprouts (Seed → Sprout → Sapling → Tree → Grove), with quality signals accumulating through use rather than pre-publication gatekeeping.

The key innovation is **provenance-aware enrichment** - tracking not just what a document contains, but how it's used, what queries surface it, and how it contributes to the attribution economy.

---

## Architecture Alignment

### Two Paths to the Knowledge Commons

```
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE COMMONS                          │
│                    (Tree + Grove tiers)                         │
└─────────────────────────────────────────────────────────────────┘
                ▲                              ▲
                │                              │
    ┌───────────┴───────────┐      ┌──────────┴──────────┐
    │   DOCUMENT PIPELINE   │      │    SPROUT SYSTEM    │
    │   (uploaded content)  │      │  (captured outputs) │
    │                       │      │                     │
    │  PDF, MD, TXT, DOCX   │      │  Terminal /sprout   │
    │  External knowledge   │      │  LLM responses      │
    │  Research, refs       │      │  User discoveries   │
    └───────────────────────┘      └─────────────────────┘
```

Both tracks use the same tier lifecycle:
- **Seed**: Raw content, minimal metadata
- **Sprout**: Captured with provenance, awaiting review
- **Sapling**: Validated, enriched, retrieval-ready
- **Tree**: Knowledge Commons integration
- **Grove**: Network-wide adoption (future)

### The Attribution Economy Connection

Documents that prove useful generate attribution:
- Retrieval events create usage signals
- Derivative content (sprouts that cite this doc) creates attribution chains
- High-utility documents earn promotion through demonstrated value

---

## Tier Alignment Issue

**Current UI** (DocumentsView.tsx): `seedling`, `sapling`, `oak`
**Database Schema** (001_kinetic_pipeline.sql): `seed`, `sprout`, `sapling`, `tree`, `grove`
**Canonical** (Sprout System): `seed`, `sprout`, `sapling`, `tree`, `grove`

**Resolution**: Update UI to match canonical botanical metaphor.

---

## Data Model Extensions

### Schema Migration (004_document_enrichment.sql)

```sql
-- Align tier values with Sprout System (fix existing data)
UPDATE documents SET tier = 'seed' WHERE tier = 'seedling';
UPDATE documents SET tier = 'tree' WHERE tier = 'oak';

-- Add provenance tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  source_context JSONB DEFAULT '{}';
  -- {uploadedBy, uploadSession, originalPath, capturedFrom}

-- Semantic enrichment (AI-extracted or human-curated)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT
  CHECK (document_type IN ('research', 'tutorial', 'reference', 'opinion', 'announcement', 'transcript'));
ALTER TABLE documents ADD COLUMN IF NOT EXISTS named_entities JSONB DEFAULT '{}';
  -- {people: [], organizations: [], concepts: [], technologies: []}
ALTER TABLE documents ADD COLUMN IF NOT EXISTS questions_answered TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS temporal_class TEXT DEFAULT 'evergreen'
  CHECK (temporal_class IN ('evergreen', 'current', 'dated', 'historical'));

-- Quality signals (emergent from use, not gatekeeping)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retrieval_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retrieval_queries TEXT[];  -- What queries surface this
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_retrieved_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS utility_score FLOAT DEFAULT 0;
  -- Computed from: retrieval_count, query diversity, user feedback
ALTER TABLE documents ADD COLUMN IF NOT EXISTS editorial_notes TEXT;

-- Attribution chain
ALTER TABLE documents ADD COLUMN IF NOT EXISTS derived_from UUID[];  -- Parent documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS derivatives UUID[];    -- Child documents/sprouts
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cited_by_sprouts UUID[];  -- Sprouts that reference this

-- Enrichment tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enriched_by TEXT;  -- 'copilot' | 'manual' | 'bulk'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS enrichment_model TEXT;

-- Indexes for retrieval optimization
CREATE INDEX IF NOT EXISTS documents_keywords_idx ON documents USING gin(keywords);
CREATE INDEX IF NOT EXISTS documents_temporal_class_idx ON documents(temporal_class);
CREATE INDEX IF NOT EXISTS documents_utility_score_idx ON documents(utility_score DESC);

-- Function to update utility score
CREATE OR REPLACE FUNCTION update_document_utility()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple utility: log(retrieval_count + 1) * query_diversity_factor
  NEW.utility_score := ln(COALESCE(NEW.retrieval_count, 0) + 1) * 
    (1 + 0.1 * COALESCE(array_length(NEW.retrieval_queries, 1), 0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_utility_trigger
  BEFORE UPDATE ON documents
  FOR EACH ROW
  WHEN (OLD.retrieval_count IS DISTINCT FROM NEW.retrieval_count)
  EXECUTE FUNCTION update_document_utility();
```

---

## Inspector Panel Design

### Section 1: Identity (default open)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Title | text | ✓ | Document name |
| Tier | select | ✓ | seed/sprout/sapling/tree/grove |
| Document Type | select | ✓ | research/tutorial/reference/opinion/announcement/transcript |
| Status | badge | read-only | embedding status |

### Section 2: Provenance (default closed)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Source URL | url | ✓ | Original location |
| File Type | text | read-only | pdf/md/txt/docx |
| Uploaded | datetime | read-only | When added |
| Uploaded By | text | read-only | Session/user context |
| Derived From | links | ✓ | Parent documents |
| Derivatives | links | read-only | Children (auto-populated) |

### Section 3: Enrichment (default open)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Keywords | tag-array | ✓ | Retrieval optimization |
| Summary | textarea | ✓ | 2-3 sentences for preview |
| Named Entities | grouped-chips | ✓ | People/Orgs/Concepts/Tech |
| Questions Answered | list | ✓ | What queries should find this? |
| Temporal Class | select | ✓ | evergreen/current/dated/historical |

### Section 4: Usage Signals (default closed)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Retrievals | number | read-only | Times surfaced in search |
| Utility Score | progress | read-only | Computed quality signal |
| Last Retrieved | datetime | read-only | Most recent use |
| Common Queries | list | read-only | What queries surface this |
| Cited By | count | read-only | Sprouts referencing this |

### Section 5: Editorial (default closed)
| Field | Type | Editable | Notes |
|-------|------|----------|-------|
| Notes | textarea | ✓ | Curator comments |
| Enriched | datetime | read-only | When AI enrichment ran |
| Enriched By | text | read-only | copilot/manual/bulk |

---

## Copilot Commands

### Enrichment Commands

**`extract keywords`**
- Analyzes content for high-signal terms
- Considers document type (research→methodology terms, tutorial→action verbs)
- Suggests 5-10 keywords, awaits confirmation

**`summarize`**
- Generates 2-3 sentence summary optimized for:
  - Preview display
  - Embedding enhancement (summary + content = better vectors)
- Considers document type for appropriate tone

**`extract entities`**
- Identifies and categorizes:
  - People (authors, subjects, experts)
  - Organizations (companies, institutions)
  - Concepts (theories, frameworks)
  - Technologies (tools, platforms, languages)
- Returns structured JSON for grouped display

**`suggest questions`**
- Generates 3-5 questions this document answers
- These become retrieval targets
- "What questions would lead someone to this doc?"

**`classify type`**
- Analyzes structure and content signals:
  - Citations → research
  - Step-by-step → tutorial
  - API/spec format → reference
  - First-person + opinion markers → opinion
  - Date headers + event focus → announcement

**`check freshness`**
- Scans for temporal markers (dates, versions, "currently", "recently")
- Suggests temporal_class based on content age signals
- "References 2019 data extensively. Suggest: dated"

### Analysis Commands

**`analyze utility`**
- Examines retrieval patterns
- "This doc surfaces for queries about X, Y, Z"
- "Low retrieval but high keyword overlap with frequently-retrieved docs - consider promoting"

**`find related`**
- Semantic similarity search
- Returns top 5 related documents
- Option to link as derived_from

**`suggest promotion`**
- Evaluates readiness for tier advancement:
  - Seed → Sprout: Has provenance, basic metadata
  - Sprout → Sapling: Keywords, summary, validated
  - Sapling → Tree: High utility, editorial review
- "Ready for sapling: has enrichment, 47 retrievals, positive utility trend"

### Action Commands

**`enrich`** (compound command)
- Runs: extract keywords + summarize + extract entities + classify type
- Presents all suggestions for batch approval
- Updates enriched_at, enriched_by

**`promote to [tier]`**
- Changes tier with validation
- Logs promotion in editorial notes

**`re-embed`**
- Triggers re-embedding with current enrichment
- Useful after significant metadata changes

---

## Quality Through Use (Not Gatekeeping)

The Knowledge Commons philosophy: quality signals emerge from adoption, not pre-publication review.

### Retrieval Tracking

When a document is retrieved:
```typescript
// On retrieval event
await updateDocument(docId, {
  retrieval_count: increment(1),
  retrieval_queries: arrayUnion(currentQuery),
  last_retrieved_at: now()
});
// Trigger recomputes utility_score
```

### Utility Score Computation

```
utility_score = ln(retrieval_count + 1) × query_diversity_factor

where query_diversity_factor = 1 + 0.1 × unique_query_count
```

Documents that answer diverse queries score higher than those retrieved repeatedly for the same query.

### Promotion Criteria (Suggested, Not Enforced)

| Tier | Suggested Criteria |
|------|-------------------|
| Seed → Sprout | Basic metadata present |
| Sprout → Sapling | Keywords + summary + 10+ retrievals |
| Sapling → Tree | Editorial review + 100+ retrievals + positive utility trend |
| Tree → Grove | Network adoption (future) |

These are guidelines, not gates. Humans can promote at any time.

---

## Hybrid Retrieval Strategy

### Current (Pure Vector)
```sql
SELECT * FROM search_documents(query_embedding, 10, 0.7)
```

### Enhanced (Keyword + Vector + Quality)
```sql
WITH candidates AS (
  -- 1. Keyword pre-filter (fast, narrows search space)
  SELECT id FROM documents
  WHERE keywords && $keyword_array  -- array overlap
    AND temporal_class != 'dated'
    AND tier IN ('sapling', 'tree', 'grove')
),
vector_scored AS (
  -- 2. Vector similarity on candidates
  SELECT 
    d.id, d.title, d.content, d.utility_score,
    1 - (e.embedding <=> $query_embedding) AS similarity
  FROM candidates c
  JOIN documents d ON c.id = d.id
  JOIN embeddings e ON d.id = e.document_id
)
-- 3. Quality-weighted ranking
SELECT *,
  similarity * (1 + utility_score * 0.1) AS final_score
FROM vector_scored
ORDER BY final_score DESC
LIMIT 10;
```

### Question-Answer Matching
```sql
-- Direct question match (exact or fuzzy)
SELECT * FROM documents
WHERE questions_answered @> ARRAY[$user_question]
   OR questions_answered && string_to_array($user_question_keywords, ' ');
```

---

## UI Component Requirements

### TagArray (for keywords)
```
┌─────────────────────────────────────────┐
│ Keywords                          [+ Add]│
│ ┌────────────┐ ┌──────────┐ ┌─────────┐ │
│ │distributed×│ │consensus×│ │  raft ×│ │
│ └────────────┘ └──────────┘ └─────────┘ │
│ ┌─────────────────┐                     │
│ │leader-election×│                      │
│ └─────────────────┘                     │
└─────────────────────────────────────────┘
```

### GroupedChips (for entities)
```
┌─────────────────────────────────────────┐
│ Named Entities                          │
│ ─────────────────────────────────────── │
│ People:       [Lamport] [Ongaro] [+]    │
│ Organizations:[Google] [Stanford] [+]   │
│ Concepts:     [Paxos] [Consensus] [+]   │
│ Technologies: [gRPC] [Protobuf] [+]     │
└─────────────────────────────────────────┘
```

### UtilityBar (for usage signals)
```
┌─────────────────────────────────────────┐
│ Utility Score                           │
│ ████████████░░░░░░░░  2.4 (47 retrievals)│
│ Trend: ↑ +0.3 this week                 │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Schema & Tier Alignment (2 hrs)
1. Create migration 004_document_enrichment.sql
2. Fix tier values in UI (seedling→seed, oak→tree)
3. Add grove tier option
4. Update TypeScript types

### Phase 2: Inspector Integration (4 hrs)
1. Wire PipelineMonitor into console-factory
2. Create document inspector config
3. Build TagArray, GroupedChips components
4. Add UtilityBar display

### Phase 3: Basic Copilot (4 hrs)
1. Extend copilot-commands.ts for documents
2. Implement field setters
3. Add promote command with tier validation

### Phase 4: AI Extraction (6 hrs)
1. Create /api/knowledge/enrich endpoint
2. Implement keyword extraction
3. Implement summarization
4. Implement entity extraction
5. Wire to copilot commands

### Phase 5: Retrieval Enhancement (4 hrs)
1. Add retrieval tracking middleware
2. Update search function for hybrid approach
3. Implement utility score trigger
4. Add question-answer matching

**Total: ~20 hours**

---

## Open Questions

1. **Auto-enrichment on upload?** Run extraction automatically or wait for manual trigger?
2. **Keyword vocabulary**: Freeform or suggest from existing keywords (taxonomy emergence)?
3. **Sprout-Document linking**: When a sprout cites a document, auto-populate cited_by_sprouts?
4. **Network attribution**: How do Tree-tier documents earn Grove promotion? (Future consideration)

---

## Success Metrics

1. **Enrichment Coverage**: % of documents with keywords + summary
2. **Retrieval Quality**: User satisfaction with search results (future feedback mechanism)
3. **Tier Progression**: Documents advancing through lifecycle
4. **Utility Distribution**: Healthy spread of utility scores (not all low or all high)

---

## Appendix: Document Types

| Type | Signals | Examples |
|------|---------|----------|
| research | Citations, methodology, findings sections | Papers, studies |
| tutorial | Step-by-step, code blocks, "how to" | Guides, walkthroughs |
| reference | Structured data, specs, API format | Documentation |
| opinion | First-person, argument structure | Blog posts, essays |
| announcement | Date headers, event focus | Release notes, news |
| transcript | Speaker labels, timestamps | Meeting notes, interviews |

## Appendix: Temporal Classes

| Class | Description | Retrieval Weight |
|-------|-------------|------------------|
| evergreen | Timeless fundamentals | 1.0x |
| current | Recent, actively relevant | 1.0x |
| dated | Contains outdated info | 0.5x |
| historical | Valuable for context, not current practice | 0.7x |
