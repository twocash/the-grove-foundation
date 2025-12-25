# Specification: Card System Unification

**Sprint:** card-system-unification-v1  
**Status:** Planning Complete  
**Time Budget:** 4 hours  

---

## Design Goal

**Establish the canonical card styling pattern for the entire Grove ecosystem.**

This sprint creates the token infrastructure that ALL card-based layouts will use—current and future:

| Surface | Current Cards | Future Cards |
|---------|---------------|--------------|
| Foundation Explore | LensCard, JourneyCard | NodeCard, HubCard |
| Foundation Admin | — | UserCard, ConfigCard, AnalyticsCard |
| Genesis | LensGrid | — |
| Terminal | — | ContextCard, SuggestionCard |

**The `--card-*` token namespace becomes the single source of truth for card styling across the entire application.**

After this sprint, building a new card layout means:
1. Use `--card-*` tokens for borders, backgrounds, rings
2. Implement `isInspected` / `isActive` / `isSelected` states as needed
3. Done. Styling is inherited from the token system.

No more hunting through components to match colors. No more "which blue did we use for that border?" The tokens answer all styling questions.

---

## Problem Statement

The Visual State Matrix was documented in Sprint 3 (Workspace Inspectors) but implementation stopped before the card styling was wired. Three card implementations (LensGrid, LensPicker, JourneyList) have inconsistent:

1. **State visualization** — No `isInspected` state shows which card is being examined
2. **Button styling** — LensPicker uses `bg-slate-100` instead of documented `bg-primary text-white`
3. **Token usage** — Styling is hardcoded, not token-based, making future changes require code edits

This creates technical debt that compounds with every new card component built.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Card state tokens | Token Namespaces (Pattern 4) | Add `--card-*` namespace to globals.css |
| Inspected state derivation | Engagement Machine (Pattern 2) | Derive from existing workspaceUI.inspector state |
| Lens-specific accents | Quantum Interface (Pattern 1) | Accent colors already in PERSONA_COLORS, just wire to tokens |
| Foundation nav labels | Quantum Interface (Pattern 1) | Add `navigation.sectionLabel` to LensReality |

## New Patterns Proposed

**Pattern Addition: Card Component Tokens**

This sprint establishes `--card-*` as a new token namespace in Pattern 4 (Token Namespaces). All future card components MUST use these tokens.

**Add to PROJECT_PATTERNS.md after sprint completion:**

```markdown
### Card Components

All card-based UI (selection cards, info cards, admin cards) use the `--card-*` token namespace:

| Token | Purpose |
|-------|---------|
| `--card-border-default` | Default border color |
| `--card-border-inspected` | Border when inspector shows this card |
| `--card-border-active` | Border when card is currently applied |
| `--card-bg-active` | Background when active |
| `--card-ring-color` | Ring color for inspected state |
| `--card-ring-active` | Subtle ring for active state |

**States:**
- Default → `border-[var(--card-border-default)]`
- Inspected → `ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]`
- Active → `bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1`

**Extending for new card types:**
Add variant tokens (e.g., `--card-ring-violet` for custom lenses, `--card-border-warning` for error states) without changing component code.
```

---

## Scope

### In Scope

1. **Foundation nav labels** — Wire sidebar section labels to LensReality (deferred from Sprint 5)
2. **Visual State Matrix implementation** — Add `isInspected` prop and ring styling
3. **Button style consistency** — Apply `bg-primary text-white` spec
4. **Card token namespace** — Create `--card-*` tokens as canonical card styling system
5. **Pattern documentation** — Update PROJECT_PATTERNS.md with card token guidance

### Out of Scope

1. **Genesis LensGrid redesign** — Different interaction model (no inspector) is intentional
2. **Node cards** — Stay minimal list items for now (future sprint)
3. **HeroHook CTA wiring** — Uses ActiveTree, not LensPicker flow
4. **Foundation admin cards** — Future sprint, but will use these tokens

---

## Requirements

### REQ-1: Visual State Matrix

Implement the documented three-state system for cards:

| State | Condition | Visual Treatment |
|-------|-----------|------------------|
| Default | Not active, not inspected | `border-[var(--card-border-default)]` |
| Inspected | Inspector open for this card | `ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]` |
| Active | Currently applied lens/journey | `bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]` + badge |

**Precedence:** Inspected > Active > Default (when a card is both active AND inspected, show inspected styling)

### REQ-2: isInspected Prop

Add `isInspected: boolean` prop to:
- LensCard (in LensPicker.tsx)
- CustomLensCard (in LensPicker.tsx)
- JourneyCard (in JourneyList.tsx)

Derive value from workspaceUI.inspector state:
```typescript
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

### REQ-3: Button Style Consistency

**Lens Select button (standard):**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

**CustomLens Select button (violet variant):**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-violet-500 text-white hover:bg-violet-500/90 transition-colors shadow-sm"
```

**Journey Start button:** Already correct, no changes needed.

### REQ-4: Card Token Namespace (Canonical Pattern)

Add to `globals.css` as the foundation for ALL card styling:

```css
:root {
  /* Card styling tokens - THE canonical card pattern */
  --card-border-default: theme('colors.slate.200');
  --card-border-inspected: var(--grove-primary, theme('colors.primary.DEFAULT'));
  --card-border-active: rgba(var(--grove-primary-rgb, 16 185 129), 0.3);
  --card-bg-active: rgba(var(--grove-primary-rgb, 16 185 129), 0.05);
  --card-ring-color: var(--grove-primary, theme('colors.primary.DEFAULT'));
  --card-ring-active: rgba(var(--grove-primary-rgb, 16 185 129), 0.2);
  
  /* Variants for specialized cards */
  --card-ring-violet: theme('colors.violet.400');
  --card-border-violet: theme('colors.violet.400');
  --card-bg-violet-active: rgba(139, 92, 246, 0.05);
}

.dark {
  --card-border-default: theme('colors.slate.700');
  --card-bg-active: rgba(var(--grove-primary-rgb, 16 185 129), 0.1);
}
```

### REQ-5: Foundation Nav Labels (from Sprint 5)

Add to LensReality type:
```typescript
interface LensReality {
  // ... existing fields
  foundation?: {
    sectionLabels?: {
      lenses?: string;    // Default: "Lenses"
      journeys?: string;  // Default: "Journeys"
      nodes?: string;     // Default: "Nodes"
    };
  };
}
```

Wire in Foundation sidebar to read from reality.

### REQ-6: Pattern Documentation

After sprint completion, update `PROJECT_PATTERNS.md` to include card token pattern as canonical guidance for all future card development.

---

## Acceptance Criteria

### AC-1: Visual State Matrix Works

- [ ] Clicking a lens card shows `ring-2 ring-primary` highlight
- [ ] Clicking a different card moves the highlight
- [ ] Active lens shows muted ring + "Active" badge
- [ ] Active AND inspected lens shows inspected ring + "Active" badge

### AC-2: Button Styles Match Spec

- [ ] LensCard "Select" button is `bg-primary text-white`
- [ ] CustomLensCard "Select" button is `bg-violet-500 text-white`
- [ ] JourneyCard "Start" button remains `bg-primary text-white` (unchanged)

### AC-3: Token-Based Styling (Canonical)

- [ ] Card border colors use `--card-*` tokens
- [ ] Ring colors use `--card-*` tokens
- [ ] Changing token values updates all cards without code changes
- [ ] **New card components can be styled by using existing tokens only**

### AC-4: Foundation Nav Labels

- [ ] Sidebar section labels read from LensReality
- [ ] Default labels shown when LensReality field is undefined
- [ ] Changing lens updates section labels (if lens defines them)

### AC-5: No Regressions

- [ ] Genesis lens selection still works (LensGrid unchanged)
- [ ] Existing tests pass
- [ ] Build succeeds

### AC-6: Pattern Documented

- [ ] PROJECT_PATTERNS.md updated with card token guidance
- [ ] Future developers know to use `--card-*` tokens

---

## Future Card Components (Will Use This System)

These are NOT in scope for this sprint, but will inherit the token system:

| Component | Surface | States Needed |
|-----------|---------|---------------|
| NodeCard | Foundation Explore | Default, Selected |
| HubCard | Foundation Explore | Default, Active |
| UserCard | Foundation Admin | Default, Selected, Disabled |
| ConfigCard | Foundation Admin | Default, Active, Error |
| AnalyticsCard | Foundation Admin | Default only |
| SuggestionCard | Terminal | Default, Hover |

**All will use `--card-*` tokens. No new styling systems needed.**

---

## Verification

### Manual Test Scenarios

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Open Lenses, click card body | Ring-2 highlight, inspector opens |
| 2 | Click different card | Ring moves, inspector updates |
| 3 | Click "Select" on any lens | Lens activates, inspector closes |
| 4 | Click active lens card | Ring appears, can click Select to return |
| 5 | Open Journeys, click card body | Ring-2 highlight, inspector opens |
| 6 | Click "Start" on journey | Journey starts, inspector closes |
| 7 | Switch lens in Foundation | Nav labels update if lens defines them |
| 8 | Genesis lens selection | Still works, unaffected |

### Token Override Test

```css
/* Temporarily add to globals.css */
:root {
  --card-ring-color: red !important;
}
```

**Expected:** ALL card inspected states show red ring. Remove after verification.

### Build Gates

```bash
npm run build      # Must pass
npm test           # All tests pass
npm run lint       # No new errors
```

---

## Timeline

| Phase | Deliverable | Time |
|-------|-------------|------|
| 1 | Token namespace + globals.css | 30 min |
| 2 | LensPicker isInspected + button fix | 60 min |
| 3 | JourneyList isInspected | 45 min |
| 4 | Foundation nav labels | 30 min |
| 5 | Testing + polish | 30 min |
| 6 | PROJECT_PATTERNS.md update | 15 min |
| **Total** | | **3.5 hours** |

---

## Non-Goals

- **Genesis LensGrid changes** — Different interaction model is intentional
- **Unified GroveCard component** — Tokens achieve goal without refactor risk
- **Journey quote block color standardization** — Already consistent (amber)
- **Building future card components** — Just establishing the pattern they'll use

---

*Specification complete. This sprint establishes the card styling foundation for the entire Grove ecosystem.*
