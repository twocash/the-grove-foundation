# Sprint Stories — Epic 6: Consumer Migration

## Overview

**Total Estimated Time:** ~1.5-2 hours
**Files Created:** 1 (E2E test)
**Files Modified:** Variable (depends on audit)
**Tests Created:** ~3-5 E2E

---

## Task 1: Audit Consumers (15 min)

**Task:** Find all NarrativeEngineContext consumers using engagement state
**Output:** Consumer list with usage patterns

### Commands

```bash
# Find all imports
grep -r "useNarrativeEngine" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".test." | grep -v ".spec."

# Check for lens usage
grep -rn "lens" --include="*.tsx" . | grep -v node_modules | head -20

# Check for journey usage
grep -rn "journey" --include="*.tsx" . | grep -v node_modules | head -20

# Check for entropy usage
grep -rn "entropy" --include="*.tsx" . | grep -v node_modules | head -20
```

### Document Results

Create table:
```markdown
| File | Lens | Journey | Entropy | Priority |
|------|------|---------|---------|----------|
| path/to/ComponentA.tsx | ✓ | | | High |
| path/to/ComponentB.tsx | | ✓ | | High |
```

**No verification needed — proceed to Task 2**

---

## Task 2: Install Provider (15 min)

**Task:** Add EngagementProvider to application root
**File:** Likely `app/layout.tsx` or `app/providers.tsx`

### Find Root

```bash
# Check for provider location
ls app/layout.tsx app/providers.tsx 2>/dev/null
head -50 app/layout.tsx
```

### Add Provider

```typescript
import { EngagementProvider } from '@/core/engagement';

// Inside the JSX tree, wrap children:
<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

### Verification

```bash
npm run dev
# Open browser, check console for errors
# App should load normally
```

**Commit:** `feat(app): install EngagementProvider at root`

---

## Task 3: Migrate First Consumer (30 min)

**Task:** Migrate simplest consumer from Task 1 audit
**File:** Selected from audit (simplest single-state consumer)

### Migration Steps

1. **Add imports:**
```typescript
import { useEngagement, useLensState } from '@/core/engagement';
```

2. **Replace hook:**
```typescript
// Before
const { lens, setLens } = useNarrativeEngine();

// After
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
```

3. **Update API calls:**
```typescript
// Before
onClick={() => setLens('engineer')}

// After
onClick={() => selectLens('engineer')}
```

### Verification

```bash
npm run dev
# Test migrated component manually
npm test  # Unit tests pass
```

**Commit:** `refactor(ComponentName): migrate to engagement hooks`

---

## Task 4: Migrate Additional Consumers (Variable)

**Task:** Migrate remaining consumers from audit
**Time:** ~15 min per component

Repeat Task 3 pattern for each consumer.

### API Reference

| Old (NarrativeEngine) | New (Engagement) |
|----------------------|------------------|
| `lens` | `lens` |
| `setLens(v)` | `selectLens(v)` |
| `journey` | `journey` |
| `journeyProgress` | `journeyProgress` |
| `isJourneyActive` | `isActive` |
| `startJourney(j)` | `startJourney(j)` |
| `advanceJourney()` | `advanceStep()` |
| `completeJourney()` | `completeJourney()` |
| `exitJourney()` | `exitJourney()` |
| `entropy` | `entropy` |
| `entropyThreshold` | `entropyThreshold` |
| `updateEntropy(d)` | `updateEntropy(d)` |
| `resetEntropy()` | `resetEntropy()` |

**Commit per component:** `refactor(ComponentName): migrate to engagement hooks`

---

## Task 5: Create E2E Tests (15 min)

**Task:** Add E2E tests for migrated functionality
**File:** Create `tests/e2e/engagement-migration.spec.ts`

```typescript
// tests/e2e/engagement-migration.spec.ts

import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // No console errors
  });

  test('engagement state accessible', async ({ page }) => {
    await page.goto('/');
    // Verify migrated component renders
    // Add specific assertions based on migrated components
  });

  // Add tests for specific migrated functionality
  // based on what was migrated in Tasks 3-4
});
```

### Verification

```bash
npx playwright test tests/e2e/engagement-migration.spec.ts
```

**Commit:** `test(e2e): add engagement migration tests`

---

## Task 6: Final Verification (10 min)

**Task:** Run all tests and health checks

```bash
# Build
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Health checks
npm run health

# Dev smoke test
npm run dev
```

**Commit:** `chore: verify engagement migration complete`

---

## Build Gates

### After Task 2 (Provider)
```bash
npm run dev  # App loads
npm test     # Tests pass
```

### After Task 3 (First Migration)
```bash
npm test     # All tests pass
# Manual verification of migrated component
```

### After Task 5 (E2E Tests)
```bash
npx playwright test  # All E2E pass
```

### Final
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Summary

| Task | Time | Depends On |
|------|------|------------|
| Audit consumers | 15 min | - |
| Install provider | 15 min | Task 1 |
| Migrate first consumer | 30 min | Task 2 |
| Migrate additional | Variable | Task 3 |
| E2E tests | 15 min | Task 3-4 |
| Final verification | 10 min | Task 5 |
| **Total** | **~1.5-2 hours** | |

---

## Commit Sequence

```
1. feat(app): install EngagementProvider at root
2. refactor(ComponentA): migrate to engagement hooks
3. refactor(ComponentB): migrate to engagement hooks (if applicable)
4. test(e2e): add engagement migration tests
5. chore: verify engagement migration complete
```
