# Repository Audit — Epic 3: Journey State Extraction

## Audit Date: 2024-12-24

## Current State Summary

Epic 2 established `useLensState` hook with URL/localStorage hydration and machine sync. Epic 3 extracts journey state management from NarrativeEngineContext into a `useJourneyState` hook that connects to the machine's journey states.

## Epic 2 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| @xstate/react@5.0.5 | ✅ Installed | React 19 compatible |
| config.ts | ✅ Created | VALID_LENSES, isValidLens |
| persistence.ts | ✅ Created | getLens/setLens/clearLens |
| useLensState hook | ✅ Created | URL + localStorage hydration |
| Unit tests | ✅ 18 passing | 7 persistence + 11 hook |
| E2E test | ✅ Passing | Lens persists across reload |
| Health check | ✅ Added | lens-persistence-works |

## Journey State in NarrativeEngineContext

### Current Implementation

**Location:** `hooks/NarrativeEngineContext.tsx`

```typescript
// Journey state variables (estimated lines 65-85)
const [currentJourney, setCurrentJourney] = useState<Journey | null>(null);
const [journeyProgress, setJourneyProgress] = useState<number>(0);
const [isJourneyActive, setIsJourneyActive] = useState(false);
const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);

// Journey handlers (estimated lines 250-350)
const startJourney = useCallback((journey: Journey) => {
  setCurrentJourney(journey);
  setJourneyProgress(0);
  setJourneySteps(journey.steps);
  setIsJourneyActive(true);
}, []);

const advanceJourneyStep = useCallback(() => {
  if (journeyProgress < journeySteps.length - 1) {
    setJourneyProgress(prev => prev + 1);
  }
}, [journeyProgress, journeySteps]);

const completeJourney = useCallback(() => {
  setIsJourneyActive(false);
  // Possibly persist completion
}, []);

const exitJourney = useCallback(() => {
  setCurrentJourney(null);
  setJourneyProgress(0);
  setJourneySteps([]);
  setIsJourneyActive(false);
}, []);
```

### Journey Data Sources

| Source | Location | Purpose |
|--------|----------|---------|
| Journey definitions | `data/journeys/` | Journey content and steps |
| Active journey | Machine context | Current journey object |
| Progress | Machine context | Current step index |
| Completion status | localStorage | Persist completed journeys |

### Journey States (from Machine)

```typescript
// From Epic 1 machine
states: {
  session: {
    lensActive: {
      on: { START_JOURNEY: 'journeyActive' }
    },
    journeyActive: {
      on: {
        ADVANCE_STEP: { guard: 'notAtEnd' },
        COMPLETE_JOURNEY: 'journeyComplete',
        EXIT_JOURNEY: 'lensActive'
      }
    },
    journeyComplete: {
      on: {
        START_JOURNEY: 'journeyActive',
        EXIT_JOURNEY: 'lensActive'
      }
    }
  }
}
```

## Machine Context for Journey

From `src/core/engagement/types.ts`:

```typescript
interface EngagementContext {
  // ... lens state
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  // ... entropy state
}
```

## File Structure Analysis

### Files to Create

| File | Purpose |
|------|---------|
| `src/core/engagement/hooks/useJourneyState.ts` | Journey state hook |
| `src/core/engagement/journeys.ts` | Journey loading utilities |
| `tests/unit/use-journey-state.test.ts` | Hook unit tests |
| `tests/unit/journeys.test.ts` | Journey utility tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/core/engagement/hooks/index.ts` | Export useJourneyState |
| `src/core/engagement/index.ts` | Export journey utilities |
| `src/core/engagement/persistence.ts` | Add journey persistence |
| `data/infrastructure/health-config.json` | Add journey health check |

### Files NOT to Modify

| File | Why |
|------|-----|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| `src/core/engagement/machine.ts` | Machine already has journey states |
| React components | Consumer migration in Epic 6 |

## Test Coverage Assessment

### Existing Tests

| Category | Tests | Status |
|----------|-------|--------|
| Machine journey transitions | 8 | ✅ Passing |
| Machine guards (notAtEnd) | 2 | ✅ Passing |
| E2E journey flow | ? | Need to verify |

### Tests to Add

| Test | Purpose |
|------|---------|
| useJourneyState initialization | Hook starts correctly |
| startJourney | Starts journey via machine |
| advanceStep | Advances progress |
| completeJourney | Completes journey |
| exitJourney | Exits and clears journey |
| getCurrentStep | Returns correct step |
| Progress persistence | Saves/restores progress |
| Completion tracking | Tracks completed journeys |

## Journey Data Structure

```typescript
interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}

interface JourneyStep {
  id: string;
  title: string;
  content: string;
}
```

## Persistence Strategy

### What to Persist

| Data | Key | When |
|------|-----|------|
| Completed journey IDs | `grove-completed-journeys` | On COMPLETE_JOURNEY |
| In-progress journey | `grove-journey-progress` | On ADVANCE_STEP |

### Persistence Format

```typescript
// Completed journeys
localStorage['grove-completed-journeys'] = JSON.stringify(['journey-1', 'journey-2']);

// In-progress (optional, for resume)
localStorage['grove-journey-progress'] = JSON.stringify({
  journeyId: 'journey-3',
  progress: 2
});
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Journey data not loaded | Medium | High | Async loading pattern |
| Progress out of sync | Low | Medium | Single source (machine) |
| Completed status lost | Low | Medium | Persist on complete |
| Step index out of bounds | Low | High | Guard in machine |

## Recommendations

1. **Derive state from machine** — Hook reads from machine context, doesn't duplicate
2. **Async journey loading** — Journeys may need to be fetched
3. **Completion tracking** — Separate from active journey state
4. **Progress persistence** — Optional, for resume functionality
5. **Current step helper** — Computed from journey + progress
