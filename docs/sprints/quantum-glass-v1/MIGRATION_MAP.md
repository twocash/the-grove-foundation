# MIGRATION MAP: Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Date:** 2025-12-25

---

## Overview

This map details the exact changes to each file, in order. Each phase can be committed and tested independently.

---

## Phase 1: Token Foundation

### File: `styles/globals.css`

**Location:** After line ~545 (after existing card tokens)

**Add:**

```css
/* ============================================
   QUANTUM GLASS DESIGN SYSTEM
   Sprint: quantum-glass-v1
   
   Usage:
   - .glass-panel for blur containers
   - .glass-card for interactive cards
   - data-selected/data-active for states
   ============================================ */

:root {
  /* Quantum Glass Backgrounds */
  --glass-void: #030712;
  --glass-panel: rgba(17, 24, 39, 0.6);
  --glass-solid: #111827;
  --glass-elevated: rgba(30, 41, 59, 0.4);

  /* Quantum Glass Borders */
  --glass-border: #1e293b;
  --glass-border-hover: #334155;
  --glass-border-active: rgba(16, 185, 129, 0.5);
  --glass-border-selected: rgba(6, 182, 212, 0.5);

  /* Neon Accent Colors */
  --neon-green: #10b981;
  --neon-cyan: #06b6d4;
  --neon-amber: #f59e0b;
  --neon-violet: #8b5cf6;

  /* Quantum Glass Text Scale */
  --glass-text-primary: #ffffff;
  --glass-text-secondary: #e2e8f0;
  --glass-text-body: #cbd5e1;
  --glass-text-muted: #94a3b8;
  --glass-text-subtle: #64748b;
  --glass-text-faint: #475569;

  /* Glow Effects */
  --glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
  --glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);
  --glow-ambient: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}

/* Glass Panel - Blur container */
.glass-panel {
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
}

@supports (backdrop-filter: blur(12px)) {
  .glass-panel {
    background: var(--glass-panel);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
}

/* Glass Panel Solid - No blur */
.glass-panel-solid {
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
}

/* Glass Card - Interactive */
.glass-card {
  position: relative;
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  transition: all var(--duration-normal) var(--ease-out-expo);
}

@supports (backdrop-filter: blur(8px)) {
  .glass-card {
    background: var(--glass-panel);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.glass-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}

.glass-card[data-selected="true"] {
  border-color: var(--glass-border-selected);
  box-shadow: 
    0 0 0 1px var(--glass-border-selected),
    var(--glow-cyan);
}

.glass-card[data-active="true"] {
  border-color: var(--glass-border-active);
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    var(--glass-panel)
  );
}

.glass-card[data-active="true"][data-selected="true"] {
  border-color: var(--neon-green);
  box-shadow: 
    0 0 0 1px var(--neon-green),
    var(--glow-green);
}

/* Corner Accents */
.glass-card::before,
.glass-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1px solid var(--glass-border);
  transition: border-color var(--duration-normal);
  pointer-events: none;
}

.glass-card::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-radius: 12px 0 0 0;
}

.glass-card::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  border-radius: 0 0 12px 0;
}

.glass-card:hover::before,
.glass-card:hover::after {
  border-color: var(--neon-cyan);
}

.glass-card[data-active="true"]::before,
.glass-card[data-active="true"]::after {
  border-color: var(--neon-green);
}

/* Glass Viewport - Background with grid */
.glass-viewport {
  background: var(--glass-void);
  position: relative;
}

.glass-viewport::before {
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

/* Hover lift utility */
.hover-lift {
  transition: transform var(--duration-normal) var(--ease-out-expo),
              box-shadow var(--duration-normal) var(--ease-out-expo);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-ambient);
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--font-mono);
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
  animation: badge-pulse 2s ease-in-out infinite;
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

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Animation utilities */
@keyframes fade-up {
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
  animation: fade-up var(--duration-normal) var(--ease-out-expo);
}

@keyframes slide-in-right {
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
  animation: slide-in-right var(--duration-normal) var(--ease-out-expo);
}

/* Glass text utilities */
.glass-text-primary { color: var(--glass-text-primary); }
.glass-text-secondary { color: var(--glass-text-secondary); }
.glass-text-body { color: var(--glass-text-body); }
.glass-text-muted { color: var(--glass-text-muted); }
.glass-text-subtle { color: var(--glass-text-subtle); }

/* Glass section header */
.glass-section-header {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--glass-text-subtle);
}

/* Glass nav item */
.glass-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--glass-text-muted);
  font-size: 14px;
  transition: all var(--duration-fast);
  border-left: 2px solid transparent;
  cursor: pointer;
}

.glass-nav-item:hover {
  background: var(--glass-elevated);
  color: var(--glass-text-secondary);
}

.glass-nav-item[data-active="true"] {
  background: rgba(16, 185, 129, 0.1);
  color: var(--neon-green);
  border-left-color: var(--neon-green);
}
```

**Lines Added:** ~220

---

## Phase 2: Workspace Background

### File: `src/workspace/GroveWorkspace.tsx`

**Current (line 34):**
```tsx
<div className="grove-workspace flex flex-col h-screen bg-[var(--grove-bg)] text-[var(--grove-text)]">
```

**Replace with:**
```tsx
<div className="grove-workspace glass-viewport flex flex-col h-screen text-[var(--glass-text-body)]">
```

---

## Phase 3: Navigation Sidebar

### File: `src/workspace/NavigationSidebar.tsx`

**Current (line 179-180):**
```tsx
<aside className="w-60 flex flex-col bg-[var(--grove-surface)] dark:bg-background-dark/50 border-r border-[var(--grove-border)] flex-shrink-0">
```

**Replace with:**
```tsx
<aside className="w-60 flex flex-col glass-panel-solid border-r border-[var(--glass-border)] flex-shrink-0">
```

**Current NavItemComponent getItemClasses() (around line 106-116):**
```tsx
const getItemClasses = () => {
  if (isComingSoon) {
    return 'text-[var(--grove-text-dim)] cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800/50';
  }
  if (isActive) {
    return 'bg-stone-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium';
  }
  if (isParentOfActive) {
    return 'text-[var(--grove-text)]';
  }
  return 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800/50';
};
```

**Replace with:**
```tsx
const getItemClasses = () => {
  if (isComingSoon) {
    return 'text-[var(--glass-text-faint)] cursor-pointer hover:bg-[var(--glass-elevated)]';
  }
  if (isActive) {
    return 'bg-[rgba(16,185,129,0.1)] text-[var(--neon-green)] font-medium border-l-2 border-[var(--neon-green)]';
  }
  if (isParentOfActive) {
    return 'text-[var(--glass-text-secondary)]';
  }
  return 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]';
};
```

**Current footer (around line 197-204):**
```tsx
<div className="border-t border-[var(--grove-border)] px-4 py-3 flex items-center justify-between text-xs">
  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
```

**Replace with:**
```tsx
<div className="border-t border-[var(--glass-border)] px-4 py-3 flex items-center justify-between text-xs">
  <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
```

---

## Phase 4: CardShell

### File: `src/surface/components/GroveObjectCard/CardShell.tsx`

**Current (lines 27-31):**
```tsx
const stateClasses = isInspected
  ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
  : isActive
    ? 'bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]'
    : 'border-[var(--card-border-default)] hover:border-primary/30';
```

**Replace with:**
```tsx
// Use data attributes for CSS-driven states (glass-card class handles styling)
const dataAttributes = {
  'data-selected': isInspected ? 'true' : undefined,
  'data-active': isActive ? 'true' : undefined,
};
```

**Current article element (lines 33-40):**
```tsx
<article
  role="article"
  onClick={onClick}
  className={`
    rounded-xl border p-4 transition-all cursor-pointer
    ${stateClasses}
    ${className}
  `}
>
```

**Replace with:**
```tsx
<article
  role="article"
  onClick={onClick}
  {...dataAttributes}
  className={`
    glass-card p-5 cursor-pointer
    ${className}
  `}
>
```

**Current header styling (line 47):**
```tsx
<h3 className="font-medium text-slate-900 dark:text-slate-100">
```

**Replace with:**
```tsx
<h3 className="font-medium text-[var(--glass-text-primary)]">
```

**Current footer border (line 68):**
```tsx
<div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
```

**Replace with:**
```tsx
<div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
```

---

## Phase 5: StatusBadge Component

### File: `src/shared/ui/StatusBadge.tsx` (CREATE NEW)

```tsx
// src/shared/ui/StatusBadge.tsx
// Monospace status indicator for Quantum Glass design system

interface StatusBadgeProps {
  variant: 'active' | 'draft' | 'system';
  label?: string;
}

const variantLabels: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  system: 'System',
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const displayLabel = label || variantLabels[variant];
  
  return (
    <span className={`status-badge status-badge-${variant}`}>
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
```

### File: `src/shared/ui/index.ts` (CREATE NEW)

```ts
// src/shared/ui/index.ts
// Shared UI components barrel export

export { StatusBadge } from './StatusBadge';
```

---

## Phase 6: InspectorPanel

### File: `src/shared/layout/InspectorPanel.tsx`

**Current container (line 32):**
```tsx
<div className="flex flex-col h-full">
```

**Replace with:**
```tsx
<div className="flex flex-col h-full glass-panel-solid">
```

**Current header (lines 34-35):**
```tsx
<div className="h-14 flex items-center justify-between px-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
```

**Replace with:**
```tsx
<div className="h-14 flex items-center justify-between px-4 border-b border-[var(--glass-border)] flex-shrink-0 bg-black/20">
```

**Current title (line 44):**
```tsx
<span className="font-medium text-sm text-slate-700 dark:text-slate-200">{title}</span>
```

**Replace with:**
```tsx
<span className="font-medium text-sm text-[var(--glass-text-primary)]">{title}</span>
```

**Current subtitle (line 46):**
```tsx
<p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
```

**Replace with:**
```tsx
<p className="text-xs text-[var(--glass-text-muted)]">{subtitle}</p>
```

**Current close button (line 50-54):**
```tsx
<button
  onClick={onClose}
  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
>
```

**Replace with:**
```tsx
<button
  onClick={onClose}
  className="p-1.5 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)] rounded-lg transition-colors"
>
```

**Current actions footer (line 64):**
```tsx
<div className="p-4 border-t border-border-light dark:border-border-dark flex-shrink-0">
```

**Replace with:**
```tsx
<div className="p-4 border-t border-[var(--glass-border)] flex-shrink-0 bg-black/20">
```

**InspectorSection title (line 81):**
```tsx
<h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
```

**Replace with:**
```tsx
<h4 className="glass-section-header">
```

**InspectorDivider (line 89):**
```tsx
<div className="border-t border-border-light dark:border-border-dark" />
```

**Replace with:**
```tsx
<div className="border-t border-[var(--glass-border)]" />
```

---

## Phase 7: ObjectInspector

### File: `src/shared/inspector/ObjectInspector.tsx`

**Current copy button (lines 35-40):**
```tsx
<button
  onClick={copyToClipboard}
  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 flex items-center justify-center gap-2 transition-colors"
>
```

**Replace with:**
```tsx
<button
  onClick={copyToClipboard}
  className="w-full py-2 px-3 rounded-lg bg-[var(--glass-elevated)] hover:bg-[var(--glass-border-hover)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-secondary)] flex items-center justify-center gap-2 transition-all hover:border-[var(--neon-cyan)]"
>
```

**CollapsibleSection header button (lines 73-76):**
```tsx
<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-400">
```

**Replace with:**
```tsx
<span className="glass-section-header group-hover:text-[var(--glass-text-muted)]">
```

---

## Phase 8: Collection Views

### File: `src/explore/LensPicker.tsx`

Add import at top:
```tsx
import { StatusBadge } from '@shared/ui';
```

In LensCard component, add StatusBadge where appropriate:
```tsx
{/* After icon, before title */}
{isActive && <StatusBadge variant="active" />}
```

Update card wrapper to use glass-card pattern (apply data-selected, data-active attributes).

### Files: `src/explore/JourneyList.tsx`, `src/explore/NodeGrid.tsx`

Apply same pattern:
1. Import StatusBadge
2. Add data attributes for state
3. Use glass-card class or CardShell component

---

## Verification Checkpoints

After each phase, verify:

| Phase | Checkpoint |
|-------|------------|
| 1 | Build passes, tokens available in DevTools |
| 2 | Background is deep void with visible grid |
| 3 | Nav rail has proper dark styling, active state green |
| 4 | Cards hover-lift, show states correctly |
| 5 | StatusBadge renders with pulse animation |
| 6 | Inspector has glass styling, dark header |
| 7 | ObjectInspector button has glow on hover |
| 8 | All three views show consistent card styling |

---

*Migration map complete. Ready for DECISIONS.md.*
