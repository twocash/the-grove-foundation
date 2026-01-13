# User Stories & Acceptance Criteria (v1.0 Review)

**Sprint:** CC - Experience Console Cleanup
**Codename:** console-cleanup-v1
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Draft for Review
**Created:** 2026-01-13
**Spec Source:** `docs/sprints/experience-console-cleanup-v1/SPEC.md`

---

## Critical Observations

Before diving into stories, the following observations emerged from spec analysis:

### 1. CreateDropdown Already Exists ✓

**Discovery:** The `CreateDropdown` component (`src/bedrock/components/CreateDropdown.tsx`) is already built and functional. The spec assumes this needs to be created, but it's a matter of *wiring* the existing component.

**Implication:** US-CC002 complexity is S (Small), not M (Medium).

### 2. SINGLETON Auto-Creation Pattern Needed

**Issue:** The spec proposes checking and creating defaults in a useEffect, but doesn't specify:
- When exactly this runs (app init? console mount?)
- How to avoid duplicate creation on re-renders
- Whether to use localStorage or Supabase for persistence

**Recommendation:** Create defaults on **console mount** if no instances exist. Use existing data hook's persistence layer.

### 3. Empty State Component May Already Exist

**Discovery:** Console Factory (`console-factory.tsx:617`) already has `<EmptyStateComponent onCreate={handleCreate} />` placeholder. Need to verify if a reusable EmptyState exists or needs creation.

**Recommendation:** Check `src/bedrock/primitives/` for existing EmptyState. Reuse if available.

### 4. Type-Specific Empty States Not Addressed

**Gap:** The spec shows a generic empty state, but when filtering by type (e.g., "Research Agent"), the empty state should be type-specific.

**Recommendation:** Empty state should use `typeDefinition.label` and `typeDefinition.icon` when a type filter is active.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Default creation timing | On console mount | Simpler than app init, avoids race conditions |
| Empty state variants | Single component with dynamic text | Avoids component proliferation |
| SINGLETON enforcement | Log warning only | Full enforcement is v1.1 scope |
| Persistence verification | Manual test | Automated E2E tests are downstream |

---

## Epic 1: Default Instance Seeding

### US-CC001: Auto-Create SINGLETON Defaults

**As a** Cultivator opening Experience Console
**I want to** see default configs for SINGLETON types (Research Agent, Writer Agent)
**So that** I can immediately configure these features without manual creation

**INVEST Assessment:**
- **I**ndependent: Yes — Can be developed and tested standalone
- **N**egotiable: Yes — Creation timing (mount vs. init) is flexible
- **V**aluable: Yes — Unblocks research pipeline usability
- **E**stimable: Yes — Small, well-defined scope
- **S**mall: Yes — Single hook modification
- **T**estable: Yes — Clear pass/fail: instances exist on load

**Acceptance Criteria:**

```gherkin
Scenario: Default Research Agent Config exists on load
  Given I open the Experience Console
  And no Research Agent Config instance exists
  When the console finishes loading
  Then a Research Agent Config instance should be created
  And it should use DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD values
  And meta.title should be "Research Agent Config"
  And meta.status should be "active"

Scenario: Default Writer Agent Config exists on load
  Given I open the Experience Console
  And no Writer Agent Config instance exists
  When the console finishes loading
  Then a Writer Agent Config instance should be created
  And it should use DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD values
  And meta.title should be "Writer Agent Config"
  And meta.status should be "active"

Scenario: Existing instances are not duplicated
  Given I open the Experience Console
  And a Research Agent Config instance already exists
  When the console finishes loading
  Then no new Research Agent Config should be created
  And the existing instance should remain unchanged

Scenario: Default configs appear in filtered view
  Given default configs have been created
  When I filter by "Research Agent" type
  Then I should see exactly one Research Agent Config
  And when I filter by "Writer Agent" type
  Then I should see exactly one Writer Agent Config

Scenario: SINGLETON constraint logged on duplicate attempt
  Given a Research Agent Config instance exists
  When I attempt to create another Research Agent Config
  Then a console warning should be logged
  And the UI should indicate only one active instance allowed
```

**Traceability:** Spec section "Default Instance Creation", AC-1 through AC-4

**Priority:** P0 — Blocks pipeline usability
**Complexity:** S — Single hook modification

---

## Epic 2: Streamlined Creation Flow

### US-CC002: +New Dropdown Type Selector

**As a** Cultivator creating a new Experience object
**I want to** select the type from an inline dropdown
**So that** I can create configs faster (one click instead of modal flow)

**INVEST Assessment:**
- **I**ndependent: Yes — CreateDropdown component already exists
- **N**egotiable: Yes — Dropdown styling/positioning flexible
- **V**aluable: Yes — Reduces clicks, improves UX
- **E**stimable: Yes — Wiring existing component
- **S**mall: Yes — Component exists, just need to connect
- **T**estable: Yes — Dropdown opens, type creates instance

**Acceptance Criteria:**

```gherkin
Scenario: +New button shows dropdown
  Given I am on Experience Console
  When I click the "+New" button
  Then a dropdown menu should appear below the button
  And it should not open a modal dialog

Scenario: Dropdown lists all registered Experience types
  Given the +New dropdown is open
  Then I should see all types from EXPERIENCE_TYPE_REGISTRY:
    | Type | Label | Icon |
    | system-prompt | System Prompt | psychology |
    | feature-flag | Feature Flag | toggle_on |
    | research-agent-config | Research Agent | science |
    | writer-agent-config | Writer Agent | edit_note |
    | prompt-architect-config | Prompt Architect | architecture |

Scenario: Selecting type creates instance
  Given the +New dropdown is open
  When I click "Feature Flag"
  Then a new Feature Flag instance should be created
  And the dropdown should close
  And the inspector should open showing the new instance

Scenario: Dropdown closes on outside click
  Given the +New dropdown is open
  When I click outside the dropdown
  Then the dropdown should close
  And no instance should be created

Scenario: Dropdown closes on Escape key
  Given the +New dropdown is open
  When I press the Escape key
  Then the dropdown should close
  And no instance should be created

Scenario: Dropdown is keyboard navigable
  Given the +New dropdown is open
  When I press ArrowDown
  Then focus should move to the first type option
  When I press Enter
  Then that type instance should be created
```

**Traceability:** Spec section "+New Dropdown", AC-5 through AC-8

**Priority:** P0 — Core UX improvement
**Complexity:** S — Wiring existing CreateDropdown component

---

## Epic 3: User Guidance

### US-CC003: Type-Aware Empty State

**As a** Cultivator filtering to a type with no instances
**I want to** see a helpful empty state with guidance
**So that** I know what to do next and can quickly create an instance

**INVEST Assessment:**
- **I**ndependent: Yes — Can implement without other stories
- **N**egotiable: Yes — Message wording, icon choice flexible
- **V**aluable: Yes — Reduces confusion for new users
- **E**stimable: Yes — Single component with dynamic text
- **S**mall: Yes — Template component with type props
- **T**estable: Yes — Empty state visible, CTA functional

**Acceptance Criteria:**

```gherkin
Scenario: Empty state shows when no instances exist
  Given I am on Experience Console
  And no instances of any type exist
  When the console loads
  Then I should see an empty state message
  And it should include an icon
  And it should include guidance text

Scenario: Empty state is type-specific when filtered
  Given I filter to "Research Agent" type
  And no Research Agent Config instances exist
  Then I should see empty state with:
    | Element | Content |
    | Icon | science |
    | Title | No Research Agent configs |
    | Description | Create one to configure research behavior. |
    | CTA Button | Create Research Agent |

Scenario: Empty state CTA creates instance
  Given I see the empty state for "Writer Agent"
  When I click the "Create Writer Agent" button
  Then a new Writer Agent Config should be created
  And the inspector should open showing it
  And the empty state should be replaced by the instance card

Scenario: Empty state styling matches console theme
  Given I see any empty state
  Then the background should use glass-panel styling
  And text should use glass-text colors
  And the CTA button should use GlassButton primary variant

Scenario: Generic empty state when no filter active
  Given no type filter is active
  And no instances exist
  Then I should see generic empty state:
    | Title | No experience objects |
    | Description | Create your first configuration to get started. |
    | CTA | Create New |
```

**Traceability:** Spec section "Empty State Component", AC-9 through AC-11

**Priority:** P1 — Important UX, not blocking
**Complexity:** S — Template component

---

## Epic 4: Data Integrity

### US-CC004: Config Edit Persistence

**As a** Cultivator editing a config
**I want** my changes to persist across page reloads
**So that** the configuration is actually used by the system

**INVEST Assessment:**
- **I**ndependent: Yes — Verifies existing persistence layer
- **N**egotiable: No — Must work correctly
- **V**aluable: Yes — Core functionality requirement
- **E**stimable: Yes — Test existing patterns
- **S**mall: Yes — Verification, not new code
- **T**estable: Yes — Edit → reload → verify

**Acceptance Criteria:**

```gherkin
Scenario: Research Agent Config changes persist
  Given I open a Research Agent Config in the inspector
  And I change searchDepth from 3 to 5
  When I save the config
  And I reload the page
  Then searchDepth should still be 5

Scenario: Writer Agent Config changes persist
  Given I open a Writer Agent Config in the inspector
  And I change voice.formality from "professional" to "academic"
  When I save the config
  And I reload the page
  Then voice.formality should still be "academic"

Scenario: Feature Flag toggle persists
  Given I open a Feature Flag in the inspector
  And I toggle "available" from true to false
  When I save the flag
  And I reload the page
  Then "available" should still be false

Scenario: System Prompt content persists
  Given I open a System Prompt in the inspector
  And I modify the personality field
  When I save the prompt
  And I reload the page
  Then the personality field should contain my changes

Scenario: Meta fields persist
  Given I edit any Experience object
  And I change meta.title to "Custom Title"
  And I change meta.description to "Custom Description"
  When I save and reload
  Then meta.title should be "Custom Title"
  And meta.description should be "Custom Description"
```

**Traceability:** Spec section "Verify Config Persistence", implicit in all ACs

**Priority:** P0 — Critical for functionality
**Complexity:** S — Verification only

---

## Epic 5: Build Quality

### US-CC005: Build Gate Compliance

**As a** developer completing this sprint
**I want** the build to pass without errors
**So that** the sprint can be merged and deployed

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
  Given I open the Experience Console in a browser
  When I open developer tools console
  Then there should be no red error messages
  And there should be no uncaught exceptions

Scenario: Linting passes
  Given I run `npm run lint`
  Then the process should exit with code 0
  Or there should be no errors (warnings acceptable)

Scenario: Dev server starts cleanly
  Given I run `npm run dev`
  When the server starts
  Then it should not show compilation errors
  And I should be able to access /bedrock/experience
```

**Traceability:** Spec section "Build Gates", AC-12 through AC-14

**Priority:** P0 — Required for merge
**Complexity:** S — Standard verification

---

## Deferred to v1.1

### US-CC006: SINGLETON Hard Enforcement (DEFERRED)

**Reason:** v1.0 logs warning; hard prevention requires modal confirmation flow.

**Original Flow:** When user tries to create second SINGLETON instance, block with error modal explaining only one can be active.

**v1.1 Prerequisite:** Design decision on whether to archive previous or block creation.

---

### US-CC007: Bulk Default Seeding (DEFERRED)

**Reason:** v1.0 seeds only Research and Writer agents; future types may need different seeding logic.

**Original Flow:** Iterate all SINGLETON types in registry and seed defaults.

**v1.1 Prerequisite:** Determine which types should auto-seed vs. explicit creation.

---

## Open Questions

1. **Persistence Layer** — Are we using localStorage or Supabase for Experience objects? The existing hooks suggest localStorage for MVP.

2. **Default Instance Naming** — Should defaults be named "Research Agent Config" or "Default Research Agent Config" or just use the type label?

3. **SINGLETON Warning UX** — When warning about duplicate creation, should this be a toast notification or inline message?

4. **Empty State Icon** — Should empty state use the filtered type's icon, or a generic empty state icon?

---

## Summary

| Story ID | Title | Priority | Complexity | Status |
|----------|-------|----------|------------|--------|
| US-CC001 | Auto-Create SINGLETON Defaults | P0 | S | Ready |
| US-CC002 | +New Dropdown Type Selector | P0 | S | Ready |
| US-CC003 | Type-Aware Empty State | P1 | S | Ready |
| US-CC004 | Config Edit Persistence | P0 | S | Ready |
| US-CC005 | Build Gate Compliance | P0 | S | Ready |

**Total v1.0 Stories:** 5
**Deferred:** 2
**Estimated Effort:** 4-6 hours (half-day sprint)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Default payloads come from schema constants (DEFAULT_*_PAYLOAD), not hardcoded in UI. Type options generated from EXPERIENCE_TYPE_REGISTRY. Empty state text derived from typeDefinition.label. |
| **Capability Agnosticism** | N/A — This is a UI polish sprint. No agent/model decisions involved. |
| **Provenance as Infrastructure** | Created defaults will have proper meta.createdAt, meta.createdBy timestamps via existing persistence layer. |
| **Organic Scalability** | Dropdown automatically includes new types added to registry. Empty state component works for any type. Default seeding pattern can extend to future SINGLETON types. |

---

## Test Generation Readiness

These stories are ready for Phase 3 (Test Case Generation):

- **Fixtures needed:** Mock Experience objects, EXPERIENCE_TYPE_REGISTRY snapshot
- **Page objects:** ExperienceConsolePage, InspectorPanel, CreateDropdown
- **Key assertions:** Instance existence, dropdown visibility, empty state rendering

---

## Execution Notes

1. **Start with US-CC002** — CreateDropdown already exists; wiring it unblocks creation flow
2. **Then US-CC001** — Seeding requires creation to work first
3. **Then US-CC003** — Empty state only matters after seeding works
4. **US-CC004 and US-CC005** — Verify throughout and at end

**Critical Path:** US-CC002 → US-CC001 → US-CC003 → US-CC004/005
