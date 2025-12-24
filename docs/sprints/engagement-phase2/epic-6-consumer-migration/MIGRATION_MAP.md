# Migration Map — Epic 6: Consumer Migration

## Overview

Epic 6 is discovery-oriented. The exact files to modify depend on audit results. This map provides the process rather than specific file changes.

## Phase 1: Audit (15 min)

### Step 1.1: Find NarrativeEngineContext Consumers

```bash
# Run from project root
grep -r "useNarrativeEngine" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".test."
```

### Step 1.2: Identify Engagement Usage

For each consumer found, check if it uses:
- `lens` / `setLens`
- `journey*` / `startJourney` / `advanceJourney` / etc.
- `entropy*` / `updateEntropy` / `resetEntropy`

### Step 1.3: Document Consumers

Create list:
```
| File | Uses Lens | Uses Journey | Uses Entropy | Priority |
|------|-----------|--------------|--------------|----------|
| ComponentA.tsx | ✓ | | | High |
| ComponentB.tsx | | ✓ | | High |
| ComponentC.tsx | ✓ | ✓ | ✓ | Critical |
```

---

## Phase 2: Provider Installation (10 min)

### Step 2.1: Locate App Root

Find where providers are installed:
```bash
# Check common locations
cat app/layout.tsx
cat app/providers.tsx
cat pages/_app.tsx
```

### Step 2.2: Install EngagementProvider

**If app/layout.tsx:**
```typescript
import { EngagementProvider } from '@/core/engagement';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Keep existing providers */}
        <NarrativeEngineProvider>
          <EngagementProvider>
            {children}
          </EngagementProvider>
        </NarrativeEngineProvider>
      </body>
    </html>
  );
}
```

**If centralized providers.tsx:**
```typescript
import { EngagementProvider } from '@/core/engagement';

export function Providers({ children }) {
  return (
    <NarrativeEngineProvider>
      <EngagementProvider>
        {children}
      </EngagementProvider>
    </NarrativeEngineProvider>
  );
}
```

### Step 2.3: Verify Installation

```bash
npm run dev
# Check console for errors
# Verify app loads
```

---

## Phase 3: Migrate First Consumer (30 min)

### Step 3.1: Choose Simplest Consumer

Pick component that uses ONLY one type:
- Only lens → use useLensState
- Only journey → use useJourneyState
- Only entropy → use useEntropyState

### Step 3.2: Migration Template

**Before:**
```typescript
import { useNarrativeEngine } from '@/hooks/NarrativeEngineContext';

function MyComponent() {
  const { lens, setLens } = useNarrativeEngine();
  // ... component logic
}
```

**After:**
```typescript
import { useEngagement, useLensState } from '@/core/engagement';

function MyComponent() {
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  // ... component logic (update setLens → selectLens)
}
```

### Step 3.3: Update API Calls

| Old | New |
|-----|-----|
| `setLens(value)` | `selectLens(value)` |
| `isJourneyActive` | `isActive` |
| `advanceJourney()` | `advanceStep()` |

### Step 3.4: Test Migrated Component

```bash
npm run dev
# Manually test the component
# Verify state changes work
```

---

## Phase 4: Migrate Additional Consumers (Variable)

Repeat Phase 3 for each consumer identified in audit.

**Priority order:**
1. Components using single state type
2. Components using multiple state types
3. Complex components

---

## Phase 5: E2E Test (15 min)

### Step 5.1: Create Migration Test File

```bash
touch tests/e2e/engagement-migration.spec.ts
```

### Step 5.2: Add Migration Tests

```typescript
// tests/e2e/engagement-migration.spec.ts

import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  // Add tests based on migrated components
});
```

### Step 5.3: Run All Tests

```bash
npm test
npx playwright test
```

---

## Build Gates

### After Phase 2 (Provider Installation)
```bash
npm run dev  # App loads without errors
npm test     # Unit tests pass
```

### After Phase 3 (First Migration)
```bash
npm run dev  # Migrated component works
npm test     # All tests pass
```

### After Phase 5 (Complete)
```bash
npm run build
npm test
npx playwright test
npm run health
```

---

## Verification Checklist

- [ ] NarrativeEngineContext consumers audited
- [ ] EngagementProvider installed at app root
- [ ] At least one component migrated
- [ ] Migrated component uses new hooks
- [ ] E2E test added for migration
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No console errors in dev mode

---

## Troubleshooting

### "useEngagement must be used within EngagementProvider"

Provider not installed or in wrong position:
```typescript
// Ensure EngagementProvider wraps the component
<EngagementProvider>
  <ComponentThatUsesEngagement />
</EngagementProvider>
```

### State not syncing

Don't mix old and new for same state:
```typescript
// BAD
const { lens } = useNarrativeEngine();
const { selectLens } = useLensState({ actor });

// GOOD
const { lens, selectLens } = useLensState({ actor });
```

### Types don't match

Check API mapping in ARCHITECTURE.md:
- `setLens` → `selectLens`
- `isJourneyActive` → `isActive`
- `advanceJourney` → `advanceStep`
