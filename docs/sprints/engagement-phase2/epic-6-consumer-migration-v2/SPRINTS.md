# Sprint Stories — Epic 6: Consumer Migration v2

## Epic 1: Provider Installation (Priority: Critical)

### Story 1.1: Install EngagementProvider

**Task:** Add `EngagementProvider` wrapper at app root
**File:** `app/layout.tsx` or `app/providers.tsx`
**Changes:**
1. Add import: `import { EngagementProvider } from '@/core/engagement';`
2. Wrap children: `<EngagementProvider>{children}</EngagementProvider>`
3. Ensure it's inside `NarrativeEngineProvider`

**Acceptance:**
- App loads without errors
- No "must be used within provider" errors in console

**Commit:** `feat(app): install EngagementProvider at root`

### Build Gate (Epic 1)
```bash
npm run dev          # App loads
npm test             # 152 tests pass
```

---

## Epic 2: Migrate JourneyInspector (Priority: High)

### Story 2.1: Replace useNarrativeEngine with engagement hooks

**Task:** Migrate JourneyInspector to use useJourneyState
**File:** `src/explore/JourneyInspector.tsx`
**Changes:**
1. Add imports for `useEngagement`, `useJourneyState`
2. Keep `useNarrativeEngine` for `getJourney` only
3. Replace `activeJourneyId` with `journey?.id`
4. Replace `startJourney(id)` with `startJourney(getJourney(id)!)`
5. Replace `exitJourney()` (same signature)

**Tests:**
- E2E: `tests/e2e/engagement-migration.spec.ts` (Story 2.2)
- Verify: Journey inspector shows active journey state

**Acceptance:** Component displays and starts/exits journeys correctly

**Commit:** `refactor(JourneyInspector): migrate to engagement hooks`

### Story 2.2: Add E2E migration test

**Task:** Create E2E test for engagement migration
**File:** Create `tests/e2e/engagement-migration.spec.ts`
**Content:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('journey inspector shows journey state', async ({ page }) => {
    await page.goto('/');
    // Navigate to journey inspector
    // Verify journey state displays
    await expect(page.getByText(/journey/i)).toBeVisible();
  });
});
```

**Test Checklist:**
- [x] Test user-visible behavior
- [x] Use semantic queries (`getByText`, `getByRole`)
- [x] No implementation assertions

**Commit:** `test: add engagement migration E2E tests`

### Build Gate (Epic 2)
```bash
npm test                                           # 152 pass
npx playwright test tests/e2e/engagement-migration.spec.ts
npm run health
```

---

## Epic 3: Migrate JourneyList (Priority: High)

### Story 3.1: Replace useNarrativeEngine with engagement hooks

**Task:** Migrate JourneyList to use useJourneyState
**File:** `src/explore/JourneyList.tsx`
**Changes:**
1. Add imports for `useEngagement`, `useJourneyState`
2. Keep `useNarrativeEngine` for `schema`, `loading`, `getJourney`
3. Replace `activeJourneyId` with `journey?.id`
4. Update `handleStart` to use `startJourney(getJourney(id)!)`

**Acceptance:** Journey list displays, filters, and starts journeys correctly

**Commit:** `refactor(JourneyList): migrate to engagement hooks`

### Build Gate (Epic 3)
```bash
npm test
npx playwright test
npm run health
```

---

## Epic 4: Migrate LensPicker (Priority: Medium)

### Story 4.1: Replace useNarrativeEngine with engagement hooks

**Task:** Migrate LensPicker to use useLensState
**File:** `src/explore/LensPicker.tsx`
**Changes:**
1. Add imports for `useEngagement`, `useLensState`
2. Keep `useNarrativeEngine` for `getEnabledPersonas`
3. Replace `session.activeLens` with `lens`
4. Replace `selectLens(id)` (same signature)

**Acceptance:** Lens picker displays and selects lenses correctly

**Commit:** `refactor(LensPicker): migrate to engagement hooks`

### Build Gate (Epic 4)
```bash
npm test
npx playwright test
npm run health
```

---

## Epic 5: Migrate Terminal (Priority: High, Complexity: High)

### Story 5.1: Migrate lens state

**Task:** Replace lens-related useNarrativeEngine calls
**File:** `components/Terminal.tsx`
**Changes:**
1. Add `useLensState` hook
2. Replace `session.activeLens` references
3. Update `selectLens` calls

**Commit:** `refactor(Terminal): migrate lens state to useLensState`

### Story 5.2: Migrate journey state

**Task:** Replace journey-related useNarrativeEngine calls
**File:** `components/Terminal.tsx`
**Changes:**
1. Add `useJourneyState` hook
2. Replace `activeJourneyId` with `journey?.id`
3. Update `startJourney`, `advanceNode` → `advanceStep`, `exitJourney`

**Commit:** `refactor(Terminal): migrate journey state to useJourneyState`

### Story 5.3: Migrate entropy state

**Task:** Replace entropy-related useNarrativeEngine calls
**File:** `components/Terminal.tsx`
**Changes:**
1. Add `useEntropyState` hook
2. Replace `entropyState.currentEntropy` with `entropy`
3. Update entropy threshold checks

**Note:** Some entropy functions (evaluateEntropy, recordEntropyInjection) may need to remain with NarrativeEngine if they depend on schema/session.

**Commit:** `refactor(Terminal): migrate entropy state to useEntropyState`

### Story 5.4: Verify Terminal integration

**Task:** Comprehensive testing of migrated Terminal
**Tests:**
- [ ] Lens selection works
- [ ] Journey start/advance/exit works
- [ ] Entropy detection works
- [ ] All existing E2E tests pass

**Commit:** `test: verify Terminal engagement migration`

### Build Gate (Epic 5)
```bash
npm run build        # Compiles
npm test             # 152 pass
npx playwright test  # All E2E pass
npm run health       # Health passes
```

---

## Commit Sequence

```
1. feat(app): install EngagementProvider at root
2. refactor(JourneyInspector): migrate to engagement hooks
3. test: add engagement migration E2E tests
4. refactor(JourneyList): migrate to engagement hooks
5. refactor(LensPicker): migrate to engagement hooks
6. refactor(Terminal): migrate lens state to useLensState
7. refactor(Terminal): migrate journey state to useJourneyState
8. refactor(Terminal): migrate entropy state to useEntropyState
9. test: verify Terminal engagement migration
```

## Build Gates Summary

| After | Command | Expected |
|-------|---------|----------|
| Epic 1 | `npm run dev` | App loads |
| Epic 2 | `npx playwright test engagement-migration` | 2+ tests pass |
| Epic 3 | `npx playwright test` | All E2E pass |
| Epic 4 | `npx playwright test` | All E2E pass |
| Epic 5 | `npm run build && npm test && npx playwright test && npm run health` | All pass |

## Smoke Test Checklist

- [ ] App loads without errors
- [ ] Lens selection works in LensPicker
- [ ] Journey starts from JourneyList
- [ ] Journey displays in JourneyInspector
- [ ] Terminal lens/journey/entropy work
- [ ] All tests pass: `npm run test:all`
- [ ] Health check passes: `npm run health`
