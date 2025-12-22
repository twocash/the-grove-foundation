# The Trellis Architecture: First Order Directives

**Implementing the Declarative Exploration (DEX) Standard**

Author: Jim Calhoun  
Version: 2.0 (Field-Aware)  
Status: Living Constitution  
Context: The Grove Foundation

---

## 1. The Core Philosophy

**Models are seeds. Fields are soil. Exploration architecture is the trellis.**

We reject the "Model Maximalist" thesis that assumes value resides solely in the size of the LLM. Instead, we adhere to the **DEX Thesis**: Value comes from the *structure of exploration*.

We are building the **Trellis**—the support structure that allows organic intelligence (human and artificial) to climb, branch, and bear fruit without collapsing into chaos.

*Exploration architecture is to the age of AI what information architecture was to the internet. Information architecture made the chaotic early web navigable. Exploration architecture makes AI capability productive.*

---

## 2. The First Order Directive

**Separation of Exploration Logic from Execution Capability.**

- **Exploration Logic (The Trellis):** The declarative definition of *how* we search, *what* constitutes a valid insight, and *where* connections should be made. This is owned by the domain expert and defined in configuration (JSON/YAML).

- **Execution Capability (The Vine):** The raw processing power (LLM, RAG, Code Interpreter) that traverses the structure. This is interchangeable and ephemeral.

**For Engineers & Agents:** Never hard-code an exploration path. If you are writing imperative code to define a journey, you are violating the architecture. Build the *engine* that reads the map; do not build the map into the engine.

---

## 3. The DEX Stack Standards

To contribute to The Grove is to build upon the **DEX Stack**. All contributions must adhere to these four pillars:

### I. Declarative Sovereignty

- **The Rule:** Domain expertise belongs in configuration, not code.
- **The Test:** Can a non-technical lawyer, doctor, or historian alter the behavior of the refinement engine by editing a schema file, without recompiling the application? If no, the feature is incomplete.

### II. Capability Agnosticism

- **The Rule:** The architecture must never assume the capability of the underlying model. Today's frontier model is tomorrow's local script.
- **The Test:** Does the system break if the model creates a "hallucination"? Or does the Trellis catch it? The architecture must function as the "Superposition Collapse" mechanism—the rigid frame that forces probabilistic noise into validated signal.

### III. Provenance as Infrastructure

- **The Rule:** In the DEX stack, a fact without an origin is a bug.
- **The Test:** Every "Sprout" (insight) must maintain an unbroken attribution chain back to its source—including the Field that scoped its generation. We do not just store *what* is known; we store *how* it became known (the specific human-AI interaction that collapsed the wave function) and *where* (the Field context).

### IV. Organic Scalability (The Trellis Principle)

- **The Rule:** Structure must precede growth, but not inhibit it.
- **The Test:** The system must support "serendipitous connection." A trellis does not dictate exactly where a leaf grows, but it dictates the general direction. The architecture must allow for "guided wandering" rather than rigid tunnels.

---

## 4. The Three-Layer Abstraction (DEX Stack)

The Trellis separates concerns into three distinct layers:

### Layer 1: The Engine (The Trellis Frame)

**Status:** Fixed Infrastructure | **Change Velocity:** Low

The engine layer implements the invariant physics of the system. It does not know *what* it is refining, only *how* to refine it.

- **Superposition Collapse:** Human attention transforms probabilistic AI outputs into validated insights
- **Sprout/Card Mechanics:** The atomic units of insight capture
- **Attribution Chains:** Provenance tracking linking every fruit back to its root
- **Field Routing:** Scoping all operations to the active Field context
- **Memory Persistence:** Accumulated context turning isolated sessions into a "Grove"

### Layer 2: The Field (The Substrate)

**Status:** Variable Input | **Change Velocity:** Medium

The Field layer contains bounded knowledge domains. Each Field is a self-contained workspace with its own RAG collection, exploration tools, and accumulated insights. The Trellis can be planted in any Field:

| Field Type | Content | Value Proposition |
|------------|---------|-------------------|
| Grove Research | White papers, specs, architecture | Coherent project knowledge |
| Legal Corpus | Depositions, contracts, case law | Case theory development |
| Academic Lit | Papers, preprints, citations | Synthesis & gap identification |
| Enterprise Knowledge | Slack, Docs, Email archives | Tribal knowledge preservation |
| Composite Field | Merged from 2+ parent Fields | Cross-domain synthesis |

**Key Properties of Fields:**
- Self-contained RAG collection (vector-indexed documents)
- Namespaced entities (`legal.contract-clause`, `grove.strategic-insight`)
- Scoped Sprouts (captured insights belong to their originating Field)
- Attribution metadata (creator, contributors, fork lineage)
- Visibility controls (private, organizational, public)

See `FIELD_ARCHITECTURE.md` for complete Field specification.

### Layer 3: The Configuration (The Conditions)

**Status:** Declarative (DEX) | **Change Velocity:** High

This is the DEX Layer. It is where the "growing conditions" are defined *per Field*. A legal analyst defines a "Contradiction" card type; a biologist defines a "Replication Error" card type. These configurations are Field-scoped.

- **Configuration is Declarative:** Non-developers define behavior through structured data files
- **Configuration is Field-Scoped:** Each Field can have different Lenses, Journeys, Card Definitions
- **Logic Isolation:** Changing the domain (Field) does not require touching the engine code

---

## 5. The DEX Configuration Schemas

The Trellis is shaped by four interconnected schemas—the "genetic code" of a specific Field deployment:

### A. Card Definition Schema
Defines the "Fruit" types—what kind of insights can be harvested in this Field?
- `cardTypes[]` — Valid categories (e.g., "Strategic Insight", "Legal Privilege")
- `validationRules{}` — Logic for what constitutes a valid card
- `displayTemplates{}` — UI rendering instructions
- **Namespace:** `{field-slug}.{card-type-id}`

### B. Relationship Schema
Defines the "Branching" rules—how do nodes connect within this Field?
- `relationTypes[]` — "Supports", "Refutes", "Extends", "Causes"
- `directionality{}` — Directed vs. Bi-directional graph edges
- `autoDetection{}` — Prompts for LLM to suggest connections

### C. Journey Schema
Defines the "Growth Paths"—curated exploration sequences through Field knowledge.
- `journeys[]` — Ordered node sequences with narrative structure
- `entryConditions{}` — When to suggest each journey
- `completionCriteria{}` — What constitutes journey completion
- **Namespace:** `{field-slug}.{journey-id}`

### D. Lens Schema
Defines the "Perspectives"—how the Field speaks to different audiences.
- `lenses[]` — Persona configurations with tone and emphasis
- `arcEmphasis{}` — Narrative arc weighting per lens
- `conversionPaths{}` — Next steps appropriate to each lens
- **Namespace:** `{field-slug}.{lens-id}`

---

## 6. Field-Aware Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE GROVE PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 1: ENGINE (Fixed)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Sprout   │ │ Session  │ │ RAG      │ │ LLM      │ │ Attrib   │  │   │
│  │  │ Manager  │ │ Manager  │ │ Engine   │ │ Router   │ │ Tracker  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                          fieldId required                                   │
│                                   │                                         │
│  ┌────────────────────────────────┼────────────────────────────────────┐   │
│  │                    LAYER 2: FIELDS (Variable)                       │   │
│  │                                │                                    │   │
│  │  ┌──────────────────┐  ┌──────┴───────┐  ┌──────────────────┐      │   │
│  │  │ Grove Foundation │  │ Legal Corpus │  │ Academic Lit     │      │   │
│  │  │ ─────────────────│  │ ─────────────│  │ ─────────────────│      │   │
│  │  │ RAG: grove-docs  │  │ RAG: legal   │  │ RAG: papers      │      │   │
│  │  │ Lenses: 6        │  │ Lenses: 4    │  │ Lenses: 3        │      │   │
│  │  │ Journeys: 5      │  │ Journeys: 8  │  │ Journeys: 12     │      │   │
│  │  │ Sprouts: 127     │  │ Sprouts: 89  │  │ Sprouts: 234     │      │   │
│  │  └──────────────────┘  └──────────────┘  └──────────────────┘      │   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────┐      │   │
│  │  │ Legal-Grove Composite (merged)                           │      │   │
│  │  │ ─────────────────────────────────────────────────────────│      │   │
│  │  │ RAG: merged legal + grove                                │      │   │
│  │  │ Inherited: legal.*, grove.* entities                     │      │   │
│  │  │ Native: legal-grove.* entities                           │      │   │
│  │  └──────────────────────────────────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 LAYER 3: CONFIGURATION (Per Field)                  │   │
│  │                                                                     │   │
│  │  Field: grove-foundation                                            │   │
│  │  ├── grove.strategist-lens          (Lens config)                  │   │
│  │  ├── grove.skeptic-lens             (Lens config)                  │   │
│  │  ├── grove.architecture-journey     (Journey config)               │   │
│  │  ├── grove.strategic-insight        (Card Definition)              │   │
│  │  └── grove.technical-deep-dive      (Card Definition)              │   │
│  │                                                                     │   │
│  │  Field: legal-corpus                                                │   │
│  │  ├── legal.litigator-lens           (Lens config)                  │   │
│  │  ├── legal.compliance-journey       (Journey config)               │   │
│  │  ├── legal.contract-clause          (Card Definition)              │   │
│  │  └── legal.precedent-summary        (Card Definition)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Roadmap

### Phase 1: Reference Implementation (Current)
*The Grove Terminal as single-Field deployment*

The Grove Terminal demonstrates the DEX mechanics using the "Grove Foundation" Field.
- Validates Sprout/Card lifecycle with Field context
- Proves the "Superposition Collapse" UX
- Schema supports multi-Field (single Field populated)

### Phase 2: Multi-Field Support

Enable multiple Fields per user/organization.
- Field creation flow
- Field switching (clean break = new session)
- Field selector in Explore UI

### Phase 3: Composite Fields

Enable cross-domain synthesis through explicit Field merging.
- Merge UI for selecting parent Fields
- Namespaced entity inheritance
- Sprout promotion to parent Fields

### Phase 4: Knowledge Commons Integration

Connect Fields to the shared marketplace.
- Publish Fields/Lenses/Journeys to marketplace
- Fork public Fields with attribution
- Credit economy for adoption

### Phase 5: Federation

Enable cross-instance Field discovery.
- University A can explore University B's public Fields
- Attribution flows across federation boundaries

---

## 8. Terminology Reference

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration — methodology separating intent from inference |
| **Field** | A bounded knowledge domain with RAG collection and exploration tools |
| **Namespace** | Prefix identifying entity origin (e.g., `legal.`, `grove.`) |
| **Composite Field** | Field created by merging 2+ parent Fields |
| **Trellis Frame** | Engine layer — fixed infrastructure, low change velocity |
| **Substrate** | Field layer — variable input, medium change velocity |
| **Conditions** | Configuration layer — DEX definitions, high change velocity |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Sprout** | Atomic unit of captured insight, scoped to a Field |
| **Grove** | The platform; also accumulated, refined knowledge across Fields |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Superposition Collapse** | Human attention transforming AI outputs into validated insights |

---

## 9. Cross-References

- **Field Architecture:** See `FIELD_ARCHITECTURE.md` for complete Field specification
- **Sprout System:** See `SPROUT_SYSTEM.md` for insight capture lifecycle
- **Data Models:** See `specs/dex-object-model.ts` for TypeScript schemas

---

## 10. Conclusion: The Infrastructure of Thought

The Grove is many things. But we aren't really building an "App." We are building the **Trellis Protocol** to create new kinds of connections between vast stores of knowledge and information types.

Fields are the soil in which this protocol grows. Each Field is a bounded context—a knowledge domain with its own RAG collection, exploration tools, and accumulated insights. The Trellis architecture enables these Fields to support organic growth without chaos.

Information Architecture organized the static web. **Exploration Architecture (DEX)** organizes knowledge in the generative age for productive refinement. By separating the logic of exploration from the capability of execution, and by scoping exploration to Fields, we ensure that as models get smarter and knowledge domains multiply, our Trellis simply bears better fruit.

---

**Build the Trellis. Plant the Fields. The community brings the seeds.**
