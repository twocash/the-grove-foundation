# Epic 7: Context Cleanup - Architecture Decision Records

**Sprint:** Engagement Phase 2
**Date:** 2024-12-24

---

## ADR-082: Remove Duplicate State, Keep Context Provider

### Status
Accepted

### Context
NarrativeEngineContext now has duplicate state management for lens, journey, and entropy. These are all handled by the new engagement hooks (useLensState, useJourneyState, useEntropyState).

### Decision
Remove the duplicate state management code from NarrativeEngineContext but keep the provider itself. It still serves as the schema provider.

### Rationale
- NarrativeEngineContext is the only place that fetches `/api/narrative`
- All schema access methods (getPersona, getJourney, getCard, etc.) live here
- Session tracking (exchangeCount, visitedCards) lives here and wasn't migrated
- First-time user detection lives here
- Removing the entire provider would require a much larger refactor

### Consequences
- Two providers coexist (NarrativeEngineProvider + EngagementProvider)
- Clear separation: schema in NarrativeEngine, state in Engagement
- Reduced code in NarrativeEngineContext (~194 lines)

---

## ADR-083: Keep Session Tracking in NarrativeEngineContext

### Status
Accepted

### Context
The session object in NarrativeEngineContext includes:
- `activeLens` (migrated to engagement)
- `exchangeCount` (NOT migrated)
- `visitedCards` (NOT migrated)
- `activeJourneyId`, `currentNodeId`, `visitedNodes` (migrated to engagement)

### Decision
Keep session tracking (exchangeCount, visitedCards) in NarrativeEngineContext. Do not migrate these to engagement hooks in this epic.

### Rationale
- Session tracking serves a different purpose than engagement state
- `exchangeCount` drives nudge behavior (when to show lens picker)
- `visitedCards` tracks content consumption for analytics
- These aren't "engagement state" in the XState sense
- Scope creep risk if we try to migrate everything

### Consequences
- Some session state remains in NarrativeEngineContext
- Terminal still uses both providers (which is fine)
- Clear boundary: engagement = lens/journey/entropy, session = tracking/analytics

---

## ADR-084: Remove Entropy Imports Entirely

### Status
Accepted

### Context
NarrativeEngineContext imports several items from entropyDetector:
- EntropyState, EntropyResult, DEFAULT_ENTROPY_STATE (types/defaults)
- calculateEntropy, shouldInject, updateEntropyState, dismissEntropy, getJourneyForCluster (functions)
- EntropyMessage (type)

### Decision
Remove all entropy-related imports from NarrativeEngineContext. The engagement hooks handle entropy calculation internally.

### Rationale
- useEntropyState encapsulates all entropy logic
- No component needs direct access to entropy calculation from NarrativeEngine
- Reduces coupling between NarrativeEngine and entropyDetector

### Consequences
- NarrativeEngineContext no longer knows about entropy
- Components that need entropy must use useEntropyState hook
- Cleaner import graph

---

## ADR-085: Terminal Keep Pattern During Cleanup

### Status
Accepted

### Context
Terminal.tsx currently imports both:
1. Old state from useNarrativeEngine (selectLens, startJourney, etc.)
2. New state from engagement hooks (engSelectLens, engStartJourney, etc.)

The Epic 6 migration added the new hooks alongside the old ones.

### Decision
Remove the old imports from Terminal.tsx. The engagement hooks are already wired up and working.

### Rationale
- Epic 6 verified that engagement hooks work correctly
- Terminal already uses engSelectLens, engStartJourney, etc. in handlers
- Old imports are now dead code

### Consequences
- Terminal has cleaner imports
- Single source of truth for engagement state
- No functional change (already using new hooks)

---

## ADR-086: No New Tests Required

### Status
Accepted

### Context
This epic removes code but doesn't add functionality. The existing 152 unit tests cover the behavior we're preserving.

### Decision
Do not add new tests for this epic. Rely on existing test suite to catch regressions.

### Rationale
- Tests should verify behavior, not implementation
- We're not changing behavior, only removing duplicate implementation
- TypeScript will catch missing interface fields at compile time
- Build gate after each phase catches errors early

### Consequences
- Fast execution (no test writing)
- Existing tests validate correct behavior
- Build failures indicate real problems

---

## ADR-087: Keep getActiveLensData Despite Removing selectLens

### Status
Accepted

### Context
`getActiveLensData()` returns the Persona object for the current active lens. It reads from `session.activeLens`. We're removing `selectLens` but components may still use `getActiveLensData`.

### Decision
Keep `getActiveLensData` in NarrativeEngineContext. It's a getter, not state management.

### Rationale
- It's a read-only helper that returns Persona data
- Components may use it for display purposes
- Removing it would require migrating all consumers
- The engagement hooks provide lens ID, not full Persona object

### Consequences
- `session.activeLens` remains in session object (for getActiveLensData)
- Components can get Persona data without knowing about engagement hooks
- Slight inconsistency (lens written by engagement, read via getActiveLensData)

### Note
This is acceptable for now. A future epic could migrate this to engagement if needed.

---

## Summary of Decisions

| ADR | Decision | Impact |
|-----|----------|--------|
| 082 | Keep provider, remove duplicate state | ~194 lines removed |
| 083 | Keep session tracking | Session stays in NarrativeEngine |
| 084 | Remove all entropy imports | Clean import graph |
| 085 | Remove old Terminal imports | Dead code removed |
| 086 | No new tests | Fast execution |
| 087 | Keep getActiveLensData | Getter remains available |
