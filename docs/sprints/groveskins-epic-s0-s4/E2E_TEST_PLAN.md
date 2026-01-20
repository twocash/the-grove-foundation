# GroveSkins Epic (S0-S4) E2E Test Plan

**Sprint:** groveskins-epic-s0-s4
**Protocol:** Grove Execution Protocol v1.5 (Constraint 11: E2E Console Monitoring Gate)
**Status:** PENDING USER APPROVAL

---

## Test Plan Overview

This test plan covers end-to-end verification of the GroveSkins declarative theming system with:
- Visual verification via Playwright screenshots
- Console error monitoring using shared `_test-utils.ts` utilities
- Full lifecycle testing of theme switching and density changes

### Test File Location
```
tests/e2e/groveskins-epic.spec.ts
```

### Screenshot Directory
```
docs/sprints/groveskins-epic-s0-s4/screenshots/
```

---

## Test Structure

Following the pattern from `garden-tray.spec.ts` and `s15-federation-editors-screenshots.spec.ts`:

```typescript
import { test, expect, Page } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/groveskins-epic-s0-s4/screenshots';

test.describe('GroveSkins Epic E2E Verification', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  // Test cases follow...
});
```

---

## Test Cases

### TC-01: Default Theme Load (Quantum Glass)

**Purpose:** Verify the default dark theme loads correctly on /explore

**Steps:**
1. Navigate to `/explore`
2. Wait for network idle
3. Assert page loads without critical console errors
4. Verify CSS variables are injected (--grove-void should be dark)
5. Screenshot: `tc01-default-theme-load.png`

**Assertions:**
- `getCriticalErrors(capture.errors)` has length 0
- Page background uses dark theme colors
- DebugDensityToggle visible (if in dev mode)

---

### TC-02: Theme Switching - Quantum Glass to Zenith Paper

**Purpose:** Verify runtime theme switching from dark to light

**Steps:**
1. Navigate to `/explore`
2. Wait for network idle
3. Screenshot initial state: `tc02a-before-switch.png`
4. Trigger theme change to 'zenith-paper-v1' via:
   - Option A: Use ThemeSwitcher component if visible
   - Option B: Execute JS: `window.__setSkin && window.__setSkin('zenith-paper-v1')`
5. Wait for CSS transition (100ms)
6. Assert page background changes to light (#FBFBF9)
7. Screenshot after switch: `tc02b-after-switch-light.png`
8. Verify no critical console errors during switch

**Assertions:**
- Background color changes from dark to light
- Text color changes from light to dark
- Zero critical console errors
- localStorage contains 'grove-skin-id' = 'zenith-paper-v1'

---

### TC-03: Theme Switching - Zenith Paper to Quantum Glass

**Purpose:** Verify switching back to dark theme

**Steps:**
1. Navigate to `/explore`
2. Set theme to 'zenith-paper-v1' first
3. Screenshot: `tc03a-light-theme.png`
4. Switch theme to 'quantum-glass-v1'
5. Wait for CSS transition
6. Screenshot: `tc03b-dark-theme-restored.png`
7. Verify no critical console errors

**Assertions:**
- Background returns to dark (#030712)
- Text returns to light
- Zero critical console errors

---

### TC-04: Density Toggle - Compact

**Purpose:** Verify density changes to compact tier

**Steps:**
1. Navigate to `/explore`
2. Wait for network idle
3. Locate DebugDensityToggle component
4. Assert it's visible: `await expect(toggle).toBeVisible()`
5. Screenshot before: `tc04a-density-default.png`
6. Click 'Compact' option
7. Wait for layout update
8. Screenshot after: `tc04b-density-compact.png`
9. Verify no critical console errors

**Assertions:**
- DebugDensityToggle shows 'compact' as active
- GlassPanel padding reduces (if visible)
- Zero critical console errors

---

### TC-05: Density Toggle - Spacious

**Purpose:** Verify density changes to spacious tier

**Steps:**
1. Navigate to `/explore`
2. Locate DebugDensityToggle
3. Screenshot before: `tc05a-density-before.png`
4. Click 'Spacious' option
5. Screenshot after: `tc05b-density-spacious.png`
6. Verify no critical console errors

**Assertions:**
- DebugDensityToggle shows 'spacious' as active
- Layout has increased spacing
- Zero critical console errors

---

### TC-06: Theme Persistence (localStorage)

**Purpose:** Verify theme selection persists across page reload

**Steps:**
1. Navigate to `/explore`
2. Switch to 'zenith-paper-v1'
3. Screenshot: `tc06a-light-before-reload.png`
4. Reload page
5. Wait for network idle
6. Screenshot: `tc06b-light-after-reload.png`
7. Assert theme is still light
8. Verify no critical console errors

**Assertions:**
- localStorage['grove-skin-id'] === 'zenith-paper-v1'
- Theme persists after reload
- Zero critical console errors on reload

---

### TC-07: Bedrock Route Theme Integration

**Purpose:** Verify theme system works on /bedrock routes

**Steps:**
1. Navigate to `/bedrock` (or `/bedrock/nursery` if available)
2. Wait for network idle
3. Screenshot: `tc07a-bedrock-default.png`
4. Verify CSS variables are injected
5. If ThemeSwitcher available, switch theme
6. Screenshot: `tc07b-bedrock-switched.png`
7. Verify no critical console errors

**Assertions:**
- Bedrock route uses same theme system as /explore
- Theme changes propagate to Bedrock components
- Zero critical console errors

---

### TC-08: CSS Variable Injection Verification

**Purpose:** Verify all expected CSS variables are set

**Steps:**
1. Navigate to `/explore`
2. Wait for network idle
3. Execute JS to read computed styles:
   ```javascript
   const root = document.documentElement;
   const vars = {
     void: getComputedStyle(root).getPropertyValue('--grove-void'),
     foreground: getComputedStyle(root).getPropertyValue('--grove-foreground'),
     accent: getComputedStyle(root).getPropertyValue('--grove-accent'),
   };
   return vars;
   ```
4. Assert variables have expected values for quantum-glass
5. Screenshot: `tc08-css-variables.png`

**Assertions:**
- --grove-void is set
- --grove-foreground is set
- --grove-accent is set
- All values match quantum-glass-skin.json tokens

---

### TC-09: FoundationText Primitive Rendering

**Purpose:** Verify FoundationText renders correctly with density

**Steps:**
1. Navigate to a page using FoundationText (or create test fixture)
2. Screenshot default: `tc09a-foundation-text-default.png`
3. Change density to compact
4. Screenshot: `tc09b-foundation-text-compact.png`
5. Change density to spacious
6. Screenshot: `tc09c-foundation-text-spacious.png`

**Assertions:**
- Text renders without errors
- Font size scales with density
- Zero critical console errors

---

### TC-10: MetricCard Primitive Rendering

**Purpose:** Verify MetricCard renders correctly with density

**Steps:**
1. Navigate to a page using MetricCard (or create test fixture)
2. Screenshot default: `tc10a-metric-card-default.png`
3. Change density to compact
4. Screenshot: `tc10b-metric-card-compact.png`
5. Verify trend indicators display correctly
6. Verify color accents work

**Assertions:**
- MetricCard renders without errors
- Padding/sizing scales with density
- Colors match theme
- Zero critical console errors

---

### TC-11: ThemeSwitcher Component

**Purpose:** Verify ThemeSwitcher UI works correctly

**Steps:**
1. Navigate to page with ThemeSwitcher
2. Screenshot: `tc11a-theme-switcher-closed.png`
3. Interact with switcher (click to expand if needed)
4. Screenshot: `tc11b-theme-switcher-open.png`
5. Verify both themes are listed
6. Click to switch theme
7. Screenshot: `tc11c-theme-switcher-switched.png`

**Assertions:**
- ThemeSwitcher shows available themes
- Active theme is indicated
- Theme switch works via component
- Zero critical console errors

---

### TC-12: Console Error Baseline (Full Session)

**Purpose:** Verify complete user flow has zero critical errors

**Steps:**
1. Navigate to `/explore`
2. Wait for network idle
3. Switch theme twice (dark → light → dark)
4. Change density three times (default → compact → spacious → comfortable)
5. Navigate to `/bedrock` if available
6. Return to `/explore`
7. Final screenshot: `tc12-full-session-complete.png`
8. Assert zero critical console errors for entire session

**Assertions:**
- `getCriticalErrors(capture.errors)` has length 0
- No uncaught exceptions
- No TypeError, ReferenceError
- No "Cannot read properties" errors

---

## Critical Error Patterns (from _test-utils.ts)

The following patterns will fail tests if detected:

| Pattern | Indicates |
|---------|-----------|
| `Cannot read properties` | Null safety bug |
| `Unexpected Application Error` | React error boundary |
| `Invalid status transition` | State machine bug |
| `TypeError:` | JS type error |
| `ReferenceError:` | Undefined reference |
| `is not defined` | Missing dependency |
| `is not a function` | Invalid call |

**Excluded (benign):**
- `favicon` - Browser requests
- `net::ERR_` - Network errors
- `404` - Missing assets

---

## Screenshot Naming Convention

```
{tc-number}-{description}.png
{tc-number}{letter}-{step-description}.png
```

Examples:
- `tc01-default-theme-load.png`
- `tc02a-before-switch.png`
- `tc02b-after-switch-light.png`

---

## Execution Command

```bash
# Run all GroveSkins E2E tests
npx playwright test tests/e2e/groveskins-epic.spec.ts

# Run with headed browser for debugging
npx playwright test tests/e2e/groveskins-epic.spec.ts --headed

# Run specific test
npx playwright test tests/e2e/groveskins-epic.spec.ts -g "TC-02"
```

---

## Success Criteria

Per Grove Execution Protocol v1.5 Constraint 11:

- [ ] E2E test file exists at `tests/e2e/groveskins-epic.spec.ts`
- [ ] Console monitoring enabled using `setupConsoleCapture()`
- [ ] Zero critical errors during test execution
- [ ] Screenshot evidence at each interaction step
- [ ] Full lifecycle coverage (not just happy path)
- [ ] All 12 test cases pass
- [ ] Screenshots saved to `docs/sprints/groveskins-epic-s0-s4/screenshots/`

---

## Test Fixtures (If Needed)

If /explore doesn't display FoundationText or MetricCard directly, we may need:

1. **Option A:** Add test components to ExplorePage temporarily
2. **Option B:** Navigate to a Bedrock console that uses them
3. **Option C:** Create a `/test-fixtures` route (dev only)

**Recommendation:** Option B - use existing Bedrock consoles if they utilize the primitives.

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| DebugDensityToggle not visible in prod | Test in dev mode (`NODE_ENV=development`) |
| Theme switching mechanism not exposed | Add `window.__setSkin` debug hook if needed |
| Primitives not in use yet | Test via Bedrock consoles or add to ExplorePage |
| CSS transitions cause timing issues | Add explicit waits (100-200ms) after theme/density changes |

---

*This test plan requires user approval before execution.*

**Approval Status:** PENDING

---

## Appendix: Test File Template

```typescript
import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/groveskins-epic-s0-s4/screenshots';

test.describe('GroveSkins Epic E2E Verification', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    // Verify no critical errors after each test
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'Should have no critical console errors').toHaveLength(0);
  });

  test('TC-01: Default Theme Load', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Assert page loaded
    await expect(page).toHaveTitle(/Grove/);

    // Screenshot with assert-before pattern
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc01-default-theme-load.png` });
  });

  // ... additional test cases
});
```
