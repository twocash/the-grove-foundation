# ARCHITECTURE: kinetic-suggested-prompts-v1

**Sprint:** kinetic-suggested-prompts-v1  
**Architect:** Claude (Foundation Loop v2)  
**Created:** 2025-01-04  

---

## Overview

This architecture wires the existing 4D Context Fields system to the existing NavigationBlock component. No new UI paradigms—just plumbing.

---

## DEX Compliance

### Declarative Sovereignty

Prompt behavior is defined in `*.prompts.json` files:
- `targeting` specifies when prompts surface (stages, entropy, lenses)
- `baseWeight` and affinities control ranking
- Non-technical users can modify JSON to change behavior

### Capability Agnosticism

The selection algorithm (`selectPrompts`) is pure function:
- No LLM calls required for prompt selection
- Works offline with cached prompts
- No model-specific dependencies

### Provenance

Every prompt has `author`, `source`, and `created` fields:
- `author: 'system'` for library prompts
- `source: 'library' | 'generated' | 'user'`
- Stats track impressions and selections

### Organic Scalability

Architecture supports growth:
- Add prompts to JSON without code changes
- Add lenses with lens-specific prompt files
- Add targeting dimensions in ContextTargeting type

---

## File Structure

```
src/
├── core/
│   └── context-fields/
│       ├── types.ts            # ContextState, PromptObject (existing)
│       ├── scoring.ts          # selectPrompts (existing)
│       ├── adapters.ts         # NEW: PromptObject → JourneyFork
│       └── useContextState.ts  # NEW: Aggregate EngagementContext
│
├── data/
│   └── prompts/
│       ├── index.ts            # libraryPrompts export (existing)
│       └── *.prompts.json      # Prompt definitions (existing)
│
└── explore/
    └── hooks/
        └── useNavigationPrompts.ts  # NEW: Selection hook

components/
└── Terminal/
    └── Stream/
        └── blocks/
            ├── NavigationBlock.tsx  # Existing, minor styling updates
            └── ResponseBlock.tsx    # Modify to use hook
```

---

## Type Definitions

### New: adapters.ts

```typescript
// src/core/context-fields/adapters.ts

import type { PromptObject } from './types';
import type { JourneyFork, JourneyForkType } from '@core/schema/stream';

/**
 * Convert PromptObject to JourneyFork for NavigationBlock
 */
export function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    label: prompt.label,
    type: inferForkType(prompt),
    queryPayload: prompt.executionPrompt,
    context: prompt.description
  };
}

/**
 * Infer JourneyForkType from PromptObject characteristics
 */
export function inferForkType(prompt: PromptObject): JourneyForkType {
  const { targeting, tags, topicAffinities, variant } = prompt;
  
  // High entropy prompts are challenges (stabilization)
  if (targeting.entropyWindow?.min !== undefined && targeting.entropyWindow.min > 0.6) {
    return 'challenge';
  }
  
  // Variant overrides
  if (variant === 'urgent') return 'challenge';
  if (variant === 'subtle') return 'apply';
  
  // Topic-connected prompts are pivots
  if (topicAffinities.length > 0) return 'pivot';
  
  // Synthesis/reflection prompts are apply
  const applyTags = ['synthesis', 'reflection', 'contribution', 'action'];
  if (tags.some(t => applyTags.includes(t))) return 'apply';
  
  // Default: deep dive
  return 'deep_dive';
}

/**
 * Batch convert prompts to forks
 */
export function promptsToForks(prompts: PromptObject[]): JourneyFork[] {
  return prompts.map(promptToFork);
}
```

### New: useContextState.ts

```typescript
// src/core/context-fields/useContextState.ts

import { useMemo } from 'react';
import { useSelector } from '@xstate/react';
import { useEngagement } from '@core/engagement';
import type { ContextState, Stage } from './types';

/**
 * Map session state to Stage
 */
function computeStage(interactionCount: number, sproutCount: number, journeyActive: boolean): Stage {
  if (interactionCount === 0) return 'genesis';
  if (journeyActive) return 'exploration';
  if (sproutCount > 0) return 'advocacy';
  if (interactionCount >= 5) return 'synthesis';
  return 'exploration';
}

/**
 * Hook to aggregate EngagementContext into ContextState
 */
export function useContextState(): ContextState {
  const { actor } = useEngagement();
  
  const contextState = useSelector(actor, (state) => {
    const ctx = state.context;
    const interactionCount = ctx.streamHistory.filter(i => i.type === 'query').length;
    const sproutCount = ctx.sproutCaptures.length;
    const journeyActive = ctx.journey !== null;
    
    return {
      stage: computeStage(interactionCount, sproutCount, journeyActive),
      entropy: ctx.entropy,
      activeLensId: ctx.lens,
      activeMoments: evaluateActiveMoments(ctx),
      interactionCount,
      topicsExplored: ctx.topicExplorations.map(t => t.topicId),
      sproutsCaptured: sproutCount,
      offTopicCount: 0  // TODO: Track in engagement machine
    } satisfies ContextState;
  });
  
  return contextState;
}

/**
 * Evaluate which moments are currently active
 */
function evaluateActiveMoments(ctx: EngagementContext): string[] {
  const moments: string[] = [];
  
  // High entropy moment
  if (ctx.entropy > ctx.entropyThreshold) {
    moments.push('high_entropy');
  }
  
  // First visit moment
  if (ctx.streamHistory.length === 0) {
    moments.push('first_visit');
  }
  
  // Repeat hub moment
  if (ctx.consecutiveHubRepeats > 2) {
    moments.push('stuck');
  }
  
  return moments;
}

// Re-export for convenience
export { type ContextState } from './types';
```

### New: useNavigationPrompts.ts

```typescript
// src/explore/hooks/useNavigationPrompts.ts

import { useMemo } from 'react';
import { useContextState } from '@core/context-fields/useContextState';
import { selectPrompts } from '@core/context-fields/scoring';
import { promptsToForks } from '@core/context-fields/adapters';
import { getActivePrompts } from '@data/prompts';
import type { JourneyFork } from '@core/schema/stream';

export interface UseNavigationPromptsOptions {
  maxPrompts?: number;
  minScore?: number;
}

export interface NavigationPromptsResult {
  forks: JourneyFork[];
  isLoading: boolean;
  contextState: ContextState;
}

/**
 * Hook for getting contextually-relevant navigation prompts
 * 
 * Uses 4D Context Fields system to select and rank prompts,
 * then converts to JourneyFork[] for NavigationBlock.
 */
export function useNavigationPrompts(
  options: UseNavigationPromptsOptions = {}
): NavigationPromptsResult {
  const { maxPrompts = 3, minScore = 0 } = options;
  
  const contextState = useContextState();
  const allPrompts = useMemo(() => getActivePrompts(), []);
  
  const forks = useMemo(() => {
    // Select prompts using 4D scoring
    const selected = selectPrompts(allPrompts, contextState, {
      maxPrompts,
      minScore
    });
    
    // Convert to JourneyFork format
    return promptsToForks(selected);
  }, [allPrompts, contextState, maxPrompts, minScore]);
  
  return {
    forks,
    isLoading: false,
    contextState
  };
}

export default useNavigationPrompts;
```

---

## Integration Sequence

### Option A: Hook in ResponseBlock (Recommended)

```tsx
// components/Terminal/Stream/blocks/ResponseBlock.tsx

import { useNavigationPrompts } from '@explore/hooks/useNavigationPrompts';

export const ResponseBlock: React.FC<ResponseBlockProps> = ({
  item,
  onForkSelect,
  onPromptSubmit,
  ...rest
}) => {
  // Get 4D-aware prompts
  const { forks: libraryForks } = useNavigationPrompts({ maxPrompts: 3 });
  
  // Merge: prefer parsed navigation, fallback to library
  const navigationForks = item.navigation?.length 
    ? item.navigation 
    : libraryForks;

  return (
    <motion.div ...>
      {/* ... response content ... */}
      
      {!item.isGenerating && navigationForks.length > 0 && (
        <NavigationBlock
          forks={navigationForks}
          onSelect={onForkSelect}
        />
      )}
    </motion.div>
  );
};
```

**Pros:**
- Minimal changes to existing code
- Hook manages all complexity
- Easy to test in isolation

**Cons:**
- Hook called for every response (performance)
- Navigation not persisted in stream history

### Option B: Injection in StreamRenderer

```tsx
// components/Terminal/Stream/StreamRenderer.tsx

export const StreamRenderer: React.FC<StreamRendererProps> = ({ items, ... }) => {
  const { forks } = useNavigationPrompts();
  
  // Find last completed response
  const lastResponse = items.filter(i => 
    i.type === 'response' && !i.isGenerating
  ).at(-1);
  
  return (
    <div>
      {items.map(item => (
        <StreamBlock key={item.id} item={item} ... />
      ))}
      {lastResponse && (
        <NavigationBlock forks={forks} onSelect={onForkSelect} />
      )}
    </div>
  );
};
```

**Pros:**
- Single hook call for entire stream
- Clear separation of concerns

**Cons:**
- Changes render structure
- Navigation outside response block

### Selected: Option A

ResponseBlock integration is more natural and matches existing pattern where responses own their navigation.

---

## Fork Selection Handler

The `USER.SELECT_FORK` event is already wired in the engagement machine. When a fork is selected:

```typescript
// In machine.ts (existing)
handleForkSelect: assign(({ context, event }) => {
  if (event.type !== 'USER.SELECT_FORK') return {};

  const forkQuery: QueryStreamItem = {
    id: generateId(),
    type: 'query',
    content: event.fork.queryPayload || event.fork.label,  // ← executionPrompt flows through
    timestamp: Date.now(),
    role: 'user',
    createdBy: 'user',
    intent: event.fork.type
  };

  return {
    currentStreamItem: forkQuery,
    streamHistory: [...context.streamHistory, forkQuery]
  };
});
```

**Auto-submit flow:**
1. User clicks ForkButton
2. `onSelect(fork)` called on NavigationBlock
3. Parent passes to `onForkSelect` prop
4. TerminalChat dispatches `USER.SELECT_FORK` event
5. Machine creates QueryStreamItem with `queryPayload` as content
6. TerminalChat triggers LLM call with new query

---

## Styling Updates

### NavigationBlock Variants

```css
/* In globals.css or component */

.fork-button {
  @apply px-4 py-2 rounded-full text-sm font-medium;
  @apply transition-all duration-200;
  @apply hover:scale-105 active:scale-95;
}

.fork-button--primary {
  @apply bg-[var(--chat-accent)] text-white;
  @apply hover:bg-[var(--chat-accent-hover)];
}

.fork-button--secondary {
  @apply bg-[var(--glass-bg)] text-[var(--glass-text)];
  @apply border border-[var(--glass-border)];
  @apply hover:bg-[var(--glass-bg-hover)];
}

.fork-button--tertiary {
  @apply bg-transparent text-[var(--glass-text-muted)];
  @apply hover:text-[var(--glass-text)];
}

.fork-button--quaternary {
  @apply bg-amber-500/20 text-amber-300;
  @apply border border-amber-500/30;
}
```

### Fork Type to Variant Mapping

| Fork Type | Visual Variant | Purpose |
|-----------|---------------|---------|
| `deep_dive` | primary (orange) | Main continuation |
| `pivot` | secondary (glass) | Topic connection |
| `apply` | tertiary (subtle) | Synthesis/action |
| `challenge` | quaternary (amber) | Stabilization |

---

## Error Handling

### No Prompts Match

```typescript
// In useNavigationPrompts
if (selected.length === 0 && contextState.stage !== 'genesis') {
  // Return fallback prompts
  return promptsToForks(getFallbackPrompts());
}
```

### Engagement Provider Missing

```typescript
// In useContextState
try {
  const { actor } = useEngagement();
  // ...
} catch {
  // Return default context state
  return DEFAULT_CONTEXT_STATE;
}
```

### Invalid Fork Data

```typescript
// In promptToFork
if (!prompt.executionPrompt) {
  console.warn(`Prompt ${prompt.id} missing executionPrompt, using label`);
  return {
    ...fork,
    queryPayload: prompt.label
  };
}
```

---

## Performance Considerations

### Memoization

```typescript
// In useNavigationPrompts
const allPrompts = useMemo(() => getActivePrompts(), []);

const forks = useMemo(() => {
  // Selection only runs when context changes
  const selected = selectPrompts(allPrompts, contextState, options);
  return promptsToForks(selected);
}, [allPrompts, contextState, maxPrompts, minScore]);
```

### Selector Optimization

```typescript
// In useContextState - use XState selector for fine-grained updates
const contextState = useSelector(actor, selectContextState, {
  compare: shallowEqual
});
```

### Lazy Loading

```typescript
// Only load lens-specific prompts when lens active
const lensPrompts = useMemo(() => {
  if (!contextState.activeLensId) return [];
  return getLensPrompts(contextState.activeLensId);
}, [contextState.activeLensId]);
```

---

## Testing Approach

### Unit: Adapters

```typescript
describe('promptToFork', () => {
  it('maps all required fields', () => {
    const prompt = createMockPrompt({ id: 'test', label: 'Test', executionPrompt: 'Full query' });
    const fork = promptToFork(prompt);
    expect(fork.id).toBe('test');
    expect(fork.label).toBe('Test');
    expect(fork.queryPayload).toBe('Full query');
  });
});
```

### Unit: Fork Type Inference

```typescript
describe('inferForkType', () => {
  it('returns challenge for high entropy prompts', () => {
    const prompt = createMockPrompt({ targeting: { entropyWindow: { min: 0.7 } } });
    expect(inferForkType(prompt)).toBe('challenge');
  });
  
  it('returns pivot for topic-connected prompts', () => {
    const prompt = createMockPrompt({ topicAffinities: [{ topicId: 'x', weight: 1 }] });
    expect(inferForkType(prompt)).toBe('pivot');
  });
});
```

### Integration: Hook

```typescript
describe('useNavigationPrompts', () => {
  it('returns forks for current context', () => {
    const wrapper = ({ children }) => (
      <EngagementProvider>{children}</EngagementProvider>
    );
    const { result } = renderHook(() => useNavigationPrompts(), { wrapper });
    expect(result.current.forks.length).toBeGreaterThan(0);
  });
});
```

---

## Migration Path

1. **Add new files** (no existing code touched)
   - `adapters.ts`, `useContextState.ts`, `useNavigationPrompts.ts`

2. **Add feature flag**
   - `INLINE_NAVIGATION_PROMPTS: false` initially

3. **Wire hook to ResponseBlock** (behind flag)
   - Only renders NavigationBlock when flag enabled

4. **Test in staging**
   - Verify prompts surface correctly

5. **Enable flag**
   - `INLINE_NAVIGATION_PROMPTS: true`

6. **Deprecate floating widget**
   - `FLOATING_SUGGESTION_WIDGET: false`

---

## Next: MIGRATION_MAP.md

Document the exact sequence of file changes.

