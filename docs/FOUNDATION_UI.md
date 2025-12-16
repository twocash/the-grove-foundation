# Foundation UI Specification

> Layout, Tokens, Component Specs, and Interactions
> Version 1.0 | 2025-12-16

---

## 1. Design Philosophy

### The Holodeck Metaphor

Foundation is the "control plane" — an omniscient view into the system's state and behavior. The visual language draws from:

- **Sci-fi command centers**: Dense information displays, glowing interfaces
- **IDE dark modes**: High contrast, monospace typography, syntax highlighting
- **HUD overlays**: Minimal chrome, data-forward design, status indicators

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Dark-first** | Obsidian backgrounds (#0D0D0D), no light mode |
| **Information density** | Compact spacing, smaller text, more data per screen |
| **Glowing accents** | Cyan (#00D4FF) as primary, subtle glow effects |
| **Grid structure** | Subtle grid overlay, aligned components |
| **Mono typography** | JetBrains Mono for data, Inter for labels |

---

## 2. Color System

### 2.1 Background Layers

```
┌─────────────────────────────────────────────────────────────┐
│  obsidian-DEFAULT (#0D0D0D)  - Page background              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  obsidian-raised (#141414)  - Cards, panels           │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  obsidian-elevated (#1A1A1A)  - Modals, dropdowns│  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  obsidian-surface (#242424)  - Hover/Active│  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `holo-cyan` | #00D4FF | Primary accent, links, active states |
| `holo-magenta` | #FF00D4 | Secondary accent, highlights |
| `holo-lime` | #00FF88 | Success, positive indicators |
| `holo-amber` | #FFB800 | Warning, caution states |
| `holo-red` | #FF4444 | Error, danger, destructive |

### 2.3 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | #FFFFFF | Headings, important text |
| `text-secondary` | #A0A0A0 | Body text, descriptions |
| `text-muted` | #666666 | Labels, helper text |
| `text-disabled` | #444444 | Disabled states |

### 2.4 Border & Grid

| Token | Value | Usage |
|-------|-------|-------|
| `grid-line` | rgba(0, 212, 255, 0.1) | Grid overlay lines |
| `grid-glow` | rgba(0, 212, 255, 0.3) | Grid intersection glow |
| `border-default` | rgba(0, 212, 255, 0.2) | Panel borders |
| `border-hover` | rgba(0, 212, 255, 0.4) | Hover state borders |
| `border-active` | #00D4FF | Active/focus borders |

---

## 3. Typography

### 3.1 Font Stack

```typescript
fonts: {
  mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
  sans: ['Inter', 'system-ui', 'sans-serif']
}
```

### 3.2 Type Scale

| Name | Size | Weight | Font | Usage |
|------|------|--------|------|-------|
| `heading-xl` | 24px | 600 | Inter | Page titles |
| `heading-lg` | 18px | 600 | Inter | Section headers |
| `heading-md` | 14px | 600 | Inter | Card headers |
| `body` | 13px | 400 | Inter | Descriptions |
| `body-sm` | 11px | 400 | Inter | Helper text |
| `mono-lg` | 14px | 500 | JetBrains | Data values |
| `mono-md` | 12px | 400 | JetBrains | Code, IDs |
| `mono-sm` | 10px | 400 | JetBrains | Timestamps |

### 3.3 Text Styles

```css
/* Heading */
.f-heading-xl {
  font-family: Inter;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #FFFFFF;
}

/* Data value */
.f-mono-lg {
  font-family: 'JetBrains Mono';
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: #00D4FF;
}
```

---

## 4. Layout System

### 4.1 Foundation Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          HUD HEADER (48px)                              │
│ ┌──────┐ ┌─────────────────────────────────────┐ ┌────────────────────┐ │
│ │ LOGO │ │ Foundation / Console Name           │ │ Status  │  v2.4.1 │ │
│ └──────┘ └─────────────────────────────────────┘ └────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│┌──────┐┌────────────────────────────────────────────────────────────────┤
││      ││                                                                │
││  N   ││                                                                │
││  A   ││                    GRID VIEWPORT                               │
││  V   ││              (Console content area)                            │
││      ││                                                                │
││  S   ││    ┌─────────────────┐  ┌─────────────────┐                    │
││  I   ││    │   Data Panel    │  │   Data Panel    │                    │
││  D   ││    │                 │  │                 │                    │
││  E   ││    └─────────────────┘  └─────────────────┘                    │
││  B   ││                                                                │
││  A   ││                                                                │
││  R   ││                                                                │
││      ││                                                                │
│└──────┘└────────────────────────────────────────────────────────────────┤
│ (56px) │                        (flex-1)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Dimensions

| Element | Collapsed | Expanded |
|---------|-----------|----------|
| Header height | 48px | 48px |
| Sidebar width | 56px | 200px |
| Viewport padding | 24px | 24px |
| Grid cell size | 40px | 40px |

### 4.3 Spacing Scale

```typescript
spacing: {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px'
}
```

---

## 5. Component Specifications

### 5.1 HUD Header

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐  Foundation / Narrative Architect              ● 3    v2.4.1  │
│ │ LOGO │                                               sessions        │
│ └──────┘  [breadcrumb path]                            [status] [ver]  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Specs**:
- Height: 48px
- Background: `obsidian-raised`
- Border-bottom: `1px solid rgba(0, 212, 255, 0.1)`
- Logo: 24x24px, `holo-cyan`
- Breadcrumb: `mono-md`, `text-secondary`
- Status indicator: Pulsing dot (green = healthy)
- Version: `mono-sm`, `text-muted`

**Component API**:
```typescript
interface HUDHeaderProps {
  breadcrumb: string[];
  status: 'healthy' | 'degraded' | 'error';
  sessions?: number;
  version: string;
}
```

### 5.2 Navigation Sidebar

```
┌──────┐
│  ≡   │  Toggle (expand/collapse)
├──────┤
│  📊  │  Narrative Architect
│  ⚡  │  Engagement Bridge
│  📚  │  Knowledge Vault
│  🎛️  │  Reality Tuner
│  🎵  │  Audio Studio
├──────┤
│      │
│      │  (spacer)
│      │
├──────┤
│  ⚙️  │  Settings
│  🚪  │  Exit to Surface
└──────┘
```

**Specs**:
- Width: 56px (collapsed), 200px (expanded)
- Background: `obsidian-raised`
- Border-right: `1px solid rgba(0, 212, 255, 0.1)`
- Icon size: 20x20px
- Icon color: `text-secondary`, `holo-cyan` when active
- Label (expanded): `body-sm`, `text-secondary`
- Active indicator: 2px left border, `holo-cyan`

**Component API**:
```typescript
interface NavSidebarProps {
  expanded: boolean;
  onToggle: () => void;
  activeRoute: string;
}

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  route: string;
}
```

### 5.3 Grid Viewport

**Specs**:
- Background: `obsidian-DEFAULT`
- Grid overlay: 40px cells, `grid-line` color
- Grid dots at intersections: 2px, `grid-glow`
- Padding: 24px
- Scroll: Vertical auto, horizontal hidden

**Grid Overlay CSS**:
```css
.grid-viewport {
  background-color: #0D0D0D;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: -1px -1px;
}
```

### 5.4 Data Panel (Card)

```
┌─────────────────────────────────────────┐
│  Panel Title                    [icon]  │
│─────────────────────────────────────────│
│                                         │
│  Panel content...                       │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Specs**:
- Background: `obsidian-raised`
- Border: `1px solid rgba(0, 212, 255, 0.2)`
- Border-radius: 4px
- Padding: 16px
- Header: `heading-md`, border-bottom on hover
- Hover: `border-hover`, subtle glow

**Component API**:
```typescript
interface DataPanelProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

### 5.5 Metric Card

```
┌─────────────────────┐
│  Label              │
│  1,234              │
│  ▲ 12% vs last      │
└─────────────────────┘
```

**Specs**:
- Background: `obsidian-raised`
- Border: `1px solid rgba(0, 212, 255, 0.1)`
- Padding: 16px
- Label: `body-sm`, `text-muted`
- Value: `mono-lg`, `text-primary` or `holo-cyan`
- Trend: `mono-sm`, `holo-lime` (up) or `holo-red` (down)

**Component API**:
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  highlight?: boolean;
}
```

### 5.6 Data Grid (Table)

```
┌─────────────────────────────────────────────────────────────┐
│  ID          │ Label          │ Status    │ Actions        │
├─────────────────────────────────────────────────────────────┤
│  card-001    │ Introduction   │ ● Active  │ [Edit] [Del]   │
│  card-002    │ Stakes         │ ○ Draft   │ [Edit] [Del]   │
│  card-003    │ Architecture   │ ● Active  │ [Edit] [Del]   │
└─────────────────────────────────────────────────────────────┘
```

**Specs**:
- Header row: `obsidian-surface`, `body-sm`, `text-muted`
- Body rows: `obsidian-raised`, hover → `obsidian-surface`
- Border between rows: `1px solid rgba(0, 212, 255, 0.05)`
- Cell padding: 12px 16px
- ID column: `mono-md`, `holo-cyan`
- Status dot: 6px circle, inline with text

**Component API**:
```typescript
interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string;
}

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
}
```

### 5.7 Event Log

```
┌─────────────────────────────────────────────────────────────┐
│  Event Log                                      [Clear]     │
├─────────────────────────────────────────────────────────────┤
│  12:34:56  EXCHANGE_SENT  query: "What is..."   card-001   │
│  12:34:52  CARD_VISITED   card-001 → card-002              │
│  12:34:48  LENS_SELECTED  academic (built-in)              │
│  12:34:42  SESSION_STARTED                                  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Specs**:
- Background: `obsidian-DEFAULT` (darker for contrast)
- Height: Fixed or max-height with scroll
- Timestamp: `mono-sm`, `text-muted`
- Event type: `mono-md`, color-coded:
  - `EXCHANGE_*`: `holo-cyan`
  - `JOURNEY_*`: `holo-lime`
  - `REVEAL_*`: `holo-magenta`
  - `SESSION_*`: `text-secondary`
- Payload: `mono-sm`, `text-secondary`, truncated

**Component API**:
```typescript
interface EventLogProps {
  events: EngagementEvent[];
  maxHeight?: string;
  onClear?: () => void;
}
```

### 5.8 Glow Button

```
┌───────────────────┐
│    Button Text    │
└───────────────────┘
```

**Variants**:

| Variant | Background | Border | Text |
|---------|------------|--------|------|
| Primary | `holo-cyan/10` | `holo-cyan` | `holo-cyan` |
| Secondary | transparent | `rgba(0,212,255,0.3)` | `text-secondary` |
| Danger | `holo-red/10` | `holo-red` | `holo-red` |
| Ghost | transparent | none | `text-secondary` |

**Specs**:
- Padding: 8px 16px
- Border-radius: 4px
- Font: `mono-md`, uppercase, letter-spacing 0.05em
- Hover: Increased glow, brighter border
- Active: Scale 0.98
- Disabled: 50% opacity, no hover

**Component API**:
```typescript
interface GlowButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

### 5.9 State Monitor

```
┌─────────────────────────────────────────────────────────────┐
│  Engagement State                              [Refresh]    │
├─────────────────────────────────────────────────────────────┤
│  sessionId      session-1702734...                          │
│  exchangeCount  12                                          │
│  minutesActive  8                                           │
│  activeLensId   academic                                    │
│  revealsShown   ["simulation", "customLensOffer"]           │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Specs**:
- Key column: `mono-md`, `text-muted`
- Value column: `mono-md`, `holo-cyan` for primitives, `text-secondary` for arrays/objects
- Live updates: Value flash animation on change
- Collapsible nested objects

**Component API**:
```typescript
interface StateMonitorProps {
  state: Record<string, unknown>;
  title?: string;
  highlightChanges?: boolean;
}
```

---

## 6. Interaction Patterns

### 6.1 Hover States

| Element | Default | Hover |
|---------|---------|-------|
| Panel | `border-default` | `border-hover` + subtle glow |
| Button | Normal | Brighter glow, slight scale |
| Table row | `obsidian-raised` | `obsidian-surface` |
| Nav item | `text-secondary` | `text-primary` |

### 6.2 Active/Selected States

| Element | Active/Selected |
|---------|----------------|
| Nav item | `holo-cyan` text + 2px left border |
| Table row | `obsidian-surface` + `holo-cyan` left border |
| Tab | `holo-cyan` bottom border |

### 6.3 Focus States

- Outline: 2px `holo-cyan` with 2px offset
- No default browser outline

### 6.4 Loading States

- Skeleton: Pulsing `obsidian-surface` rectangles
- Spinner: Rotating ring, `holo-cyan`
- Progress: Horizontal bar, `holo-cyan` fill

### 6.5 Transitions

```css
/* Default transition */
transition: all 150ms ease-out;

/* Glow transition (slower) */
transition: box-shadow 300ms ease-out;

/* Color transition */
transition: color 100ms ease-out, background-color 100ms ease-out;
```

---

## 7. Animation Specifications

### 7.1 Pulse (Status Indicator)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.status-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

### 7.2 Glow Breathe (Accent Elements)

```css
@keyframes glow-breathe {
  0%, 100% { box-shadow: 0 0 5px rgba(0, 212, 255, 0.2); }
  50% { box-shadow: 0 0 15px rgba(0, 212, 255, 0.4); }
}
```

### 7.3 Value Flash (State Change)

```css
@keyframes value-flash {
  0% { background-color: rgba(0, 212, 255, 0.3); }
  100% { background-color: transparent; }
}
.value-changed {
  animation: value-flash 500ms ease-out;
}
```

### 7.4 Slide In (Panels)

```css
@keyframes slide-in {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| Desktop | ≥1280px | Full layout |
| Tablet | 1024-1279px | Collapsed sidebar |
| Small | <1024px | Not supported (message) |

### 8.2 Small Screen Message

Foundation is designed for desktop operators. On screens <1024px:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              FOUNDATION REQUIRES DESKTOP                    │
│                                                             │
│   The Control Plane is optimized for large displays.        │
│   Please access from a desktop browser.                     │
│                                                             │
│   [Return to Surface →]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Accessibility

### 9.1 Color Contrast

All text meets WCAG AA standards:
- `text-primary` (#FFFFFF) on `obsidian-DEFAULT` (#0D0D0D): 21:1
- `text-secondary` (#A0A0A0) on `obsidian-raised` (#141414): 6.5:1
- `holo-cyan` (#00D4FF) on `obsidian-DEFAULT` (#0D0D0D): 10.5:1

### 9.2 Keyboard Navigation

- All interactive elements focusable
- Tab order follows visual order
- Escape closes modals/dropdowns
- Arrow keys navigate within components (tables, nav)

### 9.3 Screen Reader Support

- ARIA labels on icon-only buttons
- ARIA live regions for state changes
- Proper heading hierarchy

---

## 10. CSS Variables Reference

```css
:root {
  /* Backgrounds */
  --f-obsidian: #0D0D0D;
  --f-obsidian-raised: #141414;
  --f-obsidian-elevated: #1A1A1A;
  --f-obsidian-surface: #242424;

  /* Accents */
  --f-holo-cyan: #00D4FF;
  --f-holo-magenta: #FF00D4;
  --f-holo-lime: #00FF88;
  --f-holo-amber: #FFB800;
  --f-holo-red: #FF4444;

  /* Text */
  --f-text-primary: #FFFFFF;
  --f-text-secondary: #A0A0A0;
  --f-text-muted: #666666;

  /* Borders */
  --f-border-default: rgba(0, 212, 255, 0.2);
  --f-border-hover: rgba(0, 212, 255, 0.4);
  --f-border-active: #00D4FF;

  /* Grid */
  --f-grid-line: rgba(0, 212, 255, 0.1);
  --f-grid-glow: rgba(0, 212, 255, 0.3);

  /* Spacing */
  --f-space-1: 4px;
  --f-space-2: 8px;
  --f-space-3: 12px;
  --f-space-4: 16px;
  --f-space-6: 24px;
  --f-space-8: 32px;

  /* Dimensions */
  --f-header-height: 48px;
  --f-sidebar-collapsed: 56px;
  --f-sidebar-expanded: 200px;
  --f-grid-cell: 40px;
}
```

---

*Foundation UI Specification Complete. See DECISIONS.md for architectural decisions.*
