# DEVLOG: extraction-enrichment-v1

## 2025-01-06 20:00 — Sprint Started

**Status:** 🟡 Planning

### Context

User insight: Runtime refinement (clicking "Refine" per-prompt) is low-impact. At extraction time, we have:
- Full source document loaded
- Extraction reasoning fresh
- Direct provenance
- Maximum context availability

By the time someone clicks "Refine" in the UI, most context is lost.

### Decision

Pivot from building runtime `/refine` commands to building extraction-time enrichment.

**Before:** Extract raw → Save → Review → Fix manually
**After:** Extract raw → Polish (AI) → Save → Review → Validate

### Artifacts Created

- [x] SPEC.md with Live Status + Attention Anchor
- [x] DEVLOG.md (this file)

### Pattern Check

Extending existing patterns:
- `/api/prompts/:id/suggest-*` pattern for AI-powered suggestions
- `QAIssue` taxonomy for issue types
- Knowledge module for source context
- GroveObject + Supabase for storage

No new patterns required.

### Awaiting

User approval of SPEC.md before implementation.

---

## Implementation Notes (Pre-Implementation)

### Files to Modify

1. `server.js` — Add `polishExtractedConcepts()` function and integrate into bulk extraction

### Key Changes

```javascript
// After line ~3434 in extract-bulk endpoint:
// const filteredConcepts = concepts.filter(c => (c.confidence || 0) >= 0.6);

// Insert polish step here:
const polishedConcepts = await polishExtractedConcepts(filteredConcepts, doc);

// Then continue with:
// const promptRows = polishedConcepts.map(concept => { ... });
```

### Polish Prompt Design

The polish prompt needs to:
1. Receive source document context
2. Receive raw extracted concepts
3. Return enriched concepts with:
   - `executionPrompt` (expanded with background)
   - `userIntent` (what user really wants)
   - `conceptAngle` (how to frame response)
   - `suggestedFollowups` (2-3 questions)
   - `polishReasoning` (provenance)

### Testing

Manual testing via Foundation Prompt Workshop:
1. Run bulk extraction on a test document
2. Verify prompts in review queue have enriched fields
3. Compare before/after quality

---

## 2025-01-06 20:15 — Implementation Complete

**Status:** ✅ Implementation done, ready for testing

### Changes Made

**1. Added `polishExtractedConcepts()` function** (server.js:3238-3401)
- Takes raw extracted concepts + source document
- Calls Claude Haiku with enrichment prompt
- Returns concepts with enriched fields:
  - `executionPrompt` (expanded with context)
  - `userIntent` (what user really wants)
  - `conceptAngle` (how to frame response)
  - `suggestedFollowups` (2-3 questions)
  - `polishReasoning` (provenance)
  - `polishedAt` (timestamp)

**2. Integrated into bulk extraction** (server.js:3603-3605)
```javascript
// Sprint: extraction-enrichment-v1 - Polish concepts before saving
const polishedConcepts = await polishExtractedConcepts(filteredConcepts, doc);
```

**3. Updated payload structure** (server.js:3653-3665)
- Added polish provenance fields to `provenance` object
- Added enriched fields to payload root

**4. Updated results tracking** (server.js:3694-3707)
- Changed to use `polishedConcepts`
- Added `polished: boolean` flag to concept details

### Key Design Choices

| Choice | Rationale |
|--------|-----------|
| Haiku for polish | Cost-effective, fast enough |
| 6000 char doc limit | Balance context vs tokens |
| Graceful degradation | Returns raw if polish fails |
| Batch per document | One polish call per doc, not per concept |

### Testing

Restart server and run bulk extraction:
1. Go to Foundation → Pipeline Monitor
2. Select a document with unextracted content
3. Run extraction
4. Check prompts in Review Queue
5. Verify enriched fields are populated

---

## 2025-01-06 20:45 — Unified Enrichment (Title + Targeting)

**Status:** ✅ Enhanced based on user feedback

### Problem Identified

First test revealed:
- Titles were generic ("The Ratchet") - not compelling
- Stages weren't being set by AI
- Lens affinities weren't being set by AI
- `/make-compelling` runtime command shouldn't be needed if extraction is good

### Solution: Unified Upstream Enrichment

Updated `polishExtractedConcepts()` to handle EVERYTHING in one pass:

| Field | Before | After |
|-------|--------|-------|
| Title | Raw concept phrase | AI-generated compelling title |
| Stages | Rule-based inference | AI-analyzed from content |
| Lens Affinities | Rule-based inference | AI-analyzed with weights |
| Execution Prompt | Raw user question | Enriched with context |

### Changes Made

**1. Enhanced polish prompt** (server.js:3267-3364)
- Added stage definitions to prompt
- Added lens definitions to prompt
- Request `title`, `stages`, `lensAffinities` in output

**2. Updated merge logic** (server.js:3406-3429)
- Set `label` from `polished.title`
- Set `targetStages` from `polished.stages`
- Set `polishedLensAffinities` from `polished.lensAffinities`

**3. Updated payload builder** (server.js:3655-3687)
- Prefer AI-polished stages over rule-based
- Prefer AI-polished lens affinities over rule-based
- Set `targeting.lensIds` for filtering

**4. Added `ai-polished` tag** (server.js:3722-3727)
- Easy identification of enriched prompts

### Key Insight

> "All of this should happen upstream at extraction time"

Runtime commands like `/make-compelling` and `/suggest-targeting` become edge-case iteration tools, not primary quality mechanisms. The extraction pipeline is now the single source of quality.

---

## Punchlist: What's Next

### Immediate (Test & Validate)
- [ ] Restart server and test with one document
- [ ] Verify titles are compelling (not raw concepts)
- [ ] Verify stages are populated
- [ ] Verify lens affinities are populated
- [ ] Verify `ai-polished` tag appears

### Short-term (Polish the Polish)
- [ ] Review quality of AI-generated titles (may need prompt tuning)
- [ ] Consider using Sonnet instead of Haiku for better quality
- [ ] Add Grove overview context to polish prompt (like suggest-titles has)
- [ ] Handle edge cases: very short docs, non-English content

### Medium-term (Pipeline Improvements)
- [ ] Batch multiple documents efficiently (parallelize extraction, sequential polish)
- [ ] Add progress reporting for bulk extraction
- [ ] Consider streaming response for long extractions
- [ ] Add ability to re-polish existing prompts

### Cleanup (Technical Debt)
- [ ] Runtime `/make-compelling` and `/suggest-targeting` - keep as edge-case tools or deprecate?
- [ ] Remove or simplify rule-based `inferTargetingFromSalience` (now just fallback)
- [ ] Update SPEC.md acceptance criteria with new fields

---
