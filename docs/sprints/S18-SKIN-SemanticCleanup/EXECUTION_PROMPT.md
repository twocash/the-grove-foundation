# S18-SKIN-SemanticCleanup Execution Prompt

**For:** Claude Code Developer Agent
**Sprint:** S18-SKIN-SemanticCleanup
**Protocol:** Grove Execution Protocol v1.5

---

## Mission

You are executing sprint **S18-SKIN-SemanticCleanup** - a strangler-fig cleanup sprint to replace 294 hardcoded Tailwind color classes with semantic CSS variables across 68 files in `src/bedrock/`, then remove the 180+ line CSS workaround from `globals.css`.

**Contract:** `docs/sprints/s18-skin-semanticcleanup/SPEC.md`
**User Stories:** `docs/sprints/s18-skin-semanticcleanup/USER_STORIES.md`

---

## Execution Contract Summary

### What We're Building
- Replace hardcoded Tailwind colors (text-teal-400, bg-amber-500/10, etc.) with semantic CSS variables
- Remove CSS remapping workaround from globals.css
- Verify all 4 themes render correctly

### Success Criteria
- Zero hardcoded Tailwind color classes in src/bedrock/
- CSS workaround removed (~180 lines)
- 10 E2E tests passing
- All 4 themes verified (screenshots)
- Build passes

---

## Strangler Fig Compliance

```
FROZEN — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/bedrock/**/*.tsx
└── styles/globals.css (cleanup only)
```

---

## Semantic Variable Mapping

Use this reference for replacements:

| Hardcoded Pattern | Replace With | Context |
|-------------------|--------------|---------|
| `text-teal-*`, `text-emerald-*`, `text-green-*` | `style={{ color: 'var(--semantic-success)' }}` | Success text |
| `bg-teal-*/10`, `bg-emerald-*/20` | `style={{ backgroundColor: 'var(--semantic-success)', opacity: 0.1 }}` | Success bg |
| `text-amber-*`, `text-yellow-*`, `text-orange-*` | `style={{ color: 'var(--semantic-warning)' }}` | Warning text |
| `bg-amber-*/10`, `bg-yellow-*/20` | `style={{ backgroundColor: 'var(--semantic-warning)', opacity: 0.1 }}` | Warning bg |
| `text-red-*`, `text-rose-*` | `style={{ color: 'var(--semantic-error)' }}` | Error text |
| `bg-red-*/10`, `bg-rose-*/20` | `style={{ backgroundColor: 'var(--semantic-error)', opacity: 0.1 }}` | Error bg |
| `text-blue-*`, `text-cyan-*`, `text-sky-*` | `style={{ color: 'var(--semantic-info)' }}` | Info text |
| `bg-blue-*/10`, `bg-cyan-*/20` | `style={{ backgroundColor: 'var(--semantic-info)', opacity: 0.1 }}` | Info bg |
| `text-gray-100`, `text-slate-100` | `style={{ color: 'var(--glass-text-primary)' }}` | Primary text |
| `text-gray-400`, `text-slate-400` | `style={{ color: 'var(--glass-text-secondary)' }}` | Secondary text |
| `text-gray-500`, `text-slate-500` | `style={{ color: 'var(--glass-text-muted)' }}` | Muted text |
| `bg-gray-800/*`, `bg-slate-800/*` | `style={{ backgroundColor: 'var(--glass-surface)' }}` | Surface |
| `bg-gray-900/*`, `bg-slate-900/*` | `style={{ backgroundColor: 'var(--glass-void)' }}` | Void/deep bg |
| `border-gray-*`, `border-slate-*` | `style={{ borderColor: 'var(--glass-border)' }}` | Borders |

---

## Phase Execution

Execute phases in order. Each phase must pass build verification before proceeding.

### Phase 1: Success Colors
```bash
# Find all instances
grep -rn "text-teal-\|text-emerald-\|text-green-\|bg-teal-\|bg-emerald-\|bg-green-\|border-teal-\|border-emerald-\|border-green-" src/bedrock/ --include="*.tsx"

# Replace each instance with semantic variable
# Build after each file batch
npm run build
```

### Phase 2: Warning Colors
```bash
grep -rn "text-amber-\|text-yellow-\|text-orange-\|bg-amber-\|bg-yellow-\|bg-orange-\|border-amber-\|border-yellow-\|border-orange-" src/bedrock/ --include="*.tsx"
npm run build
```

### Phase 3: Error Colors
```bash
grep -rn "text-red-\|text-rose-\|bg-red-\|bg-rose-\|border-red-\|border-rose-" src/bedrock/ --include="*.tsx"
npm run build
```

### Phase 4: Info Colors
```bash
grep -rn "text-blue-\|text-cyan-\|text-sky-\|bg-blue-\|bg-cyan-\|bg-sky-\|border-blue-\|border-cyan-\|border-sky-" src/bedrock/ --include="*.tsx"
npm run build
```

### Phase 5: Neutral Colors
```bash
grep -rn "text-gray-\|text-slate-\|bg-gray-\|bg-slate-\|border-gray-\|border-slate-" src/bedrock/ --include="*.tsx"
npm run build
```

### Phase 6: CSS Cleanup
1. Open `styles/globals.css`
2. Find the Tailwind color interception section (look for comments or `.text-teal-400` rules)
3. Delete all rules that override Tailwind color classes with CSS variables
4. Delete `.bedrock-app { color: var(--glass-text-primary); }` if present
5. Save and build

```bash
npm run build
```

### Phase 7: Verification
1. Create E2E test: `tests/e2e/s18-semantic-cleanup.spec.ts`
2. Run tests: `npx playwright test tests/e2e/s18-semantic-cleanup.spec.ts --project=e2e`
3. Capture 4 theme screenshots
4. Create REVIEW.html

---

## E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('S18-SKIN-SemanticCleanup', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any cached theme
    await page.goto('/bedrock');
  });

  test('TC-01: No hardcoded success colors remain', async ({ page }) => {
    await page.goto('/bedrock');
    const html = await page.content();

    expect(html).not.toMatch(/class="[^"]*text-teal-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*text-emerald-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-teal-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-emerald-\d00[^"]*"/);
  });

  test('TC-02: No hardcoded warning colors remain', async ({ page }) => {
    await page.goto('/bedrock');
    const html = await page.content();

    expect(html).not.toMatch(/class="[^"]*text-amber-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*text-yellow-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-amber-\d00[^"]*"/);
  });

  test('TC-03: No hardcoded error colors remain', async ({ page }) => {
    await page.goto('/bedrock');
    const html = await page.content();

    expect(html).not.toMatch(/class="[^"]*text-red-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*text-rose-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-red-\d00[^"]*"/);
  });

  test('TC-04: No hardcoded info colors remain', async ({ page }) => {
    await page.goto('/bedrock');
    const html = await page.content();

    expect(html).not.toMatch(/class="[^"]*text-blue-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*text-cyan-\d00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-blue-\d00[^"]*"/);
  });

  test('TC-05: No hardcoded neutral colors remain', async ({ page }) => {
    await page.goto('/bedrock');
    const html = await page.content();

    expect(html).not.toMatch(/class="[^"]*text-gray-[1-9]00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*text-slate-[1-9]00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-gray-[1-9]00[^"]*"/);
    expect(html).not.toMatch(/class="[^"]*bg-slate-[1-9]00[^"]*"/);
  });

  const themes = ['quantum-glass', 'zenith-paper', 'living-glass', 'nebula-flux'];

  for (const theme of themes) {
    test(`TC-07-${theme}: Theme renders correctly`, async ({ page }) => {
      await page.goto('/bedrock');

      // Set theme
      await page.evaluate((t) => {
        localStorage.setItem('grove-active-skin', t);
      }, theme);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Capture errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // Screenshot
      await page.screenshot({
        path: `docs/sprints/s18-skin-semanticcleanup/screenshots/${theme}.png`,
        fullPage: true
      });

      // No color/theme errors
      expect(errors.filter(e => e.includes('color') || e.includes('theme'))).toHaveLength(0);
    });
  }
});
```

---

## Status Updates

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`

**On Start:**
```yaml
status: STARTED
phase: Phase 1 - Success Colors
```

**During Work:**
```yaml
status: IN_PROGRESS
phase: Phase {N} - {Name}
heartbeat: {update every 5 min}
```

**On Complete:**
```yaml
status: COMPLETE
phase: Phase 7 - Verification
commit: {hash}
```

---

## Completion Checklist

Before marking COMPLETE, verify:

- [ ] `grep -r "text-teal-\|text-emerald-\|text-amber-\|text-red-\|text-blue-\|text-gray-\|text-slate-" src/bedrock/ --include="*.tsx"` returns empty
- [ ] CSS workaround removed from globals.css
- [ ] `npm run build` passes
- [ ] E2E tests: 10/10 passing
- [ ] Screenshots captured for all 4 themes
- [ ] REVIEW.html created with evidence
- [ ] No console errors on /bedrock

---

## On Completion

1. Write COMPLETE status entry
2. Commit with message: `feat(groveskins): complete semantic color migration in bedrock`
3. Push to branch
4. Notify Sprintmaster (do NOT update Notion directly)

---

*Execute with precision. Verify at each phase. The strangler fig grows one branch at a time.*
