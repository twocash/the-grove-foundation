# S24-SFR: Artifact Provenance & Garden Promotion Path

**Codename:** `sfr-garden-bridge-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `feat/sfr-ux-redesign-v1` (post S23-SFR v1.0)
**Date:** 2026-01-25

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 4 - Complete |
| **Status** | Sprint Complete |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-25 |
| **Next Action** | Commit and handoff |

---

## Attention Anchor

**We are building:** A bridge from the SFR's generated artifacts to the Garden Console, so documents get their own identity with provenance linking back to the source sprout.

**Success looks like:** User clicks "Promote to Garden" in the Sprout Finishing Room, and the generated document appears in the Garden Console at `seed` tier with full provenance chain (which sprout it came from, which template was used, when it was generated).

---

## Architecture Discovery (Phase 0)

### UI Slot Check (Constraint 7b): PASSED — NO NEW UI SLOT

The Notion brief proposed a new "Manuscript" entity type. Research revealed the **Garden Console already has everything needed**:

| Question | Answer |
|----------|--------|
| Is it a TYPE of existing concept? | **YES** — It's a Document in Garden Console |
| Independent lifecycle? | YES — but Garden already manages document lifecycle |
| Users browse/search MANY? | YES — but Garden Console handles this |
| **Decision** | **NO NEW SLOT** — Use existing Garden Console at `seed` tier |

**Justification:** Generated artifacts from the Writer Agent are Documents. The Garden Console (`src/bedrock/consoles/GardenConsole/`) already provides:
- 5-tier promotion lifecycle: `seed → sprout → sapling → tree → grove`
- Provenance fields: `derived_from[]`, `cited_by_sprouts[]`, `source_context`
- Supabase-backed CRUD via `/api/knowledge/documents`
- Copilot promotion actions
- Transform functions between API and UI types

No new entity type, schema file, storage hook, or UI route is needed. The sprint creates a **bridge function** that transforms `ResearchDocument + Sprout` metadata into a Garden API payload and wires it into the SFR's save action.

### The Save Gap

Currently in `SproutFinishingRoom.tsx`:
```typescript
// S23-SFR: handleSaveArtifact
updateSprout(sprout.id, { researchDocument: document });
// Problem: overwrites sprout field, no separate identity, no provenance
```

After S24-SFR:
```typescript
// POST to Garden API with full provenance
const gardenPayload = researchDocumentToGardenPayload(document, sprout, templateInfo);
await fetch('/api/knowledge/documents', { method: 'POST', body: JSON.stringify(gardenPayload) });
// Result: Document enters Garden at seed tier with derived_from: [sprout.id]
```

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
├── src/workspace/*
└── src/core/schema/sprout.ts (ANTI-DRIFT: do NOT add fields)

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/surface/components/modals/SproutFinishingRoom/ (modify existing)
├── src/bedrock/consoles/GardenConsole/ (read-only reference)
├── src/core/schema/ (new files only, NOT sprout.ts)
└── tests/e2e/
```

**Critical Anti-Drift Rule:** `sprout.ts` is FROZEN for this sprint. The temptation to add a `gardenDocumentId` field to Sprout is strong — resist it. The Garden document tracks `derived_from: [sproutId]` which provides the reverse link without polluting the sprout schema.

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Garden bridge transform | Config-driven field mapping | No model assumptions | `derived_from[]` + `source_context` | Registry pattern |
| Promote to Garden action | Button behavior via callback | Works with any document | templateId + generatedAt tracked | Extends existing pattern |
| Seed tier entry | Tier system is config-based | Tier is content-agnostic | Entry tier documented | 5-tier system grows organically |

---

## json-render Compliance (MANDATORY)

**Rule: "Read = json-render. Write = React."**

| UI Element | Pattern | Why |
|------------|---------|-----|
| "Promote to Garden" button | React | WRITE: triggers action |
| Promotion confirmation card | **json-render** | READ: displays promotion result data |
| Provenance badge on artifact tab | **json-render** | READ: displays metadata |
| Garden tier indicator | **json-render** | READ: displays status |

**Implementation:** New `PromotionCatalog` in the SFR json-render directory, following the exact same Catalog → Registry → Transform → Renderer pattern used by ResearchCatalog and EvidenceCatalog.

New json-render components:

| Component | Props | Purpose |
|-----------|-------|---------|
| `PromotionStatus` | `{ title, tier, gardenDocId, sproutId, templateName, promotedAt }` | Full confirmation card after successful promotion |
| `PromotionBadge` | `{ tier, promotedAt }` | Compact badge on artifact version tab |

---

## Execution Architecture

### Phase 1: Garden Bridge — Transform + json-render Catalog
**Files:**
- New `garden-bridge.ts` — pure transform function (domain → API payload)
- New `json-render/promotion-catalog.ts` — Zod schemas for PromotionStatus + PromotionBadge
- New `json-render/promotion-registry.tsx` — React renderers for promotion components
- New `json-render/promotion-transform.ts` — promotion result → RenderTree
- Modify `json-render/index.ts` — export new catalog/registry/transform

Create the bridge transform:
```typescript
function researchDocumentToGardenPayload(
  document: ResearchDocument,
  sprout: Sprout,
  templateInfo: { templateId: string; templateName: string; generatedAt: string }
): GardenCreatePayload
```

Create the json-render promotion display:
```typescript
// promotion-transform.ts
function promotionResultToRenderTree(result: PromotionResult): RenderTree
function promotionBadgeToRenderTree(result: PromotionResult): RenderTree
```

**Gate:** Build passes, json-render catalog validates via Zod, no side effects.

### Phase 2: Wire API Call + Promotion Display
**Files:** Modify `SproutFinishingRoom.tsx`, `DocumentViewer.tsx`

Replace `handleSaveArtifact` to:
1. Call bridge transform function
2. POST to `/api/knowledge/upload`
3. On success: build json-render tree from promotion result
4. Display promotion confirmation via Renderer + PromotionRegistry
5. Show success toast + emit engagement event
6. On error: toast error

**Gate:** Build passes, no type errors.

### Phase 3: Replace Save to Nursery with Promote to Garden
**Files:** Modify `DocumentViewer.tsx`, `ActionPanel.tsx`

- Change button text: "Save to Nursery" → "Promote to Garden"
- Change icon to garden/plant metaphor
- After successful promotion: render PromotionStatus card via json-render in center column
- Show PromotionBadge on artifact tab for promoted artifacts
- Update toast messages
- Keep "Export to Markdown" unchanged

**Gate:** Visual verification (Playwright screenshot).

### Phase 4: E2E Tests + Sprint Completion
**Files:** New `tests/e2e/sfr-garden-bridge.spec.ts`

- E2E test with console monitoring (Constraint 11)
- Screenshot evidence at each interaction step
- REVIEW.html with all screenshots
- Code-simplifier pass

**Gate:** All Constraint 11 requirements met, REVIEW.html complete.

---

## API Payload Shape

Based on Garden Console's `document-transforms.ts`, the POST payload needs:

```typescript
interface GardenCreatePayload {
  title: string;              // From ResearchDocument or template name
  content: string;            // ResearchDocument.analysis (full markdown)
  tier: 'seed';              // Always enters at seed
  document_type: 'research';  // From ResearchDocument type
  summary: string;            // ResearchDocument.position (thesis)
  keywords: string[];         // Extracted from citations/query
  derived_from: string[];     // [sprout.id]
  source_context: {
    capturedFrom: 'sprout-finishing-room';
    templateId: string;
    templateName: string;
    generatedAt: string;
    sproutQuery: string;
    confidenceScore: number;
  };
}
```

---

## Success Criteria

### Sprint Complete When:
- [ ] Transform function creates correct Garden payload from ResearchDocument + Sprout
- [ ] API call to POST `/api/knowledge/documents` succeeds
- [ ] "Promote to Garden" replaces "Save to Nursery" in SFR center column
- [ ] Document appears in Garden Console at `seed` tier after promotion
- [ ] Provenance chain works: Garden document → `derived_from` → sprout ID
- [ ] All DEX compliance gates pass
- [ ] E2E test with console monitoring passes (Constraint 11)
- [ ] Zero critical console errors in E2E tests
- [ ] Screenshots captured and embedded in REVIEW.html
- [ ] Code-simplifier applied
- [ ] Build and lint pass

### Sprint Failed If:
- Any FROZEN ZONE file modified (especially `sprout.ts`)
- Any phase without screenshot evidence
- New UI slot created (violates UI Slot Check)
- New entity type/schema created (Garden Document already exists)
- `dark:` prefixes added (GroveSkins manages themes)
- Hardcoded colors used (must use CSS variables)

---

*This contract is binding. Deviation requires explicit human approval.*
