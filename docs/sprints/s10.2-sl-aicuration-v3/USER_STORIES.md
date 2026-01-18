# User Stories & Acceptance Criteria v1.0 Review

**Sprint:** S10.2-SL-AICuration v3 - Analytics + Override Workflows
**Codename:** Collaborative Intelligence
**Phase:** Story Extraction + Acceptance Criteria + Test Specifications
**Status:** Draft for Review

---

## Critical Observations

### 1. Analytics Dashboard is Read-Only Display

The analytics dashboard is purely informational - no user edits, no selections that modify data. This is perfect for json-render pattern.

**Recommendation:** Use QualityAnalyticsCatalog with SignalsCatalog reuse as specified in wireframe. Time range selector and Export button remain traditional React (interactive controls outside render tree).

### 2. Attribution Panel Requires Educational Tone

The "Why This Score?" panel must explain scores using educational language, not defensive machine output. Per UX Chief approval, use first-person plural ("we found") and positive framing.

**Recommendation:** AttributionCatalog rendering MUST implement educational tone as shown in wireframe. This is not optional - it's a mandatory design requirement.

### 3. Override Modal is Interactive Form (NOT json-render)

The override submission modal has score inputs, reason code dropdown, file upload - all interactive elements requiring traditional React.

**Recommendation:** Override modal stays traditional React. Only read-only displays (Attribution Panel, Override History) use json-render.

### 4. Rollback is Destructive Action

Rollback reverts to the previous score. This needs confirmation dialog and clear provenance trail.

**Recommendation:** Implement confirmation dialog per wireframe. Rollback creates audit entry, doesn't delete the rolled-back override.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Override approval workflow | Auto-approve all | Builds trust first; add approval in v2 if abuse detected |
| PDF report export | Defer | CSV covers data export needs; PDF adds complexity |
| Real-time network sync | 15-min batch refresh | Acceptable latency, avoids expensive queries |
| Machine learning from overrides | Manual pipeline | Future sprint automation |

---

## Epic 1: Quality Analytics Dashboard

### US-B001: View Analytics Dashboard Overview

**As an** operator
**I want to** view my grove's quality analytics dashboard
**So that** I can understand quality patterns across my content

**INVEST Assessment:**
- **I**ndependent: Yes - standalone dashboard section
- **N**egotiable: Yes - specific metrics can be adjusted
- **V**aluable: Yes - provides quality visibility operators lack
- **E**stimable: Yes - follows existing dashboard patterns
- **S**mall: Yes - single view implementation
- **T**estable: Yes - clear pass/fail for data display

**Acceptance Criteria:**

```gherkin
Scenario: Dashboard displays overview metrics
  Given I have sprouts with quality assessments in my grove
  When I open the Quality Analytics dashboard
  Then I see 4 StatCard metrics:
    | Metric | Description |
    | Avg Score | Average composite score with trend |
    | Assessed | Total content assessed with trend |
    | Above Threshold | Percentage above configured threshold |
    | Overrides | Total overrides with trend |
  And each metric shows trend indicator (up/down arrow with value)
  And metrics use color-coded accents (green, cyan, amber)

Scenario: Dashboard shows loading state
  Given I open the Quality Analytics dashboard
  When data is being fetched
  Then I see skeleton placeholders for all metrics
  And charts show loading indicators

Scenario: Dashboard shows empty state
  Given I have no sprouts with quality assessments
  When I open the Quality Analytics dashboard
  Then I see an EmptyState component with:
    | Icon | analytics |
    | Title | No quality data yet |
    | Description | Quality analytics appear after your grove has content with quality assessments. |
    | Action | View content in Explore |
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/dashboard-overview.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics Dashboard Overview', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to bedrock and quality analytics section
    await page.goto('/bedrock');
    await page.click('[data-testid="nav-quality-analytics"]');
  });

  test('displays dashboard with overview metrics', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="quality-analytics-dashboard"]');

    // Verify 4 StatCards are visible
    const statCards = page.locator('[data-testid="stat-card"]');
    await expect(statCards).toHaveCount(4);

    // Visual verification - screenshot comparison
    await expect(page.locator('[data-testid="quality-analytics-dashboard"]')).toHaveScreenshot(
      'quality-analytics-dashboard-overview.png'
    );
  });

  test('shows loading skeleton while fetching data', async ({ page }) => {
    // Intercept API and delay response
    await page.route('**/api/quality-analytics**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/bedrock');
    await page.click('[data-testid="nav-quality-analytics"]');

    // Verify skeleton is visible
    const skeleton = page.locator('[data-testid="analytics-skeleton"]');
    await expect(skeleton).toBeVisible();

    // Visual verification - loading state
    await expect(skeleton).toHaveScreenshot('quality-analytics-loading.png');
  });

  test('displays empty state when no data', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/quality-analytics**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: null }),
      });
    });

    await page.reload();

    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.locator('h3')).toContainText('No quality data yet');

    // Visual verification - empty state
    await expect(emptyState).toHaveScreenshot('quality-analytics-empty.png');
  });

  test('metrics show correct trend indicators', async ({ page }) => {
    const avgScoreCard = page.locator('[data-testid="stat-card-avg-score"]');

    // Verify trend indicator exists and shows direction
    const trendIndicator = avgScoreCard.locator('[data-testid="trend-indicator"]');
    await expect(trendIndicator).toBeVisible();
    await expect(trendIndicator).toHaveAttribute('data-direction', /(up|down)/);
  });
});
```

**Traceability:** Spec sections "Flow 4: Analyze Quality Analytics", "Screen 1: Quality Analytics Dashboard"

**Technical Requirement:** json-render (QualityAnalyticsCatalog) with SignalsCatalog reuse for MetricCard, MetricRow

---

### US-B002: Select Analytics Time Range

**As an** operator
**I want to** select different time ranges for analytics data
**So that** I can analyze quality patterns over various periods

**INVEST Assessment:**
- **I**ndependent: Yes - time range is URL-persisted state
- **N**egotiable: Yes - specific ranges can be configured
- **V**aluable: Yes - enables temporal analysis
- **E**stimable: Yes - simple state management
- **S**mall: Yes - button group with filter
- **T**estable: Yes - clear data changes per range

**Acceptance Criteria:**

```gherkin
Scenario: Time range buttons are displayed
  Given I am on the Quality Analytics dashboard
  Then I see time range buttons: [7d] [30d] [90d] [All Time]
  And "30d" is selected by default
  And the selected button is visually highlighted

Scenario: Selecting different time range
  Given I am on the Quality Analytics dashboard with "30d" selected
  When I click the "7d" button
  Then the dashboard data refreshes
  And metrics show data for the last 7 days
  And the URL updates with time range parameter
  And "7d" button is now highlighted

Scenario: Time range persists in URL
  Given I navigate to /bedrock/quality-analytics?range=90d
  Then the "90d" button is selected
  And dashboard shows 90-day data
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/time-range-selection.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics Time Range Selection', () => {
  test('displays time range buttons with 30d default', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const timeRangeGroup = page.locator('[data-testid="time-range-selector"]');
    await expect(timeRangeGroup).toBeVisible();

    // Verify all buttons present
    await expect(timeRangeGroup.locator('button')).toHaveCount(4);

    // Verify 30d is selected by default
    const button30d = timeRangeGroup.locator('button:has-text("30d")');
    await expect(button30d).toHaveAttribute('aria-pressed', 'true');

    // Visual verification
    await expect(timeRangeGroup).toHaveScreenshot('time-range-30d-selected.png');
  });

  test('changes time range and updates URL', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    // Click 7d button
    await page.click('[data-testid="time-range-7d"]');

    // Verify URL updated
    await expect(page).toHaveURL(/range=7d/);

    // Verify button selection changed
    const button7d = page.locator('[data-testid="time-range-7d"]');
    await expect(button7d).toHaveAttribute('aria-pressed', 'true');
  });

  test('loads correct time range from URL parameter', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics?range=90d');

    const button90d = page.locator('[data-testid="time-range-90d"]');
    await expect(button90d).toHaveAttribute('aria-pressed', 'true');
  });

  test('data refreshes when time range changes', async ({ page }) => {
    let apiCalls = 0;
    await page.route('**/api/quality-analytics**', (route) => {
      apiCalls++;
      route.continue();
    });

    await page.goto('/bedrock/quality-analytics');
    const initialCalls = apiCalls;

    await page.click('[data-testid="time-range-7d"]');
    await page.waitForResponse('**/api/quality-analytics**');

    expect(apiCalls).toBeGreaterThan(initialCalls);
  });
});
```

**Traceability:** Spec section "Flow 4: Analyze Quality Analytics" step 2

---

### US-B003: View Dimension Profile Radar Chart

**As an** operator
**I want to** see my grove's quality dimensions compared to network average
**So that** I can identify strengths and areas for improvement

**INVEST Assessment:**
- **I**ndependent: Yes - chart component standalone
- **N**egotiable: Yes - chart styling adjustable
- **V**aluable: Yes - identifies dimension gaps
- **E**stimable: Yes - uses existing Recharts
- **S**mall: Yes - single chart component
- **T**estable: Yes - data points and comparison visible

**Acceptance Criteria:**

```gherkin
Scenario: Radar chart displays dimension comparison
  Given I have quality assessments with dimension scores
  When I view the Quality Analytics dashboard
  Then I see a radar chart with 4 axes:
    | Dimension | Grove Score | Network Avg |
    | Accuracy | (grove value) | (network value) |
    | Utility | (grove value) | (network value) |
    | Novelty | (grove value) | (network value) |
    | Provenance | (grove value) | (network value) |
  And grove values are shown as solid line
  And network average is shown as dotted line
  And legend shows "Your grove" and "Network average"

Scenario: Hover shows exact values
  Given I am viewing the dimension radar chart
  When I hover over a data point
  Then I see a tooltip with exact dimension score
  And tooltip shows both grove and network values
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/dimension-radar-chart.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics Dimension Radar Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');
    await page.waitForSelector('[data-testid="dimension-profile-chart"]');
  });

  test('displays radar chart with 4 dimensions', async ({ page }) => {
    const radarChart = page.locator('[data-testid="dimension-profile-chart"]');
    await expect(radarChart).toBeVisible();

    // Verify chart has 4 axis labels
    const axisLabels = radarChart.locator('.recharts-polar-angle-axis-tick');
    await expect(axisLabels).toHaveCount(4);

    // Visual verification - radar chart
    await expect(radarChart).toHaveScreenshot('dimension-radar-chart.png');
  });

  test('shows legend with grove and network lines', async ({ page }) => {
    const legend = page.locator('[data-testid="radar-legend"]');

    await expect(legend.locator(':has-text("Your grove")')).toBeVisible();
    await expect(legend.locator(':has-text("Network average")')).toBeVisible();
  });

  test('tooltip shows values on hover', async ({ page }) => {
    const radarChart = page.locator('[data-testid="dimension-profile-chart"]');

    // Hover over a chart area (accuracy axis)
    const chartArea = radarChart.locator('.recharts-radar-polygon').first();
    await chartArea.hover();

    // Wait for tooltip
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/\d+/); // Contains numeric value
  });
});
```

**Traceability:** Spec section "Screen 1: Quality Analytics Dashboard" - Dimension Profile

**Technical Requirement:** json-render component DimensionProfile with Recharts RadarChart

---

### US-B004: View Score Distribution Chart

**As an** operator
**I want to** see how my quality scores are distributed
**So that** I can understand the overall quality profile of my grove

**INVEST Assessment:**
- **I**ndependent: Yes - standalone visualization
- **N**egotiable: Yes - bin ranges configurable
- **V**aluable: Yes - shows distribution patterns
- **E**stimable: Yes - horizontal bar chart
- **S**mall: Yes - single chart
- **T**estable: Yes - bins and percentages visible

**Acceptance Criteria:**

```gherkin
Scenario: Distribution chart shows score bins
  Given I have multiple sprouts with quality scores
  When I view the Score Distribution chart
  Then I see a horizontal bar chart with bins:
    | Bin | Percentage |
    | <50 | (calculated %) |
    | 50-70 | (calculated %) |
    | 70-85 | (calculated %) |
    | 85+ | (calculated %) |
  And each bin shows a percentage label
  And bar length represents percentage

Scenario: Chart updates with time range
  Given I am viewing the Score Distribution chart
  When I change the time range from 30d to 7d
  Then the distribution recalculates for 7-day data
  And percentages update accordingly
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/score-distribution.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics Score Distribution', () => {
  test('displays horizontal bar chart with score bins', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const distributionChart = page.locator('[data-testid="score-distribution-chart"]');
    await expect(distributionChart).toBeVisible();

    // Verify 4 bins present
    const bars = distributionChart.locator('[data-testid="distribution-bar"]');
    await expect(bars).toHaveCount(4);

    // Verify labels
    await expect(distributionChart).toContainText('<50');
    await expect(distributionChart).toContainText('50-70');
    await expect(distributionChart).toContainText('70-85');
    await expect(distributionChart).toContainText('85+');

    // Visual verification
    await expect(distributionChart).toHaveScreenshot('score-distribution-chart.png');
  });

  test('shows percentage labels on bars', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const percentageLabels = page.locator('[data-testid="distribution-percentage"]');
    await expect(percentageLabels).toHaveCount(4);

    // Each should contain a percentage
    for (const label of await percentageLabels.all()) {
      await expect(label).toHaveText(/%$/);
    }
  });
});
```

**Traceability:** Spec section "Screen 1: Quality Analytics Dashboard" - Score Distribution

---

### US-B005: View Quality Trend Over Time

**As an** operator
**I want to** see how my grove's quality has changed over time
**So that** I can track improvement and identify trends

**INVEST Assessment:**
- **I**ndependent: Yes - standalone time series chart
- **N**egotiable: Yes - comparison line optional
- **V**aluable: Yes - shows progress and trends
- **E**stimable: Yes - Recharts LineChart
- **S**mall: Yes - single visualization
- **T**estable: Yes - trend line and comparison visible

**Acceptance Criteria:**

```gherkin
Scenario: Trend chart displays quality over time
  Given I have quality assessments over the selected time range
  When I view the Quality Trend chart
  Then I see a line chart with:
    | Line | Style | Label |
    | Grove Average | Solid | "Grove Average: {value}" |
    | Network Average | Dotted | "Network Average: {value}" |
  And x-axis shows dates within the selected range
  And y-axis shows quality scores (0-100)
  And percentile ranking is displayed ("Your grove is in the 73rd percentile")

Scenario: Trend line shows data points
  Given I am viewing the Quality Trend chart
  When I hover over a point on the line
  Then I see a tooltip with:
    | Field | Value |
    | Date | {date} |
    | Grove Score | {score} |
    | Network Score | {networkScore} |
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/quality-trend.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics Trend Chart', () => {
  test('displays line chart with grove and network averages', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const trendChart = page.locator('[data-testid="quality-trend-chart"]');
    await expect(trendChart).toBeVisible();

    // Verify two lines present (grove and network)
    const lines = trendChart.locator('.recharts-line');
    await expect(lines).toHaveCount(2);

    // Visual verification
    await expect(trendChart).toHaveScreenshot('quality-trend-chart.png');
  });

  test('shows percentile ranking text', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const percentileText = page.locator('[data-testid="percentile-ranking"]');
    await expect(percentileText).toBeVisible();
    await expect(percentileText).toContainText(/\d+.*percentile/);
  });

  test('tooltip appears on hover with date and scores', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const trendChart = page.locator('[data-testid="quality-trend-chart"]');
    const chartArea = trendChart.locator('.recharts-cartesian-grid');

    // Hover over chart
    await chartArea.hover({ position: { x: 200, y: 100 } });

    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
  });

  test('chart updates when time range changes', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics?range=30d');

    // Screenshot 30d view
    const chart30d = page.locator('[data-testid="quality-trend-chart"]');
    await expect(chart30d).toHaveScreenshot('trend-chart-30d.png');

    // Change to 7d
    await page.click('[data-testid="time-range-7d"]');
    await page.waitForResponse('**/api/quality-analytics**');

    // Screenshot 7d view - should be different
    await expect(chart30d).toHaveScreenshot('trend-chart-7d.png');
  });
});
```

**Traceability:** Spec section "Screen 1: Quality Analytics Dashboard" - Quality Trend

---

### US-B006: Export Analytics to CSV

**As an** operator
**I want to** export analytics data to CSV
**So that** I can analyze data externally or share with stakeholders

**INVEST Assessment:**
- **I**ndependent: Yes - standalone action
- **N**egotiable: Yes - included fields adjustable
- **V**aluable: Yes - enables external analysis
- **E**stimable: Yes - CSV generation logic
- **S**mall: Yes - button with download
- **T**estable: Yes - file downloads with correct data

**Acceptance Criteria:**

```gherkin
Scenario: Export button downloads CSV
  Given I am on the Quality Analytics dashboard
  When I click the "Export CSV" button
  Then a CSV file downloads
  And the filename includes grove ID and date range
  And CSV contains all visible metrics data

Scenario: CSV contains correct data
  Given analytics shows data for 30d time range
  When I export to CSV
  Then the CSV includes columns:
    | Column |
    | date |
    | avg_score |
    | assessed_count |
    | above_threshold_pct |
    | override_count |
    | accuracy_avg |
    | utility_avg |
    | novelty_avg |
    | provenance_avg |
  And date range matches selected time range
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/export-csv.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Analytics CSV Export', () => {
  test('export button is visible', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toHaveText(/Export CSV/i);
  });

  test('clicking export downloads CSV file', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    await page.click('[data-testid="export-csv-button"]');

    const download = await downloadPromise;

    // Verify filename pattern
    expect(download.suggestedFilename()).toMatch(/quality-analytics.*\.csv$/);

    // Verify file can be saved
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('CSV contains expected columns', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-csv-button"]');

    const download = await downloadPromise;
    const content = await download.path();

    // Read file and verify headers
    const fs = require('fs');
    const csvContent = fs.readFileSync(content, 'utf-8');
    const headers = csvContent.split('\n')[0];

    expect(headers).toContain('date');
    expect(headers).toContain('avg_score');
    expect(headers).toContain('assessed_count');
  });
});
```

**Traceability:** Spec section "Flow 4: Analyze Quality Analytics" step 8

---

## Epic 2: Score Attribution ("Why This Score?")

### US-B007: View Score Attribution Panel (json-render REQUIRED)

**As an** operator
**I want to** understand why a sprout received its quality score
**So that** I can trust the assessment and know how to improve

**INVEST Assessment:**
- **I**ndependent: Yes - panel standalone
- **N**egotiable: Yes - dimension display order adjustable
- **V**aluable: Yes - builds trust through transparency
- **E**stimable: Yes - follows slide-in panel pattern
- **S**mall: Yes - single panel with dimension cards
- **T**estable: Yes - dimensions and reasoning visible

**Acceptance Criteria:**

```gherkin
Scenario: Attribution panel displays dimension breakdown
  Given I am viewing a sprout with a quality score
  When I click "Why this score?"
  Then the Attribution panel slides in from the right
  And I see the overall score with confidence level
  And I see 4 dimension cards:
    | Dimension | Fields |
    | Accuracy | Score, Star rating, Summary, Findings, Suggestion |
    | Utility | Score, Star rating, Summary, Findings, Suggestion |
    | Novelty | Score, Star rating, Summary, Findings, Suggestion |
    | Provenance | Score, Star rating, Summary, Findings, Suggestion |
  And each card uses educational tone (first-person plural, positive framing)
  And I see a "Request Override" button at the bottom

Scenario: Attribution panel uses educational language
  Given the Attribution panel is open
  Then dimension summaries use "we" not "the model"
  And findings are labeled "What we found" (positive framing)
  And improvement tips are labeled "To improve" (constructive, not critical)

Scenario: Close attribution panel
  Given the Attribution panel is open
  When I click the close button [x]
  Then the panel slides out
  And focus returns to the sprout card
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-attribution/attribution-panel.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Score Attribution Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a sprout with quality score
    await page.goto('/explore');
    await page.waitForSelector('[data-testid="sprout-card"]');
  });

  test('opens attribution panel from "Why this score?" link', async ({ page }) => {
    // Find sprout with quality score and click attribution link
    const sproutCard = page.locator('[data-testid="sprout-card"]').first();
    const whyLink = sproutCard.locator('[data-testid="why-this-score"]');

    await whyLink.click();

    // Verify panel slides in
    const attributionPanel = page.locator('[data-testid="attribution-panel"]');
    await expect(attributionPanel).toBeVisible();

    // Visual verification - attribution panel open
    await expect(attributionPanel).toHaveScreenshot('attribution-panel-open.png');
  });

  test('displays overall score with confidence', async ({ page }) => {
    await page.click('[data-testid="why-this-score"]');

    const overallSection = page.locator('[data-testid="attribution-overall"]');
    await expect(overallSection).toContainText(/Overall: \d+\/100/);
    await expect(overallSection).toContainText(/Confidence: (High|Medium|Low)/);
  });

  test('shows 4 dimension cards with educational tone', async ({ page }) => {
    await page.click('[data-testid="why-this-score"]');

    const dimensionCards = page.locator('[data-testid="attribution-dimension"]');
    await expect(dimensionCards).toHaveCount(4);

    // Verify educational tone - "What we found" not "Model determined"
    for (const card of await dimensionCards.all()) {
      await expect(card).toContainText('What we found');
      await expect(card).not.toContainText('model determined');
    }
  });

  test('each dimension shows score, stars, and suggestions', async ({ page }) => {
    await page.click('[data-testid="why-this-score"]');

    const firstDimension = page.locator('[data-testid="attribution-dimension"]').first();

    // Score visible
    await expect(firstDimension.locator('[data-testid="dimension-score"]')).toBeVisible();

    // Star rating visible
    await expect(firstDimension.locator('[data-testid="star-rating"]')).toBeVisible();

    // Visual verification - dimension card
    await expect(firstDimension).toHaveScreenshot('attribution-dimension-card.png');
  });

  test('shows "Request Override" button', async ({ page }) => {
    await page.click('[data-testid="why-this-score"]');

    const overrideButton = page.locator('[data-testid="request-override-button"]');
    await expect(overrideButton).toBeVisible();
    await expect(overrideButton).toHaveText(/Request Override/i);
  });

  test('panel closes and returns focus', async ({ page }) => {
    const whyLink = page.locator('[data-testid="why-this-score"]');
    await whyLink.click();

    const panel = page.locator('[data-testid="attribution-panel"]');
    await expect(panel).toBeVisible();

    // Close panel
    await page.click('[data-testid="attribution-close"]');

    await expect(panel).not.toBeVisible();
    await expect(whyLink).toBeFocused();
  });

  test('escape key closes panel', async ({ page }) => {
    await page.click('[data-testid="why-this-score"]');

    const panel = page.locator('[data-testid="attribution-panel"]');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(panel).not.toBeVisible();
  });
});
```

**Traceability:** Spec sections "Flow 1: View Score Attribution", "Screen 2: Score Attribution Panel"

**Technical Requirement:** json-render (AttributionCatalog) with educational tone MANDATORY

---

### US-B008: Access Attribution from Quality Badge

**As an** operator
**I want to** click on a quality badge to see score attribution
**So that** I can quickly understand any score I see

**INVEST Assessment:**
- **I**ndependent: Yes - badge click independent of panel
- **N**egotiable: Yes - interaction pattern flexible
- **V**aluable: Yes - direct access to attribution
- **E**stimable: Yes - click handler routing
- **S**mall: Yes - event binding
- **T**estable: Yes - click opens correct panel

**Acceptance Criteria:**

```gherkin
Scenario: Click quality badge opens attribution
  Given I see a sprout card with a quality badge showing "78 (B+)"
  When I click on the quality badge
  Then the Attribution panel opens
  And panel shows attribution for that specific sprout

Scenario: Badge has visual affordance for click
  Given I am viewing sprout cards with quality badges
  Then each badge shows a hover state indicating it's clickable
  And cursor changes to pointer on hover
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-attribution/badge-click.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Attribution from Quality Badge Click', () => {
  test('clicking badge opens attribution panel', async ({ page }) => {
    await page.goto('/explore');

    const badge = page.locator('[data-testid="quality-badge"]').first();
    await badge.click();

    const panel = page.locator('[data-testid="attribution-panel"]');
    await expect(panel).toBeVisible();
  });

  test('badge has pointer cursor on hover', async ({ page }) => {
    await page.goto('/explore');

    const badge = page.locator('[data-testid="quality-badge"]').first();
    await badge.hover();

    const cursor = await badge.evaluate((el) =>
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('badge shows hover state', async ({ page }) => {
    await page.goto('/explore');

    const badge = page.locator('[data-testid="quality-badge"]').first();

    // Screenshot default state
    await expect(badge).toHaveScreenshot('quality-badge-default.png');

    // Hover and screenshot
    await badge.hover();
    await expect(badge).toHaveScreenshot('quality-badge-hover.png');
  });
});
```

**Traceability:** Spec section "Flow 1: View Score Attribution" step 2

---

## Epic 3: Override Submission

### US-B009: Open Override Modal

**As an** operator
**I want to** request a score override when I disagree with the assessment
**So that** I can correct AI mistakes

**INVEST Assessment:**
- **I**ndependent: Yes - modal standalone
- **N**egotiable: Yes - entry points flexible
- **V**aluable: Yes - enables human correction
- **E**stimable: Yes - modal pattern exists
- **S**mall: Yes - modal open action
- **T**estable: Yes - modal appears with correct data

**Acceptance Criteria:**

```gherkin
Scenario: Open override modal from attribution panel
  Given the Attribution panel is open
  When I click "Request Override"
  Then the Override modal opens
  And modal shows current composite score
  And dimension inputs show current values as placeholders
  And reason dropdown is not selected
  And explanation field is empty

Scenario: Override modal shows current scores
  Given a sprout has scores: Accuracy 42, Utility 51, Novelty 38, Provenance 49
  When I open the Override modal for this sprout
  Then I see dimension inputs with "(was XX)" labels for each
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-override/open-modal.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Override Modal Opening', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="why-this-score"]');
    await page.waitForSelector('[data-testid="attribution-panel"]');
  });

  test('opens override modal from attribution panel', async ({ page }) => {
    await page.click('[data-testid="request-override-button"]');

    const modal = page.locator('[data-testid="override-modal"]');
    await expect(modal).toBeVisible();

    // Visual verification - override modal
    await expect(modal).toHaveScreenshot('override-modal-open.png');
  });

  test('modal displays current composite score', async ({ page }) => {
    await page.click('[data-testid="request-override-button"]');

    const currentScore = page.locator('[data-testid="current-composite-score"]');
    await expect(currentScore).toContainText(/Current Score: \d+\/100/);
  });

  test('dimension inputs show original values', async ({ page }) => {
    await page.click('[data-testid="request-override-button"]');

    const accuracyInput = page.locator('[data-testid="override-accuracy"]');
    await expect(accuracyInput.locator('[data-testid="original-value"]')).toContainText(/was \d+/);
  });

  test('reason dropdown not selected by default', async ({ page }) => {
    await page.click('[data-testid="request-override-button"]');

    const reasonDropdown = page.locator('[data-testid="override-reason"]');
    await expect(reasonDropdown).toHaveValue('');
  });
});
```

**Traceability:** Spec section "Flow 2: Submit Override" steps 1-3

---

### US-B010: Submit Quality Override

**As an** operator
**I want to** submit corrected dimension scores with an explanation
**So that** the quality score reflects my expert judgment

**INVEST Assessment:**
- **I**ndependent: Yes - submission is standalone action
- **N**egotiable: Yes - required fields configurable
- **V**aluable: Yes - core override functionality
- **E**stimable: Yes - form validation and submission
- **S**mall: Yes - form with database write
- **T**estable: Yes - clear validation and submission states

**Acceptance Criteria:**

```gherkin
Scenario: Fill out override form
  Given the Override modal is open
  When I enter new dimension scores (only changed dimensions)
  And I select a reason code from dropdown
  And I enter explanation text (min 20 characters)
  Then the Submit button becomes enabled
  And live preview shows new composite score

Scenario: Submit override succeeds
  Given I have filled the override form completely
  When I click "Submit Override"
  Then a confirmation dialog appears
  And when I confirm, the override is submitted
  And success toast appears
  And modal closes
  And sprout card shows updated quality score

Scenario: Form validation prevents incomplete submission
  Given the Override modal is open
  But I have not selected a reason code
  Then the Submit button is disabled
  And I see "Required" indicator on reason field

Scenario: Explanation minimum length enforced
  Given I have entered only 10 characters in explanation
  Then Submit button is disabled
  And I see "Min 20 characters (currently: 10)"
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-override/submit-override.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Override Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="why-this-score"]');
    await page.click('[data-testid="request-override-button"]');
    await page.waitForSelector('[data-testid="override-modal"]');
  });

  test('submit button disabled when form incomplete', async ({ page }) => {
    const submitButton = page.locator('[data-testid="submit-override"]');
    await expect(submitButton).toBeDisabled();
  });

  test('entering valid data enables submit', async ({ page }) => {
    // Enter new score
    await page.fill('[data-testid="override-accuracy"] input', '78');

    // Select reason
    await page.selectOption('[data-testid="override-reason"]', 'incorrect_assessment');

    // Enter explanation (20+ chars)
    await page.fill(
      '[data-testid="override-explanation"]',
      'The automated assessment missed important peer-reviewed citations.'
    );

    const submitButton = page.locator('[data-testid="submit-override"]');
    await expect(submitButton).toBeEnabled();
  });

  test('shows character count for explanation', async ({ page }) => {
    const explanation = page.locator('[data-testid="override-explanation"]');
    await explanation.fill('Short text');

    const charCount = page.locator('[data-testid="explanation-char-count"]');
    await expect(charCount).toContainText('currently: 10');
    await expect(charCount).toContainText('Min 20');
  });

  test('live preview shows new composite score', async ({ page }) => {
    await page.fill('[data-testid="override-accuracy"] input', '78');
    await page.fill('[data-testid="override-utility"] input', '65');

    const preview = page.locator('[data-testid="new-composite-preview"]');
    await expect(preview).toContainText(/New composite: ~\d+/);
  });

  test('successful submission shows confirmation then toast', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="override-accuracy"] input', '78');
    await page.selectOption('[data-testid="override-reason"]', 'incorrect_assessment');
    await page.fill(
      '[data-testid="override-explanation"]',
      'The automated assessment missed important peer-reviewed citations.'
    );

    // Submit
    await page.click('[data-testid="submit-override"]');

    // Confirmation dialog appears
    const confirmDialog = page.locator('[data-testid="override-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();

    // Visual verification - confirmation dialog
    await expect(confirmDialog).toHaveScreenshot('override-confirm-dialog.png');

    // Confirm
    await page.click('[data-testid="confirm-override"]');

    // Modal closes
    await expect(page.locator('[data-testid="override-modal"]')).not.toBeVisible();

    // Success toast appears
    const toast = page.locator('[data-testid="success-toast"]');
    await expect(toast).toBeVisible();
  });

  test('reason codes dropdown has 4 options', async ({ page }) => {
    const dropdown = page.locator('[data-testid="override-reason"]');
    const options = dropdown.locator('option');

    // 4 options + 1 placeholder
    await expect(options).toHaveCount(5);

    await expect(dropdown).toContainText('Incorrect Assessment');
    await expect(dropdown).toContainText('Missing Context');
    await expect(dropdown).toContainText('Model Error');
    await expect(dropdown).toContainText('Other');
  });
});
```

**Traceability:** Spec sections "Flow 2: Submit Override", "Screen 3: Override Submission Modal"

---

### US-B011: Upload Evidence for Override

**As an** operator
**I want to** attach evidence files to my override request
**So that** I can support my correction with documentation

**INVEST Assessment:**
- **I**ndependent: Yes - file upload optional
- **N**egotiable: Yes - supported formats configurable
- **V**aluable: Yes - strengthens override justification
- **E**stimable: Yes - file upload pattern exists
- **S**mall: Yes - dropzone with validation
- **T**estable: Yes - file uploads and shows in form

**Acceptance Criteria:**

```gherkin
Scenario: Upload evidence file
  Given the Override modal is open
  When I drag a PDF file to the evidence dropzone
  Then the file is uploaded
  And filename appears in the form
  And I can remove the file if needed

Scenario: File type validation
  Given the Override modal is open
  When I try to upload an unsupported file type (.exe)
  Then upload is rejected
  And error message shows "Supports: PDF, PNG, JPG"

Scenario: File size validation
  Given the Override modal is open
  When I try to upload a file larger than 5MB
  Then upload is rejected
  And error message shows "Max file size: 5MB"
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-override/evidence-upload.spec.ts

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Override Evidence Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="why-this-score"]');
    await page.click('[data-testid="request-override-button"]');
    await page.waitForSelector('[data-testid="override-modal"]');
  });

  test('evidence dropzone is visible and optional', async ({ page }) => {
    const dropzone = page.locator('[data-testid="evidence-dropzone"]');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('optional');
  });

  test('can upload PDF file', async ({ page }) => {
    const fileInput = page.locator('[data-testid="evidence-input"]');

    // Upload test PDF
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test-evidence.pdf'));

    // Verify file shows in form
    const uploadedFile = page.locator('[data-testid="uploaded-evidence"]');
    await expect(uploadedFile).toContainText('test-evidence.pdf');
  });

  test('can remove uploaded file', async ({ page }) => {
    const fileInput = page.locator('[data-testid="evidence-input"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test-evidence.pdf'));

    // Remove file
    await page.click('[data-testid="remove-evidence"]');

    // Verify removed
    const uploadedFile = page.locator('[data-testid="uploaded-evidence"]');
    await expect(uploadedFile).not.toBeVisible();
  });

  test('rejects unsupported file types', async ({ page }) => {
    const fileInput = page.locator('[data-testid="evidence-input"]');

    // Try to upload exe (should be rejected)
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/test.exe'));

    const error = page.locator('[data-testid="upload-error"]');
    await expect(error).toContainText('Supports: PDF, PNG, JPG');
  });
});
```

**Traceability:** Spec section "Flow 2: Submit Override" step 7

---

## Epic 4: Override History & Rollback

### US-B012: View Override History Timeline (json-render REQUIRED)

**As an** operator
**I want to** see the complete history of overrides for a sprout
**So that** I can understand how the score evolved

**INVEST Assessment:**
- **I**ndependent: Yes - history tab standalone
- **N**egotiable: Yes - display format flexible
- **V**aluable: Yes - provides audit trail
- **E**stimable: Yes - timeline component pattern
- **S**mall: Yes - single timeline view
- **T**estable: Yes - entries visible with correct data

**Acceptance Criteria:**

```gherkin
Scenario: View override history timeline
  Given a sprout has override history
  When I click the "Override History" tab
  Then I see a timeline with entries for each override
  And each entry shows:
    | Field | Example |
    | Date | Jan 17, 2026 at 14:32 |
    | Operator | alice@grove.network |
    | Score change | 45 → 72 (+27) |
    | Reason code | Incorrect Assessment |
    | Explanation | "The automated assessment..." |
  And rolled-back entries show "ROLLED BACK" badge
  And timeline ends with original score from assessment

Scenario: Empty override history
  Given a sprout has no override history
  When I click the "Override History" tab
  Then I see an empty state:
    | Icon | check_circle |
    | Title | No overrides for this content |
    | Description | The current quality score is the original automated assessment. |
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-override/history-timeline.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Override History Timeline', () => {
  test('displays timeline with override entries', async ({ page }) => {
    // Navigate to sprout with override history
    await page.goto('/explore');
    await page.click('[data-testid="sprout-card-with-overrides"]');
    await page.click('[data-testid="tab-override-history"]');

    const timeline = page.locator('[data-testid="override-history-timeline"]');
    await expect(timeline).toBeVisible();

    // Visual verification - timeline
    await expect(timeline).toHaveScreenshot('override-history-timeline.png');
  });

  test('each entry shows required fields', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="sprout-card-with-overrides"]');
    await page.click('[data-testid="tab-override-history"]');

    const firstEntry = page.locator('[data-testid="override-entry"]').first();

    await expect(firstEntry.locator('[data-testid="entry-date"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="entry-operator"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="entry-score-change"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="entry-reason"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="entry-explanation"]')).toBeVisible();
  });

  test('rolled back entries show badge', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="sprout-with-rollback"]');
    await page.click('[data-testid="tab-override-history"]');

    const rolledBackEntry = page.locator('[data-testid="override-entry"][data-rolled-back="true"]');
    await expect(rolledBackEntry.locator('[data-testid="rollback-badge"]')).toBeVisible();
    await expect(rolledBackEntry).toContainText('ROLLED BACK');
  });

  test('timeline ends with original score', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="sprout-card-with-overrides"]');
    await page.click('[data-testid="tab-override-history"]');

    const originalScore = page.locator('[data-testid="original-score-entry"]');
    await expect(originalScore).toBeVisible();
    await expect(originalScore).toContainText('Original score');
    await expect(originalScore).toContainText(/Assessed:/);
  });

  test('shows empty state when no history', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="sprout-without-overrides"]');
    await page.click('[data-testid="tab-override-history"]');

    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No overrides for this content');

    // Visual verification - empty state
    await expect(emptyState).toHaveScreenshot('override-history-empty.png');
  });
});
```

**Traceability:** Spec sections "Flow 3: View Override History", "Screen 4: Override History Timeline"

**Technical Requirement:** json-render (OverrideHistoryCatalog) with SignalsCatalog ActivityTimeline reuse

---

### US-B013: Rollback Override

**As an** operator
**I want to** rollback an override to the previous score
**So that** I can undo incorrect corrections

**INVEST Assessment:**
- **I**ndependent: Yes - rollback standalone action
- **N**egotiable: Yes - confirmation dialog required
- **V**aluable: Yes - enables error correction
- **E**stimable: Yes - revert logic clear
- **S**mall: Yes - single action with confirmation
- **T**estable: Yes - score reverts, history updated

**Acceptance Criteria:**

```gherkin
Scenario: Rollback override
  Given I am viewing override history with at least one active override
  When I click "Rollback" on the most recent override
  Then a confirmation dialog appears explaining:
    | Field | Value |
    | Action | Revert to previous score |
    | Score change | Current → Previous |
    | Warning | This action will be recorded |
  And when I confirm, the score reverts
  And the override entry shows "ROLLED BACK" badge
  And new audit entry records the rollback

Scenario: Rollback only available on most recent
  Given I am viewing override history with multiple overrides
  Then only the most recent non-rolled-back entry has a Rollback button
  And older entries do not show Rollback
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-override/rollback.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Override Rollback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="sprout-card-with-overrides"]');
    await page.click('[data-testid="tab-override-history"]');
  });

  test('rollback button visible on most recent entry', async ({ page }) => {
    const mostRecentEntry = page.locator('[data-testid="override-entry"]').first();
    const rollbackButton = mostRecentEntry.locator('[data-testid="rollback-button"]');

    await expect(rollbackButton).toBeVisible();
  });

  test('clicking rollback shows confirmation dialog', async ({ page }) => {
    await page.click('[data-testid="rollback-button"]');

    const confirmDialog = page.locator('[data-testid="rollback-confirm-dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('Revert');

    // Visual verification
    await expect(confirmDialog).toHaveScreenshot('rollback-confirm-dialog.png');
  });

  test('confirming rollback reverts score', async ({ page }) => {
    // Get current score before rollback
    const scoreBefore = await page.locator('[data-testid="current-score"]').textContent();

    await page.click('[data-testid="rollback-button"]');
    await page.click('[data-testid="confirm-rollback"]');

    // Wait for update
    await page.waitForResponse('**/api/quality-overrides**');

    // Score should change
    const scoreAfter = await page.locator('[data-testid="current-score"]').textContent();
    expect(scoreAfter).not.toBe(scoreBefore);

    // Entry shows rolled back badge
    const entry = page.locator('[data-testid="override-entry"]').first();
    await expect(entry.locator('[data-testid="rollback-badge"]')).toBeVisible();
  });

  test('cancel rollback closes dialog without changes', async ({ page }) => {
    const scoreBefore = await page.locator('[data-testid="current-score"]').textContent();

    await page.click('[data-testid="rollback-button"]');
    await page.click('[data-testid="cancel-rollback"]');

    // Dialog closes
    await expect(page.locator('[data-testid="rollback-confirm-dialog"]')).not.toBeVisible();

    // Score unchanged
    const scoreAfter = await page.locator('[data-testid="current-score"]').textContent();
    expect(scoreAfter).toBe(scoreBefore);
  });
});
```

**Traceability:** Spec section "Flow 3: View Override History" step 4

---

## Epic 5: Network Comparison

### US-B014: View Network Comparison

**As an** operator
**I want to** compare my grove's quality to network average
**So that** I can benchmark my content quality

**INVEST Assessment:**
- **I**ndependent: Yes - comparison view standalone
- **N**egotiable: Yes - displayed metrics adjustable
- **V**aluable: Yes - creates healthy competition
- **E**stimable: Yes - aggregation queries exist
- **S**mall: Yes - comparison display
- **T**estable: Yes - percentile and ranking visible

**Acceptance Criteria:**

```gherkin
Scenario: View network comparison on dashboard
  Given I have federated learning participation enabled
  When I view the Quality Analytics dashboard
  Then I see network comparison data:
    | Field | Example |
    | Percentile ranking | 73rd percentile |
    | Network average | 72.1 |
    | Grove average | 78.4 |
  And radar chart shows network average as dotted line
  And trend chart shows network average alongside grove

Scenario: Network comparison respects privacy
  Given federated learning shows network statistics
  Then I do not see individual grove scores
  And comparisons use anonymized aggregates only
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/network-comparison.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Network Comparison', () => {
  test('shows percentile ranking', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const percentileRanking = page.locator('[data-testid="percentile-ranking"]');
    await expect(percentileRanking).toBeVisible();
    await expect(percentileRanking).toContainText(/\d+.*percentile/i);
  });

  test('radar chart includes network average line', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const radarChart = page.locator('[data-testid="dimension-profile-chart"]');
    const networkLine = radarChart.locator('[data-testid="network-average-line"]');

    await expect(networkLine).toBeVisible();
  });

  test('trend chart shows both grove and network lines', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const trendChart = page.locator('[data-testid="quality-trend-chart"]');

    // Two lines: grove and network
    const lines = trendChart.locator('.recharts-line');
    await expect(lines).toHaveCount(2);

    // Legend shows both
    await expect(trendChart).toContainText('Grove Average');
    await expect(trendChart).toContainText('Network Average');
  });

  test('does not expose individual grove data', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    // Should not show other grove IDs or specific scores
    const content = await page.content();

    // Should contain aggregates like "percentile", "average"
    expect(content).toContain('percentile');
    expect(content).toContain('average');

    // Should NOT contain other grove identifiers (simplified check)
    expect(content).not.toMatch(/grove-[a-f0-9]{8}/i); // Other grove IDs
  });
});
```

**Traceability:** Spec sections "Flow 5: Compare to Network", "Architectural Decisions Q3"

---

## Epic 6: Celebration & Feedback

### US-B015: View Quality Improvement Celebration

**As an** operator
**I want to** be celebrated when my grove's quality improves
**So that** I feel motivated to maintain quality standards

**INVEST Assessment:**
- **I**ndependent: Yes - celebration banner standalone
- **N**egotiable: Yes - trigger conditions configurable
- **V**aluable: Yes - positive reinforcement
- **E**stimable: Yes - comparison logic straightforward
- **S**mall: Yes - conditional banner
- **T**estable: Yes - banner appears/dismisses correctly

**Acceptance Criteria:**

```gherkin
Scenario: Celebration banner appears on improvement
  Given my grove's average score increased by 6.3 points this month
  And this exceeds the celebration threshold (5 points)
  When I open the Quality Analytics dashboard
  Then a celebration banner slides in from the top
  And banner shows:
    | Field | Example |
    | Title | Your grove's quality improved! |
    | Change | Average score increased from 72.1 to 78.4 (+6.3 points) |
    | Percentile | You're now in the 73rd percentile |
  And banner has a Dismiss button
  And banner auto-dismisses after 10 seconds

Scenario: Celebration only shown once per improvement
  Given I have already seen the celebration banner for this improvement
  When I return to the dashboard
  Then the banner does not appear again
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-analytics/celebration-banner.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Improvement Celebration', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API to return improvement data
    await page.route('**/api/quality-analytics**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          avgScore: 78.4,
          previousAvgScore: 72.1,
          improvement: 6.3,
          percentile: 73,
          celebrationEligible: true,
        }),
      });
    });
  });

  test('celebration banner appears when improvement threshold met', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const banner = page.locator('[data-testid="celebration-banner"]');
    await expect(banner).toBeVisible();

    // Visual verification
    await expect(banner).toHaveScreenshot('celebration-banner.png');
  });

  test('banner shows improvement details', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const banner = page.locator('[data-testid="celebration-banner"]');
    await expect(banner).toContainText('quality improved');
    await expect(banner).toContainText('72.1');
    await expect(banner).toContainText('78.4');
    await expect(banner).toContainText('73rd percentile');
  });

  test('banner can be manually dismissed', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const banner = page.locator('[data-testid="celebration-banner"]');
    await expect(banner).toBeVisible();

    await page.click('[data-testid="dismiss-celebration"]');

    await expect(banner).not.toBeVisible();
  });

  test('banner auto-dismisses after 10 seconds', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    const banner = page.locator('[data-testid="celebration-banner"]');
    await expect(banner).toBeVisible();

    // Wait 11 seconds
    await page.waitForTimeout(11000);

    await expect(banner).not.toBeVisible();
  });

  test('banner not shown on repeat visit', async ({ page }) => {
    await page.goto('/bedrock/quality-analytics');

    // First visit - banner appears
    await expect(page.locator('[data-testid="celebration-banner"]')).toBeVisible();

    // Dismiss
    await page.click('[data-testid="dismiss-celebration"]');

    // Reload page
    await page.reload();

    // Banner should not appear again
    await expect(page.locator('[data-testid="celebration-banner"]')).not.toBeVisible();
  });
});
```

**Traceability:** Spec section "Screen 5: Celebration Banner (Quality Improvement)"

---

## Deferred to v1.1

### US-B016: Override Approval Workflow (DEFERRED)

**Reason:** Building trust requires giving operators agency first. Approval workflow creates friction.

**Original Flow:** Override → Approval queue → Reviewer approves/rejects → Score updates

**v1.1 Prerequisite:** Abuse detection metrics, multi-operator groves

---

### US-B017: PDF Report Export (DEFERRED)

**Reason:** CSV covers data export needs; PDF adds formatting complexity.

**Original Flow:** Generate formatted PDF with charts and tables

**v1.1 Prerequisite:** User demand signal, report template design

---

## Open Questions

1. **Celebration threshold configuration** — Should operators be able to configure their own celebration threshold, or is 5 points universal?

2. **Network refresh timing** — 15-min batch refresh is acceptable, but should there be a "Refresh Now" button for operators who want latest data?

3. **Override rate limiting** — Should there be a limit on how many overrides an operator can submit per day to prevent abuse?

---

## Summary

| Story ID | Title | Priority | Complexity | json-render Required |
|----------|-------|----------|------------|---------------------|
| US-B001 | View Analytics Dashboard Overview | P0 | M | Yes (QualityAnalyticsCatalog) |
| US-B002 | Select Analytics Time Range | P0 | S | No (interactive control) |
| US-B003 | View Dimension Profile Radar Chart | P0 | M | Yes (via catalog) |
| US-B004 | View Score Distribution Chart | P0 | S | Yes (via catalog) |
| US-B005 | View Quality Trend Over Time | P0 | M | Yes (via catalog) |
| US-B006 | Export Analytics to CSV | P1 | S | No (interactive) |
| US-B007 | View Score Attribution Panel | P0 | M | Yes (AttributionCatalog) |
| US-B008 | Access Attribution from Quality Badge | P0 | S | No (click handler) |
| US-B009 | Open Override Modal | P0 | S | No (interactive form) |
| US-B010 | Submit Quality Override | P0 | L | No (interactive form) |
| US-B011 | Upload Evidence for Override | P1 | M | No (file upload) |
| US-B012 | View Override History Timeline | P0 | M | Yes (OverrideHistoryCatalog) |
| US-B013 | Rollback Override | P1 | M | No (interactive action) |
| US-B014 | View Network Comparison | P1 | M | Yes (via analytics catalog) |
| US-B015 | View Quality Improvement Celebration | P2 | S | No (toast/banner) |

**Total v1.0 Stories:** 15
**Deferred:** 2

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Override reason codes, celebration thresholds, time ranges all configurable via database tables. No hardcoded values. |
| **Capability Agnosticism** | Analytics and attribution work with any scoring model output. Override workflow model-independent. |
| **Provenance as Infrastructure** | Full audit trail in `quality_overrides` table with operator identity, timestamp, reason, explanation. Rollback preserves history. |
| **Organic Scalability** | Materialized views with 15-min refresh prevent query storms. Federated learning enables network-wide learning without central authority. |

---

## Test File Structure

```
tests/e2e/
├── quality-analytics/
│   ├── dashboard-overview.spec.ts      # US-B001
│   ├── time-range-selection.spec.ts    # US-B002
│   ├── dimension-radar-chart.spec.ts   # US-B003
│   ├── score-distribution.spec.ts      # US-B004
│   ├── quality-trend.spec.ts           # US-B005
│   ├── export-csv.spec.ts              # US-B006
│   ├── network-comparison.spec.ts      # US-B014
│   └── celebration-banner.spec.ts      # US-B015
├── quality-attribution/
│   ├── attribution-panel.spec.ts       # US-B007
│   └── badge-click.spec.ts             # US-B008
├── quality-override/
│   ├── open-modal.spec.ts              # US-B009
│   ├── submit-override.spec.ts         # US-B010
│   ├── evidence-upload.spec.ts         # US-B011
│   ├── history-timeline.spec.ts        # US-B012
│   └── rollback.spec.ts                # US-B013
└── fixtures/
    ├── test-evidence.pdf
    └── test.exe                        # For rejection test
```

### Visual Snapshot Folder Structure

```
tests/e2e/__screenshots__/
├── quality-analytics/
│   ├── quality-analytics-dashboard-overview.png
│   ├── quality-analytics-loading.png
│   ├── quality-analytics-empty.png
│   ├── time-range-30d-selected.png
│   ├── dimension-radar-chart.png
│   ├── score-distribution-chart.png
│   ├── trend-chart-30d.png
│   ├── trend-chart-7d.png
│   └── celebration-banner.png
├── quality-attribution/
│   ├── attribution-panel-open.png
│   ├── attribution-dimension-card.png
│   ├── quality-badge-default.png
│   └── quality-badge-hover.png
├── quality-override/
│   ├── override-modal-open.png
│   ├── override-confirm-dialog.png
│   ├── override-history-timeline.png
│   ├── override-history-empty.png
│   └── rollback-confirm-dialog.png
```

---

**Prepared By:** User Story Refinery Agent
**Date:** 2026-01-18
**Sprint:** S10.2-SL-AICuration v3
**Next:** Technical Review → Sprint Execution
