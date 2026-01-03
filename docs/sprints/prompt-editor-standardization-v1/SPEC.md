# Specification: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03  
**Status:** Draft

## Goals

1. **Standardize PromptEditor** to match LensEditor reference implementation
2. **Improve maintainability** by using shared Bedrock primitives consistently
3. **Enhance UX** with section-based layout instead of tabs
4. **Eliminate technical debt** from duplicate state management

## Non-Goals

- Changing the Prompt schema or data layer
- Modifying Genesis/Terminal consumption paths
- Adding new editing capabilities
- Changing filter/list view (already standardized via console-factory)

## Acceptance Criteria

### AC-1: Section-Based Layout
- [ ] All content visible without tab navigation
- [ ] Sections use `InspectorSection` primitive
- [ ] Collapsible sections for Targeting, Sequences, Performance
- [ ] Non-collapsible sections for Identity, Execution, Metadata

### AC-2: Fixed Footer Actions
- [ ] Footer uses `GlassButton` components
- [ ] Primary "Save Changes" / "Saved" state toggle
- [ ] Duplicate button with icon
- [ ] Delete button with danger styling
- [ ] Footer fixed at bottom, content scrolls above

### AC-3: State Management
- [ ] Remove duplicate `isDirty` local state
- [ ] Use `hasChanges` from factory props exclusively
- [ ] Use `patchPayload()` / `patchMeta()` helper pattern

### AC-4: Component Consistency
- [ ] All form inputs use same styling as LensEditor
- [ ] Status toggle matches LensEditor pattern
- [ ] Tags input matches existing pattern
- [ ] Textarea styling consistent with Voice Prompt field

### AC-5: Zero Regression
- [ ] All existing edit paths functional
- [ ] All fields persist correctly on save
- [ ] Build passes (`npm run build`)
- [ ] No console errors during edit operations

### AC-6: Isolation Verified
- [ ] Genesis page unaffected
- [ ] KineticWelcome unaffected
- [ ] usePromptSuggestions hook unaffected
- [ ] scorePrompt utility unaffected

## Section Layout Specification

```
┌─────────────────────────────────────┐
│ Header: [icon] Edit Prompt          │
│         subtitle badge              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ IDENTITY (always visible)       │ │
│ │ • Title                         │ │
│ │ • Description                   │ │
│ │ • Variant selector              │ │
│ │ • Status toggle                 │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ EXECUTION (always visible)      │ │
│ │ • executionPrompt textarea      │ │
│ │ • Character count               │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ SOURCE & WEIGHT (always)        │ │
│ │ • Source badge (read-only)      │ │
│ │ • baseWeight slider             │ │
│ │ • Tags input                    │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ ▶ TARGETING (collapsible)       │ │
│ │   • stages multi-select         │ │
│ │   • minInteractions             │ │
│ │   • minConfidence               │ │
│ │   • lensIds                     │ │
│ │   • requireMoment toggle        │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ ▶ SEQUENCES (collapsed)         │ │
│ │   • Sequence membership badges  │ │
│ │   • Position indicators         │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ ▶ PERFORMANCE (collapsed)       │ │
│ │   • Stats grid (2x2)            │ │
│ └─────────────────────────────────┘ │
│ ─────────────────────────────────── │
│ ┌─────────────────────────────────┐ │
│ │ METADATA (always visible)       │ │
│ │ • Created date                  │ │
│ │ • Updated date                  │ │
│ │ • ID                            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [████ Save Changes ████] [📋] [🗑️] │
└─────────────────────────────────────┘
```

## Test Plan

### Manual Testing Checklist
1. Create new prompt → verify default values
2. Edit title → verify persists on save
3. Edit description → verify persists
4. Change variant → verify immediate visual feedback
5. Toggle status → verify persists
6. Edit execution prompt → verify character count updates
7. Adjust base weight → verify slider works
8. Add/remove tags → verify persists
9. Expand Targeting → edit stages → verify persists
10. Expand Sequences → verify read-only display
11. Expand Performance → verify stats display
12. Duplicate → verify new object created
13. Delete → verify object removed

### Build Verification
```bash
npm run build    # Must pass
npm run lint     # No new warnings
```

## Dependencies

- `InspectorSection` must support `collapsible` prop (verify or implement)
- `GlassButton` exists with required variants
- `InspectorDivider` exists

## Estimated Effort

| Task | Estimate |
|------|----------|
| Section layout refactor | 2 hours |
| Footer standardization | 30 min |
| State cleanup | 30 min |
| Testing & verification | 1 hour |
| **Total** | **4 hours** |
