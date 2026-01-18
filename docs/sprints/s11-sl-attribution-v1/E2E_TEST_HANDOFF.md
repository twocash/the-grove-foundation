# E2E Test Handoff: S11-SL-Attribution v1.0

**Sprint**: S11-SL-Attribution (Knowledge Economy & Rewards)
**Created**: 2026-01-18
**Purpose**: Mandatory E2E testing and visual verification per Developer SOP v2.0

---

## MANDATORY QUALITY GATES

**Before marking this sprint complete, you MUST:**

1. ✅ Write ALL E2E tests specified below
2. ✅ Capture ALL screenshots at specified visual verification points
3. ✅ **OPEN AND VIEW** each screenshot - verify correct UI state
4. ✅ Debug console errors until **ZERO errors**
5. ✅ Complete REVIEW.html with verified evidence

**CRITICAL**: Screenshots must be VIEWED, not just checked for existence. A blank screenshot or error screenshot is a failure.

---

## Test Structure

Create the following test files:

```
tests/e2e/s11-sl-attribution/
├── attribution-tracking.spec.ts     # Epic A: US-A001, US-A002, US-A003
├── token-economy.spec.ts            # Epic B: US-B001, US-B002, US-B003
├── reputation-system.spec.ts        # Epic C: US-C001, US-C002, US-C003
└── economic-dashboard.spec.ts       # Epic D: US-D001, US-D002, US-D003
```

Screenshot directory:
```
docs/sprints/s11-sl-attribution-v1/screenshots/e2e/
├── attribution-chain-initial.png
├── attribution-chain-populated.png
├── attribution-chain-expanded.png
├── attribution-config-panel.png
├── token-balance-initial.png
├── token-balance-after-reward.png
├── quality-multiplier-display.png
├── network-bonus-breakdown.png
├── reputation-badge-novice.png
├── reputation-badge-expert.png
├── reputation-badge-legendary.png
├── reputation-leaderboard.png
├── dashboard-overview.png
├── dashboard-metrics-loaded.png
├── attribution-flow-chart.png
└── transaction-history.png
```

---

## Epic A: Attribution Tracking Tests

### File: `tests/e2e/s11-sl-attribution/attribution-tracking.spec.ts`

```typescript
// tests/e2e/s11-sl-attribution/attribution-tracking.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic A: Attribution Tracking', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    // Log console summary for debugging
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`Critical errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      criticalErrors.forEach(e => console.error(e));
    }
  });

  /**
   * US-A001: Track Tier Advancement Attribution
   * Tests: Single grove tier advancement, attribution event recording
   */
  test('US-A001: Single grove tier advancement creates attribution event', async ({ page }) => {
    // Navigate to bedrock experience console
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Initial state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-chain-initial.png`,
      fullPage: true
    });

    // TODO: Trigger a tier advancement and verify attribution event
    // Verify attribution event contains:
    // - source_grove_id
    // - target_grove_id
    // - tier_level
    // - base_tokens
    // - final_tokens

    // Verify zero console errors
    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-A001: Attribution event includes quality multiplier', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Create sprout with known quality score
    // Verify quality_multiplier field populated correctly
    // Verify multiplier matches expected range (0.5x - 2.0x)

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-A002: View Attribution Chain Visualization
   * Tests: Chain diagram display, expand/collapse functionality
   */
  test('US-A002: Attribution chain visualization displays correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to content with attribution
    // Click "View Attribution" button
    // Verify chain diagram renders

    // Screenshot: Chain with data
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-chain-populated.png`,
      fullPage: true
    });

    // Verify elements:
    // - Chain nodes visible
    // - Percentage labels shown
    // - Direction indicators present

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-A002: Attribution chain expands to show all levels', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Find chain with multiple levels
    // Click "Show All Levels"
    // Verify up to 3 levels displayed

    // Screenshot: Expanded chain
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-chain-expanded.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-A002: Attribution chain empty state', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to content with no attribution
    // Click "View Attribution"
    // Verify empty state message displays

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-A003: Configure Attribution Parameters
   * Tests: Decay rate, quality weighting, cross-grove bonus
   */
  test('US-A003: Attribution configuration panel accessible', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to attribution settings
    // Verify configuration panel loads

    // Screenshot: Config panel
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-config-panel.png`,
      fullPage: true
    });

    // Verify configurable fields:
    // - Decay rate input
    // - Quality weighting toggle
    // - Cross-grove bonus multiplier

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-A003: Decay rate affects attribution strength', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Set decay rate to 50%
    // Verify level-1 = 50%, level-2 = 25%, level-3 = 12.5%

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
```

---

## Epic B: Token Economy Tests

### File: `tests/e2e/s11-sl-attribution/token-economy.spec.ts`

```typescript
// tests/e2e/s11-sl-attribution/token-economy.spec.ts

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic B: Token Economy', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  /**
   * US-B001: Calculate Base Token Rewards
   * Tests: Tier-based rewards (sprout=10, sapling=50, tree=250)
   */
  test('US-B001: Sprout tier awards 10 base tokens', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Token balance before
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-initial.png`,
      fullPage: true
    });

    // TODO: Trigger sprout tier advancement
    // Verify base reward = 10 tokens

    // Screenshot: Token balance after
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-after-reward.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B001: Sapling tier awards 50 base tokens', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Trigger sapling tier advancement
    // Verify base reward = 50 tokens (5x sprout)

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B001: Tree tier awards 250 base tokens', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Trigger tree tier advancement
    // Verify base reward = 250 tokens (5x sapling)

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B002: Apply Quality Multipliers
   * Tests: Score ranges map to multipliers (0.5x - 2.0x)
   */
  test('US-B002: High quality (90+) applies 2.0x multiplier', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Create content with quality score 95
    // Trigger tier advancement
    // Verify multiplier = 2.0x applied

    // Screenshot: Quality multiplier display
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/quality-multiplier-display.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B002: Low quality (40) applies 0.8x penalty', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Create content with quality score 40
    // Verify multiplier = 0.8x
    // Verify "low quality penalty" warning shown

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B003: Distribute Network Effect Bonuses
   * Tests: Cross-grove influence bonuses (1.0x - 2.0x)
   */
  test('US-B003: Single grove influence has no bonus', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Create content influencing only own grove
    // Verify network bonus = 1.0x

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B003: Two grove influence applies 1.2x bonus', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Create content influencing 2 groves
    // Verify network bonus = 1.2x

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B003: Network bonus breakdown visible', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to reward breakdown
    // Verify breakdown shows:
    // - Base tokens
    // - Quality multiplier
    // - Network bonus
    // - Final amount

    // Screenshot: Bonus breakdown
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/network-bonus-breakdown.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
```

---

## Epic C: Reputation System Tests

### File: `tests/e2e/s11-sl-attribution/reputation-system.spec.ts`

```typescript
// tests/e2e/s11-sl-attribution/reputation-system.spec.ts

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic C: Reputation System', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  /**
   * US-C001: Track Reputation Scores
   * Tests: Initial score, component breakdown, tier calculation
   */
  test('US-C001: New grove starts with 50.0 reputation', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: View new grove reputation
    // Verify initial score = 50.0
    // Verify all components = 0.0
    // Verify label = "Developing"

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C001: Reputation components display correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: View grove with reputation data
    // Verify breakdown shows:
    // - Tier reputation (40%)
    // - Quality reputation (40%)
    // - Network reputation (20%)

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-C002: View Reputation Leaderboard
   * Tests: Top 10 display, badge colors, filtering
   */
  test('US-C002: Leaderboard shows top 10 groves', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to leaderboard
    // Verify top 10 displayed
    // Verify each shows name, score, level

    // Screenshot: Leaderboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-leaderboard.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C002: Reputation badges display correct colors', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Verify badge colors:
    // - Legendary (90+) = purple
    // - Expert (70-89) = blue
    // - Competent (50-69) = green
    // - Developing (30-49) = amber
    // - Novice (0-29) = gray

    // Screenshots: Badge variants
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-novice.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-C003: Configure Reputation Parameters
   * Tests: Weight adjustment, decay rate, level thresholds
   */
  test('US-C003: Reputation weight adjustment', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // TODO: Navigate to reputation config
    // Change tier weight to 50%
    // Verify formula updates

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
```

---

## Epic D: Economic Dashboard Tests

### File: `tests/e2e/s11-sl-attribution/economic-dashboard.spec.ts`

```typescript
// tests/e2e/s11-sl-attribution/economic-dashboard.spec.ts

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic D: Economic Dashboard', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  /**
   * US-D001: View Economic Overview
   * Tests: Key metrics display, trend indicators
   */
  test('US-D001: Dashboard shows key metrics', async ({ page }) => {
    await page.goto('/foundation/economic');
    await page.waitForTimeout(5000);

    // Screenshot: Dashboard overview
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-overview.png`,
      fullPage: true
    });

    // Verify metrics:
    // - Token balance
    // - Reputation score
    // - Network rank
    // - Trend indicators

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-D001: Metrics load within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/foundation/economic');

    // Wait for metrics to be visible
    await page.waitForSelector('[data-testid="total-tokens"]', { timeout: 2000 });

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Screenshot: Metrics loaded
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-metrics-loaded.png`,
      fullPage: true
    });

    expect(loadTime).toBeLessThan(2000);
    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D002: Analyze Attribution Flows
   * Tests: Inflow/outflow analysis, pie charts
   */
  test('US-D002: Attribution flow chart displays', async ({ page }) => {
    await page.goto('/foundation/economic');
    await page.waitForTimeout(3000);

    // TODO: Navigate to attribution analysis
    // Verify inflow breakdown visible
    // Verify outflow tracking visible

    // Screenshot: Flow chart
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-flow-chart.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D003: View Transaction History
   * Tests: Recent transactions, filtering, pagination
   */
  test('US-D003: Transaction history displays recent events', async ({ page }) => {
    await page.goto('/foundation/economic');
    await page.waitForTimeout(3000);

    // TODO: Navigate to transaction history
    // Verify last 5 events visible
    // Verify each shows tokens, source, timestamp

    // Screenshot: Transaction history
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/transaction-history.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
```

---

## Visual Verification Checklist

**YOU MUST COMPLETE THIS CHECKLIST BEFORE MARKING SPRINT COMPLETE**

### Screenshot Verification (OPEN AND VIEW EACH)

| # | Screenshot | Expected Content | ✓ Verified |
|---|------------|------------------|------------|
| 1 | `attribution-chain-initial.png` | Page loads, no errors visible | [ ] |
| 2 | `attribution-chain-populated.png` | Chain diagram with nodes, percentages | [ ] |
| 3 | `attribution-chain-expanded.png` | All 3 levels visible, distinct styling | [ ] |
| 4 | `attribution-config-panel.png` | Config form with decay rate, weights | [ ] |
| 5 | `token-balance-initial.png` | Token display before reward | [ ] |
| 6 | `token-balance-after-reward.png` | Token display updated with new amount | [ ] |
| 7 | `quality-multiplier-display.png` | Multiplier value shown (e.g., "2.0x") | [ ] |
| 8 | `network-bonus-breakdown.png` | Breakdown: base, quality, network, total | [ ] |
| 9 | `reputation-badge-novice.png` | Gray badge, correct icon | [ ] |
| 10 | `reputation-badge-expert.png` | Blue badge, correct icon | [ ] |
| 11 | `reputation-badge-legendary.png` | Purple badge, correct icon | [ ] |
| 12 | `reputation-leaderboard.png` | Top 10 list, sorted by score | [ ] |
| 13 | `dashboard-overview.png` | 4 metric cards, all populated | [ ] |
| 14 | `dashboard-metrics-loaded.png` | Same as above, confirms load | [ ] |
| 15 | `attribution-flow-chart.png` | Pie chart or flow visualization | [ ] |
| 16 | `transaction-history.png` | 5 recent transactions with details | [ ] |

**How to verify:**
1. Run: `npx playwright test tests/e2e/s11-sl-attribution/`
2. Open: `docs/sprints/s11-sl-attribution-v1/screenshots/e2e/`
3. **OPEN EACH IMAGE** in an image viewer
4. Check against "Expected Content" column
5. Mark verified only if content is CORRECT (not blank, not error)

---

## Console Error Debugging

**ZERO TOLERANCE** - No console errors allowed.

### Debug Protocol

1. Open browser to `http://localhost:3000`
2. Open DevTools (F12) → Console tab
3. Navigate through ALL attribution features
4. Note any red errors
5. **FIX THE CODE** for each error
6. Refresh and retest
7. Repeat until ZERO errors

### Common Errors to Watch For

| Error Pattern | Likely Cause | Fix |
|---------------|--------------|-----|
| "Cannot read properties of undefined" | Missing null check | Add optional chaining |
| "Failed to fetch" | API not running | Start backend |
| "Invalid tier level" | Bad tier value | Validate tier 1-3 |
| "Network request failed" | CORS or 500 error | Check server logs |
| "TypeError: X is not a function" | Wrong import | Check module exports |

---

## Pre-Completion Checklist

**DO NOT MARK SPRINT COMPLETE UNTIL ALL BOXES CHECKED:**

### 1. E2E Tests
- [ ] All 4 test files created
- [ ] All tests pass: `npx playwright test tests/e2e/s11-sl-attribution/`
- [ ] Test coverage includes: happy path, empty state, error state

### 2. Visual Verification
- [ ] All 16 screenshots captured
- [ ] **OPENED AND VIEWED** each screenshot manually
- [ ] Each screenshot shows CORRECT UI state
- [ ] No blank, error, or stale screenshots

### 3. Console Audit
- [ ] Navigated through ALL attribution features
- [ ] ZERO console errors (warnings OK)
- [ ] ZERO network failures
- [ ] ZERO React/rendering errors

### 4. REVIEW.html
- [ ] All 48 acceptance criteria have evidence
- [ ] Screenshots embedded and visible
- [ ] Test results documented
- [ ] Console audit results documented

---

## Running the Tests

```bash
# Run all S11 E2E tests
npx playwright test tests/e2e/s11-sl-attribution/

# Run specific epic
npx playwright test tests/e2e/s11-sl-attribution/attribution-tracking.spec.ts

# Update screenshots (if baselines needed)
npx playwright test tests/e2e/s11-sl-attribution/ --update-snapshots

# Run with headed browser for debugging
npx playwright test tests/e2e/s11-sl-attribution/ --headed

# View report
npx playwright show-report
```

---

## Completion Protocol

When all gates pass:

1. Write COMPLETE status entry to `.agent/status/current/`
2. Include in entry:
   - E2E Tests: PASS ({count} tests)
   - Visual Verification: PASSED - screenshots validated
   - Console Audit: CLEAN - zero errors
3. Commit with message: `test(S11): E2E tests with visual verification`

---

**Document Version**: 1.0
**Created**: 2026-01-18
**Protocol**: Developer SOP v2.0 (E2E Testing & Visual Verification)
