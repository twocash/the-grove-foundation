# Migration Map: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Status:** Draft

---

## 1. File Operations Summary

| Operation | Count |
|-----------|-------|
| CREATE | 14 |
| MODIFY | 5 |
| DEPRECATE | 3 |
| DELETE | 0 |

---

## 2. Files to Create

### 2.1 Core Context Fields Module

| File | Purpose | Priority |
|------|---------|----------|
| `src/core/context-fields/types.ts` | PromptObject, ContextTargeting, Stage, ScoringWeights | P1 |
| `src/core/context-fields/scoring.ts` | calculateRelevance(), applyHardFilters(), rankPrompts() | P1 |
| `src/core/context-fields/generator.ts` | PromptGenerator class | P2 |
| `src/core/context-fields/telemetry.ts` | SessionTelemetry, TelemetryCollector | P2 |
| `src/core/context-fields/collection.ts` | PromptCollection (in-memory store) | P1 |
| `src/core/context-fields/index.ts` | Barrel export | P1 |

### 2.2 Data Files

| File | Purpose | Priority |
|------|---------|----------|
| `src/data/prompts/base.prompts.json` | Universal prompts (all stages, all lenses) | P1 |
| `src/data/prompts/dr-chiang.prompts.json` | Dr. Chiang lens-specific prompts (6+) | P1 |
| `src/data/prompts/index.ts` | Aggregates and exports prompt library | P1 |
| `src/data/lenses/dr-chiang.lens.ts` | Dr. Chiang lens configuration | P1 |
| `src/data/lenses/index.ts` | Lens registry | P2 |

### 2.3 Hooks

| File | Purpose | Priority |
|------|---------|----------|
| `hooks/useContextState.ts` | Aggregates 4D context from multiple sources | P1 |
| `hooks/useSessionTelemetry.ts` | Collects session-level behavioral data | P2 |
| `hooks/usePromptCollection.ts` | Access to prompt library + generated cache | P1 |

---

## 3. Files to Modify

### 3.1 hooks/useSuggestedPrompts.ts

**Current:** Stage-based filtering with weighted random selection  
**Target:** 4D context targeting with relevance scoring

```typescript
// BEFORE (simplified)
const prompts = stagePromptsConfig.stages[stage].prompts
  .filter(p => matchesLens(p, lensId))
  .sort(weightedRandom);

// AFTER
const context = useContextState();
const { library, generated } = usePromptCollection();
const allPrompts = [...library, ...generated];
const eligible = applyHardFilters(allPrompts, context);
const ranked = rankPrompts(eligible, context, lensWeights);
return ranked.slice(0, maxPrompts);
```

**Changes:**
- Import new modules from `@core/context-fields`
- Replace `useEngagementState()` with `useContextState()`
- Replace static config with `usePromptCollection()`
- Replace imperative filtering with `applyHardFilters()`
- Replace weighted random with `rankPrompts()`
- Add `trackSelection()` for analytics

### 3.2 src/core/data/grove-data-provider.ts

**Change:** Add 'prompt' to GroveObjectType

```typescript
// BEFORE
export type GroveObjectType = 'lens' | 'journey' | 'hub' | 'document';

// AFTER
export type GroveObjectType = 'lens' | 'journey' | 'hub' | 'document' | 'prompt';
```

### 3.3 src/core/schema/engagement.ts

**Change:** Add entropy and moments to EngagementState

```typescript
// ADD to EngagementState interface
export interface EngagementState {
  // ... existing fields
  
  /** Computed entropy (0.0-1.0), calculated from entropyCalculator */
  computedEntropy: number;
  
  /** Active moments (temporary high-signal events) */
  activeMoments: string[];
}
```

### 3.4 src/core/engagement/context.tsx

**Change:** Compute and expose entropy in context value

```typescript
// In EngagementProvider
const computedEntropy = useMemo(() => {
  return calculateEntropy({
    hubsVisited: state.cardsVisited,
    exchangeCount: state.exchangeCount,
    pivotCount: state.pivotCount ?? 0,
    journeyWaypointsHit: state.activeJourney?.currentPosition ?? 0,
    journeyWaypointsTotal: state.activeJourney?.threadCardIds.length ?? 0,
    consecutiveHubRepeats: 0, // TODO: Track this
  });
}, [state.cardsVisited, state.exchangeCount, state.pivotCount, state.activeJourney]);

// Include in context value
const value = useMemo(() => ({
  ...state,
  computedEntropy,
  activeMoments: [], // TODO: Implement moment detection
}), [state, computedEntropy]);
```

### 3.5 src/core/engagement/hooks/useEngagementState.ts

**Change:** Expose new fields

```typescript
// Ensure computedEntropy and activeMoments are exposed
export function useEngagementState() {
  const context = useContext(EngagementContext);
  // Return includes computedEntropy and activeMoments
  return context;
}
```

---

## 4. Files to Deprecate

| File | Reason | Replacement |
|------|--------|-------------|
| `src/data/prompts/stage-prompts.ts` | Static TS config violates DEX | `src/data/prompts/*.json` |
| `src/core/schema/suggested-prompts.ts` | Types moved to context-fields | `src/core/context-fields/types.ts` |
| `hooks/useJourneyProgress.ts` | Journey system deprecated | None (feature removed) |

**Deprecation Strategy:**
1. Add `@deprecated` JSDoc to each file
2. Keep exports working for backward compatibility
3. Remove in future cleanup sprint

---

## 5. Execution Order

### Epic 1: Foundation (Days 1-2)

| Step | Action | Verification |
|------|--------|--------------|
| 1.1 | Create `src/core/context-fields/types.ts` | TypeScript compiles |
| 1.2 | Create `src/core/context-fields/scoring.ts` | Unit tests pass |
| 1.3 | Create `src/core/context-fields/collection.ts` | Unit tests pass |
| 1.4 | Create `src/core/context-fields/index.ts` | Barrel exports work |
| 1.5 | Add 'prompt' to GroveObjectType | TypeScript compiles |
| **BUILD GATE** | `npm test && npm run build` | ✅ |

### Epic 2: Data Layer (Day 2)

| Step | Action | Verification |
|------|--------|--------------|
| 2.1 | Create `src/data/prompts/base.prompts.json` | JSON valid |
| 2.2 | Create `src/data/prompts/dr-chiang.prompts.json` | JSON valid, 6+ prompts |
| 2.3 | Create `src/data/prompts/index.ts` | Exports all prompts |
| 2.4 | Create `src/data/lenses/dr-chiang.lens.ts` | TypeScript compiles |
| **BUILD GATE** | `npm test && npm run build` | ✅ |

### Epic 3: State Integration (Day 3)

| Step | Action | Verification |
|------|--------|--------------|
| 3.1 | Modify `engagement.ts` - add entropy/moments | TypeScript compiles |
| 3.2 | Modify `context.tsx` - compute entropy | Context provides value |
| 3.3 | Create `hooks/useContextState.ts` | Returns 4D state |
| 3.4 | Create `hooks/usePromptCollection.ts` | Returns prompts |
| **BUILD GATE** | `npm test && npm run build` | ✅ |

### Epic 4: Hook Rewrite (Days 3-4)

| Step | Action | Verification |
|------|--------|--------------|
| 4.1 | Rewrite `useSuggestedPrompts.ts` | Uses new modules |
| 4.2 | Add integration tests | Tests pass |
| 4.3 | Verify KineticWelcome renders prompts | Visual check |
| **BUILD GATE** | `npm test && npx playwright test` | ✅ |

### Epic 5: Generator (Day 5)

| Step | Action | Verification |
|------|--------|--------------|
| 5.1 | Create `src/core/context-fields/generator.ts` | TypeScript compiles |
| 5.2 | Create `src/core/context-fields/telemetry.ts` | TypeScript compiles |
| 5.3 | Create `hooks/useSessionTelemetry.ts` | Returns telemetry |
| 5.4 | Integrate generator into useSuggestedPrompts | Generated prompts appear |
| **BUILD GATE** | `npm test && npm run build` | ✅ |

### Epic 6: Deprecation (Day 5-6)

| Step | Action | Verification |
|------|--------|--------------|
| 6.1 | Add @deprecated to stage-prompts.ts | Compiler warns on import |
| 6.2 | Add @deprecated to suggested-prompts.ts | Compiler warns on import |
| 6.3 | Update imports throughout codebase | No deprecated imports in new code |
| **BUILD GATE** | `npm test && npm run build` | ✅ |

### Epic 7: E2E & Polish (Day 6-7)

| Step | Action | Verification |
|------|--------|--------------|
| 7.1 | E2E test: prompts on /explore | Playwright passes |
| 7.2 | E2E test: lens changes selection | Playwright passes |
| 7.3 | Visual regression check | Screenshots match |
| 7.4 | Update documentation | README reflects changes |
| **FINAL GATE** | Full test suite + visual check | ✅ |

---

## 6. Rollback Plan

### If Epic 1-2 Fails

**Symptoms:** TypeScript errors, test failures  
**Action:** Revert commits, fix issues, retry

### If Epic 3-4 Fails

**Symptoms:** useSuggestedPrompts breaks, no prompts shown  
**Action:** 
1. Revert useSuggestedPrompts.ts to previous version
2. Keep new modules but don't integrate
3. Debug in isolation

### If Epic 5 Fails

**Symptoms:** Generator produces bad prompts or crashes  
**Action:**
1. Disable generator (`includeGenerated: false`)
2. Library prompts continue working
3. Fix generator in next sprint

### Full Rollback

```bash
git revert --no-commit HEAD~N..HEAD  # N = commits in sprint
npm install
npm test  # Verify rollback
git commit -m "chore: rollback genesis-context-fields-v1"
```

---

## 7. Test Changes

### Create Tests

| Test File | Purpose |
|-----------|---------|
| `src/core/context-fields/__tests__/scoring.test.ts` | Scoring algorithm unit tests |
| `src/core/context-fields/__tests__/collection.test.ts` | Collection CRUD tests |
| `hooks/__tests__/useContextState.test.ts` | Context aggregation tests |
| `hooks/__tests__/useSuggestedPrompts.test.ts` | Hook integration tests |
| `e2e/genesis-prompts.spec.ts` | E2E prompt surfacing |

### Update Tests

| Test File | Change |
|-----------|--------|
| `src/core/engagement/__tests__/context.test.tsx` | Add entropy/moments assertions |

### Deprecate Tests

None. Existing tests remain for backward compatibility.

---

## Migration Map Complete

**Ready for:** Phase 5 (Decisions)  
**Critical Path:** Epic 1 → 3 → 4 (Foundation → State → Hook)  
**Parallel Work:** Epic 2 (Data) can run with Epic 1
