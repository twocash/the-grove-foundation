# Sprint Breakdown: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Created:** 2026-01-03  
**Estimated Effort:** ~17 hours  
**Prerequisites:** prompt-schema-rationalization-v1 complete

---

## Epic 1: Schema & Types

**Goal:** Define AdaptiveScoring types and extend PromptPayload.

### Story 1.1: Create AdaptiveScoring Types

**Task:** Create `src/core/schema/adaptive-scoring.ts`

**Types to define:**
- `BanditArm`
- `EntropyImpact`
- `AdaptiveScoring`

**Tests:**
- Type compilation passes
- Types are exported correctly

**Acceptance Criteria:**
- [ ] All types defined per spec
- [ ] Exported from schema index
- [ ] `npm run typecheck` passes

### Story 1.2: Extend PromptPayload

**Task:** Add `adaptiveScoring?: AdaptiveScoring` to PromptPayload

**Changes:**
- Import AdaptiveScoring
- Add optional field to interface

**Tests:**
- Existing prompts still compile
- New prompts can include adaptiveScoring

**Acceptance Criteria:**
- [ ] Field added as optional
- [ ] No breaking changes to existing code
- [ ] Type exports updated

### Build Gate

```bash
npm run typecheck
```

---

## Epic 2: Context Hashing

**Goal:** Encode exploration context into stable hash for bandit arm lookup.

### Story 2.1: Create Context Hash Module

**Task:** Create `src/core/telemetry/context-hash.ts`

**Functions:**
- `extractContextFeatures(context)` — Extract relevant features
- `hashContext(context)` — Generate stable hash string
- `getEntropyBucket(entropy)` — Classify entropy level
- `getSessionDepth(messageCount)` — Classify session depth
- `getTimeOfDay(date)` — Classify time

**Tests:**
- Same context produces same hash
- Different contexts produce different hashes
- Handles missing/undefined values gracefully

**Acceptance Criteria:**
- [ ] Hash is deterministic
- [ ] Hash is human-readable for debugging
- [ ] Handles edge cases (null lens, empty topics)

### Build Gate

```bash
npm test -- --grep "context-hash"
```

---

## Epic 3: Entropy Strategy

**Goal:** Implement entropy-based recommendation strategy selection.

### Story 3.1: Create Entropy Strategy Module

**Task:** Create `src/explore/recommendation/entropy-strategy.ts`

**Functions:**
- `getStrategyForEntropy(entropy, config)` — Select strategy
- `getEntropyMultiplier(impact, strategy, config)` — Calculate multiplier

**Config:**
- Entropy thresholds (high: 0.7, low: 0.3)
- Strategy multipliers for each state

**Tests:**
- High entropy → 'clarify' strategy
- Low entropy → 'challenge' strategy
- Medium entropy → 'explore' strategy
- Multipliers applied correctly

**Acceptance Criteria:**
- [ ] All strategies implemented
- [ ] Configurable thresholds
- [ ] Graceful handling of missing data

### Build Gate

```bash
npm test -- --grep "entropy-strategy"
```

---

## Epic 4: Contextual Bandit

**Goal:** Implement UCB-based exploration/exploitation balancing.

### Story 4.1: Create Contextual Bandit Module

**Task:** Create `src/explore/recommendation/contextual-bandit.ts`

**Functions:**
- `getUCBScore(arm, totalPulls, config)` — Calculate UCB score
- `updateArm(arm, wasSelected)` — Update arm after interaction

**Config:**
- Exploration factor (default: 1.5)
- New context bonus
- New prompt bonus
- Min impressions for exploitation

**Tests:**
- UCB formula calculated correctly
- New arms get exploration bonus
- Arms with many pulls converge to exploitation

**Acceptance Criteria:**
- [ ] UCB1 formula implemented correctly
- [ ] Handles new/missing arms
- [ ] Configurable parameters

### Build Gate

```bash
npm test -- --grep "contextual-bandit"
```

---

## Epic 5: Diversity Selector

**Goal:** Select diverse recommendations to avoid filter bubbles.

### Story 5.1: Create Diversity Selector Module

**Task:** Create `src/explore/recommendation/diversity-selector.ts`

**Functions:**
- `selectDiverse(scored, limit, config)` — Select diverse prompts

**Config:**
- Min topic distance (default: 0.3)
- Max same sequence (default: 1)

**Tests:**
- Selects top scores when diverse
- Skips similar topics
- Respects sequence limits

**Acceptance Criteria:**
- [ ] Topic diversity enforced
- [ ] Sequence diversity enforced
- [ ] Falls back gracefully if not enough diverse options

### Build Gate

```bash
npm test -- --grep "diversity-selector"
```

---

## Epic 6: Recommendation Orchestrator

**Goal:** Combine all scoring layers into unified recommendation pipeline.

### Story 6.1: Create Configuration Module

**Task:** Create `src/explore/recommendation/config.ts`

**Contents:**
- `RECOMMENDATION_CONFIG` — All configurable parameters
- `RECOMMENDATION_FLAGS` — Feature flags

### Story 6.2: Create Main Orchestrator

**Task:** Create `src/explore/recommendation/recommend-prompts.ts`

**Functions:**
- `recommendPrompts(context, candidates, options)` — Main entry point
- `getFreshnessMultiplier(prompt)` — Calculate freshness penalty

**Pipeline:**
1. Filter by targeting
2. Calculate base relevance
3. Apply entropy multiplier
4. Apply UCB score
5. Apply freshness penalty
6. Apply new prompt bonus
7. Select diverse results

**Tests:**
- Full pipeline produces results
- Respects exclusion list
- Returns debug info

**Acceptance Criteria:**
- [ ] All layers integrated
- [ ] Returns RecommendationResult with debug info
- [ ] Handles empty candidates gracefully

### Build Gate

```bash
npm test -- --grep "recommend-prompts"
```

---

## Epic 7: Database Schema

**Goal:** Create Supabase tables and RPC functions for telemetry.

### Story 7.1: Create Migration File

**Task:** Create `supabase/migrations/YYYYMMDD_adaptive_scoring.sql`

**Tables:**
- `prompt_impressions`
- `prompt_selections`
- `prompt_entropy_deltas`

**Views:**
- `prompt_telemetry_stats`

**Indexes:**
- On prompt_id, context_hash, created_at

### Story 7.2: Create RPC Functions

**Task:** Create RPC function files

**Functions:**
- `increment_prompt_impressions`
- `record_prompt_selection`
- `record_entropy_impact`

**Tests:**
- Functions execute without error
- Data updates correctly in prompt payload

**Acceptance Criteria:**
- [ ] Tables created with proper constraints
- [ ] RPC functions work correctly
- [ ] Indexes optimize queries

### Build Gate

```bash
npx supabase db push --dry-run
npx supabase db push
```

---

## Epic 8: Event Tracking

**Goal:** Implement telemetry event tracking functions.

### Story 8.1: Create Telemetry Module

**Task:** Create `src/core/telemetry/prompt-events.ts`

**Functions:**
- `trackPromptImpression(promptId, context)` — Log impression
- `trackPromptSelection(promptId, context, dwellMs)` — Log selection
- `trackEntropyDelta(promptId, initial, final)` — Log entropy change

**Behavior:**
- Async, non-blocking
- Silent failure (don't break UX)
- Batch-friendly (future optimization)

**Tests:**
- Functions call Supabase RPC
- Errors are caught and logged

**Acceptance Criteria:**
- [ ] All events tracked
- [ ] Non-blocking execution
- [ ] Graceful error handling

### Build Gate

```bash
npm test -- --grep "prompt-events"
```

---

## Epic 9: React Hooks

**Goal:** Create React hooks for recommendations and telemetry.

### Story 9.1: Create usePromptTelemetry Hook

**Task:** Create `src/explore/hooks/usePromptTelemetry.ts`

**Returns:**
- `trackImpression(promptId, context)`
- `trackSelection(promptId, context, dwellMs)`
- `trackEntropyChange(promptId, initial, final)`

### Story 9.2: Create usePromptRecommendations Hook

**Task:** Create `src/explore/hooks/usePromptRecommendations.ts`

**Props:**
- `context: ExplorationContext | null`
- `options: { limit?, excludeIds?, enabled? }`

**Returns:**
- `recommendations: Prompt[]`
- `strategy: EntropyStrategy`
- `contextHash: string`
- `isLoading: boolean`
- `debug: object`

**Behavior:**
- Recomputes when context changes
- Tracks impressions automatically
- Debounces rapid context changes

**Tests:**
- Hook returns recommendations
- Tracks impressions on mount
- Handles null context

**Acceptance Criteria:**
- [ ] Hooks work with React lifecycle
- [ ] Automatic impression tracking
- [ ] Proper loading states

### Build Gate

```bash
npm test -- --grep "usePromptRecommendations"
npm test -- --grep "usePromptTelemetry"
```

---

## Epic 10: Integration

**Goal:** Integrate recommendation engine with existing UI.

### Story 10.1: Update usePromptSuggestions

**Task:** Modify `src/explore/hooks/usePromptSuggestions.ts`

**Changes:**
- Use `recommendPrompts()` instead of simple scoring
- Pass exploration context
- Return additional metadata

### Story 10.2: Update Terminal Components

**Task:** Modify `src/terminal/components/PromptSuggestions.tsx`

**Changes:**
- Track selection with dwell time
- Track entropy delta after interaction
- Show strategy indicator (optional)

### Story 10.3: Update scorePrompt Utility

**Task:** Modify `src/explore/utils/scorePrompt.ts`

**Changes:**
- Integrate adaptive scoring multiplier
- Maintain backward compatibility

**Acceptance Criteria:**
- [ ] Existing UI works with new engine
- [ ] Telemetry fires on interactions
- [ ] No visual regressions

### Build Gate

```bash
npm run dev
# Manual: Verify recommendations appear
# Manual: Check telemetry in Supabase
```

---

## Epic 11: Testing & Verification

**Goal:** Comprehensive testing of the entire system.

### Story 11.1: Unit Tests

**Tests to write:**
- `entropy-strategy.test.ts`
- `contextual-bandit.test.ts`
- `diversity-selector.test.ts`
- `recommend-prompts.test.ts`
- `context-hash.test.ts`
- `prompt-events.test.ts`

### Story 11.2: Integration Tests

**Tests to write:**
- Full recommendation pipeline
- Telemetry round-trip
- Hook integration

### Story 11.3: E2E Tests

**Tests to write:**
- Recommendations display in terminal
- Selection tracking works
- Recommendations adapt over time

### Story 11.4: Manual Verification

**Checklist:**
- [ ] Recommendations appear in Terminal
- [ ] Different strategies for different entropy states
- [ ] Telemetry events in Supabase
- [ ] Prompts update with adaptive scoring data
- [ ] No performance degradation

### Build Gate

```bash
npm run typecheck
npm test
npx playwright test
```

---

## Sprint Summary

| Epic | Stories | Estimated Hours |
|------|---------|-----------------|
| Epic 1: Schema & Types | 2 | 1.0 |
| Epic 2: Context Hashing | 1 | 1.0 |
| Epic 3: Entropy Strategy | 1 | 1.0 |
| Epic 4: Contextual Bandit | 1 | 2.0 |
| Epic 5: Diversity Selector | 1 | 1.0 |
| Epic 6: Recommendation Orchestrator | 2 | 2.0 |
| Epic 7: Database Schema | 2 | 1.0 |
| Epic 8: Event Tracking | 1 | 2.0 |
| Epic 9: React Hooks | 2 | 2.0 |
| Epic 10: Integration | 3 | 2.0 |
| Epic 11: Testing | 4 | 3.0 |
| **Total** | **20** | **~17 hours** |

---

## Definition of Done

- [ ] All stories complete
- [ ] All build gates pass
- [ ] No type errors
- [ ] No console errors
- [ ] Telemetry tables created
- [ ] RPC functions working
- [ ] Recommendations adapting to entropy state
- [ ] Events tracked in database
- [ ] PR approved and merged
