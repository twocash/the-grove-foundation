# The Trellis Architecture: First Order Directives

### Implementing the Declarative Exploration (DEX) Standard

**Author:** Jim Calhoun  
**Version:** 2.0 (Field-Aware)  
**Status:** Living Constitution  
**Context:** The Grove Foundation

> To the Villagers/Agents: we are effectively creating the **"TCP/IP of Thought"**—a standard protocol for how humans and AI navigate information together.

---

## 1. The Core Philosophy

**Models are seeds. Fields are soil. Exploration architecture is the trellis.**

We reject the "Model Maximalist" thesis that assumes value resides solely in the size of the LLM. Instead, we adhere to the **DEX Thesis**: Value comes from the *structure of exploration*.

We are building the **Trellis**—the support structure that allows organic intelligence (human and artificial) to climb, branch, and bear fruit without collapsing into chaos.

---

## 2. The Primary Directive

**Separation of Exploration Logic from Execution Capability.**

- **Exploration Logic (The Trellis):** The declarative definition of *how* we search, *what* constitutes a valid insight, and *where* connections should be made. This is owned by the domain expert and defined in configuration (JSON/YAML).

- **Execution Capability (The Vine):** The raw processing power (LLM, RAG, Code Interpreter) that traverses the structure. This is interchangeable and ephemeral.

**For the Engineer & Agent:** Never hard-code an exploration path. If you are writing imperative code to define a journey, you are violating the architecture. Build the *engine* that reads the map; do not build the map into the engine.

---

## 3. The Field-Scoping Directive

**All exploration operations are scoped to a Field.**

- Every Sprout has a `fieldId`
- Every TerminalSession has a `fieldId`
- Every Lens, Journey, Node, Card Definition belongs to a Field
- Field switching creates a new session (clean break)
- Cross-Field exploration requires explicit Composite Field creation

**For the Engineer & Agent:** Never create a Sprout or Session without `fieldId`. If you are writing code that assumes global scope, you are violating the architecture.

---

## 4. The DEX Stack Standards

To contribute to The Grove is to build upon the **DEX Stack**. All contributions must adhere to these four pillars:

### I. Declarative Sovereignty

- **The Rule:** Domain expertise belongs in configuration, not code.
- **The Test:** Can a non-technical lawyer, doctor, or historian alter the behavior of the refinement engine by editing a schema file, without recompiling the application? If no, the feature is incomplete.

### II. Capability Agnosticism

- **The Rule:** The architecture must never assume the capability of the underlying model.
- **The Test:** Does the system break if the model creates a "hallucination"? Or does the Trellis catch it? The architecture must function as the "Superposition Collapse" mechanism—the rigid frame that forces probabilistic noise into validated signal.

### III. Provenance as Infrastructure

- **The Rule:** In the DEX stack, a fact without an origin is a bug.
- **The Test:** Every "Sprout" (insight) must maintain an unbroken attribution chain back to its source—including the Field that scoped its generation, the Lens that shaped its voice, and the Journey context that framed the inquiry.

### IV. Organic Scalability (The Trellis Principle)

- **The Rule:** Structure must precede growth, but not inhibit it.
- **The Test:** The system must support "serendipitous connection." A trellis does not dictate exactly where a leaf grows, but it dictates the general direction. Fields provide the bounded context; within that context, exploration is free to wander.

---

## 5. The Future State

This architecture assumes its own evolution.

Today, we define DEX schemas for "Legal Discovery" or "Academic Synthesis" as separate Fields. Tomorrow, the definition of "Exploration" may change entirely as agents become recursive.

Therefore, this codebase is not a static product; it is the **Reference Implementation** of a new discipline. We are not just building software; we are codifying the physics of Augmented Cognition.

**We build the Trellis. We plant the Fields. The community brings the seeds.**

---

## Terminology Reference

| Term | Definition |
|------|------------|
| **DEX** | Declarative Exploration — the methodology of separating intent from inference |
| **Trellis** | The structural framework (Architecture) that supports the DEX stack |
| **Field** | A bounded knowledge domain with RAG, exploration tools, and Sprouts |
| **Namespace** | Prefix identifying entity origin (`legal.`, `grove.`, `legal-grove.`) |
| **Composite Field** | Field created by merging 2+ parent Fields with namespaced inheritance |
| **Trellis Frame** | Engine layer — fixed infrastructure, low change velocity |
| **Substrate** | Field layer — variable input, medium change velocity |
| **Conditions** | Configuration layer — DEX definitions per Field, high change velocity |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Sprout** | The atomic unit of captured insight, always scoped to a Field |
| **Grove** | The platform; accumulated knowledge across Fields |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Superposition Collapse** | Human attention transforms probabilistic AI output into validated fact |

---

## Cross-References

- `FIELD_ARCHITECTURE.md` — Complete Field specification
- `TRELLIS.md` — Full DEX stack documentation
- `SPROUT_SYSTEM.md` — Insight capture lifecycle
- `specs/dex-object-model.ts` — TypeScript schemas
