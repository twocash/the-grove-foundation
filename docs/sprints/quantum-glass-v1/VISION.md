# Quantum Glass UI Transformation — Vision Document

**Sprint:** quantum-glass-v1  
**Status:** Vision & Planning  
**Scope:** Complete visual transformation of /terminal interface

---

## The Problem

The current /terminal interface is **functional but lifeless**. It looks like a prototype — flat backgrounds, basic borders, no depth, no sense that you're interacting with living infrastructure. The DESIGN_SYSTEM.md describes a "Quantum Glass" aesthetic that was never implemented.

**Current state:**
- Flat dark gray backgrounds
- Cards with thin borders, no depth
- No glass effects (blur, transparency)
- No hover lift or micro-interactions
- Inspector panel is plain JSON dump
- No visual hierarchy between object states
- Feels like a debug tool, not a prototype

**Target state:**
- Deep void background with subtle grid
- Glass panels with backdrop blur creating depth
- Cards that lift and glow on interaction
- Neon accents (cyan for selected, green for active)
- Status badges with monospace system feel
- Inspector that feels like mission control
- **Feels like cognitive infrastructure made visible**

---

## The Pattern: Object Explorer

This transformation establishes THE canonical pattern for browsing any GroveObject collection. The pattern must work identically for:

- **Lenses** (personas/perspectives)
- **Journeys** (guided explorations)
- **Nodes** (knowledge graph vertices)
- **Sprouts** (captured insights) — future
- **Fields** (domain contexts) — future
- **Diary entries** — future

### The Three-Column Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HEADER BAR                                      │
│  [Logo]  The Grove                                    [Search] [Settings]   │
├────────────┬────────────────────────────────────────────┬───────────────────┤
│            │                                            │                   │
│   NAV      │            CENTER PANEL                    │    INSPECTOR      │
│   RAIL     │                                            │    PANEL          │
│            │  ┌──────────────────────────────────────┐  │                   │
│  Explore   │  │  [Search...]        [Sort ▾] [Filter]│  │  Object Inspector │
│  ─────     │  └──────────────────────────────────────┘  │  ───────────────  │
│  Terminal  │                                            │                   │
│  > Lenses  │  ┌─────────────┐  ┌─────────────┐          │  ▼ META           │
│    Journey │  │ ◉           │  │ ◉           │          │    id: "..."      │
│    Nodes   │  │             │  │    ═══      │ selected │    type: "lens"   │
│    Diary   │  │  Freestyle  │  │  Concerned  │          │    status: active │
│    Sprouts │  │  "Explore.. │  │  Citizen    │          │                   │
│            │  │             │  │             │          │  ▼ PAYLOAD        │
│  Do        │  │   [Select]  │  │   [Select]  │          │    tone: {...}    │
│  ─────     │  └─────────────┘  └═════════════┘          │                   │
│  ...       │                                            │  ───────────────  │
│            │  ┌─────────────┐  ┌─────────────┐          │  [Edit] [Delete]  │
│            │  │ ◉   Active  │  │ ◉           │          │                   │
│            │  │    ════     │  │             │          │                   │
│            │  │  Academic   │  │  Engineer   │          │                   │
│            │  │             │  │             │          │                   │
│            │  └══════════════┘  └─────────────┘          │                   │
│            │                                            │                   │
│  ~200px    │              flex-1                        │      ~360px       │
└────────────┴────────────────────────────────────────────┴───────────────────┘
```

### Visual States

Every card in the grid has exactly four visual states:

| State | Trigger | Visual Treatment |
|-------|---------|------------------|
| **Default** | None | Glass panel, subtle border |
| **Hover** | Mouse enter | Border lightens, 2px lift, subtle shadow |
| **Selected** | Click (for inspection) | Cyan ring, cyan border glow |
| **Active** | Currently applied | Green border, green background tint, "Active" badge |

These states compose: a card can be Active + Selected simultaneously.

---

## Design Tokens (Full Implementation)

### Backgrounds

```css
--glass-void: #030712;                    /* Deepest layer */
--glass-panel: rgba(17, 24, 39, 0.6);     /* Panels with blur */
--glass-solid: #111827;                   /* Panels without blur */
--glass-elevated: rgba(30, 41, 59, 0.4);  /* Raised elements */
```

### Accent Colors

```css
--neon-green: #10b981;              /* Active, growth, success */
--neon-cyan: #06b6d4;               /* Selected, system, info */
--neon-amber: #f59e0b;              /* Warning, favorites */
--neon-violet: #8b5cf6;             /* Custom/user-created */
```

### Text Scale

```css
--glass-text-primary: #ffffff;            /* Headlines */
--glass-text-secondary: #e2e8f0;          /* Subheadings */
--glass-text-body: #cbd5e1;               /* Body copy */
--glass-text-muted: #94a3b8;              /* Descriptions */
--glass-text-subtle: #64748b;             /* Tertiary */
--glass-text-faint: #475569;              /* Disabled */
```

### Borders

```css
--glass-border: #1e293b;                        /* Standard */
--glass-border-hover: #334155;                  /* On hover */
--glass-border-active: rgba(16, 185, 129, 0.5); /* Active state */
--glass-border-selected: rgba(6, 182, 212, 0.5);/* Selected state */
```

### Glows

```css
--glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
--glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);
--glow-ambient: 0 8px 32px rgba(0, 0, 0, 0.4);
```

### Motion

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
```

---

## Component Specifications

### 1. Glass Panel (Foundation)

The building block for all containers.

```css
.glass-panel {
  background: var(--glass-panel);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}

.glass-panel-solid {
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}

.glass-panel-interactive {
  transition: all var(--duration-normal) var(--ease-out-expo);
}

.glass-panel-interactive:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}
```

### 2. Object Card

The card component for grid display.

**Structure:**
```
┌────────────────────────────────────────┐
│ ┌──┐                          [badge]  │
│ │◉ │                                   │
│ └──┘                                   │
│                                        │
│  Title                                 │
│  "Description text that can wrap..."   │
│                                        │
│                            [Action]    │
└────────────────────────────────────────┘
```

**Visual treatments by state:**

```css
/* Default */
.object-card {
  background: var(--glass-panel);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all var(--duration-normal) var(--ease-out-expo);
}

/* Hover */
.object-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}

/* Selected (being inspected) */
.object-card[data-selected="true"] {
  border-color: var(--glass-border-selected);
  box-shadow: 
    0 0 0 1px var(--glass-border-selected),
    var(--glow-cyan);
}

/* Active (currently applied) */
.object-card[data-active="true"] {
  border-color: var(--glass-border-active);
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    var(--glass-panel)
  );
}

/* Active + Selected */
.object-card[data-active="true"][data-selected="true"] {
  border-color: var(--neon-green);
  box-shadow: 
    0 0 0 1px var(--neon-green),
    var(--glow-green);
}
```

**Corner Accents:**
```css
.object-card::before,
.object-card::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 1px solid var(--glass-border);
  transition: border-color var(--duration-normal);
  pointer-events: none;
}

.object-card::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-radius: 12px 0 0 0;
}

.object-card::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 12px 0;
}

.object-card:hover::before,
.object-card:hover::after {
  border-color: var(--neon-cyan);
}

.object-card[data-active="true"]::before,
.object-card[data-active="true"]::after {
  border-color: var(--neon-green);
}
```

### 3. Status Badge

Monospace system indicators.

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 4px;
}

.status-badge-active {
  background: rgba(16, 185, 129, 0.15);
  color: var(--neon-green);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-badge-active::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--neon-green);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.status-badge-draft {
  background: rgba(100, 116, 139, 0.15);
  color: var(--glass-text-muted);
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.status-badge-system {
  background: rgba(6, 182, 212, 0.15);
  color: var(--neon-cyan);
  border: 1px solid rgba(6, 182, 212, 0.3);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 4. Inspector Panel

The right-side detail view — mission control for object inspection.

```css
.inspector-panel {
  background: var(--glass-solid);
  border-left: 1px solid var(--glass-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inspector-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.3);
}

.inspector-type-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--neon-cyan);
  margin-bottom: 4px;
}

.inspector-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--glass-text-primary);
}

.inspector-section {
  border-bottom: 1px solid var(--glass-border);
}

.inspector-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--glass-text-subtle);
  cursor: pointer;
  transition: all var(--duration-fast);
  background: rgba(0, 0, 0, 0.15);
}

.inspector-section-header:hover {
  color: var(--glass-text-muted);
  background: rgba(0, 0, 0, 0.25);
}

.inspector-section-content {
  padding: 16px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.inspector-actions {
  margin-top: auto;
  padding: 16px 20px;
  border-top: 1px solid var(--glass-border);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  gap: 12px;
}

.inspector-button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--duration-fast);
}

.inspector-button-primary {
  background: var(--neon-green);
  color: #000;
}

.inspector-button-primary:hover {
  background: #34d399;
  box-shadow: var(--glow-green);
}

.inspector-button-secondary {
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-secondary);
}

.inspector-button-secondary:hover {
  border-color: var(--glass-border-hover);
  background: rgba(51, 65, 85, 0.5);
}
```

### 5. Control Bar (Search/Filter)

Top control strip for collection views.

```css
.control-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-panel);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  margin-bottom: 24px;
}

.control-bar-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-bar-search-icon {
  color: var(--glass-text-subtle);
}

.control-bar-search-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--glass-text-body);
  font-size: 14px;
  outline: none;
}

.control-bar-search-input::placeholder {
  color: var(--glass-text-subtle);
}

.control-bar-divider {
  width: 1px;
  height: 24px;
  background: var(--glass-border);
}

.control-bar-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--glass-elevated);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  color: var(--glass-text-muted);
  font-size: 13px;
  transition: all var(--duration-fast);
}

.control-bar-button:hover {
  border-color: var(--glass-border-hover);
  color: var(--glass-text-secondary);
}
```

### 6. Navigation Rail

Left sidebar styling.

```css
.nav-rail {
  width: 220px;
  background: var(--glass-solid);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.nav-section {
  padding: 8px 0;
}

.nav-section-title {
  padding: 12px 20px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--glass-text-subtle);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: var(--glass-text-muted);
  font-size: 14px;
  transition: all var(--duration-fast);
  border-left: 2px solid transparent;
  cursor: pointer;
}

.nav-item:hover {
  background: var(--glass-elevated);
  color: var(--glass-text-secondary);
}

.nav-item[data-active="true"] {
  background: rgba(16, 185, 129, 0.1);
  color: var(--neon-green);
  border-left-color: var(--neon-green);
}

.nav-item-icon {
  font-size: 18px;
  opacity: 0.7;
}

.nav-item[data-active="true"] .nav-item-icon {
  opacity: 1;
}

.nav-item-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--glass-elevated);
  border-radius: 10px;
  font-size: 11px;
  color: var(--glass-text-subtle);
}
```

---

## Page Background Treatment

The foundation that everything sits on.

```css
.terminal-viewport {
  background: var(--glass-void);
  min-height: 100vh;
  position: relative;
}

/* Subtle grid pattern */
.terminal-viewport::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  pointer-events: none;
  opacity: 0.5;
}

/* Ambient glow in center */
.terminal-viewport::after {
  content: '';
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(
    ellipse,
    rgba(6, 182, 212, 0.03) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

---

## Animation Catalog

### Hover Lift
```css
.hover-lift {
  transition: all var(--duration-normal) var(--ease-out-expo);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}
```

### Selection Ring
```css
.selection-ring {
  box-shadow: 
    0 0 0 1px var(--glass-border-selected),
    var(--glow-cyan);
  transition: box-shadow var(--duration-fast);
}
```

### Panel Slide In
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideInRight var(--duration-normal) var(--ease-out-expo);
}
```

### Fade Up (for cards)
```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fadeUp var(--duration-normal) var(--ease-out-expo);
}
```

---

## Files to Transform

### Core CSS (~200 lines new/modified)
| File | Change |
|------|--------|
| `styles/globals.css` | Full Quantum Glass token set + utility classes |

### Layout Components
| File | Change |
|------|--------|
| `src/app/terminal/layout.tsx` | Void background, grid pattern |
| `src/shared/layout/InspectorPanel.tsx` | Glass styling, monospace headers |
| `src/surface/layout/FoundationLayout.tsx` | Nav rail styling |

### Object Cards
| File | Change |
|------|--------|
| `src/surface/components/GroveObjectCard/CardShell.tsx` | Complete glass treatment |
| `src/explore/LensPicker.tsx` | Card states, badges, corner accents |
| `src/explore/JourneyList.tsx` | Card states, badges |
| `src/explore/NodeGrid.tsx` | Card states, badges |

### Inspector
| File | Change |
|------|--------|
| `src/shared/inspector/ObjectInspector.tsx` | Glass sections, styled JSON, actions |

### New Components (Shared)
| File | Purpose |
|------|---------|
| `src/shared/ui/StatusBadge.tsx` | Reusable badge component |
| `src/shared/ui/ControlBar.tsx` | Search/filter strip |
| `src/shared/ui/GlassPanel.tsx` | Base glass container |

---

## Implementation Phases

### Phase 1: Token Foundation
- Add all Quantum Glass tokens to globals.css
- Add utility classes (glass-panel, hover-lift, etc.)
- Add animations
- **Checkpoint:** Build passes, tokens available

### Phase 2: Background & Layout
- Apply void background to terminal viewport
- Add grid pattern overlay
- Style nav rail
- **Checkpoint:** Terminal feels darker, deeper

### Phase 3: Card Transformation
- Update CardShell with glass treatment
- Add corner accents
- Wire visual states (hover, selected, active)
- Add status badges
- **Checkpoint:** Cards look premium, states are clear

### Phase 4: Inspector Overhaul
- Restyle InspectorPanel header
- Add section styling to ObjectInspector
- Style JSON syntax highlighting
- Add action buttons
- **Checkpoint:** Inspector feels like mission control

### Phase 5: Polish & Animation
- Add entrance animations
- Verify hover interactions
- Test state compositions
- Cross-view consistency check
- **Checkpoint:** Everything feels alive

---

## Success Criteria

By the end of this sprint:

1. **The void draws you in** — Deep #030712 background with subtle grid creates depth
2. **Glass panels float** — Every card and panel has blur, visible layering
3. **Interactions feel alive** — Hover lift, selection glow, smooth transitions
4. **States are crystal clear** — Active (green), Selected (cyan), Default distinguishable instantly
5. **System typography** — Monospace badges and labels feel like infrastructure
6. **Consistent across all views** — Lenses, Journeys, Nodes use identical patterns
7. **Inspector is mission control** — Sectioned, styled, actionable

---

## The Revelation

The end state should make someone looking at the current screenshot say:

*"Holy shit, that's the same app?"*

Not incremental improvement. **Transformation.**

---

*This vision document establishes the target. Ready for Foundation Loop.*
