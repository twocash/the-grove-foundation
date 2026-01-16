# Terminology Migration: Hub/Journey/Node → 4D Experience Model

**Status:** 📝 draft-spec
**Priority:** High (blocking regression in design systems)
**Created:** 2026-01-14
**Triggered by:** Sprout Finishing Room design review

---

## Problem Statement

The deprecated MVP terminology (Hub, Journey, Node) continues to appear in new design work and documentation, causing:

1. **Design Regression** - New components reference outdated concepts
2. **Developer Confusion** - Mixed terminology in codebase
3. **Technical Debt** - Inconsistent data models between old and new systems

This terminology migration was supposed to happen during the 4D experience architecture transition but was never completed systematically.

---

## Scope Analysis

### Documentation (457 files contain deprecated terms)

| Location | Count | Priority |
|----------|-------|----------|
| `docs/design-system/` | High | Critical - blocks new designs |
| `docs/sprints/` | Medium | Historical - can remain for context |
| `CLAUDE.md` | High | Primary context document |

### Source Code (68 files contain deprecated terms)

| Location | Count | Priority |
|----------|-------|----------|
| `src/core/schema/` | High | Type definitions |
| `src/core/engine/` | High | Business logic |
| `src/foundation/` | Medium | Admin consoles |
| `src/surface/` | Medium | User-facing UI |

---

## 4D Experience Model Terminology

### Deprecated → New Mapping

| Old Term | New Term | Description |
|----------|----------|-------------|
| **Hub** | **Experience Path** | The declarative route through content |
| **Journey** | **Experience Sequence** | Ordered collection of experiences |
| **Node** | **Experience Moment** | Single interaction point |
| **Topic Hub** | **Cognitive Domain** | Knowledge area for routing |
| **journeyId** | **sequenceId** | Identifier for experience sequence |
| **nodeId** | **momentId** | Identifier for experience moment |
| **hubId** | **pathId** or **domainId** | Identifier for path/domain |

### New Provenance Model: Cognitive Routing

Instead of discrete Hub/Journey/Node fields, the 4D model uses a unified **Cognitive Routing** object:

```typescript
interface CognitiveRouting {
  path: string;           // Experience path taken
  prompt: string;         // Active prompt/mode
  inspiration: string;    // Triggering context (system, user, random)
  domain?: string;        // Cognitive domain (optional)
}
```

This consolidates provenance into a single, coherent concept that reflects *how* the system arrived at a response, not *which boxes* it checked along the way.

---

## Migration Strategy: Three Independent Sprints

The migration is structured as **three discrete sprints** that can run independently or in parallel. No sprint has blocking dependencies on another.

### Sprint 4D-Docs (Documentation Only)

**Fix Queue:** [4D-Docs](https://www.notion.so/2e9780a78eef8139a2ddd1b4b8c278fd)
**Status:** in-progress
**Risk:** Low
**Dependencies:** None

Update documentation to use 4D Experience Model terminology. No code changes.

| Task | File | Status |
|------|------|--------|
| Update wireframe | `docs/design-system/SPROUT_FINISHING_ROOM_WIREFRAME.md` | ✅ Done |
| Update Figma guide | `docs/design-system/FIGMA_CREATION_GUIDE.md` | ✅ Done |
| Update prototypes | `docs/design-system/prototypes/*.html` | ✅ Done |
| Update design system | `docs/design-system/DESIGN_SYSTEM.md` | ⬜ Pending |
| Audit UI vision | `docs/design-system/UI_VISION_LIVING_GLASS.md` | ⬜ Pending |
| Update context doc | `CLAUDE.md` | ⬜ Pending |
| Create 4D reference | `docs/4D_EXPERIENCE_MODEL.md` | ⬜ Pending |

### Sprint 4D-Schema (Type System)

**Fix Queue:** [4D-Schema](https://www.notion.so/2e9780a78eef81f0b635d116dac8f9be)
**Status:** in-progress
**Risk:** Low
**Dependencies:** None (non-breaking)

Add TypeScript type aliases with deprecation warnings. Old names continue to work.

```typescript
// src/core/schema/experience.ts (new file)

/** @deprecated Use ExperiencePath instead */
export type Hub = ExperiencePath;

/** @deprecated Use ExperienceSequence instead */
export type Journey = ExperienceSequence;

/** @deprecated Use ExperienceMoment instead */
export type Node = ExperienceMoment;

/** @deprecated Use CognitiveDomain instead */
export type TopicHub = CognitiveDomain;
```

| Task | Location | Status |
|------|----------|--------|
| Create experience.ts | `src/core/schema/experience.ts` | ⬜ Pending |
| Add CognitiveRouting | `src/core/schema/sprout.ts` | ⬜ Pending |
| Add deprecation JSDoc | All schema files | ⬜ Pending |
| Export aliases | `src/core/schema/index.ts` | ⬜ Pending |

### Sprint 4D-Codebase (Internal Cleanup)

**Fix Queue:** [4D-Codebase](https://www.notion.so/2e9780a78eef81a2b829c5b479a66649)
**Status:** in-progress
**Risk:** Medium
**Dependencies:** 4D-Schema recommended first (but not blocking)

Rename internal variables, functions, and file names. **No user-facing label changes.**

| Task | Scope | Status |
|------|-------|--------|
| Rename internal vars | Engine files | ⬜ Pending |
| Rename function params | Core utilities | ⬜ Pending |
| Update test fixtures | Test files | ⬜ Pending |
| Preserve UI labels | "Topic Hub" stays in UI | ⚠️ Do Not Change |

**Critical:** The user-facing label "Topic Hub" in RealityTuner and other consoles must NOT change to avoid breaking the working MVP.

---

## Sprint Dependencies Graph

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  4D-Docs    │     │  4D-Schema  │     │ 4D-Codebase │
│ (Low Risk)  │     │ (Low Risk)  │     │ (Med Risk)  │
│             │     │             │     │             │
│ No deps     │     │ No deps     │────▶│ Recommends  │
│             │     │             │     │ 4D-Schema   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    All can run in
                    parallel with
                    Sprout Finishing Room
```

---

## Terminology Quick Reference

| Short Label | Full Term | Replaces |
|-------------|-----------|----------|
| **Path** | Experience Path | Hub |
| **Sequence** | Experience Sequence | Journey |
| **Moment** | Experience Moment | Node |
| **Domain** | Cognitive Domain | Topic Hub |

Use short labels in code, full terms in documentation when clarity needed.

---

## Files Requiring Immediate Attention

### Critical (Design Systems)

1. `docs/design-system/DESIGN_SYSTEM.md`
2. `docs/design-system/UI_VISION_LIVING_GLASS.md`
3. `CLAUDE.md` - Primary agent context

### High Priority (Active Development)

1. `src/core/schema/sprout.ts` - Sprout provenance
2. `src/core/schema/narrative.ts` - Narrative model
3. `src/core/engagement/types.ts` - Engagement tracking

---

## Anti-Pattern Watchlist

When reviewing code/docs, flag these patterns:

```typescript
// ❌ DEPRECATED
hubId: string;
journeyId: string;
nodeId: string;
topicHub: TopicHub;

// ✅ PREFERRED
cognitiveRouting: CognitiveRouting;
experiencePath: string;
momentId: string;
```

```markdown
<!-- ❌ DEPRECATED -->
The user navigates through **hubs** and **journeys** to reach **nodes**.

<!-- ✅ PREFERRED -->
The user follows **experience paths** through **cognitive domains**,
encountering **moments** shaped by their active lens.
```

---

## Success Criteria

1. **No new designs** reference Hub/Journey/Node
2. **CLAUDE.md** accurately reflects 4D model
3. **Type definitions** have deprecation warnings
4. **Design system docs** are fully migrated
5. **Provenance UI** uses Cognitive Routing consistently

---

## Notes for Engineering

When implementing provenance displays:

1. **DO** show "Cognitive Routing" as the provenance section
2. **DO** display Path, Prompt, and Inspiration fields
3. **DO NOT** show Hub, Journey, or Node as separate items
4. **DO** consolidate legacy data into new format at display time

If backend still uses old schema, transform at the UI layer:

```typescript
// Transform legacy provenance to 4D model
function toCognitiveRouting(legacy: LegacyProvenance): CognitiveRouting {
  return {
    path: legacy.journey?.name || 'default',
    prompt: legacy.node?.label || 'exploration',
    inspiration: legacy.hub?.name || 'user query',
    domain: legacy.hub?.id
  };
}
```

---

*Terminology Migration Spec v1.0 — Preventing design regression*
