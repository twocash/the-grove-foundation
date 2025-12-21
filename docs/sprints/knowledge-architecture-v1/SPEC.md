# Knowledge Architecture Rationalization — Specification

## Overview
Refactor the Terminal's RAG and navigation system from a single conflated 773-line JSON file into a properly separated, self-documenting architecture that embodies Grove's exploration architecture thesis.

## Goals

1. **Separate concerns** — Split `narratives.json` into distinct registries by domain
2. **Eliminate dual hub concepts** — Reconcile `topicHubs` and `hubs` into one canonical definition  
3. **Create explicit schema** — Define the ontology formally with validation
4. **Fix inconsistencies** — Standardize hub paths, ensure all journeys have hubs
5. **Self-document** — The schema itself becomes RAG content explaining the system

## Non-Goals

- Changing the RAG loading algorithm (tiered loading stays)
- Modifying the UI/UX of journeys
- Adding new journeys or content (separate sprint)
- Migrating storage from GCS to another provider
- Rewriting server.js beyond schema loading changes

## Current State Inventory

### `data/narratives.json` (773 lines)
- **Location:** `data/narratives.json:1-773`
- **Current behavior:** Single file containing 8 distinct concerns
- **Issues:** Conflation, dual hub definitions, inconsistent patterns, no validation

### `server.js` RAG Loading (170 lines)
- **Location:** `server.js:1040-1230`
- **Current behavior:** Loads from unified registry, supports deterministic + discovery modes
- **Issues:** No schema validation, assumes structure without checking

### Journey-Hub Mapping
- **Current:** 6 journeys → 5 linked hubs (1 orphan: `architecture`)
- **Issue:** `architecture` journey has `linkedHubId: null`

### Hub Path Patterns
- **Current:** 4 hubs use `hubs/{id}/`, 1 uses `knowledge/`
- **Issue:** Inconsistent path convention

## Target State

### New Directory Structure
```
data/
├── schema/
│   └── grove-knowledge-ontology.md      # Human-readable ontology definition
│
├── exploration/
│   ├── journeys.json                    # Journey definitions (topology)
│   └── nodes.json                       # Node definitions (content + topology)
│
├── knowledge/
│   ├── hubs.json                        # Hub definitions (semantic geography)
│   ├── default-context.json             # Tier 1 configuration
│   └── tags.json                        # Tag taxonomy (optional, future)
│
├── presentation/
│   ├── lenses.json                      # Persona messaging (lensRealities)
│   └── defaults.json                    # Default reality messaging
│
├── infrastructure/
│   ├── gcs-mapping.json                 # File path translations
│   └── feature-flags.json               # Runtime toggles
│
└── narratives.json                      # DEPRECATED: Backward compat shim
```

### Schema Ontology (Formalized)

**Hub** — A gravitational field in knowledge space
```typescript
interface Hub {
  id: string;                    // Unique identifier
  title: string;                 // Human-readable name
  thesis: string;                // One-sentence summary of what this hub teaches
  path: string;                  // GCS path prefix (always `hubs/{id}/`)
  primaryFile: string;           // Main content file
  supportingFiles?: string[];    // Additional files
  maxBytes?: number;             // Context budget (default: 50KB)
  tags: string[];                // Discovery Mode routing
  attractors?: string[];         // Concepts that pull toward this hub
  related?: HubRelation[];       // Explicit semantic topology
  status: 'active' | 'draft' | 'deprecated';
}

interface HubRelation {
  hubId: string;
  relationship: string;          // e.g., "enables", "contradicts", "extends"
}
```

**Journey** — A choreographed collapse of possibility space
```typescript
interface Journey {
  id: string;
  title: string;
  description: string;
  entryNode: string;             // First node ID
  hubId: string;                 // REQUIRED — must link to a hub (no nulls)
  targetAha: string;             // The insight at journey's end
  estimatedMinutes: number;
  status: 'active' | 'draft' | 'deprecated';
}
```

**Node** — A waypoint that collapses superposition into specificity
```typescript
interface Node {
  id: string;
  label: string;                 // User-facing provocative label
  query: string;                 // What the LLM should generate
  contextSnippet: string;        // Grounding text for generation
  journeyId: string;             // Parent journey
  sequenceOrder: number;
  primaryNext?: string;          // Next node in arc
  alternateNext?: string[];      // Exit ramps to other journeys
}
```

### Reconciled Hub List

| Hub ID | Title | Path | Journey Links |
|--------|-------|------|---------------|
| `meta-philosophy` | You Are Already Here | `hubs/meta-philosophy/` | simulation |
| `infrastructure-bet` | The $380B Infrastructure Bet | `hubs/infrastructure-bet/` | stakes |
| `ratchet-effect` | The Ratchet Effect | `hubs/ratchet-effect/` | ratchet |
| `diary-system` | The Diary System | `hubs/diary-system/` | diary |
| `translation-emergence` | The Emergence Pattern | `hubs/translation-emergence/` | emergence |
| `technical-architecture` | Under the Hood | `hubs/technical-architecture/` | architecture |

**Changes:**
- `translation-emergence` path normalized to `hubs/translation-emergence/`
- New `technical-architecture` hub created for `architecture` journey

### Removed Concepts

- **`globalSettings.topicHubs`** — Superseded by `hubs.json`
- **`globalSettings.systemPromptVersions`** — Move to `infrastructure/`
- **Inline feature flags** — Move to `infrastructure/feature-flags.json`

## Acceptance Criteria

### Structural
- [ ] AC-1: `narratives.json` split into ≥5 separate files by concern
- [ ] AC-2: No file contains more than 2 distinct concerns
- [ ] AC-3: All hub paths follow `hubs/{id}/` pattern
- [ ] AC-4: All journeys have non-null `hubId`
- [ ] AC-5: `technical-architecture` hub exists and links to `architecture` journey

### Functional
- [ ] AC-6: Deterministic Mode loads correct hub for each journey
- [ ] AC-7: Discovery Mode routes queries to hubs via tags
- [ ] AC-8: Default context (Tier 1) loads for all queries
- [ ] AC-9: Server starts without errors
- [ ] AC-10: Build completes without errors

### Validation
- [ ] AC-11: Schema validation script exists and passes
- [ ] AC-12: All hub references from journeys resolve
- [ ] AC-13: All node references from journeys resolve

### Documentation
- [ ] AC-14: `grove-knowledge-ontology.md` explains all concepts
- [ ] AC-15: Ontology file is registered as RAG content (self-documenting)
- [ ] AC-16: Migration documented for future reference

### Backward Compatibility
- [ ] AC-17: Legacy `narratives.json` shim works if new files missing
- [ ] AC-18: No breaking changes to existing Terminal UX

## Dependencies

- **None external** — This is internal refactoring
- **Prerequisite:** Full repo audit (complete)
- **Risk:** GCS file organization may need manual sync

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| GCS paths break after split | Medium | High | Test each hub's file resolution before committing |
| Server can't find new file structure | Low | High | Implement fallback to unified narratives.json |
| Discovery Mode accuracy drops | Low | Medium | Enrich tags during migration, test before deploy |
| Sprint scope creep (add content) | Medium | Medium | Explicit non-goal, defer to separate sprint |

## Success Definition

After this sprint:

1. A new developer can understand the knowledge architecture by reading `grove-knowledge-ontology.md`
2. Adding a new hub requires editing exactly one file (`hubs.json`)
3. Adding a new journey requires editing exactly two files (`journeys.json`, `nodes.json`)
4. The schema validates itself — missing references cause build failures
5. The Terminal continues to function identically from a user perspective
