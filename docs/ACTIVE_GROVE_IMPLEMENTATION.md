# Active Grove Implementation Guide

## Overview
Active Grove Sprint - Split layout with Tree-triggered terminal reveal.
Implemented December 2024 across Fixes #1-10.

## Architecture Summary

### State Machine
```
flowState: 'hero' → 'split' → 'collapsing' → 'unlocked'
uiMode: 'hero' | 'split'
```

- `hero`: Initial load. Terminal hidden. Seedling pulsing. Scroll locked.
- `split`: After tree click. Terminal slides in from right. Lens picker shown.
- `collapsing`: Lens selected. WaveformCollapse animating headline.
- `unlocked`: Animation complete. Sections 2+ render. Scroll enabled.

### Key Files
| File | Purpose |
|------|---------|
| `src/surface/pages/GenesisPage.tsx` | State machine, layout orchestration |
| `styles/globals.css` | Active Grove CSS section (lines ~200-350) |
| `src/surface/components/genesis/HeroHook.tsx` | Hero section with WaveformCollapse |
| `src/surface/components/genesis/ProblemStatement.tsx` | Quote carousel |
| `src/surface/components/effects/WaveformCollapse.tsx` | Typewriter animation with onComplete callback |

### CSS Architecture
- `.content-rail` - Left column, scrollable, transitions width on split
- `.terminal-panel` - Right column, position:fixed, translateX for reveal
- `.hero-container` - Viewport-fit hero section
- Responsive: 50/50 desktop, 60/40 tablet, bottom sheet mobile

## Critical Implementation Details (FRAGILE - READ BEFORE MODIFYING)

### 1. Scroll Lock Mechanism
```tsx
const isNavigationLocked = flowState !== 'unlocked';
// Applied via inline style on content-rail:
style={{ ...(isNavigationLocked && { overflow: 'hidden', height: '100vh' }) }}
```
DO NOT rely on CSS-only scroll lock. The inline style is necessary.

### 2. WaveformCollapse Callback
The prop is `onComplete`, NOT `onAnimationComplete`. This triggers the transition from 'collapsing' to 'unlocked'. If renamed, the flow breaks silently.

### 3. useEffect Dependency for Lens Changes
```tsx
useEffect(() => {
  if (activeLens && flowState === 'split') {
    setFlowState('collapsing');
  }
}, [activeLens, flowState]); // BOTH dependencies required
```
Missing `flowState` causes stale closure - lens selection won't trigger collapse.

### 4. Section Gating
Sections 2+ are conditionally rendered:
```tsx
{flowState === 'unlocked' && (
  <>
    {/* Sections 2-6 */}
  </>
)}
```
They don't exist in DOM until unlocked. This is intentional for performance and prevents scroll-peek.

### 5. Quote Carousel Scroll Fix
ProblemStatement uses container-level `scrollTo()` not element `scrollIntoView()`:
```tsx
container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
```
scrollIntoView affects both axes and fights with page scroll.

### 6. IntersectionObserver Guards
Observers for staggered reveal only run in full mode:
```tsx
if (variant === 'compressed') return; // Skip in split mode
```
Otherwise they fire during carousel scroll and cause jumps.

## Known Issues (Post-Sprint 1)

### 1. Reload State Inconsistency
- Users returning with existing lens get stuck in 'collapsing' state
- Root cause: useEffect fires on lens existence, not change
- **Fix planned in Sprint 2** (skip to unlocked if lens exists)

### 2. Section Content Sizing
- Some sections may overflow viewport in split mode
- Quote cards may need responsive adjustments
- Typography clamp() values may need tuning per section

### 3. Hero Vertical Rhythm
- Tree positioning with `justify-content: space-between` may push headline too high
- May need section-specific padding adjustments

### 4. Mobile Bottom Sheet
- Not fully tested in this sprint
- Sheet height, scroll behavior, gesture handling TBD

## Testing Checklist
1. Fresh load: Terminal hidden, hero fills viewport, can't scroll
2. Click seedling: Terminal slides in, lens picker visible
3. Select lens: Headline morphs with typewriter effect
4. After morph: Sections unlock, auto-scroll to Section 2
5. Manual scroll: Works without fighting/jumping
6. Quote carousel: Horizontal scroll only, no page jumps
7. Responsive: Test at 1400px, 900px, 600px widths

## Commit History (Sprint 1)
- Fix #1-6: Initial split layout, Terminal positioning
- Fix #7: Fixed Terminal panel (position:fixed)
- Fix #8: Responsive breakpoints
- Fix #9: Scroll lock, carousel horizontal-only scroll
- Fix #10: Header pills responsive layout
- Final: CSS typography scaling, hero layout

## Future Considerations
- Consider extracting SectionFrame component if pattern stabilizes
- scroll-snap could replace manual scroll but risks fighting with lock
- May need per-section height overrides for content-heavy sections
