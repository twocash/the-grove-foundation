# Repository Audit — Epic 4: Entropy State Extraction

## Audit Date: 2024-12-24

## Current State Summary

Epic 3 established `useJourneyState` hook with journey lifecycle management and completion tracking. Epic 4 extracts entropy state management into a `useEntropyState` hook that connects to the machine's entropy context and threshold detection.

## Epic 3 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| useJourneyState | ✅ Created | 15 hook tests |
| Journey persistence | ✅ Created | 10 persistence tests |
| E2E test | ✅ Added | Journey completion persists |
| Health check | ✅ Added | journey-completion-persists |
| Total tests | ✅ 132 passing | +25 from Epic 3 |

## Entropy State in NarrativeEngineContext

### Current Implementation

**Location:** `hooks/NarrativeEngineContext.tsx`

```typescript
// Entropy state variables (estimated lines 90-110)
const [entropy, setEntropy] = useState<number>(0);
const [entropyThreshold, setEntropyThreshold] = useState<number>(0.7);
const [showJourneyOffer, setShowJourneyOffer] = useState(false);

// Entropy calculation (estimated lines 300-350)
const calculateEntropy = useCallback((messages: Message[]) => {
  // Calculate based on:
  // - Message count
  // - Topic diversity
  // - Question frequency
  // - Response complexity
  const score = computeEntropyScore(messages);
  setEntropy(score);
  
  if (score >= entropyThreshold && !showJourneyOffer) {
    setShowJourneyOffer(true);
  }
}, [entropyThreshold, showJourneyOffer]);

// Entropy update handler (estimated lines 380-400)
const updateEntropy = useCallback((delta: number) => {
  setEntropy(prev => Math.max(0, Math.min(1, prev + delta)));
}, []);

const resetEntropy = useCallback(() => {
  setEntropy(0);
  setShowJourneyOffer(false);
}, []);
```

### Entropy Concept

```
Entropy represents conversation complexity/focus:

0.0 ────────────────────────────────────────────────────── 1.0
 │                        │                                  │
 │    Focused             │   Threshold (0.7)                │
 │    conversation        │   ──────────────                 │
 │                        │   Offer journey                  │
 │                        │                                  │
Low entropy              Medium                    High entropy
(single topic)           (some drift)              (unfocused)
```

### Machine Context for Entropy

From `src/core/engagement/types.ts`:

```typescript
interface EngagementContext {
  // ... lens state
  // ... journey state
  entropy: number;
  entropyThreshold: number;
}
```

### Machine Events

```typescript
// From Epic 1 machine
events: {
  UPDATE_ENTROPY: { delta: number }
}

// Guard
guards: {
  highEntropy: ({ context }) => context.entropy >= context.entropyThreshold
}
```

## File Structure Analysis

### Files to Create

| File | Purpose |
|------|---------|
| `src/core/engagement/hooks/useEntropyState.ts` | Entropy state hook |
| `tests/unit/use-entropy-state.test.ts` | Hook unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `src/core/engagement/hooks/index.ts` | Export useEntropyState |
| `src/core/engagement/index.ts` | Export entropy utilities |
| `src/core/engagement/config.ts` | Add entropy defaults |
| `data/infrastructure/health-config.json` | Add entropy health check |

### Files NOT to Modify

| File | Why |
|------|-----|
| `hooks/NarrativeEngineContext.tsx` | Consumer migration in Epic 6 |
| `src/core/engagement/machine.ts` | Machine already has entropy |
| React components | Consumer migration in Epic 6 |

## Test Coverage Assessment

### Existing Tests

| Category | Tests | Status |
|----------|-------|--------|
| Machine UPDATE_ENTROPY | 2 | ✅ Passing |
| Machine highEntropy guard | 1 | ✅ Passing |

### Tests to Add

| Test | Purpose |
|------|---------|
| useEntropyState initialization | Hook starts correctly |
| entropy value derivation | Reads from machine |
| updateEntropy action | Sends UPDATE_ENTROPY |
| resetEntropy action | Resets to 0 |
| isHighEntropy computed | Threshold comparison |
| threshold configuration | Uses config value |

## Entropy Thresholds

```typescript
// Default configuration
const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
};
```

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Entropy drift | Low | Low | Clamp to 0-1 range |
| Threshold mismatch | Low | Medium | Single source (machine) |
| Missing reset on journey | Low | Medium | Hook handles reset |

## Recommendations

1. **Derive from machine** — Consistent with lens/journey hooks
2. **Config for defaults** — Threshold configurable
3. **Clamp values** — Ensure 0-1 range in action
4. **Computed isHighEntropy** — Avoid threshold duplication
5. **Reset on journey start** — Clear entropy when journey begins
