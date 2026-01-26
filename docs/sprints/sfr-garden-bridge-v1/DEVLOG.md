# S24-SFR: Artifact Provenance & Garden Promotion Path — DEVLOG

## Phase 0: Architecture Research & Contract Setup
**Started:** 2026-01-25
**Status:** Complete

### Sub-phase 0a: Schema & Storage Research
- Read `src/core/schema/sprout.ts` (522 lines) — identified 3 generations of research storage, anti-drift risk
- Read `hooks/useSproutStorage.ts` (334 lines) — localStorage CRUD with shallow merge
- Read `src/core/schema/research-document.ts` (130 lines) — Zod-validated Writer Agent output
- Identified **The Save Gap**: `updateSprout(sprout.id, { researchDocument: document })` overwrites with no separate identity

### Sub-phase 0b: Garden Console Discovery
- Read `src/bedrock/consoles/GardenConsole/types.ts` (201 lines) — 5-tier lifecycle, `derived_from[]`, `cited_by_sprouts[]`
- Read `src/bedrock/consoles/GardenConsole/document-transforms.ts` (167 lines) — Transform patterns for API ↔ GroveObject
- Read `src/bedrock/consoles/GardenConsole/useDocumentData.ts` (125 lines) — API endpoints (GET/PATCH/DELETE)
- **Key finding:** Garden Console already has everything needed. No new entity type required.

### Sub-phase 0c: UI Slot Check (Constraint 7b)
- Decision tree result: **NO NEW UI SLOT**
- Generated artifact is a TYPE of existing concept (Document in Garden)
- Enters Garden at `seed` tier with `derived_from: [sproutId]`
- Existing Garden Console handles browsing, promotion, and lifecycle

### Sub-phase 0d: Contract Files
- Created `docs/sprints/sfr-garden-bridge-v1/` directory
- Created SPEC.md execution contract
- Created DEVLOG.md (this file)

### DEX Compliance (Phase 0)
- Declarative Sovereignty: N/A (research phase)
- Capability Agnosticism: N/A (research phase)
- Provenance: Documented discovery chain in DEVLOG
- Organic Scalability: Chose existing Garden infrastructure over new entity type

---

## Phase 1: json-render Promotion Infrastructure
**Started:** 2026-01-25
**Status:** Complete

### Sub-phase 1a: garden-bridge.ts
- Created `src/surface/components/modals/SproutFinishingRoom/garden-bridge.ts`
- Pure transform: `ResearchDocument + Sprout + TemplateInfo → Garden API payloads`
- Two-step API: POST `/api/knowledge/upload` → PATCH `/api/knowledge/documents/:id`
- Provenance PATCH failure is non-fatal (document exists without provenance)
- Types: `PromotionResult { success: true }`, `PromotionError { success: false }`

### Sub-phase 1b: promotion-catalog.ts
- Created `json-render/promotion-catalog.ts`
- Zod schemas: `PromotionStatusSchema` (full card), `PromotionBadgeSchema` (compact)
- Uses `createCatalog()` factory from `@core/json-render`

### Sub-phase 1c: promotion-registry.tsx
- Created `json-render/promotion-registry.tsx`
- React renderers for PromotionStatus (tier badge + provenance chain + confidence) and PromotionBadge
- GroveSkins native with hex values; TIER_CONFIG maps 5 Garden tiers to icon + color + label

### Sub-phase 1d: promotion-transform.ts
- Created `json-render/promotion-transform.ts`
- `promotionResultToRenderTree()` — full status card for DocumentViewer
- `promotionBadgeToRenderTree()` — compact badge for version tabs

### Sub-phase 1e: index.ts exports
- Updated `json-render/index.ts` with catalog, registry, transform exports

### Phase 1 Gate
- `npx tsc --noEmit` — Zero errors in new files (all pre-existing errors in FROZEN ZONE)
- Gate: PASSED

### DEX Compliance (Phase 1)
- Declarative Sovereignty: Tier config declared in TIER_CONFIG record, not hardcoded
- Capability Agnosticism: No model-specific code; any API can serve promotion
- Provenance: Full provenance chain tracked (sproutId, templateId, generatedAt, confidence)
- Organic Scalability: json-render pattern (Catalog → Registry → Transform) enables new promotion views without code changes

---

## Phase 2+3: Wire API Call + Replace UI
**Started:** 2026-01-25
**Status:** Complete

### Sub-phase 2a: SproutFinishingRoom.tsx modifications
- Replaced `handleSaveArtifact` with `handlePromoteToGarden`
- Added promotion state: `promotionResult`, `isPromoting`
- Two-step API call: POST upload → PATCH provenance
- Error handling: typed `PromotionError` with step indication
- Engagement event: `sproutPromotedToGarden` with gardenDocId + tier
- Toast notifications for success/failure

### Sub-phase 2b: DocumentViewer.tsx modifications
- Added promotion props: `onPromoteToGarden`, `isPromoting`, `promotionResult`
- Added `promotionTree` useMemo using `promotionResultToRenderTree`
- Replaced "Save to Nursery" action bar with "Promote to Garden" button
- Added PromotionStatus card display via `<Renderer tree={promotionTree} registry={PromotionRegistry} />`
- Button shows disabled state during API call, hides after successful promotion

### Phase 2+3 Gate
- `npx tsc --noEmit` — Zero errors in modified files
- Gate: PASSED

### DEX Compliance (Phase 2+3)
- Declarative Sovereignty: Promotion UI driven by json-render tree, not hardcoded JSX
- Capability Agnosticism: API endpoints are standard REST, no model dependency
- Provenance: PromotionResult tracks full chain (sprout → template → garden doc)
- Organic Scalability: PromotionRegistry extensible via new component types

---

## Phase 4: E2E Tests + Sprint Completion
**Started:** 2026-01-25
**Status:** Complete

### Sub-phase 4a: Visual verification screenshots
- Baseline screenshot: `screenshots/01-explore-baseline.png`
- Dev server confirmed running on localhost:3000

### Sub-phase 4b: E2E test with console monitoring (Constraint 11)
- Created `tests/e2e/sfr-garden-bridge-v1.spec.ts`
- Mock sprout with canonicalResearch data (3 sections, 3 sources)
- Full lifecycle: open modal → verify research → check tabs → close → verify console
- Console monitoring: `setupConsoleCapture()` + `getCriticalErrors()`
- Result: 1 passed, 0 critical errors
- 6 E2E screenshots captured in `screenshots/e2e/`

### Sub-phase 4c: REVIEW.html
- Created sprint review page with all screenshots embedded

### Phase 4 Gate
- E2E test passes with zero critical errors
- All screenshots saved to project
- REVIEW.html complete
- Gate: PASSED

### DEX Compliance (Phase 4)
- Declarative Sovereignty: Test data is declarative mock (JSON object)
- Capability Agnosticism: N/A (test infrastructure)
- Provenance: Screenshots document what was built with timestamps
- Organic Scalability: Test follows shared `_test-utils.ts` pattern
