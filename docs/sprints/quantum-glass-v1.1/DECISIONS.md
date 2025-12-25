# DECISIONS.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## ADR-001: Single Icon Per Object Type

### Status
Accepted

### Context
LensPicker currently uses per-lens accent colors and icons via the `lensAccents` object. Each persona (Academic, Engineer, Concerned Citizen, etc.) has unique colors and icons.

### Decision
Standardize to **one icon per object type** for v1.1:
- All Journeys use `map`
- All Lenses use `psychology`
- All Nodes use `account_tree`

### Rationale
1. Quantum Glass aesthetic prioritizes uniformity over decoration
2. Color reserved for state (active, selected), not identity
3. Reduces visual noise in collection views
4. Per-lens icons can be re-introduced later via data-driven approach

### Consequences
- `lensAccents` object removed entirely (~80 lines deleted)
- Visual differentiation between lenses reduced
- Cleaner, more professional appearance
- Future: Icons can be stored in persona schema and passed as props

---

## ADR-002: Callout Styling (Cyan Border vs Amber Box)

### Status
Accepted

### Context
Journey cards currently show "target aha" insights in amber boxes with amber text and lightbulb icons. This warm, friendly styling conflicts with the cold technical Quantum Glass aesthetic.

### Decision
Replace amber boxes with **cyan left-border callouts**:
- Transparent background
- 2px left border in `--neon-cyan`
- Muted italic text
- No icon

### Rationale
1. Amber is a warm accent that breaks the cold glass aesthetic
2. Left-border callouts are common in technical documentation
3. Cyan aligns with the "selected/focus" color semantics
4. Removing the lightbulb icon reduces visual clutter

### Consequences
- All amber styling removed from card components
- Consistent callout appearance across all object types
- Less "friendly," more "professional"

---

## ADR-003: Inspector Close on Collection Change

### Status
Accepted

### Context
Currently, when a user navigates from Journeys to Lenses with the inspector open, the inspector persists showing the previously-selected journey. This creates a confusing UX where "Journey Inspector" shows journey data while viewing the Lenses collection.

### Decision
Modify `navigateTo` to **close the inspector when the collection type changes**.

### Rationale
1. Inspector content is contextual to the collection being viewed
2. Stale inspector content is confusing
3. Closing is cleaner than showing "Select an item" placeholder
4. Within-collection navigation should keep inspector open (expected behavior)

### Consequences
- Users must re-select an item after switching collections
- Cleaner mental model: inspector shows selected item from current view
- Minor state management complexity in `navigateTo`

### Implementation
```typescript
const navigateTo = useCallback((path: NavigationPath) => {
  const currentCollection = navigation.activePath[1];
  const newCollection = path[1];
  
  if (currentCollection !== newCollection && inspector.isOpen) {
    setInspector({ mode: { type: 'none' }, isOpen: false });
  }
  
  setNavigation(s => ({ ...s, activePath: path, ... }));
}, [navigation.activePath, inspector.isOpen]);
```

---

## ADR-004: Data Attributes for State (Not Conditional Classes)

### Status
Accepted (Reaffirmed from v1)

### Context
React developers often use conditional className strings for styling states. This creates complex, hard-to-read JSX and duplicates styling logic across components.

### Decision
Use **data attributes** for card states, with CSS selectors handling visual treatment:
```tsx
data-selected={isInspected || undefined}
data-active={isActive || undefined}
```

### Rationale
1. Single source of truth for state styling (CSS)
2. Cleaner component JSX
3. Consistent with v1 CardShell implementation
4. Easier to maintain and modify state styles

### Consequences
- All card components must use data attributes
- CSS grows slightly larger
- Components are simpler and more consistent
- Anti-pattern: `${isActive ? 'border-green-500' : ''}`

---

## ADR-005: StatusBadge Component Reuse

### Status
Accepted

### Context
Cards currently implement status badges inline with varying styles:
- JourneyCard: `<span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">Active</span>`
- LensCard: `<span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary">ACTIVE</span>`

### Decision
Use the **existing StatusBadge component** from `src/shared/ui/StatusBadge.tsx` for all status indicators.

### Rationale
1. Component already exists and follows glass design
2. Has pulse animation for active state
3. Consistent styling across all card types
4. Three variants: active, draft, system

### Consequences
- Add `StatusBadge` import to JourneyList.tsx and LensPicker.tsx
- Remove inline badge styling
- Consistent appearance and animation

---

## ADR-006: Compact Card Pattern

### Status
Accepted

### Context
Both JourneyList and LensPicker have "compact mode" variants used in the chat nav picker. These are separate components with their own styling.

### Decision
Apply **glass-card styling to compact cards** with a horizontal layout variant:
- Same data attributes for state
- Flex row instead of column
- Same icon and badge patterns
- Simpler footer (no divider)

### Rationale
1. Visual consistency between full and compact views
2. Same state machine applies
3. Users see consistent card behavior everywhere

### Consequences
- CompactJourneyCard and CompactLensCard refactored
- Chat nav picker gets glass aesthetic
- Slightly more CSS complexity for horizontal variant

---

## ADR-007: Remove Per-Lens Color Accents

### Status
Accepted

### Context
`lensAccents` object in LensPicker.tsx defines per-persona colors:
```typescript
const lensAccents = {
  'concerned-citizen': { bgLight: 'bg-emerald-50', textLight: 'text-emerald-600', ... },
  'academic': { bgLight: 'bg-blue-50', textLight: 'text-blue-600', ... },
  ...
};
```

### Decision
**Delete the entire `lensAccents` object** and all references to it.

### Rationale
1. Per-lens colors conflict with Quantum Glass (color = state, not identity)
2. ~80 lines of complex configuration deleted
3. Simplifies both LensCard and CompactLensCard
4. Icons alone provide sufficient differentiation (and we're using single icon for now)

### Consequences
- All lenses look identical except for title/description
- Potential future feature: re-introduce via data-driven icons
- Cleaner, more maintainable code

---

## ADR-008: Active Indicator Update

### Status
Accepted

### Context
`ActiveIndicator.tsx` shows "In Progress: Journey Name" with a pulsing dot. It currently uses:
- `bg-stone-50 dark:bg-slate-900`
- `border-border-light dark:border-slate-700`
- `bg-primary animate-pulse`

### Decision
Update ActiveIndicator to **full glass token compliance**:
- Background: `var(--glass-solid)`
- Border: `var(--glass-border)`
- Pulse dot: `var(--neon-green)`
- Text: `var(--glass-text-*)` tokens

### Rationale
1. Consistency with other glass components
2. "We are not leaving shit as-is"
3. Green pulse aligns with "active" semantic color

### Consequences
- ActiveIndicator matches glass aesthetic
- No more light/dark mode conditional classes
- Consistent with StatusBadge active styling

---

## ADR-009: SearchInput Glass Styling

### Status
Accepted

### Context
SearchInput.tsx uses old token patterns:
- `bg-surface-light dark:bg-slate-900`
- `border-border-light dark:border-slate-700`
- Focus: `focus:border-primary focus:ring-primary/30`

### Decision
Update to glass tokens:
- Background: `var(--glass-solid)`
- Border: `var(--glass-border)`
- Focus: `var(--neon-cyan)` border and ring

### Rationale
1. Input fields are part of collection views
2. Cyan focus aligns with "selected/focus" semantics
3. Green is reserved for "active" state

### Consequences
- Search inputs match glass aesthetic
- Cyan focus ring across all inputs
- Consistent with hover/selected color language

---

## ADR-010: CollectionHeader Text Updates

### Status
Accepted

### Context
CollectionHeader.tsx uses slate colors:
- Title: `text-slate-900 dark:text-slate-100`
- Description: `text-slate-500 dark:text-slate-400`

### Decision
Update to glass tokens:
- Title: `var(--glass-text-primary)`
- Description: `var(--glass-text-muted)`

### Rationale
1. Headers are prominent in collection views
2. Consistency with card text hierarchy
3. Eliminates dark mode conditional classes

### Consequences
- Clean, consistent typography
- No light/dark mode complexity
- Matches card text styling

---

## Decision Summary

| ADR | Decision | Impact |
|-----|----------|--------|
| 001 | Single icon per object type | Simplifies, enables future data-driven icons |
| 002 | Cyan callouts replace amber | Aesthetic consistency |
| 003 | Inspector closes on collection change | Bug fix, cleaner UX |
| 004 | Data attributes for state | Code consistency |
| 005 | Reuse StatusBadge component | DRY principle |
| 006 | Glass compact cards | Visual consistency |
| 007 | Remove lensAccents | Major simplification |
| 008 | ActiveIndicator glass update | No exceptions |
| 009 | SearchInput glass styling | Consistency |
| 010 | CollectionHeader glass tokens | Consistency |
