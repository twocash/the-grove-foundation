# Controller/Preset Architecture: Self-Evident Objects for AI-Assisted Knowledge Work

**Version:** 1.0 (Vision Paper)
**Author:** Grove Foundation Architecture Team
**Status:** Strategic Vision
**Context:** Trellis DEX Stack Implementation

---

## Executive Summary

This document introduces the **Controller/Preset pattern**—a unified architecture for managing behavioral configuration across the Grove platform. The pattern formalizes the relationship between **what is active** (Controller) and **what is available** (Preset), transforming implicit singleton state into explicit, declarative, federatable configuration.

The insight is deceptively simple: *A "Preset" is a powerful abstraction that flattens the difference between "distinct entity" and "state configuration."* This unification enables:

- **Self-evident objects** that AI agents can introspect and manipulate
- **Fork-to-customize** workflows for non-developers
- **Federation-ready** knowledge sharing across Grove instances
- **Version-controlled** configuration with rollback capability

---

## 1. The Problem: Hidden State in AI-Assisted Systems

### 1.1 The Singleton Trap

Modern AI-assisted applications accumulate behavioral configuration over time:

- System prompts that define agent personality
- Output templates that shape document generation
- Feature flags that gate capabilities
- Agent configurations that tune research parameters
- Lifecycle models that define quality tiers

In typical implementations, these configurations exist as **implicit singletons**—there is one "current" system prompt, one "active" writer config. The selection mechanism is hidden: buried in code, stored in environment variables, or managed through undocumented side-effects.

**This violates DEX Pillar I: Declarative Sovereignty.**

When behavior is controlled through hidden state, domain experts cannot alter the system. Configuration becomes a developer privilege.

### 1.2 The Selection Problem

Consider the current state of Grove's object model:

```typescript
// Current: Implicit selection
const systemPrompt = await loadSystemPrompt();  // Which one? How was it chosen?
const writerConfig = await loadWriterConfig();  // The "current" one? The "default"?
```

Questions without answers:
- What alternatives exist?
- Who chose this configuration?
- When was it changed?
- How do I try a different one?

### 1.3 The Federation Barrier

Hidden state cannot federate. If University A wants to share their carefully-tuned research agent configuration with University B, they must:

1. Export raw config files
2. Document the selection mechanism
3. Hope their implicit assumptions match

**This violates DEX Pillar III: Provenance as Infrastructure.**

A configuration without explicit origin, selection history, and attribution chain is useless for knowledge sharing.

---

## 2. The Solution: Controller/Preset Pattern

### 2.1 Core Concept

The Controller/Preset pattern introduces two complementary object types:

| Component | Responsibility | Cardinality | Federates? |
|-----------|---------------|-------------|------------|
| **Preset** | Stores a complete behavioral configuration | Many | Yes |
| **Controller** | Manages selection of active Preset | One per scope | No |

**The Pattern:**
```
Controller (Singleton) ────selects────► Preset (Instance)
                                           ▲
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                         Preset A                  Preset B
                        (active)                  (available)
```

### 2.2 The Insight: Presets as Self-Evident Objects

A Preset is not just "saved settings." A Preset is a **first-class GroveObject** with full identity:

```typescript
interface GroveObject<PresetPayload> {
  meta: {
    id: string;
    type: 'prompt-preset' | 'output-preset' | 'agent-preset' | ...;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: GroveObjectProvenance;
    status: 'active' | 'draft' | 'archived';
    tags?: string[];
    favorite?: boolean;

    // Federation metadata
    federationId?: string;
    federationPath?: string[];
  };

  payload: PresetPayload;  // The actual configuration
}
```

**Self-evident** means:
- An AI agent can list all available Presets
- An AI agent can read any Preset's configuration
- An AI agent can explain what a Preset does
- An AI agent can recommend Presets for a task
- A human can fork, edit, and share Presets without code

This is the essence of **DEX Pillar I: Declarative Sovereignty**—behavior defined in configuration that both humans and AI can manipulate.

### 2.3 Controller Mechanics

The Controller is intentionally minimal. Its only responsibilities:

```typescript
interface ControllerPayload {
  // What Preset is currently active?
  activePresetId: string;

  // What Preset should be used when none is specified?
  defaultPresetId: string;

  // Optional: Quick-switch list for frequently used Presets
  pinnedPresetIds?: string[];

  // Audit trail
  lastChangedAt: string;
  lastChangedBy: string;
}
```

Controllers are **Field-scoped singletons**:
- One PromptController per Field
- One OutputController per Field (per agent type)
- One AgentController per agent type per Field

Controllers do **not** federate. Selection is local; options are shared.

---

## 3. Mapping Grove Objects to Controller/Preset

### 3.1 The Full Landscape

| Current Object | Controller | Preset | Migration Path |
|----------------|------------|--------|----------------|
| `system-prompt` | PromptController | PromptPreset | Type alias, add Controller |
| `output-template` | OutputController | OutputPreset | Already preset-like, add Controller |
| `writer-agent-config` | AgentController | AgentPreset (writer) | Type alias, add Controller |
| `research-agent-config` | AgentController | AgentPreset (research) | Type alias, add Controller |
| `feature-flag` | FeatureController | ConfigPreset | Optional—current pattern works |
| `lifecycle-model` | LifecycleController | LifecyclePreset | Type alias, add Controller |

### 3.2 Objects That Don't Need Controllers

Not every GroveObject fits this pattern. **Content objects** are not behavioral configuration:

| Object Type | Pattern | Reason |
|-------------|---------|--------|
| `sprout` | Content | User-generated insight, not system behavior |
| `journey` | Content | Curated exploration path, not active selection |
| `hub` | Content | Knowledge container, not configuration |
| `node` | Content | Graph element, not behavior |
| `card` | Content | Insight unit, not configuration |

**The distinction:** Presets define *how the system behaves*. Content objects are *what the system operates on*.

### 3.3 Type Aliasing for Non-Breaking Migration

Existing code references `system-prompt`, `output-template`, etc. Migration uses type aliasing:

```typescript
// src/core/schema/grove-object.ts
export type GroveObjectType =
  // Legacy names (aliased for compatibility)
  | 'system-prompt'          // → PromptPreset
  | 'output-template'        // → OutputPreset
  | 'writer-agent-config'    // → AgentPreset (writer)
  | 'research-agent-config'  // → AgentPreset (research)
  | 'lifecycle-model'        // → LifecyclePreset

  // Canonical names (new code should use these)
  | 'prompt-preset'
  | 'output-preset'
  | 'agent-preset'
  | 'lifecycle-preset'
  | 'prompt-controller'
  | 'output-controller'
  | 'agent-controller'
  | 'lifecycle-controller'

  // Content objects (unchanged)
  | 'sprout'
  | 'journey'
  | 'hub'
  | ...
```

---

## 4. How This Fits Exploration Architecture

### 4.1 DEX Pillar Alignment

| DEX Pillar | Controller/Preset Contribution |
|------------|-------------------------------|
| **Declarative Sovereignty** | Behavior is configuration. Domain experts edit Presets via UI. No code changes required. |
| **Capability Agnosticism** | Presets work regardless of underlying model. A Claude-tuned prompt works with Gemini. |
| **Provenance as Infrastructure** | Every Preset has full GroveObjectMeta: creator, timestamps, fork lineage, attribution. |
| **Organic Scalability** | New agent types get Presets automatically. No engine changes for new behavioral categories. |

### 4.2 Three-Layer Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: CONFIGURATION (DEX)                  │
│                                                                  │
│  Field: grove-foundation                                         │
│  ├── PromptController (selects active PromptPreset)             │
│  │   └── pinnedPresets: [default-grove, academic-formal, ...]   │
│  ├── OutputController:writer (selects active OutputPreset)       │
│  │   └── activePresetId: engineering-architecture               │
│  └── AgentController:research (selects active AgentPreset)       │
│      └── activePresetId: deep-dive-config                       │
│                                                                  │
│  PromptPresets: [default-grove, academic-formal, socratic, ...]  │
│  OutputPresets: [engineering, vision-paper, blog-post, ...]      │
│  AgentPresets: [deep-dive, quick-scan, academic-review, ...]     │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                      activePresetId
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    LAYER 1: ENGINE (Fixed)                       │
│                                                                  │
│  getActivePreset(controllerId) → GroveObject<PresetPayload>      │
│  setActivePreset(controllerId, presetId) → void                  │
│  listPresets(controllerType) → GroveObject<PresetPayload>[]      │
│  forkPreset(sourcePresetId) → GroveObject<PresetPayload>         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 The Experience Console Integration

Controllers and Presets integrate with the Experience Console factory pattern:

```typescript
// Component registry
componentRegistry.register('prompt-preset', {
  card: PromptPresetCard,
  editor: PromptPresetEditor,
  inspector: PromptPresetInspector,
});

componentRegistry.register('prompt-controller', {
  card: ControllerCard,  // Shared across controller types
  editor: ControllerEditor,
});
```

The Experience Console provides unified CRUD for all GroveObjects. Adding a new Preset type requires only:
1. Schema definition (Zod)
2. Card component
3. Editor component
4. Registry entry

No engine changes. No backend modifications. **Declarative sovereignty in action.**

---

## 5. What This Unlocks: Federation and Knowledge Sharing

### 5.1 The Federation Vision

Grove's long-term vision includes **federated knowledge sharing**:
- University A publishes a Legal Research Field
- University B discovers and forks it
- Attribution flows back to original creators
- Improvements can be contributed upstream

**Presets are the currency of this economy.**

### 5.2 Federatable Configuration

When a Field federates, its Presets travel with it:

```
┌──────────────────────────────────────────────────────────────────┐
│                    FEDERATION FLOW                                │
│                                                                   │
│  Grove Instance A                    Grove Instance B             │
│  ──────────────────                  ──────────────────           │
│                                                                   │
│  Field: legal-research               Field: legal-research        │
│  ├── PromptPresets: [...]    ──►     ├── PromptPresets: [...]     │
│  ├── OutputPresets: [...]    ──►     ├── OutputPresets: [...]     │
│  ├── AgentPresets: [...]     ──►     ├── AgentPresets: [...]      │
│  │                                   │                            │
│  │   Controllers stay local:         │   Controllers stay local:  │
│  └── PromptController        ✗       └── PromptController         │
│      (their selection)               (their selection)            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key insight:** Presets federate as GroveObjects with full provenance. Controllers remain local because *selection is a local decision*.

### 5.3 The Knowledge Commons Economy

Presets enable Grove's **Knowledge Commons** vision:

| Action | Attribution |
|--------|-------------|
| Fork a PromptPreset | Original creator credited in `forkedFromId` |
| Publish a custom OutputPreset | Your identity in `createdBy` |
| Contribute improvement upstream | Merge recorded in version history |
| Adopt popular Preset | Adoption metrics flow to creator |

This creates a **marketplace of behavioral configurations**:
- Researchers share finely-tuned prompts
- Legal teams share deposition templates
- Educators share Socratic dialogue configs

All with full attribution. All discoverable. All self-evident.

---

## 6. Implementation: The Epic Structure

### 6.1 Sprint Breakdown

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| **S21-CP-Schema** | Schema Foundation | Controller/Preset Zod schemas, type aliases, GroveObject registration |
| **S22-CP-Engine** | Engine Layer | `getActivePreset()`, `setActivePreset()`, `forkPreset()` in GroveDataProvider |
| **S23-CP-Console** | Experience Console | ControllerCard, PresetCard, PresetEditor in component registry |
| **S24-CP-Migration** | Data Migration | Convert existing singletons to Controller+Preset pairs |
| **S25-CP-Federation** | Federation Prep | Preset export/import, federation metadata handling |

### 6.2 Non-Breaking Migration Strategy

Phase 1: Schema (no runtime changes)
```typescript
// Add new types alongside existing
type GroveObjectType =
  | 'system-prompt'     // Keep for compatibility
  | 'prompt-preset'     // Canonical name
  | 'prompt-controller' // New
  | ...
```

Phase 2: Engine (read from both)
```typescript
// Engine reads from Preset if Controller exists, falls back to singleton
function getSystemPrompt(fieldId: string): SystemPrompt {
  const controller = getController('prompt-controller', fieldId);
  if (controller?.activePresetId) {
    return getPreset(controller.activePresetId);
  }
  return legacyGetSystemPrompt();  // Fallback
}
```

Phase 3: Migration (create Controller+Presets from singletons)
```typescript
// One-time migration script
async function migrateSystemPrompts() {
  const legacyPrompt = await legacyGetSystemPrompt();

  // Create Preset from legacy singleton
  const preset = await createGroveObject({
    type: 'prompt-preset',
    payload: legacyPrompt,
    source: 'system-seed',
  });

  // Create Controller pointing to Preset
  await createGroveObject({
    type: 'prompt-controller',
    payload: {
      activePresetId: preset.meta.id,
      defaultPresetId: preset.meta.id,
    },
  });
}
```

Phase 4: Cleanup (deprecate legacy paths)
```typescript
// Remove fallback code after migration verified
function getSystemPrompt(fieldId: string): SystemPrompt {
  const controller = getController('prompt-controller', fieldId);
  return getPreset(controller.activePresetId);  // No fallback
}
```

---

## 7. The Core Vision: Self-Evident Declarative Objects

### 7.1 What "Self-Evident" Means

In traditional software, configuration is opaque:
- Stored in files humans rarely read
- Structured in ways only developers understand
- Modified through code changes or CLI commands

**Self-evident objects** are different:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  AI Agent: "I see you have 4 PromptPresets available:            │
│                                                                  │
│    1. default-grove (active) - Balanced, professional tone       │
│    2. academic-formal - Chicago citations, formal voice          │
│    3. socratic-dialogue - Question-driven exploration            │
│    4. casual-explainer - Conversational, accessible              │
│                                                                  │
│    Would you like me to switch to 'academic-formal' for your     │
│    research paper? I can also fork any of these and customize    │
│    for your specific needs."                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

The AI can:
- **List** available configurations
- **Explain** what each does
- **Recommend** based on context
- **Execute** selection changes
- **Fork** and customize on request

This is possible because Presets are GroveObjects with:
- Descriptive `title` and `description`
- Machine-readable `payload`
- Explicit `status` and `source`
- Full `provenance` chain

### 7.2 The Agentic Knowledge Work Paradigm

Grove's vision is **AI-assisted agentic knowledge work**:
- Humans provide judgment and intent
- AI provides capability and execution
- Configuration mediates the collaboration

The Controller/Preset pattern makes this concrete:

| Human Role | AI Role | Configuration |
|------------|---------|--------------|
| "I want academic tone" | Selects PromptPreset | PromptController.activePresetId |
| "More citations please" | Adjusts OutputPreset | OutputPreset.config.citationDensity |
| "Go deeper on this topic" | Tunes AgentPreset | AgentPreset.searchDepth |

The human expresses intent. The AI manipulates self-evident objects. The system behaves differently.

**No code. No deployment. No developer in the loop.**

### 7.3 The Democratization of Configuration

Traditional configuration is developer territory:
- "File a ticket to change the system prompt"
- "We'll deploy the new config next sprint"
- "Talk to engineering about that feature flag"

Controller/Preset democratizes this:
- Researchers tune their own prompts
- Legal teams customize output templates
- Educators fork and share pedagogical presets

**Everyone becomes a contributor to the Knowledge Commons.**

---

## 8. Conclusion: The Trellis Grows

The Controller/Preset pattern is not a technical refactor. It is the natural evolution of Grove's declarative philosophy.

We began with the **DEX thesis**: value comes from the structure of exploration, not the size of the model. We built the **Trellis**: an architecture separating exploration logic from execution capability.

Now we extend the Trellis to configuration itself. **Presets are the declarative expression of behavioral intent.** They are self-evident, versionable, forkable, and federatable. They transform hidden singletons into explicit, manageable, shareable objects.

Controllers provide the minimal selection layer. They answer "which one?" without accumulating complexity. They stay local while Presets travel the federation.

Together, Controller/Preset completes the DEX vision:

| Before | After |
|--------|-------|
| Implicit configuration | Explicit Presets |
| Developer-controlled behavior | Domain expert sovereignty |
| Hidden selection state | Visible Controllers |
| Non-federatable settings | GroveObjects with provenance |
| AI-opaque configuration | Self-evident objects |

**Build the Trellis. Define the Presets. Let the community grow.**

---

## Cross-References

- **DEX Philosophy:** `docs/architecture/TRELLIS.md`
- **Field Architecture:** `docs/architecture/FIELD_ARCHITECTURE.md`
- **Object Model:** `src/core/schema/grove-object.ts`
- **Output Templates (reference):** `src/core/schema/output-template.ts`
- **Experience Console:** `src/bedrock/consoles/ExperienceConsole/`

---

## Appendix A: Terminology

| Term | Definition |
|------|------------|
| **Controller** | Singleton that manages selection of active Preset |
| **Preset** | Complete behavioral configuration as GroveObject |
| **Self-Evident** | Configuration that AI and humans can both introspect and manipulate |
| **Fork** | Create new Preset based on existing one, with attribution |
| **Federation** | Cross-instance sharing of GroveObjects |
| **Knowledge Commons** | Marketplace of shared Presets with attribution economy |

---

## Appendix B: FAQ

**Q: Why not just use feature flags?**
A: Feature flags toggle capabilities on/off. Presets define *how* capabilities behave. A feature flag says "enable citations." A Preset says "use Chicago style, endnotes format, minimum 3 sources per claim."

**Q: Do all objects need Controllers?**
A: No. Only behavioral configuration objects (how the system acts). Content objects (what the system processes) use standard GroveObject patterns without Controllers.

**Q: What about performance?**
A: Controllers are cached in memory. Preset lookup adds one read operation. The Engine layer can optimize with eager loading of active Presets.

**Q: Can users break the system by editing Presets?**
A: Presets are validated by Zod schemas. Invalid configurations are rejected at save time. System-seed Presets are read-only; users must fork to customize.

---

*Version 1.0 | Grove Foundation Architecture Team | January 2026*
