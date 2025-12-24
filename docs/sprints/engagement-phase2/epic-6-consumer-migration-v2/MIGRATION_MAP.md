# Migration Map — Epic 6: Consumer Migration v2

## Overview

Install `EngagementProvider` at app root, then migrate consumer components from `useNarrativeEngine` to engagement hooks. Each component migrates fully—no mixing old and new hooks for the same state.

## Phase 1: Provider Installation

### Step 1.1: Find App Root

```bash
# Check common locations
cat app/layout.tsx
cat app/providers.tsx
cat pages/_app.tsx
```

### Step 1.2: Add EngagementProvider

**File:** `app/layout.tsx` (or wherever providers are)

**Add import:**
```typescript
import { EngagementProvider } from '@/core/engagement';
```

**Wrap children:**
```typescript
<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

### Step 1.3: Verify

```bash
npm run dev
# App loads without errors
# Check browser console for "useEngagement must be used within EngagementProvider"
```

---

## Phase 2: Migrate JourneyInspector (Simple)

### File: `src/explore/JourneyInspector.tsx`

**Current usage (lines ~12-17):**
```typescript
const { 
  activeJourneyId, 
  startJourney, 
  exitJourney, 
  getJourney 
} = useNarrativeEngine();
```

**Migrated:**
```typescript
import { useEngagement, useJourneyState } from '@/core/engagement';

// Keep schema helpers from NarrativeEngine
const { getJourney } = useNarrativeEngine();

// Get engagement state from new hooks
const { actor } = useEngagement();
const { journey, startJourney, exitJourney, isActive } = useJourneyState({ actor });

// Compatibility mapping
const activeJourneyId = journey?.id ?? null;
```

**Notes:**
- `startJourney(journeyId)` → Need to pass full journey object: `startJourney(getJourney(journeyId)!)`
- `isActive` replaces checking `activeJourneyId === journeyId`

---

## Phase 3: Migrate JourneyList

### File: `src/explore/JourneyList.tsx`

**Current usage (line ~137):**
```typescript
const { schema, loading, startJourney, activeJourneyId, getJourney } = useNarrativeEngine();
```

**Migrated:**
```typescript
import { useEngagement, useJourneyState } from '@/core/engagement';

// Schema data stays with NarrativeEngine
const { schema, loading, getJourney } = useNarrativeEngine();

// Engagement state from new hooks
const { actor } = useEngagement();
const { journey, startJourney } = useJourneyState({ actor });

const activeJourneyId = journey?.id ?? null;
```

**Handler update:**
```typescript
// OLD
const handleStart = (journeyId: string) => {
  startJourney(journeyId);
};

// NEW
const handleStart = (journeyId: string) => {
  const j = getJourney(journeyId);
  if (j) startJourney(j);
};
```

---

## Phase 4: Migrate LensPicker

### File: `src/explore/LensPicker.tsx`

**Current usage (line ~338):**
```typescript
const { session, selectLens, getEnabledPersonas } = useNarrativeEngine();
const activeLensId = session.activeLens;
```

**Migrated:**
```typescript
import { useEngagement, useLensState } from '@/core/engagement';

// Schema helpers stay with NarrativeEngine
const { getEnabledPersonas } = useNarrativeEngine();

// Lens state from new hook
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });

const activeLensId = lens;  // Direct mapping
```

---

## Phase 5: Migrate Terminal (Complex)

### File: `components/Terminal.tsx`

**This is the most complex migration.** Terminal uses:
- Lens state (activeLens, selectLens)
- Journey state (activeJourneyId, startJourney, advanceNode, exitJourney)
- Entropy state (entropyState, evaluateEntropy, checkShouldInject, etc.)
- Schema and session data (keep in NarrativeEngine)

**Current usage (lines ~155-160):**
```typescript
const {
  schema,
  session,
  loading,
  selectLens,
  startJourney,
  advanceNode,
  exitJourney,
  activeJourneyId,
  currentNodeId,
  visitedNodes,
  entropyState,
  evaluateEntropy,
  checkShouldInject,
  recordEntropyInjection,
  recordEntropyDismiss,
  tickEntropyCooldown,
  getJourneyIdForCluster,
  isFirstTimeUser,
  urlLensId
} = useNarrativeEngine();
```

**Migrated:**
```typescript
import { useEngagement, useLensState, useJourneyState, useEntropyState } from '@/core/engagement';

// Schema/session data stays with NarrativeEngine
const {
  schema,
  session,
  loading,
  getJourney,
  getJourneyIdForCluster,
  isFirstTimeUser,
  urlLensId
} = useNarrativeEngine();

// Engagement hooks
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
const { 
  journey, 
  startJourney, 
  advanceStep,  // renamed from advanceNode
  exitJourney,
  journeyProgress,
  isActive: isJourneyActive 
} = useJourneyState({ actor });
const { entropy, entropyThreshold, updateEntropy, resetEntropy } = useEntropyState({ actor });

// Compatibility mappings
const activeJourneyId = journey?.id ?? null;
const activeLens = lens ?? session.activeLens;  // Fallback during transition
```

**Entropy migration notes:**
- `entropyState.currentEntropy` → `entropy`
- `checkShouldInject()` → Compare `entropy >= entropyThreshold`
- Old entropy functions (evaluateEntropy, recordEntropyInjection, etc.) may need to stay with NarrativeEngine temporarily

---

## Build Gates

### After Phase 1 (Provider)
```bash
npm run dev        # App loads
npm test           # 152 tests pass
```

### After Phase 2-4 (Simple Components)
```bash
npm run dev        # Components work
npm test           # 152 tests pass
npx playwright test tests/e2e/engagement-migration.spec.ts
```

### After Phase 5 (Terminal)
```bash
npm run build      # Compiles
npm test           # 152 tests pass
npx playwright test  # All E2E pass
npm run health     # Health passes
```

---

## Files Summary

### Files to Modify

| File | Change Type |
|------|-------------|
| `app/layout.tsx` | Add EngagementProvider wrapper |
| `src/explore/JourneyInspector.tsx` | Replace useNarrativeEngine calls |
| `src/explore/JourneyList.tsx` | Replace useNarrativeEngine calls |
| `src/explore/LensPicker.tsx` | Replace useNarrativeEngine calls |
| `components/Terminal.tsx` | Replace useNarrativeEngine calls |

### Files to Create

| File | Purpose |
|------|---------|
| `tests/e2e/engagement-migration.spec.ts` | E2E migration verification |

### Files NOT to Modify

| File | Reason |
|------|--------|
| `src/explore/NodeGrid.tsx` | No engagement state |
| `src/explore/LensInspector.tsx` | No engagement state |
| `src/cultivate/SproutInspector.tsx` | No engagement state |
| `components/Terminal/Modals/JourneysModal.tsx` | Schema only |
| `src/core/engagement/*` | Already complete |

---

## Verification Checklist

- [ ] Provider installed at app root
- [ ] JourneyInspector migrated
- [ ] JourneyList migrated
- [ ] LensPicker migrated
- [ ] Terminal migrated
- [ ] E2E test created and passing
- [ ] All unit tests pass (152)
- [ ] Health check passes
- [ ] No console errors in dev mode
