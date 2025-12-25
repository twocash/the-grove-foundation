# ARCHITECTURE: Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Date:** 2025-12-25

---

## System Context

This sprint operates entirely at the **presentation layer**. No changes to:
- State management (XState machines)
- Data flow (hooks, context)
- Business logic (transformers, schema)
- Routing (views, navigation paths)

**We are painting the walls, not moving them.**

---

## Token Architecture

### Namespace Strategy

Extend existing token pattern with new `--glass-*` namespace:

```
globals.css
├── @theme { }                    # Tailwind v4 theme tokens (existing)
│   ├── --color-obsidian-*        # Foundation tokens (existing)
│   ├── --color-holo-*            # Holographic accents (existing)
│   └── --font-mono               # JetBrains Mono (existing)
│
├── :root { }                     # Global CSS variables
│   ├── --card-*                  # Card tokens (existing, update values)
│   └── --glass-*                 # NEW: Quantum Glass tokens
│       ├── --glass-void          # Deepest background
│       ├── --glass-panel         # Blur panel
│       ├── --glass-solid         # No-blur panel
│       ├── --glass-elevated      # Raised element
│       ├── --glass-border        # Default border
│       ├── --glass-border-*      # Border states
│       ├── --glass-text-*        # Text hierarchy
│       ├── --neon-*              # Accent colors
│       ├── --glow-*              # Shadow effects
│       └── --duration-*, --ease-*# Motion
│
└── .glass-* { }                  # Utility classes
    ├── .glass-panel              # Blur container
    ├── .glass-panel-solid        # Solid container
    ├── .glass-card               # Interactive card
    └── .hover-lift               # Hover animation
```

### Token Relationships

```
Background Layers (dark to light):
--glass-void (#030712)
  └── --glass-panel (rgba with blur)
        └── --glass-elevated (lighter rgba)

Border States:
--glass-border (#1e293b)
  ├── :hover → --glass-border-hover (#334155)
  ├── [data-selected] → --glass-border-selected (cyan)
  └── [data-active] → --glass-border-active (green)

Text Hierarchy:
--glass-text-primary (#fff)
  └── --glass-text-secondary (#e2e8f0)
        └── --glass-text-body (#cbd5e1)
              └── --glass-text-muted (#94a3b8)
                    └── --glass-text-subtle (#64748b)
```

---

## Component Architecture

### Composition Hierarchy

```
GroveWorkspace (void background + grid)
├── NavigationSidebar (glass-solid)
│   ├── NavSection (title styling)
│   └── NavItem (states: default/hover/active)
│
├── ContentRouter (transparent)
│   └── [View] (LensPicker | JourneyList | NodeGrid)
│       ├── CollectionHeader (existing)
│       ├── ControlBar (NEW: search/filter strip)
│       └── ObjectGrid
│           └── CardShell (glass-card with states)
│               ├── StatusBadge (NEW)
│               └── [Content]
│
└── Inspector (glass-solid)
    └── InspectorPanel
        ├── InspectorHeader
        ├── InspectorSection (collapsible)
        │   └── ObjectInspector / LensInspector / etc.
        └── InspectorActions
```

### New Shared Components

```
src/shared/ui/
├── StatusBadge.tsx       # Monospace status indicator
├── GlassPanel.tsx        # Base glass container (optional)
└── ControlBar.tsx        # Search/filter strip (optional)
```

**Decision:** StatusBadge is required. GlassPanel and ControlBar can be deferred if CardShell + CSS utilities cover needs.

---

## Visual State Machine

Every card follows this state model:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────┐    hover    ┌─────────┐                   │
│   │ DEFAULT │ ──────────► │  HOVER  │                   │
│   └─────────┘             └─────────┘                   │
│        │                       │                        │
│        │ click                 │ click                  │
│        ▼                       ▼                        │
│   ┌──────────────────────────────────────┐              │
│   │             SELECTED                 │              │
│   │  (cyan ring, inspected in panel)     │              │
│   └──────────────────────────────────────┘              │
│                                                         │
│   Parallel State (independent):                         │
│   ┌──────────────────────────────────────┐              │
│   │             ACTIVE                   │              │
│   │  (green border, "currently applied") │              │
│   └──────────────────────────────────────┘              │
│                                                         │
│   ACTIVE + SELECTED = Both treatments composed          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CSS Implementation

```css
/* Base */
.glass-card {
  background: var(--glass-panel);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  transition: all var(--duration-normal) var(--ease-out-expo);
}

/* Hover */
.glass-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}

/* Selected (data attribute) */
.glass-card[data-selected="true"] {
  border-color: var(--glass-border-selected);
  box-shadow: 0 0 0 1px var(--glass-border-selected), var(--glow-cyan);
}

/* Active (data attribute) */
.glass-card[data-active="true"] {
  border-color: var(--glass-border-active);
  background: linear-gradient(135deg, rgba(16,185,129,0.1), var(--glass-panel));
}

/* Active + Selected */
.glass-card[data-active="true"][data-selected="true"] {
  border-color: var(--neon-green);
  box-shadow: 0 0 0 1px var(--neon-green), var(--glow-green);
}
```

---

## File Change Map

### Phase 1: Token Foundation
```
styles/globals.css
  └── Add: ~120 lines (tokens + utilities)
```

### Phase 2: Background & Nav
```
src/workspace/GroveWorkspace.tsx
  └── Modify: ~5 lines (add class to container)

src/workspace/NavigationSidebar.tsx
  └── Modify: ~40 lines (styling classes)
```

### Phase 3: Cards
```
src/surface/components/GroveObjectCard/CardShell.tsx
  └── Modify: ~50 lines (glass treatment + corner accents)

src/shared/ui/StatusBadge.tsx
  └── Create: ~80 lines (new component)
```

### Phase 4: Inspector
```
src/shared/layout/InspectorPanel.tsx
  └── Modify: ~40 lines (glass styling)

src/shared/inspector/ObjectInspector.tsx
  └── Modify: ~30 lines (section styling)
```

### Phase 5: Collection Views
```
src/explore/LensPicker.tsx
  └── Modify: ~40 lines (apply glass-card, add StatusBadge)

src/explore/JourneyList.tsx
  └── Modify: ~30 lines (apply glass-card, add StatusBadge)

src/explore/NodeGrid.tsx
  └── Modify: ~30 lines (apply glass-card, add StatusBadge)
```

---

## Integration Points

### CardShell → LensPicker/JourneyList/NodeGrid

CardShell is the styling wrapper. Collection views pass:
- `isActive` — whether this is the currently applied lens/journey
- `isInspected` — whether this card is selected for inspection

CardShell renders:
- data-active attribute for CSS
- data-selected attribute for CSS (using isInspected)

### StatusBadge → CardShell

Badge rendered conditionally:
```tsx
{meta.status === 'active' && <StatusBadge variant="active" />}
{meta.status === 'draft' && <StatusBadge variant="draft" />}
{isSystemLens && <StatusBadge variant="system" />}
```

### GroveWorkspace → Background

Background applied via className:
```tsx
<div className="grove-workspace glass-viewport ...">
```

Where `.glass-viewport` defines:
- Background color (--glass-void)
- Grid overlay (::before pseudo)
- Optional ambient glow (::after pseudo)

---

## Fallback Strategy

For browsers without `backdrop-filter` support:

```css
.glass-panel {
  background: var(--glass-solid); /* Fallback: solid color */
  backdrop-filter: blur(12px);
}

@supports (backdrop-filter: blur(12px)) {
  .glass-panel {
    background: var(--glass-panel); /* Enhanced: rgba with blur */
  }
}
```

---

## Testing Strategy

### Visual Verification
- Screenshot each phase
- Compare against VISION.md specs
- Verify state transitions work

### Automated Tests
- Existing tests should pass (no logic changes)
- Add visual regression test if CI supports it

### Manual Checklist
- [ ] Void background visible
- [ ] Cards lift on hover
- [ ] Selected state shows cyan ring
- [ ] Active state shows green border
- [ ] Active + Selected shows both
- [ ] Inspector sections collapse
- [ ] Badge pulse animates
- [ ] Consistent across Lenses/Journeys/Nodes

---

*Architecture complete. Ready for MIGRATION_MAP.md.*
