# S22-WP: Structured Output Architecture Notes
**Date:** 2025-01-24
**Status:** In Progress
**Compaction Protection:** CRITICAL - Read this file on resume

## What We Did

### Problem
The research endpoint `/api/research/deep` was using **regex preprocessing** to clean Claude's output - stripping preambles, inline thinking, endnote cruft. User feedback: "regex is stupidly brittle."

### Solution: Structured Output via Tool Use
Replaced regex with **API-enforced structure** using Claude's tool_use pattern.

**Added to `server.js` (~line 2549):**
```javascript
const deliverResearchResultsTool = {
  name: 'deliver_research_results',
  description: 'Deliver the final research findings in a structured format...',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      executive_summary: { type: 'string' },
      sections: { type: 'array', items: { heading, content, citation_indices } },
      key_findings: { type: 'array', items: { type: 'string' } },
      confidence_assessment: { level, score, rationale },
      limitations: { type: 'array' },
      sources: { type: 'array', items: { index, title, url, domain, credibility, snippet } }
    },
    required: ['title', 'executive_summary', 'sections', 'key_findings', 'sources']
  }
}
```

**API call updated:**
```javascript
tools: [
  { type: 'web_search_20250305', name: 'web_search', max_uses: 15 },
  deliverResearchResultsTool,
],
tool_choice: { type: 'any' },  // Forces model to eventually call our tool
```

**Response parsing:** Look for `tool_use` block with `name === 'deliver_research_results'`, extract `block.input` as structured data.

## USER FEEDBACK (CRITICAL)
> "we want to capture and cache 100% of what is returned from the deep research as a canonical object... not a subset. the refinement step is where we consolidate research into knowledge."

### Architectural Implication
Current code transforms structured output into both:
1. New structured fields (`title`, `sections`, etc.)
2. Legacy compatibility fields (`summary`, `findings`)

But user wants:
- **STORE the canonical structured object** as-is
- Don't transform into subsets
- Refinement/consolidation is a SEPARATE step (Writer agent)

### What Needs to Change
1. **Backend response:** Return the FULL `deliver_research_results` input as `structuredResearch` field
2. **Sprout schema:** Add `structuredResearch` field to store canonical output
3. **Frontend:** Read from `structuredResearch`, not transformed subsets

## Files Modified

### server.js (lines ~2539-2760)
- Added `deliverResearchResultsTool` schema
- Updated API call with tool
- Replaced ~150 lines regex with ~80 lines tool_use parsing
- Returns both structured + legacy fields

### Files NOT Modified Yet
- `src/core/schema/sprout.ts` - Need to add `structuredResearch` field
- Frontend transforms - Should read from canonical object

## Completed Steps
1. ✅ Verify test request works - **WORKING**
   - Backend logs: `Canonical research captured: title: 'NVIDIA Vera Rubin Platform 2025...'`
   - `sectionCount: 5, sourceCount: 19, findingCount: 5`

2. ✅ Add `canonicalResearch` field to Sprout schema - **DONE**
   - Added `CanonicalResearch` type with full structured output shape
   - Added `CanonicalSource`, `CanonicalSection`, `CanonicalConfidence` types
   - Added `canonicalResearch?: CanonicalResearch` to `Sprout` interface
   - Marked legacy `researchBranches`, `researchEvidence`, `researchSynthesis` as deprecated
   - Build passes with new types

3. ✅ Add `canonicalResearch` to ResearchSprout schema - **DONE**
   - Added import for `CanonicalResearch` from `sprout.ts`
   - Added `canonicalResearch?: CanonicalResearch` field to `ResearchSprout` interface
   - Documents DEX Pillar III: Provenance as Infrastructure

4. ✅ Wire data flow through pipeline - **DONE**
   - `research-agent.ts`: Captures `canonicalResearch` from API response
   - `research-pipeline.ts`: Passes through to `PipelineResult`
   - `ResearchExecutionContext.tsx`: Saves to sprout via `updateResults`
   - Build passes with all changes

5. ✅ Add Supabase persistence mapping - **DONE**
   - `ResearchSproutContext.tsx`:
     - `rowToSprout()`: Maps `canonical_research` → `canonicalResearch`
     - `sproutToRow()`: Maps `canonicalResearch` → `canonical_research`
     - `updateResults()`: Updated signature to include `canonicalResearch`
   - Build passes

6. ✅ Add Supabase migration for `canonical_research` column - **DONE**
   - Created `035_add_canonical_research_column.sql`
   - JSONB column for 100% lossless storage
   - Indexes for title and confidence level queries
   - Comment documenting DEX Pillar III compliance

## Completed Steps (All Done!)
7. ✅ Update DocumentViewer/evidence-transform to READ from `canonicalResearch` for display - **DONE**
   - `evidence-transform.ts`: Added `hasCanonicalResearch()` helper and three canonical transform functions:
     - `canonicalSummaryToRenderTree()` - Summary tab
     - `canonicalFullReportToRenderTree()` - Full Report tab
     - `canonicalSourcesToRenderTree()` - Sources tab
   - Updated existing `sproutSynthesisToRenderTree()`, `sproutFullReportToRenderTree()`, `sproutSourcesToRenderTree()` to prefer canonicalResearch when available
   - `evidence-catalog.ts`: Added `ConfidenceNoteSchema` and `LimitationsListSchema`
   - `evidence-registry.tsx`: Added `ConfidenceNote` and `LimitationsList` React components
   - `DocumentViewer.tsx`: Added `hasCanonicalResearch` check for display prioritization
   - Build passes with all changes

## Data Flow
```
User Query
    ↓
/api/research/deep (server.js)
    ↓
Claude API with web_search + deliver_research_results tools
    ↓
Claude returns tool_use block with structured JSON
    ↓
Store FULL structured object (canonical)  ← USER WANTS THIS
    ↓
Display via json-render EvidenceRegistry
    ↓
User triggers Writer (refinement step)
    ↓
Writer consolidates into knowledge
```

## Key User Quotes
- "regex is stupidly brittle" → why we changed to structured output
- "now we're talking" → approved tool_use approach
- "capture 100% of what is returned" → don't subset the canonical object
