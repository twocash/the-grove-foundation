# User Stories: S15-BD-FederationEditors-v1

**Sprint:** S15-BD-FederationEditors-v1
**Generated:** 2026-01-18
**Method:** UX Chief Vision → User Story Extraction

---

## Story Index

| ID | Title | Priority | Points |
|----|-------|----------|--------|
| US-FE-001 | Factory Pattern Layout | P0 | 5 |
| US-FE-002 | GroveEditor Redesign | P0 | 5 |
| US-FE-003 | TierMappingEditor Redesign | P0 | 5 |
| US-FE-004 | ExchangeEditor Redesign | P0 | 5 |
| US-FE-005 | TrustEditor Redesign | P0 | 5 |
| US-FE-006 | Shared StatusBanner Component | P1 | 3 |
| US-FE-007 | Shared GroveConnectionDiagram | P1 | 3 |
| US-FE-008 | Shared ProgressScoreBar | P1 | 3 |
| US-FE-009 | Accessibility Compliance | P1 | 3 |
| US-FE-010 | Mobile Responsiveness | P1 | 3 |

**Total Points:** 40

---

## US-FE-001: Factory Pattern Layout

**As an** operator viewing any Federation editor,
**I want** consistent section structure and spacing,
**So that** I can quickly scan and understand the form layout.

### Acceptance Criteria

```gherkin
Feature: Factory Pattern Layout Consistency

  Background:
    Given I am viewing any Federation editor
    And the editor uses InspectorSection for field groupings
    And the editor uses InspectorDivider between sections

  Scenario: Standard section structure
    When I view any Federation editor
    Then I see sections with uppercase headers
    And each section has consistent padding (p-5)
    And fields within sections have consistent spacing (space-y-3)
    And InspectorDivider separates each section

  Scenario: Footer action pattern
    When I view any Federation editor
    Then I see a sticky footer with "Save Changes" button
    And I see Duplicate and Delete buttons in a row below
    And the Save button is disabled when no changes exist
    And the Save button is enabled when changes are pending

  Scenario: Header pattern
    When I view any Federation editor
    Then I see an icon matching the object type
    And I see the object title prominently displayed
    And I see a status badge indicating current state
```

### E2E Test Specification

```typescript
test.describe('US-FE-001: Factory Pattern Layout', () => {
  test('all editors have consistent section structure', async ({ page }) => {
    // Navigate to each editor type
    for (const type of ['grove', 'tier-mapping', 'exchange', 'trust']) {
      await page.goto(`/bedrock/federation?type=${type}`);
      await page.locator('[data-testid="object-card"]').first().click();

      // Verify InspectorSection usage
      await expect(page.locator('[data-testid="inspector-section"]')).toHaveCount.greaterThan(1);

      // Verify dividers
      await expect(page.locator('[data-testid="inspector-divider"]')).toBeVisible();

      // Verify footer
      await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
    }
  });
});
```

---

## US-FE-002: GroveEditor Redesign

**As an** operator configuring a federated grove,
**I want** the Grove editor to display connection status prominently,
**So that** I can quickly assess federation health.

### Acceptance Criteria

```gherkin
Feature: Grove Editor Redesign

  Background:
    Given I am viewing a federated grove in the inspector
    And the grove has connection and trust data

  Scenario: Status banner visibility
    When I view the Grove editor
    Then I see a colored status banner at the top
    And the banner shows connection status (Connected/Disconnected/etc.)
    And the banner includes a disconnect/connect action button
    And the color matches the connection state (green=connected, red=failed)

  Scenario: Section organization
    When I view the Grove editor
    Then I see an "Identity" section with name and description
    And I see a "Connection" section with status and endpoint
    And I see a "Technical" section with tier system and capabilities
    And I see a "Statistics" section with sprout/exchange counts
    And each section uses InspectorSection component

  Scenario: Trust score visualization
    When I view the Connection section
    Then I see a trust score progress bar
    And the bar shows the numeric percentage (e.g., "85%")
    And the bar color reflects the trust level (gradient green to cyan)
    And trust level labels appear below the bar

  Scenario: Capabilities as pills
    When I view the Technical section
    Then I see capabilities displayed as removable pill/chip components
    And each pill has an X button to remove
    And there is an input field to add new capabilities
```

### E2E Test Specification

```typescript
test.describe('US-FE-002: GroveEditor Redesign', () => {
  test('status banner shows connection state', async ({ page }) => {
    await seedFederationData(page);
    await page.goto('/bedrock/federation');
    await page.locator('[data-testid="grove-card"]').first().click();

    await expect(page.locator('[data-testid="status-banner"]')).toBeVisible();
    await expect(page.getByText(/connected|disconnected/i)).toBeVisible();
  });

  test('trust score visualization present', async ({ page }) => {
    await expect(page.locator('[data-testid="trust-score-bar"]')).toBeVisible();
    await expect(page.getByText(/85%/)).toBeVisible();
  });

  test('capabilities displayed as pills', async ({ page }) => {
    await expect(page.locator('[data-testid="capability-pill"]')).toHaveCount.greaterThan(0);
  });
});
```

---

## US-FE-003: TierMappingEditor Redesign

**As an** operator managing tier mappings,
**I want** the editor to visualize the source-to-target relationship,
**So that** I understand the translation at a glance.

### Acceptance Criteria

```gherkin
Feature: TierMapping Editor Redesign

  Background:
    Given I am viewing a tier mapping in the inspector
    And the mapping has source/target groves and equivalences

  Scenario: Grove pair visualization
    When I view the TierMapping editor
    Then I see a visual diagram showing source → target groves
    And the source grove is on the left with an icon
    And the target grove is on the right with an icon
    And an arrow connects them indicating direction

  Scenario: Confidence score visualization
    When I view the Status & Confidence section
    Then I see a slider or progress bar for confidence score
    And the numeric value is displayed prominently (e.g., "92%")
    And the bar uses gradient coloring based on confidence level

  Scenario: Tier equivalences display
    When I view the Tier Equivalences section
    Then I see each mapping as a row with source → target
    And each row shows tier icons/names from both systems
    And equivalence type is shown as a badge (exact, approximate, etc.)
    And I can edit or delete each equivalence

  Scenario: Add new equivalence
    When I want to add a tier equivalence
    Then I see an "Add Mapping" section with source/target inputs
    And I can select equivalence type from a dropdown
    And clicking Add creates a new equivalence row
```

### E2E Test Specification

```typescript
test.describe('US-FE-003: TierMappingEditor Redesign', () => {
  test('grove pair diagram visible', async ({ page }) => {
    await page.click('[data-testid="tier-mapping-card"]');
    await expect(page.locator('[data-testid="grove-connection-diagram"]')).toBeVisible();
    await expect(page.locator('[data-testid="source-grove"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-grove"]')).toBeVisible();
  });

  test('confidence score bar visible', async ({ page }) => {
    await expect(page.locator('[data-testid="confidence-bar"]')).toBeVisible();
    await expect(page.getByText(/92%|0\.92/)).toBeVisible();
  });

  test('equivalence rows display correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="equivalence-row"]')).toHaveCount.greaterThan(0);
  });
});
```

---

## US-FE-004: ExchangeEditor Redesign

**As an** operator managing knowledge exchanges,
**I want** the editor to show a timeline of status changes,
**So that** I can track exchange progress.

### Acceptance Criteria

```gherkin
Feature: Exchange Editor Redesign

  Background:
    Given I am viewing a knowledge exchange in the inspector
    And the exchange has status, parties, and content details

  Scenario: Status banner with actions
    When I view the Exchange editor
    Then I see a colored status banner showing current status
    And if status is "pending", I see Approve and Reject buttons
    And the banner color matches status (amber=pending, green=approved, etc.)

  Scenario: Token value display
    When I view the Exchange header
    Then I see a prominent token value badge
    And the badge shows the token icon and count
    And the count updates based on content type selection

  Scenario: Grove parties visualization
    When I view the Grove Parties section
    Then I see a visual diagram showing requesting ↔ providing groves
    And the direction is clear (who is requesting, who is providing)
    And each grove has an icon representing its role

  Scenario: Timeline display
    When I view the Timeline section
    Then I see a vertical timeline with status history
    And each timeline entry shows status and timestamp
    And the current status has a pulsing indicator
    And future statuses are grayed out
```

### E2E Test Specification

```typescript
test.describe('US-FE-004: ExchangeEditor Redesign', () => {
  test('status banner with workflow actions', async ({ page }) => {
    await page.click('[data-testid="exchange-card"]');
    await expect(page.locator('[data-testid="status-banner"]')).toBeVisible();
    // If pending, actions should be visible
  });

  test('token value displayed', async ({ page }) => {
    await expect(page.locator('[data-testid="token-badge"]')).toBeVisible();
    await expect(page.getByText(/\d+ tokens/)).toBeVisible();
  });

  test('timeline section visible', async ({ page }) => {
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
  });
});
```

---

## US-FE-005: TrustEditor Redesign

**As an** operator managing trust relationships,
**I want** the editor to visualize component scores with progress bars,
**So that** I can identify trust bottlenecks.

### Acceptance Criteria

```gherkin
Feature: Trust Editor Redesign

  Background:
    Given I am viewing a trust relationship in the inspector
    And the relationship has component scores and statistics

  Scenario: Trust level banner
    When I view the Trust editor
    Then I see a banner showing overall trust level
    And the banner displays stars (e.g., ★★★☆)
    And the banner shows the trust percentage
    And a progress bar visualizes the score

  Scenario: Component scores breakdown
    When I view the Component Scores section
    Then I see each component (Exchange Success, Tier Accuracy, etc.)
    And each component has its own progress bar
    And each component shows its weight percentage
    And each component shows its current score
    And the formula for overall calculation is shown

  Scenario: Token multiplier display
    When I view the Trust header
    Then I see the token multiplier badge (e.g., "1.5x")
    And the multiplier is prominently displayed
    And it's clear this affects exchange token costs

  Scenario: Exchange statistics
    When I view the Exchange Statistics section
    Then I see total exchanges and successful count
    And I see the success rate percentage
    And the data is editable for manual adjustments
```

### E2E Test Specification

```typescript
test.describe('US-FE-005: TrustEditor Redesign', () => {
  test('trust level banner visible', async ({ page }) => {
    await page.click('[data-testid="trust-card"]');
    await expect(page.locator('[data-testid="trust-banner"]')).toBeVisible();
    await expect(page.getByText(/★/)).toBeVisible();
    await expect(page.getByText(/85%|75%/)).toBeVisible();
  });

  test('component scores displayed', async ({ page }) => {
    await expect(page.locator('[data-testid="component-score"]')).toHaveCount(4);
    await expect(page.getByText(/Exchange Success/i)).toBeVisible();
    await expect(page.getByText(/Tier Accuracy/i)).toBeVisible();
  });

  test('token multiplier badge visible', async ({ page }) => {
    await expect(page.getByText(/1\.\dx/)).toBeVisible();
  });
});
```

---

## US-FE-006: Shared StatusBanner Component

**As a** developer building Federation editors,
**I want** a reusable StatusBanner component,
**So that** I can consistently display status across all editors.

### Acceptance Criteria

```gherkin
Feature: StatusBanner Shared Component

  Scenario: Component API
    Given I am using StatusBanner in an editor
    When I render the component
    Then it accepts a status prop (connected, pending, failed, etc.)
    And it accepts optional action buttons
    And it accepts custom description text
    And it renders with appropriate color based on status

  Scenario: Status color mapping
    Given StatusBanner with different statuses
    When status is "connected" or "active", Then background is green
    When status is "pending", Then background is amber
    When status is "failed" or "error", Then background is red
    When status is "inactive", Then background is gray
```

---

## US-FE-007: Shared GroveConnectionDiagram Component

**As a** developer building Federation editors,
**I want** a reusable GroveConnectionDiagram component,
**So that** I can consistently visualize grove pairs.

### Acceptance Criteria

```gherkin
Feature: GroveConnectionDiagram Shared Component

  Scenario: Component API
    Given I am using GroveConnectionDiagram
    When I render the component
    Then it accepts sourceGrove and targetGrove props
    And it accepts optional labels for each side
    And it accepts optional icon components
    And it renders source → target visual connection

  Scenario: Visual layout
    When I view the diagram
    Then source is on the left with icon and input
    Then target is on the right with icon and input
    Then an arrow or icon connects them in the center
    And the layout is responsive (stacks on mobile)
```

---

## US-FE-008: Shared ProgressScoreBar Component

**As a** developer building Federation editors,
**I want** a reusable ProgressScoreBar component,
**So that** I can consistently visualize scores and confidence.

### Acceptance Criteria

```gherkin
Feature: ProgressScoreBar Shared Component

  Scenario: Component API
    Given I am using ProgressScoreBar
    When I render the component
    Then it accepts a value prop (0-100)
    And it accepts optional label props for scale
    And it accepts optional gradient colors
    And it accepts optional marker positions

  Scenario: Visual rendering
    When I view the progress bar
    Then the filled portion matches the percentage
    Then gradient colors are applied
    Then markers/labels appear at specified positions
    And the numeric value is displayed
```

---

## US-FE-009: Accessibility Compliance

**As an** operator using a screen reader,
**I want** all form fields to have proper labels and descriptions,
**So that** I can navigate the editor effectively.

### Acceptance Criteria

```gherkin
Feature: Accessibility Compliance

  Scenario: Label associations
    Given I am navigating with a screen reader
    When I focus on any input field
    Then the field has an associated label via htmlFor/id
    And help text is linked via aria-describedby
    And required fields have aria-required="true"

  Scenario: Keyboard navigation
    When I navigate using Tab key
    Then focus moves through all interactive elements in logical order
    And focus is visible on each element
    And I can activate buttons with Enter or Space

  Scenario: Icon button accessibility
    When I encounter an icon-only button
    Then the button has an aria-label describing its action
    And the icon itself has aria-hidden="true"

  Scenario: Status announcements
    When status changes (save, error, etc.)
    Then a live region announces the change
    And the announcement uses aria-live="polite"
```

---

## US-FE-010: Mobile Responsiveness

**As an** operator on a mobile device,
**I want** the editors to be usable on narrow screens,
**So that** I can manage federation from my phone.

### Acceptance Criteria

```gherkin
Feature: Mobile Responsiveness

  Scenario: 360px width compatibility
    Given I am viewing an editor at 360px width
    When I scroll through the editor
    Then no content overflows horizontally
    And all fields are fully visible
    And touch targets are at least 44px

  Scenario: Responsive layouts
    When I view a two-column layout on mobile
    Then columns stack vertically
    And field widths adjust to full width
    And spacing remains consistent

  Scenario: Footer visibility
    When I scroll the editor on mobile
    Then the footer action buttons remain accessible
    And I can always reach Save/Delete buttons
```

---

## INVEST Assessment

| Story | Independent | Negotiable | Valuable | Estimable | Small | Testable |
|-------|-------------|------------|----------|-----------|-------|----------|
| US-FE-001 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-002 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-003 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-004 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-005 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-006 | ⚠️ Depends on 001 | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-007 | ⚠️ Depends on 001 | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-008 | ⚠️ Depends on 001 | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-009 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| US-FE-010 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Execution Order

**Phase 1: Foundation (US-FE-001, 006, 007, 008)**
Create shared components and establish factory pattern.

**Phase 2: Editors (US-FE-002, 003, 004, 005)**
Refactor each editor using shared components.

**Phase 3: Quality (US-FE-009, 010)**
Accessibility and responsive verification.

---

*Stories generated from INSPECTOR_PANEL_UX_VISION.md by UX Chief.*
