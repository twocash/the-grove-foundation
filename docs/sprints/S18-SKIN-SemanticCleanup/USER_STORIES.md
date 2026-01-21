# S18-SKIN-SemanticCleanup User Stories

**Sprint:** S18-SKIN-SemanticCleanup
**Epic:** GroveSkins v1.0
**Generated:** 2026-01-20
**Method:** User Story Refinery

---

## Story Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    S18-SKIN-SemanticCleanup                     │
│            Strangler Fig Cleanup for Semantic Colors            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ US-01   │          │ US-02   │          │ US-03   │
   │ Success │          │ Warning │          │ Error   │
   │ Colors  │          │ Colors  │          │ Colors  │
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ US-04   │          │ US-05   │          │ US-06   │
   │ Info    │          │ Neutral │          │ CSS     │
   │ Colors  │          │ Colors  │          │ Cleanup │
   └─────────┘          └─────────┘          └─────────┘
                              │
                        ┌────▼────┐
                        │ US-07   │
                        │ Theme   │
                        │ Verify  │
                        └─────────┘
```

---

## US-01: Success Color Migration

**As a** theme designer
**I want** success-state colors to use semantic CSS variables
**So that** themes can define their own success color palette without code changes

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ✅ | Can be done in isolation |
| Negotiable | ✅ | Specific classes can be batched |
| Valuable | ✅ | Enables theme customization |
| Estimable | ✅ | ~60 instances identified |
| Small | ✅ | Single color category |
| Testable | ✅ | Visual + grep verification |

### Acceptance Criteria

```gherkin
Feature: Success Color Semantic Variables
  As a theme designer
  I want success colors to use --semantic-success
  So themes control success state appearance

  Background:
    Given the Bedrock application is loaded
    And a GroveSkin theme is active

  Scenario: Success text colors use semantic variable
    Given a component displays success text (e.g., "Connected", "Saved")
    When I inspect the element styles
    Then the color should reference var(--semantic-success)
    And NOT hardcoded Tailwind classes like text-teal-400 or text-emerald-400

  Scenario: Success background colors use semantic variable
    Given a component displays a success badge or indicator
    When I inspect the element styles
    Then the background should reference var(--semantic-success) with opacity
    And NOT hardcoded classes like bg-teal-500/10 or bg-emerald-400/20

  Scenario: Success border colors use semantic variable
    Given a component has a success-state border
    When I inspect the element styles
    Then the border-color should reference var(--semantic-success)
    And NOT hardcoded classes like border-teal-500 or border-emerald-400

  Scenario: Theme switch updates success colors
    Given the quantum-glass theme is active
    When I switch to living-glass theme
    Then all success-colored elements should update to the new theme's success color
    And no page reload should be required
```

### E2E Test Specification

```typescript
// tests/e2e/s18-semantic-cleanup.spec.ts
test('TC-01: Success colors use semantic variables', async ({ page }) => {
  await page.goto('/bedrock');

  // Find success-colored elements
  const successElements = page.locator('[class*="semantic-success"], [style*="--semantic-success"]');

  // Verify no hardcoded teal/emerald classes remain
  const html = await page.content();
  expect(html).not.toMatch(/text-teal-\d00/);
  expect(html).not.toMatch(/text-emerald-\d00/);
  expect(html).not.toMatch(/bg-teal-\d00/);
  expect(html).not.toMatch(/bg-emerald-\d00/);
});
```

---

## US-02: Warning Color Migration

**As a** theme designer
**I want** warning-state colors to use semantic CSS variables
**So that** themes can define their own warning color palette without code changes

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ✅ | Can be done in isolation |
| Negotiable | ✅ | Specific classes can be batched |
| Valuable | ✅ | Enables theme customization |
| Estimable | ✅ | ~40 instances identified |
| Small | ✅ | Single color category |
| Testable | ✅ | Visual + grep verification |

### Acceptance Criteria

```gherkin
Feature: Warning Color Semantic Variables
  As a theme designer
  I want warning colors to use --semantic-warning
  So themes control warning state appearance

  Background:
    Given the Bedrock application is loaded
    And a GroveSkin theme is active

  Scenario: Warning text colors use semantic variable
    Given a component displays warning text (e.g., "Pending", "Caution")
    When I inspect the element styles
    Then the color should reference var(--semantic-warning)
    And NOT hardcoded Tailwind classes like text-amber-400 or text-yellow-400

  Scenario: Warning background colors use semantic variable
    Given a component displays a warning badge or indicator
    When I inspect the element styles
    Then the background should reference var(--semantic-warning) with opacity
    And NOT hardcoded classes like bg-amber-500/10 or bg-yellow-400/20

  Scenario: Warning icons use semantic variable
    Given a component displays a warning icon
    When I inspect the element styles
    Then the fill/stroke should reference var(--semantic-warning)
```

### E2E Test Specification

```typescript
test('TC-02: Warning colors use semantic variables', async ({ page }) => {
  await page.goto('/bedrock');

  const html = await page.content();
  expect(html).not.toMatch(/text-amber-\d00/);
  expect(html).not.toMatch(/text-yellow-\d00/);
  expect(html).not.toMatch(/bg-amber-\d00/);
  expect(html).not.toMatch(/bg-yellow-\d00/);
});
```

---

## US-03: Error Color Migration

**As a** theme designer
**I want** error-state colors to use semantic CSS variables
**So that** themes can define their own error color palette without code changes

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ✅ | Can be done in isolation |
| Negotiable | ✅ | Specific classes can be batched |
| Valuable | ✅ | Enables theme customization |
| Estimable | ✅ | ~30 instances identified |
| Small | ✅ | Single color category |
| Testable | ✅ | Visual + grep verification |

### Acceptance Criteria

```gherkin
Feature: Error Color Semantic Variables
  As a theme designer
  I want error colors to use --semantic-error
  So themes control error state appearance

  Background:
    Given the Bedrock application is loaded
    And a GroveSkin theme is active

  Scenario: Error text colors use semantic variable
    Given a component displays error text (e.g., "Failed", "Error")
    When I inspect the element styles
    Then the color should reference var(--semantic-error)
    And NOT hardcoded Tailwind classes like text-red-400 or text-rose-400

  Scenario: Error background colors use semantic variable
    Given a component displays an error badge or alert
    When I inspect the element styles
    Then the background should reference var(--semantic-error) with opacity
    And NOT hardcoded classes like bg-red-500/10 or bg-rose-400/20

  Scenario: Destructive buttons use semantic error variable
    Given a destructive action button is displayed
    When I inspect the element styles
    Then hover/active states should reference var(--semantic-error)
```

### E2E Test Specification

```typescript
test('TC-03: Error colors use semantic variables', async ({ page }) => {
  await page.goto('/bedrock');

  const html = await page.content();
  expect(html).not.toMatch(/text-red-\d00/);
  expect(html).not.toMatch(/text-rose-\d00/);
  expect(html).not.toMatch(/bg-red-\d00/);
  expect(html).not.toMatch(/bg-rose-\d00/);
});
```

---

## US-04: Info Color Migration

**As a** theme designer
**I want** info-state colors to use semantic CSS variables
**So that** themes can define their own info color palette without code changes

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ✅ | Can be done in isolation |
| Negotiable | ✅ | Specific classes can be batched |
| Valuable | ✅ | Enables theme customization |
| Estimable | ✅ | ~25 instances identified |
| Small | ✅ | Single color category |
| Testable | ✅ | Visual + grep verification |

### Acceptance Criteria

```gherkin
Feature: Info Color Semantic Variables
  As a theme designer
  I want info colors to use --semantic-info
  So themes control info state appearance

  Background:
    Given the Bedrock application is loaded
    And a GroveSkin theme is active

  Scenario: Info text colors use semantic variable
    Given a component displays info text (e.g., "Note", "Tip")
    When I inspect the element styles
    Then the color should reference var(--semantic-info)
    And NOT hardcoded Tailwind classes like text-blue-400 or text-cyan-400

  Scenario: Info background colors use semantic variable
    Given a component displays an info badge or tooltip
    When I inspect the element styles
    Then the background should reference var(--semantic-info) with opacity
    And NOT hardcoded classes like bg-blue-500/10 or bg-cyan-400/20

  Scenario: Links and interactive hints use semantic info
    Given interactive hint text is displayed
    When I inspect the element styles
    Then the color should reference var(--semantic-info)
```

### E2E Test Specification

```typescript
test('TC-04: Info colors use semantic variables', async ({ page }) => {
  await page.goto('/bedrock');

  const html = await page.content();
  expect(html).not.toMatch(/text-blue-\d00/);
  expect(html).not.toMatch(/text-cyan-\d00/);
  expect(html).not.toMatch(/bg-blue-\d00/);
  expect(html).not.toMatch(/bg-cyan-\d00/);
});
```

---

## US-05: Neutral Color Migration

**As a** theme designer
**I want** neutral colors (text, backgrounds, borders) to use glass CSS variables
**So that** themes can define their own neutral palette without code changes

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ✅ | Can be done after semantic colors |
| Negotiable | ✅ | Can batch by type (text/bg/border) |
| Valuable | ✅ | Largest impact on theme consistency |
| Estimable | ⚠️ | ~140 instances - largest batch |
| Small | ⚠️ | May need sub-phases |
| Testable | ✅ | Visual + grep verification |

### Acceptance Criteria

```gherkin
Feature: Neutral Color Glass Variables
  As a theme designer
  I want neutral colors to use --glass-* variables
  So themes control text, surface, and border appearance

  Background:
    Given the Bedrock application is loaded
    And a GroveSkin theme is active

  Scenario: Primary text uses glass text variable
    Given primary body text is displayed
    When I inspect the element styles
    Then the color should reference var(--glass-text-primary)
    And NOT hardcoded classes like text-gray-100 or text-slate-200

  Scenario: Muted text uses glass text secondary variable
    Given muted/secondary text is displayed
    When I inspect the element styles
    Then the color should reference var(--glass-text-secondary)
    And NOT hardcoded classes like text-gray-400 or text-slate-500

  Scenario: Surface backgrounds use glass surface variable
    Given a panel or card background is displayed
    When I inspect the element styles
    Then the background should reference var(--glass-surface) or var(--glass-surface-elevated)
    And NOT hardcoded classes like bg-gray-800/50 or bg-slate-900/30

  Scenario: Borders use glass border variable
    Given a component has a border
    When I inspect the element styles
    Then the border-color should reference var(--glass-border)
    And NOT hardcoded classes like border-gray-700 or border-slate-600

  Scenario: Theme switch updates all neutral colors
    Given the quantum-glass theme is active
    When I switch to zenith-paper theme (light mode)
    Then all neutral colors should update appropriately
    And text should be readable against new backgrounds
```

### E2E Test Specification

```typescript
test('TC-05: Neutral colors use glass variables', async ({ page }) => {
  await page.goto('/bedrock');

  const html = await page.content();
  // Check for hardcoded gray/slate classes
  expect(html).not.toMatch(/text-gray-[1-9]00/);
  expect(html).not.toMatch(/text-slate-[1-9]00/);
  expect(html).not.toMatch(/bg-gray-[1-9]00/);
  expect(html).not.toMatch(/bg-slate-[1-9]00/);
  expect(html).not.toMatch(/border-gray-[1-9]00/);
  expect(html).not.toMatch(/border-slate-[1-9]00/);
});
```

---

## US-06: CSS Workaround Removal

**As a** maintainer
**I want** the CSS remapping workaround removed from globals.css
**So that** the codebase has no hidden color interception logic

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ❌ | Depends on US-01 through US-05 |
| Negotiable | ✅ | Can be phased |
| Valuable | ✅ | Removes 180+ lines of tech debt |
| Estimable | ✅ | Single file, well-defined section |
| Small | ✅ | Delete operation |
| Testable | ✅ | File diff + visual verification |

### Acceptance Criteria

```gherkin
Feature: CSS Workaround Removal
  As a maintainer
  I want CSS color remapping rules removed
  So the codebase has no hidden interception logic

  Background:
    Given all semantic color migrations are complete (US-01 through US-05)

  Scenario: Tailwind color interception rules removed
    Given the globals.css file
    When I search for Tailwind color class overrides
    Then no rules like ".text-teal-400 { color: var(--semantic-success) }" should exist
    And no rules intercepting bg-*, border-*, or text-* color classes should exist

  Scenario: Base text color rule removed
    Given the globals.css file
    When I search for ".bedrock-app" rules
    Then no rule setting "color: var(--glass-text-primary)" should exist
    Because components now set their own text colors

  Scenario: CSS file size reduced
    Given the globals.css file before and after cleanup
    When I compare line counts
    Then the file should be approximately 180 lines shorter

  Scenario: Application still renders correctly
    Given the CSS workaround has been removed
    When I load /bedrock with quantum-glass theme
    Then all components should render with correct colors
    And no visual regressions should occur
```

### E2E Test Specification

```typescript
test('TC-06: No CSS color interception rules remain', async ({ page }) => {
  // Read globals.css and verify no interception rules
  const fs = require('fs');
  const css = fs.readFileSync('styles/globals.css', 'utf8');

  // Should not contain Tailwind color class overrides
  expect(css).not.toMatch(/\.text-teal-\d00\s*\{/);
  expect(css).not.toMatch(/\.text-amber-\d00\s*\{/);
  expect(css).not.toMatch(/\.bg-gray-\d00\s*\{/);
  expect(css).not.toMatch(/\.border-slate-\d00\s*\{/);
});
```

---

## US-07: Multi-Theme Verification

**As a** user
**I want** all four themes to render correctly after the migration
**So that** theme switching continues to work seamlessly

### INVEST Assessment

| Criteria | Score | Notes |
|----------|-------|-------|
| Independent | ❌ | Depends on US-01 through US-06 |
| Negotiable | ✅ | Can test incrementally |
| Valuable | ✅ | Prevents regressions |
| Estimable | ✅ | 4 themes × key screens |
| Small | ✅ | Verification only |
| Testable | ✅ | Visual + E2E |

### Acceptance Criteria

```gherkin
Feature: Multi-Theme Verification
  As a user
  I want all themes to render correctly
  So theme switching works seamlessly

  Scenario Outline: Theme renders correctly on /bedrock
    Given I navigate to /bedrock
    When I select the <theme> theme
    Then the page should render without errors
    And all semantic colors should match the theme definition
    And text should be readable against backgrounds

    Examples:
      | theme         |
      | quantum-glass |
      | zenith-paper  |
      | living-glass  |
      | nebula-flux   |

  Scenario: Theme switching is seamless
    Given I am on /bedrock with quantum-glass theme
    When I switch to living-glass theme
    Then the theme should change without page reload
    And all colors should update immediately
    And no FOUC (flash of unstyled content) should occur

  Scenario: Theme persists across page navigation
    Given I select living-glass theme on /bedrock
    When I navigate to /explore and back to /bedrock
    Then the living-glass theme should still be active
```

### E2E Test Specification

```typescript
const themes = ['quantum-glass', 'zenith-paper', 'living-glass', 'nebula-flux'];

for (const theme of themes) {
  test(`TC-07-${theme}: Theme renders correctly`, async ({ page }) => {
    await page.goto('/bedrock');

    // Set theme via localStorage
    await page.evaluate((t) => {
      localStorage.setItem('grove-active-skin', t);
    }, theme);
    await page.reload();

    // Verify no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForLoadState('networkidle');

    // Take screenshot for visual verification
    await page.screenshot({
      path: `docs/sprints/s18-skin-semanticcleanup/screenshots/${theme}.png`,
      fullPage: true
    });

    expect(errors.filter(e => e.includes('color') || e.includes('theme'))).toHaveLength(0);
  });
}
```

---

## Test Summary

| Test ID | Story | Description | Priority |
|---------|-------|-------------|----------|
| TC-01 | US-01 | Success colors use semantic variables | P0 |
| TC-02 | US-02 | Warning colors use semantic variables | P0 |
| TC-03 | US-03 | Error colors use semantic variables | P0 |
| TC-04 | US-04 | Info colors use semantic variables | P0 |
| TC-05 | US-05 | Neutral colors use glass variables | P0 |
| TC-06 | US-06 | No CSS color interception rules remain | P0 |
| TC-07-* | US-07 | Each theme renders correctly (×4) | P0 |

**Total Tests:** 10 (7 functional + 4 theme variants collapsed into TC-07)

---

## Definition of Done

- [ ] All hardcoded Tailwind color classes replaced in src/bedrock/
- [ ] CSS workaround removed from globals.css (~180 lines)
- [ ] All 10 E2E tests passing
- [ ] All 4 themes visually verified (screenshots in REVIEW.html)
- [ ] Build passes (`npm run build`)
- [ ] No console errors related to colors/themes
- [ ] REVIEW.html complete with evidence

---

*Generated by User Story Refinery | Sprint S18-SKIN-SemanticCleanup*
