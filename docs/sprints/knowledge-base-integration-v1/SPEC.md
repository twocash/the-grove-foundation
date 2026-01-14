# Sprint Specification: Knowledge Base Integration v1

**Sprint Name:** knowledge-base-integration-v1
**Codename:** Sprint 6 - Knowledge Base Integration
**Domain:** explore (Research Lifecycle)
**Type:** Feature
**Priority:** P1 (Research → Corpus conversion)
**Effort:** Feature tier (2-4 hours)
**Created:** 2026-01-13
**Author:** Jim Calhoun / Claude

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 7 - Complete + Hotfix |
| **Status** | ✅ Complete (hotfix applied) |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-13 |
| **Next Action** | Commit hotfix, deploy |
| **Attention Anchor** | Sprint complete, schema fix applied |

### Hotfix Applied (2026-01-13)

Schema mismatch discovered during local testing. The `document` type collided with RAG `documents` table.

**Fix:** Created `corpus_documents` table (migration 014) with JSONB meta+payload pattern. Updated SupabaseAdapter mapping. See `SESSION_NOTES.md` for details.

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** "Add to Knowledge Base" action to promote research documents to grove corpus
- **Success looks like:** User clicks button → document persists → toast confirms → document retrievable
- **We are NOT:** Building corpus search/browse UI (Sprint 7), editing documents, or modifying pipeline
- **Current phase:** Planning complete, ready for execution
- **Next action:** Create `knowledge-base-integration.ts` service in `src/explore/services/`

---

## Constitutional Reference

Per Foundation Loop v2 (Feature tier):

- [x] Read: `docs/BEDROCK_SPRINT_CONTRACT.md` (Binding Contract v1.3) — Not a Bedrock console sprint, but visual verification applies
- [x] Read: `src/core/schema/research-document.ts` — Document schema exists
- [x] Read: `src/core/data/adapters/supabase-adapter.ts` — Persistence infrastructure ready
- [x] Read: `src/core/data/grove-data-provider.ts` — Provider interface

**Note:** This is an **explore domain** sprint, not a bedrock console sprint. Article IX (Visual Verification) applies. Articles II-III (Console Pattern, Copilot) do not apply.

---

## Executive Summary

Add the ability to promote research documents from the Research Lifecycle pipeline to the grove's persistent knowledge corpus. When a user completes research and views results, they can click "Add to Knowledge Base" to:

1. **Persist the document** — Save to Supabase via GroveDataProvider
2. **Maintain provenance** — Link to spark, sprout, evidence, and config snapshot
3. **Trigger embedding** — Queue for vectorization via embedding pipeline
4. **Confirm success** — Show toast notification with corpus link

**Before:**
```
┌─────────────────────────────────┐
│ Research Results View           │
│                                 │
│  [Position statement]           │
│  [Analysis with citations]      │
│                                 │
│  [Copy] [Add to KB - disabled]  │
│                                 │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ Research Results View           │
│                                 │
│  [Position statement]           │
│  [Analysis with citations]      │
│                                 │
│  [Copy] [Add to Knowledge Base] │
│         ↓ click                 │
│  ┌────────────────────────┐     │
│  │ ✓ Added to Grove corpus│     │
│  │   [View in Corpus →]   │     │
│  └────────────────────────┘     │
└─────────────────────────────────┘
```

---

## Pattern Check (Phase 0)

### PROJECT_PATTERNS.md Compliance

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Document persistence | GroveDataProvider + SupabaseAdapter | USE — Already configured for 'document' type |
| Toast notifications | Existing toast system in Surface | USE — Standard pattern |
| Provenance tracking | ResearchDocument.evidenceBundleId | EXTEND — Add sproutId, configSnapshotId |
| Action handlers | GardenInspector handlers | EXTEND — Add onAddToKnowledgeBase |

### Patterns Extended

- **GroveDataProvider** — Use existing create() for documents
- **ResearchDocument** — Extend with provenance fields
- **Toast system** — Reuse for success/error feedback

### New Patterns Proposed

None required. All needs met by extending existing patterns.

---

## Canonical Source Audit

| Capability Needed | Canonical Home | Recommendation |
|-------------------|----------------|----------------|
| Document persistence | `supabase-adapter.ts` | USE — Already supports 'document' type |
| Embedding trigger | `/api/knowledge/embed` endpoint | USE — Already implemented |
| Toast notifications | Surface toast utilities | USE — Standard pattern |
| Provenance types | `research-document.ts` | EXTEND — Add fields |

---

## Goals

1. **Persistence** — Save research documents to grove corpus
2. **Provenance** — Maintain full audit trail from spark to document
3. **Feedback** — Clear user feedback on success/failure
4. **Integration** — Seamless action from results view

## Non-Goals

- Corpus search/browse UI (Sprint 7)
- Document editing capabilities
- Real-time sync across devices
- Batch document operations
- Export to external formats

---

## Acceptance Criteria

### Knowledge Base Action (US-KB001, US-KB002)
- [ ] AC-1: "Add to Knowledge Base" button visible for complete documents
- [ ] AC-2: Button disabled for insufficient-evidence documents
- [ ] AC-3: Button shows loading state during save
- [ ] AC-4: Button transitions to "Added ✓" after save
- [ ] AC-5: Success toast appears with "Added to Grove knowledge base"
- [ ] AC-6: Toast includes "View in Corpus" link
- [ ] AC-7: Error toast appears on save failure

### Document Persistence (US-KB003)
- [ ] AC-8: Document saved to Supabase documents table
- [ ] AC-9: Document has unique ID and timestamps
- [ ] AC-10: Embedding pipeline triggered after save

### Provenance Chain (US-KB004)
- [ ] AC-11: Document includes sproutId field
- [ ] AC-12: Document includes evidenceBundleId field
- [ ] AC-13: Document includes configSnapshotId field
- [ ] AC-14: Full provenance trace retrievable

### Integration (US-KB005, US-KB006)
- [ ] AC-15: Button integrated in ResearchResultsView actions bar
- [ ] AC-16: Document appears in corpus view after save

### Build Gates
- [ ] AC-17: `npm run build` passes
- [ ] AC-18: No TypeScript errors
- [ ] AC-19: No console errors on load
- [ ] AC-20: Visual QA screenshots captured

---

## Architecture

### Knowledge Base Integration Service

```typescript
// src/explore/services/knowledge-base-integration.ts

import type { ResearchDocument } from '@core/schema/research-document';
import type { ResearchSprout } from '@core/schema/research-sprout';
import type { GroveDataProvider } from '@core/data/grove-data-provider';

/**
 * Provenance metadata for corpus documents
 */
export interface DocumentProvenance {
  /** Original user query (spark) */
  spark: string;

  /** ResearchSprout that initiated the research */
  sproutId: string;

  /** EvidenceBundle used for writing */
  evidenceBundleId: string;

  /** WriterAgentConfig snapshot ID at creation time */
  configSnapshotId: string | null;

  /** When the document was added to corpus */
  addedAt: string;
}

/**
 * Corpus document with provenance chain
 */
export interface CorpusDocument extends ResearchDocument {
  /** Provenance metadata */
  provenance: DocumentProvenance;
}

/**
 * Result from addToKnowledgeBase operation
 */
export interface AddToKnowledgeBaseResult {
  success: boolean;
  documentId?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Add a research document to the grove's knowledge corpus
 */
export async function addToKnowledgeBase(
  provider: GroveDataProvider,
  document: ResearchDocument,
  sprout: ResearchSprout
): Promise<AddToKnowledgeBaseResult>;
```

### Schema Extension

```typescript
// Extension to ResearchDocument for corpus storage
// Option A: Add fields directly to ResearchDocument
// Option B: Create CorpusDocument wrapper (recommended for separation)

interface CorpusDocumentPayload {
  // From ResearchDocument
  ...ResearchDocumentFields,

  // Added for corpus
  provenance: DocumentProvenance;
}
```

### Integration Point

```tsx
// In ResearchResultsView.tsx or GardenInspector.tsx

interface ResearchResultsViewProps {
  document: ResearchDocument;
  sprout: ResearchSprout;
  onAddToKnowledgeBase?: () => Promise<void>;
}

// Handler wires to service
const handleAddToKnowledgeBase = async () => {
  const result = await addToKnowledgeBase(provider, document, sprout);
  if (result.success) {
    showToast({ type: 'success', message: 'Added to Grove knowledge base' });
  } else {
    showToast({ type: 'error', message: result.error || 'Failed to add' });
  }
};
```

---

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `src/explore/services/knowledge-base-integration.ts` | **New** | Core service |
| `src/core/schema/research-document.ts` | **Modify** | Add provenance fields |
| `src/explore/components/ResearchResultsView.tsx` | **Modify** | Add button (after Sprint 5) |
| `src/explore/GardenInspector.tsx` | **Modify** | Wire handler |
| `src/explore/hooks/useKnowledgeBase.ts` | **New** | React hook for service |

---

## User Stories

See: [User Stories & Acceptance Criteria](./USER_STORIES.md)

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-KB001 | Add to Knowledge Base Button | P0 | S |
| US-KB002 | Success Confirmation Toast | P0 | S |
| US-KB003 | Save Document to Corpus | P0 | S |
| US-KB004 | Maintain Provenance Chain | P0 | M |
| US-KB005 | GardenInspector Integration | P0 | S |
| US-KB006 | Corpus Visibility | P1 | S |
| US-KB007 | Build Gate Compliance | P0 | S |

**Execution Order:** US-KB003 → US-KB004 → US-KB001/US-KB002 → US-KB005 → US-KB006 → US-KB007

---

## DEX Compliance Matrix

### Feature: Knowledge Base Integration

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [ ] | Document schema declarative; persistence via generic provider |
| Capability Agnosticism | [ ] | Works regardless of which LLM generated content |
| Provenance as Infrastructure | [ ] | Full chain: spark → sprout → evidence → citations → config |
| Organic Scalability | [ ] | Schema extensible; new fields don't break existing |

**Blocking issues:** None anticipated

---

## Visual Verification Requirements

Per Bedrock Sprint Contract Article IX:

### Required Screenshots

| # | Description | AC Coverage |
|---|-------------|-------------|
| 01 | Add to KB button - enabled state | AC-1 |
| 02 | Add to KB button - disabled (insufficient evidence) | AC-2 |
| 03 | Button loading state | AC-3 |
| 04 | Button "Added ✓" state | AC-4 |
| 05 | Success toast with corpus link | AC-5, AC-6 |
| 06 | Error toast on failure | AC-7 |
| 07 | Document in corpus view | AC-16 |

### REVIEW.html Requirements

- All ACs mapped to screenshots
- Build verification results
- Sign-off timestamp

---

## Reference Files

**Services:**
- `src/explore/services/research-pipeline.ts`
- `src/explore/services/writer-agent.ts`

**Data:**
- `src/core/data/grove-data-provider.ts`
- `src/core/data/adapters/supabase-adapter.ts`

**Schemas:**
- `src/core/schema/research-document.ts`
- `src/core/schema/research-sprout.ts`
- `src/core/schema/evidence-bundle.ts`

**UI:**
- `src/explore/GardenInspector.tsx`
- `src/explore/components/` (Sprint 5 components)

---

## Related Work

- **Blocked by:** Sprint 5 (Results Display) — Need ResearchResultsView for button placement
- **Blocks:** Sprint 7 (Polish and Demo Prep)
- **Related:** evidence-collection-v1, writer-agent-v1, pipeline-integration-v1, results-display-v1

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Sprint 3 (Pipeline Integration) | ✅ Complete | Provides ResearchDocument output |
| Sprint 4 (Progress Streaming) | 🚀 In Progress | Not blocking |
| Sprint 5 (Results Display) | 🎯 Ready | ResearchResultsView for button placement |
| SupabaseAdapter | ✅ Ready | Supports 'document' type |
| Embedding API | ✅ Ready | `/api/knowledge/embed` endpoint |

---

*This specification follows Foundation Loop v2 (Feature tier) requirements.*
