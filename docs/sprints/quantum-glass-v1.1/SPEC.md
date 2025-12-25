# SPEC.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## 1. Executive Summary

Unify all collection view cards (Journeys, Lenses, Nodes) under the Quantum Glass design system. Eliminate visual inconsistency, fix inspector context persistence bug, and document patterns for future object types.

---

## 2. Requirements

### REQ-1: CSS Card Utilities [P0 - Blocking]

**Description:** Add reusable CSS utilities for card anatomy elements.

**Acceptance Criteria:**
- [ ] `.glass-card-icon` — Monochrome icon styling with hover transition
- [ ] `.glass-callout` — Cyan left border callout block
- [ ] `.glass-card-footer` — Flexbox footer with top border
- [ ] `.glass-card-meta` — Small text metadata styling
- [ ] `.glass-btn-primary` — Green action button with glow hover
- [ ] `.glass-btn-secondary` — Subtle button with cyan hover border

**Blocked By:** None
**Blocks:** REQ-3, REQ-4, REQ-5

---

### REQ-2: Inspector Context Fix [P0 - Critical Bug]

**Description:** Close inspector when navigating to a different collection type.

**Acceptance Criteria:**
- [ ] Journeys → Lenses navigation closes inspector
- [ ] Lenses → Nodes navigation closes inspector
- [ ] Within-collection navigation keeps inspector open
- [ ] Inspector updates when clicking different item in same collection

**Technical Notes:**
- Modify `navigateTo` in `WorkspaceUIContext.tsx`
- Collection types: terminal, lenses, journeys, nodes, diary, sprouts

**Blocked By:** None
**Blocks:** None (can be done in parallel)

---

### REQ-3: JourneyCard Unification [P1 - Core]

**Description:** Refactor both full and compact JourneyCard to unified glass pattern.

**Acceptance Criteria:**
- [ ] Full card uses `glass-card` with data attributes
- [ ] Compact card uses `glass-card` with data attributes
- [ ] Amber callout boxes replaced with `.glass-callout`
- [ ] Icon uses `.glass-card-icon` (no colored background)
- [ ] Status uses `StatusBadge` component
- [ ] Footer uses `.glass-card-footer` and `.glass-card-meta`
- [ ] Action button uses `.glass-btn-primary`

**Blocked By:** REQ-1
**Blocks:** None

---

### REQ-4: LensCard Unification [P1 - Core]

**Description:** Refactor both full and compact LensCard to unified glass pattern.

**Acceptance Criteria:**
- [ ] Full card uses `glass-card` with data attributes
- [ ] Compact card uses `glass-card` with data attributes
- [ ] `lensAccents` object removed entirely
- [ ] All lenses use single icon (`psychology`)
- [ ] Icon uses `.glass-card-icon` (no colored background)
- [ ] Status uses `StatusBadge` component
- [ ] Footer uses `.glass-card-footer`
- [ ] Action button uses `.glass-btn-primary`
- [ ] Custom lens badge uses glass tokens

**Blocked By:** REQ-1
**Blocks:** None

---

### REQ-5: NodeCard Unification [P1 - Core]

**Description:** Refactor NodeCard to unified glass pattern.

**Acceptance Criteria:**
- [ ] Card uses `glass-card` class
- [ ] All `--grove-*` tokens replaced with `--glass-*`
- [ ] Footer added with `.glass-card-footer`
- [ ] Metadata uses `.glass-card-meta`
- [ ] Section tag and connection count in footer
- [ ] Hover shows cyan text transition

**Blocked By:** REQ-1
**Blocks:** None

---

### REQ-6: Shared Components Update [P1 - Core]

**Description:** Update CollectionHeader, SearchInput, ActiveIndicator to glass tokens.

**Acceptance Criteria:**
- [ ] CollectionHeader title uses `--glass-text-primary`
- [ ] CollectionHeader description uses `--glass-text-muted`
- [ ] SearchInput uses `--glass-solid` background
- [ ] SearchInput uses `--glass-border` border
- [ ] SearchInput focus uses `--neon-cyan` ring
- [ ] ActiveIndicator uses glass tokens throughout
- [ ] ActiveIndicator pulse uses `--neon-green`

**Blocked By:** None
**Blocks:** None

---

### REQ-7: Pattern Documentation [P2 - Maintenance]

**Description:** Document card pattern for future object types.

**Acceptance Criteria:**
- [ ] Card anatomy diagram in PLAN.md
- [ ] CSS utilities checklist
- [ ] State attribute rules
- [ ] Step-by-step guide for new objects
- [ ] Anti-patterns documented

**Blocked By:** REQ-3, REQ-4, REQ-5
**Blocks:** None

---

## 3. Out of Scope

| Item | Reason |
|------|--------|
| Per-lens custom icons | Deferred — use single icon for now, architect for future |
| Diary cards | Different view type, separate sprint |
| Sprout cards | Different view type, separate sprint |
| Dark/light mode toggle | Quantum Glass is dark-only for now |
| Keyboard navigation | Accessibility sprint |
| Card animations (stagger) | Polish sprint |

---

## 4. Technical Constraints

### 4.1 Token Usage Rules

**MUST use:**
```css
var(--glass-text-primary)    /* Titles */
var(--glass-text-muted)      /* Descriptions, callouts */
var(--glass-text-subtle)     /* Metadata */
var(--glass-solid)           /* Backgrounds */
var(--glass-border)          /* Borders */
var(--neon-green)            /* Active state, primary actions */
var(--neon-cyan)             /* Selected state, focus, hover accents */
```

**MUST NOT use:**
```css
text-slate-*                 /* Use --glass-text-* */
bg-surface-*                 /* Use --glass-solid */
border-border-*              /* Use --glass-border */
text-primary                 /* Use --neon-green or --neon-cyan */
bg-amber-*, text-amber-*     /* Use --glass-callout */
bg-primary/*                 /* Use explicit rgba or tokens */
```

### 4.2 State Attribute Rules

**MUST use data attributes:**
```tsx
data-selected={isInspected || undefined}
data-active={isActive || undefined}
```

**MUST NOT use conditional classes for state:**
```tsx
// ❌ WRONG
className={`${isActive ? 'border-green-500' : ''}`}
```

### 4.3 Component Composition

Cards MUST follow this structure:
```tsx
<article
  data-selected={...}
  data-active={...}
  className="glass-card p-5 cursor-pointer"
  onClick={onView}
>
  {/* Header: icon + title + status badge */}
  {/* Body: description + optional callout */}
  {/* Footer: metadata + action button */}
</article>
```

---

## 5. Success Criteria

### 5.1 Visual Consistency
- All collection view cards are visually identical in structure
- No amber, teal, pink, or other accent colors except green/cyan
- Hover states show lift + cyan corner accents
- Selected states show cyan glow
- Active states show green border

### 5.2 Behavioral Consistency
- Card click → Inspector opens
- Action button click → Performs action (Start/Select)
- Navigate away → Inspector closes
- Within-collection click → Inspector updates

### 5.3 Code Quality
- No duplicate styling logic
- Single source of truth for card styles (CSS utilities)
- Data attributes for state (not conditional classes)
- All tests pass
- Build succeeds

---

## 6. Verification Plan

### Phase Checkpoints

| Phase | Verification |
|-------|--------------|
| 1. CSS | Utilities exist, no runtime errors |
| 2. Inspector | Navigate between collections, verify close behavior |
| 3. JourneyCard | Visual check Journeys tab, both modes |
| 4. LensCard | Visual check Lenses tab, both modes |
| 5. NodeCard | Visual check Nodes tab |
| 6. Shared | Visual check headers, search, active indicator |
| 7. Final | Full test suite, build, visual sweep |

### Test Coverage Required

```typescript
describe('Inspector context', () => {
  it('closes when navigating to different collection');
  it('stays open when navigating within collection');
  it('updates content when clicking different item');
});
```
