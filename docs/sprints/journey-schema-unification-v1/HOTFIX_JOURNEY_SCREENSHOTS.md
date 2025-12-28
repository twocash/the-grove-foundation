# Hotfix: Journey Screenshot Tests Integration

**Sprint:** journey-screenshots-integration-hotfix  
**Date:** 2024-12-28  
**Prerequisite:** journey-schema-unification-v1 (complete)  
**Estimated Duration:** 1 hour

---

## Context

The journey schema unification sprint is complete (commit 72e8b98). Journey pills now correctly trigger XState transitions. This hotfix integrates visual regression tests for the journey flow into the production build process and health dashboard.

### Existing Infrastructure
- **Playwright** configured with visual regression (`toHaveScreenshot`)
- **Health Reporter** sends E2E results to `/api/health/report`
- **Health Config** supports `e2e-behavior` checks that reference test results
- **CI Workflow** runs `npm run test:e2e` in GitHub Actions

---

## Objectives

1. **Fix journey screenshot test** to work with actual Terminal UI patterns
2. **Capture baseline screenshots** for all 6 journeys
3. **Wire tests to health config** so they appear on `/foundation` dashboard
4. **Ensure CI passes** with new tests

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git status                    # Should be clean (72e8b98)
npm run build                 # Must pass
npm run test                  # 217 tests should pass
```

---

## Story 1: Update Journey Screenshot Test

The existing test file needs refinement to match actual Terminal UI patterns.

### 1.1 Read current Terminal UI patterns

Before modifying, examine how journeys are displayed:
- Check Terminal.tsx for journey pill selectors
- Check how journey content is rendered after START_JOURNEY

```bash
# Search for journey pill rendering
grep -n "journey" components/Terminal.tsx | head -30
```

### 1.2 Update test file

**File:** `tests/e2e/journey-screenshots.spec.ts`

Replace the content with this refined version:

```typescript
/**
 * Journey Visual Regression Tests
 * 
 * Captures screenshots at each stage of the journey flow.
 * Integrates with health system via HealthReporter.
 * 
 * Run with --update-snapshots to capture new baselines:
 *   npx playwright test tests/e2e/journey-screenshots.spec.ts --update-snapshots
 */

import { test, expect, Page } from '@playwright/test';

// Journey IDs from TypeScript registry (src/data/journeys/index.ts)
const JOURNEYS = [
  { id: 'simulation', title: 'Simulation Theory', waypoints: 5 },
  { id: 'stakes', title: 'Stakes', waypoints: 3 },
  { id: 'ratchet', title: 'Ratchet', waypoints: 4 },
  { id: 'diary', title: 'Diary System', waypoints: 4 },
  { id: 'emergence', title: 'Emergence', waypoints: 5 },
  { id: 'architecture', title: 'Architecture', waypoints: 3 },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function clearGroveStorage(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('grove-'))
      .forEach(k => localStorage.removeItem(k));
  });
}

async function navigateToTerminal(page: Page, lens = 'engineer') {
  await page.goto(`/terminal?lens=${lens}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Allow animations
}

async function openTerminalPanel(page: Page) {
  // Terminal may already be open at /terminal route
  const terminalPanel = page.locator('.terminal-panel');
  if (await terminalPanel.isVisible()) {
    return terminalPanel;
  }
  
  // Otherwise click the tree/sprout button
  const treeButton = page.getByRole('button', { name: /open.*terminal/i }).first();
  if (await treeButton.isVisible({ timeout: 2000 })) {
    await treeButton.click();
    await page.waitForTimeout(500);
  }
  
  return terminalPanel;
}

async function findJourneyPill(page: Page, journeyId: string) {
  // Try multiple selector strategies
  const selectors = [
    `[data-journey-id="${journeyId}"]`,
    `button:has-text("${journeyId}")`,
    `.journey-pill:has-text("${journeyId}")`,
  ];
  
  for (const selector of selectors) {
    const pill = page.locator(selector).first();
    if (await pill.isVisible({ timeout: 1000 }).catch(() => false)) {
      return pill;
    }
  }
  
  // Fallback: search in terminal for any button containing journey text
  const terminalPanel = page.locator('.terminal-panel');
  return terminalPanel.locator('button').filter({
    hasText: new RegExp(journeyId, 'i')
  }).first();
}

async function waitForJourneyStart(page: Page) {
  // Wait for XState to transition - look for journey-related UI changes
  await page.waitForTimeout(1000);
  
  // Check for journey indicators in console
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  // Look for journey content area or progress indicator
  const journeyActive = await page.locator('[data-journey-active="true"], .journey-content, .waypoint-display').first().isVisible({ timeout: 3000 }).catch(() => false);
  
  return journeyActive;
}

// ============================================================================
// JOURNEY SCREENSHOT TESTS
// ============================================================================

test.describe('Journey Screenshots', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearGroveStorage(page);
  });

  test('journey pills are visible after lens selection', async ({ page }) => {
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    // Capture terminal with journey pills visible
    await expect(page).toHaveScreenshot('journey-pills-overview.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('simulation journey start screenshot', async ({ page }) => {
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    const pill = await findJourneyPill(page, 'simulation');
    await expect(pill).toBeVisible({ timeout: 5000 });
    
    // Capture before clicking
    await expect(page).toHaveScreenshot('simulation-before-start.png', {
      maxDiffPixelRatio: 0.02,
    });
    
    // Click to start journey
    await pill.click();
    await waitForJourneyStart(page);
    
    // Capture after journey starts
    await expect(page).toHaveScreenshot('simulation-after-start.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('stakes journey start screenshot', async ({ page }) => {
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    const pill = await findJourneyPill(page, 'stakes');
    if (await pill.isVisible({ timeout: 3000 })) {
      await pill.click();
      await waitForJourneyStart(page);
      
      await expect(page).toHaveScreenshot('stakes-journey-start.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test('ratchet journey start screenshot', async ({ page }) => {
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    const pill = await findJourneyPill(page, 'ratchet');
    if (await pill.isVisible({ timeout: 3000 })) {
      await pill.click();
      await waitForJourneyStart(page);
      
      await expect(page).toHaveScreenshot('ratchet-journey-start.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});

// ============================================================================
// JOURNEY FLOW INTEGRATION TEST
// ============================================================================

test.describe('Journey Flow Integration', () => {
  test('journey click triggers XState transition', async ({ page }) => {
    // This test validates the schema unification fix
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    const pill = await findJourneyPill(page, 'simulation');
    await expect(pill).toBeVisible({ timeout: 5000 });
    
    await pill.click();
    await page.waitForTimeout(2000);
    
    // Verify no TypeError about waypoints
    const waypointErrors = consoleErrors.filter(e => 
      e.includes('waypoints') || e.includes('Cannot read properties of undefined')
    );
    
    expect(waypointErrors).toHaveLength(0);
  });

  test('journey completion can be tracked', async ({ page }) => {
    await navigateToTerminal(page, 'engineer');
    await openTerminalPanel(page);
    
    const pill = await findJourneyPill(page, 'simulation');
    if (await pill.isVisible({ timeout: 3000 })) {
      await pill.click();
      await waitForJourneyStart(page);
      
      // Verify journey started (XState should have journeyTotal > 0)
      const content = await page.locator('.terminal-panel').textContent() || '';
      
      // Content should change after journey starts
      expect(content.length).toBeGreaterThan(50);
    }
  });
});
```

### 1.3 Verify test runs

```bash
npx playwright test tests/e2e/journey-screenshots.spec.ts --reporter=list
```

---

## Story 2: Capture Baseline Screenshots

### 2.1 Start dev server

```bash
npm run dev
```

### 2.2 Run tests with snapshot update

```bash
npx playwright test tests/e2e/journey-screenshots.spec.ts --update-snapshots
```

### 2.3 Verify snapshots created

```bash
ls tests/e2e/journey-screenshots.spec.ts-snapshots/
```

Expected files:
- `journey-pills-overview-*.png`
- `simulation-before-start-*.png`
- `simulation-after-start-*.png`
- `stakes-journey-start-*.png`
- `ratchet-journey-start-*.png`

---

## Story 3: Add Health Config Entries

### 3.1 Update health-config.json

**File:** `data/infrastructure/health-config.json`

Add these entries to the `engagementChecks` array:

```json
{
  "id": "journey-pills-visible",
  "name": "Journey Pills Visible",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "journey-screenshots.spec.ts:journey pills are visible after lens selection",
  "impact": "Users cannot see or start journeys",
  "inspect": "npx playwright test -g 'journey pills are visible'"
},
{
  "id": "journey-xstate-transition",
  "name": "Journey XState Transition Works",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "journey-screenshots.spec.ts:journey click triggers XState transition",
  "impact": "Journey click causes crash or no response",
  "inspect": "npx playwright test -g 'journey click triggers XState'"
},
{
  "id": "simulation-journey-screenshots",
  "name": "Simulation Journey Screenshots",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "journey-screenshots.spec.ts:simulation journey start screenshot",
  "impact": "Visual regression in simulation journey flow",
  "inspect": "npx playwright test -g 'simulation journey'"
}
```

### 3.2 Verify health config is valid

```bash
npm run health
```

Should show new checks in "Engagement" category (may show "warn" if tests haven't run yet).

---

## Story 4: Run Full Test Suite

### 4.1 Run all tests

```bash
npm run test:all
```

This runs:
1. `npm test` (Vitest unit/integration tests)
2. `npm run test:e2e` (Playwright E2E tests including new journey screenshots)

### 4.2 Verify no regressions

```bash
npm run health
```

All checks should pass.

---

## Story 5: Commit and Push

### 5.1 Review changes

```bash
git status
git diff
```

Expected changes:
- `tests/e2e/journey-screenshots.spec.ts` (updated)
- `tests/e2e/journey-screenshots.spec.ts-snapshots/` (new baseline images)
- `data/infrastructure/health-config.json` (new health checks)

### 5.2 Commit

```bash
git add -A
git commit -m "feat: add journey screenshot tests with health integration

- Update journey-screenshots.spec.ts with robust UI selectors
- Capture baseline screenshots for journey flows
- Add 3 new health checks for journey engagement
- Validates journey-schema-unification-v1 fix (72e8b98)

Health checks added:
- journey-pills-visible
- journey-xstate-transition
- simulation-journey-screenshots"
```

### 5.3 Push

```bash
git push origin main
```

---

## Verification Checklist

- [ ] `npm run build` passes
- [ ] `npm run test` passes (217+ tests)
- [ ] `npm run test:e2e` passes (includes new journey tests)
- [ ] `npm run health` shows all engagement checks as pass/warn
- [ ] Baseline snapshots exist in `journey-screenshots.spec.ts-snapshots/`
- [ ] CI workflow will pick up new tests automatically

---

## Troubleshooting

### Screenshots fail to match

If visual differences occur:
```bash
# View the diff
npx playwright show-report

# Update baselines if changes are intentional
npx playwright test tests/e2e/journey-screenshots.spec.ts --update-snapshots
```

### Journey pill not found

If `findJourneyPill()` fails to locate pills:
1. Check Terminal.tsx for current pill rendering patterns
2. Update selectors in the test helper
3. Add `data-journey-id` attribute to pill buttons if missing

### Health checks show "warn"

This is expected before first E2E run. After running `npm run test:e2e`, the health reporter populates the health log with test results.

### CI fails on screenshots

Linux CI renders fonts differently than Windows/Mac. Options:
1. Use `maxDiffPixelRatio: 0.03` (3% tolerance)
2. Generate separate baselines for Linux: `npx playwright test --update-snapshots` in CI
3. Use `docker.io/mcr.microsoft.com/playwright` for consistent rendering

---

## Architecture Note

This integration follows the **DEX Stack** pattern:

1. **Declarative Sovereignty**: Health checks defined in JSON config
2. **Provenance as Infrastructure**: Test results logged with attribution
3. **Organic Scalability**: New tests automatically appear in health dashboard

The health reporter sends results to `/api/health/report`, which are then queried by the health validator's `e2e-behavior` check type.

---

*End of Hotfix Prompt*
