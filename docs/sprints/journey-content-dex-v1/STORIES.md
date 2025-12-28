# STORIES.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Story Breakdown

Total Stories: 8
Estimated Effort: Medium (4-6 hours with AI assistance)

---

## Story 1: Schema Extension - Display Config

**As a** journey author  
**I want to** define display options in the journey schema  
**So that** I can customize the journey UI without writing code

### Tasks
- [ ] Add `JourneyDisplayConfig` interface to `journey.ts`
- [ ] Add `WaypointAction` interface to `journey.ts`
- [ ] Extend `Journey` interface with optional `display` field
- [ ] Extend `JourneyWaypoint` interface with optional `actions` field
- [ ] Export new types from `index.ts`

### Acceptance Criteria
- [ ] TypeScript compiles without errors
- [ ] Existing journey definitions still valid
- [ ] New types are exported and importable

### Files
- `src/core/schema/journey.ts`
- `src/core/schema/index.ts`

---

## Story 2: Provenance Type

**As a** system maintaining attribution chains  
**I want to** have a structured provenance type for journey interactions  
**So that** every insight can be traced to its origin journey/waypoint

### Tasks
- [ ] Create `journey-provenance.ts` with `JourneyProvenance` interface
- [ ] Create `createJourneyProvenance()` helper function
- [ ] Export from `index.ts`

### Acceptance Criteria
- [ ] Provenance captures journey id/title, waypoint id/title/index, action type/label/timestamp
- [ ] Helper function produces valid provenance objects

### Files
- `src/core/schema/journey-provenance.ts` (new)
- `src/core/schema/index.ts`

---

## Story 3: JourneyContent Component - Structure

**As a** user viewing an active journey  
**I want to** see the journey header with title and exit button  
**So that** I know what journey I'm in and can leave if desired

### Tasks
- [ ] Create `JourneyContent.tsx` component file
- [ ] Implement props interface
- [ ] Render journey title in header
- [ ] Render exit button (if display.showExitButton !== false)
- [ ] Wire exit button to `onExit` callback

### Acceptance Criteria
- [ ] Component renders without errors
- [ ] Title matches `journey.title`
- [ ] Exit button calls `onExit` when clicked
- [ ] Exit button hidden when `display.showExitButton: false`

### Files
- `components/Terminal/JourneyContent.tsx` (new)

---

## Story 4: JourneyContent Component - Progress

**As a** user in a journey  
**I want to** see my progress through the waypoints  
**So that** I know how far I've come and how far to go

### Tasks
- [ ] Add progress bar element
- [ ] Calculate width from `journeyProgress / journeyTotal`
- [ ] Apply color from `display.progressBarColor` (default: emerald)
- [ ] Add waypoint counter text ("2 of 5")
- [ ] Respect `display.showProgressBar` and `display.showWaypointCount`

### Acceptance Criteria
- [ ] Progress bar fills proportionally to progress
- [ ] Color matches schema config or default
- [ ] Counter text is accurate
- [ ] Both elements can be hidden via schema

### Files
- `components/Terminal/JourneyContent.tsx`

---

## Story 5: JourneyContent Component - Waypoint Content

**As a** user on a waypoint  
**I want to** see the waypoint title and prompt  
**So that** I understand what this step is about

### Tasks
- [ ] Render waypoint title
- [ ] Render waypoint prompt in styled container
- [ ] Apply consistent styling (emerald theme, rounded corners)

### Acceptance Criteria
- [ ] Waypoint title displayed prominently
- [ ] Prompt text is readable
- [ ] Styling matches Terminal aesthetic

### Files
- `components/Terminal/JourneyContent.tsx`

---

## Story 6: JourneyContent Component - Actions

**As a** user on a waypoint  
**I want to** see action buttons to interact with the journey  
**So that** I can explore, advance, or complete the journey

### Tasks
- [ ] Define default actions array
- [ ] Define final waypoint actions array
- [ ] Determine which actions to render (schema or defaults)
- [ ] Map action `variant` to Tailwind styles
- [ ] Build provenance for each action
- [ ] Wire buttons to `onAction` callback

### Acceptance Criteria
- [ ] Default actions appear when `waypoint.actions` undefined
- [ ] Custom actions appear when `waypoint.actions` defined
- [ ] Final waypoint shows "Complete" instead of "Next"
- [ ] Clicking action calls `onAction` with action and provenance

### Files
- `components/Terminal/JourneyContent.tsx`

---

## Story 7: Terminal Integration

**As the** Terminal component  
**I want to** render JourneyContent when a journey is active  
**So that** users see journey UI instead of nothing

### Tasks
- [ ] Import JourneyContent component
- [ ] Import action/provenance types
- [ ] Extend useJourneyState destructuring
- [ ] Create `handleJourneyAction` callback
- [ ] Add render condition for `isJourneyActive`
- [ ] Handle each action type in callback

### Acceptance Criteria
- [ ] JourneyContent renders when `isJourneyActive && engJourney && currentWaypoint`
- [ ] Explore action sends prompt to chat
- [ ] Advance action calls `advanceStep()`
- [ ] Complete action triggers completion flow
- [ ] Exit hides journey content

### Files
- `components/Terminal.tsx`

---

## Story 8: Unit Tests

**As a** developer  
**I want to** have unit tests for JourneyContent  
**So that** regressions are caught automatically

### Tasks
- [ ] Create test file
- [ ] Test: renders with minimal props
- [ ] Test: respects display config options
- [ ] Test: renders default actions
- [ ] Test: renders custom actions
- [ ] Test: shows Complete on final waypoint
- [ ] Test: calls onAction with provenance
- [ ] Test: calls onExit on exit click

### Acceptance Criteria
- [ ] All tests pass
- [ ] Coverage for main component branches
- [ ] Tests use Testing Library best practices

### Files
- `components/Terminal/JourneyContent.test.tsx` (new)

---

## Dependency Graph

```
Story 1 (Schema) ─────┬───▶ Story 3 (Structure)
                      │              │
Story 2 (Provenance) ─┼───▶ Story 4 (Progress)
                      │              │
                      │              ▼
                      │     Story 5 (Content)
                      │              │
                      │              ▼
                      └───▶ Story 6 (Actions)
                                     │
                                     ▼
                            Story 7 (Terminal)
                                     │
                                     ▼
                            Story 8 (Tests)
```

## Execution Order

1. **Story 1** - Schema (enables everything else)
2. **Story 2** - Provenance (needed for actions)
3. **Stories 3-6** - Component (can be done incrementally)
4. **Story 7** - Terminal (wires it together)
5. **Story 8** - Tests (validates everything)

## Definition of Done

- [ ] All 8 stories complete
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] All unit tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual verification passes
- [ ] E2E screenshots captured
- [ ] Committed with conventional commit message
