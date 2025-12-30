# SPRINTS: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025
**Goal:** Implement jitter-free, user-aware scrolling that feels like a native OS terminal

---

## Epic 1: Hook Layer (Core Logic)

### Story 1.1: Create useKineticScroll Hook
**Priority:** P0 (Foundation)
**Estimate:** 30 min

**Description:**
Create the headless scroll management hook implementing sticky-release physics.

**Acceptance Criteria:**
- [ ] Hook tracks `isAtBottom` state with 50px threshold
- [ ] Hook provides `scrollRef` and `bottomRef`
- [ ] Hook provides `showScrollButton` state
- [ ] Hook provides `scrollToBottom(smooth?)` function
- [ ] Uses `useLayoutEffect` for jitter-free updates
- [ ] TypeScript types exported

**Files:**
- CREATE: `src/surface/components/KineticStream/hooks/useKineticScroll.ts`
- MODIFY: `src/surface/components/KineticStream/hooks/index.ts`

---

### Story 1.2: Unit Tests for useKineticScroll
**Priority:** P1
**Estimate:** 20 min

**Description:**
Test hook behavior for initial state, streaming detection, and scroll function.

**Acceptance Criteria:**
- [ ] Tests for initial state
- [ ] Tests for refs existence
- [ ] Tests for scrollToBottom function type

**Files:**
- CREATE: `src/surface/components/KineticStream/hooks/__tests__/useKineticScroll.test.ts`

---

## Epic 2: Component Layer

### Story 2.1: Create ScrollAnchor Component
**Priority:** P0 (Foundation)
**Estimate:** 10 min

**Description:**
Create invisible anchor div for reliable `scrollIntoView` targeting.

**Acceptance Criteria:**
- [ ] Renders 1px invisible div
- [ ] Has `aria-hidden="true"`
- [ ] Forwards ref correctly
- [ ] Has `data-testid="scroll-anchor"`

**Files:**
- CREATE: `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx`

---

### Story 2.2: Create ScrollToBottomFab Component
**Priority:** P0 (Foundation)
**Estimate:** 20 min

**Description:**
Create floating action button with streaming indicator.

**Acceptance Criteria:**
- [ ] Glassmorphic circular button
- [ ] ArrowDown icon from Lucide
- [ ] Pulsing green dot when `isStreaming`
- [ ] AnimatePresence fade in/out
- [ ] Click handler calls `onClick`
- [ ] Accessible label

**Files:**
- CREATE: `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx`

---

### Story 2.3: Component Tests
**Priority:** P1
**Estimate:** 20 min

**Description:**
Test ScrollAnchor and ScrollToBottomFab components.

**Acceptance Criteria:**
- [ ] ScrollAnchor renders correctly
- [ ] ScrollAnchor forwards ref
- [ ] ScrollToBottomFab visibility toggle
- [ ] ScrollToBottomFab click handler
- [ ] ScrollToBottomFab streaming indicator

**Files:**
- CREATE: `src/surface/components/KineticStream/Stream/__tests__/ScrollAnchor.test.tsx`
- CREATE: `src/surface/components/KineticStream/CommandConsole/__tests__/ScrollToBottomFab.test.tsx`

---

## Epic 3: Integration Layer

### Story 3.1: Wire KineticRenderer
**Priority:** P0 (Foundation)
**Estimate:** 15 min

**Description:**
Add `bottomRef` prop and render ScrollAnchor at end of stream.

**Acceptance Criteria:**
- [ ] `bottomRef` prop added to interface
- [ ] ScrollAnchor imported and rendered
- [ ] ScrollAnchor is always last child

**Files:**
- MODIFY: `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

---

### Story 3.2: Wire CommandConsole
**Priority:** P0 (Foundation)
**Estimate:** 15 min

**Description:**
Add scroll props and render ScrollToBottomFab.

**Acceptance Criteria:**
- [ ] `showScrollButton`, `onScrollToBottom`, `isStreaming` props added
- [ ] ScrollToBottomFab imported and rendered
- [ ] FAB positioned above input

**Files:**
- MODIFY: `src/surface/components/KineticStream/CommandConsole/index.tsx`

---

### Story 3.3: Wire ExploreShell
**Priority:** P0 (Foundation)
**Estimate:** 20 min

**Description:**
Integrate useKineticScroll hook and wire all refs/handlers.

**Acceptance Criteria:**
- [ ] `useKineticScroll` hook called with correct deps
- [ ] `scrollRef` attached to `<main>`
- [ ] `bottomRef` passed to KineticRenderer
- [ ] Scroll props passed to CommandConsole
- [ ] `scrollToBottom(false)` called on submit

**Files:**
- MODIFY: `src/surface/components/KineticStream/ExploreShell.tsx`

---

## Epic 4: Testing & Verification

### Story 4.1: Integration Tests
**Priority:** P1
**Estimate:** 15 min

**Description:**
Test KineticRenderer with ScrollAnchor integration.

**Files:**
- CREATE: `src/surface/components/KineticStream/Stream/__tests__/KineticRenderer.integration.test.tsx`

---

### Story 4.2: E2E Tests
**Priority:** P2 (Nice to have)
**Estimate:** 30 min

**Description:**
Playwright tests for scroll behavior in browser.

**Files:**
- CREATE: `e2e/kinetic-scroll.spec.ts`

---

## Summary

| Category | Files Created | Files Modified |
|----------|---------------|----------------|
| Hooks | 1 | 1 |
| Components | 2 | 2 |
| Tests | 5 | 0 |
| **Total** | **8** | **3** |

**Estimated Duration:** 2-3 hours

---

## Execution Order

1. **Story 1.1** - useKineticScroll hook (foundation)
2. **Story 2.1** - ScrollAnchor component
3. **Story 2.2** - ScrollToBottomFab component
4. **Story 3.1** - Wire KineticRenderer
5. **Story 3.2** - Wire CommandConsole
6. **Story 3.3** - Wire ExploreShell
7. **Verify** - `npm run build && npm run dev`
8. **Story 1.2, 2.3, 4.1** - Tests
9. **Story 4.2** - E2E (optional)

---

*Sprint plan complete. Proceed to EXECUTION_PROMPT.md*
