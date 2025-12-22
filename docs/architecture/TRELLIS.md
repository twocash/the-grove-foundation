# The Trellis Architecture: First Order Directives

**Implementing the Declarative Exploration (DEX) Standard**

Author: Jim Calhoun  
Version: 1.0 (Genesis)  
Status: Living Constitution  
Context: The Grove Foundation

---

## 1. The Core Philosophy

**Models are seeds. Exploration architecture is soil.**

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
- **The Test:** Every "Sprout" (insight) must maintain an unbroken attribution chain back to its source. We do not just store *what* is known; we store *how* it became known (the specific human-AI interaction that collapsed the wave function).

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
- **Memory Persistence:** Accumulated context turning isolated sessions into a "Grove"

### Layer 2: The Corpus (The Substrate)

**Status:** Variable Input | **Change Velocity:** Medium

The corpus layer contains the raw information. The Trellis can be planted in any substrate:

| Corpus Type | Content | Value Proposition |
|-------------|---------|-------------------|
| Grove Research | White papers, specs | Coherent project architecture |
| Legal Discovery | Depositions, exhibits | Case theory development |
| Academic Lit | Papers, preprints | Synthesis & gap identification |
| Enterprise Knowledge | Slack, Docs, Email | Tribal knowledge preservation |

### Layer 3: The Configuration (The Conditions)

**Status:** Declarative (DEX) | **Change Velocity:** High

This is the DEX Layer. It is where the "growing conditions" are defined. A legal analyst defines a "Contradiction" nutrient; a biologist defines a "Replication Error" nutrient.

- **Configuration is Declarative:** Non-developers define behavior through structured data files
- **Logic Isolation:** Changing the domain does not require touching the engine code

---

## 5. The DEX Configuration Schemas

The Trellis is shaped by four interconnected schemas—the "genetic code" of a specific deployment:

### A. Annotation Schema
Defines the "Fruit" types—what kind of insights can be harvested?
- `annotationTypes[]` — Valid categories (e.g., "Strategic Insight", "Legal Privilege")
- `validationRules{}` — Logic for what constitutes a valid annotation
- `displayTemplates{}` — UI rendering instructions

### B. Relationship Schema
Defines the "Branching" rules—how do nodes connect?
- `relationTypes[]` — "Supports", "Refutes", "Extends", "Causes"
- `directionality{}` — Directed vs. Bi-directional graph edges
- `autoDetection{}` — Prompts for LLM to suggest connections

### C. Processing Flow Schema
Defines the "Growth Cycle"—the lifecycle of an insight.
- `stages[]` — Sprout → Sapling → Tree → Grove
- `transitions{}` — Rules for moving between stages
- `outputIntegration{}` — Where the harvest goes

### D. Display Schema
Defines the "View"—how the Trellis looks to the gardener.
- `cardTemplates{}` — Visual layouts for content types
- `densityLevels{}` — Information density (Compact vs. Detailed)
- `visualizations[]` — Graph view, Timeline view, List view

---

## 6. Implementation Roadmap

### Phase 1: Reference Implementation (The Grove Terminal)
*Current State*

The Grove Terminal serves as the Reference Trellis. It demonstrates the DEX mechanics using the "Distributed AI Research" corpus.
- Validates Sprout/Card lifecycle
- Proves the "Superposition Collapse" UX

### Phase 2: Configuration Extraction (DEXification)

Extract hardcoded behaviors into the DEX Schemas.
- Convert types.ts definitions into schema.json files
- Implement the dynamic SchemaLoader

### Phase 3: The Trellis Builder (Admin UI)

Enable non-technical experts to build their own Trellises.
- Visual editor for Annotation and Relationship schemas
- "No-Code" adjustment of processing flows

### Phase 4: Multi-Domain Deployment

Deploy the Trellis into new soils.
- **Legal Trellis:** Pilot with partner law firm
- **Academic Trellis:** Pilot with university research group
- **Enterprise Trellis:** Pilot with corporate partner

---

## 7. Terminology Reference

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration — methodology separating intent from inference |
| **Trellis Frame** | Engine layer — fixed infrastructure, low change velocity |
| **Substrate** | Corpus layer — variable input, medium change velocity |
| **Conditions** | Configuration layer — DEX definitions, high change velocity |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Sprout** | Atomic unit of captured insight |
| **Grove** | Accumulated, refined knowledge base |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Superposition Collapse** | Human attention transforming AI outputs into validated insights |

---

## 8. Conclusion: The Infrastructure of Thought

The Grove is many things. But we aren't really building an "App." We are building the **Trellis Protocol** to create new kinds of connections between vast stores of knowledge and information types.

Information Architecture organized the static web. **Exploration Architecture (DEX)** organizes knowledge in the generative age for productive refinement. By separating the logic of exploration from the capability of execution, we ensure that as models get smarter, our Trellis simply bears better fruit.

---

**Build the Trellis. The community brings the seeds.**
