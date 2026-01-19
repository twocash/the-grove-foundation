# Screenshot Directive: S15-BD-FederationEditors-v1

**Priority:** BLOCKING - Sprint cannot close without proper visual verification
**Reference:** S11 screenshot pattern (assert values BEFORE screenshot)

---

## Problem

Current screenshots may not demonstrate actual content rendering. E2E visual verification requires:
1. Real data visible on screen
2. Assertions proving the data is correct BEFORE capture
3. Screenshots that would fail if the UI broke

---

## Required Screenshots

For EACH of the 4 editors, capture screenshots showing:

### 1. GroveEditor
- **Content Required:**
  - StatusBanner showing connection status (e.g., "Connected" with green indicator)
  - Identity section with grove name and description visible
  - Trust score ProgressScoreBar with actual percentage (e.g., "85%")
  - At least one capability pill visible
  - Footer with Save/Duplicate/Delete buttons

- **Test Pattern:**
```typescript
// Assert content BEFORE screenshot
await expect(page.locator('[data-testid="status-banner"]')).toContainText(/connected/i);
await expect(page.locator('[data-testid="grove-editor"]')).toContainText('Test Grove');
await expect(page.getByText(/85%|trust/i)).toBeVisible();

// THEN capture
await page.screenshot({ path: 'screenshots/grove-editor-populated.png' });
```

### 2. TierMappingEditor
- **Content Required:**
  - GroveConnectionDiagram with source and target grove names visible
  - Confidence score bar with percentage
  - At least one tier equivalence row (source → target)
  - Mapping status visible

- **Test Pattern:**
```typescript
await expect(page.locator('[data-testid="grove-connection-diagram"]')).toBeVisible();
await expect(page.locator('[data-testid="source-grove"]')).not.toBeEmpty();
await expect(page.locator('[data-testid="target-grove"]')).not.toBeEmpty();
await expect(page.locator('[data-testid="equivalence-row"]')).toHaveCount({ min: 1 });

await page.screenshot({ path: 'screenshots/tier-mapping-editor-populated.png' });
```

### 3. ExchangeEditor
- **Content Required:**
  - StatusBanner showing exchange status (pending/approved/etc.)
  - Token badge with value visible
  - GroveConnectionDiagram (requesting ↔ providing)
  - Content type and direction visible
  - Timeline with at least one entry

- **Test Pattern:**
```typescript
await expect(page.locator('[data-testid="status-banner"]')).toBeVisible();
await expect(page.locator('[data-testid="token-badge"]')).toContainText(/\d+/);
await expect(page.locator('[data-testid="timeline"]')).toBeVisible();

await page.screenshot({ path: 'screenshots/exchange-editor-populated.png' });
```

### 4. TrustEditor
- **Content Required:**
  - Trust level banner with stars (★★★☆☆)
  - Overall trust percentage visible
  - Token multiplier badge (e.g., "1.5x")
  - All 4 component score bars with labels and percentages
  - GroveConnectionDiagram

- **Test Pattern:**
```typescript
await expect(page.getByText(/★/)).toBeVisible();
await expect(page.getByText(/\d+%/)).toBeVisible();
await expect(page.getByText(/\d\.\dx/)).toBeVisible(); // multiplier
await expect(page.locator('[data-testid="component-score"]')).toHaveCount(4);

await page.screenshot({ path: 'screenshots/trust-editor-populated.png' });
```

---

## Screenshot Naming Convention

Save to: `docs/sprints/s15-bd-federation-editors-v1/screenshots/`

| Screenshot | Filename |
|------------|----------|
| GroveEditor with data | `grove-editor-populated.png` |
| TierMappingEditor with data | `tier-mapping-editor-populated.png` |
| ExchangeEditor with data | `exchange-editor-populated.png` |
| TrustEditor with data | `trust-editor-populated.png` |
| Mobile view (360px) any editor | `mobile-editor-360px.png` |
| Footer actions visible | `footer-actions.png` |

---

## Anti-Pattern (What NOT to Do)

```typescript
// ❌ BAD - Screenshot without content verification
await page.goto('/bedrock/federation');
await page.screenshot({ path: 'federation-console.png' });

// ❌ BAD - Click and screenshot without waiting for content
await page.click('[data-testid="grove-card"]');
await page.screenshot({ path: 'grove-editor.png' });
```

---

## Correct Pattern (What TO Do)

```typescript
// ✅ GOOD - Seed data, verify content, then screenshot
test('GroveEditor displays populated content', async ({ page }) => {
  // 1. Navigate and select an object with known data
  await page.goto('/bedrock/federation');
  await page.locator('[data-testid="grove-card"]').first().click();

  // 2. Wait for editor to load
  await expect(page.locator('[data-testid="grove-editor"]')).toBeVisible();

  // 3. Assert actual content is present (this is the key!)
  await expect(page.locator('[data-testid="status-banner"]')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /grove name/i })).not.toBeEmpty();
  await expect(page.locator('[data-testid="trust-score-bar"]')).toBeVisible();

  // 4. NOW capture the screenshot
  await page.screenshot({
    path: 'docs/sprints/s15-bd-federation-editors-v1/screenshots/grove-editor-populated.png',
    fullPage: false
  });
});
```

---

## Completion Criteria

- [ ] All 4 editor screenshots show real data (not empty states)
- [ ] Each screenshot has corresponding assertion in test
- [ ] Screenshots saved to correct directory
- [ ] At least one mobile (360px) screenshot
- [ ] Footer actions visible in at least one screenshot

---

## Reference

See S11 pattern: `tests/e2e/s11-attribution-dashboard.spec.ts`

The key insight: **Assertions prove the screenshot has value.** A screenshot without assertions is just a picture of whatever happened to be on screen.

---

*"Assert first, screenshot second. The assertion is the proof."*
