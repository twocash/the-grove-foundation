# Architectural Decision Records — Epic 3: Journey State Extraction

## ADR-047: Derive All Journey State from Machine

### Status
Accepted

### Context
The `useJourneyState` hook needs journey state. Should it maintain local state or derive entirely from the machine?

### Options Considered

1. **Derive from machine** — Read journey/progress from machine context
2. **Mirror in local state** — Copy machine state to React state
3. **Split ownership** — Some state in hook, some in machine
4. **Separate journey store** — Dedicated state management

### Decision
Derive all journey state from machine context via `useSyncExternalStore`.

### Rationale
- Single source of truth (machine context)
- No synchronization issues
- Guards and transitions already defined in machine
- Consistent with `useLensState` pattern from Epic 2
- Simpler mental model

```typescript
const { journey, journeyProgress, journeyTotal } = snapshot.context;
const isActive = snapshot.matches('session.journeyActive');
```

### Consequences

**Positive:**
- No state duplication
- Machine guards ensure valid transitions
- Predictable behavior

**Negative:**
- All state changes require machine events
- Cannot have hook-only state

---

## ADR-048: Computed Values via useMemo

### Status
Accepted

### Context
`currentStep` and `progressPercent` are derived from journey and progress. How should they be computed?

### Options Considered

1. **useMemo** — Memoized computation in hook
2. **Machine selectors** — Define in machine, use useSelector
3. **Inline computation** — Compute on every render
4. **Store in context** — Machine computes and stores

### Decision
Use `useMemo` for computed values in the hook.

### Rationale
- Simple and idiomatic React
- Avoids unnecessary recomputation
- Keeps machine context minimal
- Easy to test (pure functions)

```typescript
const currentStep = useMemo(() => {
  if (!journey?.steps) return null;
  return journey.steps[journeyProgress] ?? null;
}, [journey, journeyProgress]);

const progressPercent = useMemo(() => {
  if (journeyTotal === 0) return 0;
  return Math.round(((journeyProgress + 1) / journeyTotal) * 100);
}, [journeyProgress, journeyTotal]);
```

### Consequences

**Positive:**
- Memoized for performance
- Clear dependency tracking
- Easy to understand

**Negative:**
- Computed on every hook use (not shared)
- Duplicated if multiple consumers

---

## ADR-049: Progress as 0-Indexed with +1 Display

### Status
Accepted

### Context
How should journey progress be represented? 0-indexed (internal) vs 1-indexed (display)?

### Options Considered

1. **0-indexed internally, +1 for display** — Array index matches progress
2. **1-indexed everywhere** — Human-friendly but offset from array
3. **Separate values** — `progressIndex` and `progressDisplay`

### Decision
Store 0-indexed progress in machine, compute display values in hook.

### Rationale
- Array indexing is naturally 0-indexed
- Guards like `notAtEnd` are simpler: `progress < total - 1`
- Display logic belongs in hook, not machine
- Consistent with JavaScript conventions

```typescript
// Machine stores 0-indexed
context.journeyProgress = 0;  // First step

// Hook computes display
const progressPercent = Math.round(((journeyProgress + 1) / journeyTotal) * 100);
// Step 0 of 5 = 20% (1/5)
```

### Consequences

**Positive:**
- Clean array access: `steps[progress]`
- Simple guards
- Clear separation of concerns

**Negative:**
- Must remember +1 for human-readable display
- Potential off-by-one confusion

---

## ADR-050: Persist Only Completion, Not Progress

### Status
Accepted

### Context
Should we persist in-progress journey state for resume, or only completion?

### Options Considered

1. **Completion only** — Simple, tracks what matters
2. **Completion + progress** — Can resume mid-journey
3. **Full state** — Journey + step + all context
4. **Nothing** — Start fresh each session

### Decision
Persist only journey completion IDs for MVP.

### Rationale
- Simpler implementation
- Completion is the meaningful outcome
- Progress resume adds complexity (stale journeys, version changes)
- Can add progress persistence later if needed
- Matches spec: "journey progress resume" is out of scope

```typescript
// Only track completion
localStorage['grove-completed-journeys'] = JSON.stringify(['journey-1', 'journey-2']);
```

### Consequences

**Positive:**
- Simple persistence
- No stale state issues
- Clear success tracking

**Negative:**
- Users restart journeys on page reload
- No "continue where you left off"

---

## ADR-051: Completion Tracking in Hook Effect

### Status
Accepted

### Context
When should journey completion be persisted? In the machine action, or in the hook?

### Options Considered

1. **Hook useEffect** — Persist when `isComplete && journey`
2. **Machine action** — Persist in `completeJourney` action
3. **Explicit call** — Consumer calls `persistCompletion()`
4. **Saga/middleware** — Separate persistence layer

### Decision
Use `useEffect` in hook to persist when `isComplete` becomes true.

### Rationale
- Machine stays pure (no side effects beyond state)
- Hook handles React-specific concerns
- Effect runs after render, ensuring state is settled
- Matches persistence pattern from `useLensState`

```typescript
useEffect(() => {
  if (isComplete && journey) {
    markJourneyCompleted(journey.id);
  }
}, [isComplete, journey]);
```

### Consequences

**Positive:**
- Machine remains pure
- Consistent with React patterns
- Automatic persistence

**Negative:**
- Persistence depends on hook being mounted
- Race condition possible if unmount before effect

---

## ADR-052: Completion Array vs Set for Storage

### Status
Accepted

### Context
How should completed journey IDs be stored in localStorage?

### Options Considered

1. **JSON array** — `['j1', 'j2', 'j3']`
2. **JSON object/Set** — `{'j1': true, 'j2': true}`
3. **Comma-separated string** — `'j1,j2,j3'`
4. **Individual keys** — `journey-j1-complete: true`

### Decision
Use JSON array of journey IDs.

### Rationale
- Simple and readable
- Easy to add/check/list
- Consistent with common patterns
- Can convert to Set in memory if needed for O(1) lookup

```typescript
// Storage
localStorage['grove-completed-journeys'] = JSON.stringify(['journey-1', 'journey-2']);

// Usage
const completed = getCompletedJourneys(); // string[]
const isCompleted = completed.includes(journeyId);
```

### Consequences

**Positive:**
- Human-readable storage
- Simple implementation
- Easy debugging

**Negative:**
- O(n) lookup with includes()
- Need to parse/stringify on every access

---

## ADR-053: Hook Returns completedJourneys Array

### Status
Accepted

### Context
Should the hook return the full list of completed journeys, or only provide `isJourneyCompleted(id)`?

### Options Considered

1. **Both** — Return array and checker function
2. **Function only** — `isJourneyCompleted(id)`
3. **Array only** — Let consumer check with `includes()`
4. **Neither** — Separate completion tracking hook

### Decision
Return both `completedJourneys` array and `isJourneyCompleted` function.

### Rationale
- Array useful for displaying completion badges/lists
- Function convenient for single checks
- No additional cost (both read same localStorage)
- Flexible for different use cases

```typescript
return {
  completedJourneys,        // string[] - for lists, badges
  isJourneyCompleted,       // (id) => boolean - for checks
};
```

### Consequences

**Positive:**
- Flexibility for consumers
- Convenient API
- No performance penalty

**Negative:**
- Slightly larger return object
- Two ways to check completion
