# Sprint: Grove Object Model v1

**Sprint ID:** grove-object-model-v1  
**Status:** Planning  
**Time Budget:** TBD (architectural initiative)  
**Predecessor:** card-system-unification-v1 (Sprint 6)  

---

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [STRATEGIC_INSIGHT.md](./STRATEGIC_INSIGHT.md) | Why this pattern matters | ✅ |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | ✅ |
| [SPEC.md](./SPEC.md) | Requirements & scope | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical approach | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes | ✅ |
| [DECISIONS.md](./DECISIONS.md) | ADRs for key choices | ✅ |
| [SPRINTS.md](./SPRINTS.md) | Story breakdown | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | ✅ |

---

## Vision Statement

**Cards are containers for organizing definitions of objects in the Grove.**

Lenses, Journeys, Personas, Sprouts, Hubs, Nodes—these are all instances of a unified abstraction: **GroveObject**. Users (and AI) should be able to find, sort, filter, favorite, modify, and extend these objects infinitely.

This sprint establishes the **Object Model pattern** that enables:

1. **Unified type system** — All Grove objects inherit from a common schema
2. **Rich metadata** — Favorites, tags, provenance, timestamps on everything
3. **Generic rendering** — One card component that dispatches by object type
4. **Collection operations** — Find, filter, sort across any object type
5. **Infinite extensibility** — New object types defined in config, not code

---

## The DEX Alignment

This is potentially **Pattern 7: Object Model** — or an extension of Pattern 3 (Narrative Schema).

The core DEX question: *Can a non-technical domain expert define a new Grove object type by editing a schema file, without recompiling the application?*

If yes, we've achieved Declarative Sovereignty for the object model itself.

---

## Why Now

Sprint 6 (card-system-unification) established visual consistency through tokens. But cards are still separate components (LensCard, JourneyCard) with separate props and separate data flows.

As Grove grows, this fragments:
- Admin interfaces need UserCard, ConfigCard, AnalyticsCard
- New exploration objects (Sprouts, Hubs) need new card components
- AI-generated object types have nowhere to render

The Object Model creates the **infrastructure layer** where all objects are first-class citizens.

---

## Success Criteria (Draft)

- [ ] GroveObject base type exists with common metadata
- [ ] Existing types (Lens, Journey, Persona) extend GroveObject
- [ ] GroveObjectCard renders any GroveObject by type dispatch
- [ ] Collection hooks (useGroveObjects) support filter/sort/search
- [ ] At least one new object type added via config (no code)
- [ ] Favorites work across all object types

---

*Created: December 2024*
*Sprint Series: Foundation Architecture*
