# Feature: Extraction-Time Enrichment Pipeline

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Verifying |
| **Status** | ✅ Implementation Complete |
| **Blocking Issues** | None |
| **Last Updated** | 2025-01-06T20:15:00Z |
| **Next Action** | Restart server and test bulk extraction |
| **Attention Anchor** | We're adding AI polish at extraction time, not building runtime refinement |

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** An AI-powered polish step that enriches prompts during extraction
- **Success looks like:** Extracted prompts land ready-to-use, not ready-to-fix
- **We are NOT:** Building runtime `/refine` commands (that's edge-case, not primary)
- **Current phase:** Planning
- **Next action:** Review pattern check, approve, implement

---

## Pattern Check (Abbreviated)

| Requirement | Existing Pattern? | Extension Approach |
|-------------|-------------------|-------------------|
| AI-powered content enrichment | `/api/prompts/:id/suggest-*` pattern | Extend to polish step during extraction |
| Prompt quality fields | `QAIssue` types in schema | Use same taxonomy (missing_context, etc.) |
| Source context access | Knowledge module + provenance | Already available at extraction time |
| Prompt storage | Supabase via GroveObject | No change needed |

**Existing pattern to extend:** The `suggest-titles` / `suggest-targeting` API pattern we just built.

**Canonical home for this feature:** `server.js` bulk extraction pipeline (lines 3324-3520).

---

## Goal

Add an AI-powered "polish" step to the bulk extraction pipeline that enriches each extracted concept **before** it's saved to Supabase. This prevents QA issues at the source rather than fixing them downstream.

The polish step addresses all five QA issue types:
1. **missing_context** — Adds background explaining what the concept means
2. **ambiguous_intent** — Clarifies the exploration goal
3. **too_broad** — Calibrates scope to be focused
4. **too_narrow** — Expands scope if overly specific
5. **source_mismatch** — Grounds in the actual source passage

## Non-Goals

- ~~Building runtime `/refine` command~~ — That's edge-case iteration, not primary quality mechanism
- ~~Modifying the extraction prompt~~ — Extract raw, polish after (separation of concerns)
- ~~Human-in-the-loop during extraction~~ — Polish is automatic; review queue handles human judgment
- ~~New QA issue types~~ — Use existing taxonomy

## Acceptance Criteria

- [ ] Extracted prompts have enriched `executionPrompt` with context baked in
- [ ] Extracted prompts have `userIntent` field populated
- [ ] Extracted prompts have `conceptAngle` field populated
- [ ] Extracted prompts have `suggestedFollowups` populated (2-3 questions)
- [ ] Review queue shows "ready to validate" prompts, not "ready to fix"
- [ ] Polish step uses source document content (available at extraction time)
- [ ] Existing extraction confidence filtering still applies

---

## Implementation Notes

### Current Pipeline (Before)

```
Source Document
       ↓
[Extract Concepts] ← Claude extracts raw concepts (userQuestion, systemGuidance)
       ↓
[Rule-based Targeting] ← inferTargetingFromSalience()
       ↓
Save to Supabase (raw prompts)
       ↓
Review Queue → Manual refinement needed
```

### Proposed Pipeline (After)

```
Source Document
       ↓
[Extract Concepts] ← Claude extracts raw concepts (unchanged)
       ↓
[AI Polish Step] ← NEW: Claude enriches each concept
       │
       ├── Expand executionPrompt with context
       ├── Set userIntent (what they really want to know)
       ├── Set conceptAngle (how to frame the response)
       ├── Generate suggestedFollowups
       └── Validate against source passage
       ↓
[AI-Powered Targeting] ← suggest-targeting pattern (already built)
       ↓
Save to Supabase (polished prompts)
       ↓
Review Queue → Validation, not rehabilitation
```

### Key Design Decisions

1. **Two-Pass Extraction**: Extract raw first (quantity), then polish (quality). This lets us parallelize extraction across documents while polishing sequentially.

2. **Source Context Available**: At extraction time, we have `doc.content` loaded. The polish step gets full source document + `sourcePassage` from extraction.

3. **Batch Efficiency**: Polish multiple concepts in one API call per document (not per concept).

4. **Graceful Degradation**: If polish API fails, save raw concept anyway (better to have something than nothing).

### API Shape

```javascript
// New helper function
async function polishExtractedConcepts(concepts, sourceDocument) {
  // Call Claude with:
  // - Source document content (first 5000 chars)
  // - Array of raw extracted concepts
  // - Grove context (stages, lenses, what makes good prompts)

  // Returns:
  // - Enriched concepts with:
  //   - executionPrompt (expanded with context)
  //   - userIntent
  //   - conceptAngle
  //   - suggestedFollowups
  //   - polishReasoning (for provenance)
}
```

### Integration Point

In `server.js` `/api/prompts/extract-bulk` (line ~3434):

```javascript
// After: const filteredConcepts = concepts.filter(...)
// Before: const promptRows = filteredConcepts.map(...)

// NEW: Polish step
const polishedConcepts = await polishExtractedConcepts(filteredConcepts, doc);
```

---

## DEX Compliance

- **Declarative Sovereignty**: Polish rules could eventually move to config (prompt templates)
- **Capability Agnosticism**: Works regardless of which Claude model polishes
- **Provenance**: `polishReasoning` stored in provenance chain
- **Organic Scalability**: Same pattern extends to new enrichment types

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API costs increase | Batch concepts per document, use Haiku for polish |
| Extraction time increases | Acceptable tradeoff for quality; parallelize docs |
| Polish alters meaning | Include `sourcePassage` for grounding, store original |
| API failure loses data | Graceful degradation: save raw if polish fails |

---

## Sprint: extraction-enrichment-v1

**Tier:** Feature (1-4 hours)
**Artifacts:** SPEC.md (this file), DEVLOG.md
