# Sprint Breakdown: Grove Widget Implementation

**Sprint:** foundation-ux-unification-v1
**Branch:** `feature/foundation-refactor`
**Date:** December 21, 2025

---

## Overview

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Grove Widget Shell | Container, mode switching, command palette |
| 2 | Garden Mode | Sprout gallery, growth stages, empty state |
| 3 | Explore Mode | Terminal integration, plant action |
| 4 | Foundation Pattern | Console component grammar |

---

## Week 1: Grove Widget Shell

### Epic: Create unified widget container

**Goal:** A working shell with mode switching, even if content areas are stubs.

---

### Story 1.1: Widget Type Definitions

**File:** `src/core/schema/widget.ts`

**Tasks:**
- [ ] Create `WidgetMode` type (`'explore' | 'garden' | 'chat'`)
- [ ] Create `InspectorMode` type
- [ ] Create `WidgetSession` interface
- [ ] Create `WidgetState` interface
- [ ] Create `WidgetActions` interface
- [ ] Export all types from `src/core/index.ts`

**Acceptance:**
- Types compile without errors
- No runtime dependencies in schema file

---

### Story 1.2: Widget Directory Structure

**Tasks:**
- [ ] Create `src/widget/` directory
- [ ] Create `src/widget/components/` subdirectory
- [ ] Create `src/widget/views/` subdirectory
- [ ] Create `src/widget/index.ts` barrel export
- [ ] Add `@widget` path alias to `tsconfig.json` and `vite.config.ts`

**Acceptance:**
- Import `@widget/GroveWidget` resolves correctly
- No build errors

---

### Story 1.3: WidgetUIContext Provider

**File:** `src/widget/WidgetUIContext.tsx`

**Tasks:**
- [ ] Create context with `WidgetState` + `WidgetActions`
- [ ] Implement `useState` for `currentMode` (default: 'explore')
- [ ] Implement `useState` for `sessionStartTime` (set on mount)
- [ ] Implement `useState` for `sproutCount` (load from storage)
- [ ] Implement `useState` for `inspectorMode` + `inspectorEntityId`
- [ ] Implement `useState` for `isCommandPaletteOpen`
- [ ] Implement all action callbacks
- [ ] Persist `currentMode` to `localStorage` key `grove-widget-mode`
- [ ] Create `useWidgetUI()` hook with error boundary
- [ ] Export provider and hook

**Acceptance:**
- Mode persists across page refresh
- Sprout count reflects actual storage
- All actions work correctly

---

### Story 1.4: GroveWidget Container

**File:** `src/widget/GroveWidget.tsx`

**Tasks:**
- [ ] Create `GroveWidget` component with `WidgetUIProvider` wrapper
- [ ] Accept `initialMode` prop (optional)
- [ ] Create internal `WidgetContent` component for mode switching
- [ ] Apply base CSS classes for layout
- [ ] Compose: Header, Content, Input, ModeToggle, CommandPalette

**Acceptance:**
- Renders without errors
- Layout matches wireframe (header, content, footer)
- Provider wraps all children

---

### Story 1.5: WidgetHeader Component

**File:** `src/widget/components/WidgetHeader.tsx`

**Tasks:**
- [ ] Display Grove logo/branding (🌳 The Grove)
- [ ] Implement session timer with `useEffect` interval
- [ ] Format timer as `Xm` (minutes)
- [ ] Display sprout count with 🌱 emoji
- [ ] Display mode indicator (◐ + mode label)
- [ ] Style with CSS variables

**Acceptance:**
- Timer counts up correctly (within 1 second accuracy)
- Sprout count updates when sprouts added
- Mode label changes on mode switch

---

### Story 1.6: ModeToggle Component

**File:** `src/widget/components/ModeToggle.tsx`

**Tasks:**
- [ ] Render three mode buttons: Explore, Garden, Chat
- [ ] Apply `active` class to current mode
- [ ] Apply `disabled` class to Chat mode
- [ ] Call `setMode()` on click (except Chat)
- [ ] Add utility buttons: Settings (⚙), Help (?), More (···)
- [ ] Style footer layout

**Acceptance:**
- Clicking Explore/Garden switches mode
- Chat button is disabled with "(Soon)" label
- Active state visually distinct

---

### Story 1.7: WidgetInput Component

**File:** `src/widget/components/WidgetInput.tsx`

**Tasks:**
- [ ] Create text input with placeholder
- [ ] Detect `/` prefix to trigger command palette
- [ ] Pass through to existing command handling for non-palette commands
- [ ] Add ⌘K hint button
- [ ] Handle keyboard shortcut (Cmd+K / Ctrl+K) to open palette
- [ ] Style input area

**Acceptance:**
- Typing `/` opens command palette
- Cmd+K opens command palette
- Regular text input works normally

---

### Story 1.8: CommandPalette Component

**File:** `src/widget/components/CommandPalette.tsx`

**Tasks:**
- [ ] Create overlay component (covers widget)
- [ ] Create modal with search input
- [ ] Auto-focus input on open
- [ ] Filter commands by query
- [ ] Display command list with name and hint
- [ ] Handle arrow key navigation
- [ ] Handle Enter to execute
- [ ] Handle Escape to close
- [ ] Include mode-switching commands: `/explore`, `/garden`
- [ ] Style with CSS variables

**Acceptance:**
- Opens on trigger, closes on Escape
- Arrow keys navigate list
- Enter executes selected command
- `/garden` switches to Garden mode

---

### Story 1.9: Placeholder Views

**Files:**
- `src/widget/views/ExploreView.tsx`
- `src/widget/views/GardenView.tsx`
- `src/widget/views/ChatPlaceholder.tsx`

**Tasks:**
- [ ] Create `ExploreView` with "Explore Mode" placeholder text
- [ ] Create `GardenView` with "Garden Mode" placeholder text
- [ ] Create `ChatPlaceholder` with coming soon messaging
- [ ] Add email capture form to ChatPlaceholder
- [ ] Style all views consistently

**Acceptance:**
- Each view renders its placeholder
- Mode switching shows correct view
- ChatPlaceholder matches wireframe

---

### Story 1.10: Route Integration

**File:** `src/router/routes.tsx`

**Tasks:**
- [ ] Add `/terminal` route for GroveWidget
- [ ] Update `SurfacePage.tsx` to use GroveWidget
- [ ] Preserve existing `/foundation/*` routes
- [ ] Handle `?admin=true` redirect to `/foundation`

**Acceptance:**
- `/terminal` shows GroveWidget
- `/foundation/*` still works
- Legacy admin redirect still works

---

### Story 1.11: Widget CSS

**File:** `src/widget/widget.css`

**Tasks:**
- [ ] Define CSS variables for Grove Widget theme
- [ ] Create `.grove-widget` container styles
- [ ] Create `.widget-header` styles
- [ ] Create `.widget-content` styles
- [ ] Create `.widget-footer` styles
- [ ] Create `.mode-toggle` styles
- [ ] Create `.command-palette` styles
- [ ] Add transitions (200ms ease-out)
- [ ] Import in `src/widget/index.ts`

**Acceptance:**
- All components styled correctly
- Dark theme consistent
- Transitions smooth

---

### Story 1.12: Keyboard Shortcuts

**Tasks:**
- [ ] Global listener for Cmd+K / Ctrl+K → open command palette
- [ ] Global listener for Escape → close palette
- [ ] Global listener for `1`, `2`, `3` (with modifier?) → mode switch
- [ ] Prevent default browser behavior for shortcuts

**Acceptance:**
- Shortcuts work consistently
- No conflicts with browser shortcuts
- Shortcuts work regardless of focus

---

## Week 1 Checklist

```markdown
### Day 1
- [ ] Story 1.1: Widget Type Definitions
- [ ] Story 1.2: Widget Directory Structure

### Day 2
- [ ] Story 1.3: WidgetUIContext Provider
- [ ] Story 1.4: GroveWidget Container

### Day 3
- [ ] Story 1.5: WidgetHeader Component
- [ ] Story 1.6: ModeToggle Component

### Day 4
- [ ] Story 1.7: WidgetInput Component
- [ ] Story 1.8: CommandPalette Component

### Day 5
- [ ] Story 1.9: Placeholder Views
- [ ] Story 1.10: Route Integration
- [ ] Story 1.11: Widget CSS
- [ ] Story 1.12: Keyboard Shortcuts
```

---

## Week 2: Garden Mode

### Epic: Implement sprout gallery

**Stories:**
- 2.1: GardenView component with sprout grouping
- 2.2: SproutCard component
- 2.3: GrowthStageGroup component
- 2.4: GardenEmptyState component
- 2.5: KnowledgeCommonsPreview component
- 2.6: `/garden` command integration

---

## Week 3: Explore Mode

### Epic: Integrate existing Terminal

**Stories:**
- 3.1: ExploreView wrapper for Terminal
- 3.2: Terminal → Widget callback integration
- 3.3: PlantSelectionTooltip component
- 3.4: JourneyProgress component
- 3.5: `/plant` command enhancement

---

## Week 4: Foundation Console Pattern

### Epic: Establish component grammar

**Stories:**
- 4.1: ConsoleUIContext provider
- 4.2: ModuleLayout component
- 4.3: CollectionGrid component
- 4.4: Inspector component
- 4.5: Narrative Architect refactor

---

## Definition of Done

Each story is complete when:
- [ ] Code compiles without TypeScript errors
- [ ] Component renders without console errors
- [ ] Manual testing confirms acceptance criteria
- [ ] Code follows existing patterns/conventions
- [ ] Imports are clean (no unused)
- [ ] Component is exported from barrel

---

## Dependencies

```
Story 1.1 → Story 1.3 (types needed for context)
Story 1.2 → Story 1.4 (directory needed for component)
Story 1.3 → Story 1.4, 1.5, 1.6, 1.7, 1.8 (context needed for hooks)
Story 1.4 → Story 1.10 (container needed for route)
Story 1.9 → Story 1.4 (views needed for content switching)
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-21 | Claude | Initial sprint breakdown |
