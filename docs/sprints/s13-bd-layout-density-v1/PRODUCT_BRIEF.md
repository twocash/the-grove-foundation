# Product Brief: Declarative Layout Density

**Version:** 1.0
**Status:** Draft
**Sprint Target:** S13-BD-LayoutDensity-v1
**PM:** Product Manager Agent
**Reviewed by:** UX Chief, UI/UX Designer
**Notion Source:** https://www.notion.so/2ec780a78eef815d8669fd491d9e99af

---

## Executive Summary

The json-render system currently outputs content with no layout controls, forcing every consumer to use fragile CSS hacks to apply spacing. This feature introduces a **declarative layout density system** that makes spacing configuration a first-class citizen, allowing users to customize density per-grove or per-console without code changes.

## Problem Statement

### Current State
Every dashboard that uses `<Renderer>` must wrap it with CSS hacks:

```typescript
// Current workaround (fragile)
<div className="[&_.json-render-root]:space-y-6">
  <Renderer tree={tree} registry={registry} />
</div>
```

### Problems This Creates
1. **Inconsistency** - Each dashboard picks its own spacing values
2. **Fragility** - Relies on internal class names that could change
3. **No user control** - Values are hard-coded by developers
4. **Maintenance burden** - Spacing logic scattered across codebase
5. **DEX violation** - Behavior locked in code, not configurable

### Evidence
Discovered during Attribution Dashboard hotfix (Jan 2026). The pattern `[&_.json-render-root]:space-y-6` appears in multiple places and represents technical debt.

## Proposed Solution

Implement a **three-phase declarative layout density system**:

### Phase 1: Renderer Props (This Sprint)
Add a `layout` prop to the Renderer component with density presets:

```typescript
<Renderer
  tree={tree}
  registry={registry}
  layout={{
    density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
    containerPadding: 'p-6',
    sectionGap: 'space-y-4'
  }}
/>
```

### Phase 2: Context + Persistence (Future)
- `GroveLayoutProvider` context for inheritance
- localStorage/Supabase persistence
- Experience Console UI for configuration

### Phase 3: Full GroveObject (Future)
- `layout-config` GroveObject type
- Per-lens overrides
- Export/import with grove

**This sprint delivers Phase 1** - the foundational API that enables Phases 2 and 3.

### User Value Proposition

| User | Benefit |
|------|---------|
| **Developers** | Clean API, no more CSS hacks |
| **Gardeners** | Configure density without code (Phase 2+) |
| **Explorers** | Consistent, comfortable reading experience |

### Strategic Value

1. **Eliminates technical debt** - Removes scattered CSS hacks
2. **DEX foundation** - Creates declarative configuration point
3. **Substrate for future work** - Enables agent-configurable UI
4. **Pattern establishment** - First example of declarative UI configuration

---

## Scope

### In Scope (v1.0 - This Sprint)

- [ ] `LayoutConfig` TypeScript interface with density presets
- [ ] `layout` prop added to `<Renderer>` component
- [ ] Three density presets: `compact`, `comfortable`, `spacious`
- [ ] CSS token system for spacing values
- [ ] Default density applied when no prop provided
- [ ] Unit tests for all density modes
- [ ] Migration guide for existing CSS hacks
- [ ] Documentation in component storybook

### Explicitly Out of Scope (Future Sprints)

| Deferred | Rationale | Target |
|----------|-----------|--------|
| GroveLayoutProvider context | Phase 2 feature | S14+ |
| Persistence (localStorage/Supabase) | Requires UI for config | S14+ |
| Experience Console "Appearance" tab | UI work beyond current scope | S14+ |
| Per-lens density overrides | Requires Phase 2 foundation | S15+ |
| layout-config GroveObject | Full DEX implementation | S15+ |

---

## User Flows

### Flow 1: Developer Applies Density (Primary)

1. Developer imports Renderer component
2. Developer adds `layout` prop with desired density
3. Renderer applies appropriate spacing tokens
4. Content renders with consistent spacing
5. No CSS hacks needed

```typescript
// Before (fragile)
<div className="[&_.json-render-root]:space-y-6">
  <Renderer tree={tree} registry={registry} />
</div>

// After (declarative)
<Renderer
  tree={tree}
  registry={registry}
  layout={{ density: 'comfortable' }}
/>
```

### Flow 2: Default Behavior (Fallback)

1. Developer uses Renderer without layout prop
2. System applies default density ('comfortable')
3. Existing dashboards work without changes
4. Gradual migration possible

---

## Technical Considerations

### Architecture Alignment

| Pattern | Alignment |
|---------|-----------|
| **json-render system** | Extends existing Renderer API |
| **Bedrock primitives** | Uses Tailwind token system |
| **GroveObject model** | Prepares for layout-config object (Phase 3) |
| **Factory pattern** | Consoles inherit density automatically |

### Implementation Approach

```typescript
// src/bedrock/json-render/types.ts
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

export interface LayoutConfig {
  density: LayoutDensity;
  containerPadding?: string;  // Override: 'p-4' | 'p-6' | 'p-8'
  sectionGap?: string;        // Override: 'space-y-2' | 'space-y-4' | 'space-y-6'
  cardGap?: string;           // Override: 'gap-2' | 'gap-4' | 'gap-6'
}

// Preset definitions
export const DENSITY_PRESETS: Record<LayoutDensity, Required<Omit<LayoutConfig, 'density'>>> = {
  compact: {
    containerPadding: 'p-3',
    sectionGap: 'space-y-2',
    cardGap: 'gap-2'
  },
  comfortable: {
    containerPadding: 'p-6',
    sectionGap: 'space-y-4',
    cardGap: 'gap-4'
  },
  spacious: {
    containerPadding: 'p-8',
    sectionGap: 'space-y-6',
    cardGap: 'gap-6'
  }
};
```

### Hybrid Cognition Requirements

- **Local (routine):** N/A - Pure UI, no model involvement
- **Cloud (pivotal):** N/A - No AI processing needed

### Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| json-render system | ✅ Exists | Extending existing API |
| Tailwind CSS | ✅ Exists | Using token system |
| Bedrock primitives | ✅ Exists | Consistent with existing patterns |

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Layout via `layout` prop, not code changes; presets defined in config | `DENSITY_PRESETS` object is the single source of truth |
| **Capability Agnosticism** | Pure UI concern, works with any model or no model | No AI/model dependency whatsoever |
| **Provenance as Infrastructure** | Phase 1: N/A (no persistence). Phase 2+: Track who changed layout, when | Future: `layout-config` GroveObject with timestamps |
| **Organic Scalability** | New density presets added without code changes to consumers | Add to `DENSITY_PRESETS`, all Renderers inherit |

---

## Advisory Council Input

### Consulted Advisors

- **Park (feasibility):**
  - ✅ Pure CSS/React implementation - no technical risk
  - ✅ Tailwind tokens are proven, performant approach
  - ✅ No new dependencies required
  - **Verdict:** "This is straightforward UI work. Ship it."

- **Adams (engagement):**
  - ✅ User control creates ownership feeling
  - ✅ Live preview (Phase 2) = immediate feedback
  - ✅ Personalization supports exploration mindset
  - **Verdict:** "Density choice is a meaningful micro-decision. Good."

- **Short (narrative UI):**
  - ✅ Reading comfort affects engagement with content
  - ✅ Different content types benefit from different densities
  - **Verdict:** "Analytics dashboards need `comfortable`, data tables need `compact`."

### Known Tensions

| Tension | Resolution |
|---------|------------|
| Ship Phase 1 now vs. wait for full Phase 3 | Phase 1 creates foundation; incremental delivery preferred |
| Default density choice | `comfortable` as default - optimizes for reading, not data density |
| Override granularity | Phase 1: component-level only. Phase 2+: per-lens overrides |

---

## Success Metrics

### Phase 1 (This Sprint)

| Metric | Target | Measurement |
|--------|--------|-------------|
| CSS hacks eliminated | 100% | Grep for `[&_.json-render` patterns |
| API adoption | All new Renderers use `layout` prop | Code review |
| Test coverage | 90%+ for layout logic | Jest coverage report |
| Documentation | Complete storybook examples | Visual verification |

### Future Phases

| Metric | Target | Phase |
|--------|--------|-------|
| User density preference set | 50% of active users | Phase 2 |
| Per-lens overrides used | 20% of custom lenses | Phase 3 |

---

## Appendix: UX Concepts

### Density Visual Comparison

```
COMPACT                 COMFORTABLE              SPACIOUS
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │                 │    │                 │
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │  ▪ ▪ ▪ ▪ ▪ ▪   │    │                 │
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │                 │    │    ▪   ▪   ▪    │
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │  ▪ ▪ ▪ ▪ ▪ ▪   │    │                 │
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │                 │    │    ▪   ▪   ▪    │
│▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪│    │  ▪ ▪ ▪ ▪ ▪ ▪   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
  Data tables            Dashboards             Reading/prose
  Admin lists            Default view           Documentation
```

### Phase 2 UI Concept (Future Reference)

```
┌─────────────────────────────────────────┐
│ Appearance Settings                     │
├─────────────────────────────────────────┤
│                                         │
│ Layout Density                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Compact │ │Comfort- │ │ Spacious│    │
│ │   ▪▪▪   │ │  able   │ │         │    │
│ │   ▪▪▪   │ │  ▪ ▪ ▪  │ │  ▪   ▪  │    │
│ │   ▪▪▪   │ │  ▪ ▪ ▪  │ │         │    │
│ └─────────┘ └────●────┘ └─────────┘    │
│              (selected)                 │
│                                         │
│ ☐ Apply per-lens overrides             │
│                                         │
└─────────────────────────────────────────┘
```

---

## UX Chief Initial Assessment

**Verdict:** ✅ **APPROVED FOR PM REVIEW**

This feature:
- Solves a real technical debt problem
- Aligns with all 4 DEX pillars
- Creates substrate for future agentic work
- Has low technical risk (Park validated)
- Supports user engagement (Adams validated)

**Recommendation:** Proceed to PM review. Phase 1 scope is appropriate for medium-effort sprint.

---

**Drafted by:** UX Chief
**Date:** 2026-01-18
**Next Step:** PM Review for completeness and roadmap fit
