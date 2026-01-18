# Execution Prompt — v0.11 Genesis Experience

## Context
Create a feature-flagged "Genesis" landing page experience alongside the existing "Classic" experience. Genesis follows a Jobs-style "Feel → Understand → Believe" progression with 6 screens. The aesthetic must remain organic, warm, paper-textured, and grassroots—NOT futuristic or sci-fi.

## Documentation
All sprint documentation is in `docs/sprints/v0.11-genesis/`:
- `SPEC.md` — Full specification with screen-by-screen details
- `TARGET_CONTENT.md` — Exact copy for all screens
- `SPRINTS.md` — Story breakdown with file locations

**Read SPEC.md and TARGET_CONTENT.md before starting.**

## Repository Intelligence
Verify these locations before making changes:
- Feature flags: `data/narratives.json` → `globalSettings.featureFlags`
- Routes: `src/router/routes.tsx`
- Surface pages: `src/surface/pages/`
- Surface components: `src/surface/components/`
- Telemetry: `utils/funnelAnalytics.ts`
- Design tokens: `tailwind.config.js` (colors: grove-forest, grove-orange, paper, ink)

## Design Constraints
**CRITICAL:** Maintain organic, warm aesthetic throughout:
- Use `bg-paper`, `bg-paper-dark` backgrounds
- Use `text-ink`, `text-grove-forest`, `text-grove-orange` for text
- Serif font (Lora) for headlines
- NO dark/techy backgrounds
- NO constellation/node animations
- NO sci-fi imagery
- Think: garden, paper, handcrafted, trustworthy

## Execution Order

### Phase 1: Infrastructure
1. Add feature flag to `data/narratives.json`:
```json
{
  "id": "genesis-landing",
  "name": "Genesis Landing Experience", 
  "description": "Show the new Jobs-style landing page instead of Classic",
  "enabled": false
}
```
Add to `globalSettings.featureFlags` array.

2. Create `src/surface/pages/SurfaceRouter.tsx`:
```typescript
// Check URL param first, then feature flag, then default to classic
// ?experience=genesis → Genesis
// ?experience=classic → Classic
// No param → check featureFlags for genesis-landing
```

3. Create `src/surface/pages/GenesisPage.tsx` shell (placeholder sections).

4. Update `src/router/routes.tsx` to use SurfaceRouter instead of SurfacePage directly.

5. Run `npm run build` — verify both experiences accessible.

### Phase 2: Screens 1-2
1. Create directory: `src/surface/components/genesis/`

2. Create `genesis/HeroHook.tsx`:
- Full viewport, paper background
- "YOUR AI." in grove-forest, large serif
- Subtext fades in: "Not rented. Not surveilled. Not theirs." then "Yours."
- Scroll indicator (simple, organic)

3. Create `genesis/ProblemStatement.tsx`:
- Paper background
- Three quote cards with CEO quotes (from TARGET_CONTENT.md)
- Tension statement: "They're building the future..."
- "What if there was another way?" in grove-orange

4. Wire into GenesisPage.

5. Run `npm run build`.

### Phase 3: Screens 3-4
1. Create `genesis/ProductReveal.tsx`:
- "YOUR GROVE" headline
- One-liner with proper line breaks
- Three pillars: 🌱 Learning, 🔗 Working, 🔒 Yours
- Value teaser in italics
- "See it in action →" CTA (opens Terminal)

2. Create `genesis/AhaDemo.tsx`:
- Paper card aesthetic (NOT dark terminal)
- "Your Grove is thinking..." loading state
- Pre-scripted demo message
- Two CTAs that open Terminal
- "This is what AI feels like when it's yours." tagline

3. Wire into GenesisPage.

4. Run `npm run build`.

### Phase 4: Screens 5-6
1. Create `genesis/Foundation.tsx`:
- "WHY THIS WORKS" headline
- Ratchet explanation (text only)
- Three links: The Ratchet, The Economics, The Vision
- Each opens Terminal with specific query (from TARGET_CONTENT.md)

2. Create `genesis/CallToAction.tsx`:
- "THE GROVE IS GROWING" headline
- Subhead about Gardeners
- Primary CTA: "Request Early Access"
- Secondary CTA: "Explore the Terminal"
- Footer with version v0.11

3. Wire into GenesisPage.

4. Run `npm run build`.

### Phase 5: Polish
1. Add scroll-triggered fade-in animations (IntersectionObserver).

2. Verify mobile responsiveness for all screens.

3. Add telemetry to `utils/funnelAnalytics.ts`:
- `genesis_experience_loaded`
- `genesis_scroll_depth` 
- `genesis_cta_clicked`

4. Run `npm run build`.

## Component Structure Template

```typescript
// src/surface/components/genesis/HeroHook.tsx
import React from 'react';

interface HeroHookProps {
  onScrollNext?: () => void;
}

export const HeroHook: React.FC<HeroHookProps> = ({ onScrollNext }) => {
  return (
    <section className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      {/* Content here */}
    </section>
  );
};
```

## Terminal Integration
When CTAs need to open Terminal with a query:
```typescript
// Use existing Terminal opening mechanism
// Look at how handlePromptHook works in App.tsx
// The Terminal should open and pre-fill with the query
```

## Build Verification
Run after each phase:
```bash
npm run build
```

## Citation Format
Report changes as: `path:lineStart-lineEnd`

## Response Format
After each phase:
1. List files created/modified with line citations
2. Report build status
3. Note any issues or deviations

After all phases:
1. Summary of all changes
2. Final build status  
3. URLs for testing: `?experience=genesis` and `?experience=classic`

## Forbidden Actions
- Do NOT modify SurfacePage.tsx (Classic must remain unchanged)
- Do NOT use dark backgrounds or techy aesthetics
- Do NOT add new npm dependencies
- Do NOT modify Terminal component
- Do NOT skip build verification between phases
- Do NOT deviate from organic/paper/garden aesthetic
