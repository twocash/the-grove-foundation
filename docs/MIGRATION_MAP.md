# Migration Map: Cognitive Simulator

## Current State (Post-Sprint 5)

### Implemented ✅
- **Entropy Detection:** `entropyDetector.ts` scores conversation complexity
- **Cognitive Bridge:** Inline injection with 800ms animation
- **Journey Routing:** Clusters map to V2.1 journeys
- **State Persistence:** Entropy state survives page refresh
- **Cooldown Logic:** 5 exchanges after dismiss, max 2 per session

### Static → Dynamic Transition Complete
| Before | After |
|--------|-------|
| Linear conversation, no depth awareness | Entropy scoring detects complexity |
| User manually discovers journeys | System proactively offers relevant paths |
| Simple keyword highlighting | Cluster detection + journey routing |

## Deprecations Applied

| Item | Status | Notes |
|------|--------|-------|
| `utils/threadGenerator.ts` | ✅ DELETED | Replaced by V2.1 journey navigation |
| `components/Terminal/JourneyEnd.tsx` | ✅ DELETED | Replaced by JourneyCompletion.tsx |
| `components/Terminal/ThreadProgress.tsx` | ✅ DELETED | Progress via journey node position |
| Static "Suggested Topics" | ✅ REMOVED | Replaced by entropy-driven bridge |
| V2.0 session fields | ✅ DEPRECATED | Shims kept for backward compat |

## Architecture Evolution

### Phase 1: Static Chat (Pre-Sprint 4)
```
User Input → Pattern Match → Response
                   ↓
          Static Suggestions
```

### Phase 2: Cognitive Simulator (Current)
```
User Input → Entropy Scoring → Classification
                   ↓
        ┌─────────┴─────────┐
        │                   │
    LOW/MEDIUM            HIGH
        │                   │
        ▼                   ▼
   Normal Chat      Cognitive Bridge
                          │
                    ┌─────┴─────┐
                    │           │
                 Accept      Dismiss
                    │           │
                    ▼           ▼
              Start Journey  Cooldown
```

### Phase 3: Knowledge Commons (Future)
```
Entropy → Bridge → Journey → Commons Attribution
                              │
                       ┌──────┴──────┐
                       │             │
                  L1-Hub Links   Citation Preview
```

## Data Contract

### Entropy State (localStorage: `grove-terminal-entropy`)
```typescript
interface EntropyState {
  lastScore: number;
  lastClassification: 'low' | 'medium' | 'high';
  injectionCount: number;           // Max: 2 per session
  cooldownRemaining: number;        // Decrements each exchange
  lastInjectionExchange: number;
}
```

### Cluster → Journey Mapping
```typescript
const CLUSTER_JOURNEY_MAP = {
  'ratchet': 'ratchet',           // Capability propagation
  'economics': 'stakes',          // Infrastructure bet
  'architecture': 'stakes',       // Technical architecture
  'knowledge-commons': 'stakes',  // Knowledge sharing
  'observer': 'simulation'        // Meta-philosophy
};
```

## Integration Checklist

### Sprint 4-5 (Complete)
- [x] Entropy detector module created
- [x] Scoring logic implemented
- [x] Classification thresholds defined
- [x] Cluster vocabulary populated
- [x] Journey mapping established
- [x] useNarrativeEngine entropy methods added
- [x] localStorage persistence working
- [x] CognitiveBridge component created
- [x] 800ms animation implemented
- [x] Terminal integration complete
- [x] Accept/Dismiss handlers wired
- [x] Cooldown logic functional

### Sprint 6 (In Progress)
- [ ] Analytics events added
- [ ] Funnel tracking wired
- [ ] Thresholds isolated to constants
- [ ] Journey metadata validated
- [ ] Baseline metrics documented

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/core/engine/entropyDetector.ts` | Scoring, classification, cluster routing |
| `hooks/useNarrativeEngine.ts` | State management, entropy evaluation |
| `components/Terminal/CognitiveBridge.tsx` | Bridge UI component |
| `components/Terminal.tsx` (~L943) | Bridge injection point |
| `data/narratives.json` | Journey/node/hub definitions |
| `utils/funnelAnalytics.ts` | Analytics event tracking |

---

*Last Updated: 2025-12-19*
