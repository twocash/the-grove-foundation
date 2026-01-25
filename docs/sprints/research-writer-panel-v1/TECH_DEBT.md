# S22-WP Technical Debt and Hacks

**Sprint:** research-writer-panel-v1
**Date:** 2026-01-24
**Status:** Functional - Ready for Cleanup Sprint

---

## Summary

S22-WP successfully achieved **100% lossless research storage and display**. The `canonical_research` column in Supabase contains the exact structured output from Claude's `deliver_research_results` tool. However, several architectural hacks remain that should be addressed in a dedicated cleanup sprint.

**Data Fidelity Verified:** API output === Supabase storage ✅

---

## 1. Server.js Parameter Hardcoding (HIGH PRIORITY)

**Location:** `server.js:2467-2496` (documented inline)

### Current Hacks

| Parameter | Hardcoded Value | Should Be |
|-----------|-----------------|-----------|
| `maxTokens` | 16384 | Template-driven via `researchConfig.maxTokens` |
| `max_uses` (web searches) | 15 | Template-driven via `researchConfig.maxSearches` |
| `defaultSystemPrompt` | Inline fallback | Never exist - research-agent always provides |
| `userPromptTemplate` | Inline structure | Template-driven via `researchConfig.userPromptTemplate` |

### Problem

Server.js contains domain logic that should be in `research-agent.ts` and loaded from Output Templates. This violates DEX Declarative Sovereignty - behavior should be config-driven, not code-driven.

### Fix (S23-PT: Prompt Template Architecture)

1. Extend Output Template schema with `researchConfig`:
   ```typescript
   interface OutputTemplateResearchConfig {
     maxTokens: number;
     maxSearches: number;
     userPromptTemplate: string;
     model?: string;
   }
   ```

2. `research-agent.ts` loads template, extracts ALL params:
   ```typescript
   const { systemPrompt, researchConfig } = loadResearchTemplate(templateId);
   await fetch('/api/research/deep', {
     body: {
       query, context, systemPrompt,
       maxTokens: researchConfig.maxTokens,
       maxSearches: researchConfig.maxSearches,
       userPromptTemplate: researchConfig.userPromptTemplate
     }
   });
   ```

3. `server.js` becomes thin passthrough - no defaults, no fallbacks

---

## 2. Writer Agent Pass-Through Hack (REMOVED)

**Location:** `server.js` (was ~lines 83-100)

### Status: FIXED in S22-WP

The original plan identified a pass-through hack in `writer-agent.ts` that bypassed the Writer for large/web content. This was the root cause of raw markdown being dumped to the UI.

**S22-WP Solution:** Completely decoupled research from writing:
- Research pipeline returns `canonicalResearch` only (no automatic Writer call)
- Writer is now user-triggered from the right panel (not implemented yet)
- No pass-through hack needed because Writer is not chained after research

---

## 3. Evidence Type Extension Pattern

**Location:** `src/surface/components/modals/SproutFinishingRoom/json-render/evidence-transform.ts:17-23`

### Current Hack

```typescript
// S22-WP: Extended Evidence type with optional metadata
interface EvidenceWithMetadata extends Evidence {
  metadata?: {
    title?: string;
    [key: string]: unknown;
  };
}
```

### Problem

Local type extension instead of schema-level addition. The `metadata` field is used to pass source titles from the API but isn't part of the core `Evidence` schema.

### Fix

Add `metadata?: Record<string, unknown>` to `@core/schema/research-strategy.ts` Evidence type:
```typescript
export interface Evidence {
  id: string;
  source: string;
  sourceType: 'academic' | 'practitioner' | 'primary' | 'news';
  content: string;
  relevance: number;
  confidence: number;
  collectedAt: string;
  metadata?: Record<string, unknown>;  // ADD THIS
}
```

---

## 4. Missing Array Validation (DEFENSIVE FIX)

**Location:** `src/explore/services/research-agent.ts`

### Issue Encountered

Claude API occasionally returns `sections` as a string instead of an array, causing `.map is not a function` errors:

```
[Research Deep] Error: (structuredResult.sections || []).map is not a function
```

### Current Fix

Not yet implemented in research-agent.ts. The server.js structured output schema enforces array, but Claude sometimes returns malformed data.

### Recommended Fix

Add defensive validation before processing:
```typescript
// Validate sections is an array
if (result.canonicalResearch?.sections && !Array.isArray(result.canonicalResearch.sections)) {
  console.warn('[ResearchAgent] sections is not array, wrapping');
  result.canonicalResearch.sections = [result.canonicalResearch.sections];
}
```

---

## 5. Tailwind Prose Class Conflicts

**Location:** `src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx:312-359`

### Problem

Tailwind's `prose` and `prose-invert` classes provide default heading styles that conflict with our custom heading components. The fix required adding explicit className overrides to custom `h1`-`h4` components.

### Current Solution (Works but Verbose)

```tsx
h1: ({ children }) => (
  <h1 className="text-2xl font-serif font-bold text-ink dark:text-paper mt-8 mb-4 pb-3 border-b-2 border-grove-forest/30">
    {children}
  </h1>
),
```

### Better Solution

Create a custom Tailwind typography preset for Grove research documents that doesn't conflict with ReactMarkdown rendering. Or extract heading styles to a shared constant.

---

## 6. Legacy Transform Functions

**Location:** `src/surface/components/modals/SproutFinishingRoom/json-render/evidence-transform.ts`

### Status

The file contains both:
1. **New functions** (canonical*): Handle `canonicalResearch` from structured API
2. **Legacy functions** (sprout*): Handle older sprouts without `canonicalResearch`

### Technical Debt

~500 lines of legacy fallback code that should be deprecated once all sprouts have `canonicalResearch`:

- `sproutResearchToRenderTree()` - Legacy evidence bundle display
- `sproutSynthesisToRenderTree()` - Legacy synthesis display
- `sproutFullReportToRenderTree()` - Legacy full report display
- `sproutSourcesToRenderTree()` - Legacy sources display
- `extractExecutiveSummary()` - Regex-based markdown parsing (brittle)

### Recommended Action

1. Add deprecation warnings to legacy functions
2. After 30 days of production use with `canonicalResearch`, remove legacy paths
3. Or create a migration script to backfill `canonicalResearch` for existing sprouts

---

## 7. User Notes Not Wired to Writer

**Location:** Plan doc mentions this feature

### Status: NOT IMPLEMENTED

The right panel Writer workflow was planned but not built in S22-WP:
- User selects Writer template
- User adds notes/context
- Notes merge into Writer systemPrompt
- Generate button triggers document creation

### Files to Create (S23)

- `WriterPanel.tsx` - Container component
- `WriterTemplateGrid.tsx` - Template selection
- `UserNotesInput.tsx` - Textarea for user context
- `GeneratePreview.tsx` - Document preview

---

## 8. Nursery Save Endpoint

**Location:** `server.js` - endpoint not yet created

### Status: NOT IMPLEMENTED

The `/api/nursery/save` endpoint for persisting both raw research and generated documents was planned but not built.

### Schema (Ready)

```sql
-- Already have research_sprouts table with:
-- canonical_research JSONB (100% lossless)
--
-- Need to add for Writer output:
-- generated_document TEXT
-- writer_template_id TEXT
-- user_notes TEXT
```

---

## 9. Import Alias Issues

**Location:** Various Surface components

### Known Issue

Some components use relative imports instead of path aliases:

```typescript
// Should use
import { useOutputTemplateData } from '@bedrock/consoles/ExperienceConsole/useOutputTemplateData';

// But sometimes requires
import { useOutputTemplateData } from '../../../../../bedrock/consoles/ExperienceConsole/useOutputTemplateData';
```

### Fix

Verify Vite alias configuration handles deeply nested Surface components correctly.

---

## Files Modified in S22-WP

### Core Changes

| File | Change Summary |
|------|----------------|
| `server.js` | Structured output via tool use, increased maxTokens, documented hacks |
| `research-pipeline.ts` | Removed Writer chaining, returns `canonicalResearch` |
| `research-agent.ts` | Captures `canonicalResearch` from API response |
| `sprout.ts` | Added `CanonicalResearch` type and `canonicalResearch` field |

### json-render System

| File | Change Summary |
|------|----------------|
| `evidence-catalog.ts` | Added schema types for all evidence components |
| `evidence-registry.tsx` | Added `SynthesisBlock`, `ConfidenceNote`, `LimitationsList` components |
| `evidence-transform.ts` | Added canonical* transform functions for 100% lossless display |
| `index.ts` | Exported new components and functions |

### UI Components

| File | Change Summary |
|------|----------------|
| `DocumentViewer.tsx` | Three-tab interface: Summary, Full Report, Sources |
| `ActionPanel.tsx` | Placeholder for future Writer workflow |
| `SproutRow.tsx` | Fixed tray items being unclickable |

### Supabase

| File | Change Summary |
|------|----------------|
| `035_add_canonical_research_column.sql` | Added `canonical_research` JSONB column |

---

## Priority for Next Sprint (S23-PT)

1. **HIGH:** Fix server.js parameter hardcoding - move to templates
2. **MEDIUM:** Implement right panel Writer workflow
3. **MEDIUM:** Add array validation for API responses
4. **LOW:** Deprecate legacy transform functions
5. **LOW:** Clean up Tailwind prose conflicts

---

*Document created for sprint handoff. Technical debt is documented inline in source files with S22-WP comments.*
