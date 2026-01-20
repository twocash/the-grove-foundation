# GroveSkins Epic (S0-S4) Execution Contract

**Codename:** `groveskins-epic-s0-s4`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S15-Federation-Editor)
**Date:** 2026-01-19

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | S1-SKIN-HybridEngine |
| **Status** | 🚀 Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-19T12:00:00Z |
| **Next Action** | Commit S1, proceed to S2 |

---

## Attention Anchor

**We are building:** Declarative theming system with JSON-driven skins and CSS variable injection

**Success looks like:** Theme changes via JSON config, no code modifications required

---

## Epic Overview

The GroveSkins Epic introduces a declarative theming architecture where:
1. **GroveSkin** JSON objects are the source of truth
2. **CSS variables** are injected at runtime from skin tokens
3. **Density tiers** (compact/comfortable/spacious) are skin-configurable
4. **Primitives** consume density from context, not hardcoded values

### Sprint Breakdown

| Sprint | Name | Purpose | Status |
|--------|------|---------|--------|
| S0 | QuantumAudit | Establish CSS variable baseline | ✅ COMPLETE |
| S1 | HybridEngine | GroveSkin type + CSS injection | IN_PROGRESS |
| S2 | DeclarativeDensity | Density-aware primitives | PENDING |
| S3 | StranglerMigration | /explore route migration | PENDING |
| S4 | ZenithPaper | Light theme + switcher | PENDING |

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route
├── /bedrock route
├── src/explore/*
├── src/bedrock/*
└── src/core/schema/*
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| GroveSkin type | ✅ JSON-driven | ✅ No model deps | ✅ provenance field | ✅ Registry pattern |
| CSS injection | ✅ Token mapping | ✅ Pure CSS vars | N/A | ✅ SKIN_CSS_MAP |
| Density system | ✅ Layout config | ✅ No model deps | N/A | ✅ DensityToken type |
| Theme registry | ✅ JSON themes | ✅ No model deps | ✅ Tracked | ✅ Extensible |

---

## Sprint Architectures

### S0-SKIN-QuantumAudit (COMPLETE)

**Artifacts:**
- `src/theme/mappings/quantum-glass.map.ts` - CSS variable definitions
- `src/theme/tokens/quantum-glass.json` - Token values

**Gate:** ✅ CSS variables documented and baseline established

---

### S1-SKIN-HybridEngine (CURRENT)

**Phase 1a: Type Definition**
- Create `GroveSkin` interface with tokens, layout, provenance
- Create `SKIN_CSS_MAP` for semantic-to-CSS-variable mapping
- Location: `src/bedrock/types/GroveSkin.ts`

**Phase 1b: Context Integration**
- Add skin state to BedrockUIContext
- Implement CSS variable injection effect
- Add localStorage persistence
- Add `useSkin()` convenience hook
- Location: `src/bedrock/context/BedrockUIContext.tsx`

**Phase 1c: Provider Wiring**
- Wrap /explore route with BedrockUIProvider
- /bedrock already wrapped via BedrockWorkspace
- Location: `src/surface/pages/ExplorePage.tsx`

**Gate:** Build passes, skin state accessible from both routes

---

### S2-SKIN-DeclarativeDensity (PENDING)

**Phase 2a: GlassPanel Enhancement**
- Add `useSkin()` hook consumption
- Map density from skin.layout.density
- Maintain backward compatibility

**Phase 2b: FoundationText Primitive**
- Create text primitive with density-aware sizing
- Support heading/body/caption variants

**Phase 2c: MetricCard Primitive**
- Create metric display with density support
- Support value/label/trend slots

**Gate:** All primitives consume density from context

---

### S3-SKIN-StranglerMigration (PENDING)

**Phase 3a: ExploreShell Audit**
- Identify hardcoded spacing/padding
- Plan density-aware replacements

**Phase 3b: Component Migration**
- Update components to use primitives
- Replace hardcoded values with density tokens

**Gate:** /explore renders correctly with all density tiers

---

### S4-SKIN-ZenithPaper (PENDING)

**Phase 4a: Light Theme**
- Create zenith-paper.json theme
- Paper/ink color scheme
- Light-appropriate effects (shadows vs glows)

**Phase 4b: Theme Switcher**
- Create ThemeSwitcher component
- Add to Bedrock settings/inspector

**Phase 4c: Registry Integration**
- Add zenith-paper to THEME_REGISTRY
- Test theme switching at runtime

**Gate:** Both themes work, switching is smooth

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] REVIEW.html complete with all sections
- [ ] Build passes
- [ ] Committed to feature branch

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without screenshot evidence
- ❌ DEX compliance test fails
- ❌ REVIEW.html not created or incomplete

---

*This contract is binding. Deviation requires explicit human approval.*
