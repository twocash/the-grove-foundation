# Sprint Stories — v0.11 Genesis Experience

## Epic 1: Infrastructure (P0)

### Story 1.1: Add Feature Flag to Schema
**File:** `data/narratives.json`
**Location:** `globalSettings.featureFlags` array
**Task:** Add new feature flag:
```json
{
  "id": "genesis-landing",
  "name": "Genesis Landing Experience",
  "description": "Show the new Jobs-style landing page instead of Classic",
  "enabled": false
}
```
**Commit:** `feat: add genesis-landing feature flag`

### Story 1.2: Create SurfaceRouter Component
**File:** Create `src/surface/pages/SurfaceRouter.tsx`
**Task:** Router that checks:
1. URL param `?experience=genesis` or `?experience=classic`
2. Feature flag from narratives schema
3. Default to classic
**Exports:** `SurfaceRouter` (default)
**Commit:** `feat: add SurfaceRouter for experience switching`

### Story 1.3: Create GenesisPage Shell
**File:** Create `src/surface/pages/GenesisPage.tsx`
**Task:** Basic page component that renders placeholder for each screen section
**Commit:** `feat: add GenesisPage shell component`

### Story 1.4: Update Route Registration
**File:** `src/router/routes.tsx`
**Task:** Replace direct `SurfacePage` import with `SurfaceRouter`
**Commit:** `feat: wire SurfaceRouter into main routes`

### Story 1.5: Verify Classic Unchanged
**Task:** Manual test that `?experience=classic` shows original experience
**No commit — verification step**

---

## Epic 2: Genesis Screens 1-2 (P0)

### Story 2.1: Create HeroHook Component
**File:** Create `src/surface/components/genesis/HeroHook.tsx`
**Task:** Full viewport hero with:
- Paper background
- "YOUR AI." headline (grove-forest, serif)
- Fade-in sequence for subtext
- Scroll indicator
**Styling:** Organic, warm — NO constellation/nodes
**Commit:** `feat: add Genesis HeroHook screen`

### Story 2.2: Create ProblemStatement Component
**File:** Create `src/surface/components/genesis/ProblemStatement.tsx`
**Task:** CEO quotes section with:
- Three quote cards (paper texture)
- Tension statement below
- "What if there was another way?" in grove-orange
**Content:** From TARGET_CONTENT.md
**Commit:** `feat: add Genesis ProblemStatement screen`

### Story 2.3: Wire Screens 1-2 into GenesisPage
**File:** `src/surface/pages/GenesisPage.tsx`
**Task:** Import and render HeroHook, ProblemStatement
**Commit:** `feat: integrate screens 1-2 into GenesisPage`

---

## Epic 3: Genesis Screens 3-4 (P0)

### Story 3.1: Create ProductReveal Component
**File:** Create `src/surface/components/genesis/ProductReveal.tsx`
**Task:** Product reveal section with:
- "YOUR GROVE" headline
- One-liner with line breaks
- Three pillar icons (emoji initially, can upgrade later)
- Value teaser (italic)
- "See it in action" CTA
**Commit:** `feat: add Genesis ProductReveal screen`

### Story 3.2: Create AhaDemo Component
**File:** Create `src/surface/components/genesis/AhaDemo.tsx`
**Task:** Simulated Terminal moment:
- Paper card aesthetic (NOT dark terminal)
- Pre-scripted demo message
- Two CTAs: "Go deeper" / "Keep exploring"
- Tagline below
**Behavior:** CTAs open Terminal (existing functionality)
**Commit:** `feat: add Genesis AhaDemo screen`

### Story 3.3: Wire Screens 3-4 into GenesisPage
**File:** `src/surface/pages/GenesisPage.tsx`
**Task:** Import and render ProductReveal, AhaDemo
**Commit:** `feat: integrate screens 3-4 into GenesisPage`

---

## Epic 4: Genesis Screens 5-6 (P1)

### Story 4.1: Create Foundation Component
**File:** Create `src/surface/components/genesis/Foundation.tsx`
**Task:** "Why This Works" section:
- Headline
- Simplified Ratchet explanation (text only for MVP)
- Three "go deeper" links (open Terminal with queries)
- "Explore" CTA
**Commit:** `feat: add Genesis Foundation screen`

### Story 4.2: Create CallToAction Component
**File:** Create `src/surface/components/genesis/CallToAction.tsx`
**Task:** Final CTA section:
- "THE GROVE IS GROWING" headline
- Subhead about Gardeners
- Primary CTA: Request Early Access
- Secondary CTA: Explore the Terminal
- Footer with version
**Commit:** `feat: add Genesis CallToAction screen`

### Story 4.3: Wire Screens 5-6 into GenesisPage
**File:** `src/surface/pages/GenesisPage.tsx`
**Task:** Import and render Foundation, CallToAction
**Commit:** `feat: integrate screens 5-6 into GenesisPage`

---

## Epic 5: Polish & Telemetry (P1)

### Story 5.1: Add Scroll Animations
**File:** `src/surface/pages/GenesisPage.tsx` and screen components
**Task:** Add intersection observer for fade-in effects
**Commit:** `ux: add scroll animations to Genesis screens`

### Story 5.2: Mobile Responsiveness
**Files:** All Genesis components
**Task:** Ensure proper display on mobile breakpoints
**Commit:** `fix: Genesis mobile responsiveness`

### Story 5.3: Add Genesis Telemetry
**File:** `utils/funnelAnalytics.ts`
**Task:** Track:
- `genesis_experience_loaded` event
- `genesis_scroll_depth` (which screens viewed)
- `genesis_cta_clicked` (which CTA, which screen)
**Commit:** `telemetry: add Genesis experience tracking`

### Story 5.4: Reality Tuner Integration
**File:** `src/foundation/consoles/RealityTuner.tsx`
**Task:** Verify `genesis-landing` flag appears in Feature Flags tab
**Note:** Should work automatically if flag is in narratives.json
**Commit:** None needed if auto-detected

---

## Commit Sequence

```
1. feat: add genesis-landing feature flag
2. feat: add SurfaceRouter for experience switching
3. feat: add GenesisPage shell component
4. feat: wire SurfaceRouter into main routes
5. feat: add Genesis HeroHook screen
6. feat: add Genesis ProblemStatement screen
7. feat: integrate screens 1-2 into GenesisPage
8. feat: add Genesis ProductReveal screen
9. feat: add Genesis AhaDemo screen
10. feat: integrate screens 3-4 into GenesisPage
11. feat: add Genesis Foundation screen
12. feat: add Genesis CallToAction screen
13. feat: integrate screens 5-6 into GenesisPage
14. ux: add scroll animations to Genesis screens
15. fix: Genesis mobile responsiveness
16. telemetry: add Genesis experience tracking
17. docs: update DEVLOG with sprint completion
```

## Build Gates
- After Epic 1: `npm run build` ✓ (infrastructure works)
- After Epic 2: `npm run build` ✓ (screens 1-2 render)
- After Epic 3: `npm run build` ✓ (screens 3-4 render)
- After Epic 4: `npm run build` ✓ (all screens render)
- After Epic 5: `npm run build` ✓ (final polish)

## Smoke Test Checklist
- [ ] `?experience=classic` shows original site
- [ ] `?experience=genesis` shows new experience
- [ ] Reality Tuner shows genesis-landing flag
- [ ] Toggling flag changes default experience
- [ ] All 6 Genesis screens visible on scroll
- [ ] "See it in action" opens Terminal
- [ ] "Go deeper" links open Terminal with queries
- [ ] Mobile layout correct
- [ ] No console errors
