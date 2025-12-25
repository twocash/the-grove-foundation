# Repository Audit — Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Date:** 2025-12-25  
**Auditor:** Claude (Foundation Loop)

---

## Executive Summary

The codebase has **functional infrastructure** for the three-column workspace pattern but **visual design is underdeveloped**. Token system exists but uses flat light-mode defaults. Components use basic Tailwind classes without the glass aesthetic documented in DESIGN_SYSTEM.md.

**Key Finding:** The gap is not architectural—it's purely visual. No new systems needed, only CSS transformation and component styling updates.

---

## File Inventory

### Core CSS
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `styles/globals.css` | 765 | ⚠️ Needs Extension | Has tokens but missing glass treatment |

### Layout Components
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `src/workspace/GroveWorkspace.tsx` | 48 | ✅ Good | Three-column structure correct |
| `src/workspace/NavigationSidebar.tsx` | 216 | ⚠️ Needs Styling | Uses basic Tailwind, no glass |
| `src/workspace/Inspector.tsx` | ~100 | ⚠️ Needs Styling | Wrapper, routes to inspectors |
| `src/shared/layout/InspectorPanel.tsx` | 99 | ⚠️ Needs Styling | Has structure, needs glass treatment |

### Object Grid Components
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `src/explore/LensPicker.tsx` | 529 | ⚠️ Needs Styling | Large file, has accent system |
| `src/explore/JourneyList.tsx` | ~200 | ⚠️ Needs Styling | Similar pattern |
| `src/explore/NodeGrid.tsx` | ~150 | ⚠️ Needs Styling | Similar pattern |

### Card Components
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `src/surface/components/GroveObjectCard/CardShell.tsx` | 94 | ⚠️ Needs Styling | Uses --card-* tokens, no glass |

### Inspector Components
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `src/shared/inspector/ObjectInspector.tsx` | 161 | ⚠️ Needs Styling | Has JSON renderer, needs glass |
| `src/explore/LensInspector.tsx` | ~80 | ✅ Good | Uses ObjectInspector |
| `src/explore/JourneyInspector.tsx` | ~80 | ✅ Good | Uses ObjectInspector |

### Shared UI (New Components Needed)
| File | Status | Purpose |
|------|--------|---------|
| `src/shared/ui/StatusBadge.tsx` | 🆕 Create | Reusable monospace badge |
| `src/shared/ui/GlassPanel.tsx` | 🆕 Create | Base glass container |
| `src/shared/ui/ControlBar.tsx` | 🆕 Create | Search/filter strip |

---

## Token Analysis

### Currently Defined

**Foundation Tokens (Good)**
```css
--color-obsidian: #0D0D0D
--color-holo-cyan: #00D4FF
--color-holo-lime: #00FF88
--font-mono: 'JetBrains Mono', monospace
```

**Card Tokens (Exist but wrong values)**
```css
--card-border-default: #e2e8f0  /* Light mode! Should be dark */
--card-border-inspected: #22d3ee
--card-border-active: rgba(16, 185, 129, 0.5)
```

### Missing Tokens

**Quantum Glass Core**
```css
--glass-void: #030712           /* Missing: deep background */
--glass-panel: rgba(17, 24, 39, 0.6)  /* Missing: blur panel */
--glass-border: #1e293b         /* Missing: subtle border */
--glass-border-hover: #334155   /* Missing: hover border */
```

**Glow Effects**
```css
--glow-green: ...               /* Missing */
--glow-cyan: ...                /* Missing */
--glow-ambient: ...             /* Missing */
```

**Motion**
```css
--ease-out-expo: ...            /* Missing */
--duration-fast: ...            /* Missing */
--duration-normal: ...          /* Missing */
```

---

## Component State Analysis

### CardShell Current Implementation
```tsx
// Current - Basic
const stateClasses = isInspected
  ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
  : isActive
    ? 'bg-[var(--card-bg-active)] border-[var(--card-border-active)]'
    : 'border-[var(--card-border-default)] hover:border-primary/30';
```

**Missing:**
- `backdrop-filter: blur()`
- `transform: translateY(-2px)` on hover
- Corner accents (::before, ::after)
- Glass gradient backgrounds
- Box-shadow glows

### NavigationSidebar Current
```tsx
// Current - Basic Tailwind
<aside className="w-60 flex flex-col bg-[var(--grove-surface)] dark:bg-background-dark/50 border-r">
```

**Missing:**
- `--glass-solid` background
- Section title styling (monospace, uppercase)
- Active state with green border-left
- Proper dark styling

### InspectorPanel Current
```tsx
// Current - Basic
<div className="h-14 flex items-center ... border-b border-border-light dark:border-border-dark">
```

**Missing:**
- Glass solid background
- Section headers with monospace
- Dark mode proper styling
- Action buttons with glow

---

## Pattern Compliance Check

| Pattern | Status | Notes |
|---------|--------|-------|
| Pattern 4: Token Namespaces | ⚠️ Extend | Add `--glass-*` namespace |
| Pattern 6: Component Composition | ✅ Good | Using shared components |
| Pattern 7: Object Model | ✅ Good | GroveObject system working |
| Anti-Pattern 1: Parallel System | ✅ Safe | Extending, not duplicating |

---

## Risk Assessment

### Low Risk
- Token additions (additive, no breaking changes)
- New utility classes (additive)
- New shared components (StatusBadge, GlassPanel, ControlBar)

### Medium Risk
- CardShell styling changes (many consumers)
- InspectorPanel styling changes (used everywhere)

### Mitigation
- All changes are CSS-level, not structural
- Existing class names preserved, new classes added
- Test with visual review at each phase

---

## Dependencies

### Fonts
- JetBrains Mono: Already in `@theme` ✅
- Inter: Already loaded ✅

### Browser Support
- `backdrop-filter`: Supported in all modern browsers
- CSS Custom Properties: Full support
- `:has()` selector: Not using (Safari concerns)

---

## Recommended Approach

1. **Phase 1:** Add all Quantum Glass tokens to globals.css
2. **Phase 2:** Create new shared UI components (StatusBadge, GlassPanel)
3. **Phase 3:** Apply glass treatment to layout (background, nav, inspector)
4. **Phase 4:** Transform CardShell and all card consumers
5. **Phase 5:** Polish and verify consistency

**Estimated Scope:**
- ~300 lines new/modified CSS
- ~100 lines new StatusBadge component
- ~50 lines new GlassPanel component
- ~150 lines CardShell modifications
- ~200 lines inspector/nav modifications
- **Total: ~800 lines across ~12 files**

---

*Audit complete. Ready for SPEC.md.*
