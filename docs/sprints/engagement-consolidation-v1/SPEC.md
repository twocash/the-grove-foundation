# Specification: engagement-consolidation-v1

## Pattern Check ✅

Per PROJECT_PATTERNS.md:
- Pattern 11: Session Engagement Telemetry (extends Pattern 1)
- DEX Pillars: Declarative Sovereignty, Capability Agnosticism, Provenance, Organic Scalability

## Canonical Source Audit ✅

See REPO_AUDIT.md. Two redundant systems identified:
- EngagementBus (keep, extend)
- TelemetryCollector (delete, migrate)

## Requirements

### R1: Single Source of Truth

**MUST:** All engagement state flows through EngagementBusSingleton.
**MUST:** Single localStorage key: `grove-engagement-state`.
**MUST NOT:** Maintain parallel state systems.

### R2: Declarative Stage Thresholds

**MUST:** Stage thresholds defined in config file (not hardcoded).
**MUST:** Thresholds follow schema:

```typescript
interface StageThresholds {
  oriented: { minExchanges?: number; minVisits?: number };
  exploring: { minExchanges?: number; minTopics?: number };
  engaged: { minSprouts?: number; minVisits?: number; minTotalExchanges?: number };
}
```

**MUST:** Default thresholds work without config customization.

### R3: Stage Computation

**MUST:** SessionStage computed from EngagementState.
**MUST:** Stage recomputes on every state update.
**MUST:** Stages: ARRIVAL → ORIENTED → EXPLORING → ENGAGED.

Progression logic (OR conditions within tier, sequential across tiers):
- ORIENTED: 3+ exchanges OR 2+ visits
- EXPLORING: 5+ exchanges OR 2+ topics
- ENGAGED: 1+ sprout OR (3+ visits AND 15+ total exchanges)

### R4: Hook API

**MUST:** `useEngagementState()` returns EngagementState with `stage` field.
**MUST:** `useSuggestedPrompts(lensId)` reads from `useEngagementState()`.
**SHOULD:** Backward-compatible — existing consumers of useEngagementState unaffected.

### R5: Data Migration

**MUST:** On first load, migrate data from `grove-telemetry` to `grove-engagement-state` if exists.
**MUST:** Clear `grove-telemetry` after successful migration.
**MUST NOT:** Lose sprout counts, visit counts, or topic history.

### R6: UI Display

**MUST:** TerminalWelcome displays stage indicator.
**MUST:** Stage indicator shows emoji + label + exchange count.
**MUST:** Prompts adapt to stage via useSuggestedPrompts.

## Non-Requirements

- Server-side telemetry sync (defer to later sprint)
- A/B testing of prompts (defer)
- Admin UI for threshold tuning (defer)

## DEX Compliance Matrix

| Pillar | Implementation | Test |
|--------|---------------|------|
| Declarative Sovereignty | Thresholds in DEFAULT_STAGE_THRESHOLDS config | Can non-dev change thresholds by editing config? ✅ |
| Capability Agnosticism | Observe counts/timestamps, not model outputs | Works with any LLM? ✅ |
| Provenance | Session ID, timestamps, event history preserved | Can trace how user reached ENGAGED? ✅ |
| Organic Scalability | Defaults work, thresholds tunable per lens | New lens works without code? ✅ |

## Acceptance Criteria

1. [ ] Single localStorage key (`grove-engagement-state`)
2. [ ] Stage visible in TerminalWelcome
3. [ ] Prompts change based on stage
4. [ ] Data migrated from grove-telemetry
5. [ ] All deleted files removed
6. [ ] No TypeScript errors
7. [ ] Tests pass
8. [ ] Build succeeds

## New Pattern Proposal

Extends **Pattern 11: Session Engagement Telemetry** to clarify:

> Stage computation is a pure function of EngagementState + StageThresholds config.
> The EngagementBus singleton owns state. Hooks read from it.
> No parallel state systems. Single source of truth.
