# Epic 7: Context Cleanup - Architecture

**Version:** 1.0
**Date:** 2024-12-24

---

## 1. Current Architecture (Before)

### Provider Stack
```
NarrativeEngineProvider (schema + ALL state)
  └── EngagementProvider (state machine)
        └── App components
```

### NarrativeEngineContext Responsibilities (BEFORE)
```
┌─────────────────────────────────────────────────────────────┐
│                  NarrativeEngineContext                      │
├─────────────────────────────────────────────────────────────┤
│ SCHEMA LOADING                                               │
│   schema, loading, error, globalSettings                     │
├─────────────────────────────────────────────────────────────┤
│ SCHEMA ACCESS (Getters)                                      │
│   getPersona, getPersonaById, getEnabledPersonas            │
│   getCard, getPersonaCards, getEntryPoints, etc.            │
│   getJourney, getNode, getNextNodes                         │
├─────────────────────────────────────────────────────────────┤
│ LENS STATE ❌ DUPLICATE                                      │
│   session.activeLens, selectLens                            │
├─────────────────────────────────────────────────────────────┤
│ JOURNEY STATE ❌ DUPLICATE                                   │
│   activeJourneyId, currentNodeId, visitedNodes              │
│   startJourney, advanceNode, exitJourney                    │
├─────────────────────────────────────────────────────────────┤
│ ENTROPY STATE ❌ DUPLICATE                                   │
│   entropyState, evaluateEntropy, checkShouldInject          │
│   recordEntropyInjection, recordEntropyDismiss, etc.        │
├─────────────────────────────────────────────────────────────┤
│ SESSION TRACKING (Keep)                                      │
│   exchangeCount, visitedCards, shouldNudge                  │
│   incrementExchangeCount, addVisitedCard, resetSession      │
├─────────────────────────────────────────────────────────────┤
│ FIRST-TIME USER (Keep)                                       │
│   isFirstTimeUser, urlLensId, referrer                      │
├─────────────────────────────────────────────────────────────┤
│ LEGACY THREAD (Keep - deprecated but used)                   │
│   currentThread, currentPosition                            │
│   regenerateThread, advanceThread, getThreadCard            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Target Architecture (After)

### Provider Stack (Unchanged)
```
NarrativeEngineProvider (schema only)
  └── EngagementProvider (state machine)
        └── App components
```

### NarrativeEngineContext Responsibilities (AFTER)
```
┌─────────────────────────────────────────────────────────────┐
│                  NarrativeEngineContext                      │
├─────────────────────────────────────────────────────────────┤
│ SCHEMA LOADING                                               │
│   schema, loading, error, globalSettings                     │
├─────────────────────────────────────────────────────────────┤
│ SCHEMA ACCESS (Getters)                                      │
│   getPersona, getPersonaById, getEnabledPersonas            │
│   getActiveLensData                                          │
│   getCard, getPersonaCards, getEntryPoints, etc.            │
│   getJourney, getNode, getNextNodes                         │
├─────────────────────────────────────────────────────────────┤
│ SESSION TRACKING                                             │
│   session (exchangeCount, visitedCards, activeLens*)        │
│   incrementExchangeCount, addVisitedCard, addVisitedNode    │
│   shouldNudge, resetSession                                  │
│   * activeLens kept for getActiveLensData compatibility     │
├─────────────────────────────────────────────────────────────┤
│ FIRST-TIME USER                                              │
│   isFirstTimeUser, urlLensId, referrer                      │
├─────────────────────────────────────────────────────────────┤
│ LEGACY THREAD (Deprecated)                                   │
│   currentThread, currentPosition                            │
│   regenerateThread, advanceThread, getThreadCard            │
└─────────────────────────────────────────────────────────────┘

                         ❌ REMOVED ❌
┌─────────────────────────────────────────────────────────────┐
│ Lens state → useLensState({ actor })                        │
│ Journey state → useJourneyState({ actor })                  │
│ Entropy state → useEntropyState({ actor })                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Interface Changes

### BEFORE: NarrativeEngineContextType (~50 fields)

```typescript
interface NarrativeEngineContextType {
  // Schema (KEEP)
  schema: NarrativeSchemaV2 | null;
  loading: boolean;
  error: string | null;
  globalSettings: GlobalSettings;
  
  // Session (KEEP)
  session: TerminalSession;
  
  // Persona getters (KEEP)
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;
  
  // Card getters (KEEP)
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];
  
  // Journey getters (KEEP)
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
  
  // Session tracking (KEEP)
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  addVisitedNode: (nodeId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;
  
  // Legacy thread (KEEP - deprecated)
  currentThread: string[];
  currentPosition: number;
  regenerateThread: () => void;
  advanceThread: () => string | null;
  getThreadCard: (position: number) => Card | null;
  
  // First-time user (KEEP)
  isFirstTimeUser: boolean;
  urlLensId: string | null;
  referrer: { code: string; capturedAt: string; landingUrl: string } | null;
  
  // ═══════════════════════════════════════════════════════════
  // REMOVE BELOW
  // ═══════════════════════════════════════════════════════════
  
  // Lens state (REMOVE - use useLensState)
  selectLens: (personaId: string | null) => void;
  
  // Journey state (REMOVE - use useJourneyState)
  startJourney: (journeyId: string) => void;
  advanceNode: (choiceIndex?: number) => void;
  exitJourney: () => void;
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];
  
  // Entropy state (REMOVE - use useEntropyState)
  entropyState: EntropyState;
  evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
  checkShouldInject: (entropy: EntropyResult) => boolean;
  recordEntropyInjection: (entropy: EntropyResult) => void;
  recordEntropyDismiss: () => void;
  tickEntropyCooldown: () => void;
  getJourneyIdForCluster: (cluster: string) => string | null;
}
```

### AFTER: NarrativeEngineContextType (~36 fields)

```typescript
interface NarrativeEngineContextType {
  // Schema
  schema: NarrativeSchemaV2 | null;
  loading: boolean;
  error: string | null;
  globalSettings: GlobalSettings;
  
  // Session
  session: TerminalSession;
  
  // Persona getters
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;
  
  // Card getters
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];
  
  // Journey getters
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
  
  // Session tracking
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  addVisitedNode: (nodeId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;
  
  // Legacy thread (deprecated)
  currentThread: string[];
  currentPosition: number;
  regenerateThread: () => void;
  advanceThread: () => string | null;
  getThreadCard: (position: number) => Card | null;
  
  // First-time user
  isFirstTimeUser: boolean;
  urlLensId: string | null;
  referrer: { code: string; capturedAt: string; landingUrl: string } | null;
}
```

---

## 4. Terminal.tsx Import Changes

### BEFORE (lines 130-161)
```typescript
const {
  schema,
  loading,
  error,
  getPersona,
  getPersonaById,
  getEnabledPersonas,
  selectLens,              // ❌ REMOVE
  startJourney,            // ❌ REMOVE
  advanceNode,             // ❌ REMOVE
  exitJourney,             // ❌ REMOVE
  getJourney,
  getNode,
  getNextNodes,
  activeJourneyId,         // ❌ REMOVE
  currentNodeId: engineCurrentNodeId,  // KEEP (still used)
  visitedNodes,            // KEEP (session tracking)
  addVisitedNode,
  currentThread,
  currentPosition,
  regenerateThread,
  advanceThread,
  getThreadCard,
  incrementExchangeCount,
  addVisitedCard,
  globalSettings,
  entropyState,            // ❌ REMOVE
  evaluateEntropy,         // ❌ REMOVE
  checkShouldInject,       // ❌ REMOVE
  recordEntropyInjection,  // ❌ REMOVE
  recordEntropyDismiss,    // ❌ REMOVE
  tickEntropyCooldown,     // ❌ REMOVE
  getJourneyIdForCluster,  // ❌ REMOVE
  isFirstTimeUser,
  urlLensId
} = useNarrativeEngine();
```

### AFTER
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

**Note:** Terminal already has engagement hooks imported and ready to use.

---

## 5. File Changes Summary

| File | Change Type | Lines Affected |
|------|-------------|----------------|
| hooks/NarrativeEngineContext.tsx | Major refactor | -194 lines |
| components/Terminal.tsx | Import cleanup | -15 lines |
| src/explore/JourneyInspector.tsx | Verify clean | 0 |
| src/explore/JourneyList.tsx | Verify clean | 0 |
| src/explore/LensPicker.tsx | Verify clean | 0 |

---

## 6. Data Flow (After Cleanup)

```
User Action
    │
    ├─► Lens change ──► useLensState ──► EngagementProvider
    │
    ├─► Journey action ──► useJourneyState ──► EngagementProvider
    │
    ├─► Entropy update ──► useEntropyState ──► EngagementProvider
    │
    └─► Schema access ──► useNarrativeEngine ──► NarrativeEngineProvider
```

Clean separation: **State in EngagementProvider, Schema in NarrativeEngineProvider.**
