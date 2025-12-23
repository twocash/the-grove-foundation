# Engagement Architecture Migration - Test Strategy

**Created**: 2024-12-23
**Sprint**: active-grove-polish-v2
**Purpose**: Define testing approach that survives implementation changes

---

## The Problem

We're migrating from a 694-line NarrativeEngineContext monolith to a clean, declarative engagement architecture. Our E2E tests were written against the old FAB-based Terminal architecture, which means:

1. **18 of 40 tests failed** after Active Grove refactor
2. Tests checked implementation details (`translate-x-0`) not behavior
3. Tests coupled to obsolete UI elements (FAB button)
4. Tests will break again during Phase 2 (NarrativeEngine refactor)

## The Solution: Behavior-Focused Testing

### Test What Users See, Not How It's Built

```typescript
// BAD: Tests implementation details
await expect(terminalDrawer).toHaveClass(/translate-x-0/)  // Will break when CSS changes

// GOOD: Tests user-visible outcome
await expect(terminalPanel).toBeVisible()  // Survives implementation changes
```

### The Behavior-First Contract

Tests should validate **user-visible behavior**:

| Behavior | Valid Test | Invalid Test |
|----------|------------|--------------|
| Terminal is open | `toBeVisible()` | `toHaveClass('translate-x-0')` |
| User can type | `await input.fill(); expect(input).toHaveValue()` | Check specific DOM structure |
| Lens is selected | Content contains lens-specific text | Check localStorage keys |
| Navigation works | User reaches expected page | Check internal routing state |

---

## Migration Status

### Test Files

| File | Status | Reason |
|------|--------|--------|
| `smoke.spec.ts` | **Keep** | Architecture-agnostic |
| `active-grove.spec.ts` | **Keep** | Uses correct Active Grove selectors |
| `genesis-terminal.spec.ts` | **Deprecated** | FAB-based, uses `translate-x-*` |
| `terminal-lens-flow.spec.ts` | **Deprecated** | FAB-based, uses `translate-x-*` |
| `engagement-behaviors.spec.ts` | **New** | Behavior-focused, migration-safe |

### Deprecated Tests Location

Deprecated tests are preserved in `tests/e2e/deprecated/` with:
- Full header documentation explaining deprecation reason
- `test.describe.skip()` wrapper to prevent execution
- Reference for understanding original test intent

---

## Test Architecture

### Directory Structure

```
tests/e2e/
├── smoke.spec.ts              # Basic page load, navigation
├── active-grove.spec.ts       # Split layout, tree click, responsive
├── engagement-behaviors.spec.ts  # NEW: Behavior-focused tests
└── deprecated/
    ├── genesis-terminal.spec.ts  # Skipped, FAB-era tests
    └── terminal-lens-flow.spec.ts  # Skipped, FAB-era tests
```

### Helper Functions (engagement-behaviors.spec.ts)

```typescript
/**
 * Opens terminal via Active Grove tree click
 * Migration-safe: works regardless of split layout implementation
 */
async function openTerminalViaTree(page: Page) {
  const tree = page.locator('button:has-text("🌱")').first()
  await tree.click()

  // Wait for BEHAVIOR (terminal visible) not IMPLEMENTATION (specific class)
  const terminalPanel = page.locator('.terminal-panel')
  await expect(terminalPanel).toBeVisible({ timeout: 5000 })
  return terminalPanel
}

/**
 * Validates terminal content without assuming structure
 */
async function terminalContainsText(page: Page, text: string | RegExp) {
  const terminalPanel = page.locator('.terminal-panel')
  const content = await terminalPanel.textContent()
  if (typeof text === 'string') {
    expect(content).toContain(text)
  } else {
    expect(content).toMatch(text)
  }
}
```

---

## Behavior Categories

### 1. Active Grove Flow Behaviors

| Behavior | Test Description |
|----------|------------------|
| Page loads in hero mode | Hero section visible, terminal hidden |
| Tree click opens terminal | Split layout, terminal panel visible |
| Lens picker appears | Terminal shows lens selection UI |
| Lens selection skips picker (URL) | `?lens=engineer` → no picker shown |
| Navigation unlocks after lens | Can scroll to section 2 after selection |

### 2. Terminal Content Behaviors

| Behavior | Test Description |
|----------|------------------|
| Welcome message appears | Initial message contains expected text |
| Lens-specific content | Engineer lens shows "Technical Documentation" |
| Input field works | Can type text, value is preserved |
| Commands typed | `/help` command value in input |

### 3. URL Parameter Behaviors

| Behavior | Test Description |
|----------|------------------|
| Valid lens applied | `?lens=academic` → academic content |
| Invalid lens ignored | `?lens=invalid` → picker shown |
| Lens persists on refresh | Select lens → refresh → same lens |

### 4. Accessibility Behaviors

| Behavior | Test Description |
|----------|------------------|
| Tree has ARIA label | "Open the Terminal" accessible name |
| Terminal panel role | `role="complementary"` |
| Input is focusable | Can focus via keyboard |

---

## Test Refactor Contract

When refactoring engagement architecture (Phase 2):

### DO

1. **Keep behavior tests passing** - They define the contract
2. **Update selectors** if element structure changes
3. **Add new behavior tests** for new features
4. **Document selector changes** in this file

### DON'T

1. **Don't delete behavior tests** - They're the source of truth
2. **Don't add implementation-specific assertions**
3. **Don't check internal state** (localStorage, context values)
4. **Don't test CSS classes** unless they indicate semantic state

### Selector Migration Guide

When implementation changes, update selectors here:

| Behavior | Current Selector | Notes |
|----------|------------------|-------|
| Terminal panel | `.terminal-panel` | Role: complementary |
| Tree button | `button:has-text("🌱")` | May change to SVG |
| Lens picker | Text-based content checks | Avoid structure checks |
| Input field | `input[type="text"], textarea` | First in terminal |

---

## Running Tests

```bash
# Run all passing tests
npx playwright test

# Run only behavior tests
npx playwright test engagement-behaviors

# Run with headed browser for debugging
npx playwright test engagement-behaviors --headed

# Run specific test
npx playwright test -g "tree click opens terminal"
```

---

## Future Phases

### Phase 2: NarrativeEngine Refactor (Q2 2025)

When NarrativeEngine is replaced with EngagementContext:

1. **Behavior tests should still pass** - No changes needed
2. **Update helper functions** if tree/terminal selectors change
3. **Add tests for new engagement features** (state machine, events)

### Phase 3: Legacy Cleanup (Q3 2025)

When deprecated files are deleted:

1. **Delete `tests/e2e/deprecated/`** - No longer needed
2. **Archive this migration section** of the doc
3. **Update test count expectations**

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Behavior tests passing | 100% | TBD (after Task 5) |
| Tests checking `toHaveClass` | 0 (in behavior tests) | 0 |
| Tests checking localStorage | 0 (in behavior tests) | 0 |
| Test survival rate across refactors | 100% | N/A |

---

## Related Documents

- `src/surface/hooks/useLensHydration.ts` - Bridge hook with migration docs
- `docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/ARCHITECTURE.md` - Migration roadmap
- `components/Terminal.tsx` - Terminal implementation reference
