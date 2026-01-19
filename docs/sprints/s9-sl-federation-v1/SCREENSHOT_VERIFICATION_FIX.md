# S9-SL-Federation v1: Screenshot Verification Fix

> **Problem**: All 35 E2E tests pass, but screenshots don't verify intended functionality.
> **Pattern**: Follow S11-SL-Attribution's successful approach - assert data is visible BEFORE screenshotting.
> **Goal**: Every screenshot must prove the UI correctly displays seeded test data.

---

## The Problem

Current tests do this:
```typescript
test('US-F007: Tier mapping shows confidence score', async ({ page }) => {
  await waitForPageStable(page);
  await page.screenshot({...});  // Just proves page loaded, NOT that 0.92 is visible
});
```

Tests should do this:
```typescript
test('US-F007: Tier mapping shows confidence score', async ({ page }) => {
  await waitForPageStable(page);

  // ASSERT the seeded data is visible
  await expect(page.getByText('Expert ↔ Advanced Mapping')).toBeVisible();
  await expect(page.getByText('0.92')).toBeVisible();  // OR '92%' depending on format

  // NOW screenshot captures VERIFIED state
  await page.screenshot({...});
});
```

---

## Seeded Data Reference

The test file seeds this data in `seedFederationData()`:

### Federated Groves (3 items)

| ID | Name | Connection Status | Trust Level | Trust Score |
|----|------|-------------------|-------------|-------------|
| test-federated-grove-1 | Anthropic Research Grove | connected | trusted | 85 |
| test-federated-grove-2 | OpenAI Community Grove | pending | new | 25 |
| test-federated-grove-3 | DeepMind Grove | failed | established | 40 |

### Tier Mappings (2 items)

| ID | Title | Local Tier | Remote Tier | Confidence | Status |
|----|-------|------------|-------------|------------|--------|
| test-tier-mapping-1 | Expert ↔ Advanced Mapping | expert | advanced | 0.92 | accepted |
| test-tier-mapping-2 | Competent ↔ Intermediate Proposal | competent | intermediate | 0.75 | proposed |

### Federation Exchanges (3 items)

| ID | Title | Type | Status | Token Cost |
|----|-------|------|--------|------------|
| test-exchange-1 | AI Safety Research Request | request | active | 150 |
| test-exchange-2 | Training Data Offer | offer | pending | 200 |
| test-exchange-3 | Completed Knowledge Exchange | request | completed | 75 |

### Trust Relationships (2 items)

| ID | Title | Level | Overall Score | Components |
|----|-------|-------|---------------|------------|
| test-trust-1 | Grove Foundation ↔ Anthropic Trust | trusted | 85 | 95/88/72/90 |
| test-trust-2 | Grove Foundation ↔ OpenAI Trust | new | 25 | 30/20/25/25 |

---

## Test-by-Test Fix Plan

### Group 1: Console Loading Tests

#### US-F001: Federation Console loads with seeded data
**Current**: `expect(cards).toBeGreaterThanOrEqual(0)` - Always passes!
**Fix**:
```typescript
// We seeded: 3 groves + 2 mappings + 3 exchanges + 2 trust = 10 objects
const cards = await page.locator('[data-testid="object-card"]').count();
expect(cards).toBe(10);  // Exact count, not "at least 0"

// Verify at least one specific item is visible
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();
```
**Screenshot proves**: Console loaded with all 10 seeded objects.

#### US-F002: Federation Console shows entity type tabs or filters
**Current**: Just takes screenshot.
**Fix**:
```typescript
// Verify entity type tabs/filters exist and show correct labels
await expect(page.getByRole('tab', { name: /groves/i })).toBeVisible();
await expect(page.getByRole('tab', { name: /mappings/i })).toBeVisible();
await expect(page.getByRole('tab', { name: /exchanges/i })).toBeVisible();
await expect(page.getByRole('tab', { name: /trust/i })).toBeVisible();
```
**Screenshot proves**: All 4 entity type tabs are rendered.

---

### Group 2: Federated Grove Tests

#### US-F003: View federated groves list
**Current**: Just waits and screenshots.
**Fix**:
```typescript
// Verify all 3 seeded groves are visible
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();
await expect(page.getByText('OpenAI Community Grove')).toBeVisible();
await expect(page.getByText('DeepMind Grove')).toBeVisible();

// Verify count badge or list shows 3
await expect(page.getByText(/3 groves/i).or(page.locator('[data-count="3"]'))).toBeVisible();
```
**Screenshot proves**: All 3 federated groves are listed.

#### US-F004: Grove card shows connection status
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify connection status badges are visible with correct values
await expect(page.getByText('connected')).toBeVisible();
await expect(page.getByText('pending')).toBeVisible();
await expect(page.getByText('failed').or(page.getByText('offline'))).toBeVisible();

// Verify specific grove has specific status
const anthropicCard = page.locator('[data-testid="object-card"]').filter({ hasText: 'Anthropic' });
await expect(anthropicCard.getByText('connected')).toBeVisible();
```
**Screenshot proves**: Connection status badges render with correct values.

#### US-F005: Open grove editor modal
**Current**: Clicks card, screenshots modal.
**Fix**:
```typescript
// Click Anthropic grove card
await page.getByText('Anthropic Research Grove').click();
await page.waitForSelector('[role="dialog"]');

// Verify modal shows correct data
await expect(page.getByRole('dialog')).toContainText('Anthropic Research Grove');
await expect(page.getByRole('dialog')).toContainText('AI safety research community');
await expect(page.getByRole('dialog')).toContainText('anthropic-grove-001');  // groveId
await expect(page.getByRole('dialog')).toContainText('pk_anthropic_abc123');  // publicKey partial
```
**Screenshot proves**: Editor modal displays all grove details correctly.

---

### Group 3: Tier Mapping Tests

#### US-F006: View tier mappings
**Current**: Just screenshots.
**Fix**:
```typescript
// Switch to tier mappings view (if tabbed)
await page.getByRole('tab', { name: /mappings/i }).click();
await waitForPageStable(page);

// Verify both seeded mappings are visible
await expect(page.getByText('Expert ↔ Advanced Mapping')).toBeVisible();
await expect(page.getByText('Competent ↔ Intermediate Proposal')).toBeVisible();
```
**Screenshot proves**: Both tier mappings are listed.

#### US-F007: Tier mapping shows confidence score
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify confidence scores are displayed
// Seeded: 0.92 and 0.75
await expect(page.getByText('0.92').or(page.getByText('92%'))).toBeVisible();
await expect(page.getByText('0.75').or(page.getByText('75%'))).toBeVisible();

// Verify specific mapping has specific confidence
const expertMapping = page.locator('[data-testid="object-card"]').filter({ hasText: 'Expert' });
await expect(expertMapping.getByText(/0\.92|92%/)).toBeVisible();
```
**Screenshot proves**: Confidence scores (0.92, 0.75) are displayed correctly.

---

### Group 4: Federation Exchange Tests

#### US-F008: View federation exchanges
**Current**: Just screenshots.
**Fix**:
```typescript
// Switch to exchanges view
await page.getByRole('tab', { name: /exchanges/i }).click();
await waitForPageStable(page);

// Verify all 3 seeded exchanges are visible
await expect(page.getByText('AI Safety Research Request')).toBeVisible();
await expect(page.getByText('Training Data Offer')).toBeVisible();
await expect(page.getByText('Completed Knowledge Exchange')).toBeVisible();
```
**Screenshot proves**: All 3 exchanges are listed.

#### US-F009: Exchange card shows token cost
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify token costs are displayed
// Seeded: 150, 200, 75
await expect(page.getByText('150')).toBeVisible();
await expect(page.getByText('200')).toBeVisible();
await expect(page.getByText('75')).toBeVisible();

// Or if formatted with "tokens" suffix
await expect(page.getByText(/150\s*tokens?/i).or(page.getByText('150'))).toBeVisible();
```
**Screenshot proves**: Token costs (150, 200, 75) are displayed.

#### US-F010: Exchange request vs offer differentiation
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify request type indicator
await expect(page.getByText('request').first()).toBeVisible();

// Verify offer type indicator
await expect(page.getByText('offer')).toBeVisible();

// Verify statuses
await expect(page.getByText('active')).toBeVisible();
await expect(page.getByText('pending')).toBeVisible();
await expect(page.getByText('completed')).toBeVisible();
```
**Screenshot proves**: Request vs offer types are visually differentiated.

---

### Group 5: Trust Relationship Tests

#### US-F011: View trust relationships
**Current**: Just screenshots.
**Fix**:
```typescript
// Switch to trust view
await page.getByRole('tab', { name: /trust/i }).click();
await waitForPageStable(page);

// Verify both seeded trust relationships are visible
await expect(page.getByText('Grove Foundation ↔ Anthropic Trust')).toBeVisible();
await expect(page.getByText('Grove Foundation ↔ OpenAI Trust')).toBeVisible();
```
**Screenshot proves**: Both trust relationships are listed.

#### US-F012: Trust card shows score breakdown
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify overall scores
await expect(page.getByText('85').first()).toBeVisible();  // Anthropic trust score
await expect(page.getByText('25')).toBeVisible();  // OpenAI trust score

// Verify component breakdown for Anthropic (95/88/72/90)
const anthropicTrust = page.locator('[data-testid="object-card"]').filter({ hasText: 'Anthropic' });
await expect(anthropicTrust.getByText(/95|exchange.*success/i)).toBeVisible();
await expect(anthropicTrust.getByText(/88|tier.*accuracy/i)).toBeVisible();
await expect(anthropicTrust.getByText(/72|response.*time/i)).toBeVisible();
await expect(anthropicTrust.getByText(/90|content.*quality/i)).toBeVisible();
```
**Screenshot proves**: Trust score breakdowns (95/88/72/90) are displayed.

#### US-F013: Trust level indicators (new/established/trusted/verified)
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify trust level badges
await expect(page.getByText('trusted')).toBeVisible();  // Anthropic
await expect(page.getByText('new')).toBeVisible();  // OpenAI

// Verify visual differentiation (different colors, icons)
const trustedBadge = page.locator('.trust-badge, [data-trust-level]').filter({ hasText: 'trusted' });
const newBadge = page.locator('.trust-badge, [data-trust-level]').filter({ hasText: 'new' });
await expect(trustedBadge).toBeVisible();
await expect(newBadge).toBeVisible();
```
**Screenshot proves**: Trust levels (trusted, new) are visually indicated.

---

### Group 6: Create Object Tests

#### US-F014: Create new federated grove
**Current**: Clicks create, screenshots dialog.
**Fix**:
```typescript
const createButton = page.getByRole('button', { name: /create|add|new/i });
await createButton.first().click();

// Verify create dialog shows grove option
await expect(page.getByRole('dialog')).toBeVisible();
await expect(page.getByRole('dialog')).toContainText(/federated grove|grove/i);

// Verify form fields are present
await expect(page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i))).toBeVisible();
```
**Screenshot proves**: Create dialog for federated grove is functional.

#### US-F015: Create options show all entity types
**Current**: Same as US-F014.
**Fix**:
```typescript
// Verify all 4 entity types are available in create dropdown/menu
await expect(page.getByText(/federated grove/i)).toBeVisible();
await expect(page.getByText(/tier mapping/i)).toBeVisible();
await expect(page.getByText(/exchange|federation exchange/i)).toBeVisible();
await expect(page.getByText(/trust relationship/i)).toBeVisible();
```
**Screenshot proves**: All 4 entity type create options are available.

---

### Group 7: Search and Filter Tests

#### US-F016: Search filters objects
**Current**: Fills search, screenshots.
**Fix**:
```typescript
await page.getByPlaceholder(/search/i).fill('Anthropic');
await page.waitForTimeout(500);

// Verify only Anthropic-related items are shown
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();
await expect(page.getByText('Grove Foundation ↔ Anthropic Trust')).toBeVisible();

// Verify OpenAI and DeepMind are NOT visible
await expect(page.getByText('OpenAI Community Grove')).not.toBeVisible();
await expect(page.getByText('DeepMind Grove')).not.toBeVisible();
```
**Screenshot proves**: Search correctly filters to Anthropic-related objects only.

#### US-F017: Filter by entity type
**Current**: Just screenshots.
**Fix**:
```typescript
// Click on grove type filter
await page.getByRole('tab', { name: /groves/i }).click();
await waitForPageStable(page);

// Verify only groves are visible (3)
const groveCards = page.locator('[data-testid="object-card"]');
await expect(groveCards).toHaveCount(3);

// Verify tier mappings are NOT visible
await expect(page.getByText('Expert ↔ Advanced Mapping')).not.toBeVisible();
```
**Screenshot proves**: Type filter shows only groves, hides other types.

---

### Group 8: Responsive Layout Tests

#### US-F018: Mobile responsive layout
**Current**: Sets viewport, screenshots.
**Fix**:
```typescript
await page.setViewportSize({ width: 375, height: 667 });
await page.waitForTimeout(500);

// Verify content still visible (responsive, not broken)
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();

// Verify mobile-friendly layout (stacked, not side-by-side)
const card = page.locator('[data-testid="object-card"]').first();
const cardBox = await card.boundingBox();
expect(cardBox?.width).toBeLessThan(360);  // Card fits mobile width
```
**Screenshot proves**: Mobile layout renders correctly with visible content.

#### US-F019: Tablet responsive layout
**Current**: Sets viewport, screenshots.
**Fix**:
```typescript
await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(500);

// Verify content still visible
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();

// Verify tablet layout (may show 2 columns)
const cards = page.locator('[data-testid="object-card"]');
await expect(cards.first()).toBeVisible();
```
**Screenshot proves**: Tablet layout renders correctly.

---

### Group 9: Status Badge Tests

#### US-F024: Connection status badges render correctly
**Current**: Just screenshots.
**Fix**:
```typescript
// Verify all connection status types have visual badges
await expect(page.locator('[data-status="connected"], .badge-connected, .status-connected')).toBeVisible();
await expect(page.locator('[data-status="pending"], .badge-pending, .status-pending')).toBeVisible();
await expect(page.locator('[data-status="failed"], .badge-failed, .status-failed')).toBeVisible();

// Verify badges are with correct groves
await expect(page.getByText('Anthropic').locator('..').getByText('connected')).toBeVisible();
```
**Screenshot proves**: Connection status badges are correctly styled.

#### US-F025: Exchange status badges render correctly
**Current**: Just screenshots.
**Fix**:
```typescript
// Switch to exchanges view
await page.getByRole('tab', { name: /exchanges/i }).click();

// Verify exchange statuses
await expect(page.getByText('active')).toBeVisible();
await expect(page.getByText('pending')).toBeVisible();
await expect(page.getByText('completed')).toBeVisible();
```
**Screenshot proves**: Exchange status badges (active, pending, completed) render.

---

### Group 10: Performance Tests

#### US-F026: Console loads within acceptable time
**Current**: Logs time, screenshots.
**Fix**:
```typescript
const startTime = Date.now();
await page.goto('/bedrock/federation');
await waitForPageStable(page, 1000);
const loadTime = Date.now() - startTime;

console.log(`Federation console load time: ${loadTime}ms`);
expect(loadTime).toBeLessThan(5000);  // 5 second target, not 10

// ALSO verify content actually loaded
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();
```
**Screenshot proves**: Console loaded with content in under 5 seconds.

---

### Group 11: Empty State Test

#### US-F023: Empty state when no data
**Current**: Clears data, reloads, screenshots.
**Fix**:
```typescript
await page.evaluate(() => {
  localStorage.removeItem('grove-data:federated-grove');
  localStorage.removeItem('grove-data:tier-mapping');
  localStorage.removeItem('grove-data:federation-exchange');
  localStorage.removeItem('grove-data:trust-relationship');
});
await page.reload();
await waitForPageStable(page);

// Verify empty state message is shown
await expect(page.getByText(/no.*groves|empty|get started/i)).toBeVisible();

// Verify seeded data is NOT visible
await expect(page.getByText('Anthropic Research Grove')).not.toBeVisible();
```
**Screenshot proves**: Empty state renders when no data present.

---

## Execution Protocol

### For EACH test:

1. **Read the test** - Understand what it claims to verify
2. **Check the seeded data** - What values should be visible?
3. **Add assertions** - `expect(page.getByText('value')).toBeVisible()`
4. **Run the test** - `npx playwright test federation-console-v1.spec.ts --grep "US-F00X"`
5. **If console errors** - Fire up Chrome MCP and debug
6. **Verify screenshot** - Open the PNG and confirm it shows the asserted data
7. **Move to next test** - Only after current test's screenshot is correct

### Debug Protocol (when tests fail)

```bash
# Run single test with headed browser for debugging
npx playwright test --grep "US-F007" --headed --debug

# Check console for errors
# If component not rendering, check:
# 1. Is localStorage seeded correctly?
# 2. Is the component reading from correct key?
# 3. Is there a React error in console?
```

### Chrome MCP Debug Commands

```
# Open browser automation
chrome-mcp: navigate to http://localhost:5173/bedrock/federation

# Check localStorage
chrome-mcp: execute script "JSON.stringify(localStorage)"

# Check for React errors
chrome-mcp: get console errors

# Take debug screenshot
chrome-mcp: screenshot
```

---

## Done Criteria

- [ ] All 35 tests have assertions matching seeded data values
- [ ] Every screenshot shows the asserted values (visual confirmation)
- [ ] Zero console errors during test run
- [ ] Load time < 5000ms
- [ ] REVIEW.html updated with new screenshot evidence

---

## Test Execution Order

Execute in this order (grouped by functionality):

1. **Foundation** (US-F001, US-F002) - Console loads, tabs work
2. **Groves** (US-F003, US-F004, US-F005) - Grove list, status, editor
3. **Tier Mappings** (US-F006, US-F007) - Mapping list, confidence
4. **Exchanges** (US-F008, US-F009, US-F010) - Exchange list, tokens, types
5. **Trust** (US-F011, US-F012, US-F013) - Trust list, scores, levels
6. **CRUD** (US-F014, US-F015) - Create dialogs
7. **Search/Filter** (US-F016, US-F017) - Search works, type filter works
8. **Responsive** (US-F018, US-F019) - Mobile/tablet layouts
9. **Status Badges** (US-F024, US-F025) - Badge rendering
10. **Edge Cases** (US-F023, US-F026, US-F027, US-F028) - Empty, performance, errors, dark mode
11. **Integration** (US-F029, US-F030, US-F031, US-F032, US-F033, US-F034, US-F035) - Full workflows

---

**File**: `tests/e2e/federation-console-v1.spec.ts`
**Screenshot Dir**: `docs/sprints/s9-sl-federation-v1/screenshots/e2e/`
**Command**: `npx playwright test federation-console-v1.spec.ts --project=e2e`
