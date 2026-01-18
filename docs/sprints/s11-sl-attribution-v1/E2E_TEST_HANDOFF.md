# E2E Test Handoff: S11-SL-Attribution v1.0

**Sprint**: S11-SL-Attribution (Knowledge Economy & Rewards)
**Created**: 2026-01-18
**Updated**: 2026-01-18
**Purpose**: Mandatory E2E testing and visual verification per Developer SOP v2.0

---

## ⚠️ CRITICAL: WHAT VISUAL VERIFICATION ACTUALLY MEANS

**Screenshots are EVIDENCE that acceptance criteria passed.**

### ❌ WRONG (Going Through Motions)
- Navigate to `/bedrock/experience`
- Take screenshot of whatever loads
- Screenshot shows generic page, no attribution data visible
- Move on to next test

### ✅ RIGHT (Meaningful Visual Verification)
- Navigate to attribution feature
- **Perform the user action** (create attribution, trigger tier advancement, etc.)
- **Wait for state change** (data appears, UI updates)
- Screenshot captures **THE SPECIFIC STATE** proving the feature works
- Example: Attribution chain showing `Grove-A → Grove-B → Grove-C` with token percentages

---

## SCREENSHOTS MUST SHOW:

| What to Capture | Example |
|-----------------|---------|
| **Feature UI loaded with data** | Attribution chain with 3 nodes, not empty page |
| **User interaction result** | After clicking "View Attribution", the chain diagram appears |
| **State changes** | Token balance BEFORE (100) and AFTER (150) reward |
| **Calculated values** | Quality multiplier showing "2.0x" next to score "95" |
| **Visual indicators** | Reputation badge showing purple "Legendary" tier |
| **Error states** | Empty state message when no attribution exists |

**If your screenshot could be taken on ANY page, it's NOT valid evidence.**

---

## MANDATORY QUALITY GATES

**Before marking this sprint complete, you MUST:**

1. ✅ Write ALL E2E tests specified below
2. ✅ Capture screenshots showing **ACTUAL FEATURE STATES** (not generic pages)
3. ✅ **OPEN AND VIEW** each screenshot - verify it proves the acceptance criteria
4. ✅ Debug console errors until **ZERO errors**
5. ✅ Complete REVIEW.html with verified evidence

**CRITICAL**: A screenshot of `/bedrock/experience` with no attribution data visible is NOT evidence. You must show the FEATURE WORKING.

---

## 🔧 Test Data Seeding (MANDATORY)

**CRITICAL:** Seed localStorage with realistic, non-zero values BEFORE navigating to features.

Tests should NOT rely on empty/default state. Before each test suite:

### Standard Test Data Setup Pattern

```typescript
test.beforeEach(async ({ page }) => {
  // Seed localStorage BEFORE navigating
  await page.addInitScript(() => {
    // Token balance - specific non-zero value (NOT 0, NOT 100)
    localStorage.setItem('grove-token-balance', JSON.stringify({
      balance: 125,
      pending: 15,
      lastUpdated: new Date().toISOString()
    }));

    // User tier - mid-progression, NOT default
    localStorage.setItem('grove-user-tier', JSON.stringify({
      current: 'developing',
      progress: 0.67,
      nextTier: 'flourishing'
    }));

    // Badges - include 2-3 earned badges (NOT empty array)
    localStorage.setItem('grove-badges', JSON.stringify([
      { id: 'early-adopter', earnedAt: '2026-01-10' },
      { id: 'first-contribution', earnedAt: '2026-01-12' },
      { id: 'streak-7', earnedAt: '2026-01-15' }
    ]));

    // Attribution data - include some attribution events
    localStorage.setItem('grove-attribution-events', JSON.stringify([
      {
        id: 'attr-001',
        sourceGrove: 'grove-alpha',
        targetGrove: 'grove-beta',
        tokens: 50,
        tier: 'sapling',
        qualityMultiplier: 1.8,
        networkBonus: 1.2,
        timestamp: '2026-01-15T10:30:00Z'
      },
      {
        id: 'attr-002',
        sourceGrove: 'grove-beta',
        targetGrove: 'grove-gamma',
        tokens: 25,
        tier: 'sprout',
        qualityMultiplier: 1.5,
        networkBonus: 1.0,
        timestamp: '2026-01-16T14:20:00Z'
      }
    ]));

    // Reputation data
    localStorage.setItem('grove-reputation', JSON.stringify({
      score: 72,
      level: 'expert',
      breakdown: {
        tier: 28.8,     // 40% weight
        quality: 28.8,  // 40% weight
        network: 14.4   // 20% weight
      }
    }));

    // Engagement metrics
    localStorage.setItem('grove-engagement-state', JSON.stringify({
      exchanges: 42,
      reveals: 8,
      domainsExplored: ['sovereignty', 'provenance', 'scalability'],
      streakDays: 7
    }));
  });
});
```

### Data Values Checklist

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `balance: 0` | `balance: 125` | Zero looks uninitialized |
| `balance: 100` | `balance: 1,847` | Round numbers look fake |
| `tier: "seedling"` | `tier: "developing"` | Default tier proves nothing |
| `badges: []` | `badges: [{...}, {...}]` | Empty = no verification |
| `progress: 0` | `progress: 0.67` | Shows mid-journey |
| `attribution: []` | `attribution: [{...}, {...}]` | Need data to show chains |

### S11-Specific Test Data

For this sprint, ensure these values are seeded:

| Data | Key | Example Value |
|------|-----|---------------|
| Token Balance | `grove-token-balance` | `{ balance: 125, pending: 15 }` |
| Attribution Events | `grove-attribution-events` | `[{ sourceGrove, targetGrove, tokens: 50, qualityMultiplier: 1.8 }]` |
| Reputation | `grove-reputation` | `{ score: 72, level: 'expert', breakdown: {...} }` |
| Network Rank | `grove-network-rank` | `{ rank: 7, total: 142, percentile: 95 }` |
| Transaction History | `grove-transactions` | `[{ type: 'reward', tokens: 50, source: 'tier-up' }]` |

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
//
// ⚠️ CRITICAL: Tests must capture MEANINGFUL screenshots showing:
//   - Feature UI with actual data (not empty pages)
//   - State changes (before/after user actions)
//   - Calculated values proving formulas work
//   - User interaction results
//
// A screenshot of a generic page is NOT evidence. Navigate to the ATTRIBUTION
// features, create/view attribution data, then capture the SPECIFIC state.

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic A: Attribution Tracking', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);

    // 🔧 MANDATORY: Seed localStorage with realistic test data
    await page.addInitScript(() => {
      // Token balance - specific non-zero value
      localStorage.setItem('grove-token-balance', JSON.stringify({
        balance: 125, pending: 15
      }));

      // Attribution events - need populated data for chain visualization
      localStorage.setItem('grove-attribution-events', JSON.stringify([
        {
          id: 'attr-001',
          sourceGrove: 'Grove Alpha',
          targetGrove: 'Grove Beta',
          tokens: 50,
          tier: 'sapling',
          qualityMultiplier: 1.8,
          networkBonus: 1.2,
          percentages: { level1: 60, level2: 40 },
          timestamp: '2026-01-15T10:30:00Z'
        },
        {
          id: 'attr-002',
          sourceGrove: 'Grove Beta',
          targetGrove: 'Grove Gamma',
          tokens: 25,
          tier: 'sprout',
          qualityMultiplier: 1.5,
          networkBonus: 1.0,
          percentages: { level1: 100 },
          timestamp: '2026-01-16T14:20:00Z'
        }
      ]));

      // Attribution config - show non-default values
      localStorage.setItem('grove-attribution-config', JSON.stringify({
        decayRate: 0.5,
        qualityWeightEnabled: true,
        crossGroveBonus: 1.2
      }));
    });
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
   *
   * ⚠️ SCREENSHOT MUST SHOW: Attribution event with source_grove_id,
   *    target_grove_id, tier_level, base_tokens, and final_tokens visible
   */
  test('US-A001: Single grove tier advancement creates attribution event', async ({ page }) => {
    // 1. NAVIGATE to the attribution feature (NOT just /bedrock/experience)
    //    Go to wherever attribution events are displayed/created
    await page.goto('/bedrock/attribution'); // or correct route
    await page.waitForTimeout(3000);

    // 2. SET UP: Create or ensure test data exists
    //    - Either seed attribution data via API, or
    //    - Trigger a tier advancement through the UI
    //    DO NOT skip this step - empty pages are not evidence

    // Example: Trigger tier advancement
    // await page.click('[data-testid="trigger-advancement"]');
    // await page.waitForSelector('[data-testid="attribution-event"]');

    // 3. VERIFY: Data is visible before screenshot
    //    Screenshot should show attribution event with actual values
    const attributionVisible = await page.locator('[data-testid="attribution-event"]').isVisible();
    console.log(`Attribution event visible: ${attributionVisible}`);

    // 4. SCREENSHOT: Capture the POPULATED state
    //    This must show: source grove, target grove, tier, tokens
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-chain-initial.png`,
      fullPage: true
    });

    // 5. ASSERT: Verify the data matches expectations
    // Verify attribution event contains:
    // - source_grove_id visible in UI
    // - target_grove_id visible in UI
    // - tier_level (1, 2, or 3)
    // - base_tokens (10, 50, or 250)
    // - final_tokens (calculated with multipliers)

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

    // 🔧 MANDATORY: Seed localStorage with realistic test data
    await page.addInitScript(() => {
      // BEFORE state for token balance - will capture this, then trigger reward
      localStorage.setItem('grove-token-balance', JSON.stringify({
        balance: 100,  // Starting balance - screenshot this BEFORE reward
        pending: 0,
        history: [
          { type: 'initial', amount: 100, timestamp: '2026-01-10T00:00:00Z' }
        ]
      }));

      // Quality scores for multiplier tests
      localStorage.setItem('grove-quality-scores', JSON.stringify({
        currentScore: 95,  // High quality = 2.0x multiplier
        history: [
          { score: 85, date: '2026-01-12' },
          { score: 90, date: '2026-01-14' },
          { score: 95, date: '2026-01-16' }
        ]
      }));

      // Network influence data
      localStorage.setItem('grove-network-influence', JSON.stringify({
        grovesInfluenced: ['grove-beta', 'grove-gamma'],
        influenceCount: 2,
        networkBonus: 1.2  // 2 groves = 1.2x bonus
      }));
    });
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

    // 🔧 MANDATORY: Seed localStorage with realistic test data
    await page.addInitScript(() => {
      // Current grove reputation - expert level for testing
      localStorage.setItem('grove-reputation', JSON.stringify({
        score: 72,
        level: 'expert',
        color: 'blue',
        breakdown: {
          tier: 28.8,     // 40% of total
          quality: 28.8,  // 40% of total
          network: 14.4   // 20% of total
        }
      }));

      // Leaderboard data - need sorted list with multiple groves
      localStorage.setItem('grove-leaderboard', JSON.stringify([
        { rank: 1, name: 'Grove Phoenix', score: 94, level: 'legendary', color: 'purple' },
        { rank: 2, name: 'Grove Atlas', score: 87, level: 'expert', color: 'blue' },
        { rank: 3, name: 'Grove Nexus', score: 82, level: 'expert', color: 'blue' },
        { rank: 4, name: 'Grove Ember', score: 75, level: 'expert', color: 'blue' },
        { rank: 5, name: 'Grove Vista', score: 68, level: 'competent', color: 'green' },
        { rank: 6, name: 'Grove Pulse', score: 55, level: 'competent', color: 'green' },
        { rank: 7, name: 'Your Grove', score: 72, level: 'expert', color: 'blue' },
        { rank: 8, name: 'Grove Nova', score: 45, level: 'developing', color: 'amber' },
        { rank: 9, name: 'Grove Dawn', score: 32, level: 'developing', color: 'amber' },
        { rank: 10, name: 'Grove Seed', score: 18, level: 'novice', color: 'gray' }
      ]));

      // Reputation config
      localStorage.setItem('grove-reputation-config', JSON.stringify({
        weights: { tier: 0.4, quality: 0.4, network: 0.2 },
        decayRate: 0.05,
        levelThresholds: {
          legendary: 90,
          expert: 70,
          competent: 50,
          developing: 30,
          novice: 0
        }
      }));
    });
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

    // 🔧 MANDATORY: Seed localStorage with realistic test data
    await page.addInitScript(() => {
      // Dashboard metrics - specific non-zero values
      localStorage.setItem('grove-dashboard-metrics', JSON.stringify({
        totalTokens: 1847,
        activeEvents: 23,
        totalGroves: 142,
        velocity: 12.5,  // tokens per day
        trends: {
          tokens: '+15%',
          events: '+8%',
          groves: '+3%',
          velocity: '+22%'
        }
      }));

      // Attribution flow data for pie charts
      localStorage.setItem('grove-attribution-flows', JSON.stringify({
        inflow: {
          total: 450,
          sources: [
            { name: 'Tier Advancements', value: 250, percentage: 55.6 },
            { name: 'Quality Bonuses', value: 120, percentage: 26.7 },
            { name: 'Network Effects', value: 80, percentage: 17.8 }
          ]
        },
        outflow: {
          total: 125,
          destinations: [
            { name: 'Attributed to Others', value: 75, percentage: 60 },
            { name: 'Decay', value: 50, percentage: 40 }
          ]
        }
      }));

      // Transaction history
      localStorage.setItem('grove-transactions', JSON.stringify([
        { id: 'tx-001', type: 'reward', tokens: 50, source: 'Tier: Sapling', tier: 'sapling', timestamp: '2026-01-17T14:30:00Z' },
        { id: 'tx-002', type: 'bonus', tokens: 15, source: 'Quality: 95 (2.0x)', timestamp: '2026-01-17T14:30:00Z' },
        { id: 'tx-003', type: 'network', tokens: 12, source: 'Network: 2 groves (1.2x)', timestamp: '2026-01-17T14:30:00Z' },
        { id: 'tx-004', type: 'attribution', tokens: -25, source: 'To: Grove Beta', timestamp: '2026-01-16T10:15:00Z' },
        { id: 'tx-005', type: 'reward', tokens: 10, source: 'Tier: Sprout', tier: 'sprout', timestamp: '2026-01-15T09:00:00Z' }
      ]));
    });
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

### ⚠️ READ THIS FIRST

Each screenshot must show **SPECIFIC EVIDENCE** that the feature works:
- **Data visible**: Not empty states (unless testing empty state)
- **Calculated values**: Actual numbers showing formulas worked
- **State changes**: Before/after comparisons
- **User action results**: What happened after clicking/interacting

**If a screenshot could be taken without the feature existing, it's NOT VALID.**

### Screenshot Verification (OPEN AND VIEW EACH)

| # | Screenshot | SPECIFIC Evidence Required (not just "page loaded") | ✓ |
|---|------------|-----------------------------------------------------|---|
| 1 | `attribution-chain-initial.png` | Attribution section visible, ready for data (or showing existing attribution if present) | [ ] |
| 2 | `attribution-chain-populated.png` | **Chain diagram showing nodes**: Grove-A → Grove-B with percentage labels like "60%" and "40%" | [ ] |
| 3 | `attribution-chain-expanded.png` | **3 levels visible**: Level 1, Level 2, Level 3 nodes with distinct visual styling and decay values | [ ] |
| 4 | `attribution-config-panel.png` | **Config form fields**: Decay rate input (showing value like "50%"), quality weight slider, cross-grove bonus input | [ ] |
| 5 | `token-balance-initial.png` | **Token balance with specific number**: e.g., "Balance: 100 tokens" (BEFORE earning reward) | [ ] |
| 6 | `token-balance-after-reward.png` | **DIFFERENT number than #5**: e.g., "Balance: 150 tokens" showing the +50 increase | [ ] |
| 7 | `quality-multiplier-display.png` | **Multiplier AND score visible**: e.g., "Quality: 95 → 2.0x multiplier" | [ ] |
| 8 | `network-bonus-breakdown.png` | **Full calculation breakdown**: Base (50) × Quality (1.8x) × Network (1.2x) = Final (108) | [ ] |
| 9 | `reputation-badge-novice.png` | **Gray badge** with "Novice" or score 0-29, correct icon visible | [ ] |
| 10 | `reputation-badge-expert.png` | **Blue badge** with "Expert" or score 70-89, visually distinct from gray | [ ] |
| 11 | `reputation-badge-legendary.png` | **Purple badge** with "Legendary" or score 90+, crown/star icon | [ ] |
| 12 | `reputation-leaderboard.png` | **Sorted list with data**: At least 3 groves with names, scores, and badges, #1 at top | [ ] |
| 13 | `dashboard-overview.png` | **4 metric cards with numbers**: Total Tokens (e.g., "1,234"), Active Events, Groves, Velocity | [ ] |
| 14 | `dashboard-metrics-loaded.png` | **Same metrics populated** (not loading spinners), trend arrows visible | [ ] |
| 15 | `attribution-flow-chart.png` | **Chart with data segments**: Pie/flow showing inflow sources with percentages | [ ] |
| 16 | `transaction-history.png` | **5 transaction rows**: Each with timestamp, tokens earned, source grove, tier level | [ ] |

### Verification Process

1. Run: `npx playwright test tests/e2e/s11-sl-attribution/`
2. Open: `docs/sprints/s11-sl-attribution-v1/screenshots/e2e/`
3. **OPEN EACH IMAGE** in an image viewer
4. **ASK YOURSELF**: "Does this prove the acceptance criteria passed?"
5. If screenshot shows generic page without feature-specific data → **RE-RUN TEST WITH PROPER DATA SETUP**
6. Mark verified ONLY if evidence is SPECIFIC and CORRECT

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
