# Execution Prompt: S1-SFR-Shell

**Sprint:** S1-SFR-Shell: Finishing Room Foundation
**Stories:** US-A001 through US-A004 (4 total)
**Effort:** Small (1-2 days)
**Status:** Ready for Execution

---

## Sprint Contract

> **IMPORTANT:** This sprint follows the Grove Execution Protocol. Read and follow this process.

### Pre-Flight Checklist

Before writing any code:

- [ ] Read this entire document
- [ ] Verify you can run `npm run dev` successfully
- [ ] Verify tests pass: `npm test`
- [ ] Create feature branch: `git checkout -b feat/s1-sfr-shell`

### Execution Rules

1. **Atomic Commits** — One commit per user story (US-A001, US-A002, etc.)
2. **Test First** — Write/update tests before implementation
3. **No Scope Creep** — Only implement what's in the stories below
4. **Visual Verification** — Screenshot each completed story
5. **Strangler Fig** — New code goes in `src/surface/components/modals/SproutFinishingRoom/`

### Definition of Done (per story)

- [ ] Acceptance criteria pass (Gherkin scenarios)
- [ ] Tests written and passing
- [ ] No TypeScript errors
- [ ] Screenshot captured
- [ ] Committed with message: `feat(sfr): US-A00X - {title}`

---

## Context

### What We're Building

The **Sprout Finishing Room** is a three-column modal workspace for inspecting and refining research artifacts. This sprint (S1) builds the **foundation shell only** — the responsive container with placeholder panels.

### Layout Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                                │
│  🌱 SPROUT FINISHING ROOM        [Sprout Title...]              [✕ Close] │
├────────────────┬─────────────────────────────────────────┬─────────────────┤
│                │                                         │                 │
│  PROVENANCE    │  DOCUMENT VIEWER                        │  ACTION PANEL   │
│  PANEL         │  (placeholder for S2)                   │  (placeholder   │
│                │                                         │   for S3)       │
│  280px fixed   │  flex: 1                                │  320px fixed    │
│                │                                         │                 │
│  [Placeholder] │  [Placeholder]                          │  [Placeholder]  │
│                │                                         │                 │
└────────────────┴─────────────────────────────────────────┴─────────────────┘
│  STATUS BAR: SPROUT.FINISHING.v1 │ Status: READY │ Created: 2m ago │ [●]  │
└────────────────────────────────────────────────────────────────────────────┘
```

### File Structure to Create

```
src/surface/components/modals/SproutFinishingRoom/
├── index.tsx                 # Main component (this sprint)
├── SproutFinishingRoom.tsx   # Modal container
├── FinishingRoomHeader.tsx   # Header bar
├── FinishingRoomStatus.tsx   # Status bar footer
├── ProvenancePanel.tsx       # Left column (placeholder)
├── DocumentViewer.tsx        # Center column (placeholder)
├── ActionPanel.tsx           # Right column (placeholder)
└── styles.css                # Component styles (Tailwind)
```

### Props Interface

```typescript
interface SproutFinishingRoomProps {
  sprout: Sprout;
  isOpen: boolean;
  onClose: () => void;
}
```

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| > 1280px | Full three-column layout |
| 1024-1279px | Reduced panel widths (240px, 280px) |
| < 1024px | Collapsed provenance (icon-only), stacked panels |
| < 768px | Single column with panel selector tabs |

---

## User Stories

### US-A001: Modal Container Shell

**As an** Explorer
**I want to** see the Finishing Room open as a modal overlay
**So that** I can focus on the research document without leaving my current context

**Acceptance Criteria:**

```gherkin
Scenario: Modal opens with proper overlay
  Given I am on the Surface experience
  When the SproutFinishingRoom component is rendered with isOpen=true
  Then a modal overlay should appear
  And the overlay should have a semi-transparent backdrop
  And the modal should be centered in the viewport
  And clicking the backdrop should call onClose

Scenario: Modal respects isOpen prop
  Given the SproutFinishingRoom component exists
  When isOpen is false
  Then the modal should not be visible in the DOM
```

**Implementation Notes:**
- Use existing modal patterns from codebase if available
- Backdrop color: `bg-black/50` or similar
- Modal should prevent body scroll when open

---

### US-A002: Three-Column Layout

**As an** Explorer
**I want to** see the Finishing Room in a clear three-column layout
**So that** I can easily navigate between provenance, content, and actions

**Acceptance Criteria:**

```gherkin
Scenario: Three columns render at desktop width
  Given the viewport is wider than 1280px
  When the Finishing Room modal is open
  Then I should see three distinct columns
  And the left column (Provenance) should be 280px wide
  And the center column (Document) should fill remaining space
  And the right column (Actions) should be 320px wide

Scenario: Columns have placeholder content
  Given the modal is open
  Then each column should display a placeholder indicating its purpose:
    | Column | Placeholder Text |
    | Left | "Provenance Panel (S2)" |
    | Center | "Document Viewer (S2)" |
    | Right | "Action Panel (S3)" |
```

**Implementation Notes:**
- Use CSS Grid or Flexbox
- Left: `w-[280px] flex-shrink-0`
- Center: `flex-1`
- Right: `w-[320px] flex-shrink-0`

---

### US-A003: Close Modal via Button or Escape

**As an** Explorer
**I want to** close the Finishing Room via close button or Escape key
**So that** I can return to my previous context quickly

**Acceptance Criteria:**

```gherkin
Scenario: Close button in header
  Given the Finishing Room modal is open
  When I click the close button (✕) in the header
  Then the onClose callback should be invoked
  And the modal should close

Scenario: Escape key closes modal
  Given the Finishing Room modal is open
  And the modal has focus
  When I press the Escape key
  Then the onClose callback should be invoked

Scenario: Focus trap within modal
  Given the Finishing Room modal is open
  When I press Tab repeatedly
  Then focus should cycle through interactive elements within the modal
  And focus should NOT escape to elements behind the modal
```

**Implementation Notes:**
- Add `useEffect` for Escape key listener
- Implement focus trap (consider `@radix-ui/react-focus-scope` or manual implementation)
- Close button should be visible and have `aria-label="Close"`

---

### US-A004: Status Bar Displays Metadata

**As an** Explorer
**I want to** see status information in the footer bar
**So that** I understand the state and freshness of the research document

**Acceptance Criteria:**

```gherkin
Scenario: Status bar shows version tag
  Given the Finishing Room modal is open
  Then the status bar should display "SPROUT.FINISHING.v1"

Scenario: Status bar shows sprout status
  Given I have a sprout with status "ready"
  When the Finishing Room opens
  Then the status bar should display "Status: READY"

Scenario: Status bar shows relative timestamp
  Given I have a sprout created 5 minutes ago
  When the Finishing Room opens
  Then the status bar should display "Created: 5m ago"

Scenario: Status bar shows health indicator
  Given the Finishing Room modal is open
  Then a green pulse indicator should be visible
  And it should have aria-label="System healthy"
```

**Implementation Notes:**
- Use relative time formatting (e.g., `formatDistanceToNow` from date-fns or custom)
- Pulse indicator: green dot with CSS animation
- Status bar height: ~32-40px

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| `role="dialog"` | On modal container |
| `aria-modal="true"` | On modal container |
| `aria-labelledby` | Points to header title ID |
| Focus trap | Tab cycles within modal |
| Escape to close | Keyboard handler |
| Reduced motion | Respect `prefers-reduced-motion` for animations |

---

## Test File

Create: `tests/e2e/sprout-finishing-room.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('S1-SFR-Shell: Finishing Room Foundation', () => {

  test('US-A001: Modal opens with overlay', async ({ page }) => {
    // TODO: Implement
  });

  test('US-A002: Three-column layout renders', async ({ page }) => {
    // TODO: Implement
  });

  test('US-A003: Close via button and Escape', async ({ page }) => {
    // TODO: Implement
  });

  test('US-A004: Status bar displays metadata', async ({ page }) => {
    // TODO: Implement
  });

});
```

---

## Dependencies

### Required Imports

```typescript
// Existing
import { Sprout } from '@core/schema/sprout';

// New (create if needed)
import { useFinishingRoom } from './hooks/useFinishingRoom';
```

### No External Packages Required

This sprint uses only existing dependencies. Do NOT add new npm packages.

---

## Screenshots Required

Capture and save to `docs/sprints/sprout-finishing-room-v1/screenshots/`:

1. `s1-modal-open.png` — Modal open with three columns visible
2. `s1-responsive-tablet.png` — Layout at 1024px width
3. `s1-responsive-mobile.png` — Layout at 768px width
4. `s1-status-bar.png` — Close-up of status bar

---

## Commit Sequence

```bash
# After each story
git add .
git commit -m "feat(sfr): US-A001 - Modal container shell"
git commit -m "feat(sfr): US-A002 - Three-column layout"
git commit -m "feat(sfr): US-A003 - Close modal via button/Escape"
git commit -m "feat(sfr): US-A004 - Status bar displays metadata"

# Final
git push origin feat/s1-sfr-shell
```

---

## Completion Checklist

Before marking sprint complete:

- [ ] All 4 stories implemented
- [ ] All acceptance criteria pass
- [ ] Tests written and passing (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Screenshots captured
- [ ] Code reviewed (self or peer)
- [ ] PR created with summary of changes

---

## References

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — Full product specification
- [USER_STORIES.md](./USER_STORIES.md) — All user stories with Gherkin criteria
- [WIREFRAME](../../design-system/SPROUT_FINISHING_ROOM_WIREFRAME.md) — Visual layout reference
- [HTML Mockup](./MOCKUP.html) — Interactive prototype

---

## Questions?

If blocked or unclear on any requirement:
1. Check the PRODUCT_SPEC.md first
2. Check existing modal patterns in codebase
3. Ask in the sprint channel

**Do not** make assumptions that expand scope. When in doubt, implement the minimal version that satisfies the acceptance criteria.
