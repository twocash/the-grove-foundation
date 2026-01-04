# Repository Audit: kinetic-suggested-prompts-v1

**Sprint:** kinetic-suggested-prompts-v1  
**Auditor:** Claude (Foundation Loop v2)  
**Date:** 2025-01-04  
**Status:** ✅ Complete

---

## Executive Summary

The codebase has a **fully-built 4D Context Fields system** that is not wired to the UI. The prompt library contains ~60 prompts with proper `PromptObject` schema. The `NavigationBlock` component already exists and renders `JourneyFork[]` objects. The core work is **integration**, not creation.

**Key finding:** Two parallel scoring systems exist that must be reconciled. The canonical system is `src/core/context-fields/scoring.ts`.

---

## Phase 0: Pattern Check Results

### Patterns to Extend

| Pattern | Location | Extension Approach |
|---------|----------|-------------------|
| **Context Fields** | `src/core/context-fields/` | Wire `selectPrompts()` to response flow |
| **Engagement Machine** | `src/core/engagement/` | Extract `ContextState` from machine context |
| **Stream Schema** | `src/core/schema/stream.ts` | Use existing `JourneyFork` type |
| **NavigationBlock** | `components/Terminal/Stream/blocks/` | Already exists - just feed it data |
| **Prompt Library** | `src/data/prompts/` | Already has ~60 prompts |

### Patterns NOT to Create

- ❌ No new prompt scoring system (context-fields is canonical)
- ❌ No new navigation component (NavigationBlock exists)
- ❌ No new stream item types (ResponseStreamItem.navigation exists)
- ❌ No new engagement tracking (machine already tracks all 4D fields)

---

## System Inventory

### Context Fields System (CANONICAL)

```
src/core/context-fields/
├── types.ts          # PromptObject, ContextState, ContextTargeting
├── scoring.ts        # selectPrompts(), applyHardFilters(), rankPrompts()
├── generator.ts      # PromptGenerator (rule-based generation)
├── telemetry.ts      # Analytics tracking
└── index.ts          # Re-exports
```

**Status:** Complete, untested in integration. Ready to wire.

**Key Types:**
- `ContextState` — 4D aggregation (stage, entropy, lens, moments)
- `PromptObject` — First-class DEX object with targeting, affinities, stats
- `selectPrompts(prompts, context, options)` — Full selection pipeline

### Prompt Library

```
src/data/prompts/
├── base.prompts.json       # 15 universal prompts
├── dr-chiang.prompts.json  # ~20 lens-specific (Mung Chiang)
├── wayne-turner.prompts.json # ~25 lens-specific (Wayne Turner)
├── stage-prompts.ts        # Stage-based prompt generation
└── index.ts                # Loader with libraryPrompts export
```

**Total:** ~60 prompts with full `PromptObject` schema including:
- `label` (button text) vs `executionPrompt` (full query)
- `targeting` with stages, entropy windows, lens filters
- `topicAffinities` and `lensAffinities` with weights
- `variant` for visual styling (default/glow/subtle/urgent)

### Engagement Machine

```
src/core/engagement/
├── machine.ts        # XState machine with 4D state
├── types.ts          # EngagementContext, EngagementEvent
├── context.tsx       # EngagementProvider, useEngagement hook
├── hooks/
│   ├── useEntropyState.ts
│   ├── useLensState.ts
│   └── useJourneyState.ts
└── persistence.ts    # localStorage persistence
```

**EngagementContext tracks:**
- `lens` — Active lens ID
- `entropy` — Current entropy value (0-1)
- `topicExplorations` — Topics explored in session
- `streamHistory` — Full conversation history
- `hubsVisited`, `pivotCount` — Entropy inputs

**Missing:** Direct `ContextState` aggregation hook. Need to map EngagementContext → ContextState.

### Stream System

```
src/core/schema/stream.ts        # StreamItem types
components/Terminal/Stream/
├── StreamRenderer.tsx           # Polymorphic renderer
├── blocks/
│   ├── NavigationBlock.tsx     # Fork renderer (EXISTS)
│   ├── ResponseBlock.tsx       # Response with navigation
│   ├── QueryBlock.tsx          # User query
│   └── SystemBlock.tsx         # System messages
└── motion/                     # Animation variants
```

**ResponseStreamItem already has:**
```typescript
interface ResponseStreamItem {
  navigation?: JourneyFork[];  // ← THIS IS THE INTEGRATION POINT
  // ... other fields
}
```

**NavigationBlock already:**
- Groups forks by type (deep_dive, pivot, apply, challenge)
- Renders with icon + label
- Calls `onSelect(fork)` callback
- Has motion animations

### Legacy Prompt System (TO DEPRECATE)

```
src/explore/hooks/usePromptSuggestions.ts  # Uses legacy Prompt type
src/explore/utils/scorePrompt.ts           # Parallel scoring algorithm
```

**Issue:** Uses `Prompt` type from `@core/schema/prompt` which differs from `PromptObject`. Must deprecate or reconcile.

---

## Integration Gaps

### Gap 1: ContextState Aggregation

**Problem:** No hook to aggregate `EngagementContext` → `ContextState`

**Current state in machine:**
```typescript
// EngagementContext has:
lens: string | null;
entropy: number;
topicExplorations: TopicExploration[];
streamHistory: StreamItem[];
```

**ContextState needs:**
```typescript
interface ContextState {
  stage: Stage;               // Need to compute from session
  entropy: number;            // ✅ Available
  activeLensId: string | null; // ✅ Available
  activeMoments: string[];    // Need moment evaluator
  interactionCount: number;   // streamHistory.length
  topicsExplored: string[];   // Extract from topicExplorations
  sproutsCaptured: number;    // From sproutCaptures.length
  offTopicCount: number;      // Need tracking
}
```

### Gap 2: PromptObject → JourneyFork Conversion

**Problem:** NavigationBlock expects `JourneyFork[]`, not `PromptObject[]`

**JourneyFork shape:**
```typescript
interface JourneyFork {
  id: string;
  label: string;
  type: JourneyForkType; // 'deep_dive' | 'pivot' | 'apply' | 'challenge'
  targetId?: string;
  queryPayload?: string;  // ← This should be executionPrompt
  context?: string;
}
```

**Conversion needed:**
```typescript
function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    label: prompt.label,
    type: inferForkType(prompt), // from tags or variant
    queryPayload: prompt.executionPrompt,
    context: prompt.description
  };
}
```

### Gap 3: Navigation Injection

**Problem:** Where to call `selectPrompts()` and inject results?

**Current flow:**
1. `FINALIZE_RESPONSE` action parses content
2. `parseNavigation(content)` extracts forks from markdown
3. Sets `navigation` on ResponseStreamItem

**Options:**
- **A:** Post-finalization hook that merges library prompts with parsed forks
- **B:** Replace `parseNavigation()` with 4D selector (loses markdown forks)
- **C:** Hybrid - parsed forks + library prompts merged

**Recommendation:** Option A — post-processing that adds library prompts if no navigation parsed.

### Gap 4: Fork Type Inference

**Problem:** `PromptObject` has `variant`, but `JourneyFork` expects `type`

**Mapping strategy:**
- `baseWeight > 85` or `variant === 'glow'` → `deep_dive`
- `topicAffinities.length > 0` → `pivot`
- `tags.includes('synthesis')` or `variant === 'subtle'` → `apply`
- `entropyWindow.min > 0.7` → `challenge` (stabilization)

---

## File Inventory

### Files to Create

| File | Purpose |
|------|---------|
| `src/explore/hooks/useNavigationPrompts.ts` | 4D context → prompt selection |
| `src/core/context-fields/adapters.ts` | PromptObject → JourneyFork conversion |
| `src/core/context-fields/useContextState.ts` | Aggregate EngagementContext → ContextState |

### Files to Modify

| File | Changes |
|------|---------|
| `src/core/engagement/machine.ts` | Add navigation injection in `finalizeResponse` |
| `components/Terminal/Stream/blocks/NavigationBlock.tsx` | Add variant-based styling |
| `components/Terminal/TerminalChat.tsx` | Wire fork selection to auto-submit |

### Files to Deprecate

| File | Action |
|------|--------|
| `src/explore/hooks/usePromptSuggestions.ts` | Mark deprecated, redirect to new hook |
| `src/explore/utils/scorePrompt.ts` | Mark deprecated, context-fields is canonical |

---

## Technical Debt Identified

1. **Dual Scoring Systems**
   - `src/core/context-fields/scoring.ts` (canonical)
   - `src/explore/utils/scorePrompt.ts` (legacy)
   - Action: Deprecate legacy, migrate consumers

2. **Stage Calculation**
   - No explicit stage tracking in engagement machine
   - Currently inferred from journey state
   - Action: Add stage field or calculation hook

3. **Moment Evaluation**
   - `moment-evaluator.ts` exists but may not populate `activeMoments`
   - Action: Verify moment flow or add explicit tracking

4. **Floating Suggestion Widget**
   - Location unknown (not found in audit)
   - Action: Find and deprecate during implementation

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing navigation | High | Medium | Feature flag for rollout |
| Performance regression | Medium | Low | Memoize `selectPrompts()` |
| Type mismatch errors | Medium | Medium | Strict PromptObject→JourneyFork adapter |
| Stage calculation errors | Low | Medium | Default to 'exploration' if unknown |

---

## Recommendations

1. **Start with useContextState hook** — Enables testing of scoring without UI changes
2. **Add adapter layer** — Clean PromptObject → JourneyFork conversion
3. **Wire to finalizeResponse** — Minimal change to machine
4. **Feature flag navigation** — Allow rollback without code changes
5. **Keep parsed forks** — Merge with library prompts, don't replace

---

## Next: SPEC.md

With audit complete, proceed to specification with:
- Live Status block
- Attention Anchor block
- Clear acceptance criteria from REQUIREMENTS.md
- Explicit scope boundaries

