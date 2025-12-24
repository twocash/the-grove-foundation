# Epic 7: Context Cleanup - Migration Map

**Version:** 1.0
**Date:** 2024-12-24

---

## Execution Order

```
Phase 1: Update Interface ────► Build gate
Phase 2: Remove Callbacks ────► Build gate  
Phase 3: Remove State & Effects ────► Build gate
Phase 4: Remove Imports ────► Build gate
Phase 5: Update Terminal Imports ────► Build gate
Phase 6: Verify Other Consumers ────► Final build
```

---

## Phase 1: Update Interface (NarrativeEngineContextType)

**File:** `hooks/NarrativeEngineContext.tsx`
**Lines:** 187-237 (interface definition)

### Remove These Fields from Interface

```typescript
// REMOVE from interface (lines ~192-237):
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

### Keep These Fields

```typescript
interface NarrativeEngineContextType {
  schema: NarrativeSchemaV2 | null;
  session: TerminalSession;
  loading: boolean;
  error: string | null;
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];
  currentThread: string[];
  currentPosition: number;
  regenerateThread: () => void;
  advanceThread: () => string | null;
  getThreadCard: (position: number) => Card | null;
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  addVisitedNode: (nodeId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;
  globalSettings: GlobalSettings;
  isFirstTimeUser: boolean;
  urlLensId: string | null;
  referrer: { code: string; capturedAt: string; landingUrl: string } | null;
}
```

**Build Gate:** `npm run build` - expect TypeScript errors (callbacks not defined)

---

## Phase 2: Remove Callbacks

**File:** `hooks/NarrativeEngineContext.tsx`

### 2.1 Remove selectLens Callback
**Lines ~370-376**
```typescript
// DELETE:
const selectLens = useCallback((personaId: string | null) => {
  console.log('[NarrativeEngine] selectLens:', personaId);
  setSession(prev => {
    if (prev.activeLens === personaId) return prev;
    return { ...prev, activeLens: personaId, exchangeCount: 0 };
  });
}, []);
```

### 2.2 Remove Journey Callbacks
**Lines ~462-526**
```typescript
// DELETE: startJourney callback (~40 lines)
const startJourney = useCallback((journeyId: string) => {
  // ... entire function
}, [getJourney, schema]);

// DELETE: advanceNode callback (~18 lines)
const advanceNode = useCallback((choiceIndex: number = 0) => {
  // ... entire function
}, [session.currentNodeId, schema]);

// DELETE: exitJourney callback (~4 lines)
const exitJourney = useCallback(() => {
  console.log('[V2.1] Exiting journey');
  setSession(prev => ({ ...prev, activeJourneyId: null, currentNodeId: null, visitedNodes: [] }));
}, []);
```

### 2.3 Remove Entropy Callbacks
**Lines ~604-628**
```typescript
// DELETE: evaluateEntropy callback
const evaluateEntropy = useCallback((message: string, history: EntropyMessage[]): EntropyResult => {
  // ... entire function
}, [schema, session.exchangeCount]);

// DELETE: checkShouldInject callback
const checkShouldInject = useCallback((entropy: EntropyResult): boolean => {
  return shouldInject(entropy, entropyState);
}, [entropyState]);

// DELETE: recordEntropyInjection callback
const recordEntropyInjection = useCallback((entropy: EntropyResult) => {
  setEntropyState(prev => updateEntropyState(prev, entropy, true, session.exchangeCount));
}, [session.exchangeCount]);

// DELETE: recordEntropyDismiss callback
const recordEntropyDismiss = useCallback(() => {
  setEntropyState(prev => dismissEntropy(prev, session.exchangeCount));
}, [session.exchangeCount]);

// DELETE: tickEntropyCooldown callback
const tickEntropyCooldown = useCallback(() => {
  setEntropyState(prev => ({ ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1) }));
}, []);

// DELETE: getJourneyIdForCluster callback
const getJourneyIdForCluster = useCallback((cluster: string): string | null => {
  return getJourneyForCluster(cluster);
}, []);
```

**Build Gate:** `npm run build` - expect TypeScript errors (state not defined)

---

## Phase 3: Remove State & Persistence Effects

**File:** `hooks/NarrativeEngineContext.tsx`

### 3.1 Remove entropyState useState
**Line ~264**
```typescript
// DELETE:
const [entropyState, setEntropyState] = useState<EntropyState>(DEFAULT_ENTROPY_STATE);
```

### 3.2 Remove Entropy localStorage Key
**Line ~33**
```typescript
// DELETE:
const STORAGE_KEY_ENTROPY = 'grove-terminal-entropy';
```

### 3.3 Remove Entropy Load Effect
**Lines ~358-368**
```typescript
// DELETE:
useEffect(() => {
  try {
    const storedEntropy = localStorage.getItem(STORAGE_KEY_ENTROPY);
    if (storedEntropy) {
      const parsed = JSON.parse(storedEntropy) as Partial<EntropyState>;
      setEntropyState(prev => ({ ...prev, ...parsed }));
    }
  } catch (err) {
    console.error('Failed to restore entropy state:', err);
  }
}, []);
```

### 3.4 Remove Entropy Persist Effect
**Lines ~370-377**
```typescript
// DELETE:
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY_ENTROPY, JSON.stringify(entropyState));
  } catch (err) {
    console.error('Failed to persist entropy state:', err);
  }
}, [entropyState]);
```

### 3.5 Update resetSession to Remove Entropy
**Find in resetSession callback:**
```typescript
// CHANGE FROM:
const resetSession = useCallback(() => {
  setSession(DEFAULT_TERMINAL_SESSION);
  setEntropyState(DEFAULT_ENTROPY_STATE);  // ❌ DELETE this line
  localStorage.removeItem(STORAGE_KEY_LENS);
  localStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_ENTROPY);  // ❌ DELETE this line
}, []);

// CHANGE TO:
const resetSession = useCallback(() => {
  setSession(DEFAULT_TERMINAL_SESSION);
  localStorage.removeItem(STORAGE_KEY_LENS);
  localStorage.removeItem(STORAGE_KEY_SESSION);
}, []);
```

**Build Gate:** `npm run build` - expect TypeScript errors (value object)

---

## Phase 4: Update Context Value Object

**File:** `hooks/NarrativeEngineContext.tsx`
**Lines ~630-680 (value object)**

### Remove These from Value Object

```typescript
// DELETE from value object:
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

**Build Gate:** `npm run build` - should pass now

---

## Phase 5: Remove Unused Imports

**File:** `hooks/NarrativeEngineContext.tsx`
**Lines ~17-27**

### Remove These Imports

```typescript
// DELETE from entropyDetector import:
import {
  EntropyState,        // ❌ REMOVE
  EntropyResult,       // ❌ REMOVE  
  DEFAULT_ENTROPY_STATE,  // ❌ REMOVE
  calculateEntropy,    // ❌ REMOVE
  shouldInject,        // ❌ REMOVE
  updateEntropyState,  // ❌ REMOVE
  dismissEntropy,      // ❌ REMOVE
  getJourneyForCluster,  // ❌ REMOVE
  type EntropyMessage  // ❌ REMOVE
} from '../src/core/engine/entropyDetector';
```

If nothing else from entropyDetector is used, delete the entire import line.

**Build Gate:** `npm run build` - should pass

---

## Phase 6: Update Terminal.tsx Imports

**File:** `components/Terminal.tsx`
**Lines ~130-161**

### Current Imports (with removals marked)

```typescript
const {
  schema,
  loading,
  error,
  getPersona,
  getPersonaById,
  getEnabledPersonas,
  selectLens,              // ❌ DELETE
  startJourney,            // ❌ DELETE
  advanceNode,             // ❌ DELETE
  exitJourney,             // ❌ DELETE
  getJourney,
  getNode,
  getNextNodes,
  activeJourneyId,         // ❌ DELETE
  currentNodeId: engineCurrentNodeId,  // ❌ DELETE (check if used)
  visitedNodes,            // ❌ DELETE
  addVisitedNode,
  currentThread,
  currentPosition,
  regenerateThread,
  advanceThread,
  getThreadCard,
  incrementExchangeCount,
  addVisitedCard,
  globalSettings,
  entropyState,            // ❌ DELETE
  evaluateEntropy,         // ❌ DELETE
  checkShouldInject,       // ❌ DELETE
  recordEntropyInjection,  // ❌ DELETE
  recordEntropyDismiss,    // ❌ DELETE
  tickEntropyCooldown,     // ❌ DELETE
  getJourneyIdForCluster,  // ❌ DELETE
  isFirstTimeUser,
  urlLensId
} = useNarrativeEngine();
```

### Target Imports

```typescript
const {
  schema,
  loading,
  error,
  getPersona,
  getPersonaById,
  getEnabledPersonas,
  getJourney,
  getNode,
  getNextNodes,
  addVisitedNode,
  currentThread,
  currentPosition,
  regenerateThread,
  advanceThread,
  getThreadCard,
  incrementExchangeCount,
  addVisitedCard,
  globalSettings,
  isFirstTimeUser,
  urlLensId
} = useNarrativeEngine();
```

### Also Check for Any Remaining Usage

Search Terminal.tsx for:
- `engineCurrentNodeId` - if used, either keep in context or map from engagement
- `visitedNodes` (from context, not engagement) - check if this is session tracking

**Build Gate:** `npm run build` - must pass

---

## Phase 7: Verify Other Consumers

### JourneyInspector.tsx
Check line 15 - should only import schema access methods.

### JourneyList.tsx  
Check line 139 - should only import schema access methods.

### LensPicker.tsx
Check line 340 - should only import `getEnabledPersonas`.

If any of these still import removed fields, update them.

**Build Gate:** `npm run build && npm test`

---

## Final Verification Checklist

- [ ] `hooks/NarrativeEngineContext.tsx` reduced from 694 to ~500 lines
- [ ] Interface has ~36 fields (down from ~50)
- [ ] No entropy imports from entropyDetector
- [ ] No entropy localStorage persistence
- [ ] Terminal.tsx imports only available fields
- [ ] All 152 unit tests pass
- [ ] Build succeeds
- [ ] Dev server starts
