# Execution Prompt — Epic 6: Consumer Migration v2

## Context

Epics 1-5 created the engagement infrastructure (152 tests passing). Epic 6.1 fixed React 19 test compatibility. This sprint wires the engagement system into the application by installing `EngagementProvider` and migrating components from `useNarrativeEngine` to the new hooks.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-6-consumer-migration-v2/`:
- `REPO_AUDIT.md` — Consumer inventory and migration scope
- `SPEC.md` — Goals, non-goals, acceptance criteria
- `ARCHITECTURE.md` — Dual-provider pattern, API mapping
- `MIGRATION_MAP.md` — File-by-file change plan
- `DECISIONS.md` — ADRs 076-081
- `SPRINTS.md` — Epic/story breakdown with tests

## Repository Intelligence

**Engagement system:**
- `src/core/engagement/index.ts` — Barrel exports
- `src/core/engagement/context.tsx` — EngagementProvider, useEngagement
- `src/core/engagement/hooks/*.ts` — useLensState, useJourneyState, useEntropyState

**Legacy system:**
- `hooks/NarrativeEngineContext.tsx` — Monolithic context (keep for schema)
- `hooks/useNarrativeEngine.ts` — Re-export wrapper

**Components to migrate:**
- `src/explore/JourneyInspector.tsx` (line 12: useNarrativeEngine destructure)
- `src/explore/JourneyList.tsx` (line 137: useNarrativeEngine destructure)
- `src/explore/LensPicker.tsx` (line 338: useNarrativeEngine destructure)
- `components/Terminal.tsx` (line 160: large destructure)

## DEX Compliance Rules

- NO new `handle*` callbacks for domain logic
- Behavior defined in state machine, not component code
- Test behavior, not implementation (`toBeVisible()` not `toHaveClass()`)

---

## Execution Order

### Phase 1: Install EngagementProvider (10 min)

**Step 1:** Find app root provider location
```bash
# Check these files for provider wrappers
cat app/layout.tsx
cat app/providers.tsx
```

**Step 2:** Add EngagementProvider

If using `app/layout.tsx`:
```typescript
import { EngagementProvider } from '@/core/engagement';

// In the render, inside NarrativeEngineProvider:
<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

**Step 3:** Verify
```bash
npm run dev
# Check: App loads, no provider errors in console
```

---

### Phase 2: Migrate JourneyInspector (15 min)

**File:** `src/explore/JourneyInspector.tsx`

**Find current usage (~line 12-17):**
```typescript
const { activeJourneyId, startJourney, exitJourney, getJourney } = useNarrativeEngine();
```

**Replace with:**
```typescript
import { useEngagement, useJourneyState } from '@/core/engagement';

// Inside component:
const { getJourney } = useNarrativeEngine();  // Keep for schema
const { actor } = useEngagement();
const { journey, startJourney: engStartJourney, exitJourney, isActive } = useJourneyState({ actor });

// Compatibility
const activeJourneyId = journey?.id ?? null;

// Update startJourney calls:
// OLD: startJourney(journeyId)
// NEW: const j = getJourney(journeyId); if (j) engStartJourney(j);
```

**Verify:**
```bash
npm run dev
# Navigate to journey inspector, verify it displays journey state
```

---

### Phase 3: Create E2E Migration Test (15 min)

**Create:** `tests/e2e/engagement-migration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // No console errors about provider
  });

  test('engagement hooks work after migration', async ({ page }) => {
    await page.goto('/');
    // App should be functional
    await expect(page.locator('body')).toBeVisible();
  });
});
```

**Run:**
```bash
npx playwright test tests/e2e/engagement-migration.spec.ts
```

---

### Phase 4: Migrate JourneyList (15 min)

**File:** `src/explore/JourneyList.tsx`

**Find current usage (~line 137):**
```typescript
const { schema, loading, startJourney, activeJourneyId, getJourney } = useNarrativeEngine();
```

**Replace with:**
```typescript
import { useEngagement, useJourneyState } from '@/core/engagement';

// Inside component:
const { schema, loading, getJourney } = useNarrativeEngine();  // Keep schema
const { actor } = useEngagement();
const { journey, startJourney: engStartJourney } = useJourneyState({ actor });

const activeJourneyId = journey?.id ?? null;

// Update handleStart:
const handleStart = (journeyId: string) => {
  const j = getJourney(journeyId);
  if (j) engStartJourney(j);
  // ... rest of handler
};
```

---

### Phase 5: Migrate LensPicker (15 min)

**File:** `src/explore/LensPicker.tsx`

**Find current usage (~line 338):**
```typescript
const { session, selectLens, getEnabledPersonas } = useNarrativeEngine();
const activeLensId = session.activeLens;
```

**Replace with:**
```typescript
import { useEngagement, useLensState } from '@/core/engagement';

// Inside component:
const { getEnabledPersonas } = useNarrativeEngine();  // Keep schema helper
const { actor } = useEngagement();
const { lens, selectLens: engSelectLens } = useLensState({ actor });

const activeLensId = lens;

// Update selectLens calls to use engSelectLens
```

---

### Phase 6: Migrate Terminal (30-45 min)

**File:** `components/Terminal.tsx`

This is complex. Migrate in stages:

**Stage A: Add imports**
```typescript
import { useEngagement, useLensState, useJourneyState, useEntropyState } from '@/core/engagement';
```

**Stage B: Add hooks after existing useNarrativeEngine**
```typescript
const { actor } = useEngagement();
const { lens, selectLens: engSelectLens } = useLensState({ actor });
const { 
  journey, 
  startJourney: engStartJourney, 
  advanceStep,  // renamed from advanceNode
  exitJourney: engExitJourney,
  isActive: isJourneyActive 
} = useJourneyState({ actor });
const { entropy, entropyThreshold, updateEntropy, resetEntropy } = useEntropyState({ actor });
```

**Stage C: Create compatibility mappings**
```typescript
const activeJourneyId = journey?.id ?? null;
const activeLens = lens;
// For advanceNode → advanceStep rename
```

**Stage D: Update function calls one by one**
- Find `selectLens(` → replace with `engSelectLens(`
- Find `startJourney(` → replace with `engStartJourney(getJourney(id)!)`
- Find `advanceNode(` → replace with `advanceStep(`
- Find `exitJourney(` → replace with `engExitJourney(`

**Stage E: Handle entropy (may be partial)**
- Replace `entropyState.currentEntropy` with `entropy`
- Some entropy functions may need to stay with NarrativeEngine if they depend on schema

---

## Test Verification

### After Each Phase
```bash
npm run dev          # App runs
npm test             # 152 unit tests pass
```

### After All Phases
```bash
npm run build
npm test
npx playwright test
npm run health
```

## Success Criteria

- [ ] EngagementProvider installed at app root
- [ ] JourneyInspector migrated
- [ ] JourneyList migrated  
- [ ] LensPicker migrated
- [ ] Terminal migrated
- [ ] E2E migration test created and passing
- [ ] All 152 unit tests pass
- [ ] All E2E tests pass
- [ ] Health check passes
- [ ] No console errors about providers

## Forbidden Actions

- Do NOT remove NarrativeEngineContext (Epic 7)
- Do NOT migrate non-engagement features (schema, cards, threads)
- Do NOT mix old and new hooks for same state in one component
- Do NOT add implementation-detail tests

## Troubleshooting

### "useEngagement must be used within EngagementProvider"
Provider not installed or wrong position. Check app root wrapper order.

### State not syncing
Component may be mixing old and new hooks. Migrate fully.

### startJourney doesn't work
New signature requires Journey object, not ID:
```typescript
// OLD: startJourney(journeyId)
// NEW: startJourney(getJourney(journeyId)!)
```

### advanceNode doesn't exist
Renamed to `advanceStep`:
```typescript
// OLD: advanceNode()
// NEW: advanceStep()
```

### Tests fail with React.act warning
This was fixed in Epic 6.1. If it recurs, verify `vitest.config.ts` has `environment: 'jsdom'`.

## Commit Messages

```
feat(app): install EngagementProvider at root
refactor(JourneyInspector): migrate to engagement hooks
test: add engagement migration E2E tests
refactor(JourneyList): migrate to engagement hooks
refactor(LensPicker): migrate to engagement hooks
refactor(Terminal): migrate to engagement hooks
```
