# Epic 7: Context Cleanup - Repository Audit

**Audit Date:** 2024-12-24
**Sprint:** Engagement Phase 2
**Focus:** Remove duplicate state from NarrativeEngineContext

---

## 1. File Under Modification

### NarrativeEngineContext.tsx (694 lines)
**Location:** `hooks/NarrativeEngineContext.tsx`

#### Current State Categories

| Category | Lines (est.) | Keep/Remove | Rationale |
|----------|--------------|-------------|-----------|
| Schema loading | ~60 | KEEP | Core functionality, no duplicate |
| Lens state management | ~40 | REMOVE | Migrated to useLensState |
| Journey state management | ~80 | REMOVE | Migrated to useJourneyState |
| Entropy state management | ~60 | REMOVE | Migrated to useEntropyState |
| Persona getters | ~30 | KEEP | Schema access, not state |
| Card/Node getters | ~50 | KEEP | Schema access, not state |
| Session tracking | ~40 | KEEP | Not migrated (exchangeCount, visited) |
| First-time user detection | ~80 | KEEP | Not migrated |
| LocalStorage persistence | ~60 | PARTIAL | Remove lens/journey/entropy persistence |
| Context interface | ~50 | UPDATE | Remove migrated fields |

---

## 2. State to REMOVE (Now in Engagement Hooks)

### 2.1 Lens State
- **State:** `session.activeLens`
- **Callbacks:** `selectLens`
- **Persistence:** `STORAGE_KEY_LENS` localStorage
- **Context fields:** `selectLens`
- **Migrated to:** `useLensState({ actor })`

### 2.2 Journey State
- **State:** `session.activeJourneyId`, `session.currentNodeId`, `session.visitedNodes`
- **Callbacks:** `startJourney`, `advanceNode`, `exitJourney`
- **Context fields:** `startJourney`, `advanceNode`, `exitJourney`, `activeJourneyId`, `currentNodeId`, `visitedNodes`
- **Migrated to:** `useJourneyState({ actor })`

### 2.3 Entropy State
- **State:** `entropyState` (full EntropyState object)
- **Callbacks:** `evaluateEntropy`, `checkShouldInject`, `recordEntropyInjection`, `recordEntropyDismiss`, `tickEntropyCooldown`, `getJourneyIdForCluster`
- **Persistence:** `STORAGE_KEY_ENTROPY` localStorage
- **Context fields:** All entropy methods
- **Migrated to:** `useEntropyState({ actor })`

---

## 3. State to KEEP (Not Yet Migrated)

### 3.1 Schema & Loading
- `schema`, `loading`, `error`
- Schema fetch from `/api/narrative`
- V1 to V2 migration logic

### 3.2 Persona/Card/Node Getters (Schema Access)
- `getPersona`, `getPersonaById`, `getEnabledPersonas`, `getActiveLensData`
- `getCard`, `getPersonaCards`, `getEntryPoints`, `getNextCards`, `getSectionCards`
- `getJourney`, `getNode`, `getNextNodes`
- `globalSettings`

### 3.3 Session Tracking
- `session.exchangeCount` + `incrementExchangeCount`
- `session.visitedCards` + `addVisitedCard`
- `session.visitedNodes` + `addVisitedNode` (different from journey visitedNodes)
- `shouldNudge`
- `resetSession`

### 3.4 Legacy Thread (Deprecated but Used)
- `currentThread`, `currentPosition`
- `regenerateThread`, `advanceThread`, `getThreadCard`

### 3.5 First-Time User Detection
- `isFirstTimeUser`, `urlLensId`, `referrer`
- Helper functions: `captureReferrer`, `hasIdentifyingParams`, `ensureCleanFirstVisit`, `isReturningUser`, `getStoredReferrer`, `getInitialLens`

---

## 4. Consumers Needing Update

### 4.1 Terminal.tsx (lines 130-161)
**Current imports (to remove):**
```typescript
selectLens,           // → use engSelectLens
startJourney,         // → use engStartJourney
advanceNode,          // → use advanceStep
exitJourney,          // → use engExitJourney
activeJourneyId,      // → use engActiveJourneyId
entropyState,         // → use engEntropy
evaluateEntropy,      // → REMOVE (handled by state machine)
checkShouldInject,    // → REMOVE (handled by state machine)
recordEntropyInjection, // → use engUpdateEntropy
recordEntropyDismiss,   // → use engResetEntropy
tickEntropyCooldown,    // → REMOVE (handled by state machine)
getJourneyIdForCluster, // → REMOVE (handled by state machine)
```

**Keep imports:**
```typescript
schema, loading, error,
getPersona, getPersonaById, getEnabledPersonas,
getJourney, getNode, getNextNodes,
currentNodeId: engineCurrentNodeId, // Still used for compatibility
visitedNodes, addVisitedNode,       // Session tracking (different from journey)
currentThread, currentPosition,      // Legacy
regenerateThread, advanceThread, getThreadCard,
incrementExchangeCount, addVisitedCard,
globalSettings,
isFirstTimeUser, urlLensId
```

### 4.2 JourneyInspector.tsx (line 15)
**Already migrated** - just verify no dead imports

### 4.3 JourneyList.tsx (line 139)
**Already migrated** - just verify no dead imports

### 4.4 LensPicker.tsx (line 340)
**Already migrated** - just verify no dead imports

### 4.5 Components Using Schema Only (No Changes)
- NodeGrid.tsx - uses `schema` only
- LensInspector.tsx - uses `getEnabledPersonas` only
- SproutInspector.tsx - uses `session` only
- JourneysModal.tsx - uses `schema.journeys` only

---

## 5. Interface Changes

### Current NarrativeEngineContextType (50 fields)
Fields to REMOVE:
```typescript
// Lens (1 field)
selectLens: (personaId: string | null) => void;

// Journey (6 fields)
startJourney: (journeyId: string) => void;
advanceNode: (choiceIndex?: number) => void;
exitJourney: () => void;
activeJourneyId: string | null;
currentNodeId: string | null;
visitedNodes: string[];

// Entropy (7 fields)
entropyState: EntropyState;
evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
checkShouldInject: (entropy: EntropyResult) => boolean;
recordEntropyInjection: (entropy: EntropyResult) => void;
recordEntropyDismiss: () => void;
tickEntropyCooldown: () => void;
getJourneyIdForCluster: (cluster: string) => string | null;
```

**Total fields to remove: 14**
**Remaining fields: 36**

---

## 6. Code to Delete

### Callbacks (~120 lines)
- Lines 370-376: `selectLens` callback
- Lines 462-502: `startJourney` callback
- Lines 504-521: `advanceNode` callback
- Lines 523-526: `exitJourney` callback
- Lines 604-608: `evaluateEntropy` callback
- Lines 610-612: `checkShouldInject` callback
- Lines 614-616: `recordEntropyInjection` callback
- Lines 618-620: `recordEntropyDismiss` callback
- Lines 622-624: `tickEntropyCooldown` callback
- Lines 626-628: `getJourneyIdForCluster` callback

### State (~20 lines)
- Lines 264: `entropyState` useState
- Related persistence effects for entropy (lines 358-370)
- Related persistence for lens in session effect (lines 340-356)

### Imports (~5 lines)
- EntropyState, EntropyResult, DEFAULT_ENTROPY_STATE from entropyDetector
- calculateEntropy, shouldInject, updateEntropyState, dismissEntropy, getJourneyForCluster

---

## 7. Test Impact

**Existing tests should pass** - they test behavior, not implementation.

Key verification:
- Unit tests: 152 passing (no changes expected)
- E2E tests: No direct NarrativeEngineContext tests exist
- Build: TypeScript will catch any missing fields

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Remove field still in use | Build fails | TypeScript catches immediately |
| Session tracking confused with journey state | Runtime bug | Keep session.visitedNodes separate |
| Legacy thread methods break | UI regression | Keep all legacy methods, just remove duplicates |
| First-time detection breaks | UX regression | Don't touch first-time code |

**Overall Risk:** LOW - TypeScript will catch any mistakes immediately.

---

## 9. Estimated Line Count

**Before:** 694 lines
**After:** ~500 lines
**Removed:** ~194 lines (28%)

This aligns with the "~200 lines" estimate.
