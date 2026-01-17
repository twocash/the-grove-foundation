# User Stories & Acceptance Criteria v1.0 Review

**Sprint:** bedrock-ui-compact-v1
**Codename:** Compact Mode
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Ready for Development
**Source Brief:** `docs/briefs/BEDROCK_COMPACT_MODE_BRIEF.md`

---

## Critical Observations

### 1. Scope is Appropriately Minimal

The brief defines a tight scope with two discrete features. No over-engineering detected. This is a well-scoped "polish" sprint.

**Recommendation:** Proceed as specified.

### 2. Accessibility Conditions from UX Chief

The UX Chief review added conditions:
- Focus states required on toggle
- Respect `prefers-reduced-motion`
- Pattern consistency for future toggles

**Recommendation:** Include these as acceptance criteria.

### 3. No Blocking Dependencies

All referenced files exist (`BedrockUIContext`, `console-factory`, `StatCard`). No external dependencies.

**Recommendation:** Sprint can proceed immediately.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Keyboard shortcut (Cmd+Shift+M) | Defer | PM marked as "future enhancement" |
| Toggle analytics | Defer | PM marked as "future enhancement" |
| Responsive auto-hide | Defer | Explicitly out of scope |
| Full Liquid Glass theme | Defer | Explicitly out of scope |

---

## Epic 1: Metrics Bar Toggle

### US-BUC001: Toggle Metrics Bar Visibility

**As a** Bedrock operator
**I want to** hide the metrics bar across all consoles
**So that** I can reclaim vertical screen space on smaller displays

**INVEST Assessment:**
- **I**ndependent: Yes — Can be developed without styling changes
- **N**egotiable: Yes — Toggle placement could vary
- **V**aluable: Yes — Solves stated user pain point
- **E**stimable: Yes — ~1 hour effort
- **S**mall: Yes — Single feature
- **T**estable: Yes — Clear show/hide behavior

**Acceptance Criteria:**

```gherkin
Scenario: Hide metrics bar via toggle
  Given I am viewing any Bedrock console with metrics displayed
  And the metrics bar is currently visible
  When I click the "Hide Stats" toggle in the navigation footer
  Then the metrics bar should disappear
  And the toggle text should change to "Show Stats"
  And the content area should expand to fill the vacated space

Scenario: Show metrics bar via toggle
  Given I am viewing a Bedrock console with metrics hidden
  When I click the "Show Stats" toggle in the navigation footer
  Then the metrics bar should appear
  And the toggle text should change to "Hide Stats"

Scenario: Preference persists across page refresh
  Given I have hidden the metrics bar
  When I refresh the page
  Then the metrics bar should remain hidden
  And the toggle should display "Show Stats"

Scenario: Preference applies across console navigation
  Given I have hidden the metrics bar on Experience Console
  When I navigate to Nursery Console
  Then the metrics bar should also be hidden on Nursery Console

Scenario: Default state shows metrics
  Given I am a new user with no saved preference
  When I first load any Bedrock console
  Then the metrics bar should be visible by default
  And the toggle should display "Hide Stats"
```

**Traceability:** Brief section "Feature 1: Metrics Bar Toggle"

**Priority:** P0 | **Complexity:** S

---

### US-BUC002: Toggle Accessibility Compliance

**As a** keyboard-only operator
**I want to** toggle the metrics bar without a mouse
**So that** I can customize my workspace accessibly

**INVEST Assessment:**
- **I**ndependent: No — Depends on US-BUC001
- **N**egotiable: No — Accessibility is required
- **V**aluable: Yes — Inclusion requirement
- **E**stimable: Yes — Minimal additional effort
- **S**mall: Yes — CSS additions only
- **T**estable: Yes — Focus/keyboard tests

**Acceptance Criteria:**

```gherkin
Scenario: Toggle is keyboard focusable
  Given I am using keyboard navigation
  When I tab through the navigation sidebar
  Then I should be able to focus the metrics toggle button

Scenario: Toggle shows visible focus indicator
  Given I have focused the metrics toggle via keyboard
  Then a visible focus ring should appear around the toggle
  And the focus ring should use the neon-cyan accent color

Scenario: Toggle activates with Enter key
  Given I have focused the metrics toggle
  When I press Enter
  Then the metrics bar visibility should toggle

Scenario: Toggle activates with Space key
  Given I have focused the metrics toggle
  When I press Space
  Then the metrics bar visibility should toggle

Scenario: Screen reader announces toggle state
  Given I am using a screen reader
  When I focus the metrics toggle
  Then the screen reader should announce the current state ("Hide Stats" or "Show Stats")
```

**Traceability:** UX Chief Review "Conditions for Implementation"

**Priority:** P0 | **Complexity:** S

---

### US-BUC003: Respect Motion Preferences

**As an** operator with motion sensitivity
**I want** the metrics bar toggle to respect my system preferences
**So that** I don't experience discomfort from animations

**INVEST Assessment:**
- **I**ndependent: No — Depends on US-BUC001
- **N**egotiable: Yes — Animation approach flexible
- **V**aluable: Yes — Accessibility requirement
- **E**stimable: Yes — CSS media query
- **S**mall: Yes — Single CSS rule
- **T**estable: Yes — Prefers-reduced-motion test

**Acceptance Criteria:**

```gherkin
Scenario: Smooth animation when motion allowed
  Given the user has not enabled "prefers-reduced-motion"
  When the metrics bar is toggled
  Then the metrics bar should animate smoothly (slide/fade)

Scenario: Instant toggle when reduced motion preferred
  Given the user has enabled "prefers-reduced-motion: reduce"
  When the metrics bar is toggled
  Then the metrics bar should appear/disappear instantly without animation
```

**Traceability:** UX Chief Review "Conditions for Implementation"

**Priority:** P1 | **Complexity:** S

---

## Epic 2: Half-Step Styling

### US-BUC004: Tighter StatCard Dimensions

**As a** Bedrock operator
**I want** more compact metric cards
**So that** I can see more content on my screen

**INVEST Assessment:**
- **I**ndependent: Yes — Can be developed without toggle
- **N**egotiable: Yes — Exact pixel values flexible
- **V**aluable: Yes — Addresses "visual weight" pain point
- **E**stimable: Yes — ~30 min effort
- **S**mall: Yes — Single file change
- **T**estable: Yes — Visual comparison

**Acceptance Criteria:**

```gherkin
Scenario: StatCard uses reduced padding
  Given I am viewing a Bedrock console with metrics
  When I inspect the StatCard components
  Then the horizontal padding should be 16px (px-4)
  And the vertical padding should be 12px (py-3)
  And the gap between icon and content should be 12px (gap-3)

Scenario: StatCard icon box is smaller
  Given I am viewing a Bedrock console with metrics
  When I inspect the StatCard icon container
  Then the icon container should be 40x40px (w-10 h-10)
  And the icon should use text-xl size
  And the icon container should have rounded-lg corners

Scenario: StatCard content remains readable
  Given I am viewing StatCards with the updated dimensions
  Then all metric values should be fully visible (no truncation)
  And all metric labels should be fully visible (no truncation)
  And the cards should maintain visual hierarchy

Scenario: All metric card types render correctly
  Given I am viewing the Experience Console
  When I observe all 9 metric card types
  Then each card should render correctly with the new dimensions:
    | Card Type | Should Display |
    | Total | Number + label |
    | System | Number + label |
    | Feature Flag | Number + label |
    | Research | Number + label |
    | Writer | Number + label |
    | Lifecycle | Number + label |
    | Planted | Number + label |
    | Germinating | Number + label |
    | Ready | Number + label |
```

**Traceability:** Brief section "Feature 2: Half-Step Styling"

**Priority:** P1 | **Complexity:** S

---

## Deferred to v1.1

### US-BUC005: Keyboard Shortcut for Toggle (DEFERRED)

**Reason:** PM marked as "future enhancement, not blocking"

**Original Flow:** User presses Cmd+Shift+M to toggle metrics bar

**v1.1 Prerequisite:** Core toggle functionality (US-BUC001)

---

### US-BUC006: Toggle Analytics (DEFERRED)

**Reason:** PM marked as "future enhancement, not blocking"

**Original Flow:** Dev-mode console.log tracks toggle usage

**v1.1 Prerequisite:** Core toggle functionality (US-BUC001)

---

## Open Questions

None. All requirements are clear and have passed PM and UX Chief review.

---

## Summary

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-BUC001 | Toggle Metrics Bar Visibility | P0 | S |
| US-BUC002 | Toggle Accessibility Compliance | P0 | S |
| US-BUC003 | Respect Motion Preferences | P1 | S |
| US-BUC004 | Tighter StatCard Dimensions | P1 | S |

**Total v1.0 Stories:** 4
**Deferred:** 2
**Estimated Effort:** ~2 hours total

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-BUC001 stores preference in localStorage - user controls their workspace via data, not code changes |
| **Capability Agnosticism** | All stories are pure UI - no model/agent dependencies whatsoever |
| **Provenance as Infrastructure** | N/A - UI preferences don't require attribution tracking |
| **Organic Scalability** | Toggle pattern (BedrockUIContext + localStorage) creates substrate for future preference features |

---

## Implementation Checklist

### Files to Modify

| File | Stories | Changes |
|------|---------|---------|
| `src/bedrock/context/BedrockUIContext.tsx` | BUC001 | Add `metricsBarVisible` state with localStorage |
| `src/bedrock/patterns/console-factory.tsx` | BUC001 | Add conditional render for metrics |
| `src/bedrock/components/MetricsToggle.tsx` | BUC001, BUC002, BUC003 | NEW FILE - toggle component |
| `src/bedrock/BedrockWorkspace.tsx` | BUC001 | Wire toggle to nav footer |
| `src/bedrock/primitives/StatCard.tsx` | BUC004 | Adjust dimensions |

### Test Verification

- [ ] Manual: Toggle metrics on/off in Experience Console
- [ ] Manual: Verify localStorage persistence across refresh
- [ ] Manual: Navigate between consoles, verify preference applies
- [ ] Manual: Keyboard navigation to toggle (Tab, Enter/Space)
- [ ] Manual: Visual comparison of StatCard before/after
- [ ] Manual: Verify all 9 metric types render correctly

---

*Generated by User Story Refinery from approved Product Brief*
*Sprint: bedrock-ui-compact-v1*
*Date: 2026-01-17*
