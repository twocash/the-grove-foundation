# entropy-calculation-v1: EXECUTION PROMPT

**Sprint:** entropy-calculation-v1  
**Target:** Claude Code CLI  
**Repository:** `C:\GitHub\the-grove-foundation`

---

## Context

Entropy is a core engagement metric that measures conversation divergence. It's used by the Moment system to trigger offers like `entropy-journey-offer`. Currently, entropy is **always 0** because:

1. XState context has `entropy: 0` as initial value
2. `UPDATE_ENTROPY` event exists but is never sent
3. No calculation logic exists

The Moment evaluator already reads entropy correctly:
```typescript
// In useMoments.ts line 75
entropy: xstateContext.entropy,
```

We need to calculate and emit entropy values.

---

## Implementation Tasks

### Task 1: Create Entropy Calculator Module

**File:** `src/core/engine/entropyCalculator.ts` (NEW)

```typescript
// src/core/engine/entropyCalculator.ts
// Pure entropy calculation function
// Sprint: entropy-calculation-v1

export interface EntropyInputs {
  hubsVisited: string[];           // Unique hub IDs touched this session
  exchangeCount: number;           // Total queries sent
  pivotCount: number;              // Concept span clicks
  journeyWaypointsHit: number;     // Waypoints completed (if on journey)
  journeyWaypointsTotal: number;   // Total waypoints in journey (0 if no journey)
  consecutiveHubRepeats: number;   // Same hub hit back-to-back
}

/**
 * Calculate entropy (0.0 - 1.0) representing conversation divergence
 * 
 * High entropy = exploring many topics, jumping around
 * Low entropy = focused on one area, following journey
 * 
 * Formula components:
 * - Hub diversity: uniqueHubs / min(exchanges, 8) * 0.4
 * - Journey divergence: (1 - waypointsHit/total) * 0.3 or 0.5 baseline
 * - Pivot bonus: min(pivots * 0.15, 0.3) * 0.2
 * - Focus penalty: min(consecutiveRepeats * 0.1, 0.3) * 0.1
 */
export function calculateEntropy(inputs: EntropyInputs): number {
  const {
    hubsVisited,
    exchangeCount,
    pivotCount,
    journeyWaypointsHit,
    journeyWaypointsTotal,
    consecutiveHubRepeats
  } = inputs;

  // No exchanges yet = baseline entropy
  if (exchangeCount === 0) {
    return 0;
  }

  // Hub diversity: How many unique hubs relative to exchanges
  // Cap denominator at 8 to prevent entropy from dropping as conversation grows
  const uniqueHubs = hubsVisited.length;
  const normalizedExchanges = Math.min(exchangeCount, 8);
  const hubDiversity = normalizedExchanges > 0 
    ? Math.min(uniqueHubs / normalizedExchanges, 1.0)
    : 0;

  // Journey divergence: Are they following the path?
  // No journey = baseline 0.5, on journey = 1 - (progress%)
  let journeyDivergence = 0.5;
  if (journeyWaypointsTotal > 0) {
    journeyDivergence = 1 - (journeyWaypointsHit / journeyWaypointsTotal);
  }

  // Pivot bonus: Clicking concept spans signals exploration
  const pivotBonus = Math.min(pivotCount * 0.15, 0.3);

  // Focus penalty: Staying on same hub repeatedly
  const focusPenalty = Math.min(consecutiveHubRepeats * 0.1, 0.3);

  // Weighted combination
  const rawEntropy = 
    (hubDiversity * 0.4) +
    (journeyDivergence * 0.3) +
    (pivotBonus * 0.2) -
    (focusPenalty * 0.1);

  // Clamp to [0, 1]
  const entropy = Math.max(0, Math.min(1, rawEntropy));

  console.log('[Entropy] Calculated:', {
    inputs: { uniqueHubs, exchangeCount, pivotCount, journeyWaypointsHit, journeyWaypointsTotal, consecutiveHubRepeats },
    components: { hubDiversity, journeyDivergence, pivotBonus, focusPenalty },
    result: entropy.toFixed(3)
  });

  return entropy;
}
```

---

### Task 2: Add Hub Tracking to XState Context

**File:** `src/core/engagement/types.ts`

Add these fields to `EngagementContext` interface (around line 12):

```typescript
export interface EngagementContext {
  // ... existing fields ...

  // Hub tracking for entropy (Sprint: entropy-calculation-v1)
  hubsVisited: string[];
  lastHubId: string | null;
  consecutiveHubRepeats: number;
  pivotCount: number;
}
```

Update `initialContext` (around line 38):

```typescript
export const initialContext: EngagementContext = {
  // ... existing fields ...

  // Hub tracking for entropy (Sprint: entropy-calculation-v1)
  hubsVisited: [],
  lastHubId: null,
  consecutiveHubRepeats: 0,
  pivotCount: 0,
};
```

Add new events to `EngagementEvent` type (around line 52):

```typescript
export type EngagementEvent =
  // ... existing events ...
  // Hub tracking events (Sprint: entropy-calculation-v1)
  | { type: 'HUB_VISITED'; hubId: string }
  | { type: 'PIVOT_CLICKED' }
  | { type: 'RESET_HUB_TRACKING' };
```

---

### Task 3: Add Hub Tracking Actions to XState Machine

**File:** `src/core/engagement/machine.ts`

Add actions for hub tracking. Find the `actions` object and add:

```typescript
import { assign } from 'xstate';

// ... in the machine definition, actions section ...

hubVisited: assign({
  hubsVisited: ({ context, event }) => {
    if (event.type !== 'HUB_VISITED') return context.hubsVisited;
    const hubs = new Set(context.hubsVisited);
    hubs.add(event.hubId);
    return Array.from(hubs);
  },
  consecutiveHubRepeats: ({ context, event }) => {
    if (event.type !== 'HUB_VISITED') return context.consecutiveHubRepeats;
    return event.hubId === context.lastHubId
      ? context.consecutiveHubRepeats + 1
      : 0;
  },
  lastHubId: ({ context, event }) => {
    if (event.type !== 'HUB_VISITED') return context.lastHubId;
    return event.hubId;
  },
}),

pivotClicked: assign({
  pivotCount: ({ context }) => context.pivotCount + 1,
}),

updateEntropy: assign({
  entropy: ({ context, event }) => {
    if (event.type !== 'UPDATE_ENTROPY') return context.entropy;
    return event.value;
  },
}),
```

Make sure these events trigger the actions. In the machine's `on` section (global event handlers):

```typescript
on: {
  // ... existing handlers ...
  HUB_VISITED: { actions: 'hubVisited' },
  PIVOT_CLICKED: { actions: 'pivotClicked' },
  UPDATE_ENTROPY: { actions: 'updateEntropy' },
},
```

---

### Task 4: Add Emitters to useEngagementBus

**File:** `hooks/useEngagementBus.ts`

Find the `useEngagementEmit` function (around line 515) and add these emitters:

```typescript
export function useEngagementEmit() {
  const { emit } = useEngagementBus();

  return useMemo(() => ({
    // ... existing emitters ...

    // Hub tracking (Sprint: entropy-calculation-v1)
    hubVisited: (hubId: string) =>
      emit('HUB_VISITED', { hubId }),

    pivotClicked: () =>
      emit('PIVOT_CLICKED', {}),
  }), [emit]);
}
```

Also add the event types to `EngagementEventType` if needed in `types/engagement.ts`:

```typescript
export type EngagementEventType =
  | 'EXCHANGE_SENT'
  // ... existing ...
  | 'HUB_VISITED'
  | 'PIVOT_CLICKED';
```

---

### Task 5: Calculate and Emit Entropy in useKineticStream

**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`

Import the calculator:

```typescript
import { calculateEntropy, EntropyInputs } from '@core/engine/entropyCalculator';
```

After `emit.exchangeSent()` is called (when a response completes), add entropy calculation:

```typescript
// After response completes, calculate entropy
const snapshot = actor.getSnapshot();
const ctx = snapshot.context;

const entropyInputs: EntropyInputs = {
  hubsVisited: ctx.hubsVisited || [],
  exchangeCount: ctx.streamHistory.filter(i => i.type === 'query').length,
  pivotCount: ctx.pivotCount || 0,
  journeyWaypointsHit: ctx.journey?.completedWaypoints?.length ?? 0,
  journeyWaypointsTotal: ctx.journey?.waypoints?.length ?? 0,
  consecutiveHubRepeats: ctx.consecutiveHubRepeats || 0,
};

const newEntropy = calculateEntropy(entropyInputs);
actor.send({ type: 'UPDATE_ENTROPY', value: newEntropy });
```

Also, when a pivot (concept span) is clicked, emit the event:

```typescript
// In handleConceptClick or wherever pivot clicks are handled
actor.send({ type: 'PIVOT_CLICKED' });
```

---

### Task 6: Emit Hub ID from Server Response

**File:** `server.js`

In the chat endpoint, after `routeToHub()` determines the hub, include it in the response metadata:

```javascript
// After hub routing
const matchedHub = routeToHub(query, narrativeCollection);

// Include in response (if using streaming, emit as separate event)
// Or add to response metadata
res.json({
  // ... existing response ...
  hubId: matchedHub?.id || null,
});
```

In `useKineticStream`, when response completes, extract and emit:

```typescript
// When response completes with hub info
if (responseData.hubId) {
  actor.send({ type: 'HUB_VISITED', hubId: responseData.hubId });
}
```

---

## Verification

### Console Logging

After implementation, you should see in console:

```
[Entropy] Calculated: {
  inputs: { uniqueHubs: 2, exchangeCount: 3, pivotCount: 1, ... },
  components: { hubDiversity: 0.67, journeyDivergence: 0.5, pivotBonus: 0.15, focusPenalty: 0 },
  result: "0.518"
}
```

### Test Scenarios

1. **First exchange:** Entropy should be ~0.1-0.2
2. **5 exchanges, same hub:** Entropy should stay ~0.1-0.2 (focus penalty)
3. **5 exchanges, 5 different hubs:** Entropy should reach ~0.6-0.7
4. **Clicking concept spans:** Entropy should increase slightly each click

### Moment Trigger Test

After fixing entropy, revert the `entropy-journey-offer.moment.json` to use entropy trigger:

```json
"trigger": {
  "stage": ["EXPLORING", "ENGAGED"],
  "entropy": { "min": 0.4 }
}
```

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `src/core/engine/entropyCalculator.ts` | NEW |
| `src/core/engagement/types.ts` | MODIFY (add fields, events) |
| `src/core/engagement/machine.ts` | MODIFY (add actions, handlers) |
| `hooks/useEngagementBus.ts` | MODIFY (add emitters) |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | MODIFY (calculate entropy) |
| `server.js` | MODIFY (return hubId) |

---

## Build Gate

```bash
npm run build    # Must compile
npm test         # Unit tests pass
```

---

*Sprint: entropy-calculation-v1*
*Created: 2024-12-29*
