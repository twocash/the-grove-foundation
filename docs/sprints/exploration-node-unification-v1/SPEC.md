# Specification: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Version:** 1.0  
**Author:** Grove Foundation Loop  
**Created:** 2025-01-05

---

## 1. Overview

### 1.1 Goal

Unify Questions and Prompts into a single `PromptObject` with provenance tracking. Create an extraction pipeline that transforms documents into exploration nodes, activate hybrid search, and enable the system to "come alive" by surfacing contextually relevant prompts based on document content.

### 1.2 Strategic Context

> **Questions are prompts with different provenance.**

Both are navigation primitives—suggestions for exploration with labels, execution context, and affinities. Creating parallel systems violates DEX principles. This sprint establishes the **reference Trellis 1.0 pattern** for unified exploration nodes.

### 1.3 Domain Contract

**Applicable contract:** Bedrock Sprint Contract  
**Contract version:** 1.0  
**Additional requirements:** 
- Prompt Workshop as canonical home
- GroveObject compliance (PromptObject extends GroveObjectMeta)
- Strangler fig awareness (no imports from legacy)

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | PromptObject includes provenance field tracking source | Must |
| FR-002 | Extraction pipeline produces PromptObject[] from documents | Must |
| FR-003 | Each extracted prompt is molecularly independent | Must |
| FR-004 | Extraction infers stage affinities from document tier | Must |
| FR-005 | Extraction infers lens affinities from named entities | Should |
| FR-006 | Extraction generates contextual prompts (not just labels) | Must |
| FR-007 | Hybrid search is activated and returns enrichment scores | Must |
| FR-008 | Search results include matched prompts by embedding similarity | Should |
| FR-009 | Scoring incorporates provenance (authored > extracted > generated) | Should |
| FR-010 | Prompt Workshop shows provenance indicators | Must |
| FR-011 | Prompt Workshop filters by provenance type | Should |
| FR-012 | Coverage analysis shows gaps by stage/lens | Should |
| FR-013 | Gap analysis suggests new prompts | Could |
| FR-014 | Existing authored prompts backfilled with provenance | Must |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Extraction processes 60 docs in < 10 minutes | Batch processing |
| NFR-002 | Search response time < 500ms with prompt matching | Performance |
| NFR-003 | Prompt deduplication prevents exact duplicates | Data quality |
| NFR-004 | Extraction prompt enforces molecular independence | Quality |

---

## 3. Data Model

### 3.1 PromptProvenance Type

```typescript
/**
 * Provenance tracking for exploration nodes
 */
interface PromptProvenance {
  type: 'authored' | 'extracted' | 'generated' | 'submitted';
  
  // For extracted prompts
  sourceDocIds?: string[];
  sourceDocTitles?: string[];
  extractedAt?: number;
  extractionModel?: string;
  extractionConfidence?: number;
  
  // For authored prompts
  authorId?: string;
  authorName?: string;
  
  // For generated prompts (from gap analysis)
  gapAnalysisId?: string;
  generationReason?: string;
  
  // Review tracking
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedAt?: number;
  reviewedBy?: string;
}
```

### 3.2 Extended PromptObject

```typescript
interface PromptObject {
  // ... existing fields ...
  
  // NEW: Provenance tracking
  provenance: PromptProvenance;
  
  // NEW: Embedding for similarity matching
  embedding?: number[];
  
  // Existing source field maps to provenance.type
  // source: 'library' → provenance.type: 'authored'
  // source: 'generated' → provenance.type: 'generated'
  // source: 'user' → provenance.type: 'submitted'
}
```

### 3.3 Extraction Result

```typescript
interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  prompts: PromptObject[];
  metadata: {
    extractedAt: number;
    model: string;
    tier: string;
    namedEntities: {
      people: string[];
      organizations: string[];
      concepts: string[];
    };
  };
}
```

---

## 4. Extraction Pipeline

### 4.1 Extraction Prompt

The Gemini prompt must produce molecularly independent, lens-aware, stage-targeted prompts:

```
You are extracting exploration prompts from a Grove knowledge document.

DOCUMENT:
Title: ${title}
Content: ${content.slice(0, 4000)}
Tier: ${tier}
Named Entities: ${JSON.stringify(entities)}

EXTRACTION RULES:

1. MOLECULAR INDEPENDENCE: Each prompt must stand completely alone.
   - Never assume the reader has seen other prompts
   - No "following up on..." or "building on..."
   - Each prompt is a valid entry point to this topic
   - A reader selecting this prompt knows NOTHING else

2. DUAL FORM: Each prompt needs two versions:
   - LABEL: Simple question for UI (10-15 words max)
     Example: "What's actually at stake with AI concentration?"
   - EXECUTION_PROMPT: First-person question with curiosity and specificity
     Example: "I've read enough to know this matters. But make the stakes concrete..."
   - SYSTEM_CONTEXT: Rich instruction for LLM (persona awareness, framing, ending)
     Example: "The reader cares about X. Frame using Y. End with Z question."

3. STAGE TARGETING: Based on document tier, target prompts to stages:
   - seed tier → genesis stage (curiosity, "what is this?")
   - sprout tier → genesis/exploration (mechanics, "how does it work?")
   - sapling tier → exploration/synthesis (implications, "what does this mean?")
   - tree tier → synthesis/advocacy (action, "what should I do?")
   - grove tier → advocacy (convince others, "how do I explain this?")

4. LENS INFERENCE: From named entities, infer which personas care:
   - Technical entities (models, architectures) → engineer lens
   - Policy/governance entities → policymaker lens
   - Economic entities (markets, costs) → business lens
   - Academic entities (universities, research) → academic lens
   - General/philosophical → base (no specific lens)

5. TOPIC MAPPING: Each prompt should map to 1-3 topics from:
   - infrastructure-bet: AI infrastructure, concentration, ownership
   - technical-architecture: How Grove works technically
   - economics: Business model, costs, credit system
   - governance: Control, decentralization, policy
   - meta-philosophy: Big picture, values, worldview
   - practical: Implementation, getting started

Return JSON array with 5-8 prompts:
[
  {
    "label": "What's at stake with concentrated AI infrastructure?",
    "executionPrompt": "I've read enough to know this isn't another technology pitch...",
    "systemContext": "The reader cares about intellectual independence. Frame using...",
    "stages": ["genesis", "exploration"],
    "lenses": ["base", "concerned-citizen"],
    "topics": ["infrastructure-bet", "meta-philosophy"],
    "confidence": 0.9
  }
]
```

### 4.2 Stage Mapping

| Document Tier | Primary Stage | Secondary Stage |
|--------------|---------------|-----------------|
| seed | genesis | — |
| sprout | genesis | exploration |
| sapling | exploration | synthesis |
| tree | synthesis | advocacy |
| grove | advocacy | — |

### 4.3 Lens Mapping from Entities

| Entity Type | Inferred Lens |
|-------------|---------------|
| People: tech leaders | engineer |
| People: policymakers | policymaker |
| Organizations: universities | academic |
| Organizations: companies | business |
| Concepts: technical | engineer |
| Concepts: economic | business |
| Concepts: philosophical | base |

---

## 5. Hybrid Search Activation

### 5.1 Current State

`search_documents_hybrid` SQL function exists but `lib/knowledge/search.js` calls `search_documents` (pure vector).

### 5.2 Required Changes

```javascript
// In lib/knowledge/search.js

// BEFORE (line 47)
const { data } = await supabaseAdmin.rpc('search_documents', {...});

// AFTER
const { data } = await supabaseAdmin.rpc('search_documents_hybrid', {
  query_embedding: `[${queryEmbedding.join(',')}]`,
  query_keywords: extractQueryKeywords(query),
  match_count: limit,
  match_threshold: threshold,
  track_retrievals: true,
  freshness_decay_days: 30,
});
```

### 5.3 Enhanced Return

```typescript
interface HybridSearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  keywordScore: number;
  utilityBoost: number;
  freshnessBoost: number;
  finalScore: number;
  // NEW: Matched prompts from this document
  matchedPrompts?: PromptObject[];
}
```

---

## 6. Provenance-Aware Scoring

### 6.1 Scoring Algorithm

```typescript
function scorePromptWithProvenance(
  prompt: PromptObject, 
  context: ContextState,
  retrievedDocIds: string[]
): number {
  // Base scoring (existing)
  let score = baseScore(prompt, context);
  
  // Provenance bonuses
  switch (prompt.provenance.type) {
    case 'authored':
      score += 10; // Human curated = trust boost
      break;
    case 'extracted':
      // Boost if source document was just retrieved
      if (prompt.provenance.sourceDocIds?.some(id => retrievedDocIds.includes(id))) {
        score += 25; // Direct relevance
      }
      // Reduce if not reviewed
      if (prompt.provenance.reviewStatus === 'pending') {
        score *= 0.8;
      }
      break;
    case 'generated':
      // Lower trust until reviewed
      if (prompt.provenance.reviewStatus !== 'approved') {
        score *= 0.5;
      }
      break;
  }
  
  return score;
}
```

### 6.2 Weight Configuration

| Provenance Type | Base Modifier | Review Modifier |
|-----------------|---------------|-----------------|
| authored | +10 | N/A |
| extracted (relevant doc) | +25 | *0.8 if pending |
| extracted (not relevant) | +0 | *0.8 if pending |
| generated | +0 | *0.5 if not approved |

---

## 7. Prompt Workshop Enhancements

### 7.1 Header Update

**Current:** "Prompts" 
**New:** "Exploration Nodes" (in center breadcrumb area)
**Button:** "+New Prompt" (unchanged)

### 7.2 Provenance Filter

Add to `collectionView.filterOptions`:
```typescript
{
  field: 'provenance.type',
  label: 'Source',
  type: 'select',
  options: ['authored', 'extracted', 'generated', 'submitted'],
}
```

### 7.3 Card Indicators

Each PromptCard shows provenance badge:
- 📝 Authored (blue)
- 📄 Extracted (green)
- 🤖 Generated (yellow)
- 👤 Submitted (purple)

Plus review status if not approved:
- ⏳ Pending Review
- ✅ Approved
- ❌ Rejected

### 7.4 Editor Additions

In PromptEditor right panel, add "Provenance" section:
- Type badge
- Source documents (if extracted) — clickable links
- Extraction date
- Review status controls

---

## 8. Acceptance Criteria

### 8.1 Provenance Model

- [ ] PromptProvenance type defined in types.ts
- [ ] PromptObject extended with provenance field
- [ ] Existing prompts backfilled with `provenance.type: 'authored'`
- [ ] JSON files updated with provenance field

### 8.2 Extraction Pipeline

- [ ] `extractPrompts()` function produces PromptObject[]
- [ ] Extraction prompt enforces molecular independence
- [ ] Stage affinities inferred from document tier
- [ ] Lens affinities inferred from named entities
- [ ] Each prompt includes label, executionPrompt, systemContext
- [ ] Server endpoint `/api/prompts/extract` available

### 8.3 Hybrid Search

- [ ] `search_documents_hybrid` function verified in Supabase
- [ ] `lib/knowledge/search.js` calls hybrid function
- [ ] Search results include enrichment scores
- [ ] Keywords extracted from query for matching

### 8.4 Scoring Integration

- [ ] Provenance-aware scoring implemented
- [ ] Authored prompts get trust boost
- [ ] Extracted prompts boost when source doc retrieved
- [ ] Generated prompts reduced until approved

### 8.5 Prompt Workshop

- [ ] Header shows "Exploration Nodes" in center
- [ ] Provenance filter available
- [ ] Cards show provenance badge
- [ ] Editor shows provenance section
- [ ] Source documents clickable (for extracted)

### 8.6 Data Quality

- [ ] Extracted prompts are molecularly independent
- [ ] No prompts assume prior context
- [ ] Each prompt is a valid standalone entry point
- [ ] Deduplication prevents exact matches

---

## 9. Out of Scope

- Prompt clustering by embedding similarity
- User-submitted prompts (future sprint)
- Full gap analysis with auto-generation
- Prompt A/B testing
- Multi-document prompt synthesis

---

## 10. Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PromptObject type | ✅ Exists | Extend with provenance |
| Prompt Workshop | ✅ Exists | Extend UI |
| Hybrid search SQL | ✅ Exists | Verify deployed |
| Document enrichment | ✅ Exists | Add extraction step |
| Gemini API | ✅ Available | For extraction |

---

## 11. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Extraction quality varies | High | Medium | Review workflow, confidence scores |
| Prompts not molecularly independent | Medium | High | Strict prompt engineering |
| Hybrid search not deployed | Low | High | Verify before integration |
| Performance with embedding matching | Low | Medium | Index prompts by document |

---

*Specification complete. Ready for ARCHITECTURE.md generation.*
