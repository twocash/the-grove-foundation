# REPO_AUDIT.md — engagement-orchestrator-v1

## Executive Summary

This sprint unifies all contextual content injection systems—reveals, offers, welcome variants, prompts—into a single declarative **Engagement Orchestrator**. Currently, these systems are fragmented across multiple hooks, components, and state machines.

## Current State: Fragmented Systems

### 1. Reveal System (`components/Terminal/Reveals/`)

| Component | Trigger Condition | Surface |
|-----------|-------------------|---------|
| `SimulationReveal` | `journeysCompleted >= 1 && !simulationRevealed` | Overlay |
| `CustomLensOffer` | `exchangeCount >= N && !hasCustomLens` | Overlay |
| `TerminatorMode` | Deep engagement threshold | Overlay |
| `FounderStory` | Engagement funnel stage | Overlay |

**State managed by:** `useEngagementBridge` + `useTerminalState.reveals`

### 2. Welcome System (`components/Terminal/TerminalWelcome.tsx`)

**Personalization:** Lens-specific heading, thesis, prompts via `quantum-content.ts`
**Stage awareness:** Uses `useSuggestedPrompts` for adaptive content
**Surface:** Welcome card in stream

### 3. Inline Offers (`KineticStream/Stream/blocks/`)

| Component | Trigger | Surface |
|-----------|---------|---------|
| `LensOfferObject` | LLM `<lens_offer>` tag | Inline stream item |
| `JourneyOfferObject` | LLM `<journey_offer>` tag (pending) | Inline stream item |

**State managed by:** Stream item type discrimination

### 4. Engagement State (`@core/engagement/`)

```
src/core/engagement/
├── index.ts              # Public API
├── machine.ts            # XState engagement machine
├── context.ts            # React context provider
├── hooks/
│   ├── useLensState.ts   # Lens selection
│   ├── useJourneyState.ts # Journey progression
│   └── useEntropyState.ts # Complexity tracking
```

**Key state shape:**
```typescript
interface EngagementState {
  stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
  exchangeCount: number;
  journeysCompleted: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  // Flags
  simulationRevealed: boolean;
  customLensOffered: boolean;
  terminatorUnlocked: boolean;
  founderStoryShown: boolean;
}
```

### 5. Engagement Bus (`hooks/useEngagementBus.ts`)

Event emission system for telemetry and state updates:
```typescript
emit.exchangeSent(query, responseLength, nodeId?)
emit.journeyStarted(journeyId, totalSteps)
emit.journeyCompleted(journeyId, durationMinutes, stepsCompleted)
emit.lensSelected(lensId, isCustom, fromArchetype?)
emit.sproutCaptured(sproutId, tags)
emit.topicExplored(topic, context)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/core/schema/moment.ts` | Moment type definitions |
| `src/core/engagement/moment-evaluator.ts` | Trigger evaluation logic |
| `src/core/engagement/moment-registry.ts` | Moment registration + lookup |
| `src/data/moments/core-moments.json` | Core moment definitions |
| `src/surface/hooks/useMoments.ts` | React hook for surfaces |

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/engagement/index.ts` | Export moment APIs |
| `src/core/engagement/machine.ts` | Add `flags` context |
| `hooks/useEngagementBus.ts` | Add moment event emission |
| `src/core/schema/index.ts` | Export moment types |

## Files to Eventually Deprecate (Phase 2)

| File | Replaced By |
|------|-------------|
| `components/Terminal/Reveals/SimulationReveal.tsx` | Moment component registry |
| `components/Terminal/Reveals/CustomLensOffer.tsx` | Moment component registry |
| `useTerminalState.reveals` | `useMoments` hook |
| `useEngagementBridge.showSimulationReveal` | Moment trigger evaluation |

## Dependencies

**Existing (no new packages):**
- XState (state machine)
- Zod (schema validation)
- React context + hooks

**Internal dependencies:**
- `@core/engagement` (existing state machine)
- `@core/schema` (type exports)
- Engagement Bus (event emission)

## Key Patterns to Preserve

### 1. Declarative Configuration
All moment definitions should be JSON, not code. This enables:
- Content team updates without deploys
- A/B testing via probability triggers
- Community contributions (future)

### 2. DEX Compliance
- **Declarative Sovereignty:** Moments defined in config, not code
- **Capability Agnosticism:** Works across Terminal, Kinetic, future surfaces
- **Provenance as Infrastructure:** All moment events tracked
- **Organic Scalability:** New moments added without code changes

### 3. Priority-Based Conflict Resolution
When multiple moments are eligible, highest priority wins. Only one moment per surface at a time (unless explicitly stackable).

### 4. Lens-Aware Variants
Moments can have lens-specific content variants. Evaluator picks variant based on active lens.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing reveal logic | Parallel implementation, feature flag migration |
| Performance (evaluating all moments) | Memoization, event-driven re-evaluation |
| Complex trigger conditions | Composable trigger predicates, unit tests |
| State synchronization | Single source of truth in engagement machine |

## Success Criteria

- [ ] All existing reveals expressible as moment definitions
- [ ] `useMoments` hook works in both Terminal and Kinetic
- [ ] Telemetry captures moment shown/engaged/dismissed
- [ ] New moments addable via JSON only
- [ ] TypeScript types for all schemas

---

*Audit complete. Ready for SPEC.md.*
