# Specification — highlight-extraction-v1

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0: Planning |
| **Status** | 🟡 Planning Complete — Ready for Execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-05T23:30:00Z |
| **Next Action** | Execute Epic 1: Core Concept Registry |
| **Attention Anchor** | Extract highlight prompts from Grove docs to close the recursive loop |

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Auto-extraction of backing prompts for kinetic highlights from Grove documentation
- **Success looks like:** Process a Grove doc → generates 5+ highlight prompts with valid triggers → appears in Workshop for review → approved prompts serve highlight clicks
- **We are NOT:** Building semantic matching, auto-approval, or real-time extraction
- **Current phase:** Planning
- **Next action:** Create groveCoreConcepts.json registry

---

## Overview

Extend the extraction pipeline to auto-generate backing prompts for kinetic highlights. When a document enters the RAG system, the pipeline detects highlightable concepts (Grove-specific terms) and generates rich backing prompts following the Emily Short pattern (context → confusion → question). This closes the recursive loop: Grove documentation teaches the system to guide exploration of Grove concepts.

## Patterns Extended (MANDATORY)

**Per PROJECT_PATTERNS.md Phase 0 requirements:**

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Prompt extraction | `extractPromptsFromDocument()` | Add concept detection pass + highlight generation |
| Provenance tracking | `PromptProvenance` type | Add `extractionMethod: 'highlight-concept-detection'` |
| Review workflow | Prompt Workshop filters | Add surface filter, trigger display |
| Multi-surface prompts | `surfaces`, `highlightTriggers` | Populate during extraction |

### New Patterns Proposed

None required. All needs met by extending existing patterns.

---

## Goals

1. **Auto-detect highlightable concepts** in Grove documents with confidence scoring
2. **Generate backing prompts** optimized for the "user clicked this concept" use case
3. **Populate highlight metadata** (`highlightTriggers`, `surfaces`) during extraction
4. **Enable review workflow** with surface filtering and trigger visibility
5. **Close the recursive loop** — Grove docs generate prompts that teach Grove concepts

## Non-Goals

- **Semantic matching** — Stick with exact/contains per ADR-003 from kinetic-highlights-v1
- **Auto-approval** — All extracted prompts require human review
- **Real-time extraction** — Batch process on document ingest
- **Telemetry on guided vs unguided** — Requires engagement tracking (future sprint)
- **Trigger suggestion for existing prompts** — Deferred to future enhancement

## Success Criteria

After this sprint:

1. Processing `Exploration_Architecture_Validates_Itself.md` generates 5+ highlight prompts
2. Each extracted prompt has valid `highlightTriggers` and `surfaces: ['highlight', 'suggestion']`
3. Prompts appear in Workshop with "extracted" badge and pending review status
4. Approving a prompt makes it available to `findPromptForHighlight()` lookup
5. Duplicate concepts merge or rank by confidence rather than duplicating

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: `detectConcepts()` identifies Grove-specific terms with confidence scores
- [ ] AC-2: `generateHighlightPrompt()` produces Emily Short pattern prompts
- [ ] AC-3: Extracted prompts have `provenance.extractionMethod: 'highlight-concept-detection'`
- [ ] AC-4: Workshop shows surface filter dropdown
- [ ] AC-5: Workshop displays `highlightTriggers` in prompt detail view
- [ ] AC-6: Confidence threshold (0.7) is configurable via `EXTRACTION_CONFIG`
- [ ] AC-7: Same concept from multiple docs ranks by recency, not duplicates

### Test Requirements (MANDATORY)

- [ ] AC-T1: Unit tests for `detectConcepts()` with mock documents
- [ ] AC-T2: Unit tests for `generateHighlightPrompt()` output validation
- [ ] AC-T3: Integration test: doc → extraction → prompt with triggers
- [ ] AC-T4: E2E test: extracted prompt appears in Workshop with correct filters
- [ ] AC-T5: All tests pass: `npm test && npx playwright test`

### DEX Compliance

- [ ] AC-D1: Confidence threshold in config, not hardcoded
- [ ] AC-D2: Core concepts in JSON registry, not code
- [ ] AC-D3: Generation template is declarative, not procedural
- [ ] AC-D4: No new `handle*` callbacks

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `@google/generative-ai` | Gemini API for generation | existing |
| `@supabase/supabase-js` | Vector embeddings (optional) | existing |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low-quality extracted prompts | Medium | High | Confidence threshold + human review |
| Too many concepts detected | Medium | Medium | Grove-specificity scoring prioritizes core terms |
| Trigger collisions | Low | Medium | Merge logic picks highest-confidence source |
| Review bottleneck | Medium | Low | Bulk actions, confidence pre-sorting |

## Out of Scope

- Semantic trigger matching (future)
- Auto-approval based on confidence (future)
- Trigger suggestion for hand-authored prompts (future)
- Real-time extraction during conversation (future)
- Expanding highlights.prompts.json manually (separate effort)

---

## Configuration (DEX-Compliant)

```typescript
// src/core/extraction/config.ts
export const EXTRACTION_CONFIG = {
  highlight: {
    /** Minimum confidence to extract highlight prompt */
    confidenceThreshold: 0.7,  // Mutable per DEX
    
    /** Boost for terms in core concepts registry */
    coreConceptBoost: 0.2,
    
    /** Maximum concepts to extract per document */
    maxConceptsPerDoc: 15,
    
    /** Minimum term length to consider */
    minTermLength: 3,
  }
};
```

This configuration is declarative and mutable without code changes.
