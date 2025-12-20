# Grove v0.10 Mini-Sprint Specification

## Overview
Polish sprint addressing copy edits, bug fixes, visual consistency, and foundational A/B testing + Genesis Dashboard infrastructure.

## Goals
1. Fix version number (v2.4 → v0.09)
2. Apply copy edits to Sections 0, 1, 4
3. Replace Elena vignette with research-grounded content + live Nature paper link
4. Restyle dark carousel slides to paper/orange theme
5. Fix "Generate Technical Routing Spec" Terminal link bug
6. Add slider attention animation
7. Build A/B testing infrastructure for hooks + CTAs
8. Create Genesis Dashboard in Foundation (`/foundation/genesis`)

## Non-Goals
- No new sections or major layout changes
- No backend infrastructure (A/B uses localStorage for now)
- No real-time analytics pipeline (stubbed metrics)

## Current State Inventory

### Version Numbers (4 occurrences)
- `App.tsx:364` — Hero section
- `App.tsx:663` — Footer
- `SurfacePage.tsx:93` — Hero section
- `SurfacePage.tsx:371` — Footer

### Copy Locations
- Section 0 (Hero): `App.tsx:376-380`
- Section 1 (Ratchet): `App.tsx:411-427`
- Section 4 (Difference): `App.tsx:572-590` (approximate)
- Elena Vignette: Within Section 4 "Documented Breakthroughs"

### Carousel Dark Slides
- `WhatIsGroveCarousel.tsx` — slides with `theme: 'dark'` (indices 2, 3)

### Terminal Link Bug
- `ArchitectureDiagram.tsx:106-111` — button calling `onArtifactRequest`
- `App.tsx:64-83` — `handleArtifactRequest` using legacy `generateArtifact`

### Foundation Structure
- Route: `src/router/routes.tsx`
- Nav: `src/foundation/layout/NavSidebar.tsx`
- Consoles: `src/foundation/consoles/`

## Acceptance Criteria

### AC-1: Version Display
- [ ] All 4 version strings show "Research Preview v0.09"

### AC-2: Copy Edits
- [ ] Section 0 hedge language applied
- [ ] Section 1 Ratchet body copy replaced
- [ ] Section 4 Difference intro replaced

### AC-3: Elena Vignette
- [ ] Water/aquifer vignette replaced with reward-discovery narrative
- [ ] Live hyperlink to Nature paper (s41467-025-66009-y)
- [ ] Attribution line with author citation

### AC-4: Carousel Styling
- [ ] "Horses" and "Question" slides use paper background
- [ ] Orange accents replace dark blue elements
- [ ] Text uses ink color, not white
- [ ] Sufficient contrast maintained (WCAG AA)

### AC-5: Terminal Link
- [ ] "Generate Technical Routing Spec" opens Terminal
- [ ] Query routes through chat service (not legacy generateArtifact)
- [ ] No console errors on click

### AC-6: Slider Animation
- [ ] Economics slider has attention-getting animation on first view
- [ ] Animation stops after user interaction

### AC-7: A/B Infrastructure
- [ ] `HookVariant` type defined in schema
- [ ] `selectVariant` utility created
- [ ] Telemetry captures variantId on hook clicks
- [ ] At least 2 variants defined per section hook

### AC-8: Genesis Dashboard
- [ ] Route `/foundation/genesis` accessible
- [ ] Nav sidebar shows Genesis entry
- [ ] Core metrics display (sessions, hook rate, journeys)
- [ ] Variant performance table (stubbed)
