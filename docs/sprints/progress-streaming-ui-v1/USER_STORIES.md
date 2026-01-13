# User Stories & Acceptance Criteria (v1.0 Review)

**Sprint:** 4 - Progress Streaming UI
**Codename:** progress-streaming-ui-v1
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Draft for Review
**Created:** 2026-01-13
**Spec Source:** Notion page `4. Progress Streaming UI`

---

## Critical Observations

Before diving into stories, the following observations emerged from spec analysis:

### 1. Progress Event Types Already Defined ✓

**Discovery:** The `ResearchProgressEvent` and `WriterProgress` types already exist in `research-pipeline.ts`. The pipeline already emits these events via the `onProgress` callback.

**Implication:** This sprint is purely UI - no backend changes needed.

### 2. GardenInspector Needs Enhancement

**Current State:** `GardenInspector.tsx` shows confirmation dialogs and sprout lists, but has no real-time progress display during active research execution.

**Requirement:** Add a `ResearchProgressView` that displays when a sprout has `status === 'active'`.

### 3. Event Type Alignment

**From Notion spec:**
```typescript
type ResearchProgressEvent =
  | { type: 'searching'; query: string }
  | { type: 'source-found'; title: string; url: string }
  | { type: 'analyzing'; sourceCount: number }
  | { type: 'synthesizing' }
  | { type: 'complete'; documentId: string };
```

**Actual types in codebase (`research-agent.ts`):**
```typescript
type ResearchProgressEvent =
  | { type: 'branch-started'; branchId: string; label: string }
  | { type: 'branch-completed'; branchId: string; evidenceCount: number }
  | { type: 'search-started'; branchId: string; query: string }
  | { type: 'source-discovered'; url: string; title: string }
  | { type: 'evidence-collected'; branchId: string; source: string }
  | { type: 'research-complete'; totalEvidence: number; duration: number }
  | { type: 'error'; message: string };
```

**Recommendation:** Use actual codebase types. Map to user-friendly display strings in UI.

### 4. Pipeline Events Also Flow Through

**Discovery:** `PipelineProgressEvent` includes phase-level events:
- `phase-started` (research | writing)
- `phase-completed`
- `pipeline-complete`
- `pipeline-error`

**Implication:** UI should show both pipeline phase state AND granular progress events.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Full event streaming | Buffer last 10 events | Avoid memory bloat for long operations |
| Source URL display | Truncate to domain | Full URLs clutter UI |
| Analysis state | Show source count only | Detailed analysis metrics are v1.1 |
| Animation | CSS transitions only | Keep bundle small |

---

## Epic 1: Progress State Management

### US-PS001: Track Active Sprout Progress Events

**As a** researcher with an active sprout
**I want to** see research progress events in real-time
**So that** I understand what the agent is doing

**INVEST Assessment:**
- **I**ndependent: Yes — Can be developed standalone
- **N**egotiable: Yes — Event buffering strategy flexible
- **V**aluable: Yes — Core user need for visibility
- **E**stimable: Yes — Hook enhancement, known pattern
- **S**mall: Yes — Single hook, limited state
- **T**estable: Yes — Events appear in state, can assert

**Acceptance Criteria:**

```gherkin
Scenario: Progress events are captured during research
  Given I have an active research sprout
  When the Research Agent emits a 'search-started' event
  Then the progress state should include that event
  And the event should have a timestamp

Scenario: Progress events are buffered
  Given the Research Agent has emitted 15 progress events
  Then only the most recent 10 events should be in state
  And older events should be discarded (FIFO)

Scenario: Progress state resets on new execution
  Given I have progress events from a previous sprout
  When I start research on a new sprout
  Then the progress state should be cleared
  And new events should start accumulating

Scenario: Phase transitions are tracked
  Given research is starting
  When the pipeline emits 'phase-started' with phase 'research'
  Then the current phase should be 'research'
  When the pipeline emits 'phase-started' with phase 'writing'
  Then the current phase should be 'writing'
```

**Traceability:** Spec section "Scope" bullet 1

**Priority:** P0 — Required for any progress display
**Complexity:** S — Hook enhancement

---

## Epic 2: Progress Display Component

### US-PS002: Research Progress Panel

**As a** researcher viewing an active sprout
**I want to** see a dedicated progress panel in GardenInspector
**So that** I can monitor research execution visually

**INVEST Assessment:**
- **I**ndependent: Yes — New component, clear boundaries
- **N**egotiable: Yes — Layout, animations flexible
- **V**aluable: Yes — Primary user-facing deliverable
- **E**stimable: Yes — Defined UI requirements
- **S**mall: Yes — Single component with subcomponents
- **T**estable: Yes — Visual assertions, event rendering

**Acceptance Criteria:**

```gherkin
Scenario: Progress panel renders for active sprout
  Given I select a sprout with status 'active'
  When the GardenInspector renders
  Then I should see a ResearchProgressView component
  And I should NOT see the standard sprout details

Scenario: Progress panel shows current phase
  Given research is in the 'research' phase
  Then I should see "Researching..." as the phase label
  And the phase indicator should use blue styling
  When research moves to 'writing' phase
  Then I should see "Writing..." as the phase label
  And the phase indicator should use green styling

Scenario: Progress panel shows search queries
  Given the agent emits 'search-started' with query "distributed AI inference"
  Then I should see "Searching: distributed AI inference..."
  And the query text should be truncated if > 50 chars

Scenario: Progress panel shows discovered sources
  Given the agent emits 'source-discovered' events
  Then I should see sources appear as they're found
  And each source should show:
    | Element | Content |
    | Icon | link |
    | Domain | arxiv.org (extracted from URL) |
    | Title | Efficient Inference at Scale (truncated to 40 chars) |

Scenario: Progress panel shows source count
  Given 6 sources have been discovered
  Then I should see "Found 6 sources"

Scenario: Progress panel shows completion
  Given the pipeline emits 'pipeline-complete'
  Then the progress panel should show success state
  And a "View Document" CTA should appear
```

**Traceability:** Spec section "User Experience"

**Priority:** P0 — Core UI deliverable
**Complexity:** M — New component with multiple states

---

### US-PS003: Live Source List

**As a** researcher watching progress
**I want to** see sources appear as they're discovered
**So that** I get real-time feedback during research

**INVEST Assessment:**
- **I**ndependent: Yes — Subcomponent of progress panel
- **N**egotiable: Yes — Animation, layout flexible
- **V**aluable: Yes — Key "alive" feeling for UI
- **E**stimable: Yes — List rendering, known pattern
- **S**mall: Yes — Render loop + animation
- **T**estable: Yes — Source count, render timing

**Acceptance Criteria:**

```gherkin
Scenario: Sources appear with animation
  Given the progress panel is visible
  When a new 'source-discovered' event arrives
  Then a new source item should animate in from the left
  And the animation should take ~200ms

Scenario: Sources are grouped by branch
  Given the agent is processing multiple branches
  Then sources should be grouped under branch labels
  And each branch should show its label and status

Scenario: Source overflow is handled
  Given more than 8 sources have been discovered
  Then only the 8 most recent should be visible
  And a "+N more" indicator should show
  And clicking it should expand the full list

Scenario: Sources link to original URL
  Given a source is displayed
  When I click on the source title
  Then it should open the URL in a new tab
```

**Traceability:** Spec section "Sources discovered (URLs appearing as found)"

**Priority:** P1 — Enhancement to progress panel
**Complexity:** S — List component with animations

---

### US-PS004: Phase State Indicators

**As a** researcher watching progress
**I want to** see clear phase transitions
**So that** I know which stage of the pipeline is active

**INVEST Assessment:**
- **I**ndependent: Yes — Subcomponent of progress panel
- **N**egotiable: Yes — Visual treatment flexible
- **V**aluable: Yes — Provides context for events
- **E**stimable: Yes — Simple state display
- **S**mall: Yes — Badge/indicator component
- **T**estable: Yes — Phase text, styling assertions

**Acceptance Criteria:**

```gherkin
Scenario: Phase indicator shows research phase
  Given the pipeline is in 'research' phase
  Then I should see a phase indicator with:
    | Element | Value |
    | Icon | science |
    | Text | Researching |
    | Color | Blue (research theme) |
  And the indicator should have a subtle pulse animation

Scenario: Phase indicator shows writing phase
  Given the pipeline is in 'writing' phase
  Then I should see a phase indicator with:
    | Element | Value |
    | Icon | edit_note |
    | Text | Writing |
    | Color | Green (writing theme) |

Scenario: Phase indicator shows synthesis substep
  Given the pipeline emits a 'synthesizing' event
  Then the indicator should show "Synthesizing evidence..."
  And the icon should be 'merge_type'

Scenario: Phase indicator shows completion
  Given the pipeline is complete
  Then I should see a phase indicator with:
    | Element | Value |
    | Icon | check_circle |
    | Text | Complete |
    | Color | Green (success) |
  And the pulse animation should stop
```

**Traceability:** Spec section "Analysis state indicators"

**Priority:** P0 — Required for phase context
**Complexity:** S — Simple state-driven component

---

## Epic 3: Integration

### US-PS005: GardenInspector Progress Integration

**As a** researcher with an active sprout selected
**I want to** see progress instead of the standard sprout view
**So that** I have relevant context during execution

**INVEST Assessment:**
- **I**ndependent: No — Requires US-PS001, US-PS002
- **N**egotiable: Yes — View switching logic flexible
- **V**aluable: Yes — Ties everything together
- **E**stimable: Yes — Conditional rendering
- **S**mall: Yes — View mode logic only
- **T**estable: Yes — Correct view renders for state

**Acceptance Criteria:**

```gherkin
Scenario: Progress view replaces details for active sprout
  Given I have selected a sprout with status 'active'
  When GardenInspector renders
  Then I should see the ResearchProgressView
  And I should NOT see the SproutDetailsView

Scenario: Details view shows for non-active sprouts
  Given I have selected a sprout with status 'completed'
  When GardenInspector renders
  Then I should see the SproutDetailsView
  And I should NOT see the ResearchProgressView

Scenario: View transitions when status changes
  Given I am viewing progress for an active sprout
  When the sprout status changes to 'completed'
  Then the view should transition to SproutDetailsView
  And the transition should be smooth (fade/slide)

Scenario: Progress view shows for pipeline errors
  Given a sprout has status 'blocked' due to pipeline error
  When GardenInspector renders
  Then I should see error details
  And I should see a "Retry" button
```

**Traceability:** Spec section "Scope" bullet 1

**Priority:** P0 — Required for feature completion
**Complexity:** S — Conditional rendering

---

### US-PS006: Smooth Transitions

**As a** researcher watching progress
**I want to** see smooth visual transitions between states
**So that** the UI feels polished and alive

**INVEST Assessment:**
- **I**ndependent: Yes — CSS/animation layer
- **N**egotiable: Yes — Timing, easing flexible
- **V**aluable: Yes — UX polish, "alive" feeling
- **E**stimable: Yes — Known animation patterns
- **S**mall: Yes — CSS transitions only
- **T**estable: Yes — Animation classes applied

**Acceptance Criteria:**

```gherkin
Scenario: New events animate in
  Given the progress panel is displaying events
  When a new event arrives
  Then it should animate in with translateX + opacity
  And the animation should be 200ms ease-out

Scenario: Phase changes animate
  Given the phase changes from 'research' to 'writing'
  Then the phase indicator should crossfade
  And the transition should be 300ms

Scenario: Completion state animates
  Given the pipeline completes
  Then a success indicator should scale in
  And confetti or pulse effect should appear
  And the animation should be 400ms

Scenario: Error state animates
  Given the pipeline errors
  Then the error banner should slide down from top
  And the animation should be 250ms
```

**Traceability:** Spec success criteria "Smooth transitions between states"

**Priority:** P1 — UX polish
**Complexity:** S — CSS only

---

## Epic 4: Build & Verification

### US-PS007: Build Gate Compliance

**As a** developer completing this sprint
**I want** the build to pass without errors
**So that** the sprint can be merged

**INVEST Assessment:**
- **I**ndependent: Yes — Standard gate
- **N**egotiable: No — Must pass
- **V**aluable: Yes — Ensures deployability
- **E**stimable: Yes — Binary pass/fail
- **S**mall: Yes — Run commands, fix issues
- **T**estable: Yes — Commands exit 0

**Acceptance Criteria:**

```gherkin
Scenario: TypeScript compilation passes
  Given I run `npm run build`
  Then the process should exit with code 0
  And there should be no TypeScript errors

Scenario: No console errors on load
  Given I open the Explore page with an active sprout
  When I open developer tools console
  Then there should be no red error messages
  And there should be no uncaught exceptions

Scenario: Visual QA tests pass
  Given I run Playwright visual QA tests
  Then all screenshots should be captured
  And the REVIEW.html should show all ACs verified
```

**Traceability:** Standard Bedrock build gates

**Priority:** P0 — Required for merge
**Complexity:** S — Standard verification

---

## Deferred to v1.1

### US-PS008: Detailed Analysis Metrics (DEFERRED)

**Reason:** v1.0 shows source count only; detailed metrics (token counts, relevance scores, timing breakdown) are v1.1 scope.

**Original Flow:** Show per-branch analysis metrics with progress bars.

**v1.1 Prerequisite:** Define metric schema and collection points.

---

### US-PS009: Progress History Persistence (DEFERRED)

**Reason:** v1.0 keeps progress in memory only; history is cleared on page reload.

**Original Flow:** Store progress events in localStorage or Supabase for post-hoc review.

**v1.1 Prerequisite:** Define storage schema and retention policy.

---

## Open Questions

1. **Event Buffering** — Should we buffer 10 events or show all? 10 is recommended to avoid memory issues on long runs.

2. **Source Click Behavior** — Should clicking a source open in new tab, or preview in panel? New tab recommended for v1.0.

3. **Error Retry UX** — When pipeline fails, should retry be automatic or user-initiated? User-initiated recommended.

4. **Writing Phase Detail** — Should we show section-by-section writing progress? Deferred to v1.1.

---

## Summary

| Story ID | Title | Priority | Complexity | Status |
|----------|-------|----------|------------|--------|
| US-PS001 | Track Active Sprout Progress Events | P0 | S | Ready |
| US-PS002 | Research Progress Panel | P0 | M | Ready |
| US-PS003 | Live Source List | P1 | S | Ready |
| US-PS004 | Phase State Indicators | P0 | S | Ready |
| US-PS005 | GardenInspector Progress Integration | P0 | S | Ready |
| US-PS006 | Smooth Transitions | P1 | S | Ready |
| US-PS007 | Build Gate Compliance | P0 | S | Ready |

**Total v1.0 Stories:** 7
**Deferred:** 2
**Estimated Effort:** 4-6 hours (Feature tier)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Event types are defined in schema (`research-agent.ts`), not hardcoded in UI. UI maps event types to display strings declaratively. |
| **Capability Agnosticism** | Progress display works regardless of which LLM model executes research. UI only consumes event stream. |
| **Provenance as Infrastructure** | Each event has timestamp. Sources retain URLs. Progress events log execution context. |
| **Organic Scalability** | New event types can be added to schema without UI code changes if they follow the union pattern. New branches automatically display. |

---

## Test Generation Readiness

These stories are ready for Phase 3 (Test Case Generation):

- **Fixtures needed:** Mock ResearchProgressEvent stream, mock PipelineProgressEvent stream
- **Page objects:** GardenInspectorPage, ResearchProgressPanel
- **Key assertions:** Event count, source rendering, phase display, animation classes

---

## Execution Notes

1. **Start with US-PS001** — State management hook is foundation
2. **Then US-PS002 + US-PS004** — Progress panel with phase indicators
3. **Then US-PS005** — Wire into GardenInspector
4. **Then US-PS003 + US-PS006** — Polish (source list, animations)
5. **US-PS007** — Verify throughout and at end

**Critical Path:** US-PS001 → US-PS002/US-PS004 → US-PS005 → US-PS003/US-PS006 → US-PS007

