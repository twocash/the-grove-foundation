# Kinetic Suggested Prompts v1 — Specification (CORRECTED)

**Sprint:** kinetic-suggested-prompts-v1  
**Depends On:** bedrock-event-integration-v1 (✅ Complete)  
**Date:** January 4, 2026  
**Sprint Type:** Feature (Explore Experience)  
**Est. Duration:** 1 day

---

## Constitutional Reference

- [x] `The_Trellis_Architecture__First_Order_Directives.md` — DEX standards
- [x] `docs/sprints/kinetic-suggested-prompts-v1/REQUIREMENTS.md` — Canonical vision
- [x] `src/core/context-fields/` — 4D scoring system (USE THIS)
- [x] `src/data/prompts/` — Prompt library (USE THIS)
- [x] `src/core/schema/stream.ts` — JourneyFork type

---

## Overview

Wire the **existing** 4D Context Fields system to inline navigation prompts. This sprint is about **integration**, not building new infrastructure.

**What exists:**
- ContextState with stage, entropy, lens, moments
- selectPrompts() with hard filters + soft scoring
- 70 prompts in library with full PromptObject schema
- NavigationBlock component for rendering forks

**What we create:**
- useContextState() hook to aggregate 4D state
- useNavigationPrompts() hook to select + convert
- PromptObject → JourneyFork adapter
- ResponseBlock integration

---

## Goals

- [ ] Create `useContextState` hook aggregating EngagementContext → ContextState
- [ ] Create `useNavigationPrompts` hook calling selectPrompts() + adapter
- [ ] Create `promptToFork` adapter converting PromptObject → JourneyFork
- [ ] Integrate NavigationBlock into ResponseBlock
- [ ] Auto-submit executionPrompt on fork click
- [ ] Emit FORK_SELECTED event on click
- [ ] Feature flag: `INLINE_NAVIGATION_PROMPTS`
- [ ] Deprecate legacy usePromptSuggestions hook

## Non-Goals

- Creating new scoring algorithm (use existing selectPrompts)
- Creating new prompt schema (use existing PromptObject)
- LLM-generated prompts (v2)
- <navigation> block parsing (v2)

---

## DEX Compliance Matrix

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Prompts in JSON files. selectPrompts() config-driven. |
| Capability Agnosticism | ✅ | No LLM calls. Works with any model. |
| Provenance as Infrastructure | ✅ | FORK_SELECTED event with full context. |
| Organic Scalability | ✅ | Add prompts to JSON. Add fork types to union. |

---

## Architecture

### Data Flow

```
EngagementContext (XState)
         │
         ▼
  useContextState()           libraryPrompts
  (4D aggregation)            (from data/)
         │                         │
         └──────────┬──────────────┘
                    ▼
           selectPrompts()
           (from scoring.ts)
                    │
                    ▼
            ScoredPrompt[]
                    │
                    ▼
           promptsToForks()
           (adapter)
                    │
                    ▼
            JourneyFork[]
                    │
                    ▼
           NavigationBlock
           (existing component)
                    │
                    ▼ (click)
           handleForkSelect()
           • emit.forkSelected()
           • submitQuery(executionPrompt)
```

### Fork Type Inference

Map PromptObject characteristics → JourneyForkType:

| Condition | Fork Type |
|-----------|-----------|
| `entropyWindow.min > 0.6` | `challenge` (stabilization) |
| `topicAffinities.length > 0` | `pivot` (connection) |
| `tags.includes('synthesis')` | `apply` (practical) |
| Default | `deep_dive` (exploration) |

---

## Epics

### Epic 1: Context State Hook (2 hrs)

**Goal:** Aggregate EngagementContext → ContextState

#### Story 1.1: Create useContextState.ts

**File:** `src/core/context-fields/useContextState.ts`

```typescript
import { useMemo } from 'react';
import { useEngagement } from '@core/engagement';
import type { ContextState, Stage } from './types';
import { mapSessionStageToStage } from './types';

export function useContextState(): ContextState {
  const { state } = useEngagement();
  
  return useMemo(() => ({
    stage: computeStage(state),
    entropy: state.context.entropy ?? 0,
    activeLensId: state.context.lens ?? null,
    activeMoments: evaluateMoments(state),
    interactionCount: state.context.streamHistory?.length ?? 0,
    topicsExplored: extractTopics(state),
    sproutsCaptured: state.context.sproutCaptures?.length ?? 0,
    offTopicCount: 0
  }), [state]);
}

function computeStage(state): Stage {
  const count = state.context.streamHistory?.length ?? 0;
  if (count === 0) return 'genesis';
  if (count < 3) return 'exploration';
  if (state.context.sproutCaptures?.length > 0) return 'advocacy';
  return 'synthesis';
}

function evaluateMoments(state): string[] {
  const moments: string[] = [];
  if ((state.context.entropy ?? 0) > 0.7) moments.push('high_entropy');
  if ((state.context.streamHistory?.length ?? 0) === 0) moments.push('first_visit');
  return moments;
}

function extractTopics(state): string[] {
  return state.context.topicExplorations?.map(t => t.topicId) ?? [];
}
```

**Acceptance Criteria:**
- [ ] Returns valid ContextState from engagement machine
- [ ] Stage computed from interaction count
- [ ] Entropy passed through
- [ ] Lens ID passed through
- [ ] Moments evaluated (high_entropy, first_visit)

### Epic 2: Navigation Prompts Hook (2 hrs)

**Goal:** Wire selectPrompts() to NavigationBlock

#### Story 2.1: Create promptToFork adapter

**File:** `src/core/context-fields/adapters.ts`

```typescript
import type { PromptObject, JourneyFork, JourneyForkType } from './types';

export function inferForkType(prompt: PromptObject): JourneyForkType {
  const { targeting, topicAffinities, tags, variant } = prompt;
  
  // High entropy = challenge (stabilization)
  if (targeting.entropyWindow?.min && targeting.entropyWindow.min > 0.6) {
    return 'challenge';
  }
  
  // Urgent variant = challenge
  if (variant === 'urgent') return 'challenge';
  
  // Topic connections = pivot
  if (topicAffinities.length > 0) return 'pivot';
  
  // Synthesis/apply tags
  const applyTags = ['synthesis', 'reflection', 'action', 'contribution'];
  if (tags.some(t => applyTags.includes(t))) return 'apply';
  
  // Default
  return 'deep_dive';
}

export function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    type: inferForkType(prompt),
    label: prompt.label,
    queryPayload: prompt.executionPrompt
  };
}

export function promptsToForks(prompts: PromptObject[]): JourneyFork[] {
  return prompts.map(promptToFork);
}
```

#### Story 2.2: Create useNavigationPrompts hook

**File:** `src/explore/hooks/useNavigationPrompts.ts`

```typescript
import { useMemo } from 'react';
import { useContextState } from '@core/context-fields/useContextState';
import { selectPrompts } from '@core/context-fields/scoring';
import { promptsToForks } from '@core/context-fields/adapters';
import { libraryPrompts } from '@data/prompts';
import type { JourneyFork } from '@core/schema/stream';

export interface UseNavigationPromptsOptions {
  maxPrompts?: number;
  minScore?: number;
}

export interface NavigationPromptsResult {
  forks: JourneyFork[];
  isReady: boolean;
}

export function useNavigationPrompts(
  options: UseNavigationPromptsOptions = {}
): NavigationPromptsResult {
  const { maxPrompts = 3, minScore = 1.0 } = options;
  const context = useContextState();
  
  const forks = useMemo(() => {
    const scored = selectPrompts(libraryPrompts, context, { 
      maxPrompts, 
      minScore 
    });
    return promptsToForks(scored.map(s => s.prompt));
  }, [context, maxPrompts, minScore]);
  
  return {
    forks,
    isReady: true
  };
}
```

**Acceptance Criteria:**
- [ ] Calls selectPrompts with ContextState
- [ ] Converts to JourneyFork[]
- [ ] Returns up to maxPrompts forks
- [ ] Memoized for performance

### Epic 3: ResponseBlock Integration (1.5 hrs)

**Goal:** Render NavigationBlock after response completes

#### Story 3.1: Add feature flag

**File:** `src/config/features.ts`

```typescript
export const FEATURES = {
  // ...
  INLINE_NAVIGATION_PROMPTS: true,
  FLOATING_SUGGESTION_WIDGET: false  // Deprecate
};
```

#### Story 3.2: Modify ResponseBlock

**File:** `src/components/explore/stream/ResponseBlock.tsx`

```diff
+ import { FEATURES } from '@config/features';
+ import { useNavigationPrompts } from '@explore/hooks/useNavigationPrompts';
+ import { useEventBridge } from '@core/events/hooks';

  export const ResponseBlock: React.FC<ResponseBlockProps> = ({
    item,
    onForkSelect,
+   onPromptSubmit
  }) => {
+   const { forks } = FEATURES.INLINE_NAVIGATION_PROMPTS 
+     ? useNavigationPrompts({ maxPrompts: 3 })
+     : { forks: [] };
+   
+   const { emit } = useEventBridge();
+   
+   const handleForkSelect = (fork: JourneyFork) => {
+     // Emit event for tracking
+     emit.forkSelected(fork.id, fork.type, fork.label, item.id);
+     // Auto-submit the executionPrompt
+     onPromptSubmit?.(fork.queryPayload ?? fork.label);
+   };
+   
+   // Merge: prefer parsed navigation, fallback to 4D prompts
+   const navigationForks = item.navigation?.length 
+     ? item.navigation 
+     : forks;

    return (
      <motion.div ...>
        {/* Response content */}
        
-       {hasNavigation(item) && !item.isGenerating && (
+       {!item.isGenerating && navigationForks.length > 0 && (
          <NavigationBlock
-           forks={item.navigation!}
+           forks={navigationForks}
-           onSelect={onForkSelect}
+           onSelect={handleForkSelect}
          />
        )}
      </motion.div>
    );
  };
```

**Acceptance Criteria:**
- [ ] NavigationBlock renders after response
- [ ] Uses 4D-selected forks when no parsed navigation
- [ ] Click emits FORK_SELECTED event
- [ ] Click calls onPromptSubmit with executionPrompt

### Epic 4: Event Bridge Extension (0.5 hrs)

**Goal:** Add forkSelected to EventBridgeEmit

#### Story 4.1: Add forkSelected method

**File:** `src/core/events/hooks/useEventBridge.ts`

Add to EventBridgeEmit interface:

```typescript
forkSelected: (
  forkId: string, 
  forkType: string, 
  label: string, 
  responseId: string
) => void;
```

Implementation:
```typescript
forkSelected: (forkId, forkType, label, responseId) => {
  if (isNewSystemEnabled && newDispatch) {
    newDispatch({
      type: 'FORK_SELECTED',
      forkId,
      forkType,
      label,
      responseId,
      ...baseAttribution
    });
  }
  // Legacy dual-write if needed
}
```

### Epic 5: Deprecation (0.5 hrs)

**Goal:** Mark legacy hooks as deprecated

#### Story 5.1: Deprecate usePromptSuggestions

**File:** `src/explore/hooks/usePromptSuggestions.ts`

```typescript
/**
 * @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
 * This hook uses the legacy Prompt type. The new hook uses the
 * canonical Context Fields system with 4D targeting.
 * 
 * Sprint: kinetic-suggested-prompts-v1
 */
export function usePromptSuggestions(...) {
  console.warn('[DEPRECATED] usePromptSuggestions - use useNavigationPrompts');
  // ... existing implementation
}
```

### Epic 6: Tests (1.5 hrs)

**Goal:** Coverage for new hooks

#### Story 6.1: Test useContextState

```typescript
describe('useContextState', () => {
  it('returns genesis stage when no interactions', () => {...});
  it('returns exploration stage with 1-2 interactions', () => {...});
  it('returns synthesis stage with 5+ interactions', () => {...});
  it('includes high_entropy moment when entropy > 0.7', () => {...});
  it('passes through lens ID from engagement', () => {...});
});
```

#### Story 6.2: Test useNavigationPrompts

```typescript
describe('useNavigationPrompts', () => {
  it('returns 3 forks by default', () => {...});
  it('respects maxPrompts option', () => {...});
  it('converts PromptObject to JourneyFork', () => {...});
  it('infers fork type from entropy window', () => {...});
  it('infers fork type from topic affinities', () => {...});
});
```

#### Story 6.3: Test integration

```typescript
describe('ResponseBlock with NavigationBlock', () => {
  it('renders forks after response completes', () => {...});
  it('calls onPromptSubmit with executionPrompt on click', () => {...});
  it('emits FORK_SELECTED event on click', () => {...});
});
```

**Acceptance Criteria:**
- [ ] 15+ new tests
- [ ] All existing 180 tests pass
- [ ] 195+ total tests

---

## File Summary

### Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/core/context-fields/useContextState.ts` | 4D aggregation hook | ~50 |
| `src/core/context-fields/adapters.ts` | PromptObject → JourneyFork | ~40 |
| `src/explore/hooks/useNavigationPrompts.ts` | Selection + conversion | ~40 |
| `tests/unit/context-fields/` | Tests | ~150 |

### Modify

| File | Changes |
|------|---------|
| `src/core/context-fields/index.ts` | Export useContextState, adapters |
| `src/explore/hooks/index.ts` | Export useNavigationPrompts |
| `src/components/explore/stream/ResponseBlock.tsx` | Wire NavigationBlock |
| `src/core/events/hooks/useEventBridge.ts` | Add forkSelected |
| `src/config/features.ts` | Add feature flags |

### Deprecate

| File | Action |
|------|--------|
| `src/explore/hooks/usePromptSuggestions.ts` | @deprecated annotation |
| `src/explore/utils/scorePrompt.ts` | @deprecated annotation |

---

## Build Gates

### After Epic 1
```bash
npx tsc --noEmit
```

### After Epic 2
```bash
npm test -- tests/unit/context-fields/
```

### After Epic 3
```bash
npm run build
npm run dev # manual verification
```

### Sprint Complete
```bash
npm run build
npm test
npx tsc --noEmit
# 195+ tests passing
```

---

## Success Criteria

- [ ] useContextState aggregates 4D state correctly
- [ ] useNavigationPrompts calls existing selectPrompts
- [ ] NavigationBlock renders 4D-selected forks
- [ ] Click auto-submits executionPrompt
- [ ] Click emits FORK_SELECTED event
- [ ] Feature flag controls rollout
- [ ] Legacy hooks deprecated
- [ ] 195+ tests passing

---

*Generated by Foundation Loop — Using EXISTING 4D Context Fields infrastructure*
