# Architecture Decision Records: engagement-consolidation-v1

## ADR-001: Consolidate to EngagementBus

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** Two parallel engagement tracking systems exist, causing data inconsistency.

**Decision:** Extend EngagementBus to include stage computation. Delete TelemetryCollector.

**Rationale:**
- EngagementBus is more mature (503 lines vs 187)
- Has reveal queue, triggers, event history—features we need
- Single singleton pattern is cleaner
- TelemetryCollector was sprint-scoped, not architected for longevity

**Consequences:**
- All engagement state flows through one system
- Stage is derived property, not stored separately
- Migration needed for existing telemetry data

---

## ADR-002: Stage as Computed Property

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** Stage could be stored or computed. Which approach?

**Decision:** Stage is always computed from state + thresholds. Never stored directly.

**Rationale:**
- Single source of truth: state fields
- Threshold changes apply immediately
- No sync issues between stored stage and actual state
- Pure function enables easy testing

**Implementation:**
```typescript
// Computed on every state update
this.state.stage = computeSessionStage(this.state, thresholds);
```

**Consequences:**
- Slight compute overhead (negligible)
- Stage always accurate
- Easy to test in isolation

---

## ADR-003: Declarative Stage Thresholds

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** Per DEX Declarative Sovereignty, domain logic belongs in config.

**Decision:** Stage thresholds are config, not hardcoded logic.

**Implementation:**
```typescript
// src/core/config/defaults.ts
export const DEFAULT_STAGE_THRESHOLDS: StageThresholds = {
  oriented: { minExchanges: 3, minVisits: 2 },
  exploring: { minExchanges: 5, minTopics: 2 },
  engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
};
```

**Rationale:**
- Non-dev can tune thresholds by editing config
- Future: Lens-specific overrides
- A/B testing without code changes

**Consequences:**
- Threshold schema must be documented
- Runtime config validation helpful

---

## ADR-004: Migration Strategy for Legacy Data

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** Users may have data in `grove-telemetry` from adaptive-engagement sprint.

**Decision:** On first load, migrate `grove-telemetry` data into `grove-engagement-state`, then delete legacy key.

**Implementation:**
```typescript
// In EngagementBusSingleton constructor
private migrateFromLegacy(): void {
  const legacy = localStorage.getItem('grove-telemetry');
  if (!legacy) return;
  
  const data = JSON.parse(legacy);
  // Merge fields that don't exist in current state
  if (data.totalExchangeCount && !this.state.totalExchangeCount) {
    this.state.totalExchangeCount = data.totalExchangeCount;
  }
  if (data.sproutsCaptured) {
    this.state.sproutsCaptured = (this.state.sproutsCaptured || 0) + data.sproutsCaptured;
  }
  // etc.
  
  localStorage.removeItem('grove-telemetry');
  this.persistState();
}
```

**Rationale:**
- No user data loss
- Clean transition
- One-time migration, not ongoing sync

**Consequences:**
- Brief migration code (can be removed after ~30 days)
- Edge cases: partial data in both systems

---

## ADR-005: Single Hook for Stage Access

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** Which hook should consumers use to get stage?

**Decision:** `useEngagementState()` returns full state including `stage` field.

**Rationale:**
- Existing hook, no new API to learn
- Stage is part of engagement state conceptually
- Avoids hook proliferation

**Implementation:**
```typescript
const state = useEngagementState();
// state.stage is now available
// state.exchangeCount, state.topicsExplored, etc.
```

**Consequences:**
- useSuggestedPrompts reads from useEngagementState
- useSessionTelemetry hook deleted (redundant)
- Simple, predictable data flow

---

## ADR-006: Testing Strategy

**Status:** Accepted  
**Date:** 2025-12-27  
**Context:** What tests ensure consolidation works?

**Decision:** Three-tier testing approach.

| Tier | What | How |
|------|------|-----|
| Unit | Stage computation | Pure function test with mock state |
| Integration | Hook subscriptions | React Testing Library |
| E2E | User progression | Playwright flow test |

**Key Tests:**
1. `computeSessionStage` returns correct stage for threshold boundaries
2. `useEngagementState` updates when events emitted
3. Terminal shows correct stage after 3 exchanges

**Consequences:**
- Confidence in stage logic
- Regression protection
- ~30 minutes to write comprehensive tests
