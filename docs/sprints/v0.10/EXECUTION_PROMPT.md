# Claude Code Execution Prompt — Grove v0.10 Sprint

## Context
You are executing a polish sprint for the Grove Foundation landing page. All documentation is in `docs/sprints/v0.10/`:
- `SPEC.md` — Goals and acceptance criteria
- `TARGET_CONTENT.md` — Exact copy for all text changes
- `SPRINTS.md` — Detailed story breakdown with file locations

## Repository Intelligence
Before making changes, verify these key locations:
- Schema definitions: `src/core/schema/`
- Foundation consoles: `src/foundation/consoles/`
- Routes: `src/router/routes.tsx`
- Nav: `src/foundation/layout/NavSidebar.tsx`
- Analytics: `utils/funnelAnalytics.ts`
- Constants: `constants.ts`

## Execution Order

### Phase 1: Copy Edits (Epic 1)
1. Read `docs/sprints/v0.10/TARGET_CONTENT.md`
2. Replace version strings in `App.tsx` (lines ~364, ~663) and `src/surface/pages/SurfacePage.tsx` (lines ~93, ~371)
   - Change: `Research Preview v2.4` → `Research Preview v0.09`
3. Apply Section 0 hedge edit in `App.tsx` hero section
4. Replace Section 1 Ratchet body copy in `App.tsx`
5. Replace Section 4 Difference intro in `App.tsx`

### Phase 2: Bug Fix (Epic 4)
1. Update `components/ArchitectureDiagram.tsx`:
   - Change prop signature: `onArtifactRequest: (data: { display: string; query: string }) => void`
   - Update button onClick to pass query object
2. Update `App.tsx`:
   - Change `<ArchitectureDiagram onArtifactRequest={handleArtifactRequest} />` to:
   - `<ArchitectureDiagram onArtifactRequest={(data) => handlePromptHook(data, SectionId.ARCHITECTURE)} />`
3. Remove `handleArtifactRequest` function and `generateArtifact` import if no longer used

### Phase 3: Elena Vignette (Epic 2)
1. Locate "Documented Breakthroughs" block in `App.tsx` Section 4
2. Replace water/aquifer vignette with content from TARGET_CONTENT.md
3. Ensure Nature paper link is included: `https://www.nature.com/articles/s41467-025-66009-y`

### Phase 4: Carousel Restyle (Epic 3)
1. Open `components/WhatIsGroveCarousel.tsx`
2. Find slides with `theme: 'dark'` (indices 2 and 3, ids: 'horses', 'question')
3. Transform styling:
   - Background: Remove dark colors, add `bg-paper`
   - Text: Change `text-white` → `text-ink`, `text-white/XX` → `text-ink/XX`
   - Accents: Change `border-grove-clay` → `border-grove-orange` where it makes sense
   - Maintain readability and visual hierarchy

### Phase 5: Slider Animation (Epic 5)
1. Locate Economics section slider in `App.tsx`
2. Add attention-getting animation (pulse or shimmer)
3. Add state to track first interaction, disable animation after

### Phase 6: A/B Infrastructure (Epic 6)
1. Create `src/core/schema/ab-testing.ts` with types:
   ```typescript
   export interface HookVariant {
     id: string;
     text: string;
     weight: number;
   }
   ```
2. Create `utils/abTesting.ts` with `selectVariant` function
3. Update `constants.ts` SECTION_HOOKS to include variants array
4. Extend `utils/funnelAnalytics.ts` trackPromptHookClicked with variantId

### Phase 7: Genesis Dashboard (Epic 7)
1. Create `src/foundation/consoles/Genesis.tsx` following EngagementBridge pattern
2. Add route in `src/router/routes.tsx` for `/foundation/genesis`
3. Add nav entry in `src/foundation/layout/NavSidebar.tsx`
4. Create `utils/genesisMetrics.ts` for metrics aggregation
5. Wire up dashboard with MetricCard components

## Build Verification
After each phase, run:
```bash
npm run build
```
Build must pass before proceeding to next phase.

## Citation Format
When reporting changes, cite as: `path:lineStart-lineEnd`

## Response Format
After each phase:
1. List files modified with line citations
2. Report build status
3. Note any issues encountered

After all phases:
1. Summary of all changes
2. Final build status
3. Smoke test checklist

## Forbidden Actions
- Do NOT modify files outside the documented scope
- Do NOT change component structure or props beyond what's specified
- Do NOT add dependencies
- Do NOT modify server.js or API endpoints
