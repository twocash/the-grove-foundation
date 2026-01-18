# User Stories: S13-BD-LayoutDensity-v1

## Story Format
```
Given-When-Then (Gherkin)
```

## Test Coverage
- Unit tests
- Integration tests
- E2E tests
- Visual tests

---

## E2E Test Specification

### Test Structure
```
tests/e2e/s13-bd-layout-density/
├── _test-data.ts           # Test presets and utilities
├── _test-utils.ts          # Console capture, error filtering
├── density-presets.spec.ts # US-001: Preset application tests
├── token-override.spec.ts  # US-002: Override behavior tests
├── migration.spec.ts       # US-003: Migration verification tests
└── context-inheritance.spec.ts # US-004: Context tests
```

### Visual Verification Points

| User Story | Screenshot | Verification |
|------------|------------|--------------|
| US-001 | `density-compact.png` | Compact preset applied correctly |
| US-001 | `density-comfortable.png` | Comfortable preset applied correctly |
| US-001 | `density-spacious.png` | Spacious preset applied correctly |
| US-002 | `token-override.png` | Individual token override working |
| US-003 | `migration-before.png` | CSS hack state (baseline) |
| US-003 | `migration-after.png` | Declarative prop state |
| US-004 | `default-density.png` | Default comfortable applied |

### Test Data Seeding

```typescript
// tests/e2e/s13-bd-layout-density/_test-data.ts
import { Page } from '@playwright/test';

export const TEST_PRESETS = {
  dashboardWithMetrics: {
    'grove-test-dashboard': JSON.stringify({
      metrics: [
        { label: 'Tokens', value: 125, trend: '+12%' },
        { label: 'Progress', value: 0.67, format: 'percent' },
        { label: 'Contributions', value: 42, trend: '+5' }
      ],
      sections: ['overview', 'details', 'history']
    })
  }
};

export async function seedDashboardData(
  page: Page,
  preset: keyof typeof TEST_PRESETS
): Promise<void> {
  const data = TEST_PRESETS[preset];
  await page.evaluate((entries) => {
    Object.entries(entries).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });
  }, data);
}

export async function clearTestData(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('grove-test'))
      .forEach(k => localStorage.removeItem(k));
  });
}
```

### Screenshots Are EVIDENCE

| Requirement | Implementation |
|-------------|----------------|
| Directory | `docs/sprints/s13-bd-layout-density-v1/screenshots/e2e/` |
| Naming | `{story-id}-{description}.png` |
| Minimum | 20+ screenshots for medium-effort sprint |
| Verification | Visual comparison of density differences |

---

## Acceptance Criteria

### US-001: Apply Density Presets

**As a** developer using json-render
**I want to** apply predefined density presets to the Renderer
**So that** I get consistent spacing without CSS hacks

**INVEST Assessment:**
- Independent: Yes
- Negotiable: Yes (preset values can be adjusted)
- Valuable: Yes (eliminates CSS hacks)
- Estimable: Yes (clear scope)
- Small: Yes (fits in sprint)
- Testable: Yes (visual verification)

---

#### Scenario: Apply compact density preset
```gherkin
Given a Renderer component with tree data
When I set layout={{ density: 'compact' }}
Then the container should have class 'p-3'
And sections should have class 'space-y-2'
And cards should have class 'gap-2'
And the visual spacing should be visibly tighter than comfortable
```

#### Scenario: Apply comfortable density preset
```gherkin
Given a Renderer component with tree data
When I set layout={{ density: 'comfortable' }}
Then the container should have class 'p-6'
And sections should have class 'space-y-4'
And cards should have class 'gap-4'
And the visual spacing should be balanced for dashboard viewing
```

#### Scenario: Apply spacious density preset
```gherkin
Given a Renderer component with tree data
When I set layout={{ density: 'spacious' }}
Then the container should have class 'p-8'
And sections should have class 'space-y-6'
And cards should have class 'gap-6'
And the visual spacing should be optimized for reading
```

---

### US-002: Override Individual Tokens

**As a** developer with specific layout needs
**I want to** override individual spacing tokens within a preset
**So that** I can fine-tune layouts without creating custom presets

**INVEST Assessment:**
- Independent: Yes
- Negotiable: Yes
- Valuable: Yes (flexibility)
- Estimable: Yes
- Small: Yes
- Testable: Yes

---

#### Scenario: Override sectionGap within preset
```gherkin
Given a Renderer with layout={{ density: 'comfortable' }}
When I add sectionGap: 'space-y-8' to the layout config
Then sectionGap should be 'space-y-8'
And containerPadding should remain 'p-6' from preset
And cardGap should remain 'gap-4' from preset
```

#### Scenario: Override multiple tokens
```gherkin
Given a Renderer with layout={{ density: 'compact' }}
When I add containerPadding: 'p-4' and cardGap: 'gap-3'
Then containerPadding should be 'p-4'
And cardGap should be 'gap-3'
And sectionGap should remain 'space-y-2' from preset
```

---

### US-003: Default Density Behavior

**As a** developer migrating from CSS hacks
**I want** the Renderer to apply a sensible default when no layout prop is provided
**So that** existing code works without changes

**INVEST Assessment:**
- Independent: Yes
- Negotiable: No (backwards compatibility required)
- Valuable: Yes (migration path)
- Estimable: Yes
- Small: Yes
- Testable: Yes

---

#### Scenario: Default density when no prop provided
```gherkin
Given a Renderer component with tree data
When no layout prop is provided
Then 'comfortable' density should be applied by default
And the container should have class 'p-6'
And sections should have class 'space-y-4'
```

#### Scenario: Explicit undefined layout prop
```gherkin
Given a Renderer component with tree data
When layout prop is explicitly undefined
Then 'comfortable' density should be applied by default
And no console warnings should appear
```

---

### US-004: TypeScript Type Safety

**As a** developer using TypeScript
**I want** full type safety for the layout prop
**So that** I catch configuration errors at compile time

**INVEST Assessment:**
- Independent: Yes
- Negotiable: No (type safety is required)
- Valuable: Yes (DX improvement)
- Estimable: Yes
- Small: Yes
- Testable: Yes (compile-time verification)

---

#### Scenario: Invalid density value caught at compile time
```gherkin
Given a TypeScript file using Renderer
When I set layout={{ density: 'invalid' }}
Then TypeScript should show a compile error
And the error should indicate valid options: 'compact' | 'comfortable' | 'spacious'
```

#### Scenario: Invalid override token caught at compile time
```gherkin
Given a TypeScript file using Renderer
When I set layout={{ density: 'comfortable', invalidToken: 'value' }}
Then TypeScript should show a compile error
And the error should indicate the unknown property
```

---

### US-005: CSS Hack Migration

**As a** developer with existing CSS hacks
**I want** a clear migration path to the new API
**So that** I can remove technical debt

**INVEST Assessment:**
- Independent: Yes
- Negotiable: Yes (migration can be gradual)
- Valuable: Yes (debt reduction)
- Estimable: Yes
- Small: Yes
- Testable: Yes

---

#### Scenario: Replace space-y-6 hack with comfortable preset
```gherkin
Given existing code with [&_.json-render-root]:space-y-6
When I replace with layout={{ density: 'comfortable' }}
Then the visual output should be identical
And the CSS hack class should be removed
And no console errors should appear
```

#### Scenario: Replace custom spacing with override
```gherkin
Given existing code with [&_.json-render-root]:space-y-8
When I replace with layout={{ density: 'comfortable', sectionGap: 'space-y-8' }}
Then the visual output should be identical
And the CSS hack class should be removed
```

---

## Epic Breakdown

### Epic A: Core API Implementation
**Stories:** US-001, US-002, US-004
**Goal:** Implement LayoutConfig interface and Renderer integration
**Effort:** 60% of sprint

### Epic B: Migration Support
**Stories:** US-003, US-005
**Goal:** Ensure backwards compatibility and migration path
**Effort:** 40% of sprint

---

## Test Strategy

### Unit Tests
- `LayoutConfig` type validation
- `DENSITY_PRESETS` values
- `useResolvedLayout` hook logic
- Token resolution with overrides

### Integration Tests
- Renderer with layout prop
- LayoutContext propagation
- Default behavior verification

### E2E Tests
- Visual density comparison (compact vs comfortable vs spacious)
- Migration verification (before/after screenshots)
- Console error monitoring

### Visual Tests
- Screenshot comparison for each density
- Override verification screenshots
- Regression testing against existing dashboards

---

## Summary

| Story ID | Title | Priority | Complexity | Epic |
|----------|-------|----------|------------|------|
| US-001 | Apply Density Presets | P0 | M | A |
| US-002 | Override Individual Tokens | P0 | S | A |
| US-003 | Default Density Behavior | P0 | S | B |
| US-004 | TypeScript Type Safety | P0 | S | A |
| US-005 | CSS Hack Migration | P1 | M | B |

**Total Stories:** 5
**P0 Stories:** 4 (core functionality)
**P1 Stories:** 1 (migration documentation)
**Estimated Effort:** 1 sprint (medium)

---

**Prepared By:** Product Manager
**Date:** 2026-01-18
**Gherkin Scenarios:** 11 total
**Next Stage:** Grove Execution Contract
