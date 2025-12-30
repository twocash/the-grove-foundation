# REPO_AUDIT.md — Current State Analysis

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29

---

## Current Architecture

### XState Engagement Context (types.ts)

```typescript
// Current fields in EngagementContext
lens: string | null;
lensSource: 'url' | 'localStorage' | 'selection' | null;
journey: Journey | null;
journeyProgress: number;
journeyTotal: number;
entropy: number;
entropyThreshold: number;
currentStreamItem: StreamItem | null;
streamHistory: StreamItem[];
flags: Record<string, boolean>;
momentCooldowns: Record<string, number>;
hubsVisited: string[];
lastHubId: string | null;
consecutiveHubRepeats: number;
pivotCount: number;
```

**Missing fields for MomentEvaluationContext:**
- `journeysCompleted: number` (cumulative)
- `sproutsCaptured: number` (cumulative)
- `topicsExplored: string[]` (cumulative)
- `sessionStartedAt: number` (timestamp)
- `sessionCount: number` (cumulative)
- `hasCustomLens: boolean` (detected)

### Persistence Layer (persistence.ts)

```typescript
// Current storage keys
const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
}
```

**Note:** `completedJourneys` stores array of IDs. Need numeric count for telemetry.

### MomentEvaluationContext → XState Mapping (useMoments.ts:62-80)

| Field | Source | Gap |
|-------|--------|-----|
| stage | Computed from exchangeCount | ⚠️ Computed locally, not in XState |
| exchangeCount | `streamHistory.filter(query)` | ✅ Working |
| journeysCompleted | `journey ? 1 : 0` | ❌ Hardcoded |
| sproutsCaptured | `0` | ❌ Hardcoded |
| topicsExplored | Not mapped | ❌ Missing |
| entropy | `xstateContext.entropy` | ✅ Working |
| minutesActive | Not mapped | ❌ Missing |
| sessionCount | Not mapped | ❌ Missing |
| activeLens | `xstateContext.lens` | ✅ Working |
| activeJourney | `xstateContext.journey?.id` | ✅ Working |
| hasCustomLens | `false` | ❌ Hardcoded |
| flags | `xstateContext.flags` | ✅ Working |
| momentCooldowns | `xstateContext.momentCooldowns` | ✅ Working |

### Engagement Bus Telemetry (useMoments.ts)

```typescript
import { useEngagementEmit } from '../../../hooks/useEngagementBus';

// Line 103: emit.momentShown(activeMoment.meta.id, surface);
// Line 130: emit.momentActioned(momentId, actionId, action.type);
// Line 153: emit.momentDismissed(momentId);
```

These are the ONLY usages of the Engagement Bus in useMoments.ts.

---

## Engagement Bus Overlap

The Engagement Bus tracks metrics that should live in XState:

| Engagement Bus Field | XState Equivalent | Action Needed |
|---------------------|-------------------|---------------|
| `journeysCompleted` | Not present | Add to context |
| `sproutsCaptured` | Not present | Add to context |
| `topicsExplored[]` | Not present | Add to context |
| `sessionCount` | Not present | Add to context |
| `minutesActive` | Not present | Add computed selector |
| `sessionStartedAt` | Not present | Add to context |
| `hasCustomLens` | Not present | Add to context |

---

## Test Coverage

### Existing Tests

- `tests/e2e/engagement-machine.spec.ts` — XState transitions
- `tests/unit/moment-evaluator.test.ts` — Trigger evaluation

### Test Gaps

- No tests for persistence hydration
- No tests for cumulative metric tracking
- No tests for session tracking

---

## Technical Debt

1. **Parallel state systems** — Engagement Bus duplicates XState tracking
2. **Stage computation scattered** — Computed in useMoments, stageComputation.ts, and Engagement Bus
3. **Telemetry split** — Some events go to Bus, some to XState flags
4. **Incomplete persistence** — Only lens and completed journeys persisted

---

## Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `types.ts` | Add 6 context fields, 4 events | Low |
| `machine.ts` | Add actions for new events | Low |
| `persistence.ts` | Add cumulative metrics storage | Low |
| `context.tsx` | Add hydration on mount | Medium |
| `useMoments.ts` | Remove engagement bus import | Low |
| `moment-evaluator.ts` | Update default context (optional) | Low |
