# S26-NUR: Nursery Inspector Rationalization + SFR Bridge

**Codename:** `s26-nur`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S25-GSE)
**Date:** 2026-01-27

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1a - Adapter |
| **Status** | Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-27 |
| **Next Action** | Create nurseryToSprout adapter |

---

## Attention Anchor

**We are building:** A bridge between the Nursery Console inspector and the SproutFinishingRoom modal, enabling real Garden promotion from Nursery context.

**Success looks like:** Clicking "Promote" in Nursery opens the SFR modal with full artifact history, and promotion flows through garden-bridge.ts to create a real Garden document.

---

## Hard Constraints

### Strangler Fig Compliance

FROZEN ZONE — DO NOT TOUCH:
- `/terminal` route
- `/foundation` route
- `src/surface/components/Terminal/*`
- `src/workspace/*`
- `server.js` GCS loaders

ACTIVE BUILD ZONE:
- `src/bedrock/consoles/NurseryConsole/` (inspector modifications)
- `src/core/adapters/` (new adapter)
- `src/core/schema/` (type additions)
- `src/bedrock/consoles/NurseryConsole/NurseryConsole.config.ts` (navigation)

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| nurseryToSprout adapter | N/A (pure mapping) | ✅ Model-free | ✅ Preserves all provenance | ✅ Field-extensible |
| View Artifacts button | ✅ Config-driven badge | ✅ No model deps | ✅ Shows artifact count | ✅ Works with any count |
| SFR modal launch | ✅ Adapter-mediated | ✅ Modal is model-agnostic | ✅ Full sprout context | ✅ Standard modal pattern |
| Garden promotion | ✅ garden-bridge pipeline | ✅ API-based | ✅ Tracks template + sprout | ✅ Tier system |
| Promoted nav tab | ✅ Config entry | N/A | ✅ Filter on promotedToGardenId | ✅ Registry pattern |

---

## Scope (Phases 1 and 3 ONLY — Phase 2 DEFERRED)

### Phase 1: SFR Bridge

**1a: nurseryToSprout Adapter**
- Create `src/core/adapters/nurseryToSprout.ts`
- Map `GroveObject<SproutPayload>` → `Sprout` (the type SFR expects)
- Add `generatedArtifacts` field to `SproutPayload`
- Add `promoted` to `ResearchSproutStatus` union type
- Add promotion fields to `SproutPayload` (promotedAt, promotionTier, promotionGardenDocId)

**1b: View Artifacts Button + SFR Modal Launch**
- Add "View Artifacts" button to SproutEditor inspector
- Show artifact count badge when `generatedArtifacts.length > 0`
- Import and render SproutFinishingRoom modal
- Wire adapter to convert Nursery sprout → SFR Sprout type
- aria-haspopup="dialog" on button, aria-label on badge

### Phase 3: Complete Promote Workflow

**3a: Wire garden-bridge Promotion**
- Replace `handlePromote` stub with real garden-bridge pipeline
- Require artifact selection before promotion
- Populate `promotedToGardenId` field after successful promotion
- Show promotion confirmation in inspector
- Handle promotion failure with toast

**3b: Promoted Navigation Tab**
- Add 'promoted' to `NURSERY_STATUS_CONFIG`
- Add 'promoted' navigation tab with filter on `payload.status = 'promoted'`
- Add 'promoted' to `ResearchSproutStatus` union + status machine transitions
- Update Supabase status check constraint (migration)

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] REVIEW.html complete with all sections
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors in E2E tests
- [ ] Code-simplifier applied
- [ ] Build and lint pass

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase without screenshot evidence
- DEX compliance test fails
- REVIEW.html not created or incomplete
- E2E test not created or missing console monitoring
- Critical console errors detected in E2E tests

---

*This contract is binding. Deviation requires explicit human approval.*
