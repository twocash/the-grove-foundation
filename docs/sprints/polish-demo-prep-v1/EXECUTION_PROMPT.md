# EXECUTION PROMPT: Polish and Demo Prep (polish-demo-prep-v1)

> **Self-contained handoff for executing the final polish sprint**

---

## BINDING CONTRACT

**You are bound by the Bedrock Sprint Contract v1.3.**

### Agent Role Declaration (Article X, Section 10.1)

| Property | Value |
|----------|-------|
| **Role** | Developer |
| **Sprint** | polish-demo-prep-v1 |
| **Mode** | Execute |
| **Status File** | `~/.claude/notes/sprint-status-live.md` |

### Status Update Protocol (Section 6.4)

**REQUIRED:** Write status entries to `~/.claude/notes/sprint-status-live.md`:
1. **STARTED** — When beginning sprint work
2. **IN_PROGRESS** — At each phase completion
3. **COMPLETE** — When done with test results
4. **BLOCKED** — If unable to proceed

### Article IX: Visual Verification Requirements
- Code that compiles is NOT proof that features work
- Screenshots are REQUIRED evidence for all UI work
- A sprint is NOT COMPLETE until visual verification passes

### DEX Compliance (Must Pass All 4)
Every feature must answer YES to:
1. Can non-technical user modify via config?
2. What happens if model hallucinates?
3. Can every fact trace to source?
4. Can new types use this without code changes?

**Violation of this contract blocks merge.**

---

## Instant Orientation

**Project:** `C:\GitHub\the-grove-foundation`
**Sprint:** polish-demo-prep-v1
**Goal:** Demo-ready error handling and polish for v1.0
**Success:** Complete lifecycle < 90s, demo video recorded

---

## Attention Anchoring Protocol

Before any major decision, re-read:
1. `docs/sprints/polish-demo-prep-v1/SPEC.md` - Live Status + Attention Anchor
2. `docs/sprints/polish-demo-prep-v1/SPRINTS.md` - Current epic

After every 10 tool calls:
- Check: Am I still pursuing error handling and demo polish?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

Before committing:
- Verify: Does this change satisfy Acceptance Criteria?

---

## Context Summary

### What We're Building

Error handling and polish for the Research Pipeline:
1. **Error Handling (Epic 1):** Timeout, no results, partial evidence, network issues
2. **Loading & Progress (Epic 2):** Skeleton UI, progress indicators
3. **Demo Prep (Epic 3):** Demo script, limitations documentation

### What We're NOT Building

- New features
- Performance optimization
- Architecture changes
- New panels or views

---

## Key Files

| File | Purpose |
|------|---------|
| `src/explore/services/research-pipeline.ts` | Main pipeline - extend error handling |
| `src/explore/hooks/useResearchProgress.ts` | Progress state - add error states |
| `src/explore/components/` | Create: ErrorDisplay, EmptyState, SkeletonCard |

---

## Phase 0: Pre-Execution

Write STARTED status entry:
```markdown
---
## {ISO Timestamp} | Polish and Demo Prep v1 | Phase 0
**Agent:** Developer / main
**Status:** STARTED
**Summary:** Beginning polish sprint for demo readiness
**Files:** N/A
**Tests:** N/A
**Unblocks:** v1.0 demo capability
**Next:** Implement error handling components
---
```

Verify build passes:
```bash
npm run build

# 2. Run existing tests
npm test

# 3. Verify pipeline works
npx ts-node src/explore/services/research-integration-test.ts
```

---

## Epic 1: Error Handling

### Story 1.1: Timeout Handling (US-G001)

**Create:** `src/explore/components/ErrorDisplay.tsx`

```typescript
// src/explore/components/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  phase: 'research' | 'writing' | 'timeout';
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ phase, message, onRetry }: ErrorDisplayProps) {
  const userMessage = getUserMessage(phase, message);

  return (
    <div className="error-display p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-red-800 font-medium">{userMessage.title}</h3>
      <p className="text-red-600 mt-2">{userMessage.description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

function getUserMessage(phase: string, message: string) {
  if (phase === 'timeout') {
    return {
      title: 'Research is taking longer than expected',
      description: 'The query may be too broad or the service is busy. Try a more specific query or wait and retry.',
    };
  }
  if (phase === 'research') {
    return {
      title: 'Research phase encountered an error',
      description: `We couldn't complete the research. ${message}`,
    };
  }
  if (phase === 'writing') {
    return {
      title: 'Document generation failed',
      description: 'The research completed but we couldn\'t generate the document. Your evidence is preserved.',
    };
  }
  return { title: 'An error occurred', description: message };
}
```

### Story 1.2: Empty State (US-G002)

**Create:** `src/explore/components/EmptyState.tsx`

```typescript
// src/explore/components/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  query: string;
  onNewQuery?: () => void;
}

export function EmptyState({ query, onNewQuery }: EmptyStateProps) {
  return (
    <div className="empty-state p-6 text-center">
      <div className="text-gray-400 text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-medium text-gray-700">No evidence found</h3>
      <p className="text-gray-500 mt-2">
        We couldn't find relevant sources for "{query}"
      </p>
      <div className="mt-4 text-sm text-gray-500">
        <p className="font-medium">Try:</p>
        <ul className="list-disc list-inside mt-2 text-left max-w-xs mx-auto">
          <li>Using more specific terms</li>
          <li>Checking spelling</li>
          <li>Broadening your search</li>
        </ul>
      </div>
      {onNewQuery && (
        <button
          onClick={onNewQuery}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Different Query
        </button>
      )}
    </div>
  );
}
```

### Story 1.3: Partial Results Banner (US-G003)

**Create:** `src/explore/components/PartialResultsBanner.tsx`

```typescript
// src/explore/components/PartialResultsBanner.tsx
import React from 'react';

interface PartialResultsBannerProps {
  successfulBranches: number;
  totalBranches: number;
}

export function PartialResultsBanner({
  successfulBranches,
  totalBranches
}: PartialResultsBannerProps) {
  const failedCount = totalBranches - successfulBranches;

  if (failedCount === 0) return null;

  return (
    <div className="partial-results-banner p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
      <span className="text-yellow-600">⚠️</span>
      <span className="text-yellow-800">
        {failedCount} of {totalBranches} research branches failed.
        Results are based on {successfulBranches} successful branches.
      </span>
    </div>
  );
}
```

---

## Epic 2: Loading & Progress

### Story 2.1: Skeleton Loading (US-G006)

**Create:** `src/explore/components/SkeletonCard.tsx`

```typescript
// src/explore/components/SkeletonCard.tsx
import React from 'react';

export function SkeletonCard() {
  return (
    <div className="skeleton-card animate-pulse p-4 border rounded-lg">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
```

### Story 2.2: Progress Display (US-G007)

**Extend:** `src/explore/components/ProgressDisplay.tsx`

```typescript
// Key additions to ProgressDisplay.tsx

interface ProgressDisplayProps {
  phase: 'idle' | 'research' | 'writing' | 'complete' | 'error';
  branchesComplete: number;
  branchesTotal: number;
  currentBranchLabel?: string;
}

// Add phase indicator with animation
<div className="phase-indicator">
  <div className={`phase ${phase === 'research' ? 'active' : ''}`}>
    Research
  </div>
  <div className="phase-arrow">→</div>
  <div className={`phase ${phase === 'writing' ? 'active' : ''}`}>
    Writing
  </div>
  <div className="phase-arrow">→</div>
  <div className={`phase ${phase === 'complete' ? 'active' : ''}`}>
    Complete
  </div>
</div>

// Add branch progress
{phase === 'research' && (
  <div className="branch-progress">
    {branchesComplete} of {branchesTotal} branches complete
    {currentBranchLabel && (
      <span className="current-branch">
        Researching: {currentBranchLabel}
      </span>
    )}
  </div>
)}
```

---

## Epic 3: Demo Prep

### Story 3.1: Demo Script (US-G008)

**Create:** `docs/sprints/polish-demo-prep-v1/DEMO_SCRIPT.md`

```markdown
# Demo Script: Research Pipeline v1.0

## Duration: ~3 minutes

### Scene 1: Introduction (30s)
"Welcome to the Grove Research Pipeline demo. I'll show you how
a single question transforms into a fully-cited research document."

### Scene 2: Sprout Command (30s)
- Show terminal with /sprout command
- Enter query: "What are the economic implications of AI on local hardware ownership?"
- "When I submit this sprout, the Research Agent begins working."

### Scene 3: Research Phase (60s)
- Show progress indicators
- "The system breaks the question into research branches"
- "Each branch searches for relevant sources"
- Point out branch completion: "3 of 4 branches complete"

### Scene 4: Writing Phase (30s)
- Show phase transition to "Writing"
- "Now the Writer Agent synthesizes evidence into prose"
- "It maintains our grove voice and citation standards"

### Scene 5: Results (30s)
- Show final document
- Point out citations
- "The complete document with verifiable citations"

### Scene 6: Wrap-up (15s)
"That's the v1.0 research pipeline - from question to document in under 90 seconds."
```

### Story 3.2: Limitations (US-G009)

**Create:** `docs/sprints/polish-demo-prep-v1/LIMITATIONS.md`

```markdown
# Known Limitations: Research Pipeline v1.0

## Rate Limits
- 90 second overall timeout
- Max 20 API calls per research execution
- Gemini quota limits apply

## Query Types
**Supported:**
- Factual research questions
- Comparative analysis
- Historical topics

**Not Supported:**
- Real-time data queries
- Personal opinion questions
- Questions requiring authentication

## Edge Cases
- Partial branch failures produce partial documents
- Very broad queries may timeout
- Non-English sources may have reduced quality

## Known Issues
- Long documents may truncate (>5000 words)
- Some citation URLs may be behind paywalls
- Progress indicators may lag slightly
```

---

## Post-Execution Verification

### After Each Epic

```bash
# 1. Run tests
npm test

# 2. Build check
npm run build

# 3. Update DEVLOG
echo "Epic N complete" >> docs/sprints/polish-demo-prep-v1/DEVLOG.md

# 4. Update SPEC.md Live Status
```

### Final Verification

```bash
# Full test suite
npm run build && npm test

# Manual verification
# - Submit a sprout and observe error handling
# - Force a timeout and verify UI
# - Complete happy path in <90s
```

---

## Commit Messages

```
feat(explore): Add error handling components (US-G001, US-G002)
feat(explore): Add partial evidence handling (US-G003)
feat(explore): Add timeout recovery (US-G004, US-G005)
feat(explore): Add skeleton loading UI (US-G006)
feat(explore): Enhance progress indicators (US-G007)
docs: Add demo script and limitations (US-G008, US-G009)
```

---

## Success Criteria Checklist

- [ ] Timeout shows user-friendly message with retry
- [ ] Empty results shows suggestions
- [ ] Partial evidence produces document with warning
- [ ] Writer timeout preserves evidence
- [ ] Network issues show reconnection UI
- [ ] Skeleton loading during fetch
- [ ] Progress shows phases and branch completion
- [ ] Demo script documented
- [ ] Limitations documented
- [ ] REVIEW.html complete with all PASS
- [ ] COMPLETE status entry written

---

**Contract:** Bedrock Sprint Contract v1.3
**Role Definition:** `.agent/roles/developer.md`

**Contract Ready: YES**
