# Architectural Decisions: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026

---

## ADR-001: Stage Naming Alignment

### Status
Accepted

### Context
The existing EngagementBus uses `SessionStage` with values: `ARRIVAL`, `ORIENTED`, `EXPLORING`, `ENGAGED`. The Context Fields spec uses `Stage` with values: `genesis`, `exploration`, `synthesis`, `advocacy`. We need to reconcile these.

### Options

**Option A: Replace SessionStage entirely**
- Pros: Clean, no mapping needed
- Cons: Breaking change across codebase, high risk

**Option B: Add Stage type, map from SessionStage**
- Pros: Backward compatible, incremental migration
- Cons: Two stage concepts in codebase

**Option C: Rename SessionStage values to match Stage**
- Pros: Single concept, clear semantics
- Cons: Requires updating all references

### Decision
**Option B: Add Stage type, map from SessionStage**

### Rationale
- Genesis is a proving ground; we don't want breaking changes
- Mapping function is trivial and testable
- Future Bedrock sprint can unify if needed

### Consequences
- `mapSessionStageToStage()` utility function required
- Both types exist temporarily
- Clear documentation needed on when to use which

---

## ADR-002: Prompt Storage Strategy

### Status
Accepted

### Context
PromptObjects need to be stored somewhere. Options range from hardcoded TS to full database integration via grove-data-layer.

### Options

**Option A: TypeScript constants (current approach)**
- Pros: Simple, type-safe
- Cons: Violates DEX, requires code changes to add prompts

**Option B: JSON files loaded at runtime**
- Pros: DEX-compliant, editable without code changes
- Cons: No runtime validation, no CRUD from UI

**Option C: Full grove-data-layer integration**
- Pros: CRUD, persistence, future-proof
- Cons: Overkill for Genesis, delays sprint

**Option D: JSON files + in-memory PromptCollection**
- Pros: DEX-compliant, testable, foundation for grove-data-layer
- Cons: Generated prompts lost on refresh (acceptable for Genesis)

### Decision
**Option D: JSON files + in-memory PromptCollection**

### Rationale
- JSON files satisfy Declarative Sovereignty
- In-memory collection enables generated prompt caching
- Pattern mirrors grove-data-layer for future migration
- Acceptable that generated prompts are session-scoped

### Consequences
- `src/data/prompts/*.json` for library prompts
- `PromptCollection` class for runtime management
- Generated prompts are ephemeral (session-only)
- Phase 2 (Bedrock) adds persistence via grove-data-layer

---

## ADR-003: Entropy Computation Location

### Status
Accepted

### Context
Entropy is computed by `entropyCalculator.ts` but needs to be available in EngagementState for Context Fields to access.

### Options

**Option A: Compute in useContextState only**
- Pros: Isolated to new code
- Cons: Duplicates computation, not available elsewhere

**Option B: Compute in EngagementProvider, expose via context**
- Pros: Single computation, available everywhere
- Cons: Modifies existing code

**Option C: Create separate useEntropy hook**
- Pros: Clean separation
- Cons: Another hook, potential sync issues

### Decision
**Option B: Compute in EngagementProvider, expose via context**

### Rationale
- Entropy is fundamental engagement state
- Single source of truth prevents drift
- useContextState can simply consume from EngagementState
- Minimal code change (add useMemo + field)

### Consequences
- EngagementState interface adds `computedEntropy: number`
- EngagementProvider computes on each relevant state change
- All consumers get entropy "for free"

---

## ADR-004: Hard Filter vs Soft Score Separation

### Status
Accepted

### Context
Some targeting criteria should completely exclude prompts (hard filters), while others should influence ranking (soft scoring). Need clear separation.

### Options

**Option A: All criteria affect score (0 = excluded)**
- Pros: Single algorithm
- Cons: Score 0 prompts still processed, unclear semantics

**Option B: Separate filter step before scoring**
- Pros: Clear semantics, performance (fewer prompts to score)
- Cons: Two-step algorithm

### Decision
**Option B: Separate filter step before scoring**

### Rationale
- Semantic clarity: "excluded" vs "low relevance" are different
- Performance: Hard filters can short-circuit early
- Debugging: Easier to understand why a prompt was excluded

### Consequences
- `applyHardFilters()` runs first, returns eligible prompts
- `rankPrompts()` scores only eligible prompts
- Hard filters: stage mismatch, lens excluded, minInteractions not met
- Soft scoring: entropy fit, topic affinity, moment boost

---

## ADR-005: Testing Strategy

### Status
Accepted

### Context
Context Fields introduces significant new logic. Need to decide testing approach per Foundation Loop methodology.

### Options

**Option A: E2E only (behavior tests)**
- Pros: Tests real user experience
- Cons: Slow, hard to isolate failures

**Option B: Unit tests only**
- Pros: Fast, isolated
- Cons: Doesn't test integration

**Option C: Pyramid approach (unit → integration → E2E)**
- Pros: Comprehensive, fast feedback
- Cons: More test code to maintain

### Decision
**Option C: Pyramid approach**

### Rationale
- Foundation Loop mandates testing as process
- Scoring algorithm is pure function → unit test extensively
- Hook integration → integration test with mocks
- User experience → E2E for critical paths only

### Consequences

**Unit Tests (P1):**
- `scoring.test.ts` - 100% coverage on calculateRelevance()
- `collection.test.ts` - CRUD operations

**Integration Tests (P1):**
- `useSuggestedPrompts.test.ts` - Mock EngagementBus, verify output
- `useContextState.test.ts` - Mock sources, verify aggregation

**E2E Tests (P2):**
- `genesis-prompts.spec.ts` - Prompts visible on /explore
- `lens-personalization.spec.ts` - Lens changes selection

---

## ADR-006: Moment Infrastructure

### Status
Accepted (Minimal Implementation)

### Context
Context Fields spec includes "moments" (temporary high-signal events that boost prompts). Need to decide implementation scope for Genesis.

### Options

**Option A: Full moment system**
- Event detection
- Moment duration/decay
- Moment stacking rules
- Pros: Complete feature
- Cons: Scope creep, delays sprint

**Option B: Stub implementation**
- activeMoments always empty array
- Infrastructure in place but not active
- Pros: Unblocks sprint, architecture ready
- Cons: Feature not demonstrated

**Option C: Single hardcoded moment**
- Detect one moment type (e.g., "high_entropy")
- Prove pattern works
- Pros: Demonstrates feature, minimal scope
- Cons: Limited demonstration

### Decision
**Option C: Single hardcoded moment**

Implement `high_entropy` moment that activates when entropy > 0.7. This:
- Proves the architecture
- Has clear user value (stabilization prompts)
- Minimal implementation

### Rationale
- Advisory Council (Adams, Park): "Ship something that works"
- High entropy stabilization is already in spec
- Pattern is extensible for future moments

### Consequences
- EngagementProvider detects entropy > 0.7 → adds 'high_entropy' moment
- Dr. Chiang stabilization prompt targets this moment
- Future sprint adds moment framework

---

## ADR-007: Generator Implementation Scope

### Status
Accepted (Basic Implementation)

### Context
Spec includes async prompt generation from telemetry. Need to decide Genesis scope.

### Options

**Option A: Full generator with LLM integration**
- Pros: Complete feature
- Cons: Requires API integration, error handling, rate limiting

**Option B: Generator stub (returns empty)**
- Pros: Unblocks sprint
- Cons: Feature not demonstrated

**Option C: Simple rule-based generator**
- No LLM, uses heuristics to suggest prompts
- E.g., "You haven't explored [topic], would you like to?"
- Pros: Demonstrates pattern, no API dependency
- Cons: Not "true" generation

### Decision
**Option C: Simple rule-based generator**

### Rationale
- Genesis is offline-capable (no guaranteed API access)
- Rule-based generation proves the architecture
- LLM integration is Phase 2 enhancement
- Advisory Council (Park): "Demonstrate the pattern before scaling it"

### Consequences
- `PromptGenerator` uses telemetry to identify gaps
- Generates simple "template" prompts
- No LLM call in Genesis
- Bedrock sprint adds LLM-powered generation

---

## ADR-008: Off-Topic Detection Strategy

### Status
Accepted

### Context
Spec requires detecting when user is off-topic and surfacing redirect prompts. Need detection strategy.

### Options

**Option A: LLM classification of each query**
- Pros: Accurate
- Cons: Latency, API dependency

**Option B: Keyword matching**
- Pros: Fast, offline
- Cons: Brittle, false positives

**Option C: Topic cluster matching**
- User query compared to known topic clusters
- If no cluster matches, increment offTopicCount
- Pros: Semantic-ish without LLM
- Cons: Requires topic embeddings or heuristics

**Option D: Response-based inference**
- If RAG retrieval returns low-confidence results
- If response entropy delta is high
- Pros: Uses existing signals
- Cons: Indirect measurement

### Decision
**Option D: Response-based inference**

### Rationale
- Genesis already tracks topic routing
- If topicRouter returns no match → likely off-topic
- If entropy spikes after response → conversation scattered
- No new infrastructure required

### Consequences
- `offTopicCount` increments when topicRouter returns null/default
- Threshold: 2 consecutive off-topic → surface redirect prompt
- Redirect prompt is a library prompt with `variant: 'subtle'`
- Counter resets on any on-topic interaction

---

## Decisions Complete

**Total ADRs:** 8  
**Status:** All Accepted  
**Ready for:** Phase 6 (Story Breakdown)
