# User Stories & Acceptance Criteria v1.0 Review

**Sprint:** G - Sprout Tier Progression
**Codename:** S4-SL-TierProgression
**Epic:** Sprout Lifecycle v1
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Ready for Implementation

---

## Critical Observations

### 1. Scope is Well-Contained

The design team has done excellent work constraining Phase 0 scope. No over-engineering detected.

**Observation:** All filtering, metrics, and auto-advancement features explicitly deferred to future phases.

**Recommendation:** Maintain discipline - do not add "quick wins" during implementation.

### 2. Schema Already Supports Tiers

**Observation:** The existing `SproutStage` type (`tender`, `rooting`, `branching`, `hardened`, `grafted`, `established`, `dormant`, `withered`) already exists. No schema migration required.

**Recommendation:** Use UI-layer mapping from stage to user-facing tier (established = sapling).

### 3. Single Code Gap Identified

**Observation:** `ActionPanel.tsx` line ~47-68 performs RAG upload but does NOT update sprout stage.

**Recommendation:** US-G003 is the critical path story - implement first.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Tier filtering in GardenTray | Defer to Phase 1 | Minimal value at low sprout counts |
| Auto-advancement (tree/grove) | Defer to Phase 2 | Requires usage signals infrastructure |
| Custom SVG icons | Defer to Phase 5 | Emoji-first for fast MVP |
| Tier history timeline | Collapsed by default | Full history is secondary |
| First-promotion explainer dialog | Keep but add "don't show again" | Balance education vs. friction |

---

## Epic 1: Component Foundation

### US-G001: TierBadge Component

**As an** Explorer
**I want to** see a visual tier badge on my sprouts
**So that** I can understand the maturity level of my knowledge at a glance

**INVEST Assessment:**
- **I**ndependent: Yes - Pure presentation component
- **N**egotiable: Yes - Styling details flexible
- **V**aluable: Yes - Core visual for lifecycle understanding
- **E**stimable: Yes - 1-2 days
- **S**mall: Yes - Single component
- **T**estable: Yes - Visual snapshot tests

**Acceptance Criteria:**

```gherkin
Scenario: TierBadge renders correct emoji for each tier
  Given the TierBadge component is rendered
  When I pass different tier values
  Then the component displays the correct emoji:
    | Tier    | Emoji |
    | seed    | 🌰    |
    | sprout  | 🌱    |
    | sapling | 🌿    |
    | tree    | 🌳    |

Scenario: TierBadge renders at correct sizes
  Given the TierBadge component is rendered
  When I pass different size values
  Then the emoji renders at the correct pixel size:
    | Size | Pixels |
    | sm   | 16px   |
    | md   | 20px   |
    | lg   | 24px   |

Scenario: TierBadge shows label when enabled
  Given the TierBadge component is rendered with showLabel=true
  When I view the badge
  Then I see the tier name next to the emoji
  And the label uses the correct typography (Inter, 14px for md)

Scenario: TierBadge applies pending state styling
  Given a sprout with status "pending"
  When I view its TierBadge
  Then the emoji appears at 40% opacity
  And the emoji has a grayscale filter applied

Scenario: TierBadge applies active state styling
  Given a sprout with status "active"
  When I view its TierBadge
  Then the emoji has a subtle pulse animation (2s cycle)

Scenario: TierBadge has accessible ARIA label
  Given a sprout with tier "sapling" and status "ready"
  When a screen reader reads the TierBadge
  Then it announces "Sapling tier, ready status"
```

**Traceability:** Design Spec section "Component Specification: TierBadge"

**Priority:** P0 | **Complexity:** S

---

## Epic 2: GardenTray Integration

### US-G002: Tier Badge in GardenTray Cards

**As an** Explorer
**I want to** see tier badges on my sprout cards in the GardenTray
**So that** I can visually scan which sprouts have been promoted

**INVEST Assessment:**
- **I**ndependent: Yes - Depends only on US-G001
- **N**egotiable: Yes - Placement/styling flexible
- **V**aluable: Yes - Primary tier visibility surface
- **E**stimable: Yes - 1 day
- **S**mall: Yes - Component integration
- **T**estable: Yes - Visual + functional tests

**Acceptance Criteria:**

```gherkin
Scenario: GardenTray collapsed view shows tier emoji
  Given I have sprouts in my garden
  And the GardenTray is in collapsed mode
  When I view the tray
  Then each sprout shows its tier emoji at 16px size
  And no tier label is displayed

Scenario: GardenTray expanded view shows tier emoji
  Given I have sprouts in my garden
  And the GardenTray is in expanded mode
  When I view the tray
  Then each sprout shows its tier emoji at 20px size
  And the sprout title appears next to the emoji

Scenario: Tier badges reflect actual sprout tiers
  Given I have sprouts at different tiers:
    | Title                    | Stage       | Expected Tier |
    | Ratchet effect research  | established | sapling       |
    | Context window limits    | hardened    | sprout        |
    | New pending query        | tender      | seed          |
  When I view the GardenTray
  Then each sprout displays the correct tier badge

Scenario: Promoted sprout updates badge in tray
  Given I have a sprout with tier "sprout" in my garden
  And I promote it to sapling in the Finishing Room
  When I return to the main view
  Then the GardenTray shows the updated "sapling" badge (🌿)
  And no page refresh is required
```

**Traceability:** Design Spec section "GardenTray Integration"

**Priority:** P0 | **Complexity:** S

---

## Epic 3: Finishing Room Integration

### US-G003: Tier Badge in Finishing Room Header

**As an** Explorer
**I want to** see a prominent tier badge in the Finishing Room modal header
**So that** I understand the current lifecycle stage of the sprout I'm reviewing

**INVEST Assessment:**
- **I**ndependent: Yes - Depends only on US-G001
- **N**egotiable: Yes - Layout details flexible
- **V**aluable: Yes - Contextual tier awareness
- **E**stimable: Yes - 0.5 days
- **S**mall: Yes - Header modification
- **T**estable: Yes - Visual tests

**Acceptance Criteria:**

```gherkin
Scenario: Finishing Room header shows current tier
  Given I open a sprout in the Finishing Room
  When the modal loads
  Then I see the tier badge (24px) in the left section of the header
  And I see the tier label next to the badge (e.g., "Sprout")

Scenario: Header shows promotion hint for sprouts
  Given I open a sprout with tier "sprout"
  When I view the Finishing Room header
  Then I see the hint text "Add to Field → 🌿"
  And the hint appears below the tier label

Scenario: Header shows promoted status for saplings
  Given I open a sprout with tier "sapling"
  When I view the Finishing Room header
  Then I see the label "In Knowledge Base"
  And no promotion hint is shown

Scenario: Header tier updates after promotion
  Given I am viewing a sprout in the Finishing Room
  And the current tier is "sprout"
  When I complete the "Add to Field" promotion action
  Then the header tier badge updates to 🌿
  And the label changes to "Sapling"
  And the hint changes to "In Knowledge Base"
```

**Traceability:** Design Spec section "Finishing Room Header Integration"

**Priority:** P0 | **Complexity:** S

---

### US-G004: Tier Section in Provenance Panel

**As an** Explorer
**I want to** see tier information in the provenance panel
**So that** I understand the lifecycle context alongside other metadata

**INVEST Assessment:**
- **I**ndependent: Yes - Parallel to header work
- **N**egotiable: Yes - Content/layout flexible
- **V**aluable: Yes - Rich provenance context
- **E**stimable: Yes - 1 day
- **S**mall: Yes - Panel section
- **T**estable: Yes - Content verification

**Acceptance Criteria:**

```gherkin
Scenario: Provenance panel shows tier section
  Given I open a sprout in the Finishing Room
  When I view the provenance panel (left column)
  Then I see a "Tier & Lifecycle" section
  And it displays the current tier with 20px emoji and label

Scenario: Tier section shows promotion timestamp for saplings
  Given I open a promoted sprout (sapling tier)
  When I view the tier section in provenance panel
  Then I see "Promoted: [date] by you"
  And I see a "View tier history" link (collapsed)

Scenario: Tier history expands on click
  Given I am viewing a promoted sprout's provenance panel
  When I click "View tier history"
  Then the section expands to show the tier progression timeline:
    | Stage   | Date          | Event                    |
    | Sapling | Jan 15, 2026  | Promoted by you          |
    | Sprout  | Jan 10, 2026  | Research completed       |
    | Seed    | Jan 10, 2026  | Captured from /explore   |

Scenario: Tier section shows promotion guidance for sprouts
  Given I open a sprout that has not been promoted
  When I view the tier section in provenance panel
  Then I see "Ready to promote → 🌿 Sapling"
  And I see "Use 'Add to Field' action"
```

**Traceability:** Design Decisions section "Q6: Provenance Panel Display"

**Priority:** P1 | **Complexity:** M

---

## Epic 4: Promotion Wiring

### US-G005: Promotion Updates Sprout Tier

**As an** Explorer
**I want** my sprout tier to update to "sapling" when I promote it
**So that** the botanical lifecycle reflects my curation decisions

**INVEST Assessment:**
- **I**ndependent: Yes - Core functionality
- **N**egotiable: No - Must update tier on promotion
- **V**aluable: Yes - Critical path for lifecycle
- **E**stimable: Yes - 0.5 days
- **S**mall: Yes - Single state update
- **T**estable: Yes - State verification

**Acceptance Criteria:**

```gherkin
Scenario: Successful promotion updates sprout stage
  Given I have a sprout with stage "hardened" (tier: sprout)
  And I am in the Finishing Room action panel
  When I select sources and click "Promote to Sapling"
  And the RAG upload completes successfully
  Then the sprout stage updates to "established"
  And the sprout has a "promotedAt" timestamp set

Scenario: Tier badge updates immediately after promotion
  Given I have just completed a promotion action
  When the stage update succeeds
  Then the header tier badge changes from 🌱 to 🌿
  And the GardenTray badge updates (when visible)
  And no page refresh is required

Scenario: Promotion failure shows error and allows retry
  Given I initiate a promotion action
  And the RAG upload succeeds
  But the stage update fails
  When I see the error state
  Then I see a toast: "Content saved, but tier update failed. Retry?"
  And I can click to retry the stage update

Scenario: Already-promoted sprout cannot be re-promoted
  Given I have a sprout with stage "established" (tier: sapling)
  When I view the action panel
  Then the "Add to Field" section shows "Already in knowledge base"
  And no promotion button is displayed
```

**Traceability:** Product Brief section "The Fix (Identified Code Gap)"

**Priority:** P0 | **Complexity:** S

---

### US-G006: Before/After Tier Preview in Action Panel

**As an** Explorer
**I want to** see a preview of the tier change before I promote
**So that** I understand the value of the action I'm about to take

**INVEST Assessment:**
- **I**ndependent: Yes - Enhancement to existing panel
- **N**egotiable: Yes - Styling flexible
- **V**aluable: Yes - Reduces uncertainty
- **E**stimable: Yes - 0.5 days
- **S**mall: Yes - UI addition
- **T**estable: Yes - Visual verification

**Acceptance Criteria:**

```gherkin
Scenario: Action panel shows tier preview section
  Given I am in the Finishing Room action panel
  And I have selected sources to promote
  When I view the promotion checklist
  Then I see a "Tier Progression Preview" section
  And it shows "Current: 🌱 Sprout" with description
  And it shows "After: 🌿 Sapling" with description

Scenario: Preview clearly communicates value
  Given I am viewing the tier preview
  When I read the after-state description
  Then I see "Searchable in knowledge base"
  And I understand the benefit of promotion

Scenario: CTA button uses tier name
  Given I have selected 2 sources for promotion
  When I view the promote button
  Then it reads "Promote to Sapling (2)"
  And the count reflects selected sources
```

**Traceability:** Design Decisions section "Q7: Action Panel Promotion Preview"

**Priority:** P2 | **Complexity:** S

---

## Epic 5: Animation & Education

### US-G007: Subtle Promotion Animation

**As an** Explorer
**I want to** see a subtle visual confirmation when tier changes
**So that** I have satisfying feedback without disruption

**INVEST Assessment:**
- **I**ndependent: Yes - Pure visual polish
- **N**egotiable: Yes - Animation details flexible
- **V**aluable: Yes - UX polish
- **E**stimable: Yes - 0.5 days
- **S**mall: Yes - CSS animation
- **T**estable: Yes - Animation timing

**Acceptance Criteria:**

```gherkin
Scenario: Promotion triggers 300ms glow animation
  Given I complete a promotion action
  When the tier updates
  Then the tier badge plays a glow animation
  And the animation lasts 300ms
  And the badge scales to 1.05x at peak
  And a green glow appears (box-shadow: 0 0 12px)

Scenario: Animation respects reduced motion preference
  Given I have prefers-reduced-motion enabled in my OS
  When I complete a promotion action
  Then no animation plays
  And the tier badge updates instantly

Scenario: Success toast appears after animation
  Given I complete a promotion action
  When the animation finishes (T=400ms)
  Then a toast notification appears
  And it shows "Promoted to Sapling"
  And it shows the source count added
```

**Traceability:** Design Spec section "Promotion Animation Sequence"

**Priority:** P1 | **Complexity:** S

---

### US-G008: Tier Tooltip Education

**As an** Explorer
**I want to** hover on a tier badge to learn what it means
**So that** I understand the lifecycle without reading documentation

**INVEST Assessment:**
- **I**ndependent: Yes - Pure education layer
- **N**egotiable: Yes - Content flexible
- **V**aluable: Yes - Progressive disclosure
- **E**stimable: Yes - 0.5 days
- **S**mall: Yes - Tooltip content
- **T**estable: Yes - Content verification

**Acceptance Criteria:**

```gherkin
Scenario: Tooltip appears on badge hover
  Given I am viewing a tier badge in GardenTray or Finishing Room
  When I hover over the badge for 500ms
  Then a tooltip appears with tier information

Scenario: Tooltip content matches tier
  Given I hover over different tier badges
  Then each shows the correct tooltip content:
    | Tier    | Title   | Description                              | Action                    |
    | seed    | Seed    | Raw capture, research pending            | -                         |
    | sprout  | Sprout  | Research complete, ready to promote      | Add to Field → 🌿 Sapling |
    | sapling | Sapling | Searchable in knowledge base             | Grows with retrieval      |
    | tree    | Tree    | Proven valuable through 5+ retrievals    | -                         |

Scenario: Tooltip accessible via keyboard
  Given I navigate to a tier badge using Tab key
  When the badge receives focus
  Then the tooltip appears
  And screen reader announces the tooltip content
```

**Traceability:** Design Decisions section "Q5: Tier Education Strategy"

**Priority:** P1 | **Complexity:** S

---

## Deferred to Phase 1+

### US-G009: Tier Filtering in GardenTray (DEFERRED)

**Reason:** Adds complexity, minimal value at low sprout counts

**Original Flow:** Filter dropdown with tier options (Seeds, Sprouts, Saplings, Trees)

**Phase 1 Prerequisite:** Users have 20+ sprouts to make filtering valuable

---

### US-G010: Auto-Advancement to Tree Tier (DEFERRED)

**Reason:** Requires usage signals infrastructure (retrieval count, utility score)

**Original Flow:** Saplings automatically advance to Tree after 5+ retrievals

**Phase 2 Prerequisite:** Observable signals sprint, retrieval tracking

---

### US-G011: First-Promotion Explainer Dialog (DEFERRED TO P2)

**Reason:** Nice-to-have education, tooltips provide sufficient guidance

**Original Flow:** Modal explaining tiers on first promotion with "don't show again" checkbox

**Implementation:** Can be added if user testing shows confusion

---

## Open Questions

1. **Backward compatibility mapping** — Confirmed: existing sprouts without explicit stage map to `hardened` (tier: sprout). No migration needed.

2. **Error recovery** — Confirmed: If RAG succeeds but stage update fails, show error with retry option.

3. **promotedAt timestamp** — Confirmed: Add to schema on promotion for provenance tracking.

---

## Summary

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-G001 | TierBadge Component | P0 | S |
| US-G002 | Tier Badge in GardenTray | P0 | S |
| US-G003 | Tier Badge in Finishing Room Header | P0 | S |
| US-G004 | Tier Section in Provenance Panel | P1 | M |
| US-G005 | Promotion Updates Sprout Tier | P0 | S |
| US-G006 | Before/After Tier Preview | P2 | S |
| US-G007 | Subtle Promotion Animation | P1 | S |
| US-G008 | Tier Tooltip Education | P1 | S |

**Total v1.0 Stories:** 8
**Deferred:** 3

**Estimated Effort:** 5-6 days (matches 5-week timeline with buffer)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-G005 ensures promotion is user-initiated. No auto-advancement in Phase 0. Tier display is purely informational. |
| **Capability Agnosticism** | US-G001/G002/G003 display state, not model info. Tier progression works regardless of which model generated the content. |
| **Provenance as Infrastructure** | US-G004 shows tier history in provenance panel. US-G005 adds `promotedAt` timestamp. Full lifecycle is traceable. |
| **Organic Scalability** | Component API (US-G001) designed for extension. 5-tier system scales to Phases 1-7 without redesign. |

---

## Implementation Order

**Recommended sequence based on dependencies:**

1. **US-G001** (TierBadge Component) - Foundation for all other stories
2. **US-G005** (Promotion Updates Tier) - Critical path, enables testing
3. **US-G002** (GardenTray Integration) - Most visible surface
4. **US-G003** (Finishing Room Header) - Contextual display
5. **US-G007** (Animation) - Polish for promotion flow
6. **US-G004** (Provenance Panel) - Detailed context
7. **US-G008** (Tooltips) - Education layer
8. **US-G006** (Before/After Preview) - Nice-to-have enhancement

---

## Test File Structure (Phase 3 Scaffolding)

```
tests/
├── unit/
│   └── components/
│       └── TierBadge.test.tsx        # US-G001 scenarios
├── integration/
│   └── sprout-promotion.test.tsx      # US-G005 scenarios
└── e2e/
    ├── garden-tray-tiers.spec.ts      # US-G002 scenarios
    ├── finishing-room-tier.spec.ts    # US-G003, US-G004 scenarios
    └── tier-promotion-flow.spec.ts    # US-G005, US-G006, US-G007 scenarios
```

---

*User Stories extracted by User Story Refinery v1*
*Sprint: S4-SL-TierProgression | Epic: Sprout Lifecycle v1*
*"Every story is testable. Every test traces to a story."*
