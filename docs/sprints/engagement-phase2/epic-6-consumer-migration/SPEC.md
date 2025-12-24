# Specification — Epic 6: Consumer Migration

## Overview

Wire the EngagementProvider into the application and migrate components from NarrativeEngineContext to use the new engagement hooks. This epic connects the isolated hook infrastructure to the actual UI.

## Goals

1. Install EngagementProvider at application root
2. Identify all NarrativeEngineContext consumers for lens/journey/entropy
3. Migrate consumers to use new hooks
4. Verify both systems coexist without conflict
5. Add E2E tests for migrated functionality

## Non-Goals

- Removing NarrativeEngineContext (Epic 7)
- Migrating non-engagement features (messages, loading, etc.)
- Refactoring component structure
- Adding new UI components
- Changing existing UX behavior

## Success Criteria

After this epic:
1. EngagementProvider wraps application
2. At least one consumer migrated to new hooks
3. E2E tests verify migrated functionality
4. No regressions in existing tests
5. Both context systems coexist

## Acceptance Criteria

### Functional Requirements

- [ ] AC-1: EngagementProvider installed at app root
- [ ] AC-2: Provider coexists with NarrativeEngineProvider
- [ ] AC-3: At least one component migrated to useEngagement
- [ ] AC-4: Migrated component uses useLensState/useJourneyState/useEntropyState
- [ ] AC-5: Existing functionality preserved

### Test Requirements (MANDATORY)

- [ ] AC-T1: E2E test for provider installation
- [ ] AC-T2: E2E test for migrated functionality
- [ ] AC-T3: All existing tests pass: `npm test`
- [ ] AC-T4: All E2E tests pass: `npx playwright test`

### DEX Compliance

- [ ] AC-D1: Full component migration (no mixing old/new)
- [ ] AC-D2: Document migration decisions
- [ ] AC-D3: Maintain backward compatibility

## Migration Approach

### Step 1: Audit

```bash
# Find NarrativeEngineContext consumers
grep -r "useNarrativeEngine" --include="*.tsx" --include="*.ts"
grep -r "lens\|journey\|entropy" --include="*.tsx" | grep -v "test\|spec"
```

### Step 2: Install Provider

```typescript
// app/layout.tsx or providers.tsx
import { EngagementProvider } from '@/core/engagement';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
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

### Step 3: Migrate Consumer

```typescript
// Before (NarrativeEngineContext)
function MyComponent() {
  const { lens, setLens, entropy } = useNarrativeEngine();
  return <div>{lens} - {entropy}</div>;
}

// After (Engagement hooks)
function MyComponent() {
  const { actor } = useEngagement();
  const { lens, selectLens } = useLensState({ actor });
  const { entropy } = useEntropyState({ actor });
  return <div>{lens} - {entropy}</div>;
}
```

## File Structure

```
app/
├── layout.tsx              # Add EngagementProvider
└── providers.tsx           # Or here if centralized

components/
├── Terminal/
│   └── Terminal.tsx        # Migrate if uses lens/journey/entropy
├── LensSelector/
│   └── LensSelector.tsx    # Migrate lens usage
└── JourneyPanel/
    └── JourneyPanel.tsx    # Migrate journey usage

tests/e2e/
└── engagement-migration.spec.ts  # NEW: Migration verification
```

## E2E Test Addition

```typescript
// tests/e2e/engagement-migration.spec.ts

import { test, expect } from '@playwright/test';

test.describe('engagement migration', () => {
  test('provider is installed and functional', async ({ page }) => {
    await page.goto('/');
    // Verify app loads without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('lens selection works via new hooks', async ({ page }) => {
    await page.goto('/');
    // Select a lens and verify it persists
    // ... lens-specific assertions
  });
});
```

## Dependencies

No new dependencies—uses existing:
- `@/core/engagement` (from Epic 1-5)
- Existing component structure

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| State divergence | Medium | High | Migrate fully per component |
| Missing consumer | Low | Medium | Thorough grep search |
| Breaking changes | Medium | High | E2E tests before/after |
| Provider order | Low | Medium | EngagementProvider inside NarrativeEngine |

## Out of Scope

- Removing NarrativeEngineContext (Epic 7)
- Migrating message/loading features
- UI redesign
- New features
