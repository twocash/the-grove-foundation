# Project Patterns Reference

This document explains how PROJECT_PATTERNS.md functions within the Foundation Loop methodology.

## Purpose

PROJECT_PATTERNS.md serves two functions:

1. **Philosophical Compass** — Grounds all decisions in Trellis/DEX principles
2. **Pattern Catalog** — Prevents architectural drift by documenting existing systems

## The Drift Problem

Without explicit pattern documentation, AI agents (and humans) naturally create parallel systems:

```
Session 1: "I need persona-reactive content" → Uses Quantum Interface
Session 2: "I need audience-specific text" → Creates new useAudienceConfig hook
Session 3: "I need lens-based rendering" → Creates third system
```

All three sessions needed the same thing. Pattern documentation breaks this cycle.

## Integration with Foundation Loop

### Phase 0: Pattern Check

Before ANY other work:

1. **Read PROJECT_PATTERNS.md** completely
2. **Map requirements** to existing patterns
3. **Document extensions** in SPEC.md
4. **Flag new patterns** for explicit approval

### In SPEC.md

Every specification MUST include:

```markdown
## Patterns Extended (MANDATORY)

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| [Need] | [Pattern] | [How to extend] |
```

### In ARCHITECTURE.md

Every architecture document MUST address DEX compliance:

```markdown
## DEX Compliance

- **Declarative Sovereignty:** [How domain experts modify behavior]
- **Capability Agnosticism:** [How it works across models]
- **Provenance:** [How attribution is tracked]
- **Organic Scalability:** [How it grows]
```

## The Pattern Catalog

PROJECT_PATTERNS.md documents these core patterns:

| Pattern | Use When | Key Files |
|---------|----------|-----------|
| **Quantum Interface** | Content changes based on user context | quantum-content.ts, useQuantumInterface.ts |
| **Engagement Machine** | Complex state transitions | engagement/, XState machines |
| **Narrative Schema** | Structured content loading | narratives-schema.ts, *.json |
| **Token Namespaces** | Surface-specific styling | globals.css, --chat-*, --grove-* |
| **Entropy Detection** | Behavior based on complexity | entropy detector, consumers |
| **Surface Composition** | Building new UI | surface/components/, surface/layouts/ |
| **Canonical Source Rendering** | Same capability needed in multiple surfaces | Canonical component + variant prop |

## The DEX Test

When evaluating any pattern (existing or proposed), apply:

> **Can a non-technical domain expert alter behavior by editing a schema file, without recompiling the application?**

If no, the feature is incomplete.

## Pattern 8: Canonical Source Rendering

**Need:** Same capability needed in multiple surfaces/contexts

**Philosophy:** Features have homes. Other surfaces visit, they don't recreate. The Terminal doesn't contain a lens picker—it *invokes* the Lenses view in a contextual rendering mode.

### Structure

```
src/explore/
├── LensPicker.tsx        ← Canonical home (one source of truth)
├── LensInspector.tsx     ← Canonical home
└── ...

components/Terminal/
├── Terminal.tsx          ← Invokes canonical, doesn't duplicate
└── ...
```

### Contextual Variants

Add variant props to canonical components:

```typescript
interface LensPickerProps {
  variant?: 'full' | 'inspector' | 'contextual' | 'embedded';
  onSelect?: (lens: Lens) => void;
}
```

| Variant | Rendering Context | Example |
|---------|-------------------|---------|
| `full` | Standalone page | `/lenses` route |
| `inspector` | Panel in workspace | Foundation Console |
| `contextual` | Sheet/overlay in calling surface | Terminal `/lens` command |
| `embedded` | Inline within parent | Settings panel |

### Invocation Pattern

```typescript
// Terminal.tsx - CORRECT
const handleLensCommand = () => {
  actions.showView('lenses'); // Emits intent
};

// Shell/Workspace intercepts and renders canonical component
<LensesView variant="contextual" onSelect={handleLensSelect} />
```

### DO NOT

- ❌ Copy components into surface-specific folders
- ❌ Create "mini" versions of existing views
- ❌ Build embedded pickers when canonical pickers exist
- ❌ Justify duplication with "it's simpler for this surface"

### Refactoring Existing Duplicates

When you discover duplication:

1. **Identify canonical home** (or create one)
2. **Add variant prop** to canonical if needed
3. **Update surfaces** to invoke canonical
4. **Delete duplicates**
5. **Document in ADR** why duplication was removed

## Anti-Pattern Detection

These are warning signs that you're about to violate DEX principles:

| Warning Sign | Violation | Correct Approach |
|--------------|-----------|------------------|
| Creating new Provider | Parallel state system | Extend Engagement Machine |
| Creating new JSON config loader | Parallel content system | Extend existing schema |
| `if (type === 'foo')` | Hardcoded domain logic | Move to config |
| New `use*` data hook | Parallel loading | Extend existing hooks |
| New CSS namespace | Style fragmentation | Extend existing namespace |
| Copying component to surface folder | Canonical source violation | Invoke canonical with variant |
| "Mini" version of existing view | Duplication drift | Add variant prop to canonical |

## Maintaining PROJECT_PATTERNS.md

### When to Update

- After introducing a genuinely new pattern (with approval)
- When pattern locations change (file moves, renames)
- When extension approaches are clarified
- When anti-patterns are discovered

### Who Updates

- Human approval required for new patterns
- File location updates can be done during sprints
- Anti-pattern additions after post-mortems

## Philosophy Reminder

> **Models are seeds. Architecture is soil.**

The pattern catalog is not bureaucracy—it is accumulated wisdom about how to build systems that embody DEX principles. Each pattern represents a proven way to honor Declarative Sovereignty, Capability Agnosticism, Provenance, and Organic Scalability.

When you extend a pattern, you leverage that accumulated wisdom. When you create a parallel system, you fragment it.

**We build the Trellis. The community brings the seeds.**
