# User Stories & Acceptance Criteria v1.0 Review

**Initiative:** Sprout Finishing Room
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Ready for Execution
**Date:** 2026-01-15

---

## Sprint Breakdown

The initiative is structured as **three discrete sprints**:

| Sprint | Codename | Stories | Scope | Status |
|--------|----------|---------|-------|--------|
| **S1** | [S1-SFR-Shell](https://www.notion.so/2e9780a78eef8135b4e3f937488d9bc7) | US-A001–A004 | Modal foundation, layout, a11y | 🎯 ready |
| **S2\|\|** | [S2\|\|SFR-Display](https://www.notion.so/2e9780a78eef81eba2fcfe5d651704d8) | US-B001–B004, US-C001–C004 | Provenance + Document Viewer | 📝 draft-spec |
| **S3\|\|** | [S3\|\|SFR-Actions](https://www.notion.so/2e9780a78eef81cab6bfd526feb5084e) | US-D001–D005, US-E001 | Actions + Integration | 📝 draft-spec |

**Notation:** `||` indicates sprint can run in parallel with others at same level.

```
S1-SFR-Shell (REQUIRED FIRST)
       │
       ├──────────────────┐
       ▼                  ▼
S2||SFR-Display    S3||SFR-Actions
(8 stories)        (6 stories)
   └────── can run in parallel ──────┘
```

**Supersedes:** [GardenInspector Modal Redesign](https://www.notion.so/2e8780a78eef8128894fc06ec199b111) (archived)

---

## Critical Observations

### 1. Backend Dependencies Unclear

The spec defines two critical actions that depend on backend services:

| Action | Required Backend | Status |
|--------|------------------|--------|
| "Revise & Resubmit" | Research agent queue | **Unknown** |
| "Add to Field" (Promote) | RAG write service | **Unknown** |

**Recommendation:** Clarify backend readiness. If not ready, v1.0 should:
- Stub "Revise & Resubmit" with toast confirmation (no actual requeue)
- Defer "Add to Field" to v1.1, or implement client-side only (localStorage)

### 2. JSON-Render Package Installation

The `@json-render/core` and `@json-render/react` packages are new dependencies. Need to:
- Verify npm availability and version compatibility
- Create catalog and registry files before component work

**Recommendation:** Add Epic A story for json-render setup before Document Viewer epic.

### 3. 4D Terminology Migration In Progress

The Cognitive Routing model replaces Hub/Journey/Node. The schema changes (`SproutProvenance` → `CognitiveRouting`) should be coordinated.

**Recommendation:** Bundle terminology schema update into Epic B (Provenance Panel).

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Revise & Resubmit | Stub (toast only) | Agent queue not available |
| Add to Field (Promote) | **Include** | RAG write API available (`POST /api/knowledge/upload`) |
| Multi-sprout comparison | Defer | Out of scope |
| Real-time agent status | Defer | WebSocket infrastructure |
| Raw JSON toggle | **Include** | Power user value, simple implementation |
| Export document | **Include** | Client-side only, high value |

---

## Epic A: Modal Foundation `[S1-SFR-Shell]`

Core workspace setup, navigation, and responsive behavior.

### US-A001: Open Finishing Room from GardenTray

**As an** Explorer
**I want to** click on a ready sprout in my GardenTray
**So that** I can view and interact with the research document

**INVEST Assessment:**
- **I**ndependent: Yes — standalone entry point
- **N**egotiable: Yes — entry point could vary
- **V**aluable: Yes — core user flow
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Open Finishing Room for ready sprout
  Given I am an Explorer in the Surface experience
  And I have a sprout with status "ready" and attached ResearchDocument
  When I click on the sprout card in my GardenTray
  Then the Sprout Finishing Room modal should open
  And the modal should display the sprout's research document
  And the modal should emit a "finishingRoomOpened" event

Scenario: Sprout without ResearchDocument falls back
  Given I have a sprout with status "planted" (no ResearchDocument)
  When I click on the sprout card
  Then the basic sprout detail view should open
  And the Finishing Room should NOT open
```

**Traceability:** Spec section "7. Entry Points"

---

### US-A002: Three-Column Layout Renders Correctly

**As an** Explorer
**I want to** see the Finishing Room in a clear three-column layout
**So that** I can access provenance, document, and actions simultaneously

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — column widths adjustable
- **V**aluable: Yes — core UX
- **E**stimable: Yes — ~4 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Desktop layout displays three columns
  Given I am on a screen wider than 1280px
  When I open the Sprout Finishing Room
  Then I should see a left Provenance Panel (280px)
  And I should see a center Document Viewer (flexible width)
  And I should see a right Action Panel (320px)
  And the columns should not overlap

Scenario: Column widths adjust for medium screens
  Given I am on a screen between 1024px and 1279px
  When I open the Sprout Finishing Room
  Then the Provenance Panel should be 240px
  And the Action Panel should be 280px

Scenario: Mobile layout uses tab navigation
  Given I am on a screen narrower than 768px
  When I open the Sprout Finishing Room
  Then I should see a single column with tab navigation
  And tabs should include: Document, Provenance, Actions
```

**Traceability:** Spec section "4. Layout Architecture"

---

### US-A003: Close Modal via Button or Escape

**As an** Explorer
**I want to** close the Finishing Room easily
**So that** I can return to my exploration without friction

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: No — standard modal behavior
- **V**aluable: Yes — essential UX
- **E**stimable: Yes — ~1 hour
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Close via X button
  Given the Sprout Finishing Room is open
  When I click the close button (X) in the header
  Then the modal should close
  And the backdrop should fade out
  And a "finishingRoomClosed" event should be emitted

Scenario: Close via Escape key
  Given the Sprout Finishing Room is open
  When I press the Escape key
  Then the modal should close
  And focus should return to the triggering element

Scenario: Close via backdrop click
  Given the Sprout Finishing Room is open
  When I click outside the modal (on the backdrop)
  Then the modal should close
```

**Traceability:** Spec section "9. Accessibility Requirements"

---

### US-A004: Status Bar Displays Sprout Metadata

**As an** Explorer
**I want to** see the current sprout status and creation time
**So that** I understand the document's context at a glance

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — content adjustable
- **V**aluable: Yes — context awareness
- **E**stimable: Yes — ~1 hour
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P1 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Status bar shows document info
  Given I open a Finishing Room for a sprout
  When the modal renders
  Then I should see "SPROUT.FINISHING.v1" version tag
  And I should see the sprout status (e.g., "Status: READY")
  And I should see relative creation time (e.g., "Created: 2m ago")
  And I should see a pulsing green health indicator
```

**Traceability:** Spec section "5.4 Status Bar"

---

## Epic B: Provenance Panel `[S2||SFR-Display]`

Left column displaying origin and attribution chain.

### US-B001: Display Lens Origin

**As an** Explorer
**I want to** see which lens generated the research
**So that** I understand the perspective applied to my query

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — display format flexible
- **V**aluable: Yes — provenance transparency
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Lens displayed in Origin section
  Given I have a sprout with provenance.lens = "Academic Researcher"
  When I open the Finishing Room
  Then the Provenance Panel should show an "Origin" section
  And I should see a lens item with icon (🔮)
  And the lens name should display "Academic Researcher"
```

**Traceability:** Spec section "5.1.1 Origin Section"

---

### US-B002: Display Cognitive Routing with Expandable Details

**As an** Explorer
**I want to** see the full cognitive routing path
**So that** I understand how the system arrived at this research

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — expand behavior adjustable
- **V**aluable: Yes — DEX compliance (provenance pillar)
- **E**stimable: Yes — ~4 hours (includes schema creation)
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** M

**Includes Schema Creation (Option A):**
This story creates the `CognitiveRouting` interface in `src/core/schema/cognitive-routing.ts`:

```typescript
/**
 * 4D Experience Model: Cognitive Routing
 * Replaces deprecated Hub/Journey/Node provenance model
 * @see docs/sprints/terminology-migration-4d/SPEC.md
 */
export interface CognitiveRouting {
  path: string;        // Experience path taken (e.g., "deep-dive → cost-dynamics")
  prompt: string;      // Active prompt mode (e.g., "Analytical research mode")
  inspiration: string; // Triggering context (e.g., "User query on ownership models")
  domain?: string;     // Optional cognitive domain
}
```

**Acceptance Criteria:**

```gherkin
Scenario: Cognitive Routing shows collapsed summary
  Given I have a sprout with cognitiveRouting data
  When I open the Finishing Room
  Then I should see a Cognitive Routing item with icon (🧠)
  And the summary should show the path name

Scenario: Cognitive Routing expands to show details
  Given the Cognitive Routing item is displayed
  When I click on the Cognitive Routing item
  Then I should see expanded details:
    | Field | Example Value |
    | Path | deep-dive → cost-dynamics |
    | Prompt | Analytical research mode |
    | Inspiration | User query on ownership models |

Scenario: Cognitive Routing collapses on second click
  Given the Cognitive Routing details are expanded
  When I click on the item again
  Then the details should collapse
  And only the summary should be visible
```

**Traceability:** Spec section "5.1.2 Cognitive Routing Details"

---

### US-B003: Display Knowledge Sources List

**As an** Explorer
**I want to** see which knowledge files informed the research
**So that** I can assess the document's source coverage

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — source transparency
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Knowledge sources displayed as list
  Given I have a sprout with knowledgeFiles: ["grove-overview.md", "ratchet-effect.md"]
  When I open the Finishing Room
  Then the Provenance Panel should show a "Knowledge Sources" section
  And I should see a list with:
    | Source |
    | grove-overview.md |
    | ratchet-effect.md |

Scenario: Empty knowledge sources handled gracefully
  Given I have a sprout with no knowledgeFiles
  When I open the Finishing Room
  Then the Knowledge Sources section should show "No sources referenced"
```

**Traceability:** Spec section "5.1.3 Knowledge Sources Section"

---

## Epic C: Document Viewer `[S2||SFR-Display]`

Center column with json-render powered display.

### US-C001: Install and Configure JSON-Render

**As a** Developer
**I want to** have json-render properly configured
**So that** I can render ResearchDocument artifacts dynamically

**INVEST Assessment:**
- **I**ndependent: Yes — infrastructure setup
- **N**egotiable: No — required for viewer
- **V**aluable: Yes — foundational
- **E**stimable: Yes — ~4 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** M

**Acceptance Criteria:**

```gherkin
Scenario: JSON-render packages installed
  Given the project package.json
  When I run npm install
  Then @json-render/core should be available
  And @json-render/react should be available

Scenario: ResearchCatalog created
  Given json-render is installed
  When I import the ResearchCatalog
  Then it should define components: ResearchHeader, AnalysisBlock, SourceList, LimitationsBlock, Metadata

Scenario: ResearchRegistry maps to React components
  Given the ResearchCatalog is defined
  When I import the ResearchRegistry
  Then each catalog component should have a React implementation
```

**Traceability:** Spec section "11.2 JSON-Render Architecture"

---

### US-C002: Render ResearchDocument via JSON-Render

**As an** Explorer
**I want to** see the research document rendered as interactive components
**So that** I can explore the content in a structured way

**INVEST Assessment:**
- **I**ndependent: Depends on US-C001
- **N**egotiable: Yes — component styling flexible
- **V**aluable: Yes — core viewer functionality
- **E**stimable: Yes — ~6 hours
- **S**mall: No — core epic story
- **T**estable: Yes

**Priority:** P0 | **Complexity:** L

**Acceptance Criteria:**

```gherkin
Scenario: ResearchDocument renders all components
  Given I have a sprout with a complete ResearchDocument
  When I open the Finishing Room
  Then I should see a ResearchHeader with position and query
  And I should see an AnalysisBlock with markdown content
  And I should see a SourceList with citations
  And I should see Metadata with status and confidence score

Scenario: Partial documents render available components
  Given I have a ResearchDocument with no limitations field
  When I open the Finishing Room
  Then the LimitationsBlock should not render
  And other components should render normally

Scenario: Invalid JSON shows error state
  Given the ResearchDocument JSON is malformed
  When I open the Finishing Room
  Then I should see a user-friendly error message
  And the error should suggest "Document rendering failed"
  And a fallback markdown view should be offered
```

**Traceability:** Spec section "5.2.1 ResearchObject Component Catalog"

---

### US-C003: Toggle Raw JSON View

**As a** Power User
**I want to** see the raw JSON data structure
**So that** I can inspect the AI-generated artifact for debugging or learning

**INVEST Assessment:**
- **I**ndependent: Depends on US-C002
- **N**egotiable: Yes — toggle placement flexible
- **V**aluable: Yes — transparency for power users
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P1 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Toggle button visible in header
  Given I open the Finishing Room
  Then I should see a </> code toggle button in the preview header

Scenario: Toggle shows raw JSON
  Given I am viewing the rendered document
  When I click the </> toggle button
  Then the rendered view should be replaced with raw JSON
  And the JSON should be formatted with syntax highlighting
  And the toggle button should appear "active"

Scenario: Toggle returns to rendered view
  Given I am viewing raw JSON
  When I click the </> toggle button again
  Then the JSON view should be replaced with rendered components
  And the toggle button should appear "inactive"
```

**Traceability:** Spec section "5.2.2 Raw JSON Toggle"

---

### US-C004: Display Citations with Links

**As an** Explorer
**I want to** see source citations as clickable links
**So that** I can verify the research sources

**INVEST Assessment:**
- **I**ndependent: Part of US-C002
- **N**egotiable: Yes
- **V**aluable: Yes — source verification
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Citations render with numbers and links
  Given a ResearchDocument with citations array
  When I view the SourceList component
  Then each citation should show:
    | Element | Example |
    | Number | [1] |
    | Title | Anthropic API Pricing Documentation |
    | Link | Clickable URL |

Scenario: Citation links open in new tab
  Given I see a citation with a URL
  When I click the citation link
  Then the URL should open in a new browser tab
  And the current page should remain open
```

**Traceability:** Spec section "5.2.1 Component: SourceList"

---

## Epic D: Action Panel `[S3||SFR-Actions]`

Right column with primary, secondary, and tertiary actions.

### US-D001: Submit Revision Instructions (Stubbed)

**As an** Explorer
**I want to** provide feedback on the research for improvement
**So that** I can guide refinement of the document (future: agent requeue)

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — stub vs. full implementation
- **V**aluable: Yes — refinement loop UX
- **E**stimable: Yes — ~3 hours (stub)
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** M

**Note:** v1.0 stubs this action. Full agent requeue in v1.1.

**Acceptance Criteria:**

```gherkin
Scenario: Revision form displayed in primary section
  Given I open the Finishing Room
  Then I should see a "Revise & Resubmit" section (green accent)
  And I should see a textarea for revision instructions
  And I should see a "Submit for Revision" button

Scenario: Submit revision shows confirmation (v1.0 stub)
  Given I have entered revision instructions
  When I click "Submit for Revision"
  Then a confirmation toast should appear: "Revision submitted for processing!"
  And a "sproutRefinementSubmitted" event should be emitted
  And the textarea should be cleared

Scenario: Empty submission shows validation
  Given the revision textarea is empty
  When I click "Submit for Revision"
  Then nothing should happen
  Or a subtle validation message should appear
```

**Traceability:** Spec section "5.3.1 Primary Action"

---

### US-D002: Archive Sprout to Garden

**As an** Explorer
**I want to** archive a sprout for later reference
**So that** I can save interesting research without promoting it

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — personal collection
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Archive button in tertiary section
  Given I open the Finishing Room
  Then I should see tertiary actions section at bottom
  And I should see "Archive to Garden" button with 📁 icon

Scenario: Archive updates sprout status
  Given I am viewing a sprout in the Finishing Room
  When I click "Archive to Garden"
  Then the sprout status should update to "archived"
  And a confirmation toast should appear: "Sprout archived to your garden"
  And a "sproutArchived" event should be emitted
  And the modal should close
```

**Traceability:** Spec section "5.3.3 Tertiary Actions"

---

### US-D003: Add Private Note

**As an** Explorer
**I want to** add personal annotations to a sprout
**So that** I can record my thoughts without affecting the document

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes — personal context
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P1 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Add note button opens input
  Given I am in the Finishing Room
  When I click "Add Private Note" (📝 icon)
  Then a note input field should appear
  And I should be able to type my annotation

Scenario: Save note persists to sprout
  Given I have entered a note
  When I click "Save Note" or press Enter
  Then the note should be saved to sprout.notes
  And a confirmation should appear: "Note saved"
  And a "sproutAnnotated" event should be emitted
```

**Traceability:** Spec section "5.3.3 Tertiary Actions"

---

### US-D004: Export Document

**As an** Explorer
**I want to** download the research document
**So that** I can reference it offline or share it externally

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes — format options
- **V**aluable: Yes — portability
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P1 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Export button triggers download
  Given I am in the Finishing Room
  When I click "Export Document" (📤 icon)
  Then a file download should initiate
  And the filename should include sprout ID and date
  And the format should be Markdown (.md)

Scenario: Export includes provenance header
  Given I export a document
  When I open the downloaded file
  Then I should see metadata header with:
    | Field | Example |
    | Generated | 2026-01-15 |
    | Lens | Academic Researcher |
    | Cognitive Path | deep-dive → cost-dynamics |
```

**Traceability:** Spec section "5.3.3 Tertiary Actions"

---

## Epic E: Integration `[S3||SFR-Actions]`

Event architecture and system wiring.

### US-E001: Emit Engagement Events

**As the** System
**I want to** emit events for all user actions
**So that** analytics and other systems can observe user behavior

**INVEST Assessment:**
- **I**ndependent: Integrated across stories
- **N**egotiable: Yes — event names adjustable
- **V**aluable: Yes — observability
- **E**stimable: Yes — ~2 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** S

**Acceptance Criteria:**

```gherkin
Scenario: Events emitted for all actions
  Given the useEngagementBus hook is connected
  When I perform actions in the Finishing Room
  Then the following events should be emitted:
    | Action | Event |
    | Open modal | finishingRoomOpened |
    | Close modal | finishingRoomClosed |
    | Submit revision | sproutRefinementSubmitted |
    | Archive | sproutArchived |
    | Add note | sproutAnnotated |

Scenario: Events include relevant payloads
  Given I emit a "sproutRefinementSubmitted" event
  Then the payload should include:
    | Field | Type |
    | sproutId | string |
    | revisionNotes | string |
```

**Traceability:** Spec section "8.1 Engagement Bus Events"

---

### US-E002: Keyboard Navigation Support

**As an** Explorer using keyboard
**I want to** navigate the Finishing Room without a mouse
**So that** I can use the interface accessibly

**INVEST Assessment:**
- **I**ndependent: Cross-cutting
- **N**egotiable: No — accessibility requirement
- **V**aluable: Yes — WCAG compliance
- **E**stimable: Yes — ~3 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** M

**Acceptance Criteria:**

```gherkin
Scenario: Tab navigation through interactive elements
  Given I open the Finishing Room
  When I press Tab repeatedly
  Then focus should move through elements in logical order:
    | Order | Element |
    | 1 | Close button |
    | 2 | Provenance items |
    | 3 | Document viewer |
    | 4 | Revision textarea |
    | 5 | Submit button |
    | 6 | Tertiary actions |

Scenario: Focus trapped within modal
  Given the Finishing Room is open
  When I tab past the last focusable element
  Then focus should cycle back to the first element
  And focus should NOT escape to background content

Scenario: Escape closes modal
  Given the Finishing Room is open
  When I press Escape
  Then the modal should close
  And focus should return to the GardenTray trigger
```

**Traceability:** Spec section "9. Accessibility Requirements"

---

### US-D005: Declarative Promotion Checklist (Add to Field)

**As a** Cultivator
**I want to** select which parts of the research to promote to the Knowledge Commons
**So that** I can contribute curated content without including everything

**INVEST Assessment:**
- **I**ndependent: Depends on document viewer rendering
- **N**egotiable: Yes — checklist items adjustable
- **V**aluable: Yes — core contribution flow, DEX declarative sovereignty
- **E**stimable: Yes — ~4 hours
- **S**mall: Yes
- **T**estable: Yes

**Priority:** P0 | **Complexity:** M

**Backend API:** `POST /api/knowledge/upload` (Available)

**Acceptance Criteria:**

```gherkin
Scenario: Promotion checklist displayed in secondary section
  Given I open the Finishing Room
  Then I should see an "Add to Field" section (cyan accent)
  And I should see a checklist with items:
    | Item | Default State |
    | Thesis Statement | Checked |
    | Full Analysis | Unchecked |
    | Discovered Sources | Checked |
    | My Annotation | Unchecked |

Scenario: Toggle checklist items
  Given I see the promotion checklist
  When I click on "Full Analysis"
  Then the checkbox should become checked
  And the item should show a cyan highlight

Scenario: Promote selected content
  Given I have checked "Thesis Statement" and "Discovered Sources"
  When I click "Promote Selected"
  Then the system should call POST /api/knowledge/upload with:
    | Field | Value |
    | title | Sprout query |
    | content | Assembled thesis + sources |
    | tier | 2 |
    | sourceType | sprout |
    | sourceUrl | sprout ID reference |
  And a confirmation toast should appear: "Content promoted to Knowledge Commons"
  And a "sproutPromotedToRag" event should be emitted

Scenario: Empty selection shows validation
  Given no checklist items are selected
  When I click "Promote Selected"
  Then a validation message should appear: "Select at least one item to promote"
  And the API should NOT be called
```

**Traceability:** Spec section "5.3.2 Secondary Action"

---

## Deferred to v1.1

### US-D006: Actual Agent Requeue (DEFERRED)

**Reason:** Requires research agent queue infrastructure

**Original Flow:** Revision instructions are sent to agent queue, sprout is re-processed with new context, user notified when new version ready.

**v1.1 Prerequisite:** Agent queue service, WebSocket notifications

---

## Open Questions

1. **Backend Readiness:** Is the RAG write service available for "Add to Field"? If yes, we can include US-D005 in v1.0.

2. **Agent Queue:** Is the research agent queue infrastructure ready? If yes, we can implement full "Revise & Resubmit" instead of stub.

3. **JSON-Render Version:** Confirm exact package versions for `@json-render/core` and `@json-render/react` from npm registry.

4. **Terminology Schema:** Should `CognitiveRouting` be a new interface or extend `SproutProvenance`? Coordinate with terminology-migration-4d sprint.

---

## Summary

| Story ID | Title | Sprint | Priority | Complexity |
|----------|-------|--------|----------|------------|
| US-A001 | Open Finishing Room from GardenTray | S1 | P0 | S |
| US-A002 | Three-Column Layout Renders | S1 | P0 | S |
| US-A003 | Close Modal via Button or Escape | S1 | P0 | S |
| US-A004 | Status Bar Displays Metadata | S1 | P1 | S |
| US-B001 | Display Lens Origin | S2|| | P0 | S |
| US-B002 | Display Cognitive Routing | S2|| | P0 | M |
| US-B003 | Display Knowledge Sources | S2|| | P0 | S |
| US-B004 | Collapsible Panel Sections | S2|| | P2 | S |
| US-C001 | Install and Configure JSON-Render | S2|| | P0 | M |
| US-C002 | Render ResearchDocument | S2|| | P0 | L |
| US-C003 | Toggle Raw JSON View | S2|| | P1 | S |
| US-C004 | Display Citations with Links | S2|| | P0 | S |
| US-D001 | Submit Revision Instructions (Stub) | S3|| | P0 | M |
| US-D002 | Archive Sprout to Garden | S3|| | P0 | S |
| US-D003 | Add Private Note | S3|| | P1 | S |
| US-D004 | Export Document | S3|| | P1 | S |
| US-D005 | Declarative Promotion Checklist | S3|| | P0 | M |
| US-E001 | Emit Engagement Events | S3|| | P0 | S |

**Sprint Breakdown:**
| Sprint | Stories | Effort |
|--------|---------|--------|
| S1-SFR-Shell | 4 | 🌱 Small |
| S2\|\|SFR-Display | 8 | 🌿 Medium |
| S3\|\|SFR-Actions | 6 | 🌿 Medium |

**Total Stories:** 18
**Deferred:** 1 (US-D006 - Agent Requeue)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-D001 allows user to declare refinement intent; deferred checklist (US-D005) will enable declarative content selection |
| **Capability Agnosticism** | US-C001/C002 use json-render which accepts any AI-generated JSON matching the catalog schema |
| **Provenance as Infrastructure** | US-B001, US-B002, US-B003 expose full Cognitive Routing and source attribution |
| **Organic Scalability** | Component catalog pattern (US-C001) supports adding new document types without restructuring |

---

## Test Priority Matrix

| Priority | Stories | Automation |
|----------|---------|------------|
| P0 Critical | US-A001, A002, A003, B001, B002, B003, C001, C002, C004, D001, D002, E001, E002 | Playwright E2E |
| P1 Important | US-A004, C003, D003, D004 | Manual + Unit |
| Deferred | US-D005, D006 | v1.1 |

---

*User Stories & Acceptance Criteria v1.0 — Ready for stakeholder review*
