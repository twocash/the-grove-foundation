# User Stories, Acceptance Criteria & E2E Tests v2.0

**Sprint:** S12-SL-SignalAggregation v1
**Codename:** The Awakening
**Phase:** Story Extraction + Acceptance Criteria + E2E Test Specs
**Status:** APPROVED FOR EXECUTION

---

## Critical Observations

### 1. No Clunky Flows Detected

The Product Brief defines clean, single-purpose flows. No multi-modal interactions, no confirmation cascades. The design follows "display computed data" pattern — straightforward.

### 2. Dependencies Are Met

- Migration 016 (sprout_usage_events) exists
- Migration 021 (document_signal_aggs) exists
- useSproutSignals hook works (just needs aggregation to consume events)
- useSproutAggregations hook works (just returns zeros)

### 3. Scope Is Correctly Bounded

Out of scope items (streaming, federation, ML models) are correctly deferred. This is pure infrastructure.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Trend indicators (▲/▼) | Include | Low effort, high value per PM Review |
| Real-time streaming | Defer | Batch is sufficient for current volume |
| Quality score ML | Defer | Rule-based formula sufficient |
| Cross-grove federation | Defer | Requires S9-Federation |

---

## Epic 1: Infrastructure (Aggregation Engine)

### US-S12-001: Event-to-Aggregation Pipeline

**As an** Explorer
**I want** my sprout interactions to be counted
**So that** I can see real usage metrics, not zeros

**INVEST Assessment:**
- **I**ndependent: Yes — can be built without UI changes
- **N**egotiable: Yes — SQL implementation details flexible
- **V**aluable: Yes — core enabler for all other stories
- **E**stimable: Yes — clear SQL function scope
- **S**mall: Yes — single migration + function
- **T**estable: Yes — query before/after aggregation

**Acceptance Criteria:**

```gherkin
Scenario: View event increments view count
  Given a sprout with document_id "doc-123" exists
  And the sprout has 0 views in aggregations
  When I emit a "sprout_viewed" event for "doc-123"
  And compute_aggregations() is called
  Then the aggregation for "doc-123" should show view_count = 1

Scenario: Multiple events aggregate correctly
  Given a sprout has received 5 view events
  And the sprout has received 3 retrieval events
  And the sprout has received 2 rating events with values [4, 5]
  When compute_aggregations() is called
  Then view_count should be 5
  And retrieval_count should be 3
  And average_rating should be 4.5

Scenario: Quality score is computed from weighted formula
  Given a sprout has view_count = 50
  And retrieval_count = 20
  And average_rating = 4.0
  And unique_user_count = 10
  When compute_aggregations() is called
  Then quality_score should be between 0.6 and 0.9
  And quality_score should reflect the weighted formula
```

**E2E Test Specification:**

```typescript
// tests/e2e/s12-signal-aggregation/lifecycle.spec.ts

import { test, expect } from '@playwright/test';
import { createTestSprout, emitTestEvent, callAggregation } from './fixtures/test-helpers';

test.describe('US-S12-001: Event-to-Aggregation Pipeline', () => {

  test('view event increments view count', async ({ page }) => {
    // Arrange
    const sprout = await createTestSprout();

    // Act
    await emitTestEvent({ type: 'sprout_viewed', sprout_id: sprout.id });
    await callAggregation();

    // Assert
    const result = await page.evaluate(async (docId) => {
      const { data } = await supabase
        .from('document_signal_aggregations')
        .select('view_count')
        .eq('document_id', docId)
        .single();
      return data;
    }, sprout.document_id);

    expect(result.view_count).toBe(1);
  });

  test('quality score computes from weighted formula', async ({ page }) => {
    // Arrange
    const sprout = await createTestSprout();
    await emitTestEvent({ type: 'sprout_viewed', sprout_id: sprout.id, count: 50 });
    await emitTestEvent({ type: 'sprout_retrieved', sprout_id: sprout.id, count: 20 });
    await emitTestEvent({ type: 'sprout_rated', sprout_id: sprout.id, rating: 4.0, count: 5 });

    // Act
    await callAggregation();

    // Assert
    const result = await page.evaluate(async (docId) => {
      const { data } = await supabase
        .from('document_signal_aggregations')
        .select('quality_score')
        .eq('document_id', docId)
        .single();
      return data;
    }, sprout.document_id);

    expect(result.quality_score).toBeGreaterThan(0.6);
    expect(result.quality_score).toBeLessThan(0.9);
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Event emission | `infrastructure/01-view-event-emission.png` | Console shows event fired |
| Table populated | `infrastructure/05-supabase-event-table-overview.png` | Events in database |
| Aggregation result | `infrastructure/10-aggregation-function-result.png` | Non-zero computed values |

**Traceability:** Product Brief "The Broken Pipeline" section

---

### US-S12-002: Sprout-to-Document Join

**As a** system
**I want** events (with sprout_id) to aggregate to documents (with document_id)
**So that** the FK chain is complete: event → sprout → document → aggregation

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — join strategy flexible
- **V**aluable: Yes — fixes the core bug
- **E**stimable: Yes — clear schema work
- **S**mall: Yes — FK verification + join
- **T**estable: Yes — query chain visible

**Acceptance Criteria:**

```gherkin
Scenario: Event joins to document via sprout
  Given a sprout "sprout-abc" with source_document_id "doc-xyz"
  And an event with sprout_id "sprout-abc"
  When compute_aggregations() is called
  Then the aggregation row should exist for document_id "doc-xyz"
  And the join query should show complete FK chain

Scenario: Orphan events do not break aggregation
  Given an event with invalid sprout_id "nonexistent"
  When compute_aggregations() is called
  Then the function should complete without error
  And the orphan event should be logged but not aggregated
```

**E2E Test Specification:**

```typescript
test('event joins to document via sprout FK chain', async ({ page }) => {
  // Arrange
  const sprout = await createTestSprout();

  // Act
  await emitTestEvent({ type: 'sprout_viewed', sprout_id: sprout.id });
  await callAggregation();

  // Assert - verify FK chain
  const chainResult = await page.evaluate(async (sproutId) => {
    const { data } = await supabase.rpc('verify_aggregation_chain', { sprout_id: sproutId });
    return data;
  }, sprout.id);

  expect(chainResult.event_exists).toBe(true);
  expect(chainResult.sprout_exists).toBe(true);
  expect(chainResult.document_exists).toBe(true);
  expect(chainResult.aggregation_exists).toBe(true);
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Join query | `infrastructure/12-aggregation-join-query.png` | Complete FK chain visible |

**Traceability:** Product Brief "Table mismatch" in Evidence of the Break

---

### US-S12-003: Aggregation Provenance Tracking

**As an** Operator
**I want** every aggregation to track when and how it was computed
**So that** I can audit data freshness and troubleshoot issues

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — DEX compliance (Provenance as Infrastructure)
- **E**stimable: Yes
- **S**mall: Yes — metadata columns
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Aggregation records computation timestamp
  When compute_aggregations() is called at "2026-01-18 10:30:00"
  Then the aggregation row should have computed_at = "2026-01-18 10:30:00"

Scenario: Aggregation records event range
  Given events exist from "2026-01-10" to "2026-01-18"
  When compute_aggregations() is called
  Then first_event_at should be "2026-01-10"
  And last_event_at should be "2026-01-18"

Scenario: Aggregation records computation method
  When compute_aggregations() is called via cron
  Then computation_method should be "batch_cron"
  When compute_aggregations() is called via manual refresh
  Then computation_method should be "manual_refresh"
```

**E2E Test Specification:**

```typescript
test('aggregation records full provenance', async ({ page }) => {
  // Arrange
  const sprout = await createTestSprout();
  await emitTestEvent({ type: 'sprout_viewed', sprout_id: sprout.id });

  // Act
  const beforeCall = new Date();
  await callAggregation({ method: 'manual_refresh' });

  // Assert
  const result = await page.evaluate(async (docId) => {
    const { data } = await supabase
      .from('document_signal_aggregations')
      .select('computed_at, first_event_at, last_event_at, computation_method')
      .eq('document_id', docId)
      .single();
    return data;
  }, sprout.document_id);

  expect(new Date(result.computed_at).getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
  expect(result.first_event_at).toBeDefined();
  expect(result.last_event_at).toBeDefined();
  expect(result.computation_method).toBe('manual_refresh');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Audit trail | `dex/03-aggregation-audit-trail.png` | All provenance fields visible |

**Traceability:** DEX Pillar "Provenance as Infrastructure"

---

## Epic 2: Explorer Experience (Vital Signs)

### US-S12-004: View Vital Signs Panel

**As an** Explorer
**I want to** see my sprout's vital signs (views, uses, quality) in the FinishingRoom
**So that** I know if my knowledge is being used

**INVEST Assessment:**
- **I**ndependent: Yes — UI reads from existing hook
- **N**egotiable: Yes — layout details flexible
- **V**aluable: Yes — core explorer value prop
- **E**stimable: Yes — wireframe defined
- **S**mall: Yes — single panel
- **T**estable: Yes — values visible

**Acceptance Criteria:**

```gherkin
Scenario: Vital signs display real values
  Given my sprout has 47 views, 12 retrievals, and quality score 0.78
  When I open the FinishingRoom for my sprout
  Then I should see "47" in the Views metric card
  And I should see "12" in the Uses metric card
  And I should see "0.78" in the Quality Score gauge
  And the gauge should be colored green (score > 0.6)

Scenario: Vital signs show trend indicators
  Given my sprout's view count increased by 12 in the last 7 days
  When I view the vital signs panel
  Then the Views metric should show "▲12" trend indicator
  And the trend should be colored green

Scenario: Vital signs display freshness timestamp
  Given aggregation was computed 2 minutes ago
  When I view the vital signs panel
  Then I should see "Last computed: 2 minutes ago"
```

**E2E Test Specification:**

```typescript
// tests/e2e/s12-signal-aggregation/lifecycle.spec.ts

test.describe('US-S12-004: Vital Signs Panel', () => {

  test('displays real computed values', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      view_count: 47,
      retrieval_count: 12,
      quality_score: 0.78
    });

    // Navigate
    await page.goto('/explore');
    await page.click(`[data-testid="sprout-${sprout.id}"]`);
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert
    await expect(page.locator('[data-testid="metric-views"]')).toContainText('47');
    await expect(page.locator('[data-testid="metric-uses"]')).toContainText('12');
    await expect(page.locator('[data-testid="quality-gauge"]')).toContainText('0.78');

    // Visual Verification
    await expect(page).toHaveScreenshot('finishing-room/07-after-vital-signs-real.png');
  });

  test('shows trend indicators', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      view_count: 47,
      view_count_7d: 12,
      view_count_30d: 35
    });

    // Navigate
    await page.goto('/explore');
    await page.click(`[data-testid="sprout-${sprout.id}"]`);
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert trend
    const trendElement = page.locator('[data-testid="metric-views-trend"]');
    await expect(trendElement).toContainText('▲');
    await expect(trendElement).toHaveClass(/trend-up/);

    // Visual Verification
    await expect(page.locator('[data-testid="vital-signs-panel"]')).toHaveScreenshot(
      'finishing-room/08-after-view-count.png'
    );
  });

  test('displays freshness timestamp', async ({ page }) => {
    // Navigate to sprout with recent aggregation
    await page.goto('/explore');
    await page.click('[data-testid="sprout-with-data"]');
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert timestamp
    await expect(page.locator('[data-testid="last-computed"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-computed"]')).toContainText(/ago/);
  });

  test('before state shows zeros', async ({ page }) => {
    // Arrange - sprout with no events
    const sprout = await createTestSprout({ noEvents: true });

    // Navigate
    await page.goto('/explore');
    await page.click(`[data-testid="sprout-${sprout.id}"]`);
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert zeros
    await expect(page.locator('[data-testid="metric-views"]')).toContainText('0');
    await expect(page.locator('[data-testid="metric-uses"]')).toContainText('0');

    // Visual Verification - BEFORE state
    await expect(page).toHaveScreenshot('finishing-room/03-before-vital-signs-zero.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Before (zeros) | `finishing-room/03-before-vital-signs-zero.png` | All zeros displayed |
| After (real) | `finishing-room/07-after-vital-signs-real.png` | Computed values |
| View count detail | `finishing-room/08-after-view-count.png` | Zoomed metric |
| Quality score | `finishing-room/09-after-quality-score.png` | Gauge visualization |

**Traceability:** Product Brief "Flow 1: Explorer Sees Real Vital Signs"

---

### US-S12-005: View Advancement Eligibility

**As an** Explorer
**I want to** see if my sprout is eligible for advancement
**So that** I know what criteria I need to meet

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — advancement motivation
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Advancement panel shows eligible status
  Given my sprout has quality_score >= 0.6
  And view_count >= 10
  And unique_user_count >= 5
  When I view the advancement panel
  Then I should see "Advancement Eligible" badge
  And all criteria checkmarks should be checked

Scenario: Advancement panel shows progress to eligibility
  Given my sprout has quality_score = 0.5 (below 0.6 threshold)
  And view_count = 8 (below 10 threshold)
  When I view the advancement panel
  Then I should see progress bar at approximately 70%
  And quality_score criterion should show "○" (not met)
  And view_count criterion should show "○" (not met)

Scenario: Advancement panel shows next tier name
  Given my sprout is currently at Tier 1 (Seed)
  When I view the advancement panel
  Then next tier should show "Tier 2: Seedling"
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-005: Advancement Eligibility', () => {

  test('shows eligible status when all criteria met', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      quality_score: 0.78,
      view_count: 47,
      unique_user_count: 23,
      tier: 1
    });

    // Navigate
    await page.goto('/explore');
    await page.click(`[data-testid="sprout-${sprout.id}"]`);
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert
    await expect(page.locator('[data-testid="advancement-badge"]')).toContainText('Eligible');
    await expect(page.locator('[data-testid="criterion-quality"]')).toHaveAttribute('data-met', 'true');
    await expect(page.locator('[data-testid="criterion-views"]')).toHaveAttribute('data-met', 'true');
    await expect(page.locator('[data-testid="criterion-diversity"]')).toHaveAttribute('data-met', 'true');

    // Visual Verification
    await expect(page).toHaveScreenshot('finishing-room/10-after-advancement-eligible.png');
  });

  test('shows progress when criteria not met', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      quality_score: 0.45,
      view_count: 5,
      unique_user_count: 2,
      tier: 1
    });

    // Navigate
    await page.goto('/explore');
    await page.click(`[data-testid="sprout-${sprout.id}"]`);
    await page.click('[data-testid="finishing-room-tab"]');

    // Assert progress
    const progressBar = page.locator('[data-testid="advancement-progress"]');
    await expect(progressBar).toBeVisible();

    // Assert criteria not met
    await expect(page.locator('[data-testid="criterion-quality"]')).toHaveAttribute('data-met', 'false');
    await expect(page.locator('[data-testid="criterion-views"]')).toHaveAttribute('data-met', 'false');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Before (unknown) | `finishing-room/04-before-advancement-unknown.png` | No eligibility computed |
| Eligible | `finishing-room/10-after-advancement-eligible.png` | All criteria met |

**Traceability:** Wireframe Package "AdvancementIndicator" component

---

### US-S12-006: Refresh Vital Signs

**As an** Explorer
**I want to** manually refresh my sprout's metrics
**So that** I can see the latest data without waiting for cron

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — user control
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Refresh button triggers aggregation
  Given I am viewing the vital signs panel
  When I click the refresh button
  Then I should see a loading spinner
  And after completion, the timestamp should update
  And metrics should reflect the latest events

Scenario: Refresh has cooldown period
  Given I just clicked refresh
  When I try to click refresh again within 30 seconds
  Then the button should be disabled
  And I should see "Wait X seconds" tooltip

Scenario: Refresh announces to screen readers
  Given I am using a screen reader
  When I click the refresh button
  Then I should hear "Refreshing metrics..."
  And after completion, I should hear "Metrics updated"
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-006: Refresh Vital Signs', () => {

  test('refresh button triggers aggregation', async ({ page }) => {
    // Navigate
    await page.goto('/explore');
    await page.click('[data-testid="sprout-with-data"]');
    await page.click('[data-testid="finishing-room-tab"]');

    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="last-computed"]').textContent();

    // Act
    await page.click('[data-testid="refresh-button"]');

    // Assert loading state
    await expect(page.locator('[data-testid="refresh-button"]')).toHaveAttribute('aria-busy', 'true');

    // Wait for completion
    await expect(page.locator('[data-testid="refresh-button"]')).toHaveAttribute('aria-busy', 'false', {
      timeout: 10000
    });

    // Assert timestamp updated
    const newTimestamp = await page.locator('[data-testid="last-computed"]').textContent();
    expect(newTimestamp).not.toBe(initialTimestamp);

    // Visual Verification
    await expect(page).toHaveScreenshot('finishing-room/12-timestamp-updated.png');
  });

  test('refresh has cooldown period', async ({ page }) => {
    // Navigate and refresh once
    await page.goto('/explore');
    await page.click('[data-testid="sprout-with-data"]');
    await page.click('[data-testid="finishing-room-tab"]');
    await page.click('[data-testid="refresh-button"]');

    // Wait for first refresh to complete
    await page.waitForSelector('[data-testid="refresh-button"]:not([aria-busy="true"])');

    // Assert button is disabled
    await expect(page.locator('[data-testid="refresh-button"]')).toBeDisabled();
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Clicking refresh | `finishing-room/11-refresh-button-click.png` | Button state change |
| After refresh | `finishing-room/12-timestamp-updated.png` | Updated timestamp |

**Traceability:** Wireframe Package "SignalHeader.refreshButton"

---

## Epic 3: Cultivator Experience (Signal Badges)

### US-S12-007: View Signal Badges on Nursery Cards

**As a** Cultivator
**I want to** see signal indicators on each sprout card in the Nursery
**So that** I can quickly assess which sprouts need attention

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — quick scanning
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Nursery card displays signal badges
  Given a sprout with 47 views, 12 retrievals, 4.2 rating
  When I view the Nursery queue
  Then the sprout card should show view badge "👁 47"
  And the card should show retrieval badge "📥 12"
  And the card should show rating badge "⭐ 4.2"
  And the card should show quality gauge at 0.78

Scenario: Signal badges have tooltips
  Given I am viewing a Nursery card with signal badges
  When I hover over the view badge
  Then I should see tooltip "47 views"

Scenario: Quality gauge shows color coding
  Given a sprout with quality_score = 0.78
  When I view the quality gauge on the card
  Then the gauge should be green (score >= 0.6)
```

**E2E Test Specification:**

```typescript
// tests/e2e/s12-signal-aggregation/features.spec.ts

test.describe('US-S12-007: Signal Badges on Nursery Cards', () => {

  test('nursery card displays all signal badges', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      view_count: 47,
      retrieval_count: 12,
      average_rating: 4.2,
      quality_score: 0.78
    });

    // Navigate
    await page.goto('/bedrock/nursery');

    // Assert badges
    const card = page.locator(`[data-testid="nursery-card-${sprout.id}"]`);
    await expect(card.locator('[data-testid="badge-views"]')).toContainText('47');
    await expect(card.locator('[data-testid="badge-retrievals"]')).toContainText('12');
    await expect(card.locator('[data-testid="badge-rating"]')).toContainText('4.2');
    await expect(card.locator('[data-testid="quality-gauge"]')).toBeVisible();

    // Visual Verification
    await expect(card).toHaveScreenshot('nursery/03-card-view-count-badge.png');
  });

  test('badges show tooltips on hover', async ({ page }) => {
    await page.goto('/bedrock/nursery');

    // Hover over view badge
    await page.hover('[data-testid="badge-views"]');

    // Assert tooltip
    await expect(page.locator('[role="tooltip"]')).toContainText('views');

    // Visual Verification
    await expect(page).toHaveScreenshot('nursery/06-card-hover-tooltip.png');
  });

  test('quality gauge shows correct color', async ({ page }) => {
    await page.goto('/bedrock/nursery');

    // Assert gauge color for high score
    const greenGauge = page.locator('[data-testid="quality-gauge"][data-score-level="high"]');
    await expect(greenGauge).toBeVisible();

    // Visual Verification
    await expect(page.locator('[data-testid="nursery-card"]:first-child')).toHaveScreenshot(
      'nursery/05-card-quality-bar.png'
    );
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| View badge | `nursery/03-card-view-count-badge.png` | Eye icon with count |
| Utility badge | `nursery/04-card-utility-score-badge.png` | Star with rating |
| Quality bar | `nursery/05-card-quality-bar.png` | Progress bar fill |
| Hover tooltip | `nursery/06-card-hover-tooltip.png` | Full metrics tooltip |

**Traceability:** Product Brief "Flow 2: Cultivator Curates with Evidence"

---

### US-S12-008: View Decision Panel with Evidence

**As a** Cultivator
**I want to** see detailed aggregated metrics when reviewing a sprout
**So that** I can make data-driven promotion decisions

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — decision support
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Decision panel shows full signal breakdown
  Given I select a sprout in the Nursery
  When the decision panel opens
  Then I should see all aggregated metrics:
    | Metric | Value |
    | Views | 47 |
    | Retrievals | 12 |
    | Average Rating | 4.2 |
    | Quality Score | 0.78 |
    | Diversity Index | 0.65 |
    | Unique Users | 23 |

Scenario: Decision panel shows metric contributions
  When I view the signal breakdown section
  Then I should see how each metric contributes to quality score
  And the breakdown should show weighted values
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-008: Decision Panel with Evidence', () => {

  test('decision panel shows full signal breakdown', async ({ page }) => {
    // Arrange
    const sprout = await createTestSproutWithSignals({
      view_count: 47,
      retrieval_count: 12,
      average_rating: 4.2,
      quality_score: 0.78,
      diversity_index: 0.65,
      unique_user_count: 23
    });

    // Navigate and select sprout
    await page.goto('/bedrock/nursery');
    await page.click(`[data-testid="nursery-card-${sprout.id}"]`);

    // Assert decision panel
    const panel = page.locator('[data-testid="decision-panel"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-testid="metric-views"]')).toContainText('47');
    await expect(panel.locator('[data-testid="metric-retrievals"]')).toContainText('12');
    await expect(panel.locator('[data-testid="metric-rating"]')).toContainText('4.2');
    await expect(panel.locator('[data-testid="metric-quality"]')).toContainText('0.78');
    await expect(panel.locator('[data-testid="metric-diversity"]')).toContainText('0.65');
    await expect(panel.locator('[data-testid="metric-users"]')).toContainText('23');

    // Visual Verification
    await expect(panel).toHaveScreenshot('nursery/07-decision-panel-full.png');
  });

  test('breakdown shows metric contributions', async ({ page }) => {
    await page.goto('/bedrock/nursery');
    await page.click('[data-testid="nursery-card"]:first-child');

    // Assert breakdown section
    const breakdown = page.locator('[data-testid="signal-breakdown"]');
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText('Quality Score Breakdown');

    // Visual Verification
    await expect(breakdown).toHaveScreenshot('nursery/08-decision-panel-breakdown.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Full panel | `nursery/07-decision-panel-full.png` | All metrics visible |
| Breakdown | `nursery/08-decision-panel-breakdown.png` | Contribution weights |

**Traceability:** Wireframe Package "Decision Panel" section

---

### US-S12-009: Sort Queue by Quality Score

**As a** Cultivator
**I want to** sort the Nursery queue by quality score
**So that** I can prioritize high-quality sprouts for promotion

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — efficiency
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Queue can be sorted by quality score descending
  Given the Nursery has sprouts with quality scores [0.45, 0.78, 0.32, 0.91]
  When I sort by "Quality Score (High to Low)"
  Then the first card should show quality_score = 0.91
  And cards should be ordered [0.91, 0.78, 0.45, 0.32]

Scenario: Queue can be sorted by quality score ascending
  When I sort by "Quality Score (Low to High)"
  Then the first card should show quality_score = 0.32
  And cards should be ordered [0.32, 0.45, 0.78, 0.91]
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-009: Sort Queue by Quality', () => {

  test('sorts by quality score descending', async ({ page }) => {
    // Arrange - sprouts with known quality scores
    await seedSproutsWithQualityScores([0.45, 0.78, 0.32, 0.91]);

    // Navigate
    await page.goto('/bedrock/nursery');

    // Act - sort by quality high to low
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('[data-testid="sort-quality-desc"]');

    // Assert order
    const qualityValues = await page.locator('[data-testid="quality-gauge"]')
      .evaluateAll(els => els.map(el => parseFloat(el.dataset.score)));

    expect(qualityValues[0]).toBe(0.91);
    expect(qualityValues).toEqual([0.91, 0.78, 0.45, 0.32]);

    // Visual Verification
    await expect(page).toHaveScreenshot('nursery/10-queue-reordered-by-quality.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Sorted queue | `nursery/10-queue-reordered-by-quality.png` | High scores at top |

**Traceability:** Product Brief "Evidence-based curation"

---

## Epic 4: Operator Experience (Analytics Dashboard)

### US-S12-010: View Signal Aggregation Overview

**As an** Operator
**I want to** see summary metrics for all signal aggregations
**So that** I can monitor the health of the knowledge corpus

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — system health
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Analytics dashboard shows summary metrics
  When I navigate to /bedrock/experience Analytics tab
  Then I should see "Total Events" count
  And I should see "Documents with Data" count
  And I should see "Average Quality" score
  And I should see "Coverage" percentage

Scenario: Event breakdown shows type distribution
  Given 847 view events, 312 retrieval events, 88 rating events
  When I view the event breakdown
  Then I should see "Viewed: 847 (68%)"
  And I should see "Retrieved: 312 (25%)"
  And I should see "Rated: 88 (7%)"
```

**E2E Test Specification:**

```typescript
// tests/e2e/s12-signal-aggregation/analytics.spec.ts

test.describe('US-S12-010: Signal Analytics Overview', () => {

  test('displays summary metric cards', async ({ page }) => {
    // Navigate
    await page.goto('/bedrock/experience');
    await page.click('[data-testid="analytics-tab"]');

    // Assert metric cards
    await expect(page.locator('[data-testid="metric-total-events"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-docs-with-data"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-avg-quality"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-coverage"]')).toBeVisible();

    // Visual Verification
    await expect(page).toHaveScreenshot('analytics/02-signal-overview-cards.png');
  });

  test('shows event type breakdown', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.click('[data-testid="analytics-tab"]');

    // Assert breakdown
    const breakdown = page.locator('[data-testid="event-breakdown"]');
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText('Viewed');
    await expect(breakdown).toContainText('Retrieved');
    await expect(breakdown).toContainText('Rated');

    // Visual Verification
    await expect(breakdown).toHaveScreenshot('analytics/03-event-count-detail.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Analytics tab | `analytics/01-experience-console-analytics-tab.png` | Tab visible |
| Overview cards | `analytics/02-signal-overview-cards.png` | Summary metrics |
| Event breakdown | `analytics/03-event-count-detail.png` | Type distribution |
| Coverage | `analytics/04-document-coverage.png` | Percentage indicator |

**Traceability:** Product Brief "Flow 3: Operator Reviews Knowledge Health"

---

### US-S12-011: View Quality Distribution Histogram

**As an** Operator
**I want to** see the distribution of quality scores across all sprouts
**So that** I can identify systemic quality issues

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — pattern detection
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Histogram displays quality distribution
  Given sprouts have quality scores distributed across 0.0-1.0
  When I view the quality distribution histogram
  Then I should see 5 buckets (0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
  And each bucket should show document count
  And the median should be displayed

Scenario: Leaderboards show top and bottom performers
  When I view the analytics dashboard
  Then I should see "Top Performers" list with highest quality scores
  And I should see "Needs Attention" list with lowest quality scores
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-011: Quality Distribution', () => {

  test('displays histogram with 5 buckets', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.click('[data-testid="analytics-tab"]');

    // Assert histogram
    const histogram = page.locator('[data-testid="quality-histogram"]');
    await expect(histogram).toBeVisible();

    const buckets = await histogram.locator('[data-testid="histogram-bucket"]').count();
    expect(buckets).toBe(5);

    // Visual Verification
    await expect(histogram).toHaveScreenshot('analytics/05-quality-distribution-histogram.png');
  });

  test('shows top performers leaderboard', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.click('[data-testid="analytics-tab"]');

    // Assert leaderboards
    const topList = page.locator('[data-testid="top-performers"]');
    await expect(topList).toBeVisible();

    const bottomList = page.locator('[data-testid="needs-attention"]');
    await expect(bottomList).toBeVisible();

    // Visual Verification
    await expect(topList).toHaveScreenshot('analytics/06-top-sprouts-by-quality.png');
    await expect(bottomList).toHaveScreenshot('analytics/07-bottom-sprouts-by-quality.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Histogram | `analytics/05-quality-distribution-histogram.png` | Bell curve shape |
| Top performers | `analytics/06-top-sprouts-by-quality.png` | High scores list |
| Needs attention | `analytics/07-bottom-sprouts-by-quality.png` | Low scores list |

**Traceability:** Wireframe Package "Quality Distribution" section

---

### US-S12-012: Trigger Manual Aggregation Refresh

**As an** Operator
**I want to** manually trigger aggregation computation
**So that** I can ensure metrics are fresh before making decisions

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — operator control
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Refresh button triggers full aggregation
  Given I am on the Analytics dashboard
  When I click "Refresh Aggregations"
  Then I should see "Computing..." loading state
  And after completion, all metrics should update
  And timestamp should show current time

Scenario: Refresh shows processing feedback
  When aggregation is processing
  Then the refresh button should show spinner
  And the button should be disabled
  And aria-busy should be true
```

**E2E Test Specification:**

```typescript
test.describe('US-S12-012: Analytics Refresh', () => {

  test('refresh triggers full aggregation', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.click('[data-testid="analytics-tab"]');

    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="analytics-timestamp"]').textContent();

    // Act
    await page.click('[data-testid="refresh-aggregations"]');

    // Assert loading
    await expect(page.locator('[data-testid="refresh-aggregations"]')).toHaveAttribute('aria-busy', 'true');

    // Visual Verification - loading state
    await expect(page).toHaveScreenshot('analytics/09-refresh-in-progress.png');

    // Wait and assert completion
    await expect(page.locator('[data-testid="refresh-aggregations"]')).toHaveAttribute('aria-busy', 'false', {
      timeout: 30000
    });

    const newTimestamp = await page.locator('[data-testid="analytics-timestamp"]').textContent();
    expect(newTimestamp).not.toBe(initialTimestamp);

    // Visual Verification - complete
    await expect(page).toHaveScreenshot('analytics/10-refresh-complete-timestamp.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Idle | `analytics/08-refresh-button-idle.png` | Button ready |
| Processing | `analytics/09-refresh-in-progress.png` | Spinner visible |
| Complete | `analytics/10-refresh-complete-timestamp.png` | Updated timestamp |

**Traceability:** Product Brief "Can trigger manual refresh"

---

## Epic 5: DEX Compliance

### US-S12-013: Configure Thresholds Without Code

**As an** Operator
**I want to** change quality thresholds via SQL parameters
**So that** I can tune the system without deploying code

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — DEX compliance
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Quality threshold is configurable
  Given the default advancement threshold is 0.6
  When I call compute_aggregations(quality_threshold := 0.8)
  Then sprouts with quality_score < 0.8 should show as "not eligible"
  And no code deployment should be required

Scenario: Threshold change produces different results
  Given a sprout with quality_score = 0.7
  When threshold is 0.6, the sprout should be eligible
  When threshold is 0.8, the sprout should NOT be eligible
```

**E2E Test Specification:**

```typescript
// Tests in lifecycle.spec.ts cover DEX compliance
test.describe('US-S12-013: DEX - Declarative Configuration', () => {

  test('threshold parameter changes eligibility', async ({ page }) => {
    // Arrange - sprout with quality 0.7
    const sprout = await createTestSproutWithSignals({ quality_score: 0.7 });

    // With threshold 0.6 - should be eligible
    await callAggregation({ quality_threshold: 0.6 });
    let result = await getAggregation(sprout.document_id);
    expect(result.advancement_eligible).toBe(true);

    // With threshold 0.8 - should NOT be eligible
    await callAggregation({ quality_threshold: 0.8 });
    result = await getAggregation(sprout.document_id);
    expect(result.advancement_eligible).toBe(false);
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Config param | `dex/01-config-threshold-parameter.png` | SQL function params |
| Different result | `dex/02-threshold-change-no-deploy.png` | Same sprout, different eligibility |

**Traceability:** DEX Pillar "Declarative Sovereignty"

---

## E2E Test Summary

### Test File Structure

```
tests/e2e/s12-signal-aggregation/
├── lifecycle.spec.ts          # US-S12-001 to US-S12-003, US-S12-013
├── features.spec.ts           # US-S12-004 to US-S12-009
├── analytics.spec.ts          # US-S12-010 to US-S12-012
└── fixtures/
    ├── test-helpers.ts        # createTestSprout, emitTestEvent, callAggregation
    └── test-data.ts           # Seeding functions
```

### Screenshot Baselines Required

| Screenshot | Story | State |
|------------|-------|-------|
| `infrastructure/01-view-event-emission.png` | US-S12-001 | Event fired |
| `infrastructure/05-supabase-event-table-overview.png` | US-S12-001 | Table populated |
| `infrastructure/10-aggregation-function-result.png` | US-S12-001 | Computed values |
| `infrastructure/12-aggregation-join-query.png` | US-S12-002 | FK chain |
| `dex/03-aggregation-audit-trail.png` | US-S12-003 | Provenance |
| `finishing-room/03-before-vital-signs-zero.png` | US-S12-004 | Before state |
| `finishing-room/07-after-vital-signs-real.png` | US-S12-004 | After state |
| `finishing-room/08-after-view-count.png` | US-S12-004 | Metric detail |
| `finishing-room/09-after-quality-score.png` | US-S12-004 | Gauge |
| `finishing-room/10-after-advancement-eligible.png` | US-S12-005 | Eligible |
| `finishing-room/11-refresh-button-click.png` | US-S12-006 | Button click |
| `finishing-room/12-timestamp-updated.png` | US-S12-006 | Updated |
| `nursery/03-card-view-count-badge.png` | US-S12-007 | Badge |
| `nursery/05-card-quality-bar.png` | US-S12-007 | Gauge |
| `nursery/06-card-hover-tooltip.png` | US-S12-007 | Tooltip |
| `nursery/07-decision-panel-full.png` | US-S12-008 | Panel |
| `nursery/08-decision-panel-breakdown.png` | US-S12-008 | Breakdown |
| `nursery/10-queue-reordered-by-quality.png` | US-S12-009 | Sorted |
| `analytics/02-signal-overview-cards.png` | US-S12-010 | Cards |
| `analytics/03-event-count-detail.png` | US-S12-010 | Breakdown |
| `analytics/05-quality-distribution-histogram.png` | US-S12-011 | Histogram |
| `analytics/06-top-sprouts-by-quality.png` | US-S12-011 | Top list |
| `analytics/07-bottom-sprouts-by-quality.png` | US-S12-011 | Bottom list |
| `analytics/08-refresh-button-idle.png` | US-S12-012 | Idle |
| `analytics/09-refresh-in-progress.png` | US-S12-012 | Loading |
| `analytics/10-refresh-complete-timestamp.png` | US-S12-012 | Complete |
| `dex/01-config-threshold-parameter.png` | US-S12-013 | Params |
| `dex/02-threshold-change-no-deploy.png` | US-S12-013 | Different result |

### Test Data Requirements

| Test | Required Data | Setup Method |
|------|---------------|--------------|
| US-S12-001 | Fresh sprout with no events | createTestSprout() |
| US-S12-004 | Sprout with known aggregation values | createTestSproutWithSignals() |
| US-S12-007 | Multiple sprouts with varied signals | seedSproutsWithQualityScores() |
| US-S12-009 | Sprouts with quality scores [0.32, 0.45, 0.78, 0.91] | seedSproutsWithQualityScores() |
| US-S12-011 | 50+ sprouts with distributed quality scores | seedDistributedSprouts() |

---

## Deferred to v1.1

### US-S12-D01: Real-time Event Streaming (DEFERRED)

**Reason:** Batch aggregation sufficient for current volume

**Original Flow:** Events stream directly to aggregation via WebSocket

**v1.1 Prerequisite:** Volume exceeds 10,000 events/day

### US-S12-D02: Quality Score ML Model (DEFERRED)

**Reason:** Rule-based formula sufficient for v1

**Original Flow:** ML model predicts quality from content analysis

**v1.1 Prerequisite:** Training data from v1 usage

---

## Open Questions

None. All questions resolved in PM Review document.

---

## Summary

| Story ID | Title | Priority | Complexity | E2E Tests |
|----------|-------|----------|------------|-----------|
| US-S12-001 | Event-to-Aggregation Pipeline | P0 | M | 2 |
| US-S12-002 | Sprout-to-Document Join | P0 | S | 1 |
| US-S12-003 | Aggregation Provenance | P0 | S | 1 |
| US-S12-004 | View Vital Signs Panel | P0 | M | 4 |
| US-S12-005 | View Advancement Eligibility | P0 | S | 2 |
| US-S12-006 | Refresh Vital Signs | P1 | S | 2 |
| US-S12-007 | Signal Badges on Nursery | P0 | M | 3 |
| US-S12-008 | Decision Panel with Evidence | P0 | M | 2 |
| US-S12-009 | Sort Queue by Quality | P1 | S | 1 |
| US-S12-010 | Analytics Overview | P0 | M | 2 |
| US-S12-011 | Quality Distribution | P1 | M | 2 |
| US-S12-012 | Analytics Refresh | P1 | S | 1 |
| US-S12-013 | Configurable Thresholds | P0 | S | 1 |

**Total v1.0 Stories:** 13
**Total E2E Tests:** 24
**Visual Verification Points:** 28 (subset of 56 total screenshots)
**Deferred:** 2

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-S12-013 tests configurable thresholds; all SQL params documented |
| **Capability Agnosticism** | All stories use pure PostgreSQL; no AI/LLM dependency |
| **Provenance as Infrastructure** | US-S12-003 verifies computed_at, event range, method tracking |
| **Organic Scalability** | Batch design scales to millions; indexed by document_id |

---

## Acceptance Criteria Summary

Sprint complete when:
- [ ] All 13 user stories implemented
- [ ] All 24 E2E tests passing
- [ ] All 56 screenshots captured per VISUAL_EVIDENCE_SPEC
- [ ] REVIEW.html follows defined structure
- [ ] Console verification shows zero critical errors
- [ ] DEX compliance table shows all PASS

---

*User Stories v2.0 — Generated by User Story Refinery Skill*
