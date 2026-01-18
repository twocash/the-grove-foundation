# User Stories & Acceptance Criteria: S10.1-SL-AICuration v2

**Sprint:** S10.1 - Display + Filtering Integration
**Version:** 1.0
**Phase:** Story Extraction + Acceptance Criteria + Test Specification
**Status:** Ready for Development

---

## Critical Observations

### 1. Lazy Evaluation Complexity
The spec calls for on-demand scoring when content is viewed. This requires careful state management for pending/scored/error states.

**Recommendation:** Implement clear loading skeleton states and graceful degradation.

### 2. Filter URL State
Quality filters should persist in URL for shareability. Existing ExploreShell filter architecture must be extended.

**Recommendation:** Reuse existing filter URL pattern (`?quality=80&accuracy=60`).

### 3. json-render Mandatory
UX Chief approval mandates json-render pattern for breakdown panel. This is a technical requirement, not optional.

**Recommendation:** Create `quality-breakdown-catalog.ts` before implementing UI.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Radar chart | Keep | Essential for dimension visualization |
| Distribution hints | Defer to v1.1 | Adds complexity, limited value in v1 |
| Celebration toast | Keep | PM recommended for engagement |
| Federated learning UI | Simplify | Toggle + status only, no detailed metrics |

---

## Epic 1: Quality Badge Display

### US-A001: View Quality Score on Sprout Card

**As a** Grove explorer
**I want to** see a quality score badge on each sprout card
**So that** I can quickly assess content quality before diving deeper

**INVEST Assessment:**
- **I**ndependent: Yes - badge renders from existing quality_scores data
- **N**egotiable: Yes - badge styling/position flexible
- **V**aluable: Yes - core visibility feature
- **E**stimable: Yes - component exists, integration needed
- **S**mall: Yes - single card modification
- **T**estable: Yes - badge visible/correct score

**Acceptance Criteria:**

```gherkin
Scenario: Quality badge displays on scored sprout
  Given I am viewing the Explore page
  And there is a sprout with quality_score 78
  When the sprout card renders
  Then I should see a quality badge with "78" displayed
  And the badge should show grade "A-"
  And the badge should have green color styling

Scenario: Quality badge color reflects score range
  Given I have sprouts with various quality scores
  When I view the sprout cards
  Then each card should display the correct badge color:
    | Score Range | Expected Color |
    | 80-100      | green          |
    | 60-79       | yellow         |
    | 40-59       | orange         |
    | 0-39        | red            |

Scenario: Pending badge shows for unscored content
  Given I am viewing a sprout that has not been scored yet
  When the sprout card renders
  Then I should see a "Pending" badge with gray styling
  And the badge should show an animated indicator

Scenario: No badge displays when scoring fails
  Given a sprout where quality scoring encountered an error
  When the sprout card renders
  Then no quality badge should be displayed
  And the sprout card should still be fully functional
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-badge-display.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quality Badge Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to explore page with test data
    await page.goto('/explore');
    await page.waitForSelector('[data-testid="sprout-grid"]');
  });

  test('displays quality badge with correct score and grade', async ({ page }) => {
    // Find a sprout card with known quality score
    const sproutCard = page.locator('[data-testid="sprout-card"]').first();
    const qualityBadge = sproutCard.locator('[data-testid="quality-badge"]');

    await expect(qualityBadge).toBeVisible();

    // Visual verification - screenshot comparison
    await expect(sproutCard).toHaveScreenshot('sprout-card-with-quality-badge.png');
  });

  test('badge color matches score range', async ({ page }) => {
    // High quality badge (80+) should be green
    const highQualityBadge = page.locator('[data-testid="quality-badge"][data-score="92"]');
    await expect(highQualityBadge).toHaveClass(/bg-green|green/);

    // Medium quality badge (60-79) should be yellow
    const mediumQualityBadge = page.locator('[data-testid="quality-badge"][data-score="67"]');
    await expect(mediumQualityBadge).toHaveClass(/bg-yellow|yellow/);

    // Visual verification of all badge states
    await expect(page.locator('[data-testid="sprout-grid"]')).toHaveScreenshot('badge-color-variations.png');
  });

  test('pending badge displays for unscored sprout', async ({ page }) => {
    const pendingSprout = page.locator('[data-testid="sprout-card"][data-quality-status="pending"]');
    const pendingBadge = pendingSprout.locator('[data-testid="quality-pending-badge"]');

    await expect(pendingBadge).toBeVisible();
    await expect(pendingBadge).toContainText('Pending');

    // Visual verification of pending state
    await expect(pendingSprout).toHaveScreenshot('sprout-card-pending-badge.png');
  });

  test('no badge when scoring fails - graceful degradation', async ({ page }) => {
    const errorSprout = page.locator('[data-testid="sprout-card"][data-quality-status="error"]');
    const qualityBadge = errorSprout.locator('[data-testid="quality-badge"]');

    await expect(qualityBadge).not.toBeVisible();
    // Card should still render normally
    await expect(errorSprout).toBeVisible();

    // Visual verification - card without badge
    await expect(errorSprout).toHaveScreenshot('sprout-card-no-badge-graceful.png');
  });
});
```

**Traceability:** Product Brief Flow 1, Wireframe Screen 1

---

### US-A002: View Quality Tooltip on Hover

**As a** Grove explorer
**I want to** see a dimension breakdown when I hover over the quality badge
**So that** I can understand the score components without clicking

**INVEST Assessment:**
- **I**ndependent: Yes - pure UI interaction
- **N**egotiable: Yes - tooltip content flexible
- **V**aluable: Yes - quick insight without navigation
- **E**stimable: Yes - standard tooltip pattern
- **S**mall: Yes - single interaction
- **T**estable: Yes - tooltip content verifiable

**Acceptance Criteria:**

```gherkin
Scenario: Tooltip shows dimension breakdown on hover
  Given I am viewing a sprout card with quality score 78
  When I hover over the quality badge
  Then a tooltip should appear within 200ms
  And the tooltip should show:
    | Dimension  | Value |
    | Accuracy   | 82%   |
    | Utility    | 75%   |
    | Novelty    | 68%   |
    | Provenance | 87%   |

Scenario: Tooltip disappears on mouse leave
  Given I am hovering over a quality badge
  And the tooltip is visible
  When I move my mouse away from the badge
  Then the tooltip should disappear within 150ms

Scenario: Tooltip accessible via keyboard
  Given I am navigating with keyboard
  When I focus on the quality badge
  Then the tooltip should appear
  And screen reader should announce "Quality score 78 percent, grade A minus"
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-tooltip.spec.ts

test.describe('Quality Tooltip', () => {
  test('displays dimension breakdown on hover', async ({ page }) => {
    await page.goto('/explore');

    const qualityBadge = page.locator('[data-testid="quality-badge"]').first();

    // Hover to trigger tooltip
    await qualityBadge.hover();

    // Wait for tooltip
    const tooltip = page.locator('[data-testid="quality-tooltip"]');
    await expect(tooltip).toBeVisible({ timeout: 500 });

    // Verify dimension values
    await expect(tooltip).toContainText('Accuracy');
    await expect(tooltip).toContainText('Utility');
    await expect(tooltip).toContainText('Novelty');
    await expect(tooltip).toContainText('Provenance');

    // Visual verification
    await expect(tooltip).toHaveScreenshot('quality-tooltip-dimensions.png');
  });

  test('tooltip disappears on mouse leave', async ({ page }) => {
    await page.goto('/explore');

    const qualityBadge = page.locator('[data-testid="quality-badge"]').first();
    await qualityBadge.hover();

    const tooltip = page.locator('[data-testid="quality-tooltip"]');
    await expect(tooltip).toBeVisible();

    // Move mouse away
    await page.mouse.move(0, 0);

    await expect(tooltip).not.toBeVisible({ timeout: 500 });
  });

  test('tooltip accessible via keyboard focus', async ({ page }) => {
    await page.goto('/explore');

    // Tab to quality badge
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to badge

    const tooltip = page.locator('[data-testid="quality-tooltip"]');
    await expect(tooltip).toBeVisible();

    // Verify ARIA attributes
    const qualityBadge = page.locator('[data-testid="quality-badge"]:focus');
    await expect(qualityBadge).toHaveAttribute('aria-describedby');
  });
});
```

**Traceability:** Product Brief Flow 1, Wireframe Screen 1 Interaction Notes

---

## Epic 2: Quality Filtering

### US-A003: Filter Sprouts by Minimum Quality Score

**As a** Grove explorer
**I want to** set a minimum quality threshold
**So that** I only see content that meets my standards

**INVEST Assessment:**
- **I**ndependent: Yes - filter logic standalone
- **N**egotiable: Yes - slider vs input flexible
- **V**aluable: Yes - core filtering feature
- **E**stimable: Yes - extends existing filter system
- **S**mall: Yes - single filter control
- **T**estable: Yes - count verification

**Acceptance Criteria:**

```gherkin
Scenario: Slider filters content by minimum score
  Given I am viewing the Explore page with 100 sprouts
  And 30 sprouts have quality score >= 80
  When I set the minimum quality slider to 80
  Then only 30 sprouts should be displayed
  And the URL should update to include "?quality=80"

Scenario: Filter applies with 200ms debounce
  Given I am adjusting the quality slider
  When I drag from 0 to 80 in one motion
  Then the filter should only apply once
  And the content should not flicker during drag

Scenario: Filter persists on page refresh
  Given I have set the quality filter to 70
  When I refresh the page
  Then the slider should show 70
  And only sprouts with score >= 70 should be visible
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-filter.spec.ts

test.describe('Quality Filter', () => {
  test('slider filters content by minimum score', async ({ page }) => {
    await page.goto('/explore');

    // Open filter panel
    await page.click('[data-testid="filter-toggle"]');

    // Get initial count
    const initialCount = await page.locator('[data-testid="sprout-card"]').count();

    // Set quality filter to 80
    const slider = page.locator('[data-testid="quality-slider"]');
    await slider.fill('80');

    // Wait for filter to apply (debounce)
    await page.waitForTimeout(300);

    // Verify filtered results
    const filteredCount = await page.locator('[data-testid="sprout-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Verify URL state
    await expect(page).toHaveURL(/quality=80/);

    // Visual verification
    await expect(page.locator('[data-testid="sprout-grid"]')).toHaveScreenshot('filtered-by-quality-80.png');
  });

  test('filter persists on page refresh', async ({ page }) => {
    await page.goto('/explore?quality=70');

    // Verify slider shows correct value
    const slider = page.locator('[data-testid="quality-slider"]');
    await expect(slider).toHaveValue('70');

    // Verify all visible sprouts meet threshold
    const badges = page.locator('[data-testid="quality-badge"]');
    const count = await badges.count();

    for (let i = 0; i < count; i++) {
      const score = await badges.nth(i).getAttribute('data-score');
      expect(parseInt(score || '0')).toBeGreaterThanOrEqual(70);
    }
  });
});
```

**Traceability:** Product Brief Flow 2, Wireframe Screen 2

---

### US-A004: Use Quick Filter Presets

**As a** Grove explorer
**I want to** quickly apply common quality filters with one click
**So that** I don't have to manually adjust the slider each time

**INVEST Assessment:**
- **I**ndependent: Yes - preset buttons standalone
- **N**egotiable: Yes - preset values configurable
- **V**aluable: Yes - reduces friction
- **E**stimable: Yes - simple button array
- **S**mall: Yes - UI only
- **T**estable: Yes - click and verify

**Acceptance Criteria:**

```gherkin
Scenario: Click preset applies filter instantly
  Given I am viewing the filter panel
  When I click the "High 80+" preset button
  Then the slider should move to 80
  And only high-quality sprouts should be displayed
  And the "High 80+" button should show selected state

Scenario: Preset buttons are mutually exclusive
  Given I have "High 80+" preset selected
  When I click "Medium+ 50+"
  Then "Medium+ 50+" should be selected
  And "High 80+" should be deselected

Scenario: "All" preset clears quality filter
  Given I have a quality filter of 80 applied
  When I click the "All" preset
  Then all sprouts should be displayed
  And the slider should reset to 0
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-presets.spec.ts

test.describe('Quality Filter Presets', () => {
  test('preset buttons apply correct filter values', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="filter-toggle"]');

    // Click High 80+ preset
    await page.click('[data-testid="preset-high"]');

    // Verify slider value
    const slider = page.locator('[data-testid="quality-slider"]');
    await expect(slider).toHaveValue('80');

    // Verify preset button selected state
    const highPreset = page.locator('[data-testid="preset-high"]');
    await expect(highPreset).toHaveClass(/selected|active/);

    // Visual verification of selected preset
    await expect(page.locator('[data-testid="quality-filter-section"]')).toHaveScreenshot('preset-high-selected.png');
  });

  test('presets are mutually exclusive', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="filter-toggle"]');

    // Select High
    await page.click('[data-testid="preset-high"]');
    await expect(page.locator('[data-testid="preset-high"]')).toHaveClass(/selected/);

    // Select Medium - should deselect High
    await page.click('[data-testid="preset-medium"]');
    await expect(page.locator('[data-testid="preset-medium"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="preset-high"]')).not.toHaveClass(/selected/);
  });

  test('All preset clears filter', async ({ page }) => {
    await page.goto('/explore?quality=80');
    await page.click('[data-testid="filter-toggle"]');

    // Click All preset
    await page.click('[data-testid="preset-all"]');

    // Verify filter cleared
    await expect(page).toHaveURL(/^(?!.*quality=)/);
    const slider = page.locator('[data-testid="quality-slider"]');
    await expect(slider).toHaveValue('0');
  });
});
```

**Traceability:** Product Brief Flow 2, Wireframe Screen 2

---

### US-A005: Filter by Individual Dimensions (Advanced)

**As a** research-focused explorer
**I want to** filter by specific quality dimensions
**So that** I can find content strong in particular areas like accuracy or provenance

**INVEST Assessment:**
- **I**ndependent: Yes - optional advanced feature
- **N**egotiable: Yes - which dimensions exposed
- **V**aluable: Yes - power user feature
- **E**stimable: Yes - reuses slider pattern
- **S**mall: Yes - extends existing filter
- **T**estable: Yes - dimension-specific counts

**Acceptance Criteria:**

```gherkin
Scenario: Advanced filters hidden by default
  Given I open the filter panel
  Then the dimension filters should be collapsed
  And I should see "Advanced Dimension Filters" toggle

Scenario: Expand and use dimension filter
  Given I have expanded the advanced filters
  When I set Accuracy minimum to 70
  Then only sprouts with accuracy >= 70 should be displayed
  And the URL should include "accuracy=70"

Scenario: Multiple dimension filters combine with AND
  Given I set Accuracy to 70 and Provenance to 80
  Then only sprouts meeting BOTH criteria should display
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-advanced-filters.spec.ts

test.describe('Advanced Dimension Filters', () => {
  test('advanced filters collapsed by default', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="filter-toggle"]');

    // Advanced section should be collapsed
    const advancedSection = page.locator('[data-testid="advanced-filters"]');
    await expect(advancedSection).not.toBeVisible();

    // Toggle should be visible
    const toggle = page.locator('[data-testid="advanced-filters-toggle"]');
    await expect(toggle).toBeVisible();

    // Visual verification
    await expect(page.locator('[data-testid="filter-panel"]')).toHaveScreenshot('filters-collapsed.png');
  });

  test('dimension filter applies correctly', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="filter-toggle"]');

    // Expand advanced filters
    await page.click('[data-testid="advanced-filters-toggle"]');

    // Set accuracy filter
    const accuracySlider = page.locator('[data-testid="filter-accuracy"]');
    await accuracySlider.fill('70');

    await page.waitForTimeout(300); // debounce

    // Verify URL
    await expect(page).toHaveURL(/accuracy=70/);

    // Visual verification of expanded filters
    await expect(page.locator('[data-testid="filter-panel"]')).toHaveScreenshot('filters-expanded-accuracy-70.png');
  });

  test('multiple dimension filters combine with AND logic', async ({ page }) => {
    await page.goto('/explore');
    await page.click('[data-testid="filter-toggle"]');
    await page.click('[data-testid="advanced-filters-toggle"]');

    // Set multiple filters
    await page.locator('[data-testid="filter-accuracy"]').fill('70');
    await page.locator('[data-testid="filter-provenance"]').fill('80');

    await page.waitForTimeout(300);

    // Verify URL has both parameters
    await expect(page).toHaveURL(/accuracy=70/);
    await expect(page).toHaveURL(/provenance=80/);
  });
});
```

**Traceability:** Product Brief Flow 2, Wireframe Screen 2 Advanced Filters

---

## Epic 3: Quality Breakdown Panel

### US-A006: View Full Quality Breakdown

**As a** Grove explorer
**I want to** see detailed quality information in an expanded panel
**So that** I can understand all dimensions and assessment metadata

**INVEST Assessment:**
- **I**ndependent: Yes - panel is self-contained
- **N**egotiable: Yes - layout flexible
- **V**aluable: Yes - detailed insight
- **E**stimable: Yes - defined components
- **S**mall: Yes - read-only display
- **T**estable: Yes - content verification

**Acceptance Criteria:**

```gherkin
Scenario: Panel opens on badge click
  Given I am viewing a sprout with quality score 78
  When I click on the quality badge
  Then a breakdown panel should slide in from the right
  And I should see the overall score prominently displayed
  And I should see all four dimension scores

Scenario: Panel displays radar chart
  Given the breakdown panel is open
  Then I should see a radar chart visualization
  And the chart should show my grove's dimensions
  And optionally show network average comparison

Scenario: Panel shows assessment metadata
  Given the breakdown panel is open
  Then I should see:
    | Field      | Example Value          |
    | Scored     | Jan 15, 2026 at 14:32  |
    | Model      | grove-quality-v1       |
    | Confidence | High (94%)             |

Scenario: Panel closes on escape or outside click
  Given the breakdown panel is open
  When I press Escape
  Then the panel should close
  And focus should return to the badge
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-breakdown-panel.spec.ts

test.describe('Quality Breakdown Panel', () => {
  test('panel opens on badge click with correct content', async ({ page }) => {
    await page.goto('/explore');

    // Click quality badge
    const badge = page.locator('[data-testid="quality-badge"]').first();
    await badge.click();

    // Panel should appear
    const panel = page.locator('[data-testid="quality-breakdown-panel"]');
    await expect(panel).toBeVisible();

    // Verify content sections
    await expect(panel.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(panel.locator('[data-testid="dimension-accuracy"]')).toBeVisible();
    await expect(panel.locator('[data-testid="dimension-utility"]')).toBeVisible();
    await expect(panel.locator('[data-testid="dimension-novelty"]')).toBeVisible();
    await expect(panel.locator('[data-testid="dimension-provenance"]')).toBeVisible();

    // Visual verification - full panel
    await expect(panel).toHaveScreenshot('breakdown-panel-full.png');
  });

  test('panel displays radar chart', async ({ page }) => {
    await page.goto('/explore');

    await page.locator('[data-testid="quality-badge"]').first().click();

    const radarChart = page.locator('[data-testid="quality-radar-chart"]');
    await expect(radarChart).toBeVisible();

    // Visual verification of chart
    await expect(radarChart).toHaveScreenshot('breakdown-radar-chart.png');
  });

  test('panel shows assessment metadata', async ({ page }) => {
    await page.goto('/explore');

    await page.locator('[data-testid="quality-badge"]').first().click();

    const panel = page.locator('[data-testid="quality-breakdown-panel"]');

    // Verify metadata section
    await expect(panel.locator('[data-testid="metadata-scored"]')).toContainText(/\d{4}/); // Year
    await expect(panel.locator('[data-testid="metadata-model"]')).toContainText('grove-quality');
    await expect(panel.locator('[data-testid="metadata-confidence"]')).toBeVisible();
  });

  test('panel closes on escape key', async ({ page }) => {
    await page.goto('/explore');

    await page.locator('[data-testid="quality-badge"]').first().click();

    const panel = page.locator('[data-testid="quality-breakdown-panel"]');
    await expect(panel).toBeVisible();

    // Press escape
    await page.keyboard.press('Escape');

    await expect(panel).not.toBeVisible();
  });

  test('panel closes on outside click', async ({ page }) => {
    await page.goto('/explore');

    await page.locator('[data-testid="quality-badge"]').first().click();

    const panel = page.locator('[data-testid="quality-breakdown-panel"]');
    await expect(panel).toBeVisible();

    // Click outside (on backdrop)
    await page.locator('[data-testid="panel-backdrop"]').click();

    await expect(panel).not.toBeVisible();
  });
});
```

**Traceability:** Product Brief Flow 1, Wireframe Screen 3

---

## Epic 4: Threshold Configuration

### US-A007: Configure Quality Thresholds

**As a** Grove operator
**I want to** create and manage quality threshold configurations
**So that** I can set standards for content in my grove

**INVEST Assessment:**
- **I**ndependent: Yes - operator feature
- **N**egotiable: Yes - fields configurable
- **V**aluable: Yes - core operator control
- **E**stimable: Yes - uses existing editors
- **S**mall: Yes - CRUD operations
- **T**estable: Yes - config persistence

**Acceptance Criteria:**

```gherkin
Scenario: View existing thresholds
  Given I am an operator
  When I navigate to Experience Console > Quality Settings
  Then I should see a list of existing threshold configurations
  And each card should show minimum score and enabled status

Scenario: Create new threshold
  Given I am in Quality Settings
  When I click "Create" button
  And I fill in the threshold form:
    | Field          | Value              |
    | Title          | Research Standard  |
    | Minimum Score  | 70                 |
    | Dimensions     | Accuracy, Utility  |
  And I click "Save"
  Then the new threshold should appear in the list
  And I should see a success notification

Scenario: Edit existing threshold
  Given I have an existing threshold "High Quality Gate"
  When I click "Edit" on that threshold
  And I change the minimum score to 85
  And I save the changes
  Then the threshold should show the updated value
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-threshold-config.spec.ts

test.describe('Quality Threshold Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Experience Console as operator
    await page.goto('/bedrock/experience-console');
    await page.click('[data-testid="quality-settings-tab"]');
  });

  test('displays existing thresholds', async ({ page }) => {
    const thresholdCards = page.locator('[data-testid="threshold-card"]');

    // Should have at least one threshold
    await expect(thresholdCards).toHaveCount({ min: 1 });

    // Verify card content
    const firstCard = thresholdCards.first();
    await expect(firstCard.locator('[data-testid="threshold-title"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="threshold-minimum"]')).toBeVisible();

    // Visual verification
    await expect(page.locator('[data-testid="quality-settings"]')).toHaveScreenshot('threshold-list.png');
  });

  test('creates new threshold', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-threshold"]');

    // Fill form
    await page.fill('[data-testid="threshold-title-input"]', 'E2E Test Threshold');
    await page.fill('[data-testid="threshold-minimum-input"]', '75');

    // Visual verification of form
    await expect(page.locator('[data-testid="threshold-editor"]')).toHaveScreenshot('threshold-create-form.png');

    // Save
    await page.click('[data-testid="save-threshold"]');

    // Verify created
    await expect(page.locator('text=E2E Test Threshold')).toBeVisible();
  });

  test('edits existing threshold', async ({ page }) => {
    const firstCard = page.locator('[data-testid="threshold-card"]').first();
    await firstCard.locator('[data-testid="edit-threshold"]').click();

    // Modify value
    await page.fill('[data-testid="threshold-minimum-input"]', '85');

    await page.click('[data-testid="save-threshold"]');

    // Verify updated
    await expect(firstCard.locator('[data-testid="threshold-minimum"]')).toContainText('85');
  });
});
```

**Traceability:** Product Brief Flow 3, Wireframe Screen 5

---

### US-A008: Enable Federated Learning

**As a** Grove operator
**I want to** opt into federated learning
**So that** my grove can contribute to and benefit from network-wide quality improvements

**INVEST Assessment:**
- **I**ndependent: Yes - toggle feature
- **N**egotiable: Yes - privacy levels flexible
- **V**aluable: Yes - network benefit
- **E**stimable: Yes - simple toggle
- **S**mall: Yes - single setting
- **T**estable: Yes - state verification

**Acceptance Criteria:**

```gherkin
Scenario: Enable federated learning
  Given I am in Quality Settings
  And federated learning is currently disabled
  When I toggle "Participation" to enabled
  Then the toggle should show enabled state
  And I should see privacy level options
  And my selection should be persisted

Scenario: Select privacy level
  Given federated learning is enabled
  When I select "Anonymized" privacy level
  Then the selection should be saved
  And the UI should show current setting
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/federated-learning.spec.ts

test.describe('Federated Learning Settings', () => {
  test('toggle federated learning participation', async ({ page }) => {
    await page.goto('/bedrock/experience-console');
    await page.click('[data-testid="quality-settings-tab"]');

    const toggle = page.locator('[data-testid="federated-toggle"]');

    // Toggle on
    await toggle.click();

    // Verify enabled state
    await expect(toggle).toHaveAttribute('data-state', 'on');

    // Privacy options should appear
    await expect(page.locator('[data-testid="privacy-level-select"]')).toBeVisible();

    // Visual verification
    await expect(page.locator('[data-testid="federated-settings"]')).toHaveScreenshot('federated-enabled.png');
  });

  test('select privacy level', async ({ page }) => {
    await page.goto('/bedrock/experience-console');
    await page.click('[data-testid="quality-settings-tab"]');

    // Ensure federated is enabled
    const toggle = page.locator('[data-testid="federated-toggle"]');
    if (await toggle.getAttribute('data-state') !== 'on') {
      await toggle.click();
    }

    // Select privacy level
    await page.click('[data-testid="privacy-level-select"]');
    await page.click('[data-testid="privacy-option-anonymized"]');

    // Verify selection
    await expect(page.locator('[data-testid="privacy-level-select"]')).toContainText('Anonymized');
  });
});
```

**Traceability:** Product Brief Flow 4, Wireframe Screen 5

---

## Epic 5: Empty & Error States

### US-A009: Handle Empty and Error States Gracefully

**As a** Grove explorer
**I want to** see helpful messages when there's no quality data or when filtering returns no results
**So that** I understand what's happening and know what to do next

**INVEST Assessment:**
- **I**ndependent: Yes - error handling standalone
- **N**egotiable: Yes - message wording flexible
- **V**aluable: Yes - UX polish
- **E**stimable: Yes - defined states
- **S**mall: Yes - UI variations
- **T**estable: Yes - state triggering

**Acceptance Criteria:**

```gherkin
Scenario: No scored content empty state
  Given I am a new user with no scored content
  When I view the Explore page
  Then I should see "No quality scores yet" message
  And I should see a call-to-action to create content

Scenario: No results after filtering
  Given I set quality filter to 95
  And no sprouts meet that threshold
  When the filter applies
  Then I should see "No content matches your quality filters"
  And I should see buttons to "Show all content" or "Adjust filters"
```

**Playwright E2E Test Specification:**

```typescript
// tests/e2e/quality-empty-states.spec.ts

test.describe('Quality Empty States', () => {
  test('displays empty state when no scored content', async ({ page }) => {
    // Navigate with test user who has no scored content
    await page.goto('/explore?test_user=no_scores');

    const emptyState = page.locator('[data-testid="empty-state-no-scores"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No quality scores yet');

    // Verify CTA
    await expect(emptyState.locator('[data-testid="create-sprout-cta"]')).toBeVisible();

    // Visual verification
    await expect(emptyState).toHaveScreenshot('empty-state-no-scores.png');
  });

  test('displays empty state when filter has no results', async ({ page }) => {
    await page.goto('/explore?quality=99');

    const emptyState = page.locator('[data-testid="empty-state-no-results"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No content matches');

    // Verify action buttons
    await expect(emptyState.locator('[data-testid="show-all-cta"]')).toBeVisible();
    await expect(emptyState.locator('[data-testid="adjust-filters-cta"]')).toBeVisible();

    // Visual verification
    await expect(emptyState).toHaveScreenshot('empty-state-no-filter-results.png');
  });

  test('show all button clears filters', async ({ page }) => {
    await page.goto('/explore?quality=99');

    await page.click('[data-testid="show-all-cta"]');

    // URL should have no quality filter
    await expect(page).toHaveURL(/^(?!.*quality=)/);

    // Content should be visible
    await expect(page.locator('[data-testid="sprout-card"]')).toHaveCount({ min: 1 });
  });
});
```

**Traceability:** Wireframe Screen 4

---

## Summary

| Story ID | Title | Priority | Complexity | json-render |
|----------|-------|----------|------------|-------------|
| US-A001 | View Quality Score on Sprout Card | P0 | M | No |
| US-A002 | View Quality Tooltip on Hover | P1 | S | No |
| US-A003 | Filter Sprouts by Minimum Quality Score | P0 | M | No |
| US-A004 | Use Quick Filter Presets | P1 | S | No |
| US-A005 | Filter by Individual Dimensions | P2 | M | No |
| US-A006 | View Full Quality Breakdown | P0 | L | **Yes** |
| US-A007 | Configure Quality Thresholds | P1 | M | No |
| US-A008 | Enable Federated Learning | P2 | S | No |
| US-A009 | Handle Empty and Error States | P1 | S | No |

**Total v1.0 Stories:** 9
**json-render Required:** 1 (US-A006 - Breakdown Panel)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-A007 enables operator-configured thresholds in database, not code. Filter presets are configurable via `quality_filter_presets` table. |
| **Capability Agnosticism** | All stories work regardless of scoring model. Badge displays score 0-100 from any source. Transform functions abstract model specifics. |
| **Provenance as Infrastructure** | US-A006 displays scoring metadata (model, timestamp, confidence). Assessment provenance is visible to users. |
| **Organic Scalability** | US-A008 enables federated learning participation. Filter architecture scales with content growth. |

---

## Playwright Test File Structure

```
tests/e2e/
├── quality-badge-display.spec.ts     # US-A001
├── quality-tooltip.spec.ts           # US-A002
├── quality-filter.spec.ts            # US-A003
├── quality-presets.spec.ts           # US-A004
├── quality-advanced-filters.spec.ts  # US-A005
├── quality-breakdown-panel.spec.ts   # US-A006
├── quality-threshold-config.spec.ts  # US-A007
├── federated-learning.spec.ts        # US-A008
└── quality-empty-states.spec.ts      # US-A009

tests/e2e/snapshots/
├── sprout-card-with-quality-badge.png
├── badge-color-variations.png
├── sprout-card-pending-badge.png
├── quality-tooltip-dimensions.png
├── filtered-by-quality-80.png
├── preset-high-selected.png
├── breakdown-panel-full.png
├── breakdown-radar-chart.png
├── threshold-list.png
└── ...
```

---

**Prepared By:** User Story Refinery
**Date:** 2026-01-18
**Next:** Development Sprint Execution
