# Specification — Epic 4: Entropy State Extraction

## Overview

Extract entropy state management from NarrativeEngineContext into a `useEntropyState` hook that syncs with the XState engagement machine's entropy context. Entropy measures conversation complexity and triggers journey offers when threshold is exceeded.

## Goals

1. Create `useEntropyState` hook with machine sync
2. Implement entropy threshold detection
3. Add configuration for entropy defaults
4. Maintain backward compatibility with existing system
5. Add comprehensive tests for entropy behavior

## Non-Goals

- Modifying NarrativeEngineContext consumers (Epic 6)
- Removing entropy code from NarrativeEngineContext (Epic 6)
- Implementing entropy calculation algorithm (already exists)
- Adding UI for entropy visualization
- Changing journey offer UI components

## Success Criteria

After this epic:
1. `useEntropyState` hook works independently
2. Hook syncs with engagement machine entropy
3. Threshold detection works correctly
4. Configuration allows threshold customization
5. All existing E2E tests pass (no regressions)

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: Hook returns entropy value from machine context
- [ ] AC-2: Hook returns entropyThreshold from machine context
- [ ] AC-3: `updateEntropy(delta)` sends UPDATE_ENTROPY event
- [ ] AC-4: `resetEntropy()` resets entropy to 0
- [ ] AC-5: `isHighEntropy` computed from entropy >= threshold
- [ ] AC-6: Entropy clamped to 0-1 range

### Test Requirements (MANDATORY)

- [ ] AC-T1: Unit tests for hook initialization
- [ ] AC-T2: Unit tests for entropy actions
- [ ] AC-T3: Unit tests for threshold detection
- [ ] AC-T4: Unit tests for value clamping
- [ ] AC-T5: All tests pass: `npm test`
- [ ] AC-T6: E2E tests pass: `npx playwright test`
- [ ] AC-T7: Health check passes: `npm run health`

### DEX Compliance

- [ ] AC-D1: Hook derives state from machine
- [ ] AC-D2: Defaults in config, not hardcoded
- [ ] AC-D3: No business logic in hook

## Hook API Design

### useEntropyState

```typescript
interface UseEntropyStateOptions {
  actor: Actor<EngagementMachine>;
}

interface UseEntropyStateReturn {
  // State (from machine)
  entropy: number;
  entropyThreshold: number;
  
  // Computed
  isHighEntropy: boolean;
  entropyPercent: number;
  
  // Actions
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
}

function useEntropyState(options: UseEntropyStateOptions): UseEntropyStateReturn;
```

### Usage Example

```typescript
import { useEntropyState } from '@/core/engagement';

function ConversationMonitor({ actor }) {
  const { 
    entropy, 
    isHighEntropy,
    entropyPercent,
    updateEntropy 
  } = useEntropyState({ actor });
  
  // Update entropy based on message analysis
  useEffect(() => {
    const delta = analyzeMessage(latestMessage);
    updateEntropy(delta);
  }, [latestMessage]);
  
  return (
    <div>
      <EntropyMeter percent={entropyPercent} />
      {isHighEntropy && <JourneyOffer />}
    </div>
  );
}
```

## Configuration

### config.ts additions

```typescript
export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
```

## File Structure

```
src/core/engagement/
├── index.ts                    # Add exports
├── config.ts                   # Add entropy config
└── hooks/
    ├── index.ts                # Add useEntropyState export
    ├── useLensState.ts         # Existing
    ├── useJourneyState.ts      # Existing
    └── useEntropyState.ts      # NEW

tests/unit/
├── use-lens-state.test.ts      # Existing
├── use-journey-state.test.ts   # Existing
└── use-entropy-state.test.ts   # NEW
```

## Health Check Addition

```json
{
  "id": "entropy-threshold-triggers",
  "name": "Entropy Threshold Detection Works",
  "category": "engagement",
  "type": "unit-test",
  "test": "use-entropy-state.test.ts:isHighEntropy",
  "impact": "Journey offers not triggered when conversation becomes unfocused",
  "inspect": "npx vitest run tests/unit/use-entropy-state.test.ts"
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
| Entropy out of range | Low | Low | Clamp in hook |
| Threshold mismatch | Low | Medium | Derive from machine |
| Rapid updates | Medium | Low | React batching handles |

## Out of Scope

- Consumer migration (Epic 6)
- Context provider (Epic 5)
- Entropy calculation algorithm
- UI components
- Persistence (entropy resets per session)
