# Sprint Stories for v0.10

## Epic 1: Copy Edits (P0)

### Story 1.1: Version Number Correction
**Files:** `App.tsx`, `src/surface/pages/SurfacePage.tsx`
**Task:** Replace all 4 occurrences of `Research Preview v2.4` with `Research Preview v0.09`
**Locations:**
- App.tsx:364 (hero section)
- App.tsx:663 (footer)
- SurfacePage.tsx:93 (hero)
- SurfacePage.tsx:371 (footer)

### Story 1.2: Section 0 Hedge Language
**File:** `App.tsx` (hero section, ~line 376-380)
**Task:** Change "But their bet has a fundamental flaw." to "But we think this bet has a fundamental flaw."

### Story 1.3: Section 1 Ratchet Body
**File:** `App.tsx:411-427`
**Task:** Replace entire Ratchet section body copy with content from TARGET_CONTENT.md

### Story 1.4: Section 4 Difference Intro
**File:** `App.tsx` (The Difference section)
**Task:** Replace opening paragraph with content from TARGET_CONTENT.md

---

## Epic 2: Elena Vignette (P1)

### Story 2.1: Replace Vignette Content
**File:** `App.tsx` (Section 4, "Documented Breakthroughs" block)
**Task:** Replace water/aquifer vignette with reward-discovery narrative from TARGET_CONTENT.md

### Story 2.2: Add Research Attribution
**File:** Same location as 2.1
**Task:** Add live hyperlink to Nature paper with proper citation
**URL:** https://www.nature.com/articles/s41467-025-66009-y

---

## Epic 3: Carousel Restyle (P1)

### Story 3.1: Update "Horses" Slide
**File:** `components/WhatIsGroveCarousel.tsx` (slide index 2, id: 'horses')
**Task:** 
- Change background from dark to `bg-paper`
- Change text from white to `text-ink`
- Change accent border from `border-grove-clay` to `border-grove-orange`
- Update all `text-white` and `text-white/XX` to `text-ink` and `text-ink/XX`

### Story 3.2: Update "Question" Slide
**File:** `components/WhatIsGroveCarousel.tsx` (slide index 3, id: 'question')
**Task:** Same transformations as Story 3.1

---

## Epic 4: Bug Fix — Terminal Link (P0)

### Story 4.1: Update ArchitectureDiagram Props
**File:** `components/ArchitectureDiagram.tsx`
**Task:** Change `onArtifactRequest` prop signature to match `handlePromptHook`:
```typescript
interface Props {
  onArtifactRequest: (data: { display: string; query: string }) => void;
}
```
**Button onClick:**
```typescript
onClick={() => onArtifactRequest({
  display: "Generate Technical Routing Spec",
  query: "Generate a detailed technical routing specification for Grove's hybrid local/cloud architecture. Include decision criteria for when to route to local vs cloud, latency thresholds, and cost optimization rules."
})}
```

### Story 4.2: Wire to handlePromptHook in App.tsx
**File:** `App.tsx`
**Task:** Change ArchitectureDiagram usage:
```typescript
<ArchitectureDiagram onArtifactRequest={(data) => handlePromptHook(data, SectionId.ARCHITECTURE)} />
```
**Note:** Can remove `handleArtifactRequest` function entirely if no longer used.

---

## Epic 5: Slider Animation (P2)

### Story 5.1: Add Attention Cue
**File:** `App.tsx` (Economics section slider)
**Task:** 
- Add CSS animation for subtle pulse effect
- Show "Drag to explore" tooltip on first view
- Track first interaction in state, disable animation after

---

## Epic 6: A/B Testing Infrastructure (P1)

### Story 6.1: Define Schema Types
**File:** Create `src/core/schema/ab-testing.ts`
**Types:**
```typescript
export interface HookVariant {
  id: string;
  text: string;
  weight: number; // 0-100
}

export interface ABTest {
  id: string;
  name: string;
  elementType: 'prompt_hook' | 'cta';
  variants: HookVariant[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}
```

### Story 6.2: Create Variant Selection Utility
**File:** Create `utils/abTesting.ts`
**Functions:**
- `selectVariant(variants, sessionId, elementId)` — deterministic selection
- `getSessionId()` — retrieve or create session ID

### Story 6.3: Update Hook Constants with Variants
**File:** `constants.ts`
**Task:** Add variant arrays to SECTION_HOOKS structure (2 variants per hook minimum)

### Story 6.4: Extend Telemetry
**File:** `utils/funnelAnalytics.ts`
**Task:** Add `variantId` and `experimentId` to `trackPromptHookClicked`

### Story 6.5: CTA Variant Support
**File:** `App.tsx` (Get Involved section CTAs)
**Task:** Apply same A/B pattern to CTA buttons

---

## Epic 7: Genesis Dashboard (P1)

### Story 7.1: Create Console Component
**File:** Create `src/foundation/consoles/Genesis.tsx`
**Template:** Follow pattern from EngagementBridge.tsx
**Sections:**
- Core metrics grid (4 cards)
- Variant performance table
- Placeholder for traversal visualization

### Story 7.2: Register Route
**File:** `src/router/routes.tsx`
**Task:** Add lazy-loaded route for `/foundation/genesis`

### Story 7.3: Add Navigation Entry
**File:** `src/foundation/layout/NavSidebar.tsx`
**Task:** Add Genesis to navItems array with Activity icon

### Story 7.4: Create Metrics Aggregation
**File:** Create `utils/genesisMetrics.ts`
**Functions:**
- `aggregateGenesisMetrics(events)` — calculate metrics from localStorage events
- `GenesisMetrics` interface

### Story 7.5: Wire Up Dashboard
**File:** `src/foundation/consoles/Genesis.tsx`
**Task:** Connect metrics aggregation, display in UI

---

## Commit Sequence
1. `core: version number correction (v2.4 → v0.09)`
2. `surface: copy edits for sections 0, 1, 4`
3. `surface: Elena vignette with Nature paper link`
4. `fix: Terminal link routing through chat service`
5. `surface: carousel paper/orange restyle`
6. `ux: slider attention animation`
7. `core: A/B testing schema and utilities`
8. `surface: hook variants with telemetry`
9. `foundation: Genesis dashboard console`
10. `docs: update DEVLOG with sprint completion`
