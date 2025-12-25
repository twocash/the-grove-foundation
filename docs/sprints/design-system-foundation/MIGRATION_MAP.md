# Migration Map: Design System Foundation

**Sprint:** design-system-foundation  
**Estimated Changes:** ~145 lines across 3 files

---

## Migration Order

```
1. globals.css (add tokens + utility classes)
       ↓
2. layout.tsx (ensure fonts load)
       ↓
3. CardShell.tsx (apply new styling)
```

---

## 1. MODIFY: globals.css

**Path:** `styles/globals.css`

**Add after the existing card component tokens section:**

```css
/* ============================================================
   GROVE GLASS DESIGN SYSTEM
   Sprint: design-system-foundation
   
   Quantum Glass UI - Dark, layered, alive.
   Reference: docs/design-system/DESIGN_SYSTEM.md
   ============================================================ */

:root {
  /* === Backgrounds === */
  --grove-void: #030712;
  --grove-glass: rgba(17, 24, 39, 0.6);
  --grove-glass-solid: #111827;
  --grove-glass-panel: rgba(15, 23, 42, 0.2);
  
  /* === Neon Accents === */
  --grove-neon-green: #10b981;
  --grove-neon-cyan: #06b6d4;
  --grove-neon-amber: #f59e0b;
  
  /* === Text Hierarchy (Slate Scale) === */
  --grove-text-primary: #ffffff;
  --grove-text-secondary: #e2e8f0;
  --grove-text-body: #cbd5e1;
  --grove-text-muted: #94a3b8;
  --grove-text-subtle: #64748b;
  --grove-text-faint: #475569;
  
  /* === Borders === */
  --grove-border: #1e293b;
  --grove-border-hover: #334155;
  --grove-border-accent: rgba(16, 185, 129, 0.3);
  
  /* === Glows === */
  --grove-glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
  --grove-glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);
  
  /* === Animation === */
  --grove-transition-fast: 150ms;
  --grove-transition-normal: 300ms;
  --grove-transition-slow: 500ms;
  --grove-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --grove-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============================================================
   GROVE GLASS PANELS
   ============================================================ */

/* Base glass panel with blur */
.grove-panel {
  background: var(--grove-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--grove-border);
  border-radius: 8px;
}

/* Solid variant (no blur, better performance) */
.grove-panel-solid {
  background: var(--grove-glass-solid);
  border: 1px solid var(--grove-border);
  border-radius: 8px;
}

/* Interactive panel - hovers lift slightly */
.grove-panel-interactive {
  background: var(--grove-glass-panel);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid var(--grove-border);
  border-radius: 8px;
  transition: 
    border-color var(--grove-transition-normal) var(--grove-ease),
    transform var(--grove-transition-normal) var(--grove-ease),
    box-shadow var(--grove-transition-normal) var(--grove-ease);
}

.grove-panel-interactive:hover {
  border-color: var(--grove-border-hover);
  transform: translateY(-2px);
}

/* Active state for panels */
.grove-panel-active {
  border-color: var(--grove-border-accent);
  background: rgba(16, 185, 129, 0.05);
}

/* ============================================================
   GROVE STATUS BADGES
   ============================================================ */

.grove-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 4px;
  white-space: nowrap;
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

/* ============================================================
   GROVE BACKGROUNDS
   ============================================================ */

/* Void background - deepest layer */
.grove-bg-void {
  background-color: var(--grove-void);
}

/* Subtle grid pattern overlay */
.grove-grid-bg {
  position: relative;
}

.grove-grid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, var(--grove-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grove-border) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, transparent, 10%, black, 90%, transparent);
  opacity: 0.07;
  pointer-events: none;
}

/* ============================================================
   GROVE GLOWS
   ============================================================ */

.grove-glow-green {
  box-shadow: var(--grove-glow-green);
}

.grove-glow-cyan {
  box-shadow: var(--grove-glow-cyan);
}

/* Pulsing glow animation */
.grove-glow-pulse {
  animation: grove-pulse 2s var(--grove-ease) infinite;
}

@keyframes grove-pulse {
  0%, 100% { 
    opacity: 1;
    box-shadow: var(--grove-glow-green);
  }
  50% { 
    opacity: 0.7;
    box-shadow: 0 0 30px -5px rgba(16, 185, 129, 0.6);
  }
}

/* ============================================================
   GROVE SCROLLBAR (Dark aesthetic)
   ============================================================ */

.grove-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.grove-scrollbar::-webkit-scrollbar-track {
  background: var(--grove-void);
}

.grove-scrollbar::-webkit-scrollbar-thumb {
  background: var(--grove-border);
  border-radius: 3px;
}

.grove-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--grove-border-hover);
}

/* ============================================================
   GROVE TYPOGRAPHY UTILITIES
   ============================================================ */

.grove-text-primary { color: var(--grove-text-primary); }
.grove-text-secondary { color: var(--grove-text-secondary); }
.grove-text-body { color: var(--grove-text-body); }
.grove-text-muted { color: var(--grove-text-muted); }
.grove-text-subtle { color: var(--grove-text-subtle); }
.grove-text-faint { color: var(--grove-text-faint); }

/* Mono text (for system labels, IDs, code) */
.grove-mono {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Neon text colors */
.grove-text-neon-green { color: var(--grove-neon-green); }
.grove-text-neon-cyan { color: var(--grove-neon-cyan); }
.grove-text-neon-amber { color: var(--grove-neon-amber); }
```

---

## 2. VERIFY: Font Loading

**Path:** Check `src/app/layout.tsx` or `pages/_app.tsx`

The fonts `Inter` and `JetBrains Mono` should already be loaded. Verify:

**If using Next.js font system (preferred):**
```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// In the component:
<html className={`${inter.variable} ${jetbrainsMono.variable}`}>
```

**If using link tags (check index.html or _document.tsx):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 3. MODIFY: CardShell.tsx

**Path:** `src/surface/components/GroveObjectCard/CardShell.tsx`

**Update the className construction to use Grove Glass styling:**

Find the main container div and update:

**Before (likely):**
```tsx
<div
  className={cn(
    'border rounded-lg p-4 transition-all cursor-pointer',
    'bg-white dark:bg-slate-800',
    isActive && 'bg-[var(--card-bg-active)] border-[var(--card-border-active)]',
    isInspected && 'ring-2 ring-[var(--card-ring-color)]',
    className
  )}
  onClick={onSelect}
>
```

**After:**
```tsx
<div
  className={cn(
    // Base panel styling
    'grove-panel-interactive p-6 cursor-pointer',
    
    // Active state
    isActive && 'grove-panel-active',
    
    // Inspected state (ring)
    isInspected && 'ring-2 ring-[var(--grove-neon-cyan)]/50',
    
    className
  )}
  onClick={onSelect}
>
```

**Also update the header section for proper typography:**

```tsx
{/* Title */}
<h3 className="text-lg font-medium grove-text-primary group-hover:grove-text-neon-green transition-colors">
  {object.meta.title}
</h3>

{/* ID badge (if showing) */}
{showId && (
  <span className="grove-mono grove-text-faint">
    {object.meta.id.slice(0, 8)}
  </span>
)}
```

---

## 4. OPTIONAL: Add Status Badge to CardShell

If CardShell doesn't already show status, add:

```tsx
{/* Status badge */}
{object.meta.status && (
  <span className={cn(
    'grove-badge',
    object.meta.status === 'active' && 'grove-badge-active',
    object.meta.status === 'draft' && 'grove-badge-draft',
    object.meta.status === 'archived' && 'grove-badge-archived',
  )}>
    {object.meta.status}
  </span>
)}
```

---

## Verification Checklist

After migration:

- [ ] `pnpm build` succeeds
- [ ] Load a page with GroveObjectCard - cards have glass effect
- [ ] Hover over card - lifts slightly, border lightens
- [ ] Status badges show with correct colors (green/cyan/amber/gray)
- [ ] Fonts render correctly (Inter for body, JetBrains for mono)
- [ ] No visual regressions on other pages

---

## Commit Sequence

```
1. feat(design): add Grove Glass token system
2. feat(design): add glass panel and badge utility classes
3. feat(components): update CardShell to use Grove Glass styling
```

---

## Rollback Plan

If issues arise:

1. CardShell can revert to original classes
2. Token additions don't break existing code (additive)
3. Utility classes are opt-in (no forced migration)

---

*Additive changes. Surfaces opt-in to new styling.*
