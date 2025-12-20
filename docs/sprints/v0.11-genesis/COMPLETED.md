# Sprint v0.11 Genesis Experience — Completed

**Completed:** 2025-12-19
**Status:** Ready for deployment

## Summary

Implemented a feature-flagged "Genesis" landing experience alongside the existing "Classic" experience. Genesis follows a Jobs-style "Feel → Understand → Believe" progression with 6 screens, maintaining the organic, warm, paper-textured aesthetic.

## Features Delivered

### Phase 1: Infrastructure
- Added `genesis-landing` feature flag to narratives schema
- Created `SurfaceRouter.tsx` for experience switching
- URL param support: `?experience=genesis` or `?experience=classic`
- Feature flag toggle in Reality Tuner

### Phase 2-4: Six Genesis Screens
1. **HeroHook** — "YOUR AI." emotional hook with fade-in animation
2. **ProblemStatement** — CEO quotes with scroll-triggered card animations
3. **ProductReveal** — "YOUR GROVE" reveal with 3 pillars
4. **AhaDemo** — Simulated Terminal message with typing effect
5. **Foundation** — "WHY THIS WORKS" with deep dive links
6. **CallToAction** — Final CTA with early access button

### Phase 5: Polish
- Scroll-triggered fade-in animations using IntersectionObserver
- Mobile-responsive layouts (tested with Tailwind breakpoints)
- Genesis telemetry events added to funnelAnalytics

### Bonus: Emergence Journey
Added new journey for the Translation Emergence document:
- Hub: `translation-emergence`
- Journey: "The Emergence Pattern" with 5 nodes
- TopicHub routing for RAG

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `src/surface/pages/SurfaceRouter.tsx` | Routes between Classic/Genesis |
| `src/surface/pages/GenesisPage.tsx` | Genesis page with telemetry |
| `src/surface/components/genesis/HeroHook.tsx` | Screen 1 |
| `src/surface/components/genesis/ProblemStatement.tsx` | Screen 2 |
| `src/surface/components/genesis/ProductReveal.tsx` | Screen 3 |
| `src/surface/components/genesis/AhaDemo.tsx` | Screen 4 |
| `src/surface/components/genesis/Foundation.tsx` | Screen 5 |
| `src/surface/components/genesis/CallToAction.tsx` | Screen 6 |
| `src/surface/components/genesis/index.ts` | Barrel exports |
| `src/surface/hooks/useScrollAnimation.ts` | Scroll animation hook |

### Modified Files
| File | Changes |
|------|---------|
| `src/router/routes.tsx` | Use SurfaceRouter instead of SurfacePage |
| `data/narratives.json` | Added genesis-landing flag, emergence journey/hub |
| `data/narratives-schema.ts` | Added genesis-landing to DEFAULT_FEATURE_FLAGS |
| `src/core/schema/lens.ts` | Added genesis telemetry event types |
| `utils/funnelAnalytics.ts` | Added genesis tracking functions |

## Telemetry Events

| Event | Description |
|-------|-------------|
| `genesis_experience_loaded` | Fires when Genesis page mounts |
| `genesis_scroll_depth` | Fires when each screen scrolls into view |
| `genesis_cta_clicked` | Fires on CTA button clicks with screen context |

## Testing URLs

After deployment:
- **Classic:** `https://[domain]/?experience=classic`
- **Genesis:** `https://[domain]/?experience=genesis`
- **Default:** Respects `genesis-landing` feature flag (default: false = Classic)

## Design Compliance

- ✅ Paper/cream backgrounds (`bg-paper`, `bg-paper-dark`)
- ✅ Grove-forest green for headlines
- ✅ Grove-clay (orange) for emphasis
- ✅ Serif font (Lora) for headlines
- ✅ NO dark/techy backgrounds
- ✅ NO sci-fi imagery or constellation animations

## Next Steps

1. Deploy to Cloud Run
2. Toggle `genesis-landing` flag in Reality Tuner to A/B test
3. Monitor telemetry for scroll depth and CTA engagement
4. Iterate on copy/design based on user feedback
