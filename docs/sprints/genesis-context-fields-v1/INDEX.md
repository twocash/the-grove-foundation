# Sprint: genesis-context-fields-v1

**Status:** ✅ Complete
**Domain:** Genesis (Marketing Site)
**Duration:** 1 day
**Branch:** `feat/context-fields`
**Started:** January 2, 2026
**Completed:** January 2, 2026

---

## Objective

Replace the Journey system with **Context Fields**—a DEX-native architecture that surfaces contextual prompts based on multi-dimensional user state rather than linear progression paths.

## Three Key Architectural Shifts

| From | To |
|------|-----|
| Journeys (linear paths) | Context Fields (4-dimensional targeting) |
| Prompts as config | Prompts as first-class DEX objects |
| Static library | Hybrid generation (library + contextual) |

## The Four Dimensions

| Dimension | Question | Type |
|-----------|----------|------|
| **Stage** | Where in the lifecycle? | Discrete enum: genesis → exploration → synthesis → advocacy |
| **Entropy** | How focused vs. exploring? | Continuous 0.0–1.0, decays to 0.5 |
| **Lens** | What perspective active? | String ID (flat hierarchy) |
| **Moment** | Did something specific just happen? | Event trigger (additive boosts) |

## Immediate Use Case

**Dr. Chiang Genesis Experience:** A lens configuration for Purdue's president demonstrating personalized, context-aware exploration.

## Migration Path

```
Genesis (prove architecture) → Bedrock (foundational infrastructure)
```

---

## Sprint Artifacts

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 | Pattern Check | ✅ |
| 0.5 | Canonical Source Audit | ✅ |
| 1 | [REPO_AUDIT.md](./REPO_AUDIT.md) | ✅ |
| 2 | [SPEC.md](./SPEC.md) | ✅ |
| 3 | [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ |
| 4 | [MIGRATION_MAP.md](./MIGRATION_MAP.md) | ✅ |
| 5 | [DECISIONS.md](./DECISIONS.md) | ✅ |
| 6 | [SPRINTS.md](./SPRINTS.md) | ✅ |
| 7 | [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | ✅ |
| 8 | [DEVLOG.md](./DEVLOG.md) | ✅ |
| 9 | [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | ✅ |

---

## Key Decisions (Pre-Resolved)

- **Entropy Decay:** Decays toward 0.5 (neutral), not lens-specific baseline
- **Moment Stacking:** Multiple active moments ADD their boosts (not multiply)
- **Lens Hierarchy:** Flat collection. `dr-chiang` and `academic` are peers, not parent-child
- **Cold Start:** Library-only until 2 interactions
- **Off-Topic Handling:** If user is repeatedly off-topic, surface reminder of system purpose
- **Scoring:** Hard filters before soft scoring

---

## Dependencies

- `grove-data-layer-v1` ✅ COMPLETE — Provides useGroveData<T> for prompt storage
- Engagement Bus — Provides stage, entropy, lens, moment signals
- Entropy Calculator — Existing calculateEntropy() function

---

## Success Criteria

### Functional
- [x] Context Fields surfaces relevant prompts based on 4 dimensions
- [x] Weighted scoring produces sensible rankings
- [x] Dr. Chiang lens delivers differentiated experience
- [x] Generated prompts appear after 2 interactions
- [x] High entropy triggers stabilization prompts
- [x] Prompts can be added/modified via JSON without code changes

### DEX Compliance
- [x] **Declarative Sovereignty:** Domain expert can create new lens by editing config
- [x] **Capability Agnosticism:** System degrades gracefully if generation fails
- [x] **Provenance:** Generated prompts include telemetry snapshot
- [x] **Organic Scalability:** Adding new prompts requires only config changes

---

## Contacts

- **Owner:** Jim Calhoun
- **Architecture Reference:** `/mnt/user-data/outputs/context-fields-architecture-spec-v2.md`
- **Advisory Council:** Joon Sung Park (feasibility), Emily Short (narrative), Adams (engagement)
