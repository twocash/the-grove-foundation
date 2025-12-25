# Grove Design System v1.0

**Extracted from:** Trellis Mock (Quantum Glass UI)  
**Status:** Foundation Reference  
**Date:** December 2024

---

## Design Philosophy

**"Cognitive Infrastructure Made Visible"**

Grove's visual language communicates that users are interacting with living, thinking infrastructure—not a static application. The design should feel:

- **Alive** — Subtle animations, glows, and state changes suggest ongoing activity
- **Deep** — Dark backgrounds with layered glass panels create depth
- **Technical but Approachable** — Monospace accents for system feel, but readable prose for content
- **Trustworthy** — Clean lines, consistent spacing, deliberate color usage

---

## Color Palette

### Foundation Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--void` | `#030712` | Deepest background, base layer |
| `--glass` | `rgba(17, 24, 39, 0.6)` | Panel backgrounds with blur |
| `--glass-solid` | `#111827` | Solid version for non-blur contexts |

### Accent Colors

| Token | Value | Semantic | Usage |
|-------|-------|----------|-------|
| `--neon-green` | `#10b981` | Growth, Active, Success | Primary accent, active states, CTAs |
| `--neon-cyan` | `#06b6d4` | System, Processing, Info | Secondary accent, system labels |
| `--neon-amber` | `#f59e0b` | Warning, Attention | Alerts, key points |

### Text Hierarchy (Slate Scale)

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#ffffff` | Headlines, emphasis |
| `--text-secondary` | `#e2e8f0` (slate-200) | Subheadings |
| `--text-body` | `#cbd5e1` (slate-300) | Body text |
| `--text-muted` | `#94a3b8` (slate-400) | Descriptions |
| `--text-subtle` | `#64748b` (slate-500) | Tertiary info |
| `--text-faint` | `#475569` (slate-600) | Disabled, hints |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `#1e293b` (slate-800) | Default borders |
| `--border-hover` | `#334155` (slate-700) | Hover state borders |
| `--border-subtle` | `rgba(30, 41, 59, 0.5)` | Very subtle dividers |

### Glow Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--glow-green` | `0 0 20px -5px rgba(16, 185, 129, 0.4)` | Active/success glow |
| `--glow-cyan` | `0 0 20px -5px rgba(6, 182, 212, 0.4)` | System/info glow |

---

## Typography

### Font Families

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 10px | 400 | 1.4 | Tiny labels, IDs |
| `--text-sm` | 14px | 400 | 1.5 | Body text, descriptions |
| `--text-base` | 16px | 400 | 1.6 | Default body |
| `--text-lg` | 18px | 500 | 1.4 | Card titles |
| `--text-xl` | 20px | 500 | 1.3 | Section headers |
| `--text-2xl` | 24px | 600 | 1.2 | Page titles |
| `--text-3xl` | 30px | 300 | 1.2 | Hero text |

### Mono Usage

Monospace is used for:
- System labels (`SYS.TRELLIS.V2`)
- IDs (`ID_882`)
- Status badges (`PROCESSING`, `ARCHIVED`)
- Terminal/command interfaces
- Metrics and numbers
- Code blocks

**Pattern:** `font-mono text-xs uppercase tracking-widest`

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Small gaps |
| `--space-3` | 12px | Medium-small |
| `--space-4` | 16px | Standard padding |
| `--space-6` | 24px | Card padding, section gaps |
| `--space-8` | 32px | Large section spacing |
| `--space-10` | 40px | Major section breaks |

---

## Component Patterns

### Glass Panel

The foundational container pattern.

```css
.glass-panel {
  background: var(--glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}
```

**Variants:**
- **Solid:** No blur, use `--glass-solid`
- **Elevated:** Add subtle shadow
- **Interactive:** Border lightens on hover

### Card (Narrative Card)

```css
.card {
  background: rgba(15, 23, 42, 0.2); /* slate-900/20 */
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-default);
  padding: var(--space-6);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}
```

**Corner Accents (Optional):**
```css
.card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--border-hover);
  transition: border-color 0.3s;
}

.card:hover .card-corner {
  border-color: var(--neon-green);
}
```

### Status Badges

```css
.badge {
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 4px;
}

.badge-growth {
  background: rgba(16, 185, 129, 0.1);
  color: var(--neon-green);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.badge-processing {
  background: rgba(6, 182, 212, 0.1);
  color: var(--neon-cyan);
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.badge-archived {
  background: var(--glass-solid);
  color: var(--text-muted);
  border: 1px solid var(--border-default);
}
```

### Stat Block

For metrics and KPIs.

```css
.stat-block {
  padding: var(--space-4);
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 8px;
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-subtle);
  margin-bottom: var(--space-1);
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 24px;
  color: var(--text-primary);
}
```

### Progress Bar

```css
.progress-track {
  height: 4px;
  background: var(--glass-solid);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--neon-green), var(--neon-cyan));
  border-radius: 2px;
}
```

### Terminal Bar (Command Dock)

The bottom bar pattern for slash commands and navigation.

```css
.terminal-bar {
  height: 64px;
  background: rgba(3, 7, 18, 0.9);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-default);
  position: relative;
}

.terminal-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(16, 185, 129, 0.5),
    transparent
  );
}

.terminal-prompt {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--neon-green);
}

.terminal-input {
  background: transparent;
  border: none;
  color: var(--text-body);
  font-family: var(--font-mono);
  font-size: 14px;
}
```

---

## Animation & Motion

### Timing Functions

```css
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
```

### Standard Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions |
| `--duration-normal` | 300ms | Standard transitions |
| `--duration-slow` | 500ms | Complex animations |

### Common Animations

**Pulse (for processing states):**
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse-slow 4s var(--ease-in-out) infinite;
```

**Glow pulse (for active indicators):**
```css
.glow-indicator {
  animation: pulse 2s var(--ease-in-out) infinite;
  box-shadow: 0 0 10px var(--neon-green);
}
```

---

## Background Treatments

### Grid Pattern

Subtle grid for depth. Use sparingly.

```css
.bg-grid {
  background-image: 
    linear-gradient(to right, var(--border-default) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border-default) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, transparent, 10%, black, 90%, transparent);
  opacity: 0.07;
}
```

### Gradient Accents

For section emphasis:
```css
.gradient-accent {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(6, 182, 212, 0.1)
  );
}
```

---

## Interaction States

### Default → Hover → Active → Focus

| State | Border | Background | Text |
|-------|--------|------------|------|
| Default | `--border-default` | `--glass` | `--text-body` |
| Hover | `--border-hover` | Slight lighten | `--text-secondary` |
| Active | `--neon-green/50` | `--neon-green/10` | `--text-primary` |
| Focus | `ring-1 --neon-green/50` | — | — |

### Card Visual State Matrix

Integration with Sprint 6 tokens:

| State | Token | Visual |
|-------|-------|--------|
| Default | — | Standard glass card |
| Inspected | `--card-ring-inspected` | `ring-2 ring-neon-cyan/50` |
| Active | `--card-bg-active` | `bg-neon-green/10 border-neon-green/30` |
| Favorite | — | Star icon filled with `--neon-amber` |

---

## Applying to Grove

### Phase 1: Token Foundation
1. Add color tokens to `globals.css`
2. Add typography tokens
3. Add spacing tokens

### Phase 2: Card System Update
1. Update `CardShell.tsx` to use new glass patterns
2. Apply status badge styling
3. Add corner accent option (configurable)

### Phase 3: Terminal Bar
1. Create `CommandDock` component
2. Wire to slash-command routing
3. Add gradient accent line

### Phase 4: Page Layouts
1. Apply `--void` background
2. Add subtle grid pattern (optional, per-page)
3. Update header/nav styling

---

## Don'ts

- **Don't overuse glow effects** — Reserve for active/processing states
- **Don't animate everything** — Motion should be meaningful
- **Don't use corner accents on every card** — Use sparingly for emphasis
- **Don't mix warm and cool accents** — Stay in the cyan/green family
- **Don't use pure white text** — Max is `#ffffff` for headlines only

---

## Reference

**Fonts to load:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Tailwind config extensions:**
```js
colors: {
  void: '#030712',
  glass: 'rgba(17, 24, 39, 0.6)',
  'neon-cyan': '#06b6d4',
  'neon-green': '#10b981',
  'neon-amber': '#f59e0b',
},
boxShadow: {
  'glow-green': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
  'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
},
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

---

*This document establishes Grove's visual language. All component styling should reference these tokens.*
