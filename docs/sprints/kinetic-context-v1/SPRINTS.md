# SPRINTS.md — kinetic-context-v1

## Sprint Overview

**Duration:** ~4 hours
**Files Created:** 2
**Files Modified:** 2

---

## Epic 1: Header Component (45 min)

### Story 1.1: Create KineticHeader
**File:** `src/surface/.../KineticHeader.tsx`
**Effort:** 30 min

Tasks:
- Create component with lens/journey pills
- Implement HeaderPill subcomponent
- Add stage indicator
- Add streak display
- Wire click handlers for pills

Acceptance:
- Lens pill clickable with colored dot
- Journey pill hidden on smaller screens
- Stage shows emoji + label + count

### Story 1.2: Header Tests
**Effort:** 15 min

Tasks:
- Test all props render correctly
- Test click handlers fire
- Test conditional rendering

---

## Epic 2: Welcome Component (45 min)

### Story 2.1: Create KineticWelcome
**File:** `src/surface/.../KineticWelcome.tsx`
**Effort:** 30 min

Tasks:
- Create glass container layout
- Render heading, thesis, footer
- Render prompts as buttons
- Support custom prompts array
- Add arrow transition on hover

Acceptance:
- Prompts clickable with journeyId support
- Stage indicator displays
- Footer renders when provided

### Story 2.2: Welcome Tests
**Effort:** 15 min

Tasks:
- Test content rendering
- Test prompt click handlers
- Test custom prompts override

---

## Epic 3: Context Integration (60 min)

### Story 3.1: Add Engagement Hooks
**File:** `src/surface/.../ExploreShell.tsx`
**Effort:** 20 min

Tasks:
- Import useLensState, useJourneyState
- Import useSuggestedPrompts
- Import getTerminalWelcome
- Add overlay state

### Story 3.2: Wire Header
**Effort:** 15 min

Tasks:
- Replace static header with KineticHeader
- Pass lens/journey props
- Wire onLensClick to open overlay

### Story 3.3: Add Welcome
**Effort:** 15 min

Tasks:
- Conditionally render KineticWelcome
- Pass prompts and stage
- Wire onPromptClick handler

### Story 3.4: Add Lens Picker Overlay
**Effort:** 10 min

Tasks:
- Import LensPicker from Terminal
- Render in overlay when active
- Wire selection handler

---

## Epic 4: Polish & Testing (70 min)

### Story 4.1: Component Tests
**Effort:** 30 min

Tasks:
- KineticHeader tests
- KineticWelcome tests
- Integration smoke tests

### Story 4.2: Manual Testing
**Effort:** 25 min

Tasks:
- Full lens selection flow
- Welcome → first message flow
- Stage progression verification
- Responsive layout check

### Story 4.3: Index Exports
**Effort:** 5 min

Tasks:
- Export KineticHeader
- Export KineticWelcome

### Story 4.4: Documentation
**Effort:** 10 min

Tasks:
- Update component JSDoc
- Update ExploreShell comments

---

## Summary

| Epic | Stories | Duration |
|------|---------|----------|
| Header | 2 | 45 min |
| Welcome | 2 | 45 min |
| Integration | 4 | 60 min |
| Polish | 4 | 70 min |
| **Total** | **12** | **~4 hours** |

## File Change Summary

**Create:**
- `src/surface/components/KineticStream/KineticHeader.tsx`
- `src/surface/components/KineticStream/KineticWelcome.tsx`

**Modify:**
- `src/surface/components/KineticStream/ExploreShell.tsx`
- `src/surface/components/KineticStream/index.ts`

## Dependencies

From existing codebase:
- `@core/engagement` (useLensState, useJourneyState)
- `@hooks/useSuggestedPrompts`
- `@data/quantum-content` (getTerminalWelcome)
- `@data/default-personas` (getPersona)
- `@data/narratives-schema` (getPersonaColors)
- `@components/Terminal/LensPicker` (reuse)
