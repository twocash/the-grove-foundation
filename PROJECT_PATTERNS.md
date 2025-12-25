# Grove Project Patterns

**The Canonical Reference for How We Build**

*Read this document before planning any sprint, feature, or refactor.*

---

## The Philosophical Foundation

### The Core Thesis

> **Models are seeds. Architecture is soil.**

Current AI investment focuses on building bigger models (better seeds). Grove focuses on the *environment* that makes those models productive. We are building the **Trellis**—the support structure that allows organic intelligence (human and artificial) to climb, branch, and bear fruit without collapsing into chaos.

This is not a technical preference. It is a worldview.

### The DEX Directive

**DEX (Declarative Exploration)** is the methodology that separates *intent* from *inference*. The First Order Directive:

> **Separation of Exploration Logic from Execution Capability**

- **Exploration Logic (The Trellis):** Defined declaratively (JSON/YAML). Owned by domain experts. This sets the "growing conditions."
- **Execution Capability (The Vine):** Performed by AI models and humans. Interchangeable and ephemeral.

**For the Engineer & Agent:** Never hard-code an exploration path. If you are writing imperative code to define a journey, you are violating the architecture. Build the *engine* that reads the map; do not build the map into the engine.

### Why This Matters

Exploration architecture is to the age of AI what information architecture was to the internet. Information architecture made the chaotic early web navigable. Exploration architecture makes AI capability productive.

We are not building an "app." We are codifying the physics of Augmented Cognition.

---

## The Four Pillars of DEX

Every pattern, every decision, every line of code must honor these pillars:

### I. Declarative Sovereignty

> **Domain expertise belongs in configuration, not code.**

**The Test:** Can a non-technical lawyer, doctor, or historian alter the behavior of the refinement engine by editing a schema file, without recompiling the application? If no, the feature is incomplete.

**Implication:** When you're tempted to write `if (lens === 'engineer')`, stop. That's domain logic being hardcoded. It belongs in configuration that the engine interprets.

### II. Capability Agnosticism

> **The architecture must never assume the capability of the underlying model.**

**The Test:** Does the system break if the model creates a "hallucination"? Or does the Trellis catch it? The architecture must function as the "Superposition Collapse" mechanism—the rigid frame that forces probabilistic noise into validated signal.

**Implication:** The system works identically whether powered by GPT-4, Claude, Gemini, or a local 7B model. We observe conversation patterns, not model outputs.

### III. Provenance as Infrastructure

> **A fact without an origin is a bug.**

**The Test:** Every "Sprout" (insight) must maintain an unbroken attribution chain back to its source. We store not just *what* is known, but *how* it became known—the specific human-AI interaction that collapsed the wave function.

**Implication:** Every artifact, every decision, every captured insight traces back to its root. This enables "cognitive archaeology"—understanding how insights emerged through collaboration.

### IV. Organic Scalability

> **Structure must precede growth, but not inhibit it.**

**The Test:** Does the system support "serendipitous connection"? A trellis does not dictate exactly where a leaf grows, but it dictates the general direction. The architecture must allow for "guided wandering" rather than rigid tunnels.

**Implication:** Configuration should have sensible defaults. The system works with minimal config but improves with more. New personas, journeys, and behaviors emerge from configuration changes, not code changes.

---

## The Trellis Metaphor Applied

Consider how a gardener responds to conditions:

- When a plant shows vigorous growth in a particular direction, the gardener adds supports in that direction.
- When growth seems stunted, the gardener investigates environmental factors.
- The gardener doesn't control growth—they create conditions for flourishing.

Similarly, Grove's architecture doesn't control the conversation—it creates conditions for productive exploration. Systems like entropy detection give the Trellis "environmental awareness," understanding when a user needs scaffolding versus space, when structured guidance would help versus hinder.

**We build the Trellis. The community brings the seeds.**

---

## Before You Create Anything New

### The Pattern Check (Mandatory)

Before designing ANY new system, hook, provider, or configuration:

1. **Read this document completely**
2. **Check if an existing pattern handles your need** (see catalog below)
3. **If extending existing pattern:** Document which pattern and how you're extending it
4. **If proposing new pattern:** Explain why existing patterns are insufficient AND get explicit human approval

### The Warning Signs

If you find yourself:

- Creating a new React Context/Provider → **STOP.** Check existing state patterns.
- Creating a new JSON config file → **STOP.** Check if SUPERPOSITION_MAP or existing schemas handle it.
- Writing `if (type === 'foo')` conditionals → **STOP.** That's domain logic; it belongs in config.
- Creating a new `use*` hook that loads data → **STOP.** Check existing hooks.
- Building parallel infrastructure to something that exists → **STOP.** Extend, don't duplicate.


---

## Pattern Catalog

### Pattern 1: Content Reactivity (Quantum Interface)

**Need:** UI content that changes based on user context (lens, persona, audience)

**Philosophy:** The same underlying truth can be presented through different "lenses" without changing the truth itself. This is Superposition Collapse in action—human attention (lens selection) transforms quantum content possibilities into classical rendered content.

**Use:** Quantum Interface system

**Files:**
- `src/data/quantum-content.ts` → SUPERPOSITION_MAP (the content variants)
- `src/surface/hooks/useQuantumInterface.ts` → The hook that collapses superposition
- `src/core/schema/narrative.ts` → LensReality type definition

**Extend by:**
1. Add new fields to `LensReality` type (always optional for backward compatibility)
2. Update `SUPERPOSITION_MAP` entries with new field values
3. Wire components to read from the hook

**DO NOT:**
- ❌ Create new audience config files
- ❌ Create new `useAudienceConfig` or similar hooks
- ❌ Build parallel JSON loading systems
- ❌ Hardcode persona-specific behavior in components

**Example extension:**
```typescript
// In narrative.ts - extend the type
interface LensReality {
  hero: HeroContent;           // existing
  navigation?: {               // new, optional
    ctaLabel?: string;
  };
}

// In quantum-content.ts - update the map
'concerned-citizen': {
  hero: { /* existing */ },
  navigation: { ctaLabel: 'Start Exploring' }  // new
}

// In component - read from existing hook
const { reality } = useQuantumInterface();
const ctaLabel = reality?.navigation?.ctaLabel ?? 'Begin';
```

---

### Pattern 2: State Management (Engagement Machine)

**Need:** Cross-component state, session persistence, complex state transitions

**Philosophy:** State transitions are not bugs waiting to happen—they are the *physics* of user engagement. By making transitions declarative (XState), we document the possible user journeys. The machine itself becomes documentation of valid engagement patterns.

**Use:** XState Engagement Machine

**Files:**
- `src/core/engagement/` → Machine definitions
- `useEngagement`, `useLensState` → State selectors

**Extend by:**
1. Add new states/events to machine definition
2. Create new selectors for derived state
3. Document new states in machine comments

**DO NOT:**
- ❌ Create parallel `useState` systems for cross-cutting concerns
- ❌ Create new React Context providers for state
- ❌ Write imperative state transitions (`if (state === 'x') setState('y')`)

---

### Pattern 3: Narrative Content (Schema System)

**Need:** Structured content loaded at runtime (journeys, hubs, topics)

**Philosophy:** The narrative *is* the product. By defining narratives in schema, we make the product's soul editable by non-engineers. A historian deploying Grove for archival research can tune narratives to their domain without engineering involvement.

**Use:** Narrative Schema system

**Files:**
- `data/narratives-schema.ts` → Type definitions
- `data/*.json` → Content files (hubs, journeys, topics)
- `hooks/NarrativeEngineContext.tsx` → Loading and access

**Extend by:**
1. Add fields to schema types
2. Update JSON content files
3. Access via existing NarrativeEngine context

**DO NOT:**
- ❌ Create parallel JSON loaders
- ❌ Hardcode narrative content in components
- ❌ Create separate "content" systems

---

### Pattern 4: Styling (Token Namespaces)

**Need:** Surface-specific styling, theme variations

**Philosophy:** Visual presentation is a form of content. Different surfaces (Terminal, Foundation, Genesis) have different visual personalities, but they share a grammar. Token namespaces provide that grammar.

**Use:** CSS custom property namespaces

**Namespaces:**
- `--chat-*` → Terminal/chat column styling
- `--grove-*` → Workspace shell styling
- `--genesis-*` → Genesis surface (if needed)

**Files:**
- `src/app/globals.css` → Token definitions
- Component-specific styles reference tokens

**Extend by:**
1. Add tokens to existing namespace in globals.css
2. Reference tokens in component styles

**DO NOT:**
- ❌ Create new namespaces without explicit approval
- ❌ Use inline styles for themeable properties
- ❌ Create component-level CSS files for global concerns
- ❌ Hardcode colors or spacing values

### Card Components (Added Sprint 6)

All card-based UI uses the `--card-*` token namespace. This is THE canonical pattern for card styling across Foundation, Genesis, and future admin interfaces.

| Token | Purpose |
|-------|---------|
| `--card-border-default` | Default border color |
| `--card-border-inspected` | Border when inspector shows this card |
| `--card-border-active` | Border when card is currently applied |
| `--card-bg-active` | Background when active |
| `--card-ring-color` | Ring color for inspected state |
| `--card-ring-active` | Subtle ring for active state |

**Visual State Matrix:**
- Default → `border-[var(--card-border-default)]`
- Inspected → `ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]`
- Active → `bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1`

**For new card components:**
1. Use `--card-*` tokens for all styling
2. Implement appropriate states (isInspected, isActive, isSelected)
3. Add variant tokens if needed (e.g., `--card-ring-violet`)

**DO NOT:**
- ❌ Hardcode colors in new card components
- ❌ Create parallel card styling systems
- ❌ Use different token namespaces for cards

---

### Pattern 5: Feature Detection (Entropy & Signals)

**Need:** System behavior that responds to conversation complexity or user state

**Philosophy:** Entropy detection gives the Trellis "environmental awareness." Like a gardener sensing when a plant needs support, the system senses when users need scaffolding. This is infrastructure, not feature—multiple consumers can respond to the same signal differently.

**Use:** Entropy detection system

**Files:**
- Entropy detector (measures conversation complexity)
- Consumers subscribe and respond according to their own logic

**Extend by:**
1. Add new entropy consumers for new behaviors
2. Configure consumer thresholds declaratively
3. Let different deployments tune sensitivity via config

**DO NOT:**
- ❌ Couple entropy directly to single behaviors
- ❌ Hardcode thresholds in components
- ❌ Create parallel "complexity detection" systems

---

### Pattern 6: Component Composition (Surface Architecture)

**Need:** Building new UI surfaces or layouts

**Philosophy:** Surfaces are compositions of primitives. Genesis, Terminal, Foundation are not monoliths—they are arrangements of reusable pieces. New surfaces emerge from recombination, not reinvention.

**Structure:**
```
src/surface/
├── components/     → Reusable building blocks
├── layouts/        → Page-level compositions
└── hooks/          → Surface-specific state

src/core/
├── schema/         → Type definitions
├── engagement/     → State machines
└── [domain]/       → Domain logic
```

**Extend by:**
1. Compose existing components into new layouts
2. Add new primitives to `components/` when genuinely new
3. Wire to existing state via hooks

**DO NOT:**
- ❌ Duplicate existing components with slight variations
- ❌ Create surface-specific versions of shared components
- ❌ Mix domain logic into surface components

---

### Pattern 7: Object Model (Sprint: grove-object-model-v1)

**Need:** Unified identity and operations across all Grove content types.

**Philosophy:** Every thing in Grove is a GroveObject. Whether human-created or AI-generated, system-defined or user-customized, all objects share common identity and can be operated on uniformly.

**Use:** GroveObjectMeta interface + GroveObjectCard component + useGroveObjects hook

**Files:**
- `src/core/schema/grove-object.ts` → Type definitions
- `src/surface/components/GroveObjectCard/` → Generic renderer
- `src/surface/hooks/useGroveObjects.ts` → Collection operations
- `src/lib/storage/user-preferences.ts` → Favorites storage

**Extend by:**
1. Have new types implement GroveObjectMeta (flat extension)
2. Add type-specific content renderer to CONTENT_RENDERERS
3. Add normalizer function in useGroveObjects

**GroveObjectMeta fields:**
- id, type, title, description, icon, color
- createdAt, updatedAt
- createdBy (provenance)
- status, tags, favorite

**Visual States:** Uses `--card-*` tokens from Pattern 4.

**DO NOT:**
- ❌ Create object types without GroveObjectMeta
- ❌ Build type-specific cards that don't use GroveObjectCard
- ❌ Store metadata in different structures per type
- ❌ Implement favorites outside user-preferences.ts

---

## Anti-Patterns (The Violations)

These patterns violate DEX principles. If you catch yourself doing these, stop and reconsider.

### Anti-Pattern 1: The Parallel System

**Violation:** Creating infrastructure that duplicates existing capability.

**Example:** Creating `useAudienceConfig` when `useQuantumInterface` already handles persona-reactive content.

**Why it's wrong:** Violates Organic Scalability. The existing system should grow to accommodate new needs, not spawn siblings. Parallel systems create confusion about "which one to use" and eventually diverge.

**Fix:** Extend the existing pattern. Add fields, not files.

### Anti-Pattern 2: The Hardcoded Conditional

**Violation:** `if (lens === 'engineer') { showTechnicalDetails(); }`

**Example:** Scattering persona-specific behavior throughout components.

**Why it's wrong:** Violates Declarative Sovereignty. Domain logic (what engineers see) is hardcoded into execution logic. A domain expert cannot change this without code changes.

**Fix:** Config defines what each lens sees. Engine interprets config.

### Anti-Pattern 3: The Imperative State Machine

**Violation:** Manual state transitions with nested conditionals.

**Example:**
```typescript
if (state === 'idle' && hasLens) {
  setState('ready');
} else if (state === 'ready' && hasInput) {
  setState('processing');
}
```

**Why it's wrong:** Violates Provenance. State transitions are invisible—there's no documentation of valid paths. Bugs hide in impossible states that imperative code allows.

**Fix:** Declarative state machine (XState) where transitions are explicit and documented.

### Anti-Pattern 4: The Implementation Test

**Violation:** Testing CSS classes, internal state, or mock calls instead of behavior.

**Example:** `expect(element).toHaveClass('translate-x-0')`

**Why it's wrong:** Tests break when implementation changes, even if behavior is preserved. This creates false negatives that erode trust in tests.

**Fix:** Test what users see: `await expect(terminal).toBeVisible()`

### Anti-Pattern 5: The Orphaned Config

**Violation:** Creating configuration that nothing reads.

**Example:** Adding fields to JSON that no engine interprets.

**Why it's wrong:** Violates the engine/config separation. Config without an engine to interpret it is just documentation (at best) or misleading (at worst).

**Fix:** Every config field must have an engine that reads it. If you add config, wire the consumer.

### Anti-Pattern 6: The God Component

**Violation:** Single component that handles multiple concerns with internal conditionals.

**Example:** A `<DynamicContent>` component that switches rendering based on 15 different type props.

**Why it's wrong:** Violates separation of concerns. Changes to one content type risk breaking others. Testing requires covering all branches.

**Fix:** Compose specific components. Let config determine which component renders.

---

## Decision Framework

When facing an architectural choice, apply this framework:

### Question 1: Does this honor Declarative Sovereignty?

Can a domain expert (non-engineer) modify this behavior through configuration?

- **Yes** → Proceed
- **No** → Refactor until they can

### Question 2: Does this extend or duplicate?

Does an existing pattern already handle this need?

- **Existing pattern handles it** → Extend that pattern
- **Genuinely new need** → Document why, get approval for new pattern

### Question 3: Is the engine corpus-agnostic?

Could this same engine work with different content/domain?

- **Yes** → Good separation of concerns
- **No** → Domain logic has leaked into the engine; extract to config

### Question 4: Can I trace provenance?

If something goes wrong, can I trace back to the decision/config/input that caused it?

- **Yes** → Proper attribution chain
- **No** → Add logging, attribution, or documentation

### Question 5: Will this still work when the model changes?

If we swap GPT-4 for Claude for a local 7B, does this code still function?

- **Yes** → Capability agnostic
- **No** → You've coupled to model-specific behavior

---

## The Sprout Principle

A **Sprout** is the atomic unit of captured insight. It represents knowledge that has been:

1. **Generated** through human-AI collaboration
2. **Validated** through human attention (Superposition Collapse)
3. **Attributed** with full provenance chain
4. **Persisted** for future retrieval and connection

When building features, ask: "Does this create Sprouts? Does this consume Sprouts? Does this connect Sprouts?"

The Grove is not a chat interface. It is a knowledge garden where Sprouts grow, connect, and bear fruit.

---

## Integration with Foundation Loop

The Foundation Loop skill enforces these patterns through structured planning:

### Phase 0: Pattern Check (MANDATORY)

Before creating REPO_AUDIT.md, you MUST:

1. **Read PROJECT_PATTERNS.md** completely
2. **Map requirements to existing patterns** — List which patterns from the catalog apply
3. **Document "Patterns Extended"** in SPEC.md — Not "patterns created"
4. **Flag genuinely new patterns** for human review before proceeding

### In SPEC.md

Every specification must include:

```markdown
## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens-reactive CTAs | Quantum Interface | Add navigation field to LensReality |
| ... | ... | ... |

## New Patterns Proposed

None. / [If any, explain why existing patterns are insufficient]
```

### In ARCHITECTURE.md

Reference DEX pillars explicitly:

```markdown
## DEX Compliance

- **Declarative Sovereignty:** [How domain experts can modify behavior]
- **Capability Agnosticism:** [How this works regardless of model]
- **Provenance:** [How we track attribution]
- **Organic Scalability:** [How this grows without restructuring]
```

---

## Terminology Quick Reference

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration—methodology separating intent from inference |
| **Vine** | Execution capability (LLM, RAG)—interchangeable and ephemeral |
| **Sprout** | Atomic unit of captured, validated insight |
| **Grove** | Accumulated, refined knowledge base |
| **Superposition Collapse** | Human attention transforming probabilistic outputs into validated facts |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Quantum Interface** | The pattern where content exists in superposition until lens selection collapses it |
| **Engagement Machine** | XState machine defining valid user journey states |

---

## Final Reminder

This codebase is not a product in the conventional sense. It is the **Reference Implementation** of a new discipline. Every commit either advances or undermines that mission.

When in doubt, return to the core thesis:

> **Models are seeds. Architecture is soil. We build the Trellis. The community brings the seeds.**

---

*Last updated: December 2024*
*Canonical location: PROJECT_PATTERNS.md (repository root)*
