# Architectural Decision Records — Epic 4: Entropy State Extraction

## ADR-054: Derive Entropy from Machine Context

### Status
Accepted

### Context
The `useEntropyState` hook needs entropy values. Consistent with previous hooks, should it derive from machine?

### Decision
Derive entropy and entropyThreshold from machine context via `useSyncExternalStore`.

### Rationale
- Consistent with useLensState and useJourneyState patterns
- Single source of truth
- Machine handles state updates
- No synchronization issues

```typescript
const { entropy, entropyThreshold } = snapshot.context;
```

### Consequences
- All entropy updates go through machine
- Hook is stateless (derives everything)

---

## ADR-055: Clamp Delta in Hook, Not Machine

### Status
Accepted

### Context
Entropy must stay in 0-1 range. Where should clamping happen?

### Options Considered
1. **Clamp in hook before sending** — Prevents invalid events
2. **Clamp in machine action** — Machine enforces bounds
3. **Both** — Defense in depth
4. **Neither** — Trust callers

### Decision
Clamp delta in hook before sending to machine.

### Rationale
- Prevents unnecessary events (delta = 0 after clamp → no event)
- Hook knows config values
- Machine stays simple
- Callers don't need to know bounds

```typescript
const updateEntropy = useCallback((delta: number) => {
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
```

### Consequences
- Hook is slightly more complex
- Machine trusts hook to send valid deltas
- No-op events avoided

---

## ADR-056: Reset Via Negative Delta, Not Separate Event

### Status
Accepted

### Context
How should `resetEntropy()` work? New event type or reuse UPDATE_ENTROPY?

### Options Considered
1. **Negative delta** — `UPDATE_ENTROPY` with `delta: -currentEntropy`
2. **New event** — `RESET_ENTROPY` event
3. **Direct assign** — `SET_ENTROPY` with value

### Decision
Use negative delta with existing `UPDATE_ENTROPY` event.

### Rationale
- No machine changes needed
- Reuses existing event/action
- Simpler machine definition
- Hook calculates appropriate delta

```typescript
const resetEntropy = useCallback(() => {
  const currentEntropy = actor.getSnapshot().context.entropy;
  if (currentEntropy !== ENTROPY_CONFIG.resetValue) {
    actor.send({ type: 'UPDATE_ENTROPY', delta: -currentEntropy });
  }
}, [actor]);
```

### Consequences
- Reset is atomic (single event)
- Machine doesn't know "reset" concept
- Hook handles reset logic

---

## ADR-057: isHighEntropy as Computed Value

### Status
Accepted

### Context
Should `isHighEntropy` be stored in machine or computed in hook?

### Options Considered
1. **Computed in hook** — `entropy >= entropyThreshold`
2. **Stored in machine** — Separate boolean in context
3. **Machine guard** — Use `highEntropy` guard

### Decision
Compute `isHighEntropy` in hook from machine values.

### Rationale
- Derived data shouldn't be stored
- Threshold can change without state update
- Consistent with `currentStep` pattern in useJourneyState
- Machine guard available for transitions if needed

```typescript
const isHighEntropy = useMemo(() => {
  return entropy >= entropyThreshold;
}, [entropy, entropyThreshold]);
```

### Consequences
- Recomputed on every relevant change
- Single source of truth for threshold
- Hook and machine agree on logic

---

## ADR-058: ENTROPY_CONFIG as Const Object

### Status
Accepted

### Context
How should entropy configuration be structured?

### Options Considered
1. **Const object** — `ENTROPY_CONFIG.defaultThreshold`
2. **Individual exports** — `DEFAULT_THRESHOLD`, `MIN_VALUE`, etc.
3. **Function** — `getEntropyConfig()`
4. **Class** — `EntropyConfig` class

### Decision
Use const object with `as const` assertion.

### Rationale
- Groups related values
- Type inference via `typeof`
- Consistent with VALID_LENSES pattern
- Easy to extend

```typescript
export const ENTROPY_CONFIG = {
  defaultThreshold: 0.7,
  minValue: 0,
  maxValue: 1,
  resetValue: 0,
} as const;

export type EntropyConfig = typeof ENTROPY_CONFIG;
```

### Consequences
- All values readonly
- Type-safe access
- Single import for all config

---

## ADR-059: entropyPercent as Integer 0-100

### Status
Accepted

### Context
How should entropy percentage be represented?

### Options Considered
1. **Integer 0-100** — `Math.round(entropy * 100)`
2. **Decimal 0-100** — `entropy * 100`
3. **Decimal 0-1** — Just use `entropy`
4. **Formatted string** — `"75%"`

### Decision
Return integer 0-100 for display convenience.

### Rationale
- Progress bars typically use 0-100
- Avoids floating point display issues
- Rounded for cleaner UI
- Easy to format: `${entropyPercent}%`

```typescript
const entropyPercent = useMemo(() => {
  return Math.round(entropy * 100);
}, [entropy]);
```

### Consequences
- Small precision loss (acceptable for UI)
- Consistent with progressPercent in useJourneyState
- Ready for display

---

## ADR-060: No Entropy Persistence

### Status
Accepted

### Context
Should entropy be persisted to localStorage like lens and journey completion?

### Options Considered
1. **No persistence** — Reset each session
2. **Persist value** — Resume entropy level
3. **Persist history** — Track entropy over time

### Decision
Do not persist entropy. Reset each session.

### Rationale
- Entropy is conversation-specific, not user-specific
- Stale entropy from old session meaningless
- Simpler implementation
- Matches mental model: new session = fresh start

### Consequences
- Entropy always starts at 0
- No resume functionality
- Simpler hook (no persistence effects)
