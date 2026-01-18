# Test Janitor Quick Reference

## Commands

```bash
# Full run
npx playwright test --project=e2e

# Single file
npx playwright test tests/e2e/smoke.spec.ts

# Single test by name
npx playwright test -g "homepage loads"

# With trace (debugging)
npx playwright test --trace=on

# Show report
npx playwright show-report
```

## Category → Fix Mapping

| Category | Fix Type | Confidence |
|----------|----------|------------|
| `selector` | Update locator | High |
| `timing` | Add waitFor | High |
| `import` | Fix path | High |
| `assertion` | **Ask human** | Low |
| `network` | **Skip** | N/A |

## Selector Preference Order

1. `[data-testid="..."]` (best)
2. `[aria-label="..."]`
3. `[role="..."]`
4. `text=...` (Playwright text selector)
5. `#id` (if stable)
6. Avoid: `.class`, `nth-child`, xpath

## Timing Patterns

```typescript
// Wait for element
await page.waitForSelector('#element', { state: 'visible' });

// Wait for navigation
await page.waitForURL('**/expected-path');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Explicit wait (last resort)
await page.waitForTimeout(1000);
```

## @fixme Template

```typescript
/**
 * @fixme: [Brief description of failure]
 * Error: [Exact error message]
 * Attempted: [What fixes were tried]
 * Needs: [What human should investigate]
 */
test.skip('test name', async ({ page }) => {
```

## Report Structure

```markdown
# Test Janitor Report
**Date:** YYYY-MM-DD
**Branch:** feature/xxx

## Summary
| Status | Count |
|--------|-------|
| Fixed | X |
| @fixme | X |
| Needs Human | X |

## Details
[Per-test breakdown]
```

## Safety Checklist

- [ ] Not on main branch
- [ ] Git status clean
- [ ] Config loaded
- [ ] Report generated
- [ ] Changes NOT auto-committed
