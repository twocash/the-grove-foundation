# SPEC.md: Journey System v2 Fix
**Sprint**: journey-system-v2  
**Created**: 2024-12-27  
**Status**: DRAFT - Awaiting Jim's decision on type strategy

---

## Problem Summary

Journey pills in Terminal suggested prompts don't work because:

1. **Registry Empty**: `getJourneyById()` returns undefined - the 6 journeys referenced in `stage-prompts.ts` aren't in the TypeScript registry
2. **Handler Incomplete**: Even if registry worked, `engStartJourney()` (XState) is never called, only `emit.journeyStarted()` (EngagementBus)
3. **Type Mismatch**: XState expects `journey.steps`, but schema defines `journey.waypoints`

---

## Decision Required: Type Strategy

### Option A: Use Engagement Types (Recommended for Speed)

Convert JSON journeys to engagement format with `steps`:

```typescript
// src/core/engagement/types.ts (keep as-is)
interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}
```

**Pros**: No changes to XState machine  
**Cons**: Schema types become orphaned

### Option B: Use Schema Types (Better Architecture)

Update XState machine to use `waypoints`:

```typescript
// Update machine.ts line 32
journeyTotal: event.journey.waypoints.length,
```

**Pros**: Single source of truth  
**Cons**: More files to touch

### Jim's Call: Which approach?

---

## Implementation Plan (Assuming Option A)

### Phase 1: Fix Journey Registry (P0)

**File**: `src/data/journeys/index.ts`

Add all 6 journeys with engagement-compatible types:

```typescript
// src/data/journeys/index.ts
import type { Journey } from '../../core/engagement/types';

// Convert JSON journey definitions to engagement types
const simulationJourney: Journey = {
  id: 'simulation',
  name: 'The Ghost in the Machine',
  hubId: 'meta-philosophy',
  steps: [
    { id: 'sim-hook', title: 'Wait. Where are we, exactly?', content: '...' },
    { id: 'sim-split', title: 'The invisible line in your own head.', content: '...' },
    { id: 'sim-observer', title: 'The thing that watches you read this.', content: '...' },
    { id: 'sim-recursion', title: 'The loop closes.', content: '...' },
    { id: 'sim-proof', title: 'You are the prototype.', content: '...' },
  ],
};

// ... similar for stakes, ratchet, diary, architecture, emergence

export const journeys: Journey[] = [
  simulationJourney,
  stakesJourney,
  ratchetJourney,
  diaryJourney,
  architectureJourney,
  emergenceJourney,
];

export function getJourneyById(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}
```

### Phase 2: Fix Click Handler (P0)

**File**: `components/Terminal.tsx`

Lines 1090-1099, add `engStartJourney()` call:

```typescript
onPromptClick={(prompt, command, journeyId) => {
  if (journeyId) {
    const journey = getJourneyById(journeyId);
    if (journey) {
      // Update EngagementBus (telemetry)
      emit.journeyStarted(journeyId, journey.steps.length);
      // Update XState machine (state transition)
      engStartJourney(journey);
    } else {
      console.warn(`[Terminal] Journey not found: ${journeyId}`);
      // Fallback: send as regular prompt
      handleSend(prompt);
    }
  } else {
    command ? handleSend(command) : handleSend(prompt);
  }
}}
```

Same fix needed at line 1314 (second Terminal rendering mode).

### Phase 3: Verify State Transitions

After fix, verify:
1. Console shows `[JOURNEY_STARTED]` from EngagementBus
2. XState transitions: `session.lensActive` → `session.journeyActive`
3. Journey UI appears (JourneyNav, progress indicator)

---

## Files to Modify

| File | Change | Effort |
|------|--------|--------|
| `src/data/journeys/index.ts` | Add 6 journeys | Medium |
| `components/Terminal.tsx` | Add engStartJourney() calls (2 locations) | Small |

---

## Out of Scope (This Sprint)

1. **WaveformCollapse crash** - Needs reproduction case
2. **Re-render optimization** - Separate sprint
3. **Declarative migration** - TD-001, separate sprint
4. **Reconcile schema types** - TD-002, separate sprint

---

## Test Plan

### Manual Testing
1. Load Terminal with any lens selected
2. Click "🗺️ The Ghost in the Machine" pill
3. Verify journey UI appears
4. Verify journey progress works
5. Repeat for all 6 journey pills

### Console Verification
```
[JOURNEY_STARTED] simulation
[XState] session.lensActive → session.journeyActive
```

---

## Questions for Jim

1. **Type Strategy**: Option A (engagement types) or Option B (schema types)?
2. **Content Source**: Should journey step content come from JSON or be hardcoded?
3. **Fallback Behavior**: If journey not found, send as regular prompt or show error?
4. **Scope Confirmation**: Is fixing the 2 bugs (registry + handler) sufficient for this sprint?
