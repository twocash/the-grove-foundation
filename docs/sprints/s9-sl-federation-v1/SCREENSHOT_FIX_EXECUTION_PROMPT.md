# Developer Execution Prompt: S9 Screenshot Verification Fix

## Mission

Fix S9-SL-Federation E2E tests so screenshots **prove intended functionality**, not just "page loaded."

**Pattern Reference**: S11-SL-Attribution (earlier today) - same issue, spectacular results after fix.

---

## Your Contract

```
You are acting as DEVELOPER for: S9-SL-Federation Screenshot Verification Fix

MISSION: Add assertions to all 35 E2E tests that verify seeded data is visible,
         then confirm each screenshot shows the asserted values.

FIX PLAN: docs/sprints/s9-sl-federation-v1/SCREENSHOT_VERIFICATION_FIX.md
TEST FILE: tests/e2e/federation-console-v1.spec.ts

EXECUTION PROTOCOL:
1. For each test, add expect() assertions based on seeded data
2. Run test: npx playwright test --grep "US-F00X"
3. If console errors → debug with Chrome MCP
4. Verify screenshot shows asserted values
5. Only move to next test when current screenshot is CORRECT

DONE CRITERIA:
- All 35 tests have assertions matching seeded data
- All 35 screenshots show asserted values (visual confirmation)
- Zero console errors during test run
- REVIEW.html updated with evidence

Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Template: .agent/status/ENTRY_TEMPLATE.md
```

---

## Quick Reference: Seeded Data Values

### Groves (3)
| Name | Status | Trust |
|------|--------|-------|
| Anthropic Research Grove | connected | trusted (85) |
| OpenAI Community Grove | pending | new (25) |
| DeepMind Grove | failed | established (40) |

### Tier Mappings (2)
| Title | Confidence | Status |
|-------|------------|--------|
| Expert ↔ Advanced Mapping | 0.92 | accepted |
| Competent ↔ Intermediate Proposal | 0.75 | proposed |

### Exchanges (3)
| Title | Type | Tokens | Status |
|-------|------|--------|--------|
| AI Safety Research Request | request | 150 | active |
| Training Data Offer | offer | 200 | pending |
| Completed Knowledge Exchange | request | 75 | completed |

### Trust (2)
| Title | Level | Score | Components |
|-------|-------|-------|------------|
| Grove Foundation ↔ Anthropic | trusted | 85 | 95/88/72/90 |
| Grove Foundation ↔ OpenAI | new | 25 | 30/20/25/25 |

---

## Execution Order

Execute tests in this order. **Do not skip ahead.**

### Phase 1: Foundation (2 tests)
```bash
npx playwright test --grep "US-F001" --project=e2e
npx playwright test --grep "US-F002" --project=e2e
```

**US-F001 assertions needed:**
```typescript
const cards = await page.locator('[data-testid="object-card"]').count();
expect(cards).toBe(10);  // 3+2+3+2 = 10 objects
await expect(page.getByText('Anthropic Research Grove')).toBeVisible();
```

**US-F002 assertions needed:**
```typescript
await expect(page.getByRole('tab', { name: /groves/i })).toBeVisible();
await expect(page.getByRole('tab', { name: /mappings/i })).toBeVisible();
// etc.
```

### Phase 2: Groves (3 tests)
```bash
npx playwright test --grep "US-F003" --project=e2e
npx playwright test --grep "US-F004" --project=e2e
npx playwright test --grep "US-F005" --project=e2e
```

### Phase 3: Tier Mappings (2 tests)
```bash
npx playwright test --grep "US-F006" --project=e2e
npx playwright test --grep "US-F007" --project=e2e
```

### Phase 4: Exchanges (3 tests)
```bash
npx playwright test --grep "US-F008" --project=e2e
npx playwright test --grep "US-F009" --project=e2e
npx playwright test --grep "US-F010" --project=e2e
```

### Phase 5: Trust (3 tests)
```bash
npx playwright test --grep "US-F011" --project=e2e
npx playwright test --grep "US-F012" --project=e2e
npx playwright test --grep "US-F013" --project=e2e
```

### Phase 6: CRUD (2 tests)
```bash
npx playwright test --grep "US-F014" --project=e2e
npx playwright test --grep "US-F015" --project=e2e
```

### Phase 7: Search/Filter (2 tests)
```bash
npx playwright test --grep "US-F016" --project=e2e
npx playwright test --grep "US-F017" --project=e2e
```

### Phase 8: Responsive (2 tests)
```bash
npx playwright test --grep "US-F018" --project=e2e
npx playwright test --grep "US-F019" --project=e2e
```

### Phase 9: Remaining Tests
```bash
npx playwright test --grep "US-F02" --project=e2e  # All US-F020 through US-F029
npx playwright test --grep "US-F03" --project=e2e  # All US-F030 through US-F035
```

---

## Debug Protocol

### When a test fails:

1. **Run headed mode:**
   ```bash
   npx playwright test --grep "US-F007" --headed --debug
   ```

2. **Check console for errors** - React errors, missing data, etc.

3. **Verify localStorage:**
   ```javascript
   // In browser console or via Chrome MCP
   JSON.parse(localStorage.getItem('grove-data:federated-grove'))
   ```

4. **Fire up Chrome MCP if needed:**
   ```
   # Navigate
   mcp: chrome navigate http://localhost:5173/bedrock/federation

   # Check localStorage
   mcp: chrome evaluate "JSON.stringify(Object.keys(localStorage))"

   # Get console errors
   mcp: chrome get-console-logs

   # Screenshot for comparison
   mcp: chrome screenshot
   ```

### Common Issues:

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Cards count is 0 | Data not loading from localStorage | Check storage key names |
| Text not visible | Element exists but wrong selector | Use `.getByText()` or `.getByRole()` |
| Connection status missing | Badge component not rendering | Check component implementation |
| Confidence score 0 | Wrong field being displayed | Check payload vs meta |

---

## Screenshot Verification Checklist

After each test passes, open the screenshot and verify:

- [ ] **US-F001**: Shows "Anthropic Research Grove" and object count
- [ ] **US-F003**: Shows all 3 grove names
- [ ] **US-F004**: Shows "connected", "pending", "failed" badges
- [ ] **US-F007**: Shows "0.92" or "92%" confidence
- [ ] **US-F009**: Shows "150", "200", "75" token values
- [ ] **US-F012**: Shows trust score breakdown (95/88/72/90)
- [ ] **US-F013**: Shows "trusted" and "new" level badges
- [ ] **US-F016**: Search for "Anthropic" shows only Anthropic items

---

## Status Entry Template

After completing a phase, update status:

```yaml
---
timestamp: {current ISO timestamp}
sprint: s9-sl-federation-v1-screenshot-fix
status: IN_PROGRESS
agent: developer
branch: feat/s9-sl-federation-v1
heartbeat: {current ISO timestamp}
severity: INFO
phase: Phase {N} - {Phase Name}
---

## {timestamp} | S9 Screenshot Fix | Phase {N}

**Agent:** Developer
**Status:** IN_PROGRESS
**Summary:** Fixed assertions for US-F0XX through US-F0XX

**Tests Fixed:** {list}
**Screenshots Verified:** {count}
**Console Errors:** 0

**Next:** Phase {N+1}
```

---

## Final Verification

When all 35 tests are fixed:

```bash
# Run full suite
npx playwright test federation-console-v1.spec.ts --project=e2e

# Expected output:
# Running 35 tests using N workers
# 35 passed
# 0 console errors
```

Then update REVIEW.html with new evidence.

---

## Reference Files

- **Fix Plan**: `docs/sprints/s9-sl-federation-v1/SCREENSHOT_VERIFICATION_FIX.md`
- **Test File**: `tests/e2e/federation-console-v1.spec.ts`
- **Screenshots**: `docs/sprints/s9-sl-federation-v1/screenshots/e2e/`
- **S11 Pattern**: `tests/e2e/s11-sl-attribution/_test-data.ts` (reference implementation)

---

**CRITICAL**: Do not batch screenshot verification. Verify EACH screenshot before moving to the next test. This is how S11 achieved spectacular results.
