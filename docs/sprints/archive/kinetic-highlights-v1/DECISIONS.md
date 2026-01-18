# Architecture Decisions: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## ADR-001: Extend PromptObject vs. Create HighlightObject

### Context

Need to connect highlighted text to rich prompts. Options:
1. Create new `HighlightObject` type with its own system
2. Extend `PromptObject` with surface and trigger fields

### Decision

**Extend PromptObject with `surfaces` and `highlightTriggers` fields.**

One object type serves all rendering contexts. This follows DEX principles: no parallel systems, single source of truth.

### Consequences

**Positive:**
- Single type, single scoring system, single admin UI
- New surfaces slot in naturally
- Consistent provenance tracking

**Negative:**
- PromptObject gets slightly larger
- Some fields only relevant for certain surfaces

### Status: ACCEPTED

---

## ADR-002: Surfaces as Explicit Field

### Context

Could determine surface capability through:
1. Explicit `surfaces` field
2. Inference from other fields (has triggers → can highlight)
3. Separate lookup tables

### Decision

**Add explicit `surfaces: PromptSurface[]` field with default `['suggestion']`.**

Explicit is better than implicit. Makes capability visible in data.

### Consequences

**Positive:**
- Clear, self-documenting data
- Easy to filter/query
- Backward compatible default

**Negative:**
- Must set field when creating prompts
- Slightly more data per prompt

### Status: ACCEPTED

---

## ADR-003: Trigger Match Modes

### Context

How to match highlighted text to triggers:
1. Exact string match only
2. Contains (substring) match
3. Regex patterns
4. Semantic (embedding) similarity

### Decision

**Support `exact` and `contains` modes in this sprint. Semantic matching deferred.**

Exact and contains cover 80% of use cases. Semantic matching adds complexity and requires embeddings infrastructure.

### Consequences

**Positive:**
- Simple, predictable matching
- No embedding dependencies
- Fast lookup

**Negative:**
- May miss variations ("distributed ownership" vs "distributing ownership")
- Future sprint needed for semantic

### Status: ACCEPTED

---

## ADR-004: Lookup Priority Order

### Context

When multiple prompts could match, which wins?

### Decision

**Priority: Exact match → Contains match → Affinity scoring**

Most specific match wins. Affinity only as fallback when no direct trigger match.

### Consequences

**Positive:**
- Predictable behavior
- Authored exact matches take precedence
- Affinity provides graceful degradation

**Negative:**
- Multiple exact matches? First wins (alphabetical by ID)

### Status: ACCEPTED

---

## ADR-005: Fallback Behavior

### Context

What happens when no backing prompt is found?

Options:
1. Send raw surface text (current behavior)
2. Send enhanced fallback prompt
3. Show "no prompt available" UI

### Decision

**Send enhanced fallback prompt that acknowledges the click context.**

```typescript
`Tell me more about "${spanText}" in the context of what we've been discussing.`
```

Better than raw text, doesn't require UI changes.

### Consequences

**Positive:**
- Improved over raw text
- No UI disruption
- Graceful degradation

**Negative:**
- Not as good as curated prompt
- User doesn't know it's fallback

### Status: ACCEPTED

---

## ADR-006: Separate Highlights File

### Context

Where to store highlight prompts?

1. In existing prompt files
2. New `highlights.prompts.json` file
3. Generated dynamically

### Decision

**Create new `highlights.prompts.json` file for authored highlight prompts.**

Logical separation, easy to find, clear purpose.

### Consequences

**Positive:**
- Clear organization
- Easy to edit highlight-specific prompts
- Can import separately if needed

**Negative:**
- Another file to maintain
- Must remember to import

### Status: ACCEPTED

---

## ADR-007: Case Sensitivity Default

### Context

Should trigger matching be case-sensitive by default?

### Decision

**Case-insensitive by default, with `caseSensitive: true` option.**

Most highlights don't care about case. Option available for acronyms (AI, API).

### Consequences

**Positive:**
- "distributed ownership" matches "Distributed Ownership"
- Less friction for authors
- Option for edge cases

**Negative:**
- Small performance cost for toLowerCase()

### Status: ACCEPTED

---

## ADR-008: Hook vs. Direct Import

### Context

How should ExploreShell access lookup function?

1. Direct import of `findPromptForHighlight`
2. React hook that manages prompts
3. Context provider

### Decision

**Use React hook `usePromptForHighlight` that wraps lookup and prompt loading.**

Hook pattern consistent with other prompt hooks. Manages loading state.

### Consequences

**Positive:**
- Consistent with codebase patterns
- Handles loading state
- Easy to test/mock

**Negative:**
- Another hook import
- Slight indirection

### Status: ACCEPTED

---

## ADR-009: UI for Highlight Triggers

### Context

How to edit highlight triggers in Prompt Workshop?

1. JSON text field
2. Chip-based add/remove UI
3. Inline editable table

### Decision

**Chip-based UI with add form.**

Intuitive, matches existing patterns, prevents JSON syntax errors.

### Consequences

**Positive:**
- User-friendly
- Prevents malformed data
- Visual feedback

**Negative:**
- Custom component to build
- Limited bulk edit capability

### Status: ACCEPTED

---

## ADR-010: Integration with existing handleConceptClick

### Context

How invasive should the ExploreShell changes be?

1. Minimal: just add lookup call
2. Refactor: extract handler to separate hook
3. Major: restructure click handling

### Decision

**Minimal: add lookup call and conditional logic in existing handler.**

Low risk, easy to implement, easy to revert.

### Consequences

**Positive:**
- Small diff
- Low risk
- Easy to understand

**Negative:**
- Handler grows slightly
- More dependencies in component

### Status: ACCEPTED

---

## Summary Table

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Extend PromptObject, don't create new type | ACCEPTED |
| 002 | Explicit surfaces field with default | ACCEPTED |
| 003 | Exact and contains modes (no semantic yet) | ACCEPTED |
| 004 | Priority: exact → contains → affinity | ACCEPTED |
| 005 | Enhanced fallback prompt | ACCEPTED |
| 006 | Separate highlights.prompts.json file | ACCEPTED |
| 007 | Case-insensitive by default | ACCEPTED |
| 008 | Use React hook for lookup | ACCEPTED |
| 009 | Chip-based trigger editor UI | ACCEPTED |
| 010 | Minimal changes to ExploreShell | ACCEPTED |

---

*Decisions complete. Ready for MIGRATION.md generation.*
