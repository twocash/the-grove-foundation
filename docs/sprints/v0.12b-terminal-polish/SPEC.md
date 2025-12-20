# v0.12b Terminal Polish — Specification

## Overview
Polish sprint addressing visual inconsistencies and UX improvements identified in v0.12 testing. Focus areas: animation consistency, CTA styling, scroll indicators, CognitiveBridge warmth, and ProductReveal animation fix.

## Goals
1. Unify animation timing across Terminal components (drawer + pill)
2. Remove right arrows from green CTA buttons
3. Replace generic bounce scroll indicators with organic ASCII→seedling animation
4. Add typing animation and warm copy to CognitiveBridge
5. Fix "YOUR" animation in ProductReveal (eliminate layout gap)

## Non-Goals
- No changes to Terminal state management
- No backend/API changes
- No new feature flags
- No changes to LensPicker or CustomLensWizard
- No content changes outside specified copy

## Current State Inventory

### Animation Timing
- **Drawer:** `components/Terminal.tsx:906` — `duration-500 ease-in-out`
- **Pill:** `styles/globals.css:166-171` — `300ms cubic-bezier(0.32, 0.72, 0, 1)`
- **Issue:** Inconsistent feel, drawer feels sluggish vs spring-like pill

### CTA Arrows
- **Locations:** 6 instances across Genesis components
- **Pattern:** `<svg>...<path d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>`
- **Issue:** Arrows feel like "next step" affordance, not needed for action buttons

### Scroll Indicators
- **Locations:** 5 instances across Genesis components
- **Current:** SVG chevron with `animate-bounce`
- **Issue:** Generic, Bootstrap-like, not on-brand

### CognitiveBridge Copy
- **Location:** `components/Terminal/CognitiveBridge.tsx:95-100`
- **Current:** "This connects to the **{title}** sequence. To fully map this dependency, I can switch to a structured path."
- **Issue:** Stiff, corporate, not warm

### ProductReveal YOUR Animation
- **Location:** `src/surface/components/genesis/ProductReveal.tsx:108-158`
- **Current:** Fixed-width container (w-32/w-40/w-48), THE knocked away, YOUR rises
- **Issue:** Layout gap between YOUR and GROVE after animation

## Target State

### Animation Timing
- Drawer uses same spring curve as pill: `cubic-bezier(0.32, 0.72, 0, 1)`
- Duration unified at 300ms for snappy feel

### CTA Buttons
- Remove arrow SVGs, keep text only
- Example: "See it in action" (no →)

### Scroll Indicators
- New `ScrollIndicator` component with ASCII→seedling animation
- Phase 1: Random ASCII characters float/drift toward center
- Phase 2: Characters converge, fade
- Phase 3: Seedling SVG blooms at center
- Phase 4: Gentle bob animation (continuous)
- Lottie animation for smooth execution

### CognitiveBridge
- Typing animation for invitation text
- Warm, conversational copy:
  > "I'd love to take you on a guided journey about **{title}** — we'll explore {topic1}, {topic2}, and {topic3}. Or keep asking anything. I'm here to help!"
- Card styling remains (it's effective)

### ProductReveal YOUR Animation
- Replace knock-away with simple fade transition
- THE fades out, YOUR fades in (same position)
- No fixed-width container, no layout shifting
- Clean, reliable, maintains emotional beat

## Acceptance Criteria

### Functional
- [ ] AC-1: Bold text in AI responses is clickable and fires telemetry (verify existing)
- [ ] AC-2: CognitiveBridge displays typing animation before showing full content
- [ ] AC-3: Scroll indicators show ASCII→seedling animation sequence
- [ ] AC-4: "YOUR" appears via fade without layout shift

### Visual
- [ ] AC-5: No right arrows on any green CTA buttons
- [ ] AC-6: Drawer open/close feels as snappy as pill minimize
- [ ] AC-7: Scroll indicator animation loops smoothly
- [ ] AC-8: CognitiveBridge text types at readable pace (~30ms/char)

### Technical
- [ ] AC-9: Build passes with no errors
- [ ] AC-10: No console errors in browser
- [ ] AC-11: lottie-react added to dependencies (if Lottie approach used)
- [ ] AC-12: 60fps animation performance

### Mobile
- [ ] AC-13: Scroll indicators work on touch devices
- [ ] AC-14: CognitiveBridge readable on mobile viewport

## Dependencies
- Lottie animation file for ASCII→seedling (to be created or sourced)
- `lottie-react` package (~40kb gzipped)

## Risks
- **Lottie complexity:** If custom animation proves too complex, fallback to CSS-only "rain to bloom" effect
- **Typing animation timing:** May need tuning based on copy length
