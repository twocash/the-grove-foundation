# Entropy Calculation Sprint

## Problem Statement

Entropy is a core engagement metric that should measure conversation complexity/divergence, but it's **never being calculated**. The value remains at its initial state of `0` throughout the session.

This breaks entropy-based moment triggers like `entropy-journey-offer` (temporarily patched to use exchange count instead).

## Current State

```typescript
// src/core/engagement/types.ts:40-41
entropy: 0,
entropyThreshold: 0.7,
```

- Initial entropy: `0`
- `SET_ENTROPY` event is defined in the XState machine but **never sent**
- No calculation logic exists anywhere in the codebase
- Moment triggers requiring `entropy: { min: X }` never fire

## What Entropy Should Represent

Entropy measures **conversation divergence** - how much the user is exploring vs. staying focused:

| Low Entropy (0.0-0.3) | Medium Entropy (0.3-0.6) | High Entropy (0.6-1.0) |
|----------------------|-------------------------|------------------------|
| Focused journey | Mixed exploration | Jumping between topics |
| Following waypoints | Some tangents | No clear path |
| Deep on one topic | Branching questions | High topic diversity |

### Inputs for Calculation

1. **Topic hub diversity** - How many different hubs has the user touched?
2. **Journey adherence** - Is user following waypoints or going off-path?
3. **Query similarity** - Are consecutive queries related or disparate?
4. **Pivot frequency** - How often does user click concept spans?

---

## Implementation Plan

### Step 1: Define Entropy Calculation Function

Create `src/core/engine/entropyCalculator.ts`:

```typescript
export interface EntropyInputs {
  hubsVisited: string[];        // Unique hub IDs touched
  queriesInSession: number;     // Total queries
  pivotsFromSpans: number;      // Clicks on concept spans
  journeyWaypointsHit: number;  // Waypoints completed (if on journey)
  journeyWaypointsTotal: number; // Total waypoints in journey
  consecutiveHubRepeats: number; // Same hub hit back-to-back
}

export function calculateEntropy(inputs: EntropyInputs): number {
  // Returns 0.0 - 1.0
}
```

**Algorithm sketch:**
- Hub diversity: `uniqueHubs / min(queriesInSession, 8)` (capped denominator)
- Journey divergence: `1 - (waypointsHit / waypointsTotal)` if on journey
- Pivot bonus: `min(pivotsFromSpans * 0.1, 0.3)` - exploration signal
- Focus penalty: `-consecutiveHubRepeats * 0.05` - staying focused reduces entropy

### Step 2: Track Hub Visits in XState

Update `src/core/engagement/machine.ts`:

```typescript
// Add to context
hubsVisited: string[],
lastHubId: string | null,
consecutiveHubRepeats: number,

// Add event
{ type: 'HUB_VISITED', hubId: string }

// Add action
hubVisited: assign({
  hubsVisited: ({ context, event }) => {
    const hubs = new Set(context.hubsVisited);
    hubs.add(event.hubId);
    return Array.from(hubs);
  },
  consecutiveHubRepeats: ({ context, event }) =>
    event.hubId === context.lastHubId
      ? context.consecutiveHubRepeats + 1
      : 0,
  lastHubId: ({ event }) => event.hubId,
})
```

### Step 3: Emit HUB_VISITED from Chat Flow

In `useKineticStream.ts` or `chatService.ts`, when a response includes hub metadata:

```typescript
actor.send({ type: 'HUB_VISITED', hubId: matchedHub.id });
```

### Step 4: Recalculate Entropy on Exchange Complete

In `useKineticStream.ts` after `EXCHANGE_COMPLETE`:

```typescript
const entropyInputs: EntropyInputs = {
  hubsVisited: snapshot.context.hubsVisited,
  queriesInSession: snapshot.context.streamHistory.filter(i => i.type === 'query').length,
  pivotsFromSpans: snapshot.context.pivotCount ?? 0,
  journeyWaypointsHit: snapshot.context.journey?.completedWaypoints ?? 0,
  journeyWaypointsTotal: snapshot.context.journey?.waypoints.length ?? 0,
  consecutiveHubRepeats: snapshot.context.consecutiveHubRepeats,
};

const newEntropy = calculateEntropy(entropyInputs);
actor.send({ type: 'SET_ENTROPY', value: newEntropy });
```

### Step 5: Track Pivots

When user clicks a concept span (pivot):

```typescript
actor.send({ type: 'PIVOT_CLICKED' });
// Increment pivotCount in context
```

---

## Files Involved

| File | Change |
|------|--------|
| `src/core/engine/entropyCalculator.ts` | **NEW** - calculation logic |
| `src/core/engagement/types.ts` | Add `hubsVisited`, `lastHubId`, `consecutiveHubRepeats`, `pivotCount` |
| `src/core/engagement/machine.ts` | Add `HUB_VISITED`, `PIVOT_CLICKED` events and actions |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Emit events, recalculate entropy |
| `server.js` | Return matched hub ID in chat response |

---

## Acceptance Criteria

- [ ] Entropy updates after each exchange
- [ ] Entropy increases when user explores diverse topics
- [ ] Entropy decreases when user stays focused on one hub
- [ ] `entropy-journey-offer` can use entropy trigger again (revert patch)
- [ ] Foundation dashboard shows entropy value in real-time
- [ ] Unit tests for `calculateEntropy()` covering edge cases

## Test Cases

| Scenario | Expected Entropy |
|----------|-----------------|
| First exchange | 0.0 - 0.2 |
| 5 exchanges, same hub | 0.1 - 0.2 |
| 5 exchanges, 5 different hubs | 0.6 - 0.8 |
| Following journey, 3/5 waypoints | 0.2 - 0.4 |
| Pivoting frequently, diverse topics | 0.7 - 1.0 |

---

## Dependencies

- Hub matching already works in `server.js` via `routeToHub()`
- XState machine infrastructure in place
- `SET_ENTROPY` event already defined (just not sent)

## Estimated Effort

**Medium complexity** - 2-3 hours:
- New calculation module
- XState context/event additions
- Integration in chat flow
- Testing

---

*Created: 2024-12-29*
*Sprint: entropy-calculation-v1*
*Blocked by: None*
*Blocks: Entropy-based moment triggers*
