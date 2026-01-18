# Sprint Breakdown — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Duration:** 5 days  
**Date:** 2024-12-29

---

## Epic 1: The Grasp (Day 1) — HIGH RISK

**Goal:** Text selection triggers Magnetic Pill with fluid positioning.

**Risk Level:** HIGH — Proves core interaction pattern. If this doesn't feel right, sprint fails.

---

### Story 1.1: Create declarative config structure

**Task:** Create extraction-ready config file for capture behavior.

**File:** `src/features/kinetic/config/sprout-capture.config.ts`

**Acceptance:**
- [ ] Config exports `SPROUT_CAPTURE_CONFIG` object
- [ ] Structure mirrors future JSON schema
- [ ] TEMPORARY comment documents extraction path
- [ ] Animation timing values defined
- [ ] UI configuration values defined

**Tests:** N/A (static config)

---

### Story 1.2: Implement useTextSelection hook

**Task:** Create selection detection hook with `useLayoutEffect`.

**File:** `src/features/kinetic/hooks/useTextSelection.ts`

**Acceptance:**
- [ ] Returns `null` when no selection
- [ ] Returns `SelectionState` with text, rect, messageId, contextSpan
- [ ] Uses `useLayoutEffect` (not useEffect)
- [ ] Filters: only selections inside container with `[data-message-id]`
- [ ] Debounces rapid selection changes (50ms)
- [ ] Clears on click outside selection

**Tests:**
- Unit: Selection state updates correctly
- Unit: Filters UI chrome selections
- Manual: No 1-frame position flash

---

### Story 1.3: Implement MagneticPill component

**Task:** Create floating button with magnetic spring physics.

**File:** `src/features/kinetic/components/MagneticPill.tsx`

**Acceptance:**
- [ ] Renders at provided position
- [ ] Uses Framer Motion for spring physics
- [ ] Scales 1.0 → 1.15 when mouse within 50px
- [ ] Uses `layoutId` prop for shared element transition
- [ ] Uses `--pill-*` tokens for styling
- [ ] Glass-inspired aesthetic

**Tests:**
- Visual: Pill appears at selection end
- Animation: Smooth scale on hover
- A11y: Focusable, has label

---

### Story 1.4: Handle viewport collision

**Task:** Prevent pill from rendering outside viewport bounds.

**File:** Within `useTextSelection.ts` or `MagneticPill.tsx`

**Acceptance:**
- [ ] Pill stays within viewport horizontally
- [ ] Pill stays within viewport vertically
- [ ] Smooth adjustment, not jarring jump

**Tests:**
- Select text near right edge → pill visible
- Select text near bottom → pill visible

---

### Story 1.5: Wire into KineticStream

**Task:** Integrate selection hook and pill into stream.

**File:** `src/features/kinetic/KineticStream.tsx`

**Acceptance:**
- [ ] Stream has ref passed to useTextSelection
- [ ] MagneticPill renders when selection exists
- [ ] Pill dismisses when selection cleared

**Tests:**
- E2E: Select text in stream → pill appears
- E2E: Click outside → pill disappears

---

### E2E Tests (Epic 1)

Create `tests/e2e/sprout-capture.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sprout Capture - Selection', () => {
  test('pill appears when text is selected in message', async ({ page }) => {
    await page.goto('/terminal');
    
    // Select text within a message
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    
    // Pill should be visible
    await expect(page.getByLabel('Capture as Sprout')).toBeVisible();
  });

  test('pill does not appear when selecting UI chrome', async ({ page }) => {
    await page.goto('/terminal');
    
    // Select text in header/nav (no data-message-id)
    const header = page.locator('header').first();
    await header.selectText();
    
    // Pill should NOT appear
    await expect(page.getByLabel('Capture as Sprout')).not.toBeVisible();
  });

  test('pill dismisses when clicking outside', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await expect(page.getByLabel('Capture as Sprout')).toBeVisible();
    
    // Click outside
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    
    await expect(page.getByLabel('Capture as Sprout')).not.toBeVisible();
  });
});
```

### Build Gate (Epic 1)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Selection"
# All tests should pass
```

---

## Epic 2: The Seed Packet (Day 2)

**Goal:** Capture card with context auto-fill and smooth transition.

---

### Story 2.1: Implement SproutCaptureCard component

**Task:** Create glass capture form with preview, lens badge, tag input.

**File:** `src/features/kinetic/components/SproutCaptureCard.tsx`

**Acceptance:**
- [ ] Glass-inspired styling with `--capture-card-*` tokens
- [ ] Shows truncated preview (max 100 chars)
- [ ] Shows lens badge (non-editable, auto-captured)
- [ ] Tag input with visual chips
- [ ] "Plant Sprout" button with 🌱 icon
- [ ] ESC dismisses card

**Layout:**
```
┌─────────────────────────────────────┐
│ 🌱 "The ratchet effect means..."    │
├─────────────────────────────────────┤
│ 📌 Economics                        │
├─────────────────────────────────────┤
│ Tags: [insight] [ratchet] [+]       │
├─────────────────────────────────────┤
│              [Plant Sprout] 🌱      │
└─────────────────────────────────────┘
```

**Tests:**
- Visual: Matches design spec
- A11y: Focus trap while open
- A11y: ESC closes

---

### Story 2.2: Implement layoutId transition

**Task:** Smooth expand animation from pill to card.

**Files:** `MagneticPill.tsx`, `SproutCaptureCard.tsx`

**Acceptance:**
- [ ] Both components share `layoutId="sprout-capture"`
- [ ] Pill morphs into card smoothly
- [ ] Card morphs back to pill on cancel
- [ ] Animation ~200ms

**Tests:**
- Animation: Smooth morph, no jarring cuts

---

### Story 2.3: Auto-capture context

**Task:** Read lens, journey, messageId from hooks and DOM.

**File:** Within `SproutCaptureCard.tsx`

**Acceptance:**
- [ ] Reads `activeLens` from `useQuantumInterface`
- [ ] Reads `activeJourney` from engagement state (if available)
- [ ] Extracts `messageId` from closest `[data-message-id]` ancestor
- [ ] Builds `SproutProvenance` object

**Tests:**
- Unit: Provenance populated with correct values

---

### Story 2.4: Tag input behavior

**Task:** Implement comma/Enter tag handling.

**File:** Within `SproutCaptureCard.tsx`

**Acceptance:**
- [ ] Type "foo," → "foo" tag added, input cleared
- [ ] Type "bar" + Enter → "bar" tag added
- [ ] Empty input + Enter → form submits
- [ ] Click tag × → tag removed
- [ ] Max 10 tags (from config)

**Tests:**
- Unit: Comma adds tag
- Unit: Enter on text adds tag
- Unit: Enter on empty submits

---

### Story 2.5: Implement useSproutCapture hook

**Task:** Orchestrate capture state and actions.

**File:** `src/features/kinetic/hooks/useSproutCapture.ts`

**Acceptance:**
- [ ] Tracks `isCapturing` state
- [ ] `startCapture(selection)` begins flow
- [ ] `confirmCapture(tags)` creates sprout, triggers animation
- [ ] `cancelCapture()` returns to pill state

**Tests:**
- Unit: State transitions correctly

---

### Story 2.6: Update Sprout schema

**Task:** Add SproutProvenance interface, extend Sprout.

**File:** `src/core/schema/sprout.ts`

**Acceptance:**
- [ ] `SproutProvenance` interface added
- [ ] `Sprout` interface extended with `provenance` field
- [ ] Deprecated fields marked with JSDoc `@deprecated`
- [ ] Type exports updated

**Tests:**
- TypeScript: No type errors

---

### E2E Tests (Epic 2)

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Card', () => {
  test('capture card opens when pill is clicked', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    // Card should be visible
    await expect(page.getByText('Plant Sprout')).toBeVisible();
    await expect(page.getByRole('button', { name: /Plant Sprout/i })).toBeVisible();
  });

  test('ESC dismisses capture card', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    await expect(page.getByText('Plant Sprout')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Plant Sprout')).not.toBeVisible();
  });

  test('tags can be added with comma', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    await page.getByPlaceholder('Add tags').fill('insight,');
    await expect(page.getByText('insight').first()).toBeVisible();
  });
});
```

### Build Gate (Epic 2)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Card"
```

---

## Epic 3: The Tray (Day 3)

**Goal:** Visible container with flight animation and spring counter.

---

### Story 3.1: Implement sproutStore (Zustand)

**Task:** Create persisted store for sprouts.

**File:** `src/features/kinetic/store/sproutStore.ts`

**Acceptance:**
- [ ] Uses Zustand with persist middleware
- [ ] `addSprout` returns new ID
- [ ] `removeSprout` by ID
- [ ] `updateSprout` with partial updates
- [ ] Selector: `getSproutsBySession`
- [ ] Persists to localStorage key `grove-sprouts`

**Tests:**
- Unit: CRUD operations work
- Unit: Data survives simulated refresh

---

### Story 3.2: Implement SproutTray component

**Task:** Create right-edge drawer with expand/collapse.

**File:** `src/features/kinetic/components/SproutTray.tsx`

**Acceptance:**
- [ ] 48px collapsed, 240px expanded
- [ ] Hover expands (with delay)
- [ ] Click expands (instant)
- [ ] Click outside collapses
- [ ] Uses `--tray-*` tokens
- [ ] Glass-inspired aesthetic

**Tests:**
- Visual: Correct widths in each state
- Interaction: Hover/click expand works

---

### Story 3.3: Implement SproutCard component

**Task:** Compact sprout display for tray.

**File:** `src/features/kinetic/components/SproutCard.tsx`

**Acceptance:**
- [ ] Shows content preview (truncated)
- [ ] Shows tags as chips
- [ ] Shows relative time ("2m ago")
- [ ] Delete action (hover reveal)
- [ ] Uses `--card-*` tokens
- [ ] Glass-inspired aesthetic

**Tests:**
- Visual: Content displays correctly
- Interaction: Delete reveals on hover

---

### Story 3.4: Implement flight animation

**Task:** Card → orb → bezier curve → tray sequence.

**File:** `src/features/kinetic/animations/sproutFlight.ts`

**Animation Sequence:**
1. Card shrinks to 24×24 glowing orb (100ms)
2. Orb flies on bezier curve to tray (350ms)
3. Tray border pulses if collapsed
4. Counter badge springs
5. Orb fades, SproutCard fades in at top (50ms)

**Acceptance:**
- [ ] Total duration ~500ms
- [ ] Bezier creates natural "toss" arc
- [ ] 60fps throughout
- [ ] Interruptible if user clicks elsewhere

**Tests:**
- Animation: Smooth 60fps
- Visual: Orb lands in tray

---

### Story 3.5: Counter badge spring

**Task:** Badge scales 1→1.5→1 on increment.

**File:** Within `SproutTray.tsx`

**Acceptance:**
- [ ] Uses Framer Motion spring
- [ ] Stiffness: 500, damping: 15
- [ ] Triggers on sprout count change

**Tests:**
- Animation: Visible spring on new sprout

---

### Story 3.6: Empty state

**Task:** Show guide when no sprouts.

**File:** Within `SproutTray.tsx`

**Acceptance:**
- [ ] Shows "Select text to plant sprouts 🌱"
- [ ] Subtle, not intrusive
- [ ] Disappears when first sprout added

**Tests:**
- Visual: Empty state shows when empty

---

### Story 3.7: Add tray tokens to globals.css

**Task:** Add `--tray-*` and `--pill-*` token namespaces.

**File:** `src/app/globals.css`

**Acceptance:**
- [ ] All tokens from MIGRATION.md added
- [ ] Values match glass-inspired aesthetic

**Tests:**
- Visual: Components use tokens correctly

---

### Story 3.8: Wire tray into KineticShell

**Task:** Render SproutTray in shell.

**File:** `src/features/kinetic/KineticShell.tsx`

**Acceptance:**
- [ ] SproutTray renders as right-edge element
- [ ] Positioned absolutely, doesn't affect layout
- [ ] Z-index above content, below modals

**Tests:**
- Visual: Tray visible at right edge

---

### E2E Tests (Epic 3)

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Tray', () => {
  test('sprout appears in tray after capture', async ({ page }) => {
    await page.goto('/terminal');
    
    // Complete capture flow
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await page.getByRole('button', { name: /Plant Sprout/i }).click();
    
    // Tray should show sprout
    const tray = page.locator('[data-testid="sprout-tray"]');
    await expect(tray.getByText(message.textContent().slice(0, 20))).toBeVisible();
  });

  test('tray expands on hover', async ({ page }) => {
    await page.goto('/terminal');
    
    const tray = page.locator('[data-testid="sprout-tray"]');
    await tray.hover();
    
    // Should expand to show "Sprouts" label
    await expect(tray.getByText('Sprouts')).toBeVisible();
  });

  test('sprouts persist after refresh', async ({ page }) => {
    await page.goto('/terminal');
    
    // Create a sprout
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await page.getByRole('button', { name: /Plant Sprout/i }).click();
    
    // Refresh and verify
    await page.reload();
    const tray = page.locator('[data-testid="sprout-tray"]');
    await tray.hover();
    await expect(tray.locator('[data-testid="sprout-card"]')).toHaveCount(1);
  });
});
```

### Visual Baseline Capture (Epic 3)

Create `tests/e2e/kinetic-baseline.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kinetic Visual Baselines', () => {
  test('tray collapsed state', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page.locator('[data-testid="sprout-tray"]')).toHaveScreenshot('tray-collapsed.png');
  });

  test('tray expanded state', async ({ page }) => {
    await page.goto('/terminal');
    await page.locator('[data-testid="sprout-tray"]').hover();
    await expect(page.locator('[data-testid="sprout-tray"]')).toHaveScreenshot('tray-expanded.png');
  });

  test('capture card state', async ({ page }) => {
    await page.goto('/terminal');
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await expect(page.locator('[data-testid="capture-card"]')).toHaveScreenshot('capture-card.png');
  });
});
```

### Build Gate (Epic 3)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Tray"

# Capture visual baselines (first run)
npx playwright test tests/e2e/kinetic-baseline.spec.ts --update-snapshots
```

---

## Epic 4: Pilot's Controls (Day 4)

**Goal:** Keyboard shortcuts with visual feedback.

---

### Story 4.1: Implement useKineticShortcuts hook

**Task:** Global keyboard listener for shortcuts.

**File:** `src/features/kinetic/hooks/useKineticShortcuts.ts`

**Shortcuts:**
| Key | Modifiers | Action |
|-----|-----------|--------|
| `l` | cmd/ctrl | Open LensPicker |
| `j` | cmd/ctrl | Open JourneyBrowser |
| `s` | cmd/ctrl | Capture selection |
| `/` | cmd/ctrl | Show KeyboardHUD |

**Acceptance:**
- [ ] Detects cmd (Mac) / ctrl (Windows)
- [ ] Prevents default browser behavior
- [ ] Only active when Kinetic is focused
- [ ] Extensible shortcut config

**Tests:**
- Unit: Correct events fired
- Unit: Modifiers detected correctly

---

### Story 4.2: Implement useShortcutFeedback hook

**Task:** Visual feedback system for shortcut activation.

**File:** `src/features/kinetic/hooks/useShortcutFeedback.ts`

**Acceptance:**
- [ ] Returns `triggerFeedback(iconId)` function
- [ ] Triggers pulse animation on icon
- [ ] Uses spring physics

**Tests:**
- Visual: Icon pulses on trigger

---

### Story 4.3: Cmd+S capture shortcut

**Task:** Trigger capture when selection exists.

**File:** Within `useKineticShortcuts.ts`

**Acceptance:**
- [ ] With selection → activates capture card
- [ ] Without selection → shows toast "Select text first"
- [ ] Visual feedback on shortcut icon

**Tests:**
- With selection → capture starts
- Without selection → toast shows

---

### Story 4.4: Cmd+L and Cmd+J overlays

**Task:** Open LensPicker and JourneyBrowser.

**File:** Within `useKineticShortcuts.ts`

**Acceptance:**
- [ ] Cmd+L → LensPicker opens with zoom effect
- [ ] Cmd+J → JourneyBrowser opens with zoom effect
- [ ] Icon pulses on activation

**Tests:**
- Cmd+L → LensPicker visible
- Cmd+J → JourneyBrowser visible

---

### Story 4.5: Implement KeyboardHUD component

**Task:** Glass overlay showing shortcut reference.

**File:** `src/features/kinetic/components/KeyboardHUD.tsx`

**Acceptance:**
- [ ] Shows all available shortcuts
- [ ] Glass-inspired aesthetic
- [ ] Cmd+/ opens
- [ ] Any key dismisses
- [ ] ESC dismisses

**Layout:**
```
┌─────────────────────────────────┐
│       Keyboard Shortcuts        │
├─────────────────────────────────┤
│  ⌘L    Switch lens              │
│  ⌘J    Browse journeys          │
│  ⌘S    Capture selection        │
│  ⌘/    Show this help           │
└─────────────────────────────────┘
```

**Tests:**
- Cmd+/ → HUD visible
- Any key → HUD dismisses

---

### Story 4.6: Wire shortcuts into KineticShell

**Task:** Activate shortcut hook in shell.

**File:** `src/features/kinetic/KineticShell.tsx`

**Acceptance:**
- [ ] `useKineticShortcuts` called in shell
- [ ] Feedback targets wired to header icons
- [ ] KeyboardHUD renders conditionally

**Tests:**
- All shortcuts work from shell

---

### E2E Tests (Epic 4)

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Shortcuts', () => {
  test('Cmd+S triggers capture when text selected', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.keyboard.press('Meta+s');
    
    await expect(page.getByText('Plant Sprout')).toBeVisible();
  });

  test('Cmd+S shows toast when no selection', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+s');
    
    await expect(page.getByText('Select text first')).toBeVisible();
  });

  test('Cmd+/ shows keyboard HUD', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+/');
    
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
  });

  test('any key dismisses HUD', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+/');
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible();
  });
});
```

### Build Gate (Epic 4)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Shortcuts"
```

---

## Epic 5: Polish & Integration (Day 5)

**Goal:** Edge cases, deletion, final QA.

---

### Story 5.1: Delete sprout with undo

**Task:** Swipe/click delete with 2-second undo toast.

**File:** Within `SproutCard.tsx` and `SproutTray.tsx`

**Acceptance:**
- [ ] Delete button on hover
- [ ] Click removes from store
- [ ] Toast shows "Sprout deleted" with Undo button
- [ ] Undo within 2s restores sprout
- [ ] After 2s, deletion permanent

**Tests:**
- Delete → sprout removed
- Undo → sprout restored

---

### Story 5.2: Implement sproutAdapter

**Task:** Bridge old flat fields to new provenance.

**File:** `src/features/kinetic/utils/sproutAdapter.ts`

**Acceptance:**
- [ ] `flattenSprout(sprout)` → LegacySprout
- [ ] `nestSprout(legacy)` → Sprout
- [ ] Handles missing fields gracefully

**Tests:**
- Unit: Round-trip conversion works
- Unit: Handles partial data

---

### Story 5.3: Error handling

**Task:** Graceful handling of edge cases.

**Acceptance:**
- [ ] Empty selection → no pill
- [ ] Selection too short (<3 chars) → no pill
- [ ] localStorage full → error toast, no crash
- [ ] Missing messageId → fallback to content hash

**Tests:**
- Edge cases handled gracefully

---

### Story 5.4: Performance audit

**Task:** Ensure 60fps throughout.

**Acceptance:**
- [ ] DevTools Performance: no frames >16ms during animation
- [ ] No layout thrashing during selection
- [ ] Tray expand/collapse smooth

**Tests:**
- DevTools: 60fps verified

---

### Story 5.5: Full flow smoke test

**Task:** End-to-end verification of all acceptance criteria.

**Acceptance:**
- [ ] All 20 acceptance criteria from SPEC.md pass

**Tests:**
- Manual: Full walkthrough documented

---

### Build Gate (Epic 5 — FINAL)

```bash
npm run build
npm test
npx playwright test
# Manual: Full flow walkthrough
# Expected: All acceptance criteria met
```

---

## Summary

| Epic | Day | Stories | Risk |
|------|-----|---------|------|
| 1: The Grasp | 1 | 5 | HIGH |
| 2: The Seed Packet | 2 | 6 | Medium |
| 3: The Tray | 3 | 8 | Medium |
| 4: Pilot's Controls | 4 | 6 | Low |
| 5: Polish | 5 | 5 | Low |

**Total Stories:** 30

---

*Sprint breakdown complete. See EXECUTION_PROMPT.md for handoff.*
