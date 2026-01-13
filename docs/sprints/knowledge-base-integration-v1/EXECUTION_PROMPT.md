# Execution Prompt: Knowledge Base Integration v1

> **STATUS: READY FOR EXECUTION**

---

## BINDING CONTRACT

**You are bound by the Bedrock Sprint Contract v1.3.**

### Agent Role Declaration (Article X, Section 10.1)

| Property | Value |
|----------|-------|
| **Role** | Developer |
| **Sprint** | knowledge-base-integration-v1 |
| **Mode** | Execute |
| **Status File** | `~/.claude/notes/sprint-status-live.md` |

### Status Update Protocol (Section 6.4)

**REQUIRED:** Write status entries to `~/.claude/notes/sprint-status-live.md`:
1. **STARTED** — When beginning sprint work
2. **IN_PROGRESS** — At each phase completion
3. **COMPLETE** — When done with test results
4. **BLOCKED** — If unable to proceed

Before proceeding, I acknowledge:

1. **I have read and understood:**
   - `docs/sprints/knowledge-base-integration-v1/SPEC.md` — Sprint specification
   - `docs/sprints/knowledge-base-integration-v1/USER_STORIES.md` — Acceptance criteria

2. **I will follow:**
   - Bedrock Sprint Contract v1.3
   - Grove DEX architecture principles
   - Visual verification requirements (Article IX)

3. **I will NOT:**
   - Modify backend pipeline logic
   - Build corpus search/browse UI (Sprint 7 scope)
   - Skip attention anchoring checkpoints

4. **Build gates I must pass:**
   - `npm run build` — Zero errors
   - `npm test` — All tests pass
   - Visual QA — Screenshots captured and verified

**Binding commitment:** I will complete all acceptance criteria or document blocking issues.

---

## Instant Orientation

```
Project: the-grove-foundation
Sprint: knowledge-base-integration-v1
Goal: Add "Add to Knowledge Base" action to promote research documents to corpus
```

### What We're Building

| Component | Purpose |
|-----------|---------|
| `knowledge-base-integration.ts` | Service for saving documents to corpus |
| Schema extension | Add provenance fields (sproutId, configSnapshotId) |
| Button handler | Wire "Add to Knowledge Base" action |
| Toast feedback | Success/error notifications |

### What Already Exists

| File | Status | Notes |
|------|--------|-------|
| `supabase-adapter.ts` | ✅ Ready | Has 'document' type support, auto-embedding |
| `research-document.ts` | ✅ Ready | Base schema, needs provenance extension |
| `grove-data-provider.ts` | ✅ Ready | Provider interface |
| `GardenInspector.tsx` | ✅ Ready | Will wire handler |
| `ResearchResultsView.tsx` | ⏳ Sprint 5 | Button placement target |

---

## Attention Anchoring Protocol

**Before any major decision, re-read:**
1. `SPEC.md` Live Status block
2. `SPEC.md` Attention Anchor block

**After every 10 tool calls:**
- Check: Am I still pursuing the stated goal?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

**Before committing:**
- Verify: Does this change satisfy Acceptance Criteria?

---

## Phase 0: Pre-Execution Verification

### 0.1 Write STARTED Status Entry
```markdown
---
## {ISO Timestamp} | Knowledge Base Integration v1 | Phase 0
**Agent:** Developer / main
**Status:** STARTED
**Summary:** Beginning knowledge base integration sprint
**Files:** N/A
**Tests:** N/A
**Unblocks:** Research → Corpus promotion workflow
**Next:** Verify infrastructure, create service
---
```

### 0.2 Verify Working Directory

```bash
cd C:\github\the-grove-foundation
git status
```

### 0.2 Read Required Files

```bash
# MUST read before starting
cat docs/sprints/knowledge-base-integration-v1/SPEC.md
cat docs/sprints/knowledge-base-integration-v1/USER_STORIES.md
```

### 0.3 Verify Infrastructure Exists

```bash
# Verify SupabaseAdapter supports documents
grep -n "document" src/core/data/adapters/supabase-adapter.ts

# Verify ResearchDocument schema
cat src/core/schema/research-document.ts
```

### 0.4 Check Sprint 5 Status

```bash
# Check if ResearchResultsView exists (from Sprint 5)
ls src/explore/components/ResearchResultsView.tsx 2>/dev/null || echo "Sprint 5 not yet complete"
```

---

## Phase 1: Knowledge Base Integration Service (US-KB003)

### 1.1 Create Service File

Create `src/explore/services/knowledge-base-integration.ts`:

```typescript
// src/explore/services/knowledge-base-integration.ts
// Knowledge Base Integration - Promote research documents to corpus
// Sprint: knowledge-base-integration-v1
//
// DEX: Provenance as Infrastructure
// Every document traces back to its research origin.

import type { GroveDataProvider, GroveObject } from '@core/data/grove-data-provider';

// =============================================================================
// Types
// =============================================================================

/**
 * Provenance metadata for corpus documents
 */
export interface DocumentProvenance {
  /** Original user query (spark) */
  spark: string;

  /** ResearchSprout ID that initiated the research */
  sproutId: string;

  /** EvidenceBundle ID used for writing */
  evidenceBundleId: string;

  /** WriterAgentConfig snapshot ID at creation time (null if not captured) */
  configSnapshotId: string | null;

  /** ISO timestamp when added to corpus */
  addedAt: string;
}

/**
 * Corpus document payload (extends ResearchDocument)
 */
export interface CorpusDocumentPayload {
  /** Original research query */
  query: string;

  /** Position/thesis statement */
  position: string;

  /** Full analysis in markdown */
  analysis: string;

  /** What couldn't be determined */
  limitations?: string;

  /** Citations referenced in analysis */
  citations: Array<{
    index: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
    accessedAt: string;
  }>;

  /** Word count of analysis */
  wordCount: number;

  /** Processing status */
  documentStatus: 'complete' | 'partial' | 'insufficient-evidence';

  /** Confidence score (0-1) */
  confidenceScore: number;

  /** Provenance chain */
  provenance: DocumentProvenance;
}

/**
 * Result from addToKnowledgeBase operation
 */
export interface AddToKnowledgeBaseResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Created document ID (if success) */
  documentId?: string;

  /** Error message (if failed) */
  error?: string;

  /** Whether this was a duplicate detection */
  isDuplicate?: boolean;
}

/**
 * Input for adding to knowledge base
 */
export interface AddToKnowledgeBaseInput {
  /** The research document to add */
  document: {
    id: string;
    evidenceBundleId: string;
    query: string;
    position: string;
    analysis: string;
    limitations?: string;
    citations: Array<{
      index: number;
      title: string;
      url: string;
      snippet: string;
      domain: string;
      accessedAt: string;
    }>;
    wordCount: number;
    status: 'complete' | 'partial' | 'insufficient-evidence';
    confidenceScore: number;
  };

  /** The source sprout */
  sprout: {
    id: string;
    spark: string;
    groveConfigSnapshot: {
      configVersionId: string;
    };
  };

  /** Grove ID for corpus assignment */
  groveId: string;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Add a research document to the grove's knowledge corpus
 *
 * @param provider - GroveDataProvider instance
 * @param input - Document and sprout to add
 * @returns Result with document ID or error
 */
export async function addToKnowledgeBase(
  provider: GroveDataProvider,
  input: AddToKnowledgeBaseInput
): Promise<AddToKnowledgeBaseResult> {
  const { document, sprout, groveId } = input;

  console.log(`[KnowledgeBase] Adding document to corpus for grove: ${groveId}`);

  try {
    // Check for duplicate by evidenceBundleId
    const existing = await checkForDuplicate(provider, document.evidenceBundleId);
    if (existing) {
      console.log(`[KnowledgeBase] Duplicate detected: ${existing}`);
      return {
        success: true,
        documentId: existing,
        isDuplicate: true,
      };
    }

    // Build provenance chain
    const provenance: DocumentProvenance = {
      spark: sprout.spark,
      sproutId: sprout.id,
      evidenceBundleId: document.evidenceBundleId,
      configSnapshotId: sprout.groveConfigSnapshot?.configVersionId ?? null,
      addedAt: new Date().toISOString(),
    };

    // Build corpus document payload
    const payload: CorpusDocumentPayload = {
      query: document.query,
      position: document.position,
      analysis: document.analysis,
      limitations: document.limitations,
      citations: document.citations,
      wordCount: document.wordCount,
      documentStatus: document.status,
      confidenceScore: document.confidenceScore,
      provenance,
    };

    // Generate title from query
    const title = generateTitle(document.query);

    // Create GroveObject wrapper
    const groveObject: GroveObject<CorpusDocumentPayload> = {
      meta: {
        id: crypto.randomUUID(),
        type: 'document',
        title,
        description: document.position.slice(0, 200),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        tags: ['research', 'auto-generated'],
      },
      payload,
    };

    // Save to corpus via provider
    const created = await provider.create('document', groveObject, {
      triggerEmbedding: true, // Trigger embedding pipeline
    });

    console.log(`[KnowledgeBase] Document created: ${created.meta.id}`);

    return {
      success: true,
      documentId: created.meta.id,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[KnowledgeBase] Failed to add document:`, message);

    return {
      success: false,
      error: message,
    };
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a document with this evidenceBundleId already exists
 */
async function checkForDuplicate(
  provider: GroveDataProvider,
  evidenceBundleId: string
): Promise<string | null> {
  try {
    const docs = await provider.list<CorpusDocumentPayload>('document', {
      filter: { 'payload.provenance.evidenceBundleId': evidenceBundleId },
      limit: 1,
    });

    if (docs.length > 0) {
      return docs[0].meta.id;
    }
  } catch {
    // If filter doesn't work, ignore duplicate check
    console.warn('[KnowledgeBase] Duplicate check failed, proceeding');
  }

  return null;
}

/**
 * Generate a title from the query
 */
function generateTitle(query: string): string {
  const maxLen = 60;
  if (query.length <= maxLen) return query;

  const truncated = query.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 30
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

// =============================================================================
// Exports
// =============================================================================

export type { GroveObject };
```

### 1.2 Verification Gate

```bash
npm run build
# Should pass without TypeScript errors
```

**Checkpoint:** Service file compiles. Re-read SPEC.md before proceeding.

---

## Phase 2: React Hook (US-KB001, US-KB002)

### 2.1 Create useKnowledgeBase Hook

Create `src/explore/hooks/useKnowledgeBase.ts`:

```typescript
// src/explore/hooks/useKnowledgeBase.ts
// React hook for knowledge base operations
// Sprint: knowledge-base-integration-v1

import { useState, useCallback } from 'react';
import { useGroveContext } from '@core/data/grove-context';
import {
  addToKnowledgeBase,
  type AddToKnowledgeBaseInput,
  type AddToKnowledgeBaseResult,
} from '../services/knowledge-base-integration';

/**
 * Hook state for knowledge base operations
 */
export interface UseKnowledgeBaseState {
  /** Whether an operation is in progress */
  isLoading: boolean;

  /** Whether the document was added */
  isAdded: boolean;

  /** Error message if operation failed */
  error: string | null;

  /** Result of last operation */
  result: AddToKnowledgeBaseResult | null;
}

/**
 * Hook for knowledge base operations
 */
export function useKnowledgeBase() {
  const { provider, groveId } = useGroveContext();

  const [state, setState] = useState<UseKnowledgeBaseState>({
    isLoading: false,
    isAdded: false,
    error: null,
    result: null,
  });

  /**
   * Add a document to the knowledge base
   */
  const addDocument = useCallback(
    async (document: AddToKnowledgeBaseInput['document'], sprout: AddToKnowledgeBaseInput['sprout']) => {
      if (!provider || !groveId) {
        setState(prev => ({
          ...prev,
          error: 'Grove context not available',
        }));
        return null;
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await addToKnowledgeBase(provider, {
          document,
          sprout,
          groveId,
        });

        setState({
          isLoading: false,
          isAdded: result.success,
          error: result.success ? null : (result.error ?? 'Unknown error'),
          result,
        });

        return result;

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState({
          isLoading: false,
          isAdded: false,
          error: message,
          result: null,
        });
        return null;
      }
    },
    [provider, groveId]
  );

  /**
   * Reset state for a new document
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isAdded: false,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    addDocument,
    reset,
  };
}
```

### 2.2 Export from Hooks Index

Add to `src/explore/hooks/index.ts`:

```typescript
export { useKnowledgeBase } from './useKnowledgeBase';
export type { UseKnowledgeBaseState } from './useKnowledgeBase';
```

### 2.3 Verification Gate

```bash
npm run build
# Should pass
```

**Checkpoint:** Hook compiles. Re-read SPEC.md before proceeding.

---

## Phase 3: Button Component (US-KB001, US-KB002)

### 3.1 Create AddToKnowledgeBaseButton Component

Create `src/explore/components/AddToKnowledgeBaseButton.tsx`:

```typescript
// src/explore/components/AddToKnowledgeBaseButton.tsx
// "Add to Knowledge Base" button with loading and success states
// Sprint: knowledge-base-integration-v1

import React from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';

interface AddToKnowledgeBaseButtonProps {
  /** The research document to add */
  document: {
    id: string;
    evidenceBundleId: string;
    query: string;
    position: string;
    analysis: string;
    limitations?: string;
    citations: Array<{
      index: number;
      title: string;
      url: string;
      snippet: string;
      domain: string;
      accessedAt: string;
    }>;
    wordCount: number;
    status: 'complete' | 'partial' | 'insufficient-evidence';
    confidenceScore: number;
  };

  /** The source sprout */
  sprout: {
    id: string;
    spark: string;
    groveConfigSnapshot: {
      configVersionId: string;
    };
  };

  /** Callback when document is added */
  onAdded?: (documentId: string) => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Custom class name */
  className?: string;
}

export function AddToKnowledgeBaseButton({
  document,
  sprout,
  onAdded,
  onError,
  className = '',
}: AddToKnowledgeBaseButtonProps) {
  const { isLoading, isAdded, error, addDocument } = useKnowledgeBase();

  // Disable for insufficient evidence
  const isDisabled = document.status === 'insufficient-evidence' || isAdded;

  const handleClick = async () => {
    const result = await addDocument(document, sprout);

    if (result?.success && result.documentId) {
      onAdded?.(result.documentId);
    } else if (result?.error) {
      onError?.(result.error);
    }
  };

  // Button text based on state
  let buttonText = 'Add to Knowledge Base';
  if (isLoading) buttonText = 'Adding...';
  if (isAdded) buttonText = 'Added ✓';
  if (error) buttonText = 'Retry';

  // Button styling
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
  const stateClasses = isAdded
    ? 'bg-green-100 text-green-700 cursor-default'
    : isDisabled
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={`${baseClasses} ${stateClasses} ${className}`}
      title={
        document.status === 'insufficient-evidence'
          ? 'Insufficient evidence to add'
          : isAdded
            ? 'Already added to knowledge base'
            : 'Save this document to your grove corpus'
      }
    >
      {isLoading && (
        <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {buttonText}
    </button>
  );
}
```

### 3.2 Verification Gate

```bash
npm run build
# Should pass
```

**Checkpoint:** Button component compiles. Re-read SPEC.md before proceeding.

---

## Phase 4: Toast Integration (US-KB002)

### 4.1 Wire Toast Notifications

In the parent component that uses `AddToKnowledgeBaseButton`, add toast handlers:

```typescript
// Example integration in ResearchResultsView.tsx or GardenInspector.tsx

import { AddToKnowledgeBaseButton } from './AddToKnowledgeBaseButton';
import { useToast } from '@/hooks/useToast'; // Or your toast hook

function ResearchResultsActions({ document, sprout }) {
  const { showToast } = useToast();

  const handleAdded = (documentId: string) => {
    showToast({
      type: 'success',
      title: 'Added to Grove knowledge base',
      description: 'Your research has been saved to the corpus.',
      action: {
        label: 'View in Corpus',
        onClick: () => window.location.href = `/foundation/knowledge?doc=${documentId}`,
      },
      duration: 5000,
    });
  };

  const handleError = (error: string) => {
    showToast({
      type: 'error',
      title: 'Failed to add to knowledge base',
      description: error,
      duration: 5000,
    });
  };

  return (
    <div className="flex gap-2">
      <AddToKnowledgeBaseButton
        document={document}
        sprout={sprout}
        onAdded={handleAdded}
        onError={handleError}
      />
    </div>
  );
}
```

### 4.2 Verification Gate

```bash
npm run build
# Should pass
```

**Checkpoint:** Toast integration compiles. Re-read SPEC.md before proceeding.

---

## Phase 5: GardenInspector Integration (US-KB005)

### 5.1 Wire Handler in GardenInspector

This phase depends on Sprint 5 (Results Display). If `ResearchResultsView.tsx` exists, add the button there. Otherwise, add a placeholder in GardenInspector.

**Option A: ResearchResultsView exists (Sprint 5 complete)**

```typescript
// In ResearchResultsView.tsx actions bar
<AddToKnowledgeBaseButton
  document={document}
  sprout={selectedSprout}
  onAdded={handleDocumentAdded}
  onError={handleError}
/>
```

**Option B: ResearchResultsView doesn't exist (Sprint 5 pending)**

Add temporary button in GardenInspector when viewing completed sprout:

```typescript
// In GardenInspector.tsx, when sprout.status === 'completed' and document exists
{selectedSprout?.status === 'completed' && document && (
  <div className="p-4 border-t border-white/10">
    <AddToKnowledgeBaseButton
      document={document}
      sprout={selectedSprout}
      onAdded={(id) => {
        console.log('Document added:', id);
        // Show toast
      }}
      onError={(error) => {
        console.error('Add failed:', error);
        // Show error toast
      }}
    />
  </div>
)}
```

### 5.2 Verification Gate

```bash
npm run build
npm test
```

**Checkpoint:** Integration compiles. Run manual test if possible.

---

## Phase 6: Visual QA Testing

### 6.1 Create Screenshot Directory

```bash
mkdir -p docs/sprints/knowledge-base-integration-v1/screenshots
```

### 6.2 Capture Screenshots

Using browser dev tools or Playwright, capture:

| # | Screenshot | AC |
|---|------------|-----|
| 01 | `button-enabled.png` | AC-1 |
| 02 | `button-disabled.png` | AC-2 |
| 03 | `button-loading.png` | AC-3 |
| 04 | `button-added.png` | AC-4 |
| 05 | `toast-success.png` | AC-5, AC-6 |
| 06 | `toast-error.png` | AC-7 |
| 07 | `corpus-view.png` | AC-16 |

### 6.3 Create REVIEW.html

Create `docs/sprints/knowledge-base-integration-v1/REVIEW.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sprint Review: Knowledge Base Integration v1</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #2F5C3B; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .pending { color: orange; }
    img { max-width: 400px; border: 1px solid #ddd; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Sprint Review: Knowledge Base Integration v1</h1>

  <h2>Build Verification</h2>
  <table>
    <tr><th>Check</th><th>Status</th><th>Evidence</th></tr>
    <tr><td>npm run build</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>npm test</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>No console errors</td><td class="pending">PENDING</td><td></td></tr>
  </table>

  <h2>Acceptance Criteria</h2>
  <table>
    <tr><th>AC</th><th>Description</th><th>Status</th><th>Evidence</th></tr>
    <tr><td>AC-1</td><td>Button visible for complete documents</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-2</td><td>Button disabled for insufficient evidence</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-3</td><td>Button shows loading state</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-4</td><td>Button shows "Added ✓" after save</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-5</td><td>Success toast appears</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-6</td><td>Toast includes corpus link</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-7</td><td>Error toast on failure</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-8</td><td>Document saved to Supabase</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-9</td><td>Document has ID and timestamps</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-10</td><td>Embedding pipeline triggered</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-11</td><td>Document includes sproutId</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-12</td><td>Document includes evidenceBundleId</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-13</td><td>Document includes configSnapshotId</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-14</td><td>Full provenance trace retrievable</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-15</td><td>Button in ResearchResultsView</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-16</td><td>Document appears in corpus</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-17</td><td>npm run build passes</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-18</td><td>No TypeScript errors</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-19</td><td>No console errors</td><td class="pending">PENDING</td><td></td></tr>
    <tr><td>AC-20</td><td>Visual QA screenshots captured</td><td class="pending">PENDING</td><td></td></tr>
  </table>

  <h2>Screenshots</h2>
  <p><em>Add screenshots after capturing</em></p>

  <h2>Sign-off</h2>
  <p><strong>Status:</strong> <span class="pending">PENDING</span></p>
  <p><strong>Reviewer:</strong> </p>
  <p><strong>Timestamp:</strong> </p>
</body>
</html>
```

---

## Phase 7: Final Verification

### 7.1 Build Gate

```bash
npm run build
npm test
```

### 7.2 Manual Testing Checklist

- [ ] Navigate to GardenInspector with completed sprout
- [ ] Verify "Add to Knowledge Base" button visible
- [ ] Click button, verify loading state
- [ ] Verify success toast appears
- [ ] Click "View in Corpus" link
- [ ] Verify document appears in corpus view

### 7.3 Update REVIEW.html

Change all PENDING statuses to PASS/FAIL based on verification.

### 7.4 Update SPEC.md Live Status

```markdown
## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 7 - Complete |
| **Status** | ✅ Complete |
| **Blocking Issues** | None |
| **Last Updated** | {timestamp} |
| **Next Action** | Ready for merge |
```

---

## Post-Execution Checklist

- [ ] All AC statuses in REVIEW.html are PASS
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Screenshots captured in `/screenshots/`
- [ ] SPEC.md Live Status updated
- [ ] Notion status updated to "✅ complete"

---

## Files Created/Modified Summary

### New Files
- `src/explore/services/knowledge-base-integration.ts`
- `src/explore/hooks/useKnowledgeBase.ts`
- `src/explore/components/AddToKnowledgeBaseButton.tsx`
- `docs/sprints/knowledge-base-integration-v1/REVIEW.html`
- `docs/sprints/knowledge-base-integration-v1/screenshots/*.png`

### Modified Files
- `src/explore/hooks/index.ts` — Export new hook
- `src/explore/GardenInspector.tsx` — Wire button (or ResearchResultsView.tsx if Sprint 5 complete)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| GroveContext not available | Ensure component is within GroveProvider |
| Supabase insert fails | Check table schema matches GroveObject structure |
| Toast not showing | Verify toast provider is in component tree |
| Embedding not triggered | Check `/api/knowledge/embed` endpoint exists |
| Duplicate not detected | Filter syntax may need adjustment for provider |

---

## Quick Reference

```bash
# Build
npm run build

# Test
npm test

# Dev server
npm run dev

# Check TypeScript
npx tsc --noEmit
```

---

**Contract:** Bedrock Sprint Contract v1.3
**Role Definition:** `.agent/roles/developer.md`
**Execution Time Estimate:** 2-4 hours
**Complexity:** Feature tier (straightforward integration)

**Contract Ready: YES**
