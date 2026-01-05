# Repository Audit: kinetic-suggested-prompts-v1 (CORRECTED)

**Sprint:** kinetic-suggested-prompts-v1  
**Date:** January 4, 2026  
**Auditor:** Foundation Loop Phase 0  
**Supersedes:** Previous audit that ignored 4D Context Fields infrastructure

---

## Critical Correction

The previous SPEC.md was written against outdated documentation and proposed creating new infrastructure that **already exists**. This audit corrects that by using the canonical 4D Context Fields system.

---

## Part 1: Existing Infrastructure (USE THIS)

### 4D Context Fields System

**Location:** `src/core/context-fields/`

| File | Purpose | Lines |
|------|---------|-------|
| `types.ts` | ContextState, PromptObject, ContextTargeting schemas | 197 |
| `scoring.ts` | applyHardFilters, calculateRelevance, rankPrompts, selectPrompts | 234 |
| `generator.ts` | PromptGenerator (rule-based dynamic generation) | ~150 |
| `index.ts` | Exports | ~20 |

**ContextState (4D Aggregation):**
```typescript
interface ContextState {
  stage: Stage;              // 'genesis' | 'exploration' | 'synthesis' | 'advocacy'
  entropy: number;           // 0.0-1.0
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}
```

**PromptObject (Full Schema):**
```typescript
interface PromptObject {
  id: string;
  label: string;              // Button text
  executionPrompt: string;    // Full query on click
  targeting: ContextTargeting;
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  baseWeight?: number;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  // ... stats, author, etc.
}
```

**Selection Pipeline:**
```typescript
selectPrompts(prompts, context, { maxPrompts: 3 })
// Returns: ScoredPrompt[] (ranked by relevance)
```

### Prompt Library

**Location:** `src/data/prompts/`

| File | Prompts | Description |
|------|---------|-------------|
| `base.prompts.json` | ~15 | Universal prompts for any context |
| `dr-chiang.prompts.json` | ~20 | Mung Chiang lens-specific |
| `wayne-turner.prompts.json` | ~25 | Wayne Turner lens-specific |
| `stage-prompts.ts` | ~10 | Stage-based generation |

**Total:** ~70 prompts with full PromptObject schema including:
- `targeting` with stages, entropyWindow, lensIds, momentTriggers
- `topicAffinities` and `lensAffinities` with weights
- `variant` for visual styling

### Navigation Types

**Location:** `src/core/schema/stream.ts`

```typescript
interface JourneyFork {
  id: string;
  type: JourneyForkType;  // 'deep_dive' | 'pivot' | 'apply' | 'challenge'
  label: string;
  queryPayload?: string;  // This becomes executionPrompt
  targetWaypoint?: string;
}
```

**NavigationBlock** already exists and renders JourneyFork[] with proper styling.

---

## Part 2: What's Missing (CREATE THESE)

### Gap 1: ContextState Aggregation Hook

**Problem:** No hook to aggregate EngagementContext → ContextState

The engagement machine has the data, but no hook converts it to ContextState format.

**Solution:** Create `useContextState.ts`

### Gap 2: Navigation Prompts Hook

**Problem:** No hook connects selectPrompts() to UI components

**Solution:** Create `useNavigationPrompts.ts` that:
1. Gets ContextState via useContextState
2. Calls selectPrompts(libraryPrompts, context, options)
3. Converts PromptObject[] → JourneyFork[]
4. Returns forks for NavigationBlock

### Gap 3: PromptObject → JourneyFork Adapter

**Problem:** NavigationBlock expects JourneyFork[], not PromptObject[]

**Solution:** Create adapter function:
```typescript
function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    type: inferForkType(prompt),
    label: prompt.label,
    queryPayload: prompt.executionPrompt
  };
}
```

### Gap 4: ResponseBlock Integration

**Problem:** NavigationBlock not wired to use 4D-aware prompts

**Solution:** Modify ResponseBlock to:
1. Call useNavigationPrompts()
2. Render NavigationBlock with returned forks
3. Handle auto-submit on click

### Gap 5: Feature Flag

**Solution:** Add `INLINE_NAVIGATION_PROMPTS` flag for safe rollout.

---

## Part 3: What Already Works (PRESERVE)

| Component | Status | Notes |
|-----------|--------|-------|
| selectPrompts() | ✅ Ready | Full filter→score→rank pipeline |
| PromptObject schema | ✅ Ready | Complete targeting, affinities |
| Prompt library | ✅ Ready | 70 prompts with proper schema |
| NavigationBlock | ✅ Ready | Renders forks with styling |
| FORK_SELECTED event | ✅ Ready | Event type exists in schema |
| useEventBridge | ✅ Ready | Can emit events |

---

## Part 4: What To Deprecate

| Component | Action | Reason |
|-----------|--------|--------|
| `usePromptSuggestions.ts` | Deprecate | Uses legacy Prompt type, not PromptObject |
| `scorePrompt.ts` | Deprecate | Parallel scoring, context-fields is canonical |
| Floating suggestion widget | Hide | Replaced by inline navigation |

---

## Part 5: Integration Strategy

### Data Flow (Corrected)

```
┌──────────────────────────────────────────────────────────────┐
│                  ResponseBlock                                │
│                       │                                       │
│                       ▼                                       │
│            useNavigationPrompts()                             │
│                       │                                       │
│           ┌───────────┼───────────┐                          │
│           ▼           ▼           ▼                          │
│   useContextState()  libraryPrompts  selectPrompts()         │
│   (4D aggregation)   (from data/)   (from scoring.ts)        │
│           │                               │                   │
│           └───────────┬───────────────────┘                  │
│                       ▼                                       │
│              ScoredPrompt[]                                   │
│                       │                                       │
│                       ▼                                       │
│              promptsToForks()                                 │
│              (adapter function)                               │
│                       │                                       │
│                       ▼                                       │
│              JourneyFork[]                                    │
│                       │                                       │
│                       ▼                                       │
│              NavigationBlock                                  │
│              (existing component)                             │
│                       │                                       │
│                       ▼ (on click)                           │
│              handleForkSelect()                               │
│              emit.forkSelected()                              │
│              submitQuery(executionPrompt)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 6: Test Baseline

```bash
npm test -- tests/unit/events/
# 180 tests passing (Sprint 3 complete)
```

Sprint 4 target: 195+ tests (add context-fields + navigation coverage)

---

## Summary

| Category | Status |
|----------|--------|
| 4D Context Fields | ✅ EXISTS — USE IT |
| Prompt selection | ✅ EXISTS — USE IT |
| Prompt library | ✅ EXISTS — USE IT |
| NavigationBlock | ✅ EXISTS — USE IT |
| ContextState hook | ❌ MISSING — CREATE |
| Navigation hook | ❌ MISSING — CREATE |
| Type adapter | ❌ MISSING — CREATE |
| ResponseBlock wiring | ❌ MISSING — MODIFY |

**The infrastructure exists. We're wiring it, not building it.**

---

*Audit corrected. Proceed to SPEC.md with proper architecture.*
