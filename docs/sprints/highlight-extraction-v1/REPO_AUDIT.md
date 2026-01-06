# Repository Audit — highlight-extraction-v1

## Audit Date: 2026-01-05

## Current State Summary

The extraction pipeline from exploration-node-unification-v1 is operational, generating PromptObjects with provenance tracking from RAG documents. However, the pipeline doesn't produce highlight-ready prompts—it lacks concept detection, `highlightTriggers` population, and highlight-optimized `executionPrompt` generation.

Meanwhile, kinetic-highlights-v1 is complete with 6 hand-authored backing prompts demonstrating the target quality. The lookup system (`findPromptForHighlight`) works but has minimal coverage. This sprint closes the gap by auto-generating highlight prompts at scale.

## File Structure Analysis

### Key Files — Extraction Pipeline

| File | Purpose | Lines |
|------|---------|-------|
| `src/core/extraction/documentExtractor.ts` | Main extraction pipeline | ~200 |
| `src/core/context-fields/types.ts` | PromptObject, PromptProvenance, HighlightTrigger types | ~340 |
| `src/core/context-fields/lookup.ts` | findPromptForHighlight() function | ~80 |
| `src/data/prompts/highlights.prompts.json` | 6 seed highlight prompts | 244 |
| `src/data/prompts/index.ts` | Prompt library loader | ~55 |

### Key Files — Prompt Workshop (Review UI)

| File | Purpose | Lines |
|------|---------|-------|
| `src/bedrock/consoles/PromptWorkshop/index.tsx` | Main console component | ~300 |
| `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` | Individual prompt display | ~150 |
| `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx` | Filter controls | ~100 |

### Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `@google/generative-ai` | Gemini API for extraction | ^0.21.0 |
| `@supabase/supabase-js` | Vector embeddings | ^2.x |

## Architecture Assessment

### DEX Compliance

| Area | Status | Notes |
|------|--------|-------|
| Declarative config | ✅ | Prompts are JSON; surfaces/triggers in schema |
| Capability agnostic | ✅ | Extraction works with Gemini, Claude, or future models |
| Single source of truth | ✅ | PromptObject extended, not duplicated |
| Provenance tracking | ✅ | Full lineage via PromptProvenance |

### What Works Well

1. **PromptObject extended cleanly** — `surfaces`, `highlightTriggers` added without breaking existing prompts
2. **Provenance infrastructure** — `type`, `reviewStatus`, `sourceDocIds` all in place
3. **Lookup function** — `findPromptForHighlight()` ready to consume extracted prompts
4. **Review UI** — Prompt Workshop shows provenance badges, has filter infrastructure

### Gaps Found

1. **No concept detection** — Pipeline doesn't identify highlightable terms
2. **No highlight-specific generation** — `extractPromptsFromDocument()` doesn't populate `highlightTriggers`
3. **No Grove-specificity scoring** — Can't distinguish "distributed ownership" from "the"
4. **No surface filter in Workshop** — Can filter by provenance but not by surface
5. **No trigger display** — Workshop doesn't show `highlightTriggers` for review
6. **No merge logic** — Same concept from multiple docs creates duplicates

### Violations Found

None. Existing code is DEX-compliant.

## Test Coverage Assessment

### Current Test State

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 3 | ~15 | Prompt scoring, type guards |
| Integration | 1 | ~5 | Extraction API |
| E2E | 2 | ~10 | Prompt Workshop basic flows |

### Test Gaps

- No tests for concept detection (doesn't exist yet)
- No tests for highlight prompt generation (doesn't exist yet)
- No tests for trigger deduplication (doesn't exist yet)
- Workshop E2E doesn't test surface filter (doesn't exist yet)

## Technical Debt

1. **highlights.prompts.json coverage** — Only 6 prompts; need 20+ for core concepts
   - **Note:** This is an open issue to address separately via batch authoring or extraction validation

2. **No confidence calibration** — 0.7 threshold is a guess; need validation data

3. **No Grove concept registry** — Core terms scattered, no canonical source

## Risk Assessment

| Area | Current Risk | Notes |
|------|--------------|-------|
| Extraction quality | Medium | Confidence threshold + review gate mitigates |
| False positives (noise) | Medium | Grove-specificity scoring addresses |
| Review bottleneck | Low | Bulk actions + confidence sorting |
| Type safety | Low | PromptObject already extended |

## Recommendations

1. **Create `groveCoreConcepts.json`** — Canonical registry of Grove-specific terms
2. **Implement concept detection first** — Foundation for highlight generation
3. **Follow Emily Short template** — context → confusion → question pattern
4. **Add `extractionMethod` to provenance** — Distinguish highlight extraction from general extraction
5. **Surface filter in Workshop** — Essential for reviewing highlight prompts specifically
6. **Formal acceptance test** — Extract from `Exploration_Architecture_Validates_Itself.md`

## Open Issues

### highlights.prompts.json Coverage Expansion

**Status:** Deferred to post-sprint batch authoring
**Current:** 6 seed prompts
**Target:** 20+ core concept prompts
**Approach:** Either batch-author in dedicated session, or validate extraction quality first then use extraction to fill gaps
