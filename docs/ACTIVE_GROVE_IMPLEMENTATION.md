# Active Grove Sprint Implementation

## Overview

Active Grove Sprint - Split layout with Tree-triggered terminal reveal.
Implemented December 2024 across Fixes #1-10.

## Architecture Summary

### State Machine

```
flowState: 'hero' → 'split' → 'collapsing' → 'unlocked'
uiMode: 'hero' | 'split'
```

| State | Description |
|-------|-------------|
| `hero` | Initial load. Terminal hidden. Seedling pulsing. Scroll locked. |
| `split` | After tree click. Terminal slides in from right. Lens picker shown. |
| `collapsing` | Lens selected. WaveformCollapse animating headline. |
| `unlocked` | Animation complete. Sections 2+ render. Scroll enabled. |

### Key Files

| File | Purpose |
|------|---------|
| `src/surface/pages/GenesisPage.tsx` | State machine, layout orchestration |
| `styles/globals.css` | Active Grove CSS section (lines ~200-350) |
| `src/surface/components/genesis/HeroHook.tsx` | Hero section with WaveformCollapse |
| `src/surface/components/genesis/ProblemStatement.tsx` | Quote carousel |
| `src/surface/components/effects/WaveformCollapse.tsx` | Typewriter animation with onComplete callback |

### CSS Architecture

| Class | Purpose |
|-------|---------|
| `.content-rail` | Left column, scrollable, transitions width on split |
| `.terminal-panel` | Right column, position:fixed, translateX for reveal |
| `.hero-container` | Viewport-fit hero section |

**Responsive breakpoints:**
- Desktop (1024px+): 50/50 split
- Tablet (768-1024px): 60/40 split
- Mobile (<768px): Bottom sheet

---

## Critical Implementation Details

> **FRAGILE - READ BEFORE MODIFYING**

### 1. Scroll Lock Mechanism

```tsx
const isNavigationLocked = flowState !== 'unlocked';

// Applied via inline style on content-rail:
style={{ ...(isNavigationLocked && { overflow: 'hidden', height: '100vh' }) }}
```

**DO NOT** rely on CSS-only scroll lock. The inline style is necessary because:
- CSS classes can be overridden by specificity
- Inline style guarantees lock in all states except 'unlocked'

### 2. WaveformCollapse Callback

```tsx
<WaveformCollapse
  text={content.headline}
  trigger={quantumTrigger}
  onComplete={onAnimationComplete}  // ← This prop name is CRITICAL
/>
```

The prop is `onComplete`, **NOT** `onAnimationComplete`. This triggers the transition from 'collapsing' to 'unlocked'. If renamed, the flow breaks silently.

### 3. useEffect Dependency for Lens Changes

```tsx
useEffect(() => {
  if (activeLens && flowState === 'split') {
    setFlowState('collapsing');
  }
}, [activeLens, flowState]); // ← BOTH dependencies required
```

Missing `flowState` causes stale closure - lens selection won't trigger collapse.

### 4. Section Gating

```tsx
{flowState === 'unlocked' && (
  <>
    {/* Sections 2-6 */}
  </>
)}
```

Sections 2+ are conditionally rendered. They don't exist in DOM until unlocked. This is intentional for:
- Performance (no hidden DOM nodes)
- Prevents scroll-peek past hero

### 5. Quote Carousel Scroll Fix

ProblemStatement uses container-level `scrollTo()` not element `scrollIntoView()`:

```tsx
// CORRECT - horizontal only
container.scrollTo({ left: scrollTarget, behavior: 'smooth' });

// WRONG - affects both axes, fights page scroll
element.scrollIntoView({ behavior: 'smooth', inline: 'center' });
```

### 6. IntersectionObserver Guards

Observers for staggered reveal only run in full mode:

```tsx
useEffect(() => {
  if (variant === 'compressed') return; // Skip in split mode
  // ... observer setup
}, [quotes, trigger, isCompressed]);
```

Otherwise they fire during carousel scroll and cause jumps.

### 7. Terminal Header Pills

The CSS rule `.terminal-panel .flex-1` was setting `flex-direction: column`, breaking header pills layout. Fixed by:
- Removing `flex-direction: column` from that rule
- Adding explicit `flex-row` to pills container

### 8. Header Height Variable

```css
:root {
  --header-height: 56px;
}
```

Used by hero-container and section calculations. Must match AudioPlayer actual height.

---

## Known Issues (Post-Production Investigation)

### 1. Reload State Inconsistency

- Sometimes Terminal appears visible on reload
- May be browser CSS cache or React hydration timing
- **Test:** Hard refresh (Ctrl+Shift+R) vs soft refresh

### 2. Section Content Sizing

- Some sections may overflow viewport in split mode
- Quote cards may need responsive adjustments
- Typography `clamp()` values may need tuning per section

### 3. Hero Vertical Rhythm

- Tree positioning with `justify-content: space-between` may push headline too high
- May need section-specific padding adjustments

### 4. Mobile Bottom Sheet

- Not fully tested in this sprint
- Sheet height, scroll behavior, gesture handling TBD

---

## Testing Checklist

1. [ ] Fresh load: Terminal hidden, hero fills viewport, can't scroll
2. [ ] Click seedling: Terminal slides in, lens picker visible
3. [ ] Select lens: Headline morphs with typewriter effect
4. [ ] After morph: Sections unlock, auto-scroll to Section 2
5. [ ] Manual scroll: Works without fighting/jumping
6. [ ] Quote carousel: Horizontal scroll only, no page jumps
7. [ ] Responsive: Test at 1400px, 900px, 600px widths

---

## Commit History (This Sprint)

| Commit | Description |
|--------|-------------|
| Fix #5 | Real TerminalHeader + Auto-carousel quotes |
| Fix #7 | Fixed Terminal panel (position:fixed), scroll progression |
| Fix #8 | Header width + Hero centering in split mode |
| Fix #9 | Flow progression, section centering, quote visibility |
| Fix #9b | Header pills layout + carousel scroll lock |
| Fix #10 | Header pills flex-nowrap, CSS specificity fix |
| Layout | Section fixed height + anchored sapling |
| Deps | Missing flowState dependency fix |
| Load | Initial page load state fixes |
| Polish | CSS typography scaling, hero layout |

---

## Future Considerations

1. **SectionFrame Component** - Consider extracting if pattern stabilizes across sections
2. **scroll-snap** - Could replace manual scroll but risks fighting with lock
3. **Per-section height overrides** - May need for content-heavy sections
4. **Mobile gestures** - Swipe to dismiss Terminal sheet
5. **Animation polish** - Stagger section reveals, parallax effects
