# FOUNDATION_LOOP.md — engagement-orchestrator-v1

## Sprint Summary

| Attribute | Value |
|-----------|-------|
| Sprint ID | `engagement-orchestrator-v1` |
| Created | 2024-12-29 |
| Updated | 2024-12-29 (GroveObject pattern alignment) |
| Estimated Duration | 6-8 hours |
| Risk Level | Medium |
| Dependencies | kinetic-context-v1 (complete first) |

## Purpose

Unify all contextual content injection systems—reveals, offers, welcome variants, prompts—into a single declarative **Engagement Orchestrator**.

**Core Insight:** Every special experience in Grove (simulation reveal, custom lens offer, entropy journey offer) is a "moment" triggered by engagement conditions and rendered to a specific surface.

**Key Pattern:** Moments follow the `GroveObject<T>` pattern from Pattern 7, providing:
- Unified identity (`meta.id`, `meta.type`, `meta.title`)
- Provenance tracking (`meta.createdBy`)
- Lifecycle management (`meta.status`: draft → active → archived)
- Inspector compatibility (same patterns as lenses/journeys)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 ENGAGEMENT ORCHESTRATOR                      │
├─────────────────────────────────────────────────────────────┤
│  Moment Loader      → Evaluator    → Active Moments         │
│  (*.moment.json)         ↑               ↓                  │
│         ↓          Engagement State    Surfaces             │
│  GroveObject<T>          ↑               ↓                  │
│  Pattern              Engagement Bus ← User Actions         │
└─────────────────────────────────────────────────────────────┘
```

## Files Created (14)

| File | Purpose |
|------|---------|
| `src/core/schema/moment.ts` | Zod schemas + `Moment = GroveObject<MomentPayload>` |
| `src/core/engagement/moment-evaluator.ts` | Trigger evaluation logic |
| `src/data/moments/moment-loader.ts` | Vite glob import + validation |
| `src/data/moments/index.ts` | Loader exports |
| `src/data/moments/core/welcome-arrival.moment.json` | First visit welcome |
| `src/data/moments/core/simulation-reveal.moment.json` | Post-journey reveal |
| `src/data/moments/core/custom-lens-offer.moment.json` | Create your own lens |
| `src/data/moments/engagement/entropy-journey-offer.moment.json` | High complexity offer |
| `src/data/moments/education/first-sprout-prompt.moment.json` | Feature discovery |
| `src/surface/hooks/useMoments.ts` | React hook for surfaces |
| `src/surface/components/MomentRenderer/index.ts` | Barrel export |
| `src/surface/components/MomentRenderer/MomentCard.tsx` | Generic card renderer |
| `src/surface/components/MomentRenderer/component-registry.ts` | Component key→React mapping |

## Files Modified (6)

| File | Changes |
|------|---------|
| `src/core/schema/index.ts` | Add moment schema exports |
| `src/core/engagement/index.ts` | Add moment API exports |
| `src/core/engagement/machine.ts` | Add flags context + actions |
| `src/core/engagement/context.ts` | Extend context with flags + cooldowns |
| `hooks/useEngagementBus.ts` | Add moment event emissions |
| `src/surface/components/index.ts` | Add MomentRenderer export |

## Core Moments Defined

| Moment ID | Trigger | Surface |
|-----------|---------|---------|
| `welcome-arrival` | ARRIVAL + !welcomeCompleted | welcome |
| `simulation-reveal` | journeysCompleted >= 1 + !simulationRevealed | overlay |
| `custom-lens-offer` | exchangeCount >= 8 + !hasCustomLens | inline |
| `entropy-journey-offer` | entropy >= 0.7 | inline |
| `first-sprout-prompt` | exchangeCount >= 3 + sproutsCaptured = 0 | toast |

## Key ADRs

1. **Declarative JSON definitions** over code-embedded logic
2. **Priority-based conflict resolution** (0-100, highest wins)
3. **Explicit flags** for "shown" state persistence
4. **Component registry** for complex moment UIs
5. **Phased migration** with feature flag
6. **GroveObject pattern alignment** (ADR-012) - unified identity + provenance
7. **File-based moment storage** (ADR-013) - individual `.moment.json` files

## Foundation Loop Artifacts

| # | Artifact | Status |
|---|----------|--------|
| 1 | REPO_AUDIT.md | ✅ Complete |
| 2 | SPEC.md | ✅ Complete (GroveObject pattern) |
| 3 | ADR.md | ✅ Complete (+ADR-012, ADR-013) |
| 4 | MIGRATION_MAP.md | ✅ Complete (file-based storage) |
| 5 | STORY_BREAKDOWN.md | ✅ Complete (updated) |
| 6 | EXECUTION_PROMPT.md | ✅ Complete (GroveObject accessors) |
| 7 | DEV_LOG.md | ⏳ Ready for execution |
| 8 | FOUNDATION_LOOP.md | ✅ Complete |

## Execution Command

```bash
# After completing kinetic-context-v1
cd C:\GitHub\the-grove-foundation
cat docs/sprints/engagement-orchestrator-v1/EXECUTION_PROMPT.md | claude
```

## Advisory Council Alignment

| Advisor | Perspective |
|---------|-------------|
| **Park (10)** | Declarative is correct—keeps cognitive complexity in configuration |
| **Park (10)** | Pattern consistency reduces cognitive overhead |
| **Adams (8)** | Every moment should present meaningful forks with consequences |
| **Short (8)** | The meta-journey IS narrative design—moments are story beats |
| **Asparouhova (7)** | Governance-ready—moments become community-contributable |
| **Asparouhova (7)** | GroveObject pattern enables contribution workflows |
| **Buterin (6)** | Watch for gaming; ensure opt-out paths exist |

## Success Metrics

- [ ] 5 moment files created in `src/data/moments/`
- [ ] All moments pass `MomentSchema.parse()` validation
- [ ] `loadMoments()` returns 5 active moments
- [ ] `useMoments` hook returns correct moments per surface
- [ ] Telemetry events emit for moment lifecycle
- [ ] TypeScript compiles without errors
- [ ] Foundation ready for UI integration

## Follow-On Sprints

1. **moment-ui-integration-v1**: Wire MomentOverlay + MomentInline to actual surfaces
2. **moment-migration-v1**: Port existing reveals to moment definitions
3. **moment-testing-v1**: Unit tests + Storybook stories

---

## Why This Matters

The Engagement Orchestrator transforms Grove's UX choreography from scattered code into **infrastructure**:

- **Content team** can add moments without deploys
- **A/B testing** via probability triggers
- **Community contributions** become possible (GroveObject pattern)
- **Cross-surface consistency** automatic
- **Telemetry** built-in for optimization
- **Provenance tracking** knows who created each moment
- **Lifecycle management** supports draft → active workflow

This is the foundation for sophisticated, personalized journeys through Grove—the "meta-journey" of becoming a participant in distributed AI infrastructure.

---

*Foundation Loop complete. Ready for execution after kinetic-context-v1.*
