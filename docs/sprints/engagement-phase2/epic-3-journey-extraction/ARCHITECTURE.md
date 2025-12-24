# Architecture — Epic 3: Journey State Extraction

## Overview

The `useJourneyState` hook extracts journey state management into a reusable adapter that syncs with the XState engagement machine. It provides actions for journey lifecycle and tracks completion history.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 3 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   useJourneyState                          Machine                          │
│   ───────────────                          ───────                          │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ State (derived from machine) │◄───────│ session                    │   │
│   │ ────────────────────────────│        │ ├─ lensActive              │   │
│   │ journey: Journey | null      │        │ │   on: START_JOURNEY ─────┼───┤
│   │ journeyProgress: number      │        │ │                          │   │
│   │ journeyTotal: number         │        │ ├─ journeyActive           │   │
│   │ isActive: boolean            │        │ │   on: ADVANCE_STEP       │   │
│   │ isComplete: boolean          │        │ │   on: COMPLETE_JOURNEY ──┼───┤
│   └──────────────────────────────┘        │ │   on: EXIT_JOURNEY       │   │
│                                           │ │                          │   │
│   ┌──────────────────────────────┐        │ └─ journeyComplete         │   │
│   │ Computed                     │        │     on: START_JOURNEY      │   │
│   │ ────────                     │        │     on: EXIT_JOURNEY       │   │
│   │ currentStep: JourneyStep     │        └────────────────────────────┘   │
│   │ progressPercent: number      │                                         │
│   └──────────────────────────────┘                                         │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ Actions                      │────────►│ actor.send()               │   │
│   │ ───────                      │        └────────────────────────────┘   │
│   │ startJourney(journey)        │                                         │
│   │ advanceStep()                │                                         │
│   │ completeJourney()            │                                         │
│   │ exitJourney()                │                                         │
│   └──────────────────────────────┘                                         │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ Completion Tracking          │◄───────►│ localStorage               │   │
│   │ ───────────────────          │        │ grove-completed-journeys   │   │
│   │ completedJourneys: string[]  │        └────────────────────────────┘   │
│   │ isJourneyCompleted(id)       │                                         │
│   └──────────────────────────────┘                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Hook Implementation

### useJourneyState.ts

```typescript
// src/core/engagement/hooks/useJourneyState.ts

import { useCallback, useMemo, useSyncExternalStore, useEffect } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import type { Journey, JourneyStep } from '../types';
import { 
  getCompletedJourneys, 
  markJourneyCompleted,
  isJourneyCompleted as checkCompleted 
} from '../persistence';

export interface UseJourneyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseJourneyStateReturn {
  // State from machine
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  isActive: boolean;
  isComplete: boolean;
  
  // Computed
  currentStep: JourneyStep | null;
  progressPercent: number;
  
  // Actions
  startJourney: (journey: Journey) => void;
  advanceStep: () => void;
  completeJourney: () => void;
  exitJourney: () => void;
  
  // Completion tracking
  isJourneyCompleted: (journeyId: string) => boolean;
  completedJourneys: string[];
}

export function useJourneyState({ actor }: UseJourneyStateOptions): UseJourneyStateReturn {
  // Subscribe to machine state
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  // Derive state from machine
  const { journey, journeyProgress, journeyTotal } = snapshot.context;
  const isActive = snapshot.matches('session.journeyActive');
  const isComplete = snapshot.matches('session.journeyComplete');

  // Computed values
  const currentStep = useMemo(() => {
    if (!journey || !journey.steps) return null;
    return journey.steps[journeyProgress] ?? null;
  }, [journey, journeyProgress]);

  const progressPercent = useMemo(() => {
    if (journeyTotal === 0) return 0;
    return Math.round(((journeyProgress + 1) / journeyTotal) * 100);
  }, [journeyProgress, journeyTotal]);

  // Completion tracking (from localStorage)
  const completedJourneys = useMemo(() => getCompletedJourneys(), []);

  // Persist completion when journey completes
  useEffect(() => {
    if (isComplete && journey) {
      markJourneyCompleted(journey.id);
    }
  }, [isComplete, journey]);

  // Actions
  const startJourney = useCallback((newJourney: Journey) => {
    actor.send({ type: 'START_JOURNEY', journey: newJourney });
  }, [actor]);

  const advanceStep = useCallback(() => {
    actor.send({ type: 'ADVANCE_STEP' });
  }, [actor]);

  const completeJourney = useCallback(() => {
    actor.send({ type: 'COMPLETE_JOURNEY' });
  }, [actor]);

  const exitJourney = useCallback(() => {
    actor.send({ type: 'EXIT_JOURNEY' });
  }, [actor]);

  const isJourneyCompleted = useCallback((journeyId: string) => {
    return checkCompleted(journeyId);
  }, []);

  return {
    journey,
    journeyProgress,
    journeyTotal,
    isActive,
    isComplete,
    currentStep,
    progressPercent,
    startJourney,
    advanceStep,
    completeJourney,
    exitJourney,
    isJourneyCompleted,
    completedJourneys,
  };
}
```

## Persistence Layer Additions

### persistence.ts additions

```typescript
// Add to src/core/engagement/persistence.ts

export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
} as const;

// Completed journeys
export function getCompletedJourneys(): string[] {
  if (!isBrowser()) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.completedJourneys);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markJourneyCompleted(journeyId: string): void {
  if (!isBrowser()) return;
  try {
    const completed = getCompletedJourneys();
    if (!completed.includes(journeyId)) {
      completed.push(journeyId);
      localStorage.setItem(STORAGE_KEYS.completedJourneys, JSON.stringify(completed));
    }
  } catch {
    console.warn('Failed to persist journey completion');
  }
}

export function isJourneyCompleted(journeyId: string): boolean {
  return getCompletedJourneys().includes(journeyId);
}

export function clearCompletedJourneys(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.completedJourneys);
  } catch {
    // Ignore
  }
}
```

## State Flow

### Start Journey Flow

```
1. Component calls startJourney(journey)
   │
2. Hook sends: actor.send({ type: 'START_JOURNEY', journey })
   │
3. Machine transitions: lensActive → journeyActive
   │
4. Machine action: startJourney updates context
   │   - journey = journey
   │   - journeyProgress = 0
   │   - journeyTotal = journey.steps.length
   │
5. useSyncExternalStore triggers re-render
   │
6. Hook returns updated state:
   │   - isActive = true
   │   - journey = journey
   │   - currentStep = journey.steps[0]
   │   - progressPercent = calculated
```

### Advance Step Flow

```
1. Component calls advanceStep()
   │
2. Hook sends: actor.send({ type: 'ADVANCE_STEP' })
   │
3. Machine checks guard: notAtEnd
   │
   ├── Guard passes ──► Action: advanceStep
   │                    journeyProgress += 1
   │
   └── Guard fails ───► No state change
   │
4. useSyncExternalStore triggers re-render
   │
5. Hook returns:
   │   - journeyProgress = incremented
   │   - currentStep = journey.steps[newProgress]
   │   - progressPercent = recalculated
```

### Complete Journey Flow

```
1. Component calls completeJourney()
   │
2. Hook sends: actor.send({ type: 'COMPLETE_JOURNEY' })
   │
3. Machine transitions: journeyActive → journeyComplete
   │
4. useSyncExternalStore triggers re-render
   │
5. Hook's useEffect detects isComplete + journey
   │
6. markJourneyCompleted(journey.id) persists to localStorage
   │
7. Hook returns:
   │   - isActive = false
   │   - isComplete = true
   │   - completedJourneys includes journey.id
```

## File Organization

```
src/core/engagement/
├── index.ts              # Add useJourneyState export
├── machine.ts            # Unchanged
├── types.ts              # Unchanged (Journey types exist)
├── config.ts             # Unchanged
├── persistence.ts        # Add journey persistence functions
└── hooks/
    ├── index.ts          # Add useJourneyState export
    ├── useLensState.ts   # Unchanged
    └── useJourneyState.ts # NEW

tests/unit/
├── engagement-machine.test.ts    # Existing (24 tests)
├── persistence.test.ts           # Add journey persistence tests
├── use-lens-state.test.ts        # Existing (11 tests)
└── use-journey-state.test.ts     # NEW
```

## Test Strategy

### Unit Tests Structure

```typescript
// tests/unit/use-journey-state.test.ts

describe('useJourneyState', () => {
  describe('state derivation', () => {
    test('derives journey from machine context');
    test('derives isActive from session.journeyActive');
    test('derives isComplete from session.journeyComplete');
  });

  describe('computed values', () => {
    test('currentStep returns correct step');
    test('currentStep returns null when no journey');
    test('progressPercent calculates correctly');
    test('progressPercent is 0 when no journey');
  });

  describe('actions', () => {
    test('startJourney sends START_JOURNEY event');
    test('advanceStep sends ADVANCE_STEP event');
    test('completeJourney sends COMPLETE_JOURNEY event');
    test('exitJourney sends EXIT_JOURNEY event');
  });

  describe('completion tracking', () => {
    test('completedJourneys returns from localStorage');
    test('isJourneyCompleted checks localStorage');
    test('persists completion when journey completes');
  });
});
```

### Persistence Tests Additions

```typescript
// Add to tests/unit/persistence.test.ts

describe('journey completion persistence', () => {
  test('getCompletedJourneys returns empty array initially');
  test('markJourneyCompleted adds to list');
  test('markJourneyCompleted prevents duplicates');
  test('isJourneyCompleted returns correct boolean');
  test('clearCompletedJourneys removes all');
});
```

## Integration Points

### With useLensState (Current)

Both hooks share the same actor but manage independent state:
- `useLensState` → lens, lensSource
- `useJourneyState` → journey, progress, completion

```typescript
function EngagementConsumer({ actor }) {
  const { lens } = useLensState({ actor });
  const { journey, startJourney } = useJourneyState({ actor });
  
  // Both derive from same machine state
}
```

### Future Integration (Epic 5)

```typescript
function EngagementProvider({ children }) {
  const actor = useActorRef(engagementMachine);
  
  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

// Consumers use hooks with shared actor
function JourneyPanel() {
  const { actor } = useEngagement();
  const journey = useJourneyState({ actor });
}
```

## Performance Considerations

- Single subscription to machine (useSyncExternalStore)
- Computed values memoized (useMemo)
- Actions wrapped in useCallback (stable references)
- Completion tracking reads localStorage once per render
- Persistence writes only on completion

## Error Handling

| Error | Handling |
|-------|----------|
| Journey null during action | Guard in machine prevents invalid transitions |
| localStorage unavailable | Graceful fallback, completion not persisted |
| Invalid step index | Machine guard (notAtEnd) prevents overflow |
| Malformed stored data | Parse with try/catch, return empty array |
