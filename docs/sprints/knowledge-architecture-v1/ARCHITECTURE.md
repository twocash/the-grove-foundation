# Grove Knowledge Architecture — Ontology Definition

> *"Exploration architecture is to the age of AI what information architecture was to the internet."*

This document defines the conceptual architecture of Grove's knowledge system. It serves two purposes:
1. **Documentation** — Explains how the system works to developers
2. **RAG Content** — The Terminal can answer questions about its own architecture

---

## The Three Layers

Grove's knowledge architecture separates three distinct concerns:

### 1. The Exploration Layer
**What paths exist through possibility space?**

This layer defines the topology of exploration — how users navigate through Grove's ideas. It knows nothing about content; it only knows about connections.

- **Journeys** — Choreographed sequences that collapse superposition into insight
- **Nodes** — Waypoints that focus possibility into specificity

### 2. The Knowledge Layer  
**How is content organized into gravitational fields?**

This layer defines the semantic geography — where concepts live in relation to each other. It knows nothing about how users arrive; it only knows about what exists.

- **Hubs** — Gravitational centers that attract related concepts
- **Default Context** — Universal ground state loaded for all queries

### 3. The Infrastructure Layer
**Where do bytes actually live?**

This layer handles physical storage — mapping logical names to actual file locations. It should be invisible to the exploration and knowledge layers.

- **GCS Mapping** — Translates clean filenames to Notion export hashes
- **Feature Flags** — Runtime configuration toggles

---

## Core Concepts

### Hub

A **Hub** is a gravitational field in knowledge space. It attracts related concepts and provides focused context for exploration.

```typescript
interface Hub {
  // Identity
  id: string;                    // Unique identifier (e.g., "ratchet-effect")
  title: string;                 // Human name (e.g., "The Ratchet Effect")
  thesis: string;                // One-sentence summary of what this hub teaches
  
  // Content Location
  path: string;                  // GCS path prefix (always "hubs/{id}/")
  primaryFile: string;           // Main content file
  supportingFiles?: string[];    // Additional context files
  maxBytes?: number;             // Context budget (default: 50KB)
  
  // Discovery
  tags: string[];                // Keywords for query routing
  attractors?: string[];         // Concepts that pull toward this hub
  
  // Relationships
  related?: HubRelation[];       // Connections to other hubs
  
  // Lifecycle
  status: 'active' | 'draft' | 'deprecated';
}

interface HubRelation {
  hubId: string;
  relationship: 'enables' | 'extends' | 'contradicts' | 'complements';
}
```

**Example:**
```json
{
  "id": "ratchet-effect",
  "title": "The Ratchet Effect",
  "thesis": "AI capability propagates with predictable dynamics that favor distributed systems.",
  "path": "hubs/ratchet-effect/",
  "primaryFile": "ratchet-deep-dive.md",
  "maxBytes": 50000,
  "tags": ["ratchet", "capability", "propagation", "7-month", "doubling", "frontier", "edge"],
  "related": [
    { "hubId": "infrastructure-bet", "relationship": "enables" },
    { "hubId": "technical-architecture", "relationship": "complements" }
  ],
  "status": "active"
}
```

### Journey

A **Journey** is a choreographed collapse of possibility space. Each journey guides users through a sequence of insights until a target understanding crystallizes.

```typescript
interface Journey {
  // Identity
  id: string;                    // Unique identifier (e.g., "simulation")
  title: string;                 // Human name (e.g., "The Ghost in the Machine")
  description: string;           // What this journey explores
  
  // Structure
  entryNode: string;             // First node ID
  hubId: string;                 // REQUIRED — linked hub for RAG context
  
  // Outcome
  targetAha: string;             // The insight at journey's end
  estimatedMinutes: number;      // Expected completion time
  
  // Lifecycle
  status: 'active' | 'draft' | 'deprecated';
}
```

**Example:**
```json
{
  "id": "ratchet",
  "title": "The Ratchet",
  "description": "Why AI capability doubles every 7 months—and why you're 21 months behind.",
  "entryNode": "ratchet-hook",
  "hubId": "ratchet-effect",
  "targetAha": "The gap is constant, but the floor keeps rising. Ownership beats renting when the floor is high enough.",
  "estimatedMinutes": 10,
  "status": "active"
}
```

### Node

A **Node** is a waypoint that collapses superposition into specificity. Each node focuses the LLM on a particular question while maintaining narrative arc.

```typescript
interface Node {
  // Identity
  id: string;                    // Unique identifier (e.g., "ratchet-hook")
  label: string;                 // User-facing provocative label
  
  // Content
  query: string;                 // What the LLM should generate about
  contextSnippet: string;        // Grounding text for generation
  
  // Position
  journeyId: string;             // Parent journey
  sequenceOrder: number;         // Position in journey arc
  
  // Navigation
  primaryNext?: string;          // Next node in arc
  alternateNext?: string[];      // Exit ramps to other journeys/nodes
}
```

**Example:**
```json
{
  "id": "ratchet-hook",
  "label": "The 7-month clock.",
  "query": "Explain the Ratchet Effect. What does it mean that AI capability doubles every 7 months at frontier?",
  "contextSnippet": "AI capability doubles every 7 months at frontier. This isn't speculation—it's empirical pattern from the last 5 years.",
  "journeyId": "ratchet",
  "sequenceOrder": 1,
  "primaryNext": "ratchet-gap",
  "alternateNext": ["stakes-380b"]
}
```

---

## RAG Loading: The Two Modes

When a user sends a query, the Terminal loads context in two tiers:

### Tier 1: Default Context (Always Loaded)
- Budget: ~15KB
- Content: Grove overview, key concepts, visionary narrative
- Purpose: Ensure baseline understanding regardless of query

### Tier 2: Hub Context (Conditionally Loaded)
- Budget: ~50KB per hub
- Content: Hub's primary file + supporting files
- Purpose: Deep context for specific topics

**Mode Selection:**

```
Query arrives
    │
    ├── Journey active? ──► YES ──► Deterministic Mode
    │                              Load journey's hubId
    │
    └── NO ──► Discovery Mode
               Match query tags to hub tags
               Load best-matching hub
```

### Deterministic Mode
When a user is following a journey, the system loads the journey's linked hub automatically. This ensures consistent context throughout the narrative arc.

**Example:** User on `ratchet` journey → Always loads `ratchet-effect` hub

### Discovery Mode  
When a user asks a freeform question, the system matches query keywords against hub tags to find the most relevant context.

**Example:** User asks "what's the 7-month doubling cycle?" → Matches `ratchet-effect` tags → Loads that hub

---

## File Organization

```
data/
├── schema/
│   └── grove-knowledge-ontology.md    # This document
│
├── exploration/
│   ├── journeys.json                  # Journey definitions
│   └── nodes.json                     # Node definitions
│
├── knowledge/
│   ├── hubs.json                      # Hub definitions
│   └── default-context.json           # Tier 1 configuration
│
├── presentation/
│   └── lenses.json                    # Persona messaging
│
└── infrastructure/
    ├── gcs-mapping.json               # File path translations
    └── feature-flags.json             # Runtime toggles
```

---

## The Recursive Insight

This document is itself RAG content. When you ask the Terminal "how do journeys work?", this document provides the context for the answer.

The knowledge system explains itself through the knowledge system.

This is exploration architecture in action: the architecture that enables structured wandering through possibility space is itself navigable through that same architecture.

---

## Current Hubs

| Hub ID | Title | Journey |
|--------|-------|---------|
| `meta-philosophy` | You Are Already Here | simulation |
| `infrastructure-bet` | The $380B Infrastructure Bet | stakes |
| `ratchet-effect` | The Ratchet Effect | ratchet |
| `diary-system` | The Diary System | diary |
| `translation-emergence` | The Emergence Pattern | emergence |
| `technical-architecture` | Under the Hood | architecture |

---

## Design Principles

1. **Separation of Concerns** — Each file has one job
2. **Explicit Relationships** — All references are IDs that can be validated
3. **Deterministic by Default** — Journeys specify their context explicitly
4. **Discovery as Fallback** — Freeform queries still route to relevant hubs
5. **Self-Documenting** — The schema explains itself through RAG
6. **Backward Compatible** — Fallback to unified file if new structure missing

---

## Validation Rules

The schema validator enforces:

1. ✓ All JSON files parse without errors
2. ✓ Every `journey.hubId` points to an existing hub
3. ✓ Every `journey.entryNode` points to an existing node
4. ✓ Every `node.journeyId` points to an existing journey
5. ✓ Every `node.primaryNext` points to an existing node
6. ✓ All `hub.path` values follow `hubs/{id}/` pattern
7. ✓ No orphan hubs (every hub has at least one journey)
8. ✓ No orphan nodes (every node belongs to a journey)
