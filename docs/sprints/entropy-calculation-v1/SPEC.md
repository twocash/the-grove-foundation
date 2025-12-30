# entropy-calculation-v1: SPEC

**Sprint:** entropy-calculation-v1
**Created:** 2024-12-29
**Status:** Planning

---

## Problem Statement

Entropy is a core engagement metric measuring conversation divergence, but it's **never calculated**—always returns `0`. This breaks entropy-based moment triggers and undermines Pattern 5 (Feature Detection).

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Entropy calculation | Pattern 5: Feature Detection | Implement the entropy infrastructure Pattern 5 describes |
| Hub tracking in state | Pattern 2: Engagement Machine | Add `hubsVisited`, `pivotCount` to XState context |
| Consumer response | Pattern 5: Feature Detection | Moment triggers already consume entropy (just needs real values) |

## New Patterns Proposed

None. This sprint implements infrastructure that Pattern 5 already describes but wasn't built.

---

## Scope

### In Scope
- Create `entropyCalculator.ts` module
- Add hub tracking to XState context
- Add `HUB_VISITED`, `PIVOT_CLICKED` events
- Emit `SET_ENTROPY` after each exchange
- Unit tests for entropy calculation

### Out of Scope
- Query semantic similarity (future enhancement)
- ML-based topic classification
- Entropy visualization in UI
- Historical entropy trends

---

## Technical Design

### Entropy Formula

```
entropy = (hubDiversity * 0.4) + (journeyDivergence * 0.3) + (pivotBonus * 0.2) - (focusPenalty * 0.1)

Where:
- hubDiversity = uniqueHubs / min(exchanges, 8)  [0.0-1.0]
- journeyDivergence = 1 - (waypointsHit / waypointsTotal)  [0.0-1.0, or 0.5 if no journey]
- pivotBonus = min(pivotCount * 0.15, 0.3)  [0.0-0.3]
- focusPenalty = consecutiveRepeats * 0.1  [0.0-0.3 capped]

Result clamped to [0.0, 1.0]
```

### XState Context Additions

```typescript
// New fields in EngagementContext
hubsVisited: string[];           // Unique hub IDs
lastHubId: string | null;        // For consecutive detection
consecutiveHubRepeats: number;   // Same hub back-to-back
pivotCount: number;              // Concept span clicks
```

### Event Flow

```
User sends query
    ↓
Server responds with hubId
    ↓
emit.hubVisited(hubId)
    ↓
XState updates hubsVisited[], consecutiveHubRepeats
    ↓
emit.exchangeSent() (existing)
    ↓
Calculate entropy from context
    ↓
actor.send({ type: 'SET_ENTROPY', value })
    ↓
useMoments evaluates against new entropy
```

---

## DEX Compliance

- **Declarative Sovereignty:** Entropy thresholds in moment JSON files, not hardcoded
- **Capability Agnosticism:** Measures conversation patterns, not model outputs
- **Provenance:** Hub visits tracked with full attribution chain
- **Organic Scalability:** Multiple consumers (moments, analytics, future features) respond to same signal

---

## Files Inventory

### New Files
| File | Purpose |
|------|---------|
| `src/core/engine/entropyCalculator.ts` | Pure calculation function |
| `src/core/engine/entropyCalculator.test.ts` | Unit tests |

### Modified Files
| File | Changes |
|------|---------|
| `src/core/engagement/types.ts` | Add context fields |
| `src/core/engagement/machine.ts` | Add events and actions |
| `src/core/engagement/actions.ts` | Implement hub tracking actions |
| `hooks/useEngagementBus.ts` | Add `hubVisited` emitter |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Calculate and emit entropy |
| `server.js` | Return matched hubId in response |

---

## Acceptance Criteria

- [ ] Entropy updates after each exchange (visible in console logs)
- [ ] Entropy increases with hub diversity (5 unique hubs → ~0.6+)
- [ ] Entropy decreases with focus (same hub 5x → ~0.2)
- [ ] Pivot clicks increase entropy
- [ ] Journey adherence reduces entropy
- [ ] `entropy-journey-offer` trigger can use `entropy: { min: 0.4 }` again
- [ ] Unit tests cover edge cases (empty session, max entropy, etc.)

---

## Test Cases

| Scenario | Expected Entropy |
|----------|-----------------|
| First exchange, 1 hub | 0.1 - 0.2 |
| 5 exchanges, same hub | 0.1 - 0.2 |
| 5 exchanges, 5 different hubs | 0.5 - 0.7 |
| On journey, 3/5 waypoints complete | 0.2 - 0.4 |
| High pivots (5+), diverse hubs | 0.7 - 0.9 |
| Max entropy scenario | ≤ 1.0 (clamped) |

---

## Estimated Effort

**Medium** — 2-3 hours
- New calculation module: 30 min
- XState additions: 45 min  
- Integration in useKineticStream: 30 min
- Server hubId return: 15 min
- Testing: 45 min
