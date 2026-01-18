# Architectural Decisions — Terminal UX v0.12

## ADR-001: Minimize State Architecture

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
The Terminal currently has binary state (open/closed). Users need a way to collapse the Terminal while preserving conversation state, without closing it entirely. This requires introducing a third state.

**Options Considered:**

### Option A: Add `isMinimized` to TerminalState
- **Description:** Extend existing `TerminalState` interface with boolean
- **Pros:** Simple, minimal changes, preserves existing state management
- **Cons:** TerminalState grows; couples UI state with message state

### Option B: Separate UI State from Message State
- **Description:** Create `TerminalUIState` for open/minimized/closed, keep `TerminalState` for messages
- **Pros:** Clean separation of concerns
- **Cons:** More refactoring; two state objects to manage

### Option C: State Machine
- **Description:** Use finite state machine (closed → open → minimized → open → closed)
- **Pros:** Explicit transitions, easier to reason about
- **Cons:** Over-engineering for three states; adds complexity

**Decision:**
Option A — Add `isMinimized: boolean` to existing TerminalState. The simplicity outweighs the coupling concern, and we can refactor later if needed.

**Consequences:**
- `TerminalState` gains one field
- `toggleTerminal` function updated to handle three states
- Message state preserved across all transitions
- FAB must render differently for each state

---

## ADR-002: Pill Component Placement

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
When minimized, the Terminal should show a "pill" at the viewport bottom. Need to decide whether this is part of Terminal.tsx or a separate component, and where it renders in the DOM.

**Options Considered:**

### Option A: Inline in Terminal.tsx
- **Description:** Render pill conditionally within Terminal.tsx
- **Pros:** Access to all Terminal state; no prop drilling
- **Cons:** Terminal.tsx already 1267 lines; adds more conditional rendering

### Option B: Separate TerminalPill.tsx
- **Description:** Extract pill as standalone component, receives minimal props
- **Pros:** Cleaner separation; reusable; testable
- **Cons:** Need to pass state down; slightly more files

### Option C: Portal to Body
- **Description:** Render pill via React portal to document.body
- **Pros:** Guaranteed z-index behavior; outside normal DOM flow
- **Cons:** More complexity; portal management

**Decision:**
Option B — Create `TerminalPill.tsx` as sibling to main drawer. It receives `isMinimized`, `isLoading`, and `onExpand` props. Renders within Terminal.tsx but as a distinct component.

**Consequences:**
- New file: `components/Terminal/TerminalPill.tsx`
- Clean interface between pill and drawer
- Pill can be styled independently
- Terminal.tsx conditionally renders pill vs drawer

---

## ADR-003: Header Simplification Strategy

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Current header shows "The Terminal 🌱" + Scholar badge + CTX indicator. This is cluttered and the CTX indicator provides little user value. Need to simplify while maintaining essential information.

**Options Considered:**

### Option A: Remove CTX entirely
- **Description:** Just show "Your Grove" + minimize button
- **Pros:** Maximum simplicity; clean
- **Cons:** Loses context awareness; may confuse power users

### Option B: CTX in hover/tooltip
- **Description:** Hide CTX behind hover state or info icon
- **Pros:** Information available if needed
- **Cons:** Discoverability issue; adds UI complexity

### Option C: CTX becomes menu item
- **Description:** Move context display into future menu dropdown
- **Pros:** Clears header; creates path for more settings
- **Cons:** Requires building menu system (out of scope)

**Decision:**
Option A — Remove CTX entirely for v0.12. The section context is less important than clean UX. If users request it, we can add it to a future settings menu.

**Consequences:**
- Header becomes: `[≡] Your Grove [–]`
- Scholar badge moves below title (small, inline)
- Menu button is placeholder (non-functional in v0.12)
- Context-aware features continue working server-side

---

## ADR-004: Controls Relocation Approach

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
JourneyNav (lens, progress, streak) sits below the header, requiring users to scroll to find it on mobile. Moving controls below the input makes them always visible. Need to decide how to handle the relocation.

**Options Considered:**

### Option A: Move JourneyNav wholesale
- **Description:** Move entire JourneyNav component below input
- **Pros:** Single move; preserves component
- **Cons:** JourneyNav is designed for top placement; may need redesign

### Option B: Extract to new TerminalControls component
- **Description:** Create new component specifically designed for bottom placement
- **Pros:** Clean design for new placement; can slim down
- **Cons:** More work; potential duplication

### Option C: Make position configurable
- **Description:** JourneyNav accepts `position` prop
- **Pros:** Flexible; can A/B test positions
- **Cons:** Over-engineering; dual styling burden

**Decision:**
Option B — Create new `TerminalControls.tsx` designed for bottom placement. JourneyNav can be deprecated or kept for reference. The new component will be slimmer, more focused.

**Consequences:**
- New file: `components/Terminal/TerminalControls.tsx`
- JourneyNav.tsx marked deprecated (keep for now)
- New component has horizontal layout, minimal height
- Progress dots may change to text (e.g., "Step 3/7")

---

## ADR-005: Suggestion Button Rendering

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
MarkdownRenderer already parses `→ prompt` lines and renders them as clickable buttons. However, they currently look like links, not tappable buttons. Need to decide styling approach.

**Options Considered:**

### Option A: Style existing implementation
- **Description:** Update CSS classes on existing button elements
- **Pros:** Minimal code change; already functional
- **Cons:** Limited by current structure

### Option B: New SuggestionChip component
- **Description:** Create dedicated component with proper button UX
- **Pros:** Full control over styling; consistent; accessible
- **Cons:** More files; need to integrate with MarkdownRenderer

### Option C: Full-width card style
- **Description:** Each suggestion as a card with hover/press states
- **Pros:** Very tappable; modern feel
- **Cons:** Takes more vertical space; may feel heavy

**Decision:**
Option B — Create `SuggestionChip.tsx` component and use it in MarkdownRenderer. Styled as pill buttons with subtle background, hover lift, and grove-green accent.

**Consequences:**
- New file: `components/Terminal/SuggestionChip.tsx`
- MarkdownRenderer updated to use SuggestionChip
- Consistent styling across all suggestions
- Easy to enhance with telemetry

---

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Add isMinimized to TerminalState | Simplest approach for third state |
| 002 | Create TerminalPill.tsx | Clean separation, testable |
| 003 | Remove CTX from header | Simplicity over information density |
| 004 | Create TerminalControls.tsx | Purpose-built for bottom placement |
| 005 | Create SuggestionChip.tsx | Full control over button UX |
