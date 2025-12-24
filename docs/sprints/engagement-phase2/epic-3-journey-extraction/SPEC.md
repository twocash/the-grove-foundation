# Specification — Epic 3: Journey State Extraction

## Overview

Extract journey state management from NarrativeEngineContext into a `useJourneyState` hook that syncs with the XState engagement machine's journey states (`journeyActive`, `journeyComplete`).

## Goals

1. Create `useJourneyState` hook with machine sync
2. Implement journey completion tracking with persistence
3. Add helper utilities for journey data access
4. Maintain backward compatibility with existing system
5. Add comprehensive tests for journey behavior

## Non-Goals

- Modifying NarrativeEngineContext consumers (Epic 6)
- Removing journey code from NarrativeEngineContext (Epic 6)
- Adding new journey types or content
- Changing journey UI components
- Journey progress resume (optional future enhancement)

## Success Criteria

After this epic:
1. `useJourneyState` hook works independently
2. Hook syncs with engagement machine journey states
3. Journey completion persists to localStorage
4. All existing E2E tests pass (no regressions)
5. New unit tests verify journey behavior

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: Hook returns journey state from machine context
- [ ] AC-2: `startJourney(journey)` sends START_JOURNEY event
- [ ] AC-3: `advanceStep()` sends ADVANCE_STEP event
- [ ] AC-4: `completeJourney()` sends COMPLETE_JOURNEY event
- [ ] AC-5: `exitJourney()` sends EXIT_JOURNEY event
- [ ] AC-6: `currentStep` computed from journey + progress
- [ ] AC-7: `isCompleted(journeyId)` checks completion history
- [ ] AC-8: Completion persisted to localStorage

### Test Requirements (MANDATORY)

- [ ] AC-T1: Unit tests for hook initialization
- [ ] AC-T2: Unit tests for all journey actions
- [ ] AC-T3: Unit tests for computed values
- [ ] AC-T4: Unit tests for completion tracking
- [ ] AC-T5: All tests pass: `npm test`
- [ ] AC-T6: E2E tests pass: `npx playwright test`
- [ ] AC-T7: Health check passes: `npm run health`

### DEX Compliance

- [ ] AC-D1: Hook derives state from machine, no duplication
- [ ] AC-D2: Persistence follows established patterns
- [ ] AC-D3: No hardcoded journey logic in hook

## Hook API Design

### useJourneyState

```typescript
interface UseJourneyStateOptions {
  actor: Actor<EngagementMachine>;
}

interface UseJourneyStateReturn {
  // State (from machine)
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

function useJourneyState(options: UseJourneyStateOptions): UseJourneyStateReturn;
```

### Usage Example

```typescript
import { useJourneyState } from '@/core/engagement';

function JourneyPanel({ actor, journey }) {
  const { 
    isActive, 
    currentStep, 
    progressPercent,
    startJourney,
    advanceStep,
    completeJourney
  } = useJourneyState({ actor });
  
  if (!isActive) {
    return <button onClick={() => startJourney(journey)}>Start Journey</button>;
  }
  
  return (
    <div>
      <ProgressBar percent={progressPercent} />
      <StepContent step={currentStep} />
      <button onClick={advanceStep}>Next</button>
    </div>
  );
}
```

## Persistence Utilities

### API Additions to persistence.ts

```typescript
// Completed journeys
export function getCompletedJourneys(): string[];
export function markJourneyCompleted(journeyId: string): void;
export function isJourneyCompleted(journeyId: string): boolean;
export function clearCompletedJourneys(): void;
```

### Storage Keys

```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',  // Future use
} as const;
```

## State Derivation

### From Machine State

```typescript
// Session state determines isActive/isComplete
const isActive = state.matches('session.journeyActive');
const isComplete = state.matches('session.journeyComplete');

// Context provides data
const { journey, journeyProgress, journeyTotal } = state.context;
```

### Computed Values

```typescript
// Current step
const currentStep = journey?.steps[journeyProgress] ?? null;

// Progress percentage
const progressPercent = journeyTotal > 0 
  ? Math.round((journeyProgress / journeyTotal) * 100) 
  : 0;
```

## File Structure

```
src/core/engagement/
├── index.ts                    # Add exports
├── persistence.ts              # Add journey persistence
└── hooks/
    ├── index.ts                # Add useJourneyState export
    ├── useLensState.ts         # Existing
    └── useJourneyState.ts      # NEW

tests/unit/
├── persistence.test.ts         # Add journey persistence tests
└── use-journey-state.test.ts   # NEW
```

## Health Check Addition

```json
{
  "id": "journey-completion-persists",
  "name": "Journey Completion Persists",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:journey completion persists",
  "impact": "Journey completion history lost",
  "inspect": "npx playwright test -g 'journey completion'"
}
```

## Dependencies

No new dependencies—uses existing:
- `xstate` (v5.25.0)
- `@xstate/react` (v5.0.5)
- `@testing-library/react` (v16.3.1)

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Journey data structure mismatch | Low | High | Verify against existing types |
| Guard blocks valid advance | Low | Medium | Thorough guard testing |
| Completion not persisting | Low | Medium | E2E test for persistence |
| Memory leak from subscription | Low | Medium | Cleanup in effect |

## Out of Scope

- Consumer migration (Epic 6)
- Entropy state extraction (Epic 4)
- Journey progress resume on page reload
- New journey content
- UI changes
