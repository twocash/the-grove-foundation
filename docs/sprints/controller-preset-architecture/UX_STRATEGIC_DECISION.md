# Controller/Preset Architecture: UX Strategic Decision

**Date:** January 2026
**Decision Maker:** UX Chief (Grove Product Pod)
**Status:** APPROVED

---

## Decision Summary

**Controllers have minimal UI surface.** The only new component is an **ActivePresetIndicator** in the console header.

---

## Options Evaluated

| Option | Description | Verdict |
|--------|-------------|---------|
| A) No Controller UI | Selection implicit via card badges only | Too hidden |
| B) Header indicator only | Small "Active: [name]" chip in header | **SELECTED** |
| C) Dedicated Controllers view | Separate tab for managing Controllers | Over-engineered |

---

## Rationale

### Why Not Standalone Controller Components?

The initial wireframes (Stitch project `3695426726232521559`) invented:
- ControllerCard - redundant with existing singleton pattern
- PresetPicker dropdown - redundant with card grid
- ControllerSection header - redundant with existing console header

**These violate the principle:** *Don't create new patterns when existing patterns suffice.*

### Why Header Indicator?

1. **Visibility** - Users see at a glance what's active
2. **Minimal** - Single small component, not a new UI paradigm
3. **Discoverable** - Click to quick-switch or view details
4. **Pattern-consistent** - Fits existing console header layout

---

## Component Specification: ActivePresetIndicator

### Location

Console header, to the left of filter chips.

```
┌──────────────────────────────────────────────────────────────────────┐
│ PROMPT PRESETS                                                        │
│                                                                       │
│ [Active: Default Grove ▼]  [All] [System] [User]  [🔍]  [+ New ▼]    │
│  ↑ NEW COMPONENT           ↑ Existing filter chips    ↑ Existing     │
└──────────────────────────────────────────────────────────────────────┘
```

### Visual Design

```
┌─────────────────────────────┐
│ ● Active: Default Grove  ▼ │
└─────────────────────────────┘
  ↑              ↑           ↑
  Green dot      Name        Dropdown arrow
  (pulsing)      (truncated  (opens picker)
                 if long)
```

**Styling:**
- Background: `var(--glass-panel)`
- Border: `var(--glass-border)`
- Border-radius: 8px (same as filter chips)
- Green dot: `var(--semantic-success)` with subtle pulse animation
- Text: `var(--glass-text-primary)`
- Chevron: `var(--glass-text-muted)`

### Interaction

**Click behavior:**
1. Opens a compact dropdown showing available Presets
2. Dropdown items show: name, source badge, status
3. Selecting an item updates Controller.activePresetId
4. Dropdown closes, indicator updates

**Alternative (simpler):**
- Click scrolls to and selects the active Preset in the grid below
- User can then use the editor to switch or explore other options

**Recommendation:** Start with the simpler "scroll to active" behavior. Add dropdown later if needed.

### States

| State | Appearance |
|-------|------------|
| Normal | Green dot, preset name, chevron |
| Hover | Subtle background highlight |
| Loading | Spinner instead of green dot |
| No Active | "No active preset" in muted text, warning dot |

---

## Implementation Plan

### Phase 1: Preset Cards/Editors (existing pattern)

1. Create `PromptPresetCard.tsx` - fork from `OutputTemplateCard.tsx`
2. Create `PromptPresetEditor.tsx` - fork from `OutputTemplateEditor.tsx`
3. Register in component registry
4. Presets appear in Experience Console grid

### Phase 2: ActivePresetIndicator (new component)

1. Create `ActivePresetIndicator.tsx` in `/bedrock/primitives/`
2. Props: `activePreset: GroveObject | null`, `onIndicatorClick: () => void`
3. Integrate into console header via `BedrockConsoleProps.headerContent`

### Phase 3: Controller Logic (engine layer)

1. Controller schema in `/core/schema/controller.ts`
2. `useController(type)` hook returns active preset + setter
3. Wire indicator to controller hook

---

## What We're NOT Building

| Component | Why Not |
|-----------|---------|
| ControllerCard | Controllers are indices, not objects to display |
| ControllerSection | No need for dedicated controller management area |
| PresetPicker overlay | Grid + editor IS the picker |
| Controller settings modal | Overkill - selection is the only setting |

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| Declarative Sovereignty | Preset selection stored in Controller object |
| Capability Agnosticism | UI works regardless of which model processes presets |
| Provenance as Infrastructure | PresetCards show source badges |
| Organic Scalability | Same pattern for all Preset types |

---

## Cross-References

- Design Brief: `docs/sprints/controller-preset-architecture/DESIGN_BRIEF.md`
- Vision Paper: `docs/architecture/CONTROLLER_PRESET_ARCHITECTURE.md`
- Reference Card: `OutputTemplateCard.tsx`
- Reference Editor: `OutputTemplateEditor.tsx`

---

*UX Chief | Grove Product Pod | January 2026*
