# XState Telemetry Migration

**Sprint:** xstate-telemetry-v1
**Priority:** Medium
**Status:** Planned

## Problem Statement

The Moment system's `MomentEvaluationContext` needs several metrics that are either:
1. Hardcoded to placeholder values
2. Only tracked in the deprecated Engagement Bus
3. Not persisted across sessions

This blocks advanced moment triggers and makes telemetry unreliable.

## Current Gap Analysis

### MomentEvaluationContext Fields (from `moment-evaluator.ts`)

| Field | Current Source | Status |
|-------|----------------|--------|
| `stage` | Computed from exchangeCount | ✅ Working |
| `exchangeCount` | XState `streamHistory.filter(type=query)` | ✅ Working |
| `journeysCompleted` | Hardcoded: `journey ? 1 : 0` | ❌ Not cumulative |
| `sproutsCaptured` | Hardcoded: `0` | ❌ Not tracked |
| `topicsExplored` | Hardcoded: `[]` | ❌ Not tracked |
| `entropy` | XState `entropy` | ✅ Working |
| `minutesActive` | Never mapped | ❌ Missing |
| `sessionCount` | Never mapped | ❌ Missing |
| `activeLens` | XState `lens` | ✅ Working |
| `activeJourney` | XState `journey?.id` | ✅ Working |
| `hasCustomLens` | Hardcoded: `false` | ❌ Not detected |
| `flags` | XState `flags` | ✅ Working |
| `momentCooldowns` | XState `momentCooldowns` | ✅ Working |

### Still Using Engagement Bus

`useMoments.ts` still imports `useEngagementEmit` for:
- `emit.momentShown(momentId, surface)`
- `emit.momentActioned(momentId, actionId, actionType)`
- `emit.momentDismissed(momentId)`

## Proposed Solution

### Phase 1: Add Missing Fields to XState Context

Add to `EngagementContext` in `src/core/engagement/types.ts`:

```typescript
// Cumulative metrics (persist across sessions)
journeysCompleted: number;
sproutsCaptured: number;
topicsExplored: string[];

// Session metrics
sessionStartedAt: number;  // timestamp
sessionCount: number;      // persist in localStorage

// Lens detection
hasCustomLens: boolean;
```

### Phase 2: Add Actions/Events to XState Machine

```typescript
| { type: 'JOURNEY_COMPLETED' }
| { type: 'SPROUT_CAPTURED'; sproutId: string }
| { type: 'TOPIC_EXPLORED'; topicId: string }
| { type: 'SESSION_STARTED'; isNewSession: boolean }
```

### Phase 3: Add Persistence Layer

XState context needs to persist cumulative metrics:
- `journeysCompleted`
- `sproutsCaptured`
- `topicsExplored`
- `sessionCount`

Options:
1. localStorage persistence in `EngagementProvider`
2. XState `persist` middleware
3. Hydrate from localStorage on mount

### Phase 4: Computed Properties

Add derived selectors:
- `minutesActive` = `(Date.now() - sessionStartedAt) / 60000`
- `stage` = computed from exchange count + other signals

### Phase 5: Remove Engagement Bus Dependency

1. Replace `useEngagementEmit` in `useMoments.ts` with XState events
2. Move telemetry logging to XState actions or middleware
3. Deprecate and remove `useEngagementBus.ts`

## Acceptance Criteria

- [ ] All `MomentEvaluationContext` fields sourced from XState
- [ ] Cumulative metrics persist across sessions
- [ ] `minutesActive` computed correctly
- [ ] `hasCustomLens` detected from lens ID pattern
- [ ] No imports from `useEngagementBus` in Kinetic Stream components
- [ ] Engagement Bus can be deleted without breaking Moments

## Files to Modify

- `src/core/engagement/types.ts` - Add new context fields
- `src/core/engagement/machine.ts` - Add new actions/events
- `src/core/engagement/context.tsx` - Add persistence layer
- `src/surface/hooks/useMoments.ts` - Remove engagement bus import
- `hooks/useEngagementBus.ts` - Eventually delete

## Notes

- The Engagement Bus was designed for the old Reveal system (replaced by Moments)
- Keep engagement bus alive for Foundation consoles until migration complete
- Stage computation should move to XState guards/computed selectors
