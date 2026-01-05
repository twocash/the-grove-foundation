# Repository Audit: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Audited:** 2025-01-05  
**Scope:** Prompt system unification with provenance, document extraction, hybrid search activation

---

## 1. Executive Summary

### Strategic Decision

**Questions and Prompts are the same object.** Both are navigation primitives—suggestions for exploration with labels, execution context, and affinities. The only difference is provenance (where they came from).

Creating parallel Question and Prompt systems would violate DEX principles:
- **Not Declarative:** Two schemas declaring the same thing
- **Not eXtensible:** New provenance types require new systems
- **Architectural debt:** Two scoring systems, two surfacing pipelines, two admin UIs

### The Unified Model

Extend `PromptObject` with provenance tracking. One system, multiple sources:

```
ExplorationNodes (Prompts with Provenance)
              ↑
    ┌─────────┼───────────┬─────────────┐
    │         │           │             │
 authored  extracted   generated    submitted
 (manual)  (from docs) (from gaps)  (future)
```

---

## 2. Current State Analysis

### 2.1 Prompt System (Gold Standard)

**Location:** `src/core/context-fields/` + `src/data/prompts/`

**PromptObject schema (types.ts:105-143):**
```typescript
interface PromptObject {
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  label: string;                    // What users see
  description?: string;
  executionPrompt: string;          // What LLM processes
  systemContext?: string;           // Additional context
  
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: ContextTargeting;
  baseWeight?: number;
  
  stats: PromptStats;
  status: 'draft' | 'active' | 'deprecated';
  source: 'library' | 'generated' | 'user';
  generatedFrom?: GenerationContext;
}
```

**Inventory:**
| File | Count | Lens | Notes |
|------|-------|------|-------|
| `base.prompts.json` | 23 | None (universal) | Generic exploration |
| `wayne-turner.prompts.json` | 21 | wayne-turner | 4D targeted |
| `dr-chiang.prompts.json` | 22 | dr-chiang | 4D targeted |
| **Total** | **66** | — | All status: active |

**Key patterns in wayne-turner prompts:**
- `label`: Simple question users see ("What's at stake?")
- `executionPrompt`: First-person question with context
- `systemContext`: Rich LLM instruction (persona, framing, ending)
- `targeting.stages`: Which journey stages
- `lensAffinities`: Weighted persona connections

### 2.2 Prompt Workshop (Admin UI)

**Location:** `src/bedrock/consoles/PromptWorkshop/`

**Files:**
- `PromptWorkshop.config.ts` — Console configuration
- `PromptCard.tsx` — Grid card renderer
- `PromptEditor.tsx` — Detail editor (right panel)
- `usePromptData.ts` — Data hook
- `PromptCopilotActions.ts` — AI assistance

**Console route:** `/bedrock/prompts`

**Capabilities:**
- Grid/List view with search
- Filter by source, stage, status
- Sort by weight, name, updated, selections
- Favorites support
- Copilot integration

**What's missing:**
- Provenance filtering
- Source document linkage
- Extraction status indicators
- Gap analysis view

### 2.3 Document Enrichment Pipeline

**Location:** `server.js:3525-3660` + `lib/knowledge/enrich.js`

**Current `suggestQuestions()` (server.js:3623):**
```javascript
async function suggestQuestions(content, title) {
  const prompt = `What 3-5 questions would someone ask that this document answers?
  Return as a JSON array of strings, like: ["Question 1?", "Question 2?"]`;
  // Returns: ["What is X?", "How does Y work?"]
}
```

**Problem:** Produces simple strings, not rich PromptObjects.

**Current storage:** `questions_answered TEXT[]` on documents table
- Migration: `004_document_enrichment.sql:49`
- Stored but **never used** in retrieval or surfacing

**Enrichment operations (enrich.js:96):**
```javascript
operations = ['keywords', 'summary', 'entities', 'type', 'questions', 'freshness']
```

### 2.4 Hybrid Search

**Location:** `supabase/migrations/005_hybrid_search.sql` + `lib/knowledge/search.js`

**SQL function exists:** `search_documents_hybrid`
- Vector similarity (0.50 weight)
- Keyword matching (0.25 weight)
- Utility boost (0.15 weight)
- Freshness boost (0.10 weight)
- Temporal weighting

**Current search.js usage (line 47):**
```javascript
// Uses pure vector search, NOT hybrid
const { data } = await supabaseAdmin.rpc('search_documents', {...});
```

**Hybrid search function exists but NOT wired.** `searchDocumentsHybrid` function in search.js (line 163) calls `search_documents_hybrid` RPC.

**Gap:** No question/prompt matching in search results.

### 2.5 Database Schema

**documents table enrichment columns:**
- `keywords TEXT[]` — ✅ Used in hybrid search
- `summary TEXT` — ✅ Used for preview
- `named_entities JSONB` — ✅ Used for entity search
- `document_type TEXT` — ✅ Used for filtering
- `questions_answered TEXT[]` — ❌ UNUSED
- `temporal_class TEXT` — ✅ Used in hybrid search
- `utility_score FLOAT` — ✅ Used in hybrid search

---

## 3. Pattern Compliance Check

### PROJECT_PATTERNS.md Alignment

| Pattern | Status | Notes |
|---------|--------|-------|
| Pattern 7: Object Model | ✅ Extending | Add provenance to PromptObject |
| Pattern 3: Narrative Content | ✅ Compatible | Prompts are narrative objects |
| Pattern 8: Canonical Source | ✅ Following | Prompt Workshop is canonical home |
| Pattern 5: Feature Detection | ✅ Extending | Provenance-aware scoring |

### DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Provenance in config, extraction via Gemini prompts |
| **Capability Agnosticism** | System works regardless of extraction model |
| **Provenance as Infrastructure** | First-class provenance tracking |
| **Organic Scalability** | New provenance types slot in cleanly |

---

## 4. Files to Modify

### 4.1 Core Types (Extend)

| File | Changes |
|------|---------|
| `src/core/context-fields/types.ts` | Add `PromptProvenance` type, extend `PromptObject` |

### 4.2 Database (Add)

| File | Changes |
|------|---------|
| `supabase/migrations/007_prompt_provenance.sql` | Add provenance columns to future prompts table |

### 4.3 Extraction Pipeline (New)

| File | Purpose |
|------|---------|
| `src/core/extraction/types.ts` | Extraction types |
| `src/core/extraction/extract-prompts.ts` | Document → PromptObject[] |
| `src/core/extraction/deduplication.ts` | Merge similar prompts |
| `server.js` | New extraction endpoint |

### 4.4 Search Integration (Modify)

| File | Changes |
|------|---------|
| `lib/knowledge/search.js` | Use hybrid search, return matched prompts |

### 4.5 Scoring (Modify)

| File | Changes |
|------|---------|
| `src/core/context-fields/scoring.ts` | Add provenance-aware scoring |

### 4.6 Prompt Workshop (Extend)

| File | Changes |
|------|---------|
| `PromptWorkshop.config.ts` | Add provenance filter |
| `PromptCard.tsx` | Show provenance indicator |
| `PromptEditor.tsx` | Show source documents |

---

## 5. Protected Files (DO NOT MODIFY)

| File | Reason |
|------|--------|
| `src/data/prompts/*.json` | Existing authored prompts—add provenance field only |
| `src/core/engagement/` | State machine untouched |
| `src/surface/` | Surface components untouched |

---

## 6. Gap Analysis

### What's Missing for Unified Model

1. **Provenance field on PromptObject** — Track where each prompt came from
2. **Extraction pipeline** — Transform documents into PromptObjects
3. **Molecular independence enforcement** — Each prompt stands alone
4. **Stage/lens inference** — Derive affinities from document context
5. **Deduplication** — Merge similar extracted prompts
6. **Hybrid search activation** — Wire existing function
7. **Prompt matching in retrieval** — Connect queries to prompts
8. **Coverage analysis** — Show gaps by stage/lens
9. **Gap-based generation** — Suggest prompts for uncovered areas

### Integration Points

```
Document Ingested
       │
       ▼
┌─────────────────┐
│ Gemini Extract  │ → PromptObject[] with provenance.type='extracted'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deduplication   │ → Merge with existing, mark provenance
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prompt Store    │ → Unified prompt collection
└─────────────────┘
         │
         ▼
User Query → Hybrid Search → Prompt Matching → Provenance-Aware Scoring → Surface
```

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extraction quality varies | High | Medium | Human review status for extracted prompts |
| Deduplication false positives | Medium | Medium | Similarity threshold tuning, manual merge |
| Hybrid search not deployed | Low | High | Verify before integration |
| Performance with many prompts | Low | Low | Index on provenance fields |

---

## 8. Recommendations

### Phase 1: Foundation (Day 1-2)
1. Add provenance to PromptObject type
2. Create extraction pipeline producing PromptObjects
3. Verify/activate hybrid search

### Phase 2: Integration (Day 2-3)
4. Wire extraction to enrichment pipeline
5. Add prompt matching to search results
6. Provenance-aware scoring

### Phase 3: Visibility (Day 3-4)
7. Update Prompt Workshop with provenance UI
8. Coverage analysis view
9. Gap detection and suggestions

---

## 9. Appendix: Current File Inventory

```
src/core/context-fields/
├── types.ts              → PromptObject definition (EXTEND)
├── scoring.ts            → Scoring logic (EXTEND)
├── telemetry.ts          → Telemetry infrastructure (KEEP)
├── adapters.ts           → Adapters (KEEP)
├── generator.ts          → Generation (KEEP)
├── index.ts              → Barrel export (UPDATE)
└── useContextState.ts    → State hook (KEEP)

src/data/prompts/
├── base.prompts.json     → 23 authored prompts (ADD provenance field)
├── wayne-turner.prompts.json → 21 authored prompts (ADD provenance field)
├── dr-chiang.prompts.json → 22 authored prompts (ADD provenance field)
├── index.ts              → Loader (KEEP)
└── stage-prompts.ts      → Deprecated (IGNORE)

src/bedrock/consoles/PromptWorkshop/
├── PromptWorkshop.config.ts → Console config (EXTEND)
├── PromptCard.tsx        → Card renderer (EXTEND)
├── PromptEditor.tsx      → Editor (EXTEND)
├── usePromptData.ts      → Data hook (KEEP)
└── PromptCopilotActions.ts → Copilot (KEEP)

lib/knowledge/
├── search.js             → Search functions (MODIFY)
├── enrich.js             → Enrichment (KEEP)
└── index.js              → Exports (UPDATE)

server.js
├── Lines 3623-3640       → suggestQuestions() (REPLACE)
└── New endpoint          → /api/prompts/extract (ADD)
```

---

*Audit complete. Ready for SPEC.md generation.*
