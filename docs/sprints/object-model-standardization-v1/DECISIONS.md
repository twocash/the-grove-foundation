# Decisions — Object Model Standardization

## ADR-1: Fix Root Cause in List Components, Not Inspectors

### Status
Accepted

### Context
The original PRD identified that inspectors persist after selection. Initial analysis suggested the fix was in the inspector components. However, code review revealed the root cause is in the list components (`LensPicker.handleSelect` and `JourneyList.handleStart`) that either open the inspector after selection or fail to close it.

### Decision
Fix the handlers in the list components (LensPicker, JourneyList) rather than adding compensating logic to the inspector components.

### Rationale
- **Root cause, not symptom**: The list components are actively doing the wrong thing
- **Single responsibility**: Selection handlers should select and return, not manage inspector state
- **Reference implementation exists**: JourneyInspector.handleStart already does it correctly

### Consequences
- Changes are more surgical (fix the source, not add workarounds)
- Both card buttons and inspector buttons produce identical behavior
- Future developers will find intuitive handler logic

---

## ADR-2: Inspected State Takes Visual Precedence Over Active State

### Status
Accepted

### Context
Cards can be in three states: Default, Active (currently applied), and Inspected (showing in inspector). A card can be both Active AND Inspected simultaneously. We need to define which visual treatment takes precedence.

### Decision
When a card is both Active and Inspected, apply the Inspected visual treatment (ring-2) while keeping the "Active" badge.

### Rationale
- **User feedback priority**: Users need to know which card's details they're viewing
- **Action clarity**: The ring indicates "this is what you're looking at"
- **Badge provides context**: The "Active" badge still communicates the current selection

### Consequences
- Style logic checks `isInspected` first, then `isActive`
- Active badge is rendered independently of border/ring styles
- Consistent with "what you see is what you're inspecting" mental model

---

## ADR-3: Include CustomLensCard Despite Original PRD Omission

### Status
Accepted

### Context
The original PRD only addressed standard `LensCard`. However, `LensPicker` also renders `CustomLensCard` for user-created lenses. Omitting it would create inconsistent UX within the same grid.

### Decision
Apply the same pattern to CustomLensCard using the violet color scheme (ring-violet-400, bg-violet-500).

### Rationale
- **UX consistency**: Users shouldn't experience different behavior based on lens type
- **Same interaction model**: Custom lenses follow the same Select → Inspect → Activate pattern
- **Violet maintains identity**: Custom lenses already use violet to distinguish from system lenses

### Consequences
- Additional changes in LensPicker.tsx for CustomLensCard
- Violet variant maintains custom lens visual identity
- Consistent behavior across all lens types

---

## ADR-4: Exclude Compact Mode Cards from Inspected State

### Status
Accepted

### Context
`CompactLensCard` and `CompactJourneyCard` are used in the chat navigation sidebar. They don't pair with an inspector panel—clicking them directly activates the selection.

### Decision
Do not add `isInspected` prop to compact mode cards. Their existing click-to-select behavior is correct.

### Rationale
- **No inspector pairing**: Compact cards don't open an inspector, so "inspected" state is meaningless
- **Different interaction model**: Compact mode is direct selection, not browse-then-select
- **Scope discipline**: Adding unused props creates confusion

### Consequences
- Compact mode cards unchanged in this sprint
- Clear separation between browse mode (with inspector) and compact mode (direct selection)
- Reduced scope and risk

---

## ADR-5: Use closeInspector + navigateTo Pattern

### Status
Accepted

### Context
When activating a selection, we need to close the inspector and return the user to the chat. There are multiple ways to achieve this:
1. Call `closeInspector()` then `navigateTo(['explore'])`
2. Create a new `activateAndReturn()` method on the context
3. Rely on navigation to implicitly close the inspector

### Decision
Use explicit `closeInspector()` followed by `navigateTo(['explore'])` calls.

### Rationale
- **Explicit is better**: Makes intent clear in the code
- **Reference implementation**: JourneyInspector already uses this pattern successfully
- **No context API changes**: Avoids modifying shared infrastructure
- **Defensive**: Doesn't rely on navigation side effects

### Consequences
- Slightly more verbose than a combined method
- Clear and predictable behavior
- No changes to WorkspaceUIContext
