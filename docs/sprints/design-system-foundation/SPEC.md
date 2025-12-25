# Specification: Design System Foundation

**Sprint:** design-system-foundation  
**Time Budget:** 6-8 hours

---

## Current State

The codebase has **multiple overlapping token systems**:

| System | Location | Purpose |
|--------|----------|---------|
| Workspace tokens | `:root` | Light/dark general |
| Surface tokens (Village) | `@theme` | Paper/ink aesthetic |
| Foundation tokens | `@theme` | Holodeck/control plane |
| Card tokens | `:root` | Sprint 6 card states |
| Chat tokens | `:root` | Terminal chat styling |

These evolved organically. The result: inconsistent visual language.

---

## Goal

Introduce a **unified "Grove Glass" aesthetic** extracted from the Trellis mock, while preserving backward compatibility.

**Not replacing** existing tokens—**augmenting** with a cohesive layer that surfaces can adopt.

---

## Requirements

### REQ-1: Add Grove Glass Token Layer

New token namespace for the Quantum Glass aesthetic:

```css
/* Grove Glass - Quantum Glass UI tokens */
:root {
  /* Backgrounds */
  --grove-void: #030712;
  --grove-glass: rgba(17, 24, 39, 0.6);
  --grove-glass-solid: #111827;
  --grove-glass-panel: rgba(15, 23, 42, 0.2);
  
  /* Neon Accents */
  --grove-neon-green: #10b981;
  --grove-neon-cyan: #06b6d4;
  --grove-neon-amber: #f59e0b;
  
  /* Text (slate scale) */
  --grove-text-primary: #ffffff;
  --grove-text-secondary: #e2e8f0;
  --grove-text-body: #cbd5e1;
  --grove-text-muted: #94a3b8;
  --grove-text-subtle: #64748b;
  --grove-text-faint: #475569;
  
  /* Borders */
  --grove-border: #1e293b;
  --grove-border-hover: #334155;
  --grove-border-accent: rgba(16, 185, 129, 0.3);
  
  /* Glows */
  --grove-glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
  --grove-glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);
  
  /* Transitions */
  --grove-transition-fast: 150ms;
  --grove-transition-normal: 300ms;
  --grove-transition-slow: 500ms;
  --grove-ease: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

### REQ-2: Glass Panel Utility Classes

Reusable glass panel patterns:

```css
/* Base glass panel */
.grove-panel {
  background: var(--grove-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--grove-border);
  border-radius: 8px;
}

/* Solid variant (no blur) */
.grove-panel-solid {
  background: var(--grove-glass-solid);
  border: 1px solid var(--grove-border);
  border-radius: 8px;
}

/* Interactive panel */
.grove-panel-interactive {
  background: var(--grove-glass-panel);
  backdrop-filter: blur(4px);
  border: 1px solid var(--grove-border);
  transition: all var(--grove-transition-normal) var(--grove-ease);
}

.grove-panel-interactive:hover {
  border-color: var(--grove-border-hover);
  transform: translateY(-2px);
}
```

---

### REQ-3: Status Badge Components

Semantic badges for object states:

```css
.grove-badge {
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 4px;
}

.grove-badge-active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--grove-neon-green);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.grove-badge-processing {
  background: rgba(6, 182, 212, 0.1);
  color: var(--grove-neon-cyan);
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.grove-badge-draft {
  background: rgba(245, 158, 11, 0.1);
  color: var(--grove-neon-amber);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.grove-badge-archived {
  background: var(--grove-glass-solid);
  color: var(--grove-text-muted);
  border: 1px solid var(--grove-border);
}
```

---

### REQ-4: Update CardShell to Use Glass Tokens

Modify `CardShell.tsx` to apply the new styling:

**Before:**
```tsx
className={cn(
  'border rounded-lg p-4 transition-all',
  isActive && 'bg-[var(--card-bg-active)] border-[var(--card-border-active)]',
  isInspected && 'ring-2 ring-[var(--card-ring-color)]'
)}
```

**After:**
```tsx
className={cn(
  'grove-panel-interactive rounded-lg p-6 transition-all',
  isActive && 'border-[var(--grove-border-accent)] bg-[rgba(16,185,129,0.05)]',
  isInspected && 'ring-2 ring-[var(--grove-neon-cyan)]/50'
)}
```

---

### REQ-5: Grid Background Pattern

Optional subtle grid for depth:

```css
.grove-grid-bg {
  background-image: 
    linear-gradient(to right, var(--grove-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grove-border) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, transparent, 10%, black, 90%, transparent);
  opacity: 0.07;
}
```

---

### REQ-6: Font Loading

Ensure Inter and JetBrains Mono load properly.

**In `layout.tsx` or equivalent:**
```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

Or via `<link>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Scope Boundaries

### In Scope
- Token additions to globals.css
- Utility classes for panels, badges
- CardShell styling update
- Font loading verification

### Out of Scope (Future Sprints)
- Terminal/Command Dock component
- Left navigation redesign
- Page layout restructuring
- Light mode refinement

---

## Acceptance Criteria

- [ ] Grove Glass tokens exist in `globals.css`
- [ ] `.grove-panel` class produces glass effect
- [ ] Status badges render with correct colors
- [ ] `CardShell` uses new panel styling
- [ ] Fonts load (Inter, JetBrains Mono)
- [ ] No visual regressions on existing pages
- [ ] Build passes

---

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `styles/globals.css` | ADD tokens + utilities | ~120 |
| `src/surface/components/GroveObjectCard/CardShell.tsx` | MODIFY | ~15 |
| `src/app/layout.tsx` or `_document.tsx` | MODIFY (fonts) | ~10 |

**Total:** ~145 lines

---

## Backward Compatibility

- Existing token namespaces preserved
- Components not using new classes continue to work
- Gradual migration: surfaces opt-in to new styling

---

*Augmentation, not replacement. The glass layer sits alongside existing tokens.*
