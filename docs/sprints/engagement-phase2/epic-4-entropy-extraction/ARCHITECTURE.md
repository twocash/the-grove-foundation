# Architecture — Epic 4: Entropy State Extraction

## Overview

The `useEntropyState` hook extracts entropy state management into a reusable adapter that syncs with the XState engagement machine. It provides entropy monitoring, threshold detection, and update actions.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 4 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   useEntropyState                          Machine                          │
│   ───────────────                          ───────                          │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ State (from machine)         │◄───────│ context                    │   │
│   │ ────────────────────         │        │ ├─ entropy: number         │   │
│   │ entropy: number              │        │ └─ entropyThreshold: number│   │
│   │ entropyThreshold: number     │        └────────────────────────────┘   │
│   └──────────────────────────────┘                                         │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ Computed                     │        │ guards                     │   │
│   │ ────────                     │        │ └─ highEntropy             │   │
│   │ isHighEntropy: boolean       │────────│    entropy >= threshold    │   │
│   │ entropyPercent: number       │        └────────────────────────────┘   │
│   └──────────────────────────────┘                                         │
│                                                                             │
│   ┌──────────────────────────────┐        ┌────────────────────────────┐   │
│   │ Actions                      │────────►│ events                     │   │
│   │ ───────                      │        │ └─ UPDATE_ENTROPY          │   │
│   │ updateEntropy(delta)         │        │    { delta: number }       │   │
│   │ resetEntropy()               │        └────────────────────────────┘   │
│   └──────────────────────────────┘                                         │
│                                                                             │
│   ┌──────────────────────────────┐                                         │
│   │ Config                       │                                         │
│   │ ──────                       │                                         │
│   │ ENTROPY_CONFIG.defaultThreshold                                        │
│   │ ENTROPY_CONFIG.minValue                                                │
│   │ ENTROPY_CONFIG.maxValue                                                │
│   └──────────────────────────────┘                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Hook Implementation

### useEntropyState.ts

```typescript
// src/core/engagement/hooks/useEntropyState.ts

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { ENTROPY_CONFIG } from '../config';

export interface UseEntropyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseEntropyStateReturn {
  // State from machine
  entropy: number;
  entropyThreshold: number;
  
  // Computed
  isHighEntropy: boolean;
  entropyPercent: number;
  
  // Actions
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
}

export function useEntropyState({ actor }: UseEntropyStateOptions): UseEntropyStateReturn {
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
  const { entropy, entropyThreshold } = snapshot.context;

  // Computed values
  const isHighEntropy = useMemo(() => {
    return entropy >= entropyThreshold;
  }, [entropy, entropyThreshold]);

  const entropyPercent = useMemo(() => {
    return Math.round(entropy * 100);
  }, [entropy]);

  // Actions
  const updateEntropy = useCallback((delta: number) => {
    // Clamp delta to keep entropy in valid range
    const currentEntropy = actor.getSnapshot().context.entropy;
    const newValue = currentEntropy + delta;
    const clampedDelta = Math.max(
      ENTROPY_CONFIG.minValue - currentEntropy,
      Math.min(ENTROPY_CONFIG.maxValue - currentEntropy, delta)
    );
    
    if (clampedDelta !== 0) {
      actor.send({ type: 'UPDATE_ENTROPY', delta: clampedDelta });
    }
  }, [actor]);

  const resetEntropy = useCallback(() => {
    const currentEntropy = actor.getSnapshot().context.entropy;
    if (currentEntropy !== ENTROPY_CONFIG.resetValue) {
      actor.send({ type: 'UPDATE_ENTROPY', delta: -currentEntropy });
    }
  }, [actor]);

  return {
    entropy,
    entropyThreshold,
    isHighEntropy,
    entropyPercent,
    updateEntropy,
    resetEntropy,
  };
}
```

## Configuration

### config.ts additions

```typescript
// Add to src/core/engagement/config.ts

export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
```

## State Flow

### Update Entropy Flow

```
1. Message analysis calculates delta
   │
2. Component calls updateEntropy(0.1)
   │
3. Hook calculates clamped delta
   │   - current: 0.5
   │   - delta: 0.1
   │   - new: 0.6 (within 0-1)
   │   - clamped: 0.1
   │
4. Hook sends: actor.send({ type: 'UPDATE_ENTROPY', delta: 0.1 })
   │
5. Machine action: updateEntropy
   │   - entropy = entropy + delta
   │   - entropy = 0.5 + 0.1 = 0.6
   │
6. useSyncExternalStore triggers re-render
   │
7. Hook returns:
   │   - entropy = 0.6
   │   - entropyPercent = 60
   │   - isHighEntropy = false (0.6 < 0.7)
```

### Threshold Trigger Flow

```
1. Entropy accumulates over conversation
   │
2. entropy reaches 0.7 (threshold)
   │
3. useSyncExternalStore triggers re-render
   │
4. Hook computes:
   │   - isHighEntropy = entropy >= entropyThreshold
   │   - isHighEntropy = 0.7 >= 0.7 = true
   │
5. Component receives isHighEntropy = true
   │
6. Component shows journey offer
```

### Reset Entropy Flow

```
1. Journey starts or user dismisses offer
   │
2. Component calls resetEntropy()
   │
3. Hook calculates reset delta:
   │   - current: 0.8
   │   - delta: -0.8 (to reach 0)
   │
4. Hook sends: actor.send({ type: 'UPDATE_ENTROPY', delta: -0.8 })
   │
5. Machine updates: entropy = 0
   │
6. Hook returns:
   │   - entropy = 0
   │   - entropyPercent = 0
   │   - isHighEntropy = false
```

## File Organization

```
src/core/engagement/
├── index.ts              # Add useEntropyState export
├── machine.ts            # Unchanged
├── types.ts              # Unchanged
├── config.ts             # Add ENTROPY_CONFIG
├── persistence.ts        # Unchanged
└── hooks/
    ├── index.ts          # Add useEntropyState export
    ├── useLensState.ts   # Unchanged
    ├── useJourneyState.ts # Unchanged
    └── useEntropyState.ts # NEW

tests/unit/
├── engagement-machine.test.ts    # Existing
├── persistence.test.ts           # Existing
├── use-lens-state.test.ts        # Existing
├── use-journey-state.test.ts     # Existing
└── use-entropy-state.test.ts     # NEW
```

## Test Strategy

### Unit Tests Structure

```typescript
// tests/unit/use-entropy-state.test.ts

describe('useEntropyState', () => {
  describe('state derivation', () => {
    test('derives entropy from machine context');
    test('derives entropyThreshold from machine context');
  });

  describe('computed values', () => {
    test('isHighEntropy true when entropy >= threshold');
    test('isHighEntropy false when entropy < threshold');
    test('entropyPercent calculates correctly');
  });

  describe('updateEntropy action', () => {
    test('sends UPDATE_ENTROPY event with delta');
    test('clamps positive delta to maxValue');
    test('clamps negative delta to minValue');
    test('no-op when delta would exceed bounds');
  });

  describe('resetEntropy action', () => {
    test('resets entropy to 0');
    test('no-op when already at 0');
  });
});
```

## Integration Points

### With Other Hooks

```typescript
function EngagementConsumer({ actor }) {
  const { lens } = useLensState({ actor });
  const { journey, startJourney } = useJourneyState({ actor });
  const { isHighEntropy, resetEntropy } = useEntropyState({ actor });
  
  // When user starts journey, reset entropy
  const handleStartJourney = (journey) => {
    resetEntropy();
    startJourney(journey);
  };
  
  return (
    <>
      {isHighEntropy && !journey && (
        <JourneyOffer onAccept={() => handleStartJourney(suggestedJourney)} />
      )}
    </>
  );
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

// Consumer composes all hooks
function SmartTerminal() {
  const { actor } = useEngagement();
  const lens = useLensState({ actor });
  const journey = useJourneyState({ actor });
  const entropy = useEntropyState({ actor });
  
  // Full engagement state available
}
```

## Performance Considerations

- Single subscription via useSyncExternalStore
- Computed values memoized
- Actions wrapped in useCallback
- Clamping prevents unnecessary events
- No persistence (session-only state)

## Error Handling

| Error | Handling |
|-------|----------|
| Delta exceeds bounds | Clamp to valid range |
| Actor not provided | Runtime error |
| Invalid delta (NaN) | Should be caught by caller |
