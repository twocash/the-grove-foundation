# E2E Testing Activation Prompt for S11-SL-Attribution

**Copy and paste this to the active developer session:**

---

```
🚨 QUALITY GATE UPDATE - E2E TESTING REQUIRED (REVISED)

You are implementing S11-SL-Attribution. Your previous test run was REJECTED
because screenshots showed generic pages, not actual feature evidence.

## ⚠️ WHAT WENT WRONG

Screenshots like "navigate to /bedrock/experience, take screenshot" are NOT valid.
You must show THE FEATURE WORKING with actual data visible.

## ✅ WHAT WE NEED

Screenshots must be EVIDENCE that acceptance criteria passed:

| ❌ WRONG | ✅ RIGHT |
|----------|----------|
| Generic page load | Attribution chain showing Grove-A → Grove-B → Grove-C |
| Empty dashboard | Dashboard with metrics: "1,234 tokens", "12 groves" |
| "Page loaded" | Token balance BEFORE (100) and AFTER (150) tier advancement |
| No data visible | Reputation badge showing purple "Legendary" with score 95 |

## 🔧 MANDATORY: SEED LOCALSTORAGE BEFORE TESTS

**CRITICAL:** You MUST seed localStorage with realistic, non-zero values in test.beforeEach().

```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Token balance - specific non-zero value (NOT 0, NOT 100)
    localStorage.setItem('grove-token-balance', JSON.stringify({
      balance: 125, pending: 15
    }));
    // Attribution events - need data to show chains
    localStorage.setItem('grove-attribution-events', JSON.stringify([
      { sourceGrove: 'Grove Alpha', targetGrove: 'Grove Beta', tokens: 50,
        qualityMultiplier: 1.8, percentages: { level1: 60, level2: 40 } }
    ]));
    // Reputation - mid-journey, not default
    localStorage.setItem('grove-reputation', JSON.stringify({
      score: 72, level: 'expert', color: 'blue'
    }));
    // Leaderboard - sorted list with multiple entries
    localStorage.setItem('grove-leaderboard', JSON.stringify([
      { rank: 1, name: 'Grove Phoenix', score: 94, level: 'legendary' },
      { rank: 2, name: 'Grove Atlas', score: 87, level: 'expert' },
      { rank: 3, name: 'Grove Nexus', score: 82, level: 'expert' }
    ]));
    // Dashboard metrics - actual numbers
    localStorage.setItem('grove-dashboard-metrics', JSON.stringify({
      totalTokens: 1847, activeEvents: 23, totalGroves: 142
    }));
  });
});
```

### Data Value Rules

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `balance: 0` | `balance: 125` | Zero looks uninitialized |
| `balance: 100` | `balance: 1,847` | Round numbers look fake |
| `badges: []` | `badges: [{...}, {...}]` | Empty = no verification |
| `progress: 0` | `progress: 0.67` | Shows mid-journey |

## TEST REQUIREMENTS

Each test must:
1. **Seed localStorage** with realistic data in beforeEach (see above)
2. **Navigate to the ATTRIBUTION feature** (not generic pages)
3. **Wait for data to render** (not just page load)
4. **Verify specific values** are visible before screenshot
5. **Screenshot the POPULATED state** showing feature working
6. **Assert expected values** match seeded data

## FILES TO CREATE

tests/e2e/s11-sl-attribution/
├── attribution-tracking.spec.ts     # Epic A
├── token-economy.spec.ts            # Epic B
├── reputation-system.spec.ts        # Epic C
└── economic-dashboard.spec.ts       # Epic D

## SCREENSHOT EVIDENCE REQUIRED

| Screenshot | MUST SHOW (not just "page loaded") |
|------------|-------------------------------------|
| attribution-chain-populated.png | Chain diagram: nodes with percentages "60%", "40%" |
| token-balance-after-reward.png | DIFFERENT balance than before screenshot |
| quality-multiplier-display.png | "Quality: 95 → 2.0x multiplier" visible |
| network-bonus-breakdown.png | Full calculation: Base × Quality × Network = Final |
| reputation-badge-legendary.png | PURPLE badge with crown icon, score 90+ |
| reputation-leaderboard.png | SORTED list with at least 3 groves, names and scores |
| dashboard-overview.png | 4 metric cards with ACTUAL NUMBERS (not loading) |

## READ THE FULL SPEC

docs/sprints/s11-sl-attribution-v1/E2E_TEST_HANDOFF.md

This has detailed templates for each test file with proper data setup.

## EXECUTION STEPS

1. READ: E2E_TEST_HANDOFF.md (full spec with what each screenshot must show)
2. UNDERSTAND: Routes to attribution features (not just /bedrock/experience)
3. SET UP DATA: Either via API calls or UI actions before screenshots
4. RUN TESTS: npx playwright test tests/e2e/s11-sl-attribution/
5. VERIFY SCREENSHOTS: Open each one - does it PROVE the feature works?
6. IF GENERIC → Re-run with proper data setup
7. DEBUG: Fix console errors until zero
8. COMPLETE: REVIEW.html with evidence

## PRE-COMPLETION CHECKLIST

- [ ] **test.beforeEach seeds localStorage** with realistic, non-zero data
- [ ] Data values are realistic (125 tokens, not 0 or 100)
- [ ] Tests navigate to ATTRIBUTION features (not generic pages)
- [ ] Screenshots show seeded data values visible in UI
- [ ] Token screenshots show BEFORE and AFTER (different values)
- [ ] Reputation screenshots show different badge colors/levels
- [ ] Leaderboard shows sorted list with at least 3 groves
- [ ] Dashboard screenshots show populated metrics, not loading
- [ ] ZERO console errors
- [ ] REVIEW.html complete

⚠️ DO NOT mark complete until:
1. localStorage is seeded with realistic data
2. Screenshots show that seeded data rendered correctly
3. ALL screenshots are MEANINGFUL EVIDENCE
```

---

## Why This Matters

The previous test run captured screenshots that could have been taken on any page - they didn't prove the attribution system works. Screenshots are evidence for acceptance criteria, not just proof that navigation works.
