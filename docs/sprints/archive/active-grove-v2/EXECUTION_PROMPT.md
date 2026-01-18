# Execution Prompt — Active Grove E2E Test Suite v2

## Context

You are implementing comprehensive E2E tests for the Active Grove lens-reactive content transformation flow. This sprint addresses gaps revealed by Epic 7 (XState migration) where the left column content transformation failed silently.

## Key Files to Read First

```
docs/sprints/active-grove-v2/SPEC.md           # Full specification
docs/sprints/active-grove-v2/SPRINTS.md        # Story breakdown
tests/e2e/active-grove.spec.ts                 # Existing tests (extend)
src/surface/hooks/useQuantumInterface.ts       # Hook under test
src/surface/pages/GenesisPage.tsx              # Component under test
src/core/engagement/hooks/useLensState.ts      # State source
data/infrastructure/health-config.json         # Health check config
```

## Architecture Understanding

```
User clicks seedling
       │
       ▼
engSelectLens(lensId) ──► XState machine ──► localStorage persist
       │
       ▼
useLensState() returns new lens value
       │
       ▼
useQuantumInterface() detects lens change
       │
       ▼
resolveReality(lensId) returns LensReality
       │
       ▼
GenesisPage receives activeLens !== null
       │
       ▼
WaveformCollapse animates new headline
```

## Implementation Order

### Phase 1: Infrastructure (Story 1)

1. Add `data-testid="genesis-page"` to GenesisPage root
2. Add `data-testid="waveform-collapse"` and `data-waveform-headline` attribute
3. Add `data-engagement-lens` attribute exposing current XState lens
4. Create `tests/e2e/utils/quantum.ts`:

```typescript
export async function waitForLensUpdate(page: Page, expectedLens: string) {
  await page.waitForFunction(
    (lens) => document.querySelector('[data-engagement-lens]')?.getAttribute('data-engagement-lens') === lens,
    expectedLens,
    { timeout: 5000 }
  );
}

export async function waitForWaveformHeadline(page: Page, containsText: string) {
  await page.waitForFunction(
    (text) => document.querySelector('[data-waveform-headline]')?.textContent?.includes(text),
    containsText,
    { timeout: 5000 }
  );
}
```

### Phase 2: Core Tests (Story 2)

Add to `tests/e2e/active-grove.spec.ts`:

```typescript
test.describe('Active Grove Content Transformation', () => {
  test('AG-1.6: lens selection updates XState machine', async ({ page }) => {
    // Click seedling
    await page.locator('button:has-text("🌱")').click();

    // Select a lens (e.g., engineer)
    await page.locator('[data-testid="lens-option-engineer"]').click();

    // Verify XState machine updated
    await waitForLensUpdate(page, 'infrastructure-engineer');
  });

  test('AG-1.7: reality object resolves with lens-specific content', async ({ page }) => {
    await page.goto('/?lens=engineer');

    // Verify quantum interface returned valid reality
    const headline = await page.locator('[data-waveform-headline]').textContent();
    expect(headline).toBeTruthy();
    expect(headline).not.toBe(''); // Not empty
    // Engineer lens should show technical content
    expect(headline?.toLowerCase()).toMatch(/infrastructure|system|build/);
  });

  test('AG-1.8: WaveformCollapse animates on lens selection', async ({ page }) => {
    await page.goto('/');
    const waveform = page.locator('[data-testid="waveform-collapse"]');

    // Initial headline
    const initialHeadline = await waveform.locator('[data-waveform-headline]').textContent();

    // Select lens
    await page.locator('button:has-text("🌱")').click();
    await page.locator('[data-testid="lens-option-investor"]').click();

    // Wait for animation
    await page.waitForTimeout(1000); // Animation duration

    // Headline should change
    const newHeadline = await waveform.locator('[data-waveform-headline]').textContent();
    expect(newHeadline).not.toBe(initialHeadline);
  });
});
```

### Phase 3: Behavior Tests (Story 3)

Add tests for edge cases:

```typescript
test.describe('Active Grove User Behaviors', () => {
  test('AG-2.1: rapid lens switching settles correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("🌱")').click();

    // Rapid fire lens changes
    await page.locator('[data-testid="lens-option-engineer"]').click();
    await page.locator('[data-testid="lens-option-investor"]').click();
    await page.locator('[data-testid="lens-option-citizen"]').click();

    // Final lens should be citizen
    await waitForLensUpdate(page, 'concerned-citizen');

    // No console errors
    const logs = await page.evaluate(() => window.__testLogs || []);
    expect(logs.filter(l => l.level === 'error')).toHaveLength(0);
  });

  test('AG-2.4: invalid URL lens falls back gracefully', async ({ page }) => {
    await page.goto('/?lens=invalid-lens-id-12345');

    // Should not crash
    await expect(page.locator('[data-testid="genesis-page"]')).toBeVisible();

    // Should show default content (no lens-specific transformation)
    // OR show lens picker for selection
  });

  test('AG-2.7: corrupted localStorage recovers gracefully', async ({ page }) => {
    // Corrupt the engagement state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('grove-engagement-persist', 'not-valid-json{{{');
    });
    await page.reload();

    // Should not crash
    await expect(page.locator('[data-testid="genesis-page"]')).toBeVisible();

    // Should reset to clean state
    const state = await page.evaluate(() => localStorage.getItem('grove-engagement-persist'));
    expect(state).not.toBe('not-valid-json{{{');
  });
});
```

### Phase 4: Health Checks (Story 4)

Add to `data/infrastructure/health-config.json` in `engagementChecks`:

```json
{
  "id": "active-grove-transformation",
  "name": "Active Grove Content Transformation",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "active-grove.spec.ts:lens selection updates content",
  "impact": "Left column content does not change when lens selected",
  "inspect": "npx playwright test -g 'Content Transformation'"
},
{
  "id": "quantum-interface-lens",
  "name": "Quantum Interface Returns Lens",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "active-grove.spec.ts:useQuantumInterface returns lens",
  "impact": "Hook not connected to XState machine",
  "inspect": "Check useQuantumInterface.ts uses useLensState"
},
{
  "id": "waveform-collapse-triggers",
  "name": "WaveformCollapse Animation Triggers",
  "category": "engagement",
  "type": "e2e-behavior",
  "test": "active-grove.spec.ts:WaveformCollapse animates",
  "impact": "No visual feedback on lens change",
  "inspect": "npx playwright test -g 'WaveformCollapse animates'"
}
```

## Validation Commands

```bash
# Run just Active Grove tests
npx playwright test active-grove --headed

# Run with debug
npx playwright test active-grove --debug

# Run health check
npm run health

# Check for regressions
npx playwright test
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Lens update times out | XState actor not provided | Check EngagementProvider wraps app |
| Waveform headline empty | Reality resolution failed | Check useQuantumInterface gets lens |
| Animation not detected | Timing too fast | Increase waitForTimeout |
| data-testid not found | Missing attribute | Add to component JSX |

## Success Criteria

- [ ] `npx playwright test active-grove` passes all tests
- [ ] Tests run in < 30 seconds
- [ ] 3 consecutive runs with no flakes
- [ ] Health check shows Active Grove status
- [ ] DEVLOG.md documents implementation
