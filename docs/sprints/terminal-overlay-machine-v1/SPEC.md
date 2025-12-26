# Specification: terminal-overlay-machine-v1

## Overview

Convert Terminal's overlay management from imperative boolean flags to a declarative state machine with registry-based component rendering.

## Requirements

### REQ-1: Single Source of Truth

**Current:** 4 boolean flags + `flowState` enum that partially overlap

**Required:** Single `TerminalOverlay` discriminated union

```typescript
type TerminalOverlay = 
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'field-picker' };  // Future: easy to add
```

**Acceptance:** Setting `overlay` to any value automatically:
- Dismisses previous overlay (mutual exclusivity enforced by type)
- Updates derived state (input visibility, etc.)
- Emits analytics event

### REQ-2: Declarative Component Registry

**Current:** Ternary cascade hardcoded in JSX

**Required:** Registry maps overlay type to component + config

```typescript
const OVERLAY_REGISTRY: Record<OverlayType, OverlayConfig | null> = {
  'none': null,
  'welcome': {
    component: WelcomeInterstitial,
    hideInput: true,
    analytics: 'welcome_shown'
  },
  'lens-picker': {
    component: LensPicker,
    props: { mode: 'compact' },
    hideInput: true
  },
  // ...
};
```

**Acceptance:** Adding new overlay requires:
1. Add to `TerminalOverlay` type union
2. Add to `OVERLAY_REGISTRY`
3. Done (no JSX changes)

### REQ-3: Unified Overlay Renderer

**Current:** Same render logic duplicated in embedded + overlay variants

**Required:** Single `<TerminalOverlayRenderer>` component

```tsx
<TerminalOverlayRenderer
  overlay={overlay}
  handlers={overlayHandlers}
/>
```

**Acceptance:** 
- Renders correct component based on `overlay.type`
- Passes props from registry + handlers
- Returns null for `type: 'none'`

### REQ-4: Derived Input Visibility

**Current:** `!showA && !showB && !showC && !showD` repeated

**Required:** Computed from overlay state

```typescript
const shouldShowInput = overlay.type === 'none' || 
  !OVERLAY_REGISTRY[overlay.type]?.hideInput;
```

**Acceptance:** Input visibility logic appears once, derived from registry config.

### REQ-5: Simplified Actions

**Current:** 8 actions (show/hide × 4 overlays)

**Required:** 2 actions

```typescript
interface TerminalActions {
  setOverlay: (overlay: TerminalOverlay) => void;
  dismissOverlay: () => void;  // Shorthand for setOverlay({ type: 'none' })
}
```

**Acceptance:** All existing call sites updated to use `setOverlay`.

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| State machine | Pattern 2: Engagement Machine | Apply discriminated union (XState-style) to Terminal overlay |
| Component mapping | Pattern 8: Canonical Source | Registry provides declarative component → overlay mapping |
| Derived state | (general principle) | Compute visibility from config, don't store |

## New Patterns Proposed

### Proposed: Overlay State Machine Pattern

**Why existing patterns are insufficient:**
Pattern 2 (Engagement Machine) uses XState for complex state graphs. Terminal overlays are simpler—just "which overlay is active?" A full XState machine is overkill. However, the *principle* of declarative state transitions applies.

**DEX compliance:**
- **Declarative Sovereignty:** Registry is config; non-engineers can modify overlay behavior
- **Capability Agnosticism:** Pattern works regardless of model; it's pure UI state
- **Provenance:** Transitions logged via analytics config in registry
- **Organic Scalability:** New overlays add type + registry entry; no structural changes

**Approval:** This is a *simplification* of Pattern 2 applied to a specific domain. It follows the same principles with less ceremony. Recommend proceeding.

## Non-Requirements

- ❌ No changes to overlay component implementations (LensPicker, JourneyList, etc.)
- ❌ No changes to Terminal layout or styling
- ❌ No new overlays (just infrastructure for future)
- ❌ No persistence (overlays reset on mount)

## Compatibility

### Backward Compatibility

During migration (Phase 2 of execution):
- Dual-write: Set both `overlay` and legacy booleans
- Consumers can read from either
- Verify no regressions

### Forward Compatibility

After migration:
- Legacy booleans removed
- `overlay` is sole source of truth
- New overlays just add to type + registry

## Constraints

1. **No new dependencies** — Use React + TypeScript only
2. **No breaking changes** — All existing behavior preserved
3. **No visual changes** — Purely internal refactor
4. **Build must pass** — TypeScript strict mode

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| State sources | 2 (flowState + booleans) | 1 (overlay) |
| Actions for overlays | 8 | 2 |
| Places to modify for new overlay | 5+ | 2 |
| Lines of overlay logic in Terminal.tsx | ~50 | ~10 |
