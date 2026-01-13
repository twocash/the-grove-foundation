# Sprint Specification: Progress Streaming UI v1

**Sprint Name:** progress-streaming-ui-v1
**Codename:** Sprint 4 - Progress Streaming
**Domain:** explore (Research Lifecycle)
**Type:** Feature
**Priority:** P1 (User visibility into research execution)
**Effort:** Feature tier (4-6 hours)
**Created:** 2026-01-13
**Author:** Jim Calhoun / Claude

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Planning |
| **Status** | 🟡 Ready for Execution |
| **Blocking Issues** | None - Sprint 3 (Pipeline Integration) complete |
| **Last Updated** | 2026-01-13T15:00:00Z |
| **Next Action** | Execute Phase 1: Create progress state hook |
| **Attention Anchor** | Re-read before starting each epic |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Real-time progress UI for research pipeline execution
- **Success looks like:** Users see live search queries, sources appearing, and phase transitions during research
- **We are NOT:** Modifying backend pipeline logic, adding persistence, or enhancing analysis metrics
- **Current phase:** Planning complete, ready for execution
- **Next action:** Create `useResearchProgress` hook in `src/explore/hooks/`

---

## Constitutional Reference

Per Foundation Loop v2 (Feature tier):

- [x] Read: `docs/BEDROCK_SPRINT_CONTRACT.md` — Not a Bedrock console sprint, but visual verification still required
- [x] Read: `src/explore/services/research-pipeline.ts` — Event types already defined
- [x] Read: `src/explore/GardenInspector.tsx` — Component to enhance

**Note:** This is an **explore domain** sprint, not a bedrock console sprint. Article IX (Visual Verification) applies. Articles II-III (Console Pattern, Copilot) do not apply.

---

## Executive Summary

Add real-time progress visualization to the Research Lifecycle. When a user has an active research sprout, they currently see nothing happening. After this sprint, they'll see:

1. **Live search queries** — "Searching: distributed inference pricing..."
2. **Sources appearing** — URLs animate in as discovered
3. **Phase indicators** — "Researching..." → "Writing..."
4. **Completion state** — Success indicator with document link

**Before:**
```
┌─────────────────────────────────┐
│ Research Garden                  │
│                                  │
│  [Active sprout card]            │
│   (no indication of progress)    │
│                                  │
└─────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────┐
│ Research Progress                │
├─────────────────────────────────┤
│ 🔬 Researching...               │
│                                  │
│ Searching: "distributed AI..."   │
│                                  │
│ Found 6 sources:                 │
│  • arxiv.org - Efficient...     │
│  • github.com - LLM-Inference...│
│  • (4 more)                      │
│                                  │
│ ▓▓▓▓▓▓▓░░░ Branch 1/3           │
└─────────────────────────────────┘
```

---

## Pattern Check (Phase 0)

### PROJECT_PATTERNS.md Compliance

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Progress event display | None — new capability | Create `ResearchProgressView` component |
| Event state management | `useResearchAgent` exists | Extend or create `useResearchProgress` |
| Animation patterns | CSS transitions in Glass components | Reuse existing keyframes |
| Inspector view modes | `GardenInspector` has `viewMode` | Add 'progress' view mode |

### Patterns Extended

- **useResearchAgent** — Extend with progress event buffering
- **GardenInspector** — Add progress view mode
- **Glass animations** — Reuse pulse, fade-in patterns

### New Patterns Proposed

None required. All needs met by extending existing patterns.

---

## Canonical Source Audit

| Capability Needed | Canonical Home | Recommendation |
|-------------------|----------------|----------------|
| Progress event types | `research-pipeline.ts` | USE — Already defined |
| Research agent hook | `useResearchAgent.ts` | EXTEND — Add progress state |
| Inspector panel | `GardenInspector.tsx` | EXTEND — Add progress view |
| Animation keyframes | `tailwind.config.ts` | EXTEND — Add if needed |

---

## Goals

1. **Real-time visibility** — Users see what the agent is doing
2. **Phase awareness** — Clear indication of research vs. writing
3. **Source feedback** — URLs appear as discovered
4. **Polished transitions** — Smooth animations between states

## Non-Goals

- Backend changes to pipeline
- New event types (use existing)
- Persistence of progress history
- Detailed analysis metrics (v1.1)
- Retry automation (user-initiated only)

---

## Acceptance Criteria

### Progress State (US-PS001)
- [ ] AC-1: Progress events captured during active research
- [ ] AC-2: Event buffer limited to 10 most recent (FIFO)
- [ ] AC-3: Progress state resets on new execution
- [ ] AC-4: Pipeline phase tracked (research | writing)

### Progress Panel (US-PS002, US-PS004)
- [ ] AC-5: Progress panel renders for active sprouts
- [ ] AC-6: Phase indicator shows current pipeline phase
- [ ] AC-7: Search queries display with truncation
- [ ] AC-8: Source count displayed
- [ ] AC-9: Completion state shows success indicator

### Source Display (US-PS003)
- [ ] AC-10: Sources animate in as discovered
- [ ] AC-11: Sources show domain and truncated title
- [ ] AC-12: Source overflow handled with "+N more"

### Integration (US-PS005)
- [ ] AC-13: Progress view replaces details for active sprouts
- [ ] AC-14: View transitions when status changes
- [ ] AC-15: Error state shows with retry option

### Build Gates
- [ ] AC-16: `npm run build` passes
- [ ] AC-17: No TypeScript errors
- [ ] AC-18: No console errors on load
- [ ] AC-19: Visual QA screenshots captured

---

## Architecture

### Progress Hook Enhancement

```typescript
// src/explore/hooks/useResearchProgress.ts

export interface ResearchProgressState {
  /** Whether research is currently active */
  isActive: boolean;

  /** Current pipeline phase */
  currentPhase: 'idle' | 'research' | 'writing' | 'complete' | 'error';

  /** Recent progress events (max 10, FIFO) */
  events: Array<{
    event: PipelineProgressEvent;
    timestamp: string;
  }>;

  /** Discovered sources */
  sources: Array<{
    url: string;
    title: string;
    domain: string;
  }>;

  /** Current search query (if searching) */
  currentQuery: string | null;

  /** Error message (if failed) */
  error: string | null;
}

export function useResearchProgress(sproutId: string | null): {
  state: ResearchProgressState;
  reset: () => void;
};
```

### Progress View Component

```tsx
// src/explore/components/ResearchProgressView.tsx

interface ResearchProgressViewProps {
  sproutId: string;
  onComplete?: (documentId: string) => void;
  onRetry?: () => void;
}

export function ResearchProgressView({
  sproutId,
  onComplete,
  onRetry,
}: ResearchProgressViewProps): JSX.Element;
```

### GardenInspector Enhancement

```tsx
// Modify GardenInspector.tsx

// Add to ViewMode type:
type ViewMode = 'confirmation' | 'list' | 'progress';

// Conditional rendering:
{viewMode === 'progress' && selectedSprout && (
  <ResearchProgressView
    sproutId={selectedSprout.id}
    onComplete={handleDocumentComplete}
    onRetry={handleRetry}
  />
)}
```

---

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `src/explore/hooks/useResearchProgress.ts` | **New** | Progress state management |
| `src/explore/components/ResearchProgressView.tsx` | **New** | Progress display UI |
| `src/explore/components/SourceList.tsx` | **New** | Animated source list |
| `src/explore/components/PhaseIndicator.tsx` | **New** | Phase badge component |
| `src/explore/GardenInspector.tsx` | **Modify** | Add progress view mode |
| `src/explore/hooks/index.ts` | **Modify** | Export new hook |
| `tailwind.config.ts` | **Modify** | Add animations if needed |

---

## User Stories

See: [User Stories & Acceptance Criteria](./USER_STORIES.md)

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-PS001 | Track Active Sprout Progress Events | P0 | S |
| US-PS002 | Research Progress Panel | P0 | M |
| US-PS003 | Live Source List | P1 | S |
| US-PS004 | Phase State Indicators | P0 | S |
| US-PS005 | GardenInspector Progress Integration | P0 | S |
| US-PS006 | Smooth Transitions | P1 | S |
| US-PS007 | Build Gate Compliance | P0 | S |

**Execution Order:** US-PS001 → US-PS002/US-PS004 → US-PS005 → US-PS003/US-PS006 → US-PS007

---

## Event Type Reference

### Pipeline Events (from `research-pipeline.ts`)

```typescript
export type PipelineProgressEvent =
  | { type: 'phase-started'; phase: 'research' | 'writing' }
  | { type: 'phase-completed'; phase: 'research' | 'writing'; duration: number }
  | { type: 'pipeline-complete'; totalDuration: number }
  | { type: 'pipeline-error'; phase: 'research' | 'writing' | 'timeout'; message: string }
  | ResearchProgressEvent  // Forwarded from Research Agent
  | WriterProgress;        // Forwarded from Writer Agent
```

### Research Agent Events (from `research-agent.ts`)

```typescript
export type ResearchProgressEvent =
  | { type: 'branch-started'; branchId: string; label: string }
  | { type: 'branch-completed'; branchId: string; evidenceCount: number }
  | { type: 'search-started'; branchId: string; query: string }
  | { type: 'source-discovered'; url: string; title: string }
  | { type: 'evidence-collected'; branchId: string; source: string }
  | { type: 'research-complete'; totalEvidence: number; duration: number }
  | { type: 'error'; message: string };
```

### Writer Events (from `writer-agent.ts`)

```typescript
export type WriterProgress =
  | { type: 'writer-started' }
  | { type: 'section-started'; section: string }
  | { type: 'section-completed'; section: string }
  | { type: 'writer-complete'; wordCount: number };
```

---

## DEX Compliance Matrix

### Feature: Progress Streaming UI

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [ ] | Event types defined in schema, UI maps declaratively |
| Capability Agnosticism | [ ] | Works regardless of LLM model executing research |
| Provenance as Infrastructure | [ ] | Events have timestamps, sources retain URLs |
| Organic Scalability | [ ] | New event types automatically flow through |

**Blocking issues:** None anticipated

---

## Visual Verification Requirements

Per Bedrock Sprint Contract Article IX:

### Required Screenshots

| # | Description | AC Coverage |
|---|-------------|-------------|
| 01 | Progress panel - research phase | AC-5, AC-6 |
| 02 | Progress panel - search query visible | AC-7 |
| 03 | Progress panel - sources appearing | AC-10, AC-11 |
| 04 | Progress panel - writing phase | AC-6 |
| 05 | Progress panel - completion state | AC-9 |
| 06 | Progress panel - error state | AC-15 |
| 07 | View transition (active → completed) | AC-14 |

### REVIEW.html Requirements

- All ACs mapped to screenshots
- Build verification results
- Sign-off timestamp

---

## Reference Files

**Pipeline:**
- `src/explore/services/research-pipeline.ts`
- `src/explore/services/research-agent.ts`
- `src/explore/services/writer-agent.ts`

**Hooks:**
- `src/explore/hooks/useResearchAgent.ts`
- `src/explore/hooks/usePromptArchitect.ts`

**UI:**
- `src/explore/GardenInspector.tsx`
- `src/explore/context/ResearchSproutContext.tsx`

**Schemas:**
- `src/core/schema/research-sprout.ts`
- `src/core/schema/research-sprout-registry.ts`

---

## Related Work

- **Blocked by:** Sprint 3 (Pipeline Integration) ✅ Complete
- **Blocks:** Sprint 7 (Polish and Demo Prep)
- **Related:** evidence-collection-v1, writer-agent-v1, pipeline-integration-v1

---

*This specification follows Foundation Loop v2 (Feature tier) requirements.*
