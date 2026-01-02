# The Trellis Architecture: Bedrock Implementation Addendum

**Version:** 1.1  
**Date:** December 30, 2025  
**Status:** Approved Addition to First Order Directives  
**Context:** Implementation guidance for the Bedrock branch

---

## Purpose of This Addendum

The First Order Directives establish *what* we build. This addendum establishes *how* we implement it in the `bedrock` branch—the clean-slate reference implementation of Grove's administrative and exploration surfaces.

This addendum does not replace the First Order Directives. It extends them with concrete implementation patterns.

---

## The Strangler Fig Decision

As of December 2025, Grove maintains two parallel administrative implementations:

| Branch | Status | Purpose |
|--------|--------|---------|
| `/foundation` (legacy) | FROZEN | Powers Genesis marketing, prototype UX |
| `/bedrock` (new) | ACTIVE | Reference implementation, DEX-native |

**Why parallel build instead of refactor:**

1. AI and humans write clean new code better than they surgically refactor tangled existing code
2. No risk of breaking Genesis/marketing while building
3. Clean architectural decisions aren't compromised by "well, this is already here..."
4. Clear milestone: when Bedrock feature-matches legacy, flip the switch

**The strangler fig pattern:** Build new alongside old, prove it works, migrate traffic, deprecate legacy.

---

## Bedrock's Relationship to the DEX Stack

Bedrock is the **canonical implementation** of the DEX Stack standards. Every pattern in Bedrock must pass the four tests:

### I. Declarative Sovereignty — Implementation

```
DIRECTIVE: Domain expertise belongs in configuration, not code.

BEDROCK IMPLEMENTATION:
├── All console behaviors defined in JSON configuration
├── Navigation tree declaratively specified
├── Copilot actions configurable per console
├── Object schemas define valid operations
└── No exploration paths hardcoded in TypeScript

COMPLIANCE TEST:
"Can a non-technical domain expert alter behavior by editing a config file?"
If NO → feature is incomplete
```

### II. Capability Agnosticism — Implementation

```
DIRECTIVE: Architecture must never assume model capability.

BEDROCK IMPLEMENTATION:
├── Copilot uses hybrid model selection (local/cloud)
├── Schema validation rejects invalid patches
├── Human checkpoint before mutations
├── Confidence scoring surfaces uncertainty
└── Graceful degradation when models fail

COMPLIANCE TEST:
"Does the system break if the model hallucinates?"
If YES → architecture is incomplete
```

### III. Provenance as Infrastructure — Implementation

```
DIRECTIVE: A fact without an origin is a bug.

BEDROCK IMPLEMENTATION:
├── All objects use GroveObject schema with createdBy
├── Version history tracks every modification
├── Sprouts maintain full attribution chains
├── Copilot edits tagged with model/session
└── Every displayed fact traces to source

COMPLIANCE TEST:
"Can we answer 'who changed this and when'?"
If NO → it's a bug
```

### IV. Organic Scalability — Implementation

```
DIRECTIVE: Structure must precede growth, but not inhibit it.

BEDROCK IMPLEMENTATION:
├── New object types inherit all infrastructure
├── BedrockLayout works for any console
├── Copilot context protocol is extensible
├── Navigation supports arbitrary nesting
└── No artificial limits on objects/relationships

COMPLIANCE TEST:
"Can new object types use this feature without code changes?"
If NO → architecture is incomplete
```

---

## The Object Model Boundary

**Critical architectural insight for implementation:**

### Sprouts = Knowledge Lifecycle (Write Path)

Every content change flows through Sprout:
- Document upload → Sprout creation
- Claim extraction → Sprout claims
- Contradiction detected → Sprout flag
- Human validation → Sprout promotion
- Deprecation → Sprout archive

**Sprout is the atomic unit of knowledge change.**

### DEX Objects = Processing Infrastructure (Read Path)

Organize how validated Sprouts surface:
- Hub: Where Sprouts live
- Journey: How users traverse Sprouts
- Node: Waypoints surfacing specific Sprouts
- Lens: Which Sprouts to emphasize
- Moment: When to surface Sprouts

**This boundary is inviolable.** Bedrock consoles organize around these categories.

---

## The Canonical Console Pattern

Every Bedrock console follows this exact structure:

```
┌──────────────────────────────────────────────────────────────┐
│ Console Header (title, description, actions)                 │
├──────────────────────────────────────────────────────────────┤
│ Metrics Row (4-6 key stats, always visible)                 │
├────────────┬─────────────────────────┬──────────────────────┤
│ Navigation │ Content Area            │ Inspector + Copilot  │
│ (240px)    │ (flex)                  │ (360px)              │
│            │                         │                      │
│ Object     │ Grid/List/Editor        │ Detail View          │
│ Collection │ (context-dependent)     │ + AI Suggestions     │
│            │                         │ + Quick Actions      │
└────────────┴─────────────────────────┴──────────────────────┘
```

**Why this pattern:**
1. Consistency: Users learn once, apply everywhere
2. Copilot slot: AI assistance built into every surface
3. Inspector integration: Context-aware detail always available
4. Metrics visibility: Operational awareness without navigation
5. DEX compliance: Structure supports growth without inhibiting it

---

## The Copilot Standard

Every console includes a Copilot implementing the vision from `copilot-configurator-vision.md`:

**Model Selection (Ratchet-aligned):**
1. Structured edits ("set X to Y") → Local 7B (instant, free, private)
2. Creative generation → Local with cloud fallback
3. Complex reasoning → Cloud API

**Context Protocol:**
- Copilot sees current console, selected object, view state
- Schema constrains valid outputs
- Invalid patches rejected before display
- User explicitly applies changes

**The Superposition Collapse:**
The Trellis provides superposition collapse for the Copilot. User says something ambiguous → model generates interpretations → schema validates possibilities → invalid rejected → valid presented for selection.

---

## Implementation Sequence

Bedrock builds features in this order:

### Sprint 0: Infrastructure
- BedrockLayout (canonical structure)
- BedrockNav (declarative navigation)
- BedrockInspector (context-aware detail)
- BedrockCopilot (unified AI assistant)
- Shared component library

### Sprint 1: Sprout Queue
First complete console. Proves the pattern. Most critical to knowledge lifecycle thesis.

### Sprints 2+: Feature Conveyor
All remaining features follow the production protocol:
1. Audit legacy → Document what exists
2. Design console → Apply BedrockLayout
3. Implement primitives → Build missing components
4. Wire Copilot → Define context and actions
5. Test compliance → Verify against DEX standards
6. Document → Update specs with learnings

---

## Cross-Reference Table

| Document | Role | Bedrock Must... |
|----------|------|-----------------|
| `The_Trellis_Architecture__First_Order_Directives.md` | Constitutional foundation | Pass all four tests |
| `Kinetic_Framework_Strategic_Vision.md` | Strategic context | Enable framework extraction |
| `copilot-configurator-vision.md` | Copilot implementation guide | Follow hybrid model pattern |
| `grove-object.ts` | Data model | Use GroveObject for all entities |
| `GROVE_FOUNDATION_REFACTOR_SPEC.md` | Feature inventory | Implement all proven features |
| `Bedrock_Architecture_Specification.md` | Implementation detail | Follow console pattern |

---

## The Meta-Pattern

> *"We are not just building software; we are codifying the physics of Augmented Cognition."*

Bedrock is the demonstration that the First Order Directives are implementable:

- Declarative Sovereignty → All behavior in config
- Capability Agnosticism → Copilot works with any model
- Provenance as Infrastructure → Every change tracked
- Organic Scalability → New types inherit everything

When we demo Bedrock, we're showing what exploration architecture looks like when built right.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12 | Jim | Original First Order Directives |
| 1.1 | 2025-12-30 | Jim + Claude | Bedrock Implementation Addendum |

---

*This addendum extends the First Order Directives for the Bedrock implementation. The original directives remain the constitutional foundation.*
