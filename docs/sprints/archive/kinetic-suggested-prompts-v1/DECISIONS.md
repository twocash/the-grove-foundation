# Kinetic Suggested Prompts v1 — Architectural Decisions

**Sprint:** kinetic-suggested-prompts-v1  
**Date:** January 4, 2026

---

## ADR-001: Use Existing 4D Context Fields (NOT Template-Based)

### Status
**Accepted** — Critical decision

### Context
Two approaches were documented for suggested prompts:
1. **Template-based:** Create new `generatePrompts()` with string templates (outdated)
2. **4D Context Fields:** Wire existing `selectPrompts()` with full targeting schema

### Decision
Use the **existing 4D Context Fields system** located at `src/core/context-fields/`.

### Rationale
- The 4D system already exists and is more sophisticated
- 70 prompts already have full `PromptObject` schema with targeting, affinities
- `selectPrompts()` has hard filters + soft scoring algorithm
- Template-based approach would duplicate work and create drift
- Previous SPEC.md was based on outdated documentation

### Consequences
- Sprint is integration work, not building new infrastructure
- Must create adapter from EngagementContext → ContextState
- Deprecate legacy `usePromptSuggestions` and `scorePrompt.ts`

---

## ADR-002: Hook-Level Integration (NOT Machine-Level)

### Status
**Accepted**

### Context
Where to call `selectPrompts()` and inject navigation prompts:
- **Machine-level:** Modify EngagementMachine's `finalizeResponse` action
- **Hook-level:** Create `useNavigationPrompts` hook called by ResponseBlock

### Decision
Hook-level integration in ResponseBlock.

### Rationale
- XState machines should remain pure/synchronous where possible
- Hook leverages React memoization naturally
- Easier to test in isolation
- ResponseBlock already owns navigation rendering
- Machine is already complex (474 lines)
- Keeps state derivation close to consumption

### Consequences
- Hook called per ResponseBlock render (mitigated by useMemo)
- Navigation not persisted in stream history (acceptable - it's ephemeral)
- Consistent with React patterns

---

## ADR-003: Merge Strategy (Parsed > Library)

### Status
**Accepted**

### Context
Responses can have navigation from two sources:
1. **Parsed:** LLM emits `<navigation>` block (future v2)
2. **Library:** 4D system selects from prompt library

### Decision
Prefer parsed navigation if present, fall back to library prompts.

```typescript
const navigationForks = item.navigation?.length 
  ? item.navigation 
  : libraryForks;
```

### Rationale
- LLM-generated navigation is more contextual to response content
- Library prompts are always available as fallback
- Simple merge logic, no complex interleaving
- Easy to change strategy later

### Consequences
- v1 always shows library prompts (no parsing yet)
- v2 can add parsing without changing merge logic
- Clear precedence hierarchy

---

## ADR-004: Fork Type Inference from PromptObject

### Status
**Accepted**

### Context
`PromptObject` has rich metadata (targeting, affinities, variant).
`JourneyFork` needs a `type` field for styling.

### Decision
Infer fork type from PromptObject characteristics:

| Condition | Fork Type |
|-----------|-----------|
| `entropyWindow.min > 0.6` | `challenge` (stabilization) |
| `variant === 'urgent'` | `challenge` |
| `topicAffinities.length > 0` | `pivot` (connection) |
| `tags.includes('synthesis')` | `apply` (practical) |
| Default | `deep_dive` (exploration) |

### Rationale
- Uses existing metadata, no new fields needed
- Entropy-reactive prompts naturally become "stabilization" challenges
- Topic-connected prompts naturally become "pivot" suggestions
- Sensible defaults (deep_dive) for generic prompts

### Consequences
- Fork type is derived, not stored
- Authors can influence type via targeting/tags
- Easy to refine heuristics based on usage

---

## ADR-005: Stage Computation from Interaction Count

### Status
**Accepted**

### Context
`ContextState.stage` needs to be computed from engagement state.
Multiple possible signals: interaction count, sprout captures, journey progress.

### Decision
Simple interaction-count-based computation:

```typescript
function computeStage(interactionCount, sproutCount): Stage {
  if (interactionCount === 0) return 'genesis';
  if (interactionCount < 5) return 'exploration';
  if (sproutCount > 0) return 'advocacy';
  return 'synthesis';
}
```

### Rationale
- Simple, testable, deterministic
- Matches existing stage mapping in `mapSessionStageToStage`
- Sprout capture is a strong advocacy signal
- Can refine later with more sophisticated signals

### Consequences
- Stage progression is predictable
- May not capture all nuance of user journey
- Easy to enhance with additional signals

---

## ADR-006: Feature Flag for Safe Rollout

### Status
**Accepted**

### Context
Changing navigation experience could break user expectations.

### Decision
Add `INLINE_NAVIGATION_PROMPTS` feature flag:
- `true` (default): Use 4D-selected prompts
- `false`: No library prompts, only parsed navigation

### Rationale
- Safe rollout without code changes
- Quick rollback if issues arise
- Can A/B test different strategies
- Follows existing pattern in features.ts

### Consequences
- Small code overhead for flag check
- Must test both states
- Easy to remove flag once stable

---

## ADR-007: Deprecate Legacy Prompt Hooks

### Status
**Accepted**

### Context
Two parallel systems exist:
1. `src/explore/hooks/usePromptSuggestions.ts` (legacy)
2. `src/core/context-fields/scoring.ts` (canonical)

### Decision
Deprecate legacy with JSDoc annotations and console warnings.

```typescript
/**
 * @deprecated Use `useNavigationPrompts` instead.
 * Sprint: kinetic-suggested-prompts-v1
 */
export function usePromptSuggestions(...) {
  console.warn('[DEPRECATED] Use useNavigationPrompts');
  // ...
}
```

### Rationale
- Clear migration path for consumers
- Doesn't break existing code immediately
- Console warnings help surface usage
- Standard deprecation pattern

### Consequences
- Legacy code still works during transition
- Developers get warnings in console
- Can remove in future sprint after audit

---

*Decisions aligned with 4D Context Fields architecture and DEX principles.*
