# Quantum Glass v1.1 — Card System Unification

## Sprint Overview

**Problem Statement:** The Quantum Glass v1 sprint applied glass styling to infrastructure (tokens, viewport, nav, inspector panel) but left collection views (JourneyList, LensPicker, NodeGrid) with inconsistent card implementations. Each has its own:
- Card component with different styling logic
- State handling (isActive, isInspected, isSelected)
- Visual treatments (amber callouts, teal circles, no icons)
- Interaction patterns

Additionally, the inspector panel persists stale context when navigating between collection views, creating a confusing UX where "Journey Inspector" shows journey data while viewing Lenses.

**Goal:** Establish a unified card design system that any future Grove object can inherit, ensuring visual and behavioral consistency across all collection views.

**Design Philosophy:** Cards are precision instruments for viewing data, not decorative containers. The Quantum Glass aesthetic should feel like looking at information through a technical interface—cold, purposeful, beautiful. Every element earns its place.

---

## Part 1: Design System Specification

### 1.1 Unified Card Anatomy

Every Grove card follows this structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ◎ Title                                         [STATUS]       │
│                                                                 │
│  Description text in muted color, maximum two lines before      │
│  truncation with ellipsis.                                      │
│                                                                 │
│  │ "Insight quote or key takeaway, styled as callout"           │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  ◷ 8 min    ⟡ category                              [ACTION]    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Zones:**
1. **Header Row:** Icon (subtle) + Title (primary text) + Status Badge (right-aligned, optional)
2. **Body:** Description (muted, 2-line clamp) + Callout (optional, cyan left border)
3. **Divider:** 1px border using `--glass-border`
4. **Footer Row:** Metadata (left, subtle) + Action Button (right, optional)

### 1.2 Visual States

| State | CSS Class/Attribute | Visual Treatment |
|-------|---------------------|------------------|
| Default | `.glass-card` | Solid bg, subtle border, no shadow |
| Hover | `:hover` | Lift (-2px), ambient shadow, cyan corner accents |
| Selected | `data-selected="true"` | Cyan ring (1px) + cyan glow |
| Active | `data-active="true"` | Green border, green gradient bg |
| Active+Selected | Both attributes | Green ring + green glow |

**State Semantics:**
- **Selected** = This item is being inspected (inspector panel shows its details)
- **Active** = This item is the "current" one in context (active journey, active lens)
- These states are orthogonal and can compose

### 1.3 Element Specifications

#### Card Icon
- **Old pattern:** Colored circles/squares with accent backgrounds (teal, amber, violet)
- **New pattern:** Monochrome icon, no background, `--glass-text-muted` color
- **Rationale:** Icons should identify, not decorate. Color is reserved for state.

```css
.glass-card-icon {
  color: var(--glass-text-muted);
  font-size: 20px;
  transition: color var(--duration-fast);
}

.glass-card:hover .glass-card-icon {
  color: var(--glass-text-secondary);
}
```

#### Status Badge
Already implemented in v1: `.status-badge`, `.status-badge-active`, `.status-badge-draft`, `.status-badge-system`

**Usage:**
- Active journey → `status-badge-active` with "Active" label
- Active lens → `status-badge-active` with "Active" label  
- Draft items → `status-badge-draft`
- System items → `status-badge-system`

#### Callout Block
- **Old pattern:** Amber box with amber text, lightbulb icon
- **New pattern:** Transparent background, cyan left border, muted italic text

```css
.glass-callout {
  padding: 10px 14px;
  padding-left: 14px;
  margin: 12px 0;
  border-left: 2px solid var(--neon-cyan);
  background: transparent;
  color: var(--glass-text-muted);
  font-style: italic;
  font-size: 13px;
  line-height: 1.5;
}
```

#### Card Footer
```css
.glass-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--glass-border);
}
```

#### Card Metadata
```css
.glass-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--glass-text-subtle);
}

.glass-card-meta .material-symbols-outlined {
  font-size: 14px;
}
```

#### Action Buttons
```css
/* Primary action (Start, Select when it's the main CTA) */
.glass-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--neon-green);
  color: white;
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-primary:hover {
  background: rgba(16, 185, 129, 0.85);
  box-shadow: var(--glow-green);
}

/* Secondary action */
.glass-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--glass-elevated);
  color: var(--glass-text-secondary);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.glass-btn-secondary:hover {
  border-color: var(--neon-cyan);
  color: var(--glass-text-primary);
}
```

### 1.4 Typography Within Cards

| Element | Token | Size | Weight |
|---------|-------|------|--------|
| Title | `--glass-text-primary` | 16px (1rem) | 500 |
| Description | `--glass-text-muted` | 14px (0.875rem) | 400 |
| Callout | `--glass-text-muted` | 13px (0.8125rem) | 400, italic |
| Metadata | `--glass-text-subtle` | 12px (0.75rem) | 400 |
| Badge | inherit from `.status-badge` | 10px | 500, uppercase |

---

## Part 2: Inspector Context Fix

### 2.1 Problem

When user navigates from Journeys → Lenses with inspector open:
- Inspector header still says "Journey Inspector"
- Inspector content still shows the previously-selected journey
- User expects inspector to close or show "Select a lens"

### 2.2 Solution

Modify `navigateTo` in `WorkspaceUIContext.tsx` to close inspector when navigating to a different collection type.

**Logic:**
```typescript
const navigateTo = useCallback((path: NavigationPath) => {
  // Determine if we're changing collection types
  const currentCollection = navigation.activePath[1]; // e.g., 'journeys', 'lenses', 'nodes'
  const newCollection = path[1];
  
  // Close inspector if switching collections
  const shouldCloseInspector = 
    inspector.isOpen && 
    currentCollection !== newCollection &&
    ['terminal', 'lenses', 'journeys', 'nodes', 'diary', 'sprouts'].includes(newCollection);
  
  if (shouldCloseInspector) {
    setInspector({ mode: { type: 'none' }, isOpen: false });
  }
  
  setNavigation(s => ({
    ...s,
    activePath: path,
    selectedEntityId: null,
    selectedEntityType: null,
  }));
}, [navigation.activePath, inspector.isOpen]);
```

### 2.3 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Journeys → Lenses (inspector open) | Inspector closes |
| Journeys → Journeys subnav (inspector open) | Inspector stays open |
| Journeys → Do (inspector open) | Inspector closes |
| Journeys → Journeys, click different journey | Inspector updates to new journey |
| Inspector closed, navigate anywhere | No change to inspector |

### 2.4 Test Coverage Required

Add to test suite:
```typescript
describe('Inspector context persistence', () => {
  it('closes inspector when navigating to different collection', () => {
    // Setup: Open journey inspector
    // Action: Navigate to Lenses
    // Assert: Inspector is closed
  });
  
  it('keeps inspector open when navigating within same collection', () => {
    // Setup: Open journey inspector on Journey A
    // Action: Click Journey B
    // Assert: Inspector shows Journey B
  });
  
  it('does not affect closed inspector on navigation', () => {
    // Setup: Inspector closed
    // Action: Navigate anywhere
    // Assert: Inspector remains closed
  });
});
```

---

## Part 3: Component Refactoring

### 3.1 Files to Modify

| File | Changes |
|------|---------|
| `styles/globals.css` | Add new card utilities (~80 lines) |
| `src/workspace/WorkspaceUIContext.tsx` | Inspector close on nav change (~15 lines) |
| `src/explore/JourneyList.tsx` | Refactor JourneyCard (~60 lines) |
| `src/explore/LensPicker.tsx` | Refactor LensCard (~50 lines) |
| `src/explore/NodeGrid.tsx` | Refactor NodeCard (~40 lines) |
| `src/shared/CollectionHeader.tsx` | Update to glass tokens (~10 lines) |
| `src/shared/SearchInput.tsx` | Update to glass tokens (~5 lines) |
| `src/shared/ActiveIndicator.tsx` | Update to glass tokens (~10 lines) |

### 3.2 JourneyCard Transformation

**Before (current):**
- Teal border with conditional ring logic
- Amber callout box with lightbulb icon
- Slate text colors with dark mode variants
- Inline conditional className soup

**After:**
```tsx
function JourneyCard({ journey, isActive, isInspected, onStart, onView }: JourneyCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined glass-card-icon">
            {journey.icon || 'map'}
          </span>
          <h3 className="font-medium text-[var(--glass-text-primary)]">
            {journey.title}
          </h3>
        </div>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] mb-3 line-clamp-2">
        {journey.description}
      </p>

      {/* Target Aha Callout */}
      {journey.targetAha && (
        <div className="glass-callout line-clamp-2">
          {journey.targetAha}
        </div>
      )}

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          <span className="material-symbols-outlined">schedule</span>
          <span>{journey.estimatedMinutes} min</span>
        </div>
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            className="glass-btn-primary"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Start
          </button>
        )}
      </div>
    </article>
  );
}
```

### 3.3 LensCard Transformation

**Before (current):**
- Per-persona accent colors (teal, amber, pink, etc.)
- Colored icon backgrounds
- Complex conditional className logic

**After:**
```tsx
function LensCard({ persona, isActive, isInspected, onSelect, onView }: LensCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer flex flex-col"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="material-symbols-outlined glass-card-icon text-2xl">
          {lensIcons[persona.id] || 'psychology'}
        </span>
        {isActive && <StatusBadge variant="active" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] italic mb-4">
        "{persona.description}"
      </p>

      {/* Footer */}
      <div className="glass-card-footer mt-auto">
        <div /> {/* Spacer */}
        {!isActive && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="glass-btn-primary"
          >
            Select
          </button>
        )}
      </div>
    </article>
  );
}
```

**Note:** Remove the entire `lensAccents` object and related logic. Icons stay, colors go.

### 3.4 NodeCard Transformation

**Before (current):**
- Using `--grove-*` tokens (outdated)
- No footer structure
- Minimal metadata display

**After:**
```tsx
function NodeCard({ node, onSelect }: NodeCardProps) {
  const connectionsCount = /* existing logic */;
  const sectionId = 'sectionId' in node ? node.sectionId : null;

  return (
    <article
      className="glass-card p-4 cursor-pointer"
      onClick={() => onSelect(node.id)}
    >
      {/* Title */}
      <h3 className="font-medium text-[var(--glass-text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--neon-cyan)] transition-colors">
        {node.label}
      </h3>

      {/* Query preview */}
      <p className="text-sm text-[var(--glass-text-muted)] line-clamp-2 mb-3">
        {node.query}
      </p>

      {/* Footer */}
      <div className="glass-card-footer">
        <div className="glass-card-meta">
          {sectionId && (
            <>
              <span className="material-symbols-outlined">sell</span>
              <span>{sectionId}</span>
            </>
          )}
        </div>
        {connectionsCount > 0 && (
          <div className="glass-card-meta">
            <span>→ {connectionsCount} next</span>
          </div>
        )}
      </div>
    </article>
  );
}
```

---

## Part 4: Shared Component Updates

### 4.1 CollectionHeader.tsx

Update text colors and remove light/dark variants:

```tsx
<h1 className="text-3xl font-bold text-[var(--glass-text-primary)] mb-3">
  {title}
</h1>
<p className="text-[var(--glass-text-muted)] mb-8 leading-relaxed max-w-2xl">
  {description}
</p>
```

### 4.2 SearchInput.tsx

Update to glass tokens:

```tsx
<input
  ...
  className="w-full pl-10 pr-10 py-2.5 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] placeholder:text-[var(--glass-text-subtle)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/30 transition-colors"
/>
```

Icon colors:
```tsx
<span className="... text-[var(--glass-text-subtle)]">search</span>
```

### 4.3 ActiveIndicator.tsx

Update the indicator bar to use glass tokens with green accent for "active" state.

---

## Part 5: Pattern Documentation

### 5.1 For Future Objects

When adding a new Grove object type (e.g., "Agent", "Memory", "Skill"):

**Step 1:** Define the card content structure
- What's the title field?
- What's the description field?
- Is there a callout/insight field?
- What metadata belongs in the footer?
- What's the primary action?

**Step 2:** Create the card component following this template:
```tsx
function NewObjectCard({ 
  item, 
  isActive, 
  isInspected, 
  onAction, 
  onView 
}: NewObjectCardProps) {
  return (
    <article
      data-selected={isInspected || undefined}
      data-active={isActive || undefined}
      className="glass-card p-5 cursor-pointer"
      onClick={onView}
    >
      {/* Header: icon + title + status */}
      {/* Body: description + optional callout */}
      {/* Footer: metadata + action button */}
    </article>
  );
}
```

**Step 3:** Add inspector mode type
In `src/core/schema/workspace.ts`:
```typescript
export type InspectorMode =
  | { type: 'none' }
  | ... existing types ...
  | { type: 'newobject'; newobjectId: string };  // Add new type
```

**Step 4:** Add inspector renderer
In `src/workspace/Inspector.tsx`, add case in `renderContent()`.

**Step 5:** Update navigator close logic
If the new object lives in a new collection, add it to the collection list in `navigateTo`.

### 5.2 CSS Utilities Checklist

When building any card UI, use these utilities:

| Need | Utility |
|------|---------|
| Card container | `.glass-card` |
| Card icon | `.glass-card-icon` |
| Card footer | `.glass-card-footer` |
| Card metadata | `.glass-card-meta` |
| Callout/quote | `.glass-callout` |
| Primary button | `.glass-btn-primary` |
| Secondary button | `.glass-btn-secondary` |
| Status indicator | `.status-badge` + variant |
| Section header | `.glass-section-header` |

### 5.3 State Attributes

Always use data attributes for state, never conditional classes:

```tsx
// ✅ Correct
<article 
  data-selected={isInspected || undefined}
  data-active={isActive || undefined}
  className="glass-card"
>

// ❌ Wrong
<article className={`
  glass-card
  ${isInspected ? 'ring-2 ring-cyan-500' : ''}
  ${isActive ? 'border-green-500 bg-green-500/10' : ''}
`}>
```

---

## Part 6: Acceptance Criteria

### Visual
- [ ] All cards (Journey, Lens, Node) use identical `glass-card` base styling
- [ ] Hover lifts card with ambient shadow and cyan corner accents
- [ ] Selected state shows cyan ring/glow
- [ ] Active state shows green border/gradient
- [ ] No amber/orange/teal accent colors remain
- [ ] Callouts use cyan left border, not colored boxes
- [ ] Icons are monochrome, no colored backgrounds
- [ ] Status badges use unified `.status-badge-*` classes

### Behavioral
- [ ] Inspector closes when navigating to different collection
- [ ] Inspector updates when clicking different item in same collection
- [ ] Cards are keyboard accessible (focusable, Enter to select)
- [ ] Click on card body → opens inspector
- [ ] Click on action button → performs action (Start/Select)

### Technical
- [ ] No duplicate styling logic across card components
- [ ] All text uses `--glass-text-*` tokens
- [ ] All borders use `--glass-border*` tokens
- [ ] All backgrounds use `--glass-*` tokens
- [ ] Build passes
- [ ] All existing tests pass
- [ ] New inspector context tests pass

---

## Part 7: Execution Phases

### Phase 1: CSS Foundation (~80 lines)
Add new utilities to `globals.css`:
- `.glass-card-icon`
- `.glass-callout`
- `.glass-card-footer`
- `.glass-card-meta`
- `.glass-btn-primary`
- `.glass-btn-secondary`

### Phase 2: Inspector Context Fix (~20 lines)
Modify `WorkspaceUIContext.tsx`:
- Update `navigateTo` to close inspector on collection change

### Phase 3: JourneyCard Refactor (~60 lines)
- Remove amber callout styling
- Apply unified card anatomy
- Use data attributes for state

### Phase 4: LensCard Refactor (~50 lines)
- Remove `lensAccents` object entirely
- Remove colored icon backgrounds
- Apply unified card anatomy

### Phase 5: NodeCard Refactor (~40 lines)
- Replace `--grove-*` tokens with `--glass-*`
- Add proper footer structure

### Phase 6: Shared Components (~30 lines)
- Update CollectionHeader
- Update SearchInput
- Update ActiveIndicator

### Phase 7: Verification & Tests
- Visual review all collection views
- Run test suite
- Add inspector context tests

---

## Estimated Effort

| Phase | Lines Changed | Complexity |
|-------|---------------|------------|
| 1. CSS Foundation | ~80 | Low |
| 2. Inspector Fix | ~20 | Medium |
| 3. JourneyCard | ~60 | Medium |
| 4. LensCard | ~50 | Medium |
| 5. NodeCard | ~40 | Low |
| 6. Shared Components | ~30 | Low |
| 7. Verification | ~50 (tests) | Medium |

**Total:** ~330 lines changed, half-day effort

---

## Open Questions for Review

1. **Lens icons:** Currently each lens has a different icon via `lensAccents`. Should we keep lens-specific icons but remove the colored backgrounds? Or use a single icon for all lenses?

2. **Node metadata:** Nodes currently show "→ 2 next" for connections. Is this the right metadata to surface, or should we show something else (e.g., section, last updated)?

3. **Active indicator bar:** The `CollectionHeader` has an "Active Indicator" component showing "In Progress: The Ghost in the Machine". Should this also be updated to glass styling, or is it working well enough?

4. **Compact mode cards:** Both JourneyList and LensPicker have "compact mode" variants for the chat nav picker. Should these also be updated, or are they out of scope?

---

## References

- [Quantum Glass v1 Sprint](../quantum-glass-v1/) — Foundation tokens and utilities
- [CardShell.tsx](../../src/surface/components/GroveObjectCard/CardShell.tsx) — Reference implementation
- [StatusBadge.tsx](../../src/shared/ui/StatusBadge.tsx) — Badge component
