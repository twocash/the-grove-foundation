# Sprint Breakdown: Prompt Editor Standardization

**Sprint:** prompt-editor-standardization-v1  
**Date:** 2025-01-03

---

## Epic 1: Foundation Enhancement

### Story 1.1: Add Collapsible Support to InspectorSection
**File:** `src/shared/layout/InspectorPanel.tsx`
**Estimate:** 30 minutes

**Tasks:**
- [ ] Add `collapsible?: boolean` prop to interface
- [ ] Add `defaultCollapsed?: boolean` prop to interface
- [ ] Add `useState` for collapsed state
- [ ] Render toggle button with chevron icon
- [ ] Conditionally render children based on collapsed state
- [ ] Add transition animation for smooth collapse

**Acceptance:**
- InspectorSection with `collapsible={false}` (default) unchanged
- InspectorSection with `collapsible={true}` shows toggle button
- Clicking toggle collapses/expands children
- `defaultCollapsed={true}` starts collapsed

**Build Gate:**
```bash
npm run build
```

---

## Epic 2: PromptEditor Refactor

### Story 2.1: Create Section Structure
**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
**Estimate:** 1 hour

**Tasks:**
- [ ] Remove tab state (`activeTab`, tab buttons, tab content conditionals)
- [ ] Add imports: `InspectorSection`, `InspectorDivider`, `GlassButton`
- [ ] Create scrollable container with `flex-1 overflow-y-auto`
- [ ] Implement Identity section
- [ ] Implement Execution section
- [ ] Implement Source & Weight section
- [ ] Add InspectorDivider between sections

**Acceptance:**
- No tabs visible
- Three non-collapsible sections render
- All fields from "Content" tab present

### Story 2.2: Implement Collapsible Sections
**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
**Estimate:** 45 minutes

**Tasks:**
- [ ] Implement Targeting section with `collapsible defaultCollapsed={false}`
- [ ] Implement Sequences section with `collapsible defaultCollapsed={true}`
- [ ] Implement Performance section with `collapsible defaultCollapsed={true}`
- [ ] Preserve stats grid layout in Performance section
- [ ] Preserve sequence badges in Sequences section

**Acceptance:**
- Targeting section expanded by default
- Sequences and Performance collapsed by default
- Toggle buttons work correctly
- Stats display 2x2 grid intact

### Story 2.3: Add Metadata Section and Fixed Footer
**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
**Estimate:** 30 minutes

**Tasks:**
- [ ] Implement Metadata section (Created, Updated, ID)
- [ ] Create fixed footer with `flex-shrink-0`
- [ ] Add GlassButton for Save (primary, full-width)
- [ ] Add GlassButton for Duplicate (ghost, icon)
- [ ] Add GlassButton for Delete (ghost, danger)
- [ ] Wire button handlers to props

**Acceptance:**
- Footer pinned at bottom
- Content scrolls above footer
- Save shows "Saved" when no changes, "Save Changes" when dirty
- Duplicate and Delete buttons functional

### Story 2.4: State Management Cleanup
**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
**Estimate:** 30 minutes

**Tasks:**
- [ ] Remove `localPrompt` state
- [ ] Remove `isDirty` state
- [ ] Create `patchPayload()` helper function
- [ ] Create `patchMeta()` helper function
- [ ] Update all field handlers to use patch helpers
- [ ] Use `hasChanges` from props for button state

**Acceptance:**
- No local state buffer
- All edits create patch operations
- Save button reflects `hasChanges` prop correctly

---

## Epic 3: Verification

### Story 3.1: Manual Testing
**Estimate:** 30 minutes

**Tasks:**
- [ ] Test create new prompt
- [ ] Test edit each field individually
- [ ] Test save changes
- [ ] Test duplicate
- [ ] Test delete
- [ ] Verify Genesis page unaffected
- [ ] Verify Terminal prompts unaffected

### Story 3.2: Build Verification
**Estimate:** 15 minutes

**Tasks:**
- [ ] Run `npm run build`
- [ ] Run `npm run lint`
- [ ] Check browser console for errors
- [ ] Test in production build (`npm run preview`)

---

## Commit Sequence

| Order | Type | Message | Files |
|-------|------|---------|-------|
| 1 | feat | add collapsible support to InspectorSection | `InspectorPanel.tsx` |
| 2 | refactor | convert PromptEditor to section layout | `PromptEditor.tsx` |
| 3 | refactor | add collapsible sections to PromptEditor | `PromptEditor.tsx` |
| 4 | refactor | standardize PromptEditor footer with GlassButton | `PromptEditor.tsx` |
| 5 | refactor | cleanup PromptEditor state management | `PromptEditor.tsx` |
| 6 | chore | remove unused tab code from PromptEditor | `PromptEditor.tsx` |

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Epic 1 (Foundation) | 30 min | 30 min |
| Epic 2 (Refactor) | 2.75 hrs | 3.25 hrs |
| Epic 3 (Verification) | 45 min | 4 hrs |
