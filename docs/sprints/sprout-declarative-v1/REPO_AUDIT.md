# Repository Audit: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Date:** December 30, 2024  
**Auditor:** Claude (Foundation Loop)  
**Purpose:** Extend sprout capture with research manifest capability and declarative configuration

---

## Executive Summary

This sprint extends the existing Sprout system (Pattern 11: Selection Action) with research manifest capabilities, enabling users to build structured research briefs that accumulate over time and generate copy-paste ready prompts. The approach honors existing patterns by extending Sprout rather than creating parallel types.

**Key insight:** The value isn't in automating research execution (yet) — it's in structuring the research brief so thoroughly that manual execution becomes trivial.

---

## Current State Analysis

### Sprout System (kinetic-cultivation-v1)

**Location:** `src/surface/components/KineticStream/Capture/`

| Component | Status | Notes |
|-----------|--------|-------|
| `SproutCaptureCard.tsx` | ✅ Working | Single action (Plant Sprout), tags only |
| `MagneticPill.tsx` | ⚠️ Bug | Scale inverted (repels instead of attracts) |
| `SproutTray.tsx` | ✅ Working | Shows sprouts, delete action |
| `SproutCard.tsx` | ✅ Working | Display card in tray |
| `sprout-capture.config.ts` | 🎯 Target | Hardcoded, needs JSON extraction |

**Schema:** `src/core/schema/sprout.ts`
- Current status: `'sprout' | 'sapling' | 'tree'` (MVP)
- Planned stages (documented): `'tender' | 'rooting' | 'branching' | 'hardened' | 'grafted' | 'established' | 'dormant' | 'withered'`
- Provenance exists: lens, hub, journey, node, knowledgeFiles
- Tags and notes fields exist

### Copilot Configurator Pattern

**Status:** Vision documented, not implemented  
**Location:** `copilot-configurator-vision.md` (Notion/project knowledge)  
**Relevance:** Provides pattern for natural language → JSON editing of object fields

### Known Issues

1. **MagneticPill bug:** Distance calculation inverted — scale increases as cursor moves AWAY
2. **Single action:** Only "Plant Sprout" available; no way to indicate research intent
3. **Hardcoded config:** `sprout-capture.config.ts` not declarative JSON
4. **Missing stages:** Schema defines lifecycle but UI doesn't use full stages

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Selection capture | Pattern 11 (Selection Action) | Add second action type (Research Directive) |
| Config extraction | Pattern 11 config comment | Extract to `data/selection-actions.json` |
| Stage lifecycle | Sprout schema (documented) | Implement 8-stage botanical lifecycle |
| Object fields | Pattern 7 (Object Model) | Extend Sprout with `researchManifest` |
| Field editing | Copilot Configurator vision | Implement for Sprout object type |
| Styling | Pattern 4 (Token Namespaces) | Use `--card-*` for research card |

---

## New Patterns Proposed

### Research Manifest Pattern

**Why existing patterns insufficient:** The Sprout schema captures provenance (where insight came from) but not research intent (where to take it). Research manifests accumulate clues and directions over time before prompt generation.

**DEX Compliance:**
- **Declarative Sovereignty:** Research purposes and clue types defined in JSON (`data/research-purposes.json`)
- **Capability Agnosticism:** Prompt templates work regardless of which LLM executes them
- **Provenance:** Full chain from selection → manifest → prompt → harvest
- **Organic Scalability:** Manifests can hold 0 clues (immediate) or 100 (accumulated)

**Approval:** This pattern extends Pattern 11 rather than creating parallel infrastructure. The research manifest is an optional field on Sprout, not a new object type.

---

## File Operations Required

### New Files

| File | Purpose |
|------|---------|
| `data/selection-actions.json` | Declarative action definitions |
| `data/sprout-stages.json` | 8-stage botanical lifecycle config |
| `data/research-purposes.json` | Purpose types with icons/descriptions |
| `data/research-prompt-template.md` | Handlebars template for prompt generation |
| `src/surface/components/KineticStream/Capture/components/ResearchManifestCard.tsx` | Research capture UI |
| `src/surface/components/KineticStream/Capture/components/ActionMenu.tsx` | Multi-action selector |
| `src/surface/components/KineticStream/Capture/components/PromptPreviewModal.tsx` | Generated prompt display |
| `src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts` | Declarative action engine |
| `src/lib/prompt-generator.ts` | Template → prompt generator |

### Modified Files

| File | Changes |
|------|---------|
| `src/core/schema/sprout.ts` | Add `ResearchManifest` type, extend `Sprout` |
| `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx` | Fix scale inversion bug |
| `src/surface/components/KineticStream/Capture/config/sprout-capture.config.ts` | Reference JSON configs |
| `src/surface/components/KineticStream/Capture/components/SproutTray.tsx` | Show stage badges, research status |
| `src/surface/components/KineticStream/Capture/components/SproutCard.tsx` | Render research sprouts differently |

---

## Technical Risks

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Config loading latency | Low | JSON imports at build time |
| Research card complexity | Medium | Start with minimal fields, expand |
| Prompt template rendering | Low | Use established Handlebars patterns |
| Stage migration | Low | Backward compatible with existing 'sprout' status |

---

## Dependencies

- **Prior sprint:** kinetic-cultivation-v1 (complete)
- **External:** None
- **Internal:** Pattern 11 components, Pattern 7 GroveObjectMeta

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Actions configurable in JSON | 100% (zero hardcoded) |
| Stage transitions enforced | All 8 stages defined |
| Research prompt generation | < 100ms |
| Existing sprout functionality preserved | No regressions |
| MagneticPill behavior correct | Attracts on approach |

---

## Audit Timestamp

**Completed:** 2024-12-30T03:30:00Z  
**Next Phase:** SPEC.md (20 acceptance criteria)
