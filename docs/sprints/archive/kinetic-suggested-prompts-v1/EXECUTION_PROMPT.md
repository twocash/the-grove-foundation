# Kinetic Suggested Prompts v1 — Execution Prompt

**Sprint:** kinetic-suggested-prompts-v1  
**For:** Claude CLI execution  
**Date:** January 4, 2026

---

## Context

You are implementing Sprint 4 of the Grove Foundation project. This sprint wires the **existing** 4D Context Fields infrastructure to inline navigation prompts.

**CRITICAL:** The infrastructure EXISTS. You are INTEGRATING, not building new systems.

---

## What EXISTS (Use These)

### 4D Context Fields (`src/core/context-fields/`)
- `types.ts` — ContextState, PromptObject, ContextTargeting schemas
- `scoring.ts` — applyHardFilters(), calculateRelevance(), rankPrompts(), selectPrompts()
- `generator.ts` — PromptGenerator (rule-based)

### Prompt Library (`src/data/prompts/`)
- `base.prompts.json` — ~15 universal prompts
- `dr-chiang.prompts.json` — ~20 lens-specific
- `wayne-turner.prompts.json` — ~25 lens-specific
- `index.ts` — exports libraryPrompts

### Navigation Components
- `src/core/schema/stream.ts` — JourneyFork, JourneyForkType
- `components/Terminal/Stream/blocks/NavigationBlock.tsx` — renders forks

### Event System (Sprint 3)
- `src/core/events/hooks/useEventBridge.ts` — event emission
- FORK_SELECTED event type exists

---

## What to CREATE

### 1. useContextState.ts

**Path:** `src/core/context-fields/useContextState.ts`

Aggregate EngagementContext → ContextState:

```typescript
import { useMemo } from 'react';
import { useEngagement } from '@core/engagement';
import type { ContextState, Stage } from './types';

export function useContextState(): ContextState {
  const { actor } = useEngagement();
  
  // Use useSelector from @xstate/react to extract state
  const contextState = useSelector(actor, (state) => {
    const ctx = state.context;
    const interactionCount = ctx.streamHistory?.filter(i => i.type === 'query').length ?? 0;
    const sproutCount = ctx.sproutCaptures?.length ?? 0;
    
    return {
      stage: computeStage(interactionCount, sproutCount),
      entropy: ctx.entropy ?? 0,
      activeLensId: ctx.lens ?? null,
      activeMoments: evaluateMoments(ctx),
      interactionCount,
      topicsExplored: ctx.topicExplorations?.map(t => t.topicId) ?? [],
      sproutsCaptured: sproutCount,
      offTopicCount: 0
    } satisfies ContextState;
  });
  
  return contextState;
}

function computeStage(interactionCount: number, sproutCount: number): Stage {
  if (interactionCount === 0) return 'genesis';
  if (interactionCount < 5) return 'exploration';
  if (sproutCount > 0) return 'advocacy';
  return 'synthesis';
}

function evaluateMoments(ctx: any): string[] {
  const moments: string[] = [];
  if ((ctx.entropy ?? 0) > 0.7) moments.push('high_entropy');
  if ((ctx.streamHistory?.length ?? 0) === 0) moments.push('first_visit');
  return moments;
}
```

### 2. adapters.ts

**Path:** `src/core/context-fields/adapters.ts`

```typescript
import type { PromptObject } from './types';
import type { JourneyFork, JourneyForkType } from '@core/schema/stream';

export function inferForkType(prompt: PromptObject): JourneyForkType {
  const { targeting, topicAffinities, tags, variant } = prompt;
  
  if (targeting.entropyWindow?.min && targeting.entropyWindow.min > 0.6) {
    return 'challenge';
  }
  if (variant === 'urgent') return 'challenge';
  if (topicAffinities.length > 0) return 'pivot';
  
  const applyTags = ['synthesis', 'reflection', 'action', 'contribution'];
  if (tags?.some(t => applyTags.includes(t))) return 'apply';
  
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

### 3. useNavigationPrompts.ts

**Path:** `src/explore/hooks/useNavigationPrompts.ts`

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
    const scored = selectPrompts(libraryPrompts, context, { maxPrompts, minScore });
    return promptsToForks(scored.map(s => s.prompt));
  }, [context, maxPrompts, minScore]);
  
  return { forks, isReady: true };
}
```

### 4. Update ResponseBlock.tsx

**Path:** `components/Terminal/Stream/blocks/ResponseBlock.tsx`

Add hook integration:

```typescript
// At top of file
import { FEATURES } from '@config/features';
import { useNavigationPrompts } from '@explore/hooks/useNavigationPrompts';
import { useEventBridge } from '@core/events/hooks';

// Inside component
const { forks: libraryForks } = FEATURES.INLINE_NAVIGATION_PROMPTS 
  ? useNavigationPrompts({ maxPrompts: 3 })
  : { forks: [] };

const { emit } = useEventBridge();

const handleForkSelect = (fork: JourneyFork) => {
  emit.forkSelected(fork.id, fork.type, fork.label, item.id);
  onPromptSubmit?.(fork.queryPayload ?? fork.label);
};

// Merge: prefer parsed, fallback to library
const navigationForks = item.navigation?.length 
  ? item.navigation 
  : libraryForks;

// In render, use navigationForks instead of item.navigation
```

### 5. Add Feature Flags

**Path:** `src/config/features.ts`

```typescript
export const FEATURES = {
  // ... existing flags ...
  INLINE_NAVIGATION_PROMPTS: true,
  FLOATING_SUGGESTION_WIDGET: false
};
```

### 6. Add forkSelected to useEventBridge

**Path:** `src/core/events/hooks/useEventBridge.ts`

Add to EventBridgeEmit interface and implementation:

```typescript
forkSelected: (forkId: string, forkType: string, label: string, responseId: string) => {
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
}
```

### 7. Update Exports

**`src/core/context-fields/index.ts`:**
```typescript
export { useContextState } from './useContextState';
export * from './adapters';
// ... existing exports
```

**`src/explore/hooks/index.ts`:**
```typescript
export { useNavigationPrompts } from './useNavigationPrompts';
export type { UseNavigationPromptsOptions, NavigationPromptsResult } from './useNavigationPrompts';
```

### 8. Deprecate Legacy

**`src/explore/hooks/usePromptSuggestions.ts`:**
```typescript
/**
 * @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
 * Sprint: kinetic-suggested-prompts-v1
 */
export function usePromptSuggestions(...) {
  console.warn('[DEPRECATED] usePromptSuggestions - use useNavigationPrompts');
  // ... existing
}
```

---

## Tests to Create

**Path:** `tests/unit/context-fields/`

```typescript
// useContextState.test.tsx
describe('useContextState', () => {
  it('returns genesis stage when no interactions');
  it('returns exploration stage with 1-4 interactions');
  it('returns synthesis stage with 5+ interactions');
  it('returns advocacy stage when sprouts captured');
  it('includes high_entropy moment when entropy > 0.7');
  it('includes first_visit moment when no history');
  it('passes through lens ID from engagement');
});

// adapters.test.ts
describe('promptToFork', () => {
  it('infers deep_dive for default prompts');
  it('infers pivot for topic-connected prompts');
  it('infers apply for synthesis-tagged prompts');
  it('infers challenge for high-entropy prompts');
  it('infers challenge for urgent variant');
  it('converts executionPrompt to queryPayload');
});

// useNavigationPrompts.test.tsx
describe('useNavigationPrompts', () => {
  it('returns 3 forks by default');
  it('respects maxPrompts option');
  it('memoizes on context change');
});
```

---

## Build Gates

After each epic, run:

```bash
npx tsc --noEmit
npm test -- tests/unit/context-fields/
npm run build
```

Final verification:

```bash
npm run build
npm test
# Expect 195+ tests passing
```

---

## Success Criteria

- [ ] `useContextState` aggregates 4D state from EngagementMachine
- [ ] `useNavigationPrompts` calls existing `selectPrompts`
- [ ] `promptsToForks` converts PromptObject → JourneyFork
- [ ] NavigationBlock renders 4D-selected forks after response
- [ ] Click auto-submits executionPrompt
- [ ] Click emits FORK_SELECTED event
- [ ] Feature flag controls rollout
- [ ] Legacy hooks deprecated with warnings
- [ ] 195+ tests passing (15 new)
- [ ] Clean build

---

## DO NOT

- ❌ Create new scoring algorithm (use existing selectPrompts)
- ❌ Create new prompt schema (use existing PromptObject)
- ❌ Modify EngagementMachine internals
- ❌ Touch genesis/terminal routes
- ❌ Delete legacy hooks (deprecate only)

---

## Reference Documents

- `docs/sprints/kinetic-suggested-prompts-v1/REQUIREMENTS.md` — Vision
- `docs/sprints/kinetic-suggested-prompts-v1/SPEC.md` — Full spec
- `docs/sprints/kinetic-suggested-prompts-v1/ARCHITECTURE.md` — Data flow
- `docs/sprints/kinetic-suggested-prompts-v1/DECISIONS.md` — ADRs
- `src/core/context-fields/` — Existing 4D infrastructure

---

*Execute this sprint by wiring existing infrastructure. The hard work is done.*
