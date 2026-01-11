# Bedrock Information Architecture

**Version:** 1.0
**Date:** January 2026
**Status:** Canonical Reference

---

## Purpose

This document defines the information architecture for the Bedrock workspace—the knowledge curation layer of the Grove Foundation platform. It establishes the conceptual model, navigation structure, and design primitives that govern how users interact with knowledge lifecycle management.

The goal is **self-evident software**: interfaces so aligned with natural mental models that they require no manual.

---

## The Grove Metaphor

The Grove Foundation's entire architecture is built on a horticultural metaphor that maps perfectly to knowledge work:

| Metaphor | System Concept | What It Means |
|----------|----------------|---------------|
| **Grove** | The platform ecosystem | A living system where knowledge grows |
| **Trellis** | The architecture | Structure that enables growth without constraining it |
| **Sprout** | Atomic research unit | A planted question that grows into understanding |
| **Nursery** | Immature knowledge space | Where sprouts are cultivated before maturity |
| **Garden** | Mature knowledge corpus | Validated knowledge that feeds exploration |
| **Lens** | Perspective | A way of seeing that shapes what's noticed |
| **Experience** | Configured delivery | How exploration feels to the user |

This metaphor is not decoration—it is **architecture**. Every interface decision should be testable against it: *"Would a gardener understand this?"*

---

## The Knowledge Lifecycle

Knowledge in Grove follows a natural lifecycle from intent to integration:

```
    SPARK                    SPROUT                   GROWING
      │                        │                         │
      │  "I want to           │  Planted in            │  Research agents
      │   understand X"        │  the system            │  cultivating
      │                        │                         │
      ▼                        ▼                         ▼
┌──────────┐            ┌──────────┐              ┌──────────┐
│  Intent  │───────────▶│  Nursery │─────────────▶│  Nursery │
│ declared │            │ (planted)│              │ (growing)│
└──────────┘            └──────────┘              └──────────┘
                                                        │
                                                        ▼
                        ┌──────────┐              ┌──────────┐
                        │  Garden  │◀─────────────│  Review  │
                        │ (mature) │   accepted   │  (ready) │
                        └──────────┘              └──────────┘
                              │
                              ▼
                    Feeds LLM responses
                    in /explore
```

### Lifecycle States

| State | Location | Description | User Experience |
|-------|----------|-------------|-----------------|
| **Planted** | Nursery | Sprout created, queued for research | "I asked a question" |
| **Growing** | Nursery | Agents actively researching | "Research in progress" |
| **Ready** | Nursery | Research complete, awaiting review | "Ready for me to review" |
| **Mature** | Garden | Accepted into corpus | "Part of the knowledge base" |
| **Archived** | Garden (archived) | Deprecated but preserved | "Historical reference" |

### The Maturity Test

> **A sprout graduates to the Garden when it can feed exploration.**

This is the single criterion: Can this knowledge be used in LLM responses? If yes, it belongs in the Garden. If not yet, it remains in the Nursery.

---

## The Visibility Model

Access to Bedrock features follows a progressive disclosure pattern based on user role:

```
                    ┌─────────────────────────────────────────┐
                    │              EXPERIENCE                 │
                    │        (configured delivery)            │
                    │                                         │
                    │  System prompt · Thesis · Architect     │
                    │  config · Quality gates                 │
                    │                                         │
                    │            ┌─────────┐                  │
                    │            │  Admin  │                  │
                    │            └─────────┘                  │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────┴───────────────────────┐
                    │         LENSES  ·  PROMPTS              │
                    │        (cultivation tools)              │
                    │                                         │
                    │  Perspectives · Templates · Patterns    │
                    │                                         │
                    │         ┌──────────────┐                │
                    │         │  Cultivator  │                │
                    │         └──────────────┘                │
                    └─────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────┴───────────────────────┐
│                NURSERY  ·  GARDEN                           │
│              (knowledge lifecycle)                          │
│                                                             │
│  Sprouts in progress · Mature corpus · Research status      │
│                                                             │
│                    ┌──────────┐                             │
│                    │ Everyone │                             │
│                    └──────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Role Definitions

| Role | Can See | Can Do |
|------|---------|--------|
| **Explorer** | Nursery, Garden | Plant sprouts, review results, explore corpus |
| **Cultivator** | + Lenses, Prompts | Configure perspectives, create templates |
| **Admin** | + Experience | Configure system prompt, thesis, architect settings |

### The Progressive Disclosure Principle

> **Show less, reveal more.**

Users see only what they can act on. Complexity emerges with capability, not by default. An explorer should never see—or be confused by—admin controls.

---

## The Navigation Structure

### Bedrock Workspace Navigation

```
/bedrock
│
├── Dashboard                    ← Overview & health
│   └── Activity feed, system status, quick actions
│
├── ───────────────────────────  (Knowledge Lifecycle)
│
├── Nursery                      ← Sprouts in cultivation
│   └── Planted, growing, ready for review
│   └── Filter by status, age, research type
│   └── Actions: review, promote to Garden, archive
│
├── Garden                       ← Mature corpus
│   └── RAG vectors + graduated sprout outputs
│   └── Search, browse, inspect provenance
│   └── Actions: archive, view usage, trace lineage
│
├── ───────────────────────────  (Cultivation Tools)
│
├── Lenses                       ← Perspectives
│   └── Persona configurations
│   └── How the system "sees" on behalf of users
│
├── Prompts                      ← Templates
│   └── Interaction patterns
│   └── Starting points for exploration
│
├── ───────────────────────────  (Delivery Configuration)
│
└── Experience                   ← THE experience
    └── System prompt (identity, voice, structure)
    └── Thesis (what this grove investigates)
    └── Sprout Architect config (inference, quality gates)
    └── Singleton: one active configuration, versioned
```

### Navigation Groupings

| Group | Purpose | Contains |
|-------|---------|----------|
| **Knowledge Lifecycle** | Where things are by maturity | Nursery, Garden |
| **Cultivation Tools** | How you shape knowledge | Lenses, Prompts |
| **Delivery Configuration** | What gets experienced | Experience |

### URL Structure

```
/bedrock                    → Dashboard
/bedrock/nursery            → Sprouts in cultivation
/bedrock/garden             → Mature corpus
/bedrock/lenses             → Lens management
/bedrock/prompts            → Prompt templates
/bedrock/experience         → Experience configuration
```

---

## The /explore Inspector

When exploring in `/explore`, users see their research activity via an inspector panel:

### The Nursery Badge

A persistent indicator showing the user's active research:

```
┌─────────────────────────────────┐
│  🌱 3                           │  ← Badge: 3 sprouts growing
├─────────────────────────────────┤
│  Expanded view:                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🌱 Witness timeline...    │  │  ← Growing
│  │    ░░░░░░░░░░ 45%         │  │
│  ├───────────────────────────┤  │
│  │ ✓ Email chain analysis    │  │  ← Ready for review
│  │    Ready · Tap to review  │  │
│  ├───────────────────────────┤  │
│  │ 🌱 Deposition conflicts   │  │  ← Growing
│  │    ░░░░░░░░░░░░ 72%       │  │
│  └───────────────────────────┘  │
│                                 │
│  View all in Nursery →          │  ← Deep link to /bedrock/nursery
└─────────────────────────────────┘
```

### Scope Distinction

| Context | What's Shown | Scope |
|---------|--------------|-------|
| /explore inspector | My Nursery | Session or user-scoped |
| /bedrock/nursery | The Nursery | Grove-scoped (all sprouts) |

Same concept, different scope. The metaphor holds at both levels.

---

## Design Primitives

These patterns repeat throughout the Grove architecture:

### 1. Lifecycle State

Things move through defined states toward maturity.

```
Immature ──────────────────────▶ Mature
   │                                │
   │  (cultivation, review,         │
   │   validation)                  │
   │                                │
   ▼                                ▼
Nursery                          Garden
Draft                            Active
Pending                          Published
```

**Application:** Sprouts, system prompts, lenses—all follow this pattern.

### 2. Singleton vs Instance

Some things are unique per grove; others are collections.

| Pattern | Cardinality | Examples |
|---------|-------------|----------|
| **Singleton** | One active per grove | Experience (system prompt), Grove Settings |
| **Instance** | Many per grove | Sprouts, Lenses, Prompts, Journeys |

**Singleton Rules:**
- One active at a time
- Multiple versions exist (history)
- Activating new version archives previous
- Global `is_active` flag

**Instance Rules:**
- Many can be active simultaneously
- Each instance can have versions
- `is_active` scoped to instance, not global

### 3. Progressive Disclosure

Complexity reveals with capability.

```
Consumer ──────▶ Cultivator ──────▶ Architect
    │                │                  │
    │  (sees less)   │  (sees more)     │  (sees all)
    │                │                  │
    ▼                ▼                  ▼
Explore          + Shape            + Configure
```

**Application:** Navigation items, feature visibility, action availability.

### 4. Spatial Logic

Things have a *place* based on their nature.

| Nature | Place | Examples |
|--------|-------|----------|
| **States** | Lifecycle locations | Nursery, Garden |
| **Tools** | Workbenches | Lenses, Prompts |
| **Configuration** | Control rooms | Experience |

Users navigate *to* places, not *through* menus.

### 5. Provenance as Infrastructure

Everything tracks its origin.

```typescript
interface Provenance {
  createdBy: Actor;          // Who/what created this
  createdAt: Timestamp;      // When
  createdFrom?: Reference;   // What it came from
  createdWith?: Context;     // What lens/journey/state
}
```

**The Rule:** A fact without a root is a weed.

---

## The Experience Singleton

The **Experience** console configures THE experience of exploration. It is singular—one active configuration per grove.

### What Experience Contains

| Component | Purpose | Versioned? |
|-----------|---------|------------|
| **System Prompt** | Identity, voice, structure, knowledge, boundaries | Yes |
| **Thesis** | What this grove investigates | Yes |
| **Sprout Architect Config** | Inference rules, quality gates, spawn limits | Yes |
| **Response Behaviors** | Mode (architect/librarian/contemplative), closing style | Yes |

### Experience vs Experiences

| Concept | Meaning |
|---------|---------|
| **Experience** (singular) | THE configured delivery of exploration |
| ~~Experiences~~ (plural) | ❌ Incorrect—implies multiple active configs |

There is one experience. It can be versioned. Only one version is active.

### Version Management

```
Experience
├── v1 (archived)
├── v2 (archived)
├── v3 (ACTIVE) ← Current experience
└── v4 (draft)  ← Work in progress
```

Activating v4 would archive v3. Only one active at a time.

---

## Metaphor Glossary

For consistency across all Grove interfaces and documentation:

| Term | Definition | Anti-pattern |
|------|------------|--------------|
| **Grove** | The complete ecosystem; a tenant/organization's space | "Workspace," "Account" |
| **Trellis** | The architectural framework | "Framework," "Platform" |
| **Sprout** | An atomic unit of research intent | "Query," "Request," "Task" |
| **Nursery** | Where immature sprouts are cultivated | "Queue," "Pipeline," "Inbox" |
| **Garden** | The mature knowledge corpus | "Database," "Repository," "Store" |
| **Lens** | A configured perspective | "Persona," "Role," "Mode" |
| **Experience** | The configured delivery of exploration | "Settings," "Configuration" |
| **Cultivator** | A user who shapes knowledge | "Editor," "Curator" |
| **Spark** | The initial intent before it becomes a sprout | "Input," "Prompt" |
| **Harvest** | The act of reviewing/accepting research | "Review," "Approval" |

### Usage Examples

**Correct:**
- "Your sprout is growing in the nursery"
- "This insight has matured to the garden"
- "Configure the experience for this grove"

**Incorrect:**
- "Your query is in the processing queue"
- "This data has been added to the database"
- "Update the settings for this workspace"

---

## Migration from Current State

The current Bedrock implementation uses different terminology:

| Current | Proposed | Migration Notes |
|---------|----------|-----------------|
| Pipeline | **Garden** | Rename route, update nav, preserve functionality |
| Garden (sprouts) | **Nursery** | Rename route, update nav, reframe purpose |
| Experiences (plural) | **Experience** (singular) | Rename route, update nav, enforce singleton |
| Dashboard | Dashboard | Keep as-is |
| Lenses | Lenses | Keep as-is |
| Prompts | Prompts | Keep as-is |

### Route Changes

```
Current                    Proposed
───────                    ────────
/bedrock/pipeline    →     /bedrock/garden
/bedrock/garden      →     /bedrock/nursery
/bedrock/experiences →     /bedrock/experience
```

### Component Renames

```
Current                    Proposed
───────                    ────────
PipelineMonitor.tsx  →     GardenConsole.tsx
GardenConsole.tsx    →     NurseryConsole.tsx
ExperiencesConsole/  →     ExperienceConsole/
```

---

## Validation Checklist

Before implementing any Bedrock interface, verify:

- [ ] **Metaphor coherence:** Would a gardener understand this term?
- [ ] **Lifecycle clarity:** Is the maturity state obvious?
- [ ] **Role appropriateness:** Does visibility match capability?
- [ ] **Singleton/Instance correctness:** Is cardinality correct?
- [ ] **Spatial logic:** Is this a place, tool, or configuration?
- [ ] **Provenance present:** Can users trace origins?
- [ ] **Progressive disclosure:** Is complexity earned, not imposed?

---

## The Art

What makes this architecture elegant:

1. **Metaphor coherence** — Every term reinforces the same mental model
2. **Self-evidence** — Interfaces explain themselves through naming
3. **Natural hierarchy** — Lifecycle → Tools → Configuration feels inevitable
4. **Scalable simplicity** — The same patterns work at every level
5. **Human-centered language** — No jargon, no tech-speak, no acronyms

> *The best interface is one that disappears. Users should feel like they're tending a garden, not operating software.*

---

## Provenance

| Field | Value |
|-------|-------|
| **Author** | Jim Calhoun / Claude |
| **Created** | 2026-01-10 |
| **Context** | Bedrock IA refinement session |
| **Methodology** | Collaborative design dialogue |
| **Status** | Canonical reference for Bedrock development |

---

*This document is the source of truth for Bedrock information architecture. All implementation should reference it. Updates require explicit versioning.*
