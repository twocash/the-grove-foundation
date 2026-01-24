# S21-RL Sprint Closure: Research Template Wiring

**Sprint:** research-template-wiring-v1
**Alias:** S21-RL
**Status:** PARTIAL COMPLETE - FEATURE BRANCH ONLY
**Branch:** feat/research-template-wiring-v1
**Date:** 2026-01-23

---

## Executive Summary

This sprint achieved the **core goal** of wiring the research pipeline to return real Claude
web search results with proper citations. However, the **display layer is broken** and requires
a follow-up sprint (S22-WP) to fix before merging to main.

**DO NOT MERGE TO MAIN** - The feature branch contains working pipeline mechanics but
malformed UI display. GitHub Actions will deploy broken UI if merged.

---

## What Works (Pipeline Guts)

### 1. Claude Web Search Integration

The `/api/research/deep` endpoint correctly:
- Calls Claude with `web_search_20250305` tool
- Returns 5,000-8,400 characters of prose content
- Preserves 27-38 inline citations
- Collects 30 real web search results with URLs

**Evidence:**
```
[Research Deep] Text length: 8423 Citations: 29 Search results: 30
[Research Deep] Sample search results: [
  { "url": "https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform...",
    "title": "Inside the NVIDIA Rubin Platform...", "page_age": "1 day ago" }
]
```

### 2. Template Loading Chain

Templates flow from seed files to API:
```
data/seeds/output-templates.json
    → src/explore/services/template-loader.ts
    → research-pipeline.ts (loadResearchTemplate)
    → research-agent.ts (systemPrompt option)
    → server.js /api/research/deep
```

### 3. Content Preservation

Full research content now preserved through pipeline:
- `research-pipeline.ts:142` no longer truncates to 500 chars
- Writer agent pass-through mode triggers on >3000 chars
- Full web search results reach the UI

---

## What's Broken (Display Layer)

### 1. Results Rendering is Malformed

The Sprout Finishing Room center panel shows research results, but:
- Markdown headers visible but not styled
- Layout cramped and not following design
- Content structure unclear

**Screenshot:** `docs/sprints/research-template-wiring-v1/screenshots/prose-results.png`

### 2. json-render Pattern Disruption

The hackathon to get results displaying likely broke:
- Catalog → Registry → Transform pattern
- Proper Zod schemas for display
- Component separation

### 3. Pass-Through Mode is a Hack

`writer-agent.ts` has emergency logic:
```typescript
if (allEvidenceContent.length > 3000 || isWebSearchEvidence) {
  // Pass through directly without transformation
}
```

This bypasses proper document generation. S22-WP must replace with proper architecture.

---

## Bugs Fixed This Sprint

### Bug 1: Content Truncation (CRITICAL)

**File:** `src/explore/services/research-pipeline.ts:142`

**Before:**
```typescript
snippet: ev.content.slice(0, 500), // Truncate for snippet
```

**After:**
```typescript
snippet: ev.content, // Full content - writer handles formatting
```

**Impact:** 8,000+ char research was being destroyed to 500 chars.

### Bug 2: URL Parsing Exceptions

**File:** `src/explore/services/writer-agent.ts`

**Before:** Direct `new URL()` calls on source identifiers like "claude-web-search"

**After:** Added `extractDomain()` helper with try-catch:
```typescript
function extractDomain(url: string | undefined): string {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname;
  } catch {
    return url.includes('.') ? url : 'claude-research';
  }
}
```

### Bug 3: JSON Output Format

**File:** `server.js:2498-2509`

**Before:**
```javascript
const userPrompt = `...
Format your response as JSON:
{ "findings": [...], "perspectives": [...] }`;
```

**After:**
```javascript
const userPrompt = `...
Provide your findings as a well-structured research summary in prose format (NOT JSON):
1. Start with a brief executive summary (2-3 sentences)
2. Present key findings with inline source citations [1], [2], etc.
...`;
```

---

## Files Changed

### Core Pipeline (SAFE)

| File | Lines | Change |
|------|-------|--------|
| `server.js` | 2182-2222 | Added /api/health/anthropic endpoint |
| `server.js` | 2498-2530 | Changed userPrompt from JSON to prose |
| `src/explore/services/research-pipeline.ts` | 33, 53-70, 80-90, 137-175, 395-416, 444-469 | Template provenance, full content preservation |
| `src/explore/services/writer-agent.ts` | 43-58, 63-79, 113, 272, 328 | extractDomain helper, WriterOptions |

### New Files

| File | Purpose |
|------|---------|
| `src/explore/services/template-loader.ts` | Loads Output Templates from seed data |
| `tests/e2e/research-template-wiring-workflow.spec.ts` | Playwright test for workflow |
| `docs/sprints/research-template-wiring-v1/screenshots/prose-results.png` | Evidence screenshot |

### Risk Assessment

| File | Risk | Reason |
|------|------|--------|
| `src/surface/components/modals/SproutFinishingRoom/*` | MEDIUM | Unknown changes from compacted session |
| `src/explore/GardenInspector.tsx` | LOW-MEDIUM | Unknown changes |
| `package.json` / `package-lock.json` | LOW | Dependency updates |

---

## Next Sprint: S22-WP (Research Writer Panel)

**Location:** `docs/sprints/research-writer-panel-v1/PLAN.md`

**Purpose:** Fix the broken display and implement proper refinement workflow

### S22-WP Must Fix

1. **Writer Selector UI** - Grid of Writer template buttons in right panel
2. **Notes Textarea** - User input that merges with systemPrompt
3. **Generate Button** - Triggers Writer API correctly
4. **Save to Nursery** - Persists provisional insights
5. **Restore json-render** - If disrupted by hackathon
6. **Replace pass-through hack** - Proper document transformation

### S22-WP Success Criteria

- [ ] Results display is properly formatted
- [ ] json-render patterns restored
- [ ] Writer templates selectable
- [ ] Notes merge into systemPrompt
- [ ] Documents save to Nursery
- [ ] DEX/Trellis compliance verified

---

## Session Context

**IMPORTANT:** This was a RESCUED coding session after an API error. The session was restored
from compacted context at approximately 5:30 PM on 2026-01-23. Some earlier work during
the hackathon may not be fully documented.

### What the Compaction Summary Captured

1. Truncation bug discovery and fix
2. URL parsing error fix
3. JSON format issue in server.js
4. Playwright test creation

### What May Be Missing

- Earlier changes to SproutFinishingRoom components
- json-render modifications
- Other fixes made before API error

---

## Verification Completed

### API Tests
- ✅ `/api/research/deep` returns prose (not JSON)
- ✅ 5,000-8,400 chars of content
- ✅ 27-38 inline citations
- ✅ 30 web search results

### Playwright Tests (4/4 Pass)
- ✅ Page loads at /explore
- ✅ Command input visible
- ✅ Confirmation dialog appears
- ✅ Research workflow starts

### Manual Verification
- ✅ Screenshot shows prose content in SFR
- ⚠️ Display is malformed but content is there

---

## Lessons Learned

### 1. API Prompt Wording is Critical
One line ("Format as JSON") caused the entire UI to display garbage. Always verify output format.

### 2. Truncation Destroys Silently
The 500-char truncation was destroying 8,000+ char research with no error. Content limits must
be validated against actual use cases.

### 3. URL Parsing Needs Guards
Source identifiers from Claude aren't always valid URLs. Defensive coding required.

### 4. Hackathons Create Technical Debt
Getting results to display required shortcuts that may have broken json-render patterns.
Always document what was changed and why.

### 5. Context Compaction Loses Details
When sessions are restored from summaries, critical details may be lost. Document thoroughly
BEFORE context gets large.

---

## Commit Instructions

**Branch:** `feat/research-template-wiring-v1`

**DO NOT:**
- Merge to main
- Push to trigger GitHub Actions deployment
- Delete the feature branch

**DO:**
- Commit all changes to feature branch
- Push feature branch for backup
- Begin S22-WP planning

**Commit message suggestion:**
```
feat(S21-RL): Pipeline working, display broken - DO NOT MERGE

Working:
- Claude web search returns 5-8K chars prose
- 27-38 inline citations preserved
- Template systemPrompt flows through pipeline
- Full content no longer truncated

Broken (needs S22-WP):
- Results display malformed in SFR
- json-render patterns may be disrupted
- Pass-through mode is a hack
- Writer panel not implemented

RESCUED SESSION: Restored from compacted context after API error.
Some changes may not be fully documented.

Next: S22-WP (research-writer-panel-v1)
```

---

*Sprint closure document created 2026-01-23*
*Author: Developer agent (rescued session)*
