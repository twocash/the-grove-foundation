# Sprint Specification: Experience Console Cleanup v1

**Sprint Name:** experience-console-cleanup-v1
**Codename:** console-cleanup-v1
**Domain:** Bedrock (Experience Console)
**Type:** UX Polish
**Priority:** P1 (Blocking pipeline usability)
**Effort:** Small (4 stories)
**Created:** 2026-01-12
**Author:** Jim Calhoun / Claude

---

## Constitutional Reference

Per Bedrock Sprint Contract Article I:

- [x] Read: `BEDROCK_SPRINT_CONTRACT.md`

**Note:** This is a **UX Polish Sprint**. Focus on existing patterns, minimal new code.

---

## Executive Summary

Clean up Experience Console UX issues blocking the research pipeline. The Research Agent and Writer Agent configs are registered but unusable because:

1. No default instances exist
2. +New button uses modal instead of inline dropdown
3. Empty states don't guide users

**After this sprint:**
- Default configs exist and are editable
- +New uses dropdown menu for type selection
- Empty states show helpful guidance

---

## The Problem

### Current State (Broken UX)

```
Experience Console:
  - Type filter shows "Research Agent", "Writer Agent" ✓
  - Selecting them shows NOTHING (no instances)
  - +New opens modal (clunky, extra click)
  - No guidance on what to do

Result:
- Users can't configure research/writing behavior
- Pipeline sprints produced unusable features
- Console feels incomplete
```

### Target State (Clean UX)

```
Experience Console:
  - Default configs exist for SINGLETON types
  - +New is dropdown: click → select type → create
  - Empty state: "No [type] configs. Create one to get started."
  - Configs immediately editable
```

---

## Goals

1. **Create default instances** — Research Agent Config, Writer Agent Config
2. **Dropdown +New** — Replace modal with inline dropdown menu
3. **Empty state messaging** — Guide users when no instances exist
4. **Verify editability** — Configs save and persist correctly

## Non-Goals

- New console features
- Schema changes
- New types
- Persistence layer changes (use existing patterns)

---

## Acceptance Criteria

### Default Instances
- [ ] AC-1: Research Agent Config instance exists on console load
- [ ] AC-2: Writer Agent Config instance exists on console load
- [ ] AC-3: Default instances use DEFAULT_*_PAYLOAD values
- [ ] AC-4: Instances appear when type filter is selected

### +New Dropdown
- [ ] AC-5: +New button opens dropdown menu (not modal)
- [ ] AC-6: Dropdown shows all registered Experience types
- [ ] AC-7: Selecting type creates new instance immediately
- [ ] AC-8: New instance opens in inspector for editing

### Empty States
- [ ] AC-9: When no instances of a type exist, show empty state message
- [ ] AC-10: Empty state includes "Create" CTA
- [ ] AC-11: Empty state is styled consistently with console

### Build Gates
- [ ] AC-12: `npm run build` passes
- [ ] AC-13: No TypeScript errors
- [ ] AC-14: No console errors on load

---

## Architecture

### Default Instance Creation

```typescript
// Option A: Seed on app init (preferred for MVP)
// In a useEffect or initialization hook:

if (!hasExperienceOfType('research-agent-config')) {
  createExperience({
    type: 'research-agent-config',
    meta: { title: 'Research Agent Config', status: 'active' },
    payload: DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
  });
}

if (!hasExperienceOfType('writer-agent-config')) {
  createExperience({
    type: 'writer-agent-config',
    meta: { title: 'Writer Agent Config', status: 'active' },
    payload: DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
  });
}
```

### +New Dropdown

```
Current:
┌─────────────────┐
│ [+ New]         │ → Opens modal → Select type → Create
└─────────────────┘

Target:
┌─────────────────┐
│ [+ New ▼]       │ → Dropdown appears inline
├─────────────────┤
│ Research Agent  │
│ Writer Agent    │
│ Feature Flag    │
│ System Prompt   │
│ ...             │
└─────────────────┘
  Click → Creates instance → Opens inspector
```

### Empty State Component

```tsx
// When filtered list is empty:
<EmptyState
  icon={typeDefinition.icon}
  title={`No ${typeDefinition.label} configs`}
  description="Create one to configure this feature."
  action={{
    label: `Create ${typeDefinition.label}`,
    onClick: () => createExperience(type),
  }}
/>
```

---

## Key Files

| File | Action | Notes |
|------|--------|-------|
| Experience Console component | **Modify** | Add dropdown, empty states |
| Experience data hook | **Modify** | Add default instance creation |
| +New button component | **Modify** | Convert to dropdown |
| EmptyState component | **New or reuse** | Empty state UI |

---

## User Stories

### US-CC001: Create Default Config Instances

**As a** user opening Experience Console
**I want to** see default configs for Research and Writer agents
**So that** I can immediately configure these features

**Acceptance Criteria:**
```gherkin
Scenario: Default configs exist on load
  Given I open the Experience Console
  When I filter by "Research Agent" type
  Then I should see a Research Agent Config instance
  And it should have default values

Scenario: Default configs are editable
  Given I see a default Research Agent Config
  When I click to edit it
  Then the inspector should open
  And I should be able to modify settings
```

---

### US-CC002: +New Dropdown Menu

**As a** user creating a new Experience
**I want to** select the type from a dropdown
**So that** I can create configs faster (fewer clicks)

**Acceptance Criteria:**
```gherkin
Scenario: +New shows dropdown
  Given I am on Experience Console
  When I click the +New button
  Then a dropdown menu should appear
  And it should list all registered Experience types

Scenario: Selecting type creates instance
  Given the +New dropdown is open
  When I click "Feature Flag"
  Then a new Feature Flag instance should be created
  And the inspector should open for editing
```

---

### US-CC003: Empty State Messaging

**As a** user filtering to a type with no instances
**I want to** see a helpful empty state
**So that** I know what to do next

**Acceptance Criteria:**
```gherkin
Scenario: Empty state shows guidance
  Given I filter to a type with no instances
  Then I should see an empty state message
  And it should include a "Create" button
  And clicking Create should make a new instance
```

---

### US-CC004: Verify Config Persistence

**As a** user editing a config
**I want** my changes to persist
**So that** the configuration is actually used

**Acceptance Criteria:**
```gherkin
Scenario: Changes persist after reload
  Given I edit a Research Agent Config
  And I change searchDepth to 5
  When I save and reload the page
  Then searchDepth should still be 5
```

---

## Summary

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-CC001 | Create Default Config Instances | P0 | S |
| US-CC002 | +New Dropdown Menu | P0 | S |
| US-CC003 | Empty State Messaging | P1 | S |
| US-CC004 | Verify Config Persistence | P0 | S |

**Total Stories:** 4
**Estimated Effort:** Small (half-day to 1 day)

---

## Technical Notes

### SINGLETON Pattern

Both `research-agent-config` and `writer-agent-config` have `allowMultipleActive: false`. This means:
- Only ONE active instance per grove
- Creating a new one should deactivate the old one (or prevent creation)
- Default creation should check if one exists first

### Existing Patterns

Look at how other Experience types handle:
- Default creation (if any)
- Empty states
- The +New flow

Reuse existing patterns where possible.

---

## DEX Compliance

| Pillar | Status |
|--------|--------|
| Declarative Sovereignty | ✓ Using existing config schemas |
| Capability Agnosticism | N/A (UI sprint) |
| Provenance as Infrastructure | N/A (UI sprint) |
| Organic Scalability | ✓ Dropdown scales with registry |

---

## Related Work

- **Blocked by:** None
- **Blocks:** Sprint 3 (Pipeline Integration) - need usable configs
- **Related:** evidence-collection-v1, writer-agent-v1

---

*This specification follows Bedrock Sprint Contract for UX Polish sprints.*
