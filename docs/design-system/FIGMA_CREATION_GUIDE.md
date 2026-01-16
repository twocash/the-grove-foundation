# Figma Creation Guide: Sprout Finishing Room

> Manual wireframe creation instructions for Figma

**Version:** 1.0
**Last Updated:** 2026-01-14
**HTML Prototype:** `docs/design-system/prototypes/sprout-finishing-room.html`
**FigJam Architecture:** [View Diagram](https://www.figma.com/online-whiteboard/create-diagram/bd0c25ea-f841-4ce3-96a6-24130a8d9b16)

---

## Overview

This guide provides step-by-step instructions for recreating the Sprout Finishing Room wireframes in Figma. Use the HTML prototypes as visual reference while building.

**Prerequisites:**
1. Open `sprout-finishing-room.html` in a browser for the main layout
2. Open `sprout-finishing-room-states.html` for state variations
3. Have the FigJam architecture diagram open for component hierarchy

---

## 1. Figma Setup

### Create New File
1. Create new Figma design file: `Grove - Sprout Finishing Room`
2. Add pages:
   - `📐 Components` - Reusable components
   - `🖼️ Main Layout` - Primary wireframe
   - `🔄 States` - State variations
   - `📱 Responsive` - Breakpoint variants

### Install Fonts
Ensure these fonts are available:
- **Playfair Display** (Google Fonts)
- **Inter** (Google Fonts)
- **JetBrains Mono** (Google Fonts)

### Set Up Color Styles
Create these color styles in Figma:

| Style Name | Hex Value | Usage |
|------------|-----------|-------|
| `void` | `#030712` | Background |
| `glass` | `#0f172a` at 60% | Glass panels |
| `glass-solid` | `#1e293b` | Solid glass |
| `text-primary` | `#f8fafc` | Headers |
| `text-secondary` | `#e2e8f0` | Subheaders |
| `text-body` | `#cbd5e1` | Body text |
| `text-muted` | `#94a3b8` | Secondary text |
| `text-subtle` | `#64748b` | Tertiary text |
| `border-default` | `#94a3b8` at 15% | Default borders |
| `border-hover` | `#94a3b8` at 25% | Hover borders |
| `grove-forest` | `#2F5C3B` | Brand green |
| `grove-clay` | `#D95D39` | Brand orange |
| `neon-green` | `#10b981` | Primary accent |
| `neon-cyan` | `#06b6d4` | Secondary accent |
| `error-red` | `#ef4444` | Error states |

---

## 2. Component Creation

### A. Header Bar Component

**Frame:** `Header Bar`
- Width: Fill container
- Height: 48px
- Background: `void`
- Border bottom: 1px `border-default`

**Children:**
1. **Left Group** (Auto layout, horizontal, gap 12px)
   - Sprout icon: 🌱 (18px)
   - Title: "SPROUT FINISHING ROOM"
     - Font: JetBrains Mono, 11px, Medium
     - Uppercase, letter-spacing 0.1em
     - Color: `text-muted`

2. **Center Text**
   - Document title (truncated)
   - Font: Inter, 14px
   - Color: `text-secondary`
   - Max width: 400px

3. **Close Button**
   - Frame: 32×32px
   - Background: transparent
   - Border: 1px `border-default`
   - Border radius: 6px
   - Icon: × (18px, `text-muted`)

**Bottom Gradient Line:**
- Height: 1px
- Fill: Linear gradient (transparent → `neon-green` at 30% → transparent)

---

### B. Provenance Panel Component

**Frame:** `Provenance Panel`
- Width: 280px (fixed)
- Height: Fill container
- Background: `glass`
- Blur: 12px backdrop
- Border right: 1px `border-default`
- Padding: 16px
- Auto layout: Vertical, gap 16px

#### Provenance Item (Component)
- Padding: 12px
- Background: `#0f172a` at 30%
- Border: 1px `border-default`
- Border radius: 6px
- Cursor: pointer

**Children:**
1. **Label Row**
   - Font: JetBrains Mono, 10px
   - Uppercase, letter-spacing 0.1em
   - Color: `text-subtle`
   - Icon + text (e.g., "🔮 LENS")

2. **Value**
   - Font: Inter, 14px
   - Color: `text-secondary`

**Variants:** Create for Lens and Cognitive Routing

#### Cognitive Routing Item (Expanded Variant)
The Cognitive Routing item replaces the deprecated Hub/Journey/Node model with 4D experience provenance.

- Same base styling as Provenance Item
- Additional inner section with border-top

**Routing Details Children:**
1. **Path** - The experience path taken (e.g., "deep-dive → cost-dynamics")
2. **Prompt** - The active prompt/mode (e.g., "Analytical research mode")
3. **Inspiration** - The triggering context (system prompt, user query, random thought)

**Detail Row Styling:**
- Label: JetBrains Mono, 10px, uppercase, `text-subtle`, min-width 70px
- Value: JetBrains Mono, 11px, `text-muted`

> **IMPORTANT:** Do NOT use Hub, Journey, or Node terminology. These are deprecated MVP concepts.
> All provenance/routing should reflect the 4D experience management model.

#### Sources List
- Header: "KNOWLEDGE SOURCES" (same style as section headers)
- Items: JetBrains Mono, 12px, `text-body`
- Bullet: ▸ in `text-subtle`

---

### C. Document Viewer Component

**Frame:** `Document Viewer`
- Width: Fill container
- Height: Fill container
- Background: `void`
- Padding: 24px
- Overflow: Scroll

**Children:**
1. **Thesis Section**
   - Font: Playfair Display, 24px, Medium
   - Color: `text-primary`
   - Line height: 1.4
   - Border bottom: 1px `border-subtle`
   - Padding bottom: 24px

2. **Analysis Section**
   - Font: Inter, 16px
   - Color: `text-body`
   - Line height: 1.7
   - Paragraph spacing: 16px

3. **Citations Section**
   - Top border: 1px `border-subtle`
   - Header: JetBrains Mono, 11px, uppercase
   - Items: JetBrains Mono, 12px, `text-muted`

---

### D. Action Panel Component

**Frame:** `Action Panel`
- Width: 320px (fixed)
- Height: Fill container
- Background: `glass`
- Blur: 12px backdrop
- Border left: 1px `border-default`
- Padding: 16px
- Auto layout: Vertical, gap 16px

#### Primary Action Section
- Background: `neon-green` at 5%
- Border: 1px `neon-green` at 20%
- Border radius: 8px
- Padding: 16px

**Children:**
1. **Section Title**
   - "REVISE & RESUBMIT"
   - JetBrains Mono, 11px, uppercase
   - Color: `neon-green`

2. **Textarea**
   - Background: `void` at 50%
   - Border: 1px `border-default`
   - Border radius: 6px
   - Min height: 80px
   - Placeholder text: `text-faint`

3. **Primary Button**
   - Background: `neon-green`
   - Text: `void`, JetBrains Mono, 12px, uppercase
   - Border radius: 6px
   - Padding: 12px 16px

#### Secondary Action Section
- Background: `neon-cyan` at 5%
- Border: 1px `neon-cyan` at 15%
- Border radius: 8px
- Padding: 16px

**Checklist Item (Component):**
- Background: `void` at 30%
- Border: 1px `border-default`
- Border radius: 4px
- Padding: 8px
- Auto layout: Horizontal, gap 8px

**Checkbox States:**
- Unchecked: 16×16, border only
- Checked: 16×16, fill `neon-cyan`, checkmark icon

**Secondary Button:**
- Background: transparent
- Border: 1px `neon-cyan` at 30%
- Text: `neon-cyan`, JetBrains Mono, 11px, uppercase
- Border radius: 6px

#### Tertiary Actions
- Positioned at bottom (margin-top: auto)
- Top border: 1px `border-subtle`
- Padding top: 16px

**Tertiary Button:**
- Background: transparent
- Text: Inter, 13px, `text-muted`
- Icon + text layout
- Hover: background at 5% white

---

### E. Status Bar Component

**Frame:** `Status Bar`
- Width: Fill container
- Height: 32px
- Background: `void` at 95%
- Border top: 1px `border-default`
- Padding: 0 16px
- Auto layout: Horizontal, space-between

**Left Group:**
- Text segments with dividers (│)
- JetBrains Mono, 10px, uppercase
- Color: `text-subtle`

**Right Group:**
- Status indicator: 6×6px circle
- Fill: `neon-green`
- Animation: Pulsing (note in component docs)

---

## 3. Main Layout Assembly

### Frame: `Sprout Finishing Room`
- Width: 95vw (use 1520px for desktop mockup)
- Height: 95vh (use 855px for desktop mockup)
- Background: `void`
- Border: 1px `border-default`
- Border radius: 12px
- Overflow: Hidden
- Auto layout: Vertical

### Layout Structure
```
[Header Bar - 48px height]
[Content Area - fill height]
  ├── [Provenance Panel - 280px width]
  ├── [Document Viewer - fill width]
  └── [Action Panel - 320px width]
[Status Bar - 32px height]
```

### Backdrop (Separate Frame)
- Position: Behind modal
- Fill: `void` at 85%
- Blur: 8px

---

## 4. State Variations

Create the following frames in the `States` page:

### 4.1 Empty State
- Center content in Document Viewer area
- Sprout icon (64px, pulsing animation note)
- "Loading Research" title
- Progress bar: 120×4px with gradient fill

### 4.2 Loading State
- Overlay on content (blur background)
- Spinner: 48×48px ring, top segment colored
- "PROCESSING REVISION" text
- Progress bar: 200×2px

### 4.3 Error State
- Warning icon in circle (64px)
- Red title: "Revision Failed"
- Error message text
- Error code badge
- Retry + Dismiss buttons

### 4.4 Success State
- Checkmark icon in circle (72px)
- Green glow effect
- "Added to Field" title
- Details list with checkmarks
- Done button
- Clay-colored particles (illustrative)

### 4.5 Error Toast
- Position: Bottom center of modal
- Background: `error-red` at 90%
- White text with dismiss button

---

## 5. Responsive Breakpoints

Create variants for:

| Breakpoint | Provenance | Actions | Layout |
|------------|------------|---------|--------|
| ≥1280px | 280px | 320px | Full 3-column |
| 1024-1279px | 240px | 280px | Narrow columns |
| 768-1023px | 60px icons | Slide-over | Collapsed left |
| <768px | Tab | Tab | Single column + tabs |

---

## 6. Export & Handoff

### Frame Exports
1. Main layout at 1x, 2x PNG
2. Each state variation
3. Component library

### Developer Specs
Enable Figma Dev Mode for:
- CSS values
- Spacing measurements
- Color token references

### Assets to Extract
- Close button icon
- Checkbox icons (checked/unchecked)
- Status indicator
- Loading spinner

---

## 7. Figma Auto Layout Tips

### Three-Column Layout
```
Parent: Auto layout (horizontal)
├── Provenance: Fixed width (280px), Fill height
├── Document: Fill width, Fill height
└── Actions: Fixed width (320px), Fill height
```

### Action Panel Sections
```
Parent: Auto layout (vertical), gap 16px
├── Primary Section: Fixed
├── Secondary Section: Fixed
└── Tertiary Section: Fill (pushes to bottom)
```

### Checklist
```
Parent: Auto layout (vertical), gap 8px
├── Item 1: Auto layout (horizontal), gap 8px
│   ├── Checkbox: Fixed 16×16
│   ├── Label: Fill
│   └── Meta: Hug contents
```

---

## 8. Animation Notes

Document these animations in component description:

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Modal entry | Scale 0.95→1, fade | 300ms | ease-out |
| Backdrop | Fade + blur | 300ms | ease-out |
| Checkbox toggle | Scale bounce | 150ms | ease-out |
| Success particles | Float up + fade | 2000ms | ease-out |
| Status indicator | Opacity pulse | 2000ms | ease-in-out |
| Loading spinner | Rotation | 1000ms | linear |

---

## Checklist

- [ ] Color styles created
- [ ] Text styles created
- [ ] Header Bar component built
- [ ] Provenance Panel component built
- [ ] Provenance Item variants created
- [ ] Document Viewer component built
- [ ] Action Panel component built
- [ ] Checklist Item variants created
- [ ] Button variants created (primary, secondary, tertiary)
- [ ] Status Bar component built
- [ ] Main layout assembled
- [ ] Empty state frame created
- [ ] Loading state frame created
- [ ] Error state frame created
- [ ] Success state frame created
- [ ] Responsive variants created
- [ ] Animations documented
- [ ] Dev mode enabled
- [ ] Assets exported

---

*Figma Creation Guide v1.0 — Use with HTML prototypes as visual reference*
