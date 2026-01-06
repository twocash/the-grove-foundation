# Sprint Plan: highlight-extraction-v1

**Status:** PLANNING  
**Author:** Grove Foundation  
**Date:** January 5, 2026  
**Depends On:** exploration-node-unification-v1 ✅, kinetic-highlights-v1 (in progress)

---

## Executive Summary

Extend the extraction pipeline to auto-generate backing prompts for kinetic highlights. When a document enters the RAG system, the pipeline identifies highlightable concepts and generates rich backing prompts — completing the recursive loop where Grove's documentation teaches the system to guide exploration of Grove's concepts.

---

## Problem Statement

### Current State
- Kinetic highlights exist but use raw surface text → generic LLM responses
- kinetic-highlights-v1 adds lookup for backing prompts, but prompts must be hand-authored
- 6 seed prompts exist; Grove documentation mentions 50+ concepts
- Manual authoring doesn't scale; extraction pipeline exists but doesn't output highlight-ready prompts

### Gap
The extraction pipeline from exploration-node-unification-v1 generates `PromptObject` with provenance, but:
1. Doesn't populate `highlightTriggers` field
2. Doesn't set `surfaces: ['highlight']`
3. Doesn't optimize `executionPrompt` for the "clicked concept" use case
4. No concept-detection pass to identify highlightable terms

### Desired State
```
Document enters RAG
  → Concept detection identifies key terms ("distributed ownership", "credit economy", etc.)
  → For each concept: generate backing prompt with:
      - highlightTriggers: [{ text: "distributed ownership", matchMode: "exact" }]
      - surfaces: ["highlight", "suggestion"]
      - executionPrompt optimized for "user clicked this, help them understand"
      - provenance: { type: "extracted", reviewStatus: "pending" }
  → Prompts appear in Prompt Workshop for review
  → Approved prompts automatically serve highlight clicks
```

---

## Strategic Alignment

### DEX-Trellis Compliance

| Principle | How This Sprint Delivers |
|-----------|-------------------------|
| **Declarative sovereignty** | Extracted prompts are JSON; reviewers approve without code changes |
| **Capability agnosticism** | Extraction works with Gemini, Claude, or future models |
| **Provenance as infrastructure** | Full lineage: source doc → extraction model → reviewer → production |
| **Organic scalability** | Start with core docs, expand to all RAG content automatically |

### Exploration Architecture Validation

This sprint proves the thesis recursively:
- Grove docs explain exploration architecture
- Extraction pipeline applies exploration architecture to those docs
- Generated prompts enable guided exploration of exploration architecture
- The system teaches itself to teach

### Advisory Council Alignment

| Advisor | Relevance | Guidance |
|---------|-----------|----------|
| **Park (10)** | Extraction quality depends on prompt engineering | Use structured output, validate against schema |
| **Short (8)** | Backing prompts need craft | Template: context → confusion → question |
| **Adams (8)** | Concepts should have "hooks" | Prioritize emotionally resonant terms |
| **Asparouhova (7)** | Review workflow = governance | Clear approval criteria, not bottleneck |
| **Buterin (6)** | Sybil concern on "adopted by N" | Extraction confidence score gates review |

---

## Scope Decisions

### In Scope

1. **Concept Detection Pass**
   - Analyze document for highlightable concepts
   - Weight by: frequency, semantic importance, Grove-specificity
   - Output: ranked list of candidate terms

2. **Highlight Prompt Generation**
   - For each detected concept, generate backing prompt
   - Template: Emily Short's context → confusion → question pattern
   - Populate: `highlightTriggers`, `surfaces`, `executionPrompt`, `systemContext`

3. **Extraction Pipeline Extension**
   - Add `extractHighlightPrompts()` function
   - Integrate with existing `extractPromptsFromDocument()`
   - Respect same provenance and confidence scoring

4. **Review Workflow Enhancements**
   - Filter by `surfaces` in Prompt Workshop
   - Show `highlightTriggers` in prompt detail view
   - Bulk approve/reject for same-concept prompts

5. **Quality Gates**
   - Minimum confidence threshold for extraction (0.7)
   - Duplicate detection (same concept from multiple docs)
   - Merge logic for overlapping triggers

### Out of Scope (Future Sprints)

- **Telemetry on guided vs unguided** — Requires engagement tracking infrastructure
- **Auto-approval based on confidence** — Start with human review for quality baseline
- **Trigger suggestion UI** — For now, triggers come from extraction only
- **Semantic matching** — Stick with exact/contains; semantic is ADR-003 decision
- **Real-time extraction** — Batch process on document ingest

---

## Architecture Approach

### Concept Detection

```typescript
interface DetectedConcept {
  term: string;
  frequency: number;
  semanticWeight: number;      // From embedding similarity to Grove core concepts
  groveSpecificity: number;    // Is this a Grove term or general term?
  suggestedTriggers: HighlightTrigger[];
  confidence: number;
}

async function detectConcepts(
  document: RAGDocument,
  coreConceptEmbeddings: Map<string, number[]>
): Promise<DetectedConcept[]>
```

### Prompt Generation Template

```typescript
const HIGHLIGHT_PROMPT_TEMPLATE = `
You are generating a backing prompt for a clickable concept in educational content.

CONCEPT: {{concept}}
DOCUMENT CONTEXT: {{documentExcerpt}}
GROVE CONTEXT: {{groveDefinition}}

Generate a prompt that:
1. Acknowledges the user clicked this specific term
2. Expresses genuine curiosity or confusion (not "tell me about X")
3. Asks a specific question that the document context can answer
4. Uses conversational first-person voice

Format as JSON:
{
  "executionPrompt": "...",
  "systemContext": "...",
  "suggestedTriggers": [...]
}
`;
```

### Pipeline Integration

```
Existing Flow:
  Document → extractPromptsFromDocument() → PromptObject[]

Extended Flow:
  Document → detectConcepts() → DetectedConcept[]
          → generateHighlightPrompts(concepts) → PromptObject[]
          → merge with existing extraction
          → deduplicate by trigger overlap
          → return combined PromptObject[]
```

### Provenance Chain

```typescript
const highlightProvenance: PromptProvenance = {
  type: 'extracted',
  reviewStatus: 'pending',
  sourceDocIds: [docId],
  sourceDocTitles: [docTitle],
  extractedAt: Date.now(),
  extractionModel: 'gemini-2.0-flash',
  extractionConfidence: concept.confidence,
  // New field for highlight extraction
  extractionMethod: 'highlight-concept-detection',
};
```

---

## Technical Approach

### New Files

| File | Purpose |
|------|---------|
| `src/core/extraction/conceptDetection.ts` | Detect highlightable concepts in documents |
| `src/core/extraction/highlightPromptGenerator.ts` | Generate backing prompts from concepts |
| `src/core/extraction/triggerMerge.ts` | Deduplicate and merge overlapping triggers |

### Modified Files

| File | Changes |
|------|---------|
| `src/core/extraction/documentExtractor.ts` | Integrate highlight extraction into pipeline |
| `src/core/context-fields/types.ts` | Add `extractionMethod` to PromptProvenance |
| `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` | Show highlight triggers |
| `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx` | Filter by surface type |
| `src/data/concepts/groveCoreConcepts.json` | Seed list of Grove-specific terms |

### Core Concepts Seed List

```json
{
  "concepts": [
    { "term": "distributed ownership", "category": "infrastructure", "priority": 1 },
    { "term": "hybrid architecture", "category": "architecture", "priority": 1 },
    { "term": "credit economy", "category": "economics", "priority": 1 },
    { "term": "efficiency tax", "category": "economics", "priority": 1 },
    { "term": "capability propagation", "category": "ratchet-thesis", "priority": 1 },
    { "term": "ratchet thesis", "category": "ratchet-thesis", "priority": 1 },
    { "term": "AI villages", "category": "vision", "priority": 1 },
    { "term": "knowledge commons", "category": "community", "priority": 2 },
    { "term": "epistemic independence", "category": "philosophy", "priority": 2 },
    { "term": "exploration architecture", "category": "architecture", "priority": 1 },
    { "term": "trellis architecture", "category": "architecture", "priority": 2 },
    { "term": "gardener", "category": "roles", "priority": 2 },
    { "term": "local inference", "category": "architecture", "priority": 2 },
    { "term": "pivotal moments", "category": "architecture", "priority": 2 },
    { "term": "agent diaries", "category": "engagement", "priority": 2 }
  ]
}
```

---

## Story Breakdown (Estimated)

### Epic 1: Concept Detection (8 pts)
| Story | Points | Description |
|-------|--------|-------------|
| 1.1 | 2 | Create `groveCoreConcepts.json` seed list |
| 1.2 | 3 | Implement `detectConcepts()` with frequency + embedding scoring |
| 1.3 | 2 | Add Grove-specificity scoring (is term in seed list?) |
| 1.4 | 1 | Unit tests for concept detection |

### Epic 2: Prompt Generation (8 pts)
| Story | Points | Description |
|-------|--------|-------------|
| 2.1 | 3 | Create `generateHighlightPrompt()` with Emily Short template |
| 2.2 | 2 | Generate `highlightTriggers` from detected concept |
| 2.3 | 2 | Populate `surfaces: ['highlight', 'suggestion']` |
| 2.4 | 1 | Integration tests for generation |

### Epic 3: Pipeline Integration (5 pts)
| Story | Points | Description |
|-------|--------|-------------|
| 3.1 | 2 | Integrate into `extractPromptsFromDocument()` |
| 3.2 | 2 | Implement trigger deduplication/merge |
| 3.3 | 1 | Add `extractionMethod` to provenance |

### Epic 4: Review Workflow (5 pts)
| Story | Points | Description |
|-------|--------|-------------|
| 4.1 | 2 | Add surface filter to Prompt Workshop |
| 4.2 | 2 | Display `highlightTriggers` in prompt detail |
| 4.3 | 1 | Bulk actions for same-concept prompts |

### Epic 5: Quality & Validation (4 pts)
| Story | Points | Description |
|-------|--------|-------------|
| 5.1 | 2 | Confidence threshold gating (min 0.7) |
| 5.2 | 1 | Duplicate concept detection across docs |
| 5.3 | 1 | E2E test: doc → extraction → workshop → approval |

**Total: 30 story points (~3-4 days)**

---

## Success Criteria

### Functional
- [ ] Process a Grove document → generates 5+ highlight prompts
- [ ] Each prompt has valid `highlightTriggers` and `surfaces`
- [ ] Prompts appear in Prompt Workshop with "extracted" badge
- [ ] Approving prompt makes it available to highlight lookup
- [ ] Duplicate concepts merge rather than duplicate

### Quality
- [ ] Generated `executionPrompt` follows context → confusion → question pattern
- [ ] Confidence scores correlate with human review decisions
- [ ] No false positives on generic terms ("the", "system", "data")

### Recursive Validation
- [ ] Extract prompts from `Exploration_Architecture_Validates_Itself.md`
- [ ] Those prompts help users understand exploration architecture
- [ ] The loop is demonstrably closed

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Extraction generates low-quality prompts | Medium | High | Confidence threshold + human review gate |
| Too many concepts detected (noise) | Medium | Medium | Grove-specificity scoring prioritizes core terms |
| Trigger collisions across prompts | Low | Medium | Merge logic picks highest-confidence source |
| Review bottleneck | Medium | Medium | Bulk actions, clear criteria, confidence pre-sorting |

---

## Dependencies

### Must Complete First
- [x] exploration-node-unification-v1 — Extraction pipeline, provenance types
- [ ] kinetic-highlights-v1 — Lookup function, `highlightTriggers` type, surface types

### Parallel Safe
- Diary system sprints (no overlap)
- Terminal UI sprints (no overlap)

---

## Open Questions for Review

1. **Confidence threshold:** 0.7 feels right, but should we start higher (0.8) and lower as we tune?

2. **Merge strategy:** When same concept extracted from multiple docs, keep all (with different contexts) or merge to single prompt with richest context?

3. **Priority concepts:** Should seed list concepts bypass confidence threshold? They're "known good" terms.

4. **Auto-suggestion:** Should we suggest triggers for hand-authored prompts that don't have them?

5. **Recursion test:** Should extracting from `Exploration_Architecture_Validates_Itself.md` be a formal acceptance test?

---

## Next Steps

1. **Review this plan** — Adjust scope, resolve open questions
2. **Generate Foundation Loop artifacts** — REPO_AUDIT through DEVLOG
3. **Execute after kinetic-highlights-v1** — Needs lookup function first
4. **Seed with core docs** — White paper, architecture docs, insight docs

---

*This sprint closes the recursive loop. The system learns to guide exploration by exploring its own documentation.*
