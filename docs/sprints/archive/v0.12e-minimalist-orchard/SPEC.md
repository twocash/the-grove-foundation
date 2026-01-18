# Specification — v0.12e Minimalist Orchard

## Sprint Goal
Evolve the Grove Surface design system to "Minimalist Orchard" aesthetic with refined typography, warmer colors, and smart editorial details. Make Genesis the default landing experience. **Critically: Architect Genesis components to accept dynamic content props, enabling the "Chameleon" adaptive surface in v0.13.**

## Strategic Context

### The Hidden Enabler
This sprint is not just aesthetic polish — it's **infrastructure for the Chameleon**.

**The Medium is the Message:**
- Sci-Fi UI (Dark Mode/Neon) feels rigid, like a cockpit. You can't "rewrite" a cockpit.
- Paper UI (Light Mode/Serif) feels like a manuscript. Manuscripts are made to be written and rewritten.

The move to Warm Bone (`#F9F8F4`) and Serif Fonts (EB Garamond, Tenor Sans) creates a "living document" aesthetic — the perfect canvas for text-morphing effects tied to lens selection.

### The Chameleon Setup (v0.13 Preview)
After this sprint, GenesisPage will be architected to:
1. Listen to `useNarrativeEngine().activeLens`
2. Accept dynamic content props for each section
3. Enable un-type/re-type morphing when lens changes

This sprint establishes the **prop interfaces** — v0.13 adds the content maps and animations.

---

## Design Vision: Minimalist Orchard

**Philosophy:** Organic elegance. A warm, textured reading environment that feels like a beautifully typeset book — inviting deep engagement rather than quick scrolling.

**References:** Medium's editorial spacing, Stripe's typographic hierarchy, Apple's product pages for Genesis sections.

---

## Changes Summary

### Typography
| Role | Current | New |
|------|---------|-----|
| Display (Headers) | Playfair Display | Tenor Sans |
| Body | Lora | EB Garamond |
| UI Labels | Inter | Tenor Sans (tracking +15%) |
| Mono | JetBrains Mono | JetBrains Mono (unchanged) |

### Colors
| Token | Current | New | Notes |
|-------|---------|-----|-------|
| `paper` | `#FBFBF9` | `#F9F8F4` | Warmer "bone" tone |
| `ink` | `#1C1C1C` | `#1A2421` | Forest charcoal, less harsh |
| `grove-forest` | `#2F5C3B` | `#355E3B` | Hunter green, richer |
| `grove-accent` | `#2F5C3B` | `#355E3B` | Matches forest |

### Spacing & Details
- Body line-height: 1.6 → 1.65
- Smart quotes via `font-feature-settings`
- Enhanced text rendering (`optimizeLegibility`)

### Default Experience
- Genesis becomes default landing page
- Classic accessible via `?experience=classic`
- Feature flag `genesis-landing` defaults to `true`

### Component Architecture (NEW)
- HeroHook accepts `content` prop with headline/subtext
- ProblemStatement accepts `quotes` prop array
- Other Genesis components get optional content props
- Default content preserved (backward compatible)

---

## Scope

### In Scope
- Font imports (Tenor Sans, EB Garamond)
- CSS custom properties update
- Tailwind config sync
- Body element styling
- Genesis default flip
- Feature flag updates (2 files)
- **Genesis component prop interfaces (Chameleon prep)**

### Out of Scope
- Lens-to-content mapping (v0.13)
- Text morphing animations (v0.13)
- Foundation (dark mode) styling
- New Genesis sections
- Mobile-specific adjustments

---

## Acceptance Criteria

### Typography (AC-1 to AC-4)
- [ ] AC-1: Tenor Sans loads and renders for headers
- [ ] AC-2: EB Garamond loads and renders for body text
- [ ] AC-3: Font fallbacks work if Google Fonts fail
- [ ] AC-4: JetBrains Mono unchanged for code

### Colors (AC-5 to AC-8)
- [ ] AC-5: Background is warm bone (`#F9F8F4`)
- [ ] AC-6: Primary text is forest charcoal (`#1A2421`)
- [ ] AC-7: Accent/forest is hunter green (`#355E3B`)
- [ ] AC-8: Foundation (dark mode) tokens unchanged

### Details (AC-9 to AC-11)
- [ ] AC-9: Body line-height is 1.65
- [ ] AC-10: Smart quotes render (test with "Hello" and 'world')
- [ ] AC-11: Text rendering set to optimizeLegibility

### Genesis Default (AC-12 to AC-14)
- [ ] AC-12: Visiting `/` loads Genesis (not Classic)
- [ ] AC-13: Visiting `/?experience=classic` loads Classic
- [ ] AC-14: Feature flag `genesis-landing` shows `enabled: true`

### Chameleon Prep (AC-15 to AC-17) — NEW
- [ ] AC-15: HeroHook accepts optional `content` prop
- [ ] AC-16: ProblemStatement accepts optional `quotes` prop
- [ ] AC-17: Default content renders when props not provided

### Build & Regression (AC-18 to AC-20)
- [ ] AC-18: `npm run build` passes
- [ ] AC-19: No console errors in browser
- [ ] AC-20: Terminal still functional with new typography

---

## Files to Change

| File | Change Type | Purpose |
|------|-------------|---------|
| `index.html` | Modify | Add Tenor Sans, EB Garamond to Google Fonts |
| `styles/globals.css` | Modify | Update CSS custom properties, add typography features |
| `tailwind.config.ts` | Modify | Sync color/font changes |
| `src/surface/pages/SurfaceRouter.tsx` | Modify | Flip default from classic to genesis |
| `data/narratives-schema.ts` | Modify | Set `genesis-landing: true` |
| `data/narratives.json` | Modify | Set `genesis-landing: true` |
| `src/surface/components/genesis/HeroHook.tsx` | Modify | Add content prop interface |
| `src/surface/components/genesis/ProblemStatement.tsx` | Modify | Add quotes prop interface |

---

## Success Metrics
- Visual diff shows warmer, more inviting aesthetic
- Lighthouse performance score maintained (font loading optimized)
- User can still access Classic via URL param
- Foundation dark mode visually unaffected
- Genesis components ready for dynamic content injection (v0.13)
