# Execution Prompt — Object Model Standardization

## Context

The Grove Terminal has inconsistent behavior between Lens and Journey selection flows. Users experience:
1. Extra clicks required (must click "Continue Exploring" after selecting a lens)
2. Missing visual feedback (no highlight on cards when viewing details)
3. Ghost panels (inspector persists after activation)

The root cause is in the list component handlers, not the inspector components.

## Documentation

Sprint documentation in `docs/sprints/object-model-standardization-v1/`:
- `REPO_AUDIT.md` — Current state analysis with root cause identification
- `SPEC.md` — Goals and acceptance criteria
- `ARCHITECTURE.md` — Target state, data flows, style hierarchy
- `MIGRATION_MAP.md` — File-by-file change plan with line numbers
- `DECISIONS.md` — ADRs explaining choices
- `SPRINTS.md` — Story breakdown with test scenarios

## Repository Intelligence

### Key Files (in execution order)

```
src/explore/LensPicker.tsx      # ~420 lines — Primary changes
src/explore/LensInspector.tsx   # ~280 lines — Button handler fix
src/explore/JourneyList.tsx     # ~220 lines — handleStart fix
src/explore/JourneyInspector.tsx # ~180 lines — Reference (no changes)
tests/e2e/object-model-selection.spec.ts  # NEW — E2E tests
```

### Context API (already correct, no changes needed)

```typescript
// WorkspaceUIContext provides these methods
workspaceUI.inspector.isOpen        // boolean
workspaceUI.inspector.mode.type     // 'lens' | 'journey' | 'none'
workspaceUI.inspector.mode.lensId   // string | undefined
workspaceUI.inspector.mode.journeyId // string | undefined
workspaceUI.openInspector(mode)     // Opens inspector
workspaceUI.closeInspector()        // Closes inspector
workspaceUI.navigateTo(path)        // Navigation
```

### Existing E2E Test Patterns

Reference `tests/e2e/terminal-lens-flow.spec.ts` for patterns:
- Use `page.goto('/')` and `page.waitForLoadState('networkidle')`
- Use `page.locator()` with aria-labels or data-testid
- Use `expect().toBeVisible()` and `expect().toHaveClass()`

---

## Execution Order

### Phase 1: Fix Lens Selection Flow

#### 1.1 Fix handleSelect in LensPicker.tsx

**Location**: Find `handleSelect` function (around line 318)

**Current (WRONG)**:
```typescript
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  onAfterSelect?.(personaId);
  // ... compact mode handling ...
  workspaceUI.openInspector({ type: 'lens', lensId: personaId }); // BUG
};
```

**Replace with**:
```typescript
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  onAfterSelect?.(personaId);
  if (mode === 'compact' && onBack) {
    onBack();
  } else if (workspaceUI) {
    workspaceUI.closeInspector();
    workspaceUI.navigateTo(['explore']);
  }
};
```

#### 1.2 Fix button handler in LensInspector.tsx

**Location**: Find the primary action button (around line 215-227)

The button currently has an inline `onClick` that bypasses `handleActivate`. 

**Fix the handleActivate function** (around line 180):
```typescript
const handleActivate = () => {
  selectLens(personaId);
  closeInspector();  // ADD THIS LINE
  navigateTo(['explore']);
};
```

**Then update the button to use it**:
```typescript
<button
  onClick={handleActivate}  // Use the function, not inline handler
  className="w-full py-3 px-4 rounded-xl font-medium text-sm 
    flex items-center justify-center gap-2 transition-all
    bg-primary text-white hover:bg-primary/90 shadow-md"
>
```

#### Verify Phase 1
```bash
npm run build
npm run dev
# Test: Select a lens → should activate, close inspector, show chat
```

---

### Phase 2: Fix Journey Selection Flow

#### 2.1 Fix handleStart in JourneyList.tsx

**Location**: Find `handleStart` function (around line 161)

**Current (INCOMPLETE)**:
```typescript
const handleStart = (journeyId: string) => {
  startJourney(journeyId);
  // ... compact mode handling ...
  workspaceUI.navigateTo(['explore', 'groveProject']); // Missing closeInspector!
};
```

**Replace with**:
```typescript
const handleStart = (journeyId: string) => {
  startJourney(journeyId);
  if (mode === 'compact' && onBack) {
    onBack();
  } else if (workspaceUI) {
    workspaceUI.closeInspector();  // ADD THIS
    workspaceUI.navigateTo(['explore']);
  }
};
```

#### 2.2 Verify JourneyInspector.tsx (no changes needed)

Confirm `handleStart` already has `closeInspector()`:
```typescript
const handleStart = () => {
  startJourney(journeyId);
  navigateTo(['explore']);
  closeInspector();  // Should already exist
};
```

#### Verify Phase 2
```bash
npm run build
npm run dev
# Test: Start a journey → should activate, close inspector, show chat
```

---

### Phase 3: Add Visual Highlight for Inspected State

#### 3.1 Derive inspectedLensId in LensPicker.tsx

**Location**: After the workspaceUI declaration (around line 307)

**Add**:
```typescript
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

#### 3.2 Update LensCard interface and styles

**Find LensCard component** (internal to LensPicker, around line 185)

**Update interface**:
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  isInspected: boolean;  // ADD
  onSelect: () => void;
  onView: () => void;
}
```

**Update className** (replace the border/ring logic):
```typescript
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isInspected
    ? 'ring-2 ring-primary border-primary'
    : isActive
      ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
      : 'border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

#### 3.3 Pass isInspected when rendering LensCard

**Find the grid render loop** (around line 365):
```typescript
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  isInspected={inspectedLensId === persona.id}  // ADD
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

#### 3.4 Update CustomLensCard similarly

Apply same pattern to CustomLensCard but with violet variant:
- Add `isInspected` prop
- Use `ring-2 ring-violet-400 border-violet-400` for inspected state

#### 3.5 Derive inspectedJourneyId in JourneyList.tsx

**Add after workspaceUI declaration**:
```typescript
const inspectedJourneyId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'journey'
) ? workspaceUI.inspector.mode.journeyId : null;
```

#### 3.6 Update JourneyCard

Same pattern as LensCard:
- Add `isInspected: boolean` to interface
- Update className with ring-2 pattern
- Pass `isInspected={inspectedJourneyId === journey.id}`

#### Verify Phase 3
```bash
npm run build
npm run dev
# Test: Click card body → ring appears
# Test: Click different card → ring moves
```

---

### Phase 4: Button Style Consistency

#### 4.1 Update LensCard Select button

**Find the Select button in LensCard** (around line 230):

**Replace className with**:
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

#### 4.2 Update CustomLensCard Select button

**Use violet variant**:
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-violet-500 text-white hover:bg-violet-500/90 transition-colors shadow-sm"
```

#### Verify Phase 4
```bash
npm run build
npm run dev
# Test: Button styles match between Lens and Journey flows
```

---

### Phase 5: E2E Automated Tests

#### 5.1 Create tests/e2e/object-model-selection.spec.ts

```typescript
import { test, expect } from '@playwright/test'

/**
 * Object Model Selection E2E Tests
 * Sprint: Object Model Standardization v1
 *
 * Tests the unified Select → Inspect → Activate → Return flow
 * for both Lens and Journey selection.
 */

test.describe('Object Model Selection - Lens Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('clicking lens card body opens inspector', async ({ page }) => {
    // Navigate to Lenses tab
    const lensesTab = page.locator('button:has-text("Lenses"), [role="tab"]:has-text("Lenses")')
    await lensesTab.click()
    await page.waitForTimeout(500)

    // Click on a lens card body (not the button)
    const lensCard = page.locator('[data-testid="lens-card"]').first()
    await lensCard.click()

    // Verify inspector is visible
    const inspector = page.locator('[data-testid="lens-inspector"], [aria-label="Lens Inspector"]')
    await expect(inspector).toBeVisible({ timeout: 5000 })

    // Verify card has ring highlight
    await expect(lensCard).toHaveClass(/ring-2/)
  })

  test('clicking different lens card moves highlight', async ({ page }) => {
    // Navigate to Lenses tab
    const lensesTab = page.locator('button:has-text("Lenses"), [role="tab"]:has-text("Lenses")')
    await lensesTab.click()
    await page.waitForTimeout(500)

    // Click first lens card
    const firstCard = page.locator('[data-testid="lens-card"]').first()
    await firstCard.click()
    await expect(firstCard).toHaveClass(/ring-2/)

    // Click second lens card
    const secondCard = page.locator('[data-testid="lens-card"]').nth(1)
    await secondCard.click()

    // First card should lose ring, second should have it
    await expect(firstCard).not.toHaveClass(/ring-2/)
    await expect(secondCard).toHaveClass(/ring-2/)
  })

  test('lens Select button activates and closes inspector', async ({ page }) => {
    // Navigate to Lenses tab
    const lensesTab = page.locator('button:has-text("Lenses"), [role="tab"]:has-text("Lenses")')
    await lensesTab.click()
    await page.waitForTimeout(500)

    // Click Select button on a lens card
    const selectButton = page.locator('[data-testid="lens-card"] button:has-text("Select")').first()
    await selectButton.click()

    // Verify inspector is NOT visible (closed)
    const inspector = page.locator('[data-testid="lens-inspector"], [aria-label="Lens Inspector"]')
    await expect(inspector).not.toBeVisible({ timeout: 3000 })

    // Verify we're back at chat/terminal view
    const terminal = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminal).toBeVisible({ timeout: 5000 })
  })

  test('inspector Select Lens button activates and closes', async ({ page }) => {
    // Navigate to Lenses tab
    const lensesTab = page.locator('button:has-text("Lenses"), [role="tab"]:has-text("Lenses")')
    await lensesTab.click()
    await page.waitForTimeout(500)

    // Click lens card body to open inspector
    const lensCard = page.locator('[data-testid="lens-card"]').first()
    await lensCard.click()

    // Click the inspector's Select button
    const inspectorSelectButton = page.locator('[data-testid="lens-inspector"] button:has-text("Select"), [aria-label="Lens Inspector"] button:has-text("Select")')
    await inspectorSelectButton.click()

    // Verify inspector is closed
    const inspector = page.locator('[data-testid="lens-inspector"], [aria-label="Lens Inspector"]')
    await expect(inspector).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Object Model Selection - Journey Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('clicking journey card body opens inspector', async ({ page }) => {
    // Navigate to Journeys tab
    const journeysTab = page.locator('button:has-text("Journeys"), [role="tab"]:has-text("Journeys")')
    await journeysTab.click()
    await page.waitForTimeout(500)

    // Click on a journey card body
    const journeyCard = page.locator('[data-testid="journey-card"]').first()
    await journeyCard.click()

    // Verify inspector is visible
    const inspector = page.locator('[data-testid="journey-inspector"], [aria-label="Journey Inspector"]')
    await expect(inspector).toBeVisible({ timeout: 5000 })

    // Verify card has ring highlight
    await expect(journeyCard).toHaveClass(/ring-2/)
  })

  test('journey Start button activates and closes inspector', async ({ page }) => {
    // Navigate to Journeys tab
    const journeysTab = page.locator('button:has-text("Journeys"), [role="tab"]:has-text("Journeys")')
    await journeysTab.click()
    await page.waitForTimeout(500)

    // Click Start button on a journey card
    const startButton = page.locator('[data-testid="journey-card"] button:has-text("Start")').first()
    await startButton.click()

    // Verify inspector is NOT visible (closed)
    const inspector = page.locator('[data-testid="journey-inspector"], [aria-label="Journey Inspector"]')
    await expect(inspector).not.toBeVisible({ timeout: 3000 })

    // Verify we're back at chat/terminal view
    const terminal = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminal).toBeVisible({ timeout: 5000 })
  })

  test('inspector Start Journey button activates and closes', async ({ page }) => {
    // Navigate to Journeys tab
    const journeysTab = page.locator('button:has-text("Journeys"), [role="tab"]:has-text("Journeys")')
    await journeysTab.click()
    await page.waitForTimeout(500)

    // Click journey card body to open inspector
    const journeyCard = page.locator('[data-testid="journey-card"]').first()
    await journeyCard.click()

    // Click the inspector's Start button
    const inspectorStartButton = page.locator('[data-testid="journey-inspector"] button:has-text("Start"), [aria-label="Journey Inspector"] button:has-text("Start")')
    await inspectorStartButton.click()

    // Verify inspector is closed
    const inspector = page.locator('[data-testid="journey-inspector"], [aria-label="Journey Inspector"]')
    await expect(inspector).not.toBeVisible({ timeout: 3000 })
  })
})
```

**Note on selectors**: The test uses flexible selectors. You may need to adjust based on actual DOM:
- Add `data-testid="lens-card"` to LensCard if not present
- Add `data-testid="journey-card"` to JourneyCard if not present
- Add `data-testid="lens-inspector"` to LensInspector if not present
- Add `data-testid="journey-inspector"` to JourneyInspector if not present

#### 5.2 Add data-testid attributes if needed

If the components don't have test IDs, add them:

**LensCard** (in LensPicker.tsx):
```typescript
<div data-testid="lens-card" className={...}>
```

**JourneyCard** (in JourneyList.tsx):
```typescript
<div data-testid="journey-card" className={...}>
```

**LensInspector**:
```typescript
<div data-testid="lens-inspector" className={...}>
```

**JourneyInspector**:
```typescript
<div data-testid="journey-inspector" className={...}>
```

#### Verify Phase 5
```bash
npm run test:e2e -- --grep "Object Model Selection"
# All new tests should pass
```

---

## Final Verification

### Build Check
```bash
npm run build   # Must pass
npm test        # Existing tests must pass
npm run test:e2e # E2E tests must pass
```

### Manual Test Checklist

Run through scenarios in `SPRINTS.md` that aren't covered by E2E:

1. ☐ Ring highlight uses correct colors (primary vs violet for custom)
2. ☐ Already-active lens shows "Return to Chat" button text
3. ☐ Compact mode selection works via onBack callback

### Update DEVLOG.md

Document test results and any issues encountered.

---

## Forbidden Actions

- **DO NOT** modify `WorkspaceUIContext.tsx` — The API is correct
- **DO NOT** add navigation side effects — Use explicit closeInspector calls
- **DO NOT** change compact mode cards — They don't use inspectors
- **DO NOT** add animations — Out of scope for this sprint
- **DO NOT** skip E2E tests — Testing is required per Foundation Loop

## Commit Strategy

Option A (granular):
```
fix: lens selection closes inspector and returns to chat
fix: lens inspector button properly closes inspector
fix: journey selection closes inspector
feat: cards show ring highlight when inspected
style: button consistency across lens and journey flows
test: add E2E tests for object model selection flows
```

Option B (consolidated):
```
fix: standardize object model selection and activation flows
test: E2E tests for object model selection flows
```
