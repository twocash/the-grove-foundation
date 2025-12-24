# Epic 7: Context Cleanup - Execution Prompt

**For:** Claude Code CLI
**Date:** 2024-12-24
**Duration:** 1-2 hours

---

## Context

You are completing **Epic 7: Context Cleanup** for the Grove Foundation engagement system.

**What happened before:**
- Epic 6 migrated 4 components from useNarrativeEngine to engagement hooks
- Components now use useLensState, useJourneyState, useEntropyState
- NarrativeEngineContext has duplicate state that's no longer needed

**What you're doing:**
- Remove ~200 lines of duplicate state management code
- Simplify NarrativeEngineContext to schema-only provider
- Update Terminal.tsx to remove dead imports

---

## Documentation Reference

Read these before executing:

```
docs/sprints/engagement-phase2/epic-7-context-cleanup/
├── REPO_AUDIT.md       # What to remove vs keep
├── SPEC.md             # Success criteria
├── ARCHITECTURE.md     # Before/after structure
├── MIGRATION_MAP.md    # Exact code changes
├── DECISIONS.md        # ADRs for this epic
├── SPRINTS.md          # Story breakdown
└── DEVLOG.md           # Track your progress
```

---

## Repository Intelligence

### Primary File
**hooks/NarrativeEngineContext.tsx** (694 lines → ~500 lines)

Key locations:
- Interface: lines 187-237
- entropyState useState: line 264
- Entropy localStorage key: line 33
- selectLens callback: lines 370-376
- startJourney callback: lines 462-502
- advanceNode callback: lines 504-521
- exitJourney callback: lines 523-526
- Entropy callbacks: lines 604-628
- Value object: lines 630-680

### Secondary File
**components/Terminal.tsx** (imports at lines 130-161)

### Files to Verify Only
- src/explore/JourneyInspector.tsx (line 15)
- src/explore/JourneyList.tsx (line 139)
- src/explore/LensPicker.tsx (line 340)

---

## Execution Phases

### Phase 1: Remove Entropy (Story 7.2)

**Remove state and key:**
```typescript
// DELETE line ~264:
const [entropyState, setEntropyState] = useState<EntropyState>(DEFAULT_ENTROPY_STATE);

// DELETE line ~33:
const STORAGE_KEY_ENTROPY = 'grove-terminal-entropy';
```

**Remove entropy load effect (lines ~358-368):**
```typescript
// DELETE this entire useEffect
useEffect(() => {
  try {
    const storedEntropy = localStorage.getItem(STORAGE_KEY_ENTROPY);
    // ...
  }
}, []);
```

**Remove entropy persist effect (lines ~370-377):**
```typescript
// DELETE this entire useEffect
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY_ENTROPY, JSON.stringify(entropyState));
    // ...
  }
}, [entropyState]);
```

**Remove entropy callbacks (lines ~604-628):**
```typescript
// DELETE ALL OF THESE:
const evaluateEntropy = useCallback(...);
const checkShouldInject = useCallback(...);
const recordEntropyInjection = useCallback(...);
const recordEntropyDismiss = useCallback(...);
const tickEntropyCooldown = useCallback(...);
const getJourneyIdForCluster = useCallback(...);
```

**Update resetSession - remove entropy references:**
```typescript
// FIND resetSession and REMOVE entropy lines:
const resetSession = useCallback(() => {
  setSession(DEFAULT_TERMINAL_SESSION);
  // DELETE: setEntropyState(DEFAULT_ENTROPY_STATE);
  localStorage.removeItem(STORAGE_KEY_LENS);
  localStorage.removeItem(STORAGE_KEY_SESSION);
  // DELETE: localStorage.removeItem(STORAGE_KEY_ENTROPY);
}, []);
```

---

### Phase 2: Remove Journey Callbacks (Story 7.3)

**Delete startJourney (lines ~462-502):**
```typescript
// DELETE entire callback (~40 lines)
const startJourney = useCallback((journeyId: string) => {
  const journey = getJourney(journeyId);
  // ... all of it
}, [getJourney, schema]);
```

**Delete advanceNode (lines ~504-521):**
```typescript
// DELETE entire callback (~18 lines)
const advanceNode = useCallback((choiceIndex: number = 0) => {
  if (!session.currentNodeId || !schema?.nodes) return;
  // ... all of it
}, [session.currentNodeId, schema]);
```

**Delete exitJourney (lines ~523-526):**
```typescript
// DELETE entire callback
const exitJourney = useCallback(() => {
  console.log('[V2.1] Exiting journey');
  setSession(prev => ({ ...prev, activeJourneyId: null, currentNodeId: null, visitedNodes: [] }));
}, []);
```

---

### Phase 3: Remove Lens Callback (Story 7.4)

**Delete selectLens (lines ~370-376):**
```typescript
// DELETE entire callback
const selectLens = useCallback((personaId: string | null) => {
  console.log('[NarrativeEngine] selectLens:', personaId);
  setSession(prev => {
    if (prev.activeLens === personaId) return prev;
    return { ...prev, activeLens: personaId, exchangeCount: 0 };
  });
}, []);
```

---

### Phase 4: Update Interface (Story 7.1)

**Find NarrativeEngineContextType interface (line ~187) and REMOVE these fields:**

```typescript
// REMOVE from interface:
selectLens: (personaId: string | null) => void;
startJourney: (journeyId: string) => void;
advanceNode: (choiceIndex?: number) => void;
exitJourney: () => void;
activeJourneyId: string | null;
currentNodeId: string | null;
visitedNodes: string[];
entropyState: EntropyState;
evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
checkShouldInject: (entropy: EntropyResult) => boolean;
recordEntropyInjection: (entropy: EntropyResult) => void;
recordEntropyDismiss: () => void;
tickEntropyCooldown: () => void;
getJourneyIdForCluster: (cluster: string) => string | null;
```

---

### Phase 5: Update Value Object (Story 7.5)

**Find the `value` object (line ~630) and REMOVE these properties:**

```typescript
// REMOVE from value object:
selectLens,
startJourney,
advanceNode,
exitJourney,
activeJourneyId: session.activeJourneyId,
currentNodeId: session.currentNodeId,
visitedNodes: session.visitedNodes,
entropyState,
evaluateEntropy,
checkShouldInject,
recordEntropyInjection,
recordEntropyDismiss,
tickEntropyCooldown,
getJourneyIdForCluster,
```

**BUILD GATE:**
```bash
npm run build
```
Should pass now.

---

### Phase 6: Remove Imports (Story 7.6)

**Find entropy imports from entropyDetector (lines ~17-27):**

```typescript
// CHANGE FROM:
import {
  EntropyState,
  EntropyResult,
  DEFAULT_ENTROPY_STATE,
  calculateEntropy,
  shouldInject,
  updateEntropyState,
  dismissEntropy,
  getJourneyForCluster,
  type EntropyMessage
} from '../src/core/engine/entropyDetector';

// CHANGE TO:
// DELETE ENTIRE IMPORT (nothing from entropyDetector is used now)
```

**BUILD GATE:**
```bash
npm run build
```

---

### Phase 7: Update Terminal.tsx (Story 7.7)

**File:** `components/Terminal.tsx`

**Find useNarrativeEngine destructuring (lines ~130-161) and REMOVE:**

```typescript
// REMOVE these from destructuring:
selectLens,
startJourney,
advanceNode,
exitJourney,
activeJourneyId,
currentNodeId: engineCurrentNodeId,  // CHECK if used elsewhere first
visitedNodes,                         // CHECK if used elsewhere first
entropyState,
evaluateEntropy,
checkShouldInject,
recordEntropyInjection,
recordEntropyDismiss,
tickEntropyCooldown,
getJourneyIdForCluster,
```

**BEFORE checking if engineCurrentNodeId and visitedNodes are used:**
Search the file for these variable names. If they're referenced after the destructuring, they may still be needed. Check the context.

**BUILD GATE:**
```bash
npm run build && npm test
```

---

### Phase 8: Verify Consumers (Story 7.8)

Check these files don't import removed fields:

1. `src/explore/JourneyInspector.tsx` line 15
2. `src/explore/JourneyList.tsx` line 139  
3. `src/explore/LensPicker.tsx` line 340

If any reference removed fields, update them.

**FINAL BUILD GATE:**
```bash
npm run build && npm test
```

---

## Success Criteria Checklist

- [ ] NarrativeEngineContext.tsx: ~500 lines (down from 694)
- [ ] Interface: ~36 fields (down from ~50)
- [ ] No entropy imports from entropyDetector
- [ ] No entropy localStorage persistence
- [ ] Terminal.tsx: imports only available fields
- [ ] All 152 unit tests pass
- [ ] Build succeeds
- [ ] Dev server starts without errors

---

## Forbidden Actions

1. **DO NOT** delete NarrativeEngineProvider entirely
2. **DO NOT** remove session tracking (exchangeCount, visitedCards, addVisitedNode)
3. **DO NOT** remove first-time user detection (isFirstTimeUser, urlLensId, referrer)
4. **DO NOT** remove legacy thread methods (deprecated but still used)
5. **DO NOT** remove schema access methods (getPersona, getJourney, getCard, etc.)
6. **DO NOT** remove getActiveLensData (still useful)
7. **DO NOT** add new tests (existing tests cover behavior)
8. **DO NOT** refactor beyond what's specified

---

## Troubleshooting

### Build fails after Phase 5
- Check if value object still references deleted fields
- Check if interface still has deleted fields

### Terminal imports fail
- Some field might still be used in Terminal.tsx
- Search for the field name in the file
- Either keep it or find the engagement hook equivalent

### Tests fail
- Should not happen (we're removing code, not changing behavior)
- Check if any test directly imports from NarrativeEngineContext
- Run `npm test -- --verbose` to see which test fails

---

## Commit Messages

Use these exact messages:
1. `refactor(narrative): remove entropy state and callbacks`
2. `refactor(narrative): remove journey callbacks`
3. `refactor(narrative): remove lens callback`
4. `refactor(narrative): update interface and value object`
5. `refactor(narrative): remove unused imports`
6. `refactor(terminal): remove dead narrative imports`

---

## Completion

When done:
1. Run final verification: `npm run build && npm test`
2. Update DEVLOG.md with results
3. Report: lines removed, tests passing, any issues encountered
