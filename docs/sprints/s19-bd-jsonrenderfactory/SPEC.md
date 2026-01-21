# S19-BD-JsonRenderFactory — Execution Contract

**Codename:** `s19-bd-jsonrenderfactory`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post prompt-template-architecture-v1)
**Date:** 2026-01-20
**Notion:** https://www.notion.so/2ec780a78eef8153aba8e93600950b2f

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Contract Setup |
| **Status** | 🎯 Ready for execution |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-20 |
| **Next Action** | Developer pickup |

---

## Attention Anchor

**We are building:** A unified json-render component factory with namespaced catalogs, shared base primitives, and a single renderer.

**Success looks like:** All 8 existing catalogs migrated to factory pattern, consistent component vocabulary, 50% faster time to create new components.

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy)

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/core/json-render/*          ← NEW: Base layer
├── src/bedrock/json-render/*       ← NEW: Domain catalogs
├── src/bedrock/consoles/*          ← Migration targets
├── src/bedrock/primitives/*        ← Migration targets
└── src/surface/components/modals/* ← Migration targets
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Base Catalog | ✅ Zod schemas | ✅ Pure TS | ✅ Source tracked | ✅ Factory extends |
| Namespacing | ✅ Config-driven | ✅ No model deps | ✅ Namespace = origin | ✅ Unlimited namespaces |
| Unified Renderer | ✅ Registry lookup | ✅ Any catalog | ✅ Tree meta | ✅ Plugin pattern |
| Migrations | ✅ Same interface | ✅ No behavior change | ✅ Sprint tracked | ✅ Incremental |

---

## Architecture Overview

```
src/core/json-render/                     ← Pure TypeScript (no React)
├── types.ts                              ← RenderElement, RenderTree, ComponentMeta
├── base-catalog.ts                       ← Layout primitives + universal components
├── factory.ts                            ← createCatalog() factory
├── namespacing.ts                        ← Namespace utilities
└── validation.ts                         ← Tree validation

src/bedrock/json-render/                  ← Domain layer
├── registry.ts                           ← Central registry
├── JsonRenderer.tsx                      ← Unified renderer
├── components/                           ← React implementations
│   ├── base/                             ← Base component implementations
│   ├── signals/                          ← Signals component implementations
│   └── ...                               ← Other domain implementations
└── catalogs/                             ← Migrated catalogs
    ├── signals-catalog.ts
    ├── model-analytics-catalog.ts
    └── ...

src/bedrock/consoles/SystemSettings/      ← Admin UI
└── ComponentCatalogBrowser.tsx           ← Read-only catalog viewer
```

### Namespacing Convention

```
base:Stack              ← Layout primitive from base catalog
base:Metric             ← Universal data component
signals:QualityGauge    ← Domain-specific from signals
research:SourceList     ← Domain-specific from research
```

---

## Execution Architecture

### Phase 0: Contract Setup
**Gate:** Artifacts exist, branch created

- [x] 0a: Create sprint folder structure
- [ ] 0b: Create SPEC.md (this file)
- [ ] 0c: Create DEVLOG.md
- [ ] 0d: Create REVIEW.html template
- [ ] 0e: Create feature branch `feat/json-render-factory-v1`

### Phase 1: Core Infrastructure
**Gate:** `npm run build` passes, types export correctly

- [ ] 1a: Create `src/core/json-render/types.ts`
  - RenderElement, RenderTree interfaces (single source of truth)
  - ComponentMeta interface with Zod schema reference
  - CatalogDefinition interface

- [ ] 1b: Create `src/core/json-render/base-catalog.ts`
  - Layout primitives: Stack, Grid, Container, Spacer
  - Universal components: Text, Metric, Badge, Progress
  - Zod schemas for all props

- [ ] 1c: Create `src/core/json-render/factory.ts`
  - createCatalog() function with inheritance
  - Catalog merging logic

- [ ] 1d: Create `src/core/json-render/namespacing.ts`
  - parseComponentName() function
  - resolveComponent() function
  - expandShorthand() function

- [ ] 1e: Create `src/core/json-render/validation.ts`
  - validateRenderTree() function

- [ ] 1f: Create `src/core/json-render/index.ts`
  - Export all public APIs

### Phase 2: Unified Renderer
**Gate:** Renderer renders base components correctly

- [ ] 2a: Create `src/bedrock/json-render/components/base/` React implementations
  - Stack.tsx, Grid.tsx, Container.tsx, Spacer.tsx
  - Text.tsx, Metric.tsx, Badge.tsx, Progress.tsx

- [ ] 2b: Create `src/bedrock/json-render/registry.ts`
  - ComponentRegistry class
  - register() and get() methods
  - listAll() for System Settings

- [ ] 2c: Create `src/bedrock/json-render/JsonRenderer.tsx`
  - Unified renderer component
  - Recursive element rendering
  - Error boundary for unknown components

- [ ] 2d: Visual verification with test tree
  - Screenshot: `screenshots/2d-base-components.png`

### Phase 3: SignalsCatalog Migration
**Gate:** ExperienceConsole renders identically before/after

- [ ] 3a: Refactor `signals-catalog.ts` to use createCatalog()
  - Add `signals:` namespace prefix
  - Move shared components to base (MetricCard → base:Metric)
  - Keep domain-specific (QualityGauge, FunnelChart)

- [ ] 3b: Create `src/bedrock/json-render/components/signals/` implementations
  - Migrate from ExperienceConsole/json-render/

- [ ] 3c: Update signals-transform.ts for namespaced types

- [ ] 3d: Update SproutSignalsPanel.tsx to use JsonRenderer

- [ ] 3e: Visual verification
  - Screenshot: `screenshots/3e-signals-migrated.png`

### Phase 4: QualityAnalyticsCatalog Migration
**Gate:** QualityAnalyticsSection renders identically

- [ ] 4a: Refactor quality-analytics-catalog.ts
- [ ] 4b: Create components/quality-analytics/
- [ ] 4c: Update QualityAnalyticsSection.tsx
- [ ] 4d: Visual verification
  - Screenshot: `screenshots/4d-quality-analytics-migrated.png`

### Phase 5: ModelAnalyticsCatalog Migration
**Gate:** Model analytics panel renders identically

- [ ] 5a: Refactor model-analytics-catalog.ts
- [ ] 5b: Create components/model-analytics/
- [ ] 5c: Update consumers
- [ ] 5d: Visual verification
  - Screenshot: `screenshots/5d-model-analytics-migrated.png`

### Phase 6: AttributionCatalog Migration
**Gate:** AttributionDashboard renders identically

- [ ] 6a: Refactor attribution-catalog.ts
- [ ] 6b: Create components/attribution/
- [ ] 6c: Update AttributionDashboard.tsx and AttributionPanel.tsx
- [ ] 6d: Visual verification
  - Screenshot: `screenshots/6d-attribution-migrated.png`

### Phase 7: ScoreAttributionCatalog Migration
**Gate:** Score attribution panel renders identically

- [ ] 7a: Refactor score-attribution-catalog.ts
- [ ] 7b: Create components/score-attribution/
- [ ] 7c: Update consumers
- [ ] 7d: Visual verification
  - Screenshot: `screenshots/7d-score-attribution-migrated.png`

### Phase 8: OverrideHistoryCatalog Migration
**Gate:** Override history panel renders identically

- [ ] 8a: Refactor override-history-catalog.ts
- [ ] 8b: Create components/override-history/
- [ ] 8c: Update consumers
- [ ] 8d: Visual verification
  - Screenshot: `screenshots/8d-override-history-migrated.png`

### Phase 9: QualityCatalog (Primitives) Migration
**Gate:** QualityBreakdownPanel renders identically

- [ ] 9a: Refactor bedrock/primitives/QualityBreakdown/quality-catalog.ts
- [ ] 9b: Create components/quality-breakdown/
- [ ] 9c: Update QualityBreakdownPanel.tsx
- [ ] 9d: Visual verification
  - Screenshot: `screenshots/9d-quality-breakdown-migrated.png`

### Phase 10: ResearchCatalog Migration
**Gate:** SproutFinishingRoom DocumentViewer renders identically

- [ ] 10a: Refactor SproutFinishingRoom/json-render/catalog.ts
- [ ] 10b: Create components/research/
- [ ] 10c: Update DocumentViewer.tsx
- [ ] 10d: Visual verification
  - Screenshot: `screenshots/10d-research-migrated.png`

### Phase 11: System Settings UI
**Gate:** Component browser displays all registered components

- [ ] 11a: Create ComponentCatalogBrowser.tsx
  - List all namespaces
  - Show components per namespace
  - Display component metadata (props, category, agentHint)

- [ ] 11b: Wire into SystemSettings gear menu

- [ ] 11c: Visual verification
  - Screenshot: `screenshots/11c-catalog-browser.png`

### Phase 12: Cleanup & Documentation
**Gate:** All old code removed, docs updated

- [ ] 12a: Remove duplicate RenderElement/RenderTree definitions
- [ ] 12b: Remove old per-console Renderer components
- [ ] 12c: Update JSON_RENDER_PATTERN_GUIDE.md with factory pattern
- [ ] 12d: Run code-simplifier on all new/modified files
- [ ] 12e: Final build verification

### Phase 13: E2E Verification
**Gate:** All E2E tests pass with zero critical console errors

- [ ] 13a: Create tests/e2e/json-render-factory.spec.ts
  - Test base component rendering
  - Test namespaced component resolution
  - Test catalog browser UI
  - Console error monitoring

- [ ] 13b: Run full E2E suite
- [ ] 13c: Complete REVIEW.html with all screenshots

---

## Success Criteria

### Sprint Complete When:
- [ ] All 13 phases completed with verification
- [ ] All 8 catalogs migrated to factory pattern
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] E2E tests pass with zero critical console errors
- [ ] Code-simplifier applied to all new files
- [ ] Build and lint pass
- [ ] JSON_RENDER_PATTERN_GUIDE.md updated

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without screenshot evidence
- ❌ Any consumer renders differently after migration
- ❌ DEX compliance test fails
- ❌ Critical console errors in E2E tests

---

## Rollback Strategy

1. **Feature flag:** Add `USE_UNIFIED_RENDERER` to control migration
2. **Preserve old code:** Don't delete until all consumers verified
3. **Revert capability:** Each phase is atomic, can revert individually
4. **No data migration:** Pure code refactor, no data loss risk

---

## Post-Sprint Protocol Updates

After sprint completion, update:
1. **Grove Execution Protocol** — Factory usage patterns
2. **CLAUDE.md** — json-render factory documentation
3. **Developer role** — Factory component creation workflow
4. **Code-simplifier rules** — Consistency checks
5. **Sprint template** — "Does this need new json-render components?" checkpoint

---

## References

- Notion: https://www.notion.so/2ec780a78eef8153aba8e93600950b2f
- Pattern Guide: `docs/JSON_RENDER_PATTERN_GUIDE.md`
- v1.5 Agent Queue: https://www.notion.so/2ee780a78eef81d59f93ca9b29b7cab5

---

*This contract is binding. Deviation requires explicit human approval.*
