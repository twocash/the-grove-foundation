# Repository Audit: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Auditor:** Claude (Foundation Loop)

---

## 1. Scope Analysis

### Files IN Scope

| File | Current Purpose | Context Fields Role |
|------|-----------------|-------------------|
| `hooks/useSuggestedPrompts.ts` | Stage-based prompt selection | **REWRITE** → 4D context targeting |
| `src/data/prompts/stage-prompts.ts` | Static prompt library | **REPLACE** → PromptObject schema |
| `src/core/schema/suggested-prompts.ts` | Type definitions | **EXTEND** → PromptObject, ContextTargeting |
| `src/core/schema/engagement.ts` | Stage, lens, moment types | **REFERENCE** → Input to context state |
| `src/core/engine/entropyCalculator.ts` | Entropy calculation | **REFERENCE** → Input to context state |
| `hooks/useEngagementBus.ts` | Engagement state access | **REFERENCE** → Consumes stage, lens |
| `src/core/data/use-grove-data.ts` | CRUD hook | **USE** → Prompt persistence |

### Files OUT of Scope

| File | Reason |
|------|--------|
| `src/core/journey/*` | Deprecated by design, not actively modified |
| `src/bedrock/*` | Phase 2 (after Genesis proves architecture) |
| `hooks/useJourneyProgress.ts` | Deprecated—will be removed post-sprint |

---

## 2. Current State Analysis

### 2.1 Prompt System

**Current Flow:**
```
EngagementBus.stage → useSuggestedPrompts() → stagePromptsConfig → filtered prompts
```

**Key Files:**

**hooks/useSuggestedPrompts.ts (152 lines)**
- Reads stage from EngagementBus via `useEngagementState()`
- Filters by `lensAffinity` and `lensExclude`
- Uses weighted random selection
- Substitutes dynamic variables
- Has TD-003 technical debt marker (imperative filtering)

**src/data/prompts/stage-prompts.ts (219 lines)**
- Static TypeScript export (violates DEX)
- 4 stages: ARRIVAL, ORIENTED, EXPLORING, ENGAGED
- ~6 prompts per stage
- Includes journey suggestions (to be deprecated)

**Observations:**
- No entropy dimension in current filtering
- No moment triggers
- No prompt analytics (impressions, selections)
- No generated prompts
- Hardcoded journey references

### 2.2 Engagement System

**src/core/schema/engagement.ts (224 lines)**
- SessionStage type: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED'
- EngagementState includes: stage, exchangeCount, topicsExplored, activeLensId, entropy (via calculator)
- StageThresholds configurable
- Well-structured, DEX-compliant

**src/core/engine/entropyCalculator.ts (80 lines)**
- Pure function: `calculateEntropy(inputs: EntropyInputs): number`
- Inputs: hubsVisited, exchangeCount, pivotCount, journeyWaypointsHit, etc.
- Output: 0.0–1.0 continuous value
- No decay mechanism (spec requires decay to 0.5)

### 2.3 Data Layer

**src/core/data/use-grove-data.ts (224 lines)**
- `useGroveData<T>(type)` hook with CRUD operations
- Types supported: 'lens', 'journey', 'hub', etc.
- Need to add 'prompt' type
- Uses LocalStorageAdapter in dev, HybridAdapter in prod

**src/core/data/grove-data-provider.ts**
- GroveObjectType enum needs 'prompt' added
- Adapter pattern supports extension

---

## 3. Technical Debt Register

| ID | Description | Location | Impact |
|----|-------------|----------|--------|
| TD-001 | Journey suggestions hardcoded | stage-prompts.ts | Will be deprecated |
| TD-003 | Imperative prompt filtering | useSuggestedPrompts.ts | Will be replaced |
| NEW | No entropy dimension in prompts | useSuggestedPrompts.ts | Critical gap |
| NEW | No moment triggers | useSuggestedPrompts.ts | Critical gap |
| NEW | No prompt analytics | Nonexistent | Needed for scoring |
| NEW | Stage names inconsistent | ARRIVAL vs genesis | Mapping required |

---

## 4. Dependency Analysis

### Runtime Dependencies

```
useSuggestedPrompts
├── useEngagementState (from useEngagementBus.ts)
│   ├── stage: SessionStage
│   ├── exchangeCount: number
│   ├── topicsExplored: string[]
│   ├── activeLensId: string | null
│   └── journeysCompleted: number
├── stagePromptsConfig (from stage-prompts.ts)
│   └── stages: Record<SessionStage, StagePromptConfig>
└── [MISSING] entropyValue (from entropyCalculator via EngagementBus)
```

### Build Dependencies

- TypeScript 5.x
- React 18.x
- Vitest for testing
- No external API calls (Genesis is offline-capable)

---

## 5. Test Coverage Assessment

### Current Tests (hooks/useSuggestedPrompts)

| Test | Exists | Status |
|------|--------|--------|
| Returns prompts for stage | ❌ | MISSING |
| Filters by lens affinity | ❌ | MISSING |
| Weighted selection works | ❌ | MISSING |
| Dynamic variable substitution | ❌ | MISSING |

**Assessment:** No unit tests exist for useSuggestedPrompts. This sprint will add comprehensive tests.

### Required New Tests

| Test | Priority |
|------|----------|
| PromptObject schema validation | P1 |
| Scoring algorithm (unit) | P1 |
| useSuggestedPrompts with 4D targeting | P1 |
| Entropy decay calculation | P2 |
| Prompt analytics tracking | P2 |

---

## 6. DEX Compliance Assessment

### Current State

| Pillar | Status | Evidence |
|--------|--------|----------|
| Declarative Sovereignty | ❌ FAIL | stagePromptsConfig is TypeScript, not JSON |
| Capability Agnosticism | ✅ PASS | No model coupling in prompt system |
| Provenance | ❌ FAIL | No tracking of prompt origins or selections |
| Organic Scalability | ⚠️ PARTIAL | Can add prompts but must modify TS |

### Target State

| Pillar | Required Change |
|--------|-----------------|
| Declarative Sovereignty | Prompts in JSON, loaded via data layer |
| Provenance | PromptObject.stats tracks impressions, selections |
| Organic Scalability | New prompts = new JSON entries, no code |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stage name mismatch | High | Medium | Map ARRIVAL→genesis, etc. in adapter |
| Entropy not in EngagementState | High | High | Extend EngagementBus to compute/expose entropy |
| No moment infrastructure | Medium | Medium | Add moment detection to EngagementBus |
| Performance with large prompt library | Low | Medium | Lazy loading, caching |

---

## 8. Pattern Check (Phase 0 Compliance)

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Prompt storage | Pattern 7: Object Model | Add 'prompt' to GroveObjectType, implement PromptObject schema |
| Context reactivity | Pattern 1: Quantum Interface | Extend with entropy/moment dimensions |
| State management | Pattern 2: Engagement Machine | Add entropy/moment to EngagementState |
| Prompt display | Pattern 4: Token Namespaces | Use existing `--genesis-*` tokens |

### No New Patterns Required

Context Fields extends existing DEX patterns—no novel infrastructure needed.

---

## 9. Canonical Source Audit (Phase 0.5 Compliance)

### Audit Table

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| Prompt storage | src/core/data | None (hardcoded TS) | CREATE: PromptCollection |
| Context aggregation | None | Scattered state | CREATE: useContextState |
| Prompt scoring | None | Weight-only random | CREATE: src/core/context-fields/scoring.ts |
| Entropy access | entropyCalculator | Direct function call | EXTEND: Expose via EngagementBus |
| Lens filtering | useSuggestedPrompts | Imperative if/else | PORT: Move to ContextTargeting schema |

### No Duplication Certification

This sprint creates **new canonical homes** for Context Fields infrastructure. No duplication of existing capabilities.

---

## 10. File Impact Summary

### Create (New Files)

```
src/core/context-fields/
├── types.ts                    # PromptObject, ContextTargeting, etc.
├── scoring.ts                  # Weighted relevance calculation
├── generator.ts                # Prompt generation (basic)
├── telemetry.ts                # Session telemetry schema
└── collection.ts               # In-memory prompt store

src/data/prompts/
├── base.prompts.json           # Universal prompts (JSON, not TS)
├── dr-chiang.prompts.json      # Lens-specific prompts
└── index.ts                    # Aggregation

src/data/lenses/
└── dr-chiang.lens.ts           # Dr. Chiang configuration

hooks/
├── useContextState.ts          # Aggregated 4D context
├── useSessionTelemetry.ts      # Telemetry collection
└── usePromptCollection.ts      # Prompt CRUD
```

### Modify (Existing Files)

```
hooks/useSuggestedPrompts.ts    # REWRITE: 4D targeting
src/core/data/grove-data-provider.ts  # Add 'prompt' type
src/core/schema/engagement.ts   # Add entropy to EngagementState
hooks/useEngagementBus.ts       # Expose computed entropy
```

### Deprecate (Mark for Removal)

```
src/data/prompts/stage-prompts.ts   # Replaced by JSON prompts
hooks/useJourneyProgress.ts         # Journey system deprecated
src/core/journey/*                  # Journey system deprecated
```

---

## Audit Complete

**Ready for:** Phase 2 (Specification)  
**Blockers:** None identified  
**Recommended Start:** Proceed with SPEC.md creation
