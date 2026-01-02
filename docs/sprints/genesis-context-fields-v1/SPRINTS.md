# Story Breakdown: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Duration:** 5-7 days  
**Total Story Points:** ~34

---

## Epic 1: Core Types & Scoring (Day 1)

**Goal:** Establish type foundations and scoring algorithm  
**Story Points:** 8

### Story 1.1: PromptObject Schema
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 1.1.1 | Create `src/core/context-fields/types.ts` | 30m |
| 1.1.2 | Define PromptObject interface | 20m |
| 1.1.3 | Define ContextTargeting interface | 15m |
| 1.1.4 | Define Stage type with mapping utility | 15m |
| 1.1.5 | Define ScoringWeights interface | 10m |
| 1.1.6 | Define ContextState interface | 10m |
| 1.1.7 | Create barrel export `index.ts` | 5m |

**Acceptance Criteria:**
- [ ] All interfaces compile with strict TypeScript
- [ ] Stage mapping function works correctly
- [ ] Types are exported from `@core/context-fields`

### Story 1.2: Scoring Algorithm
**Points:** 3

| Task | Description | Est |
|------|-------------|-----|
| 1.2.1 | Create `src/core/context-fields/scoring.ts` | 10m |
| 1.2.2 | Implement `applyHardFilters()` | 45m |
| 1.2.3 | Implement `calculateRelevance()` | 60m |
| 1.2.4 | Implement `rankPrompts()` | 20m |
| 1.2.5 | Add JSDoc comments | 15m |

**Acceptance Criteria:**
- [ ] Hard filters exclude prompts correctly (stage, lens, minInteractions)
- [ ] Soft scoring calculates weighted relevance
- [ ] Moment boost is additive per matching moment
- [ ] Results are sorted by score descending

### Story 1.3: Scoring Tests
**Points:** 3

| Task | Description | Est |
|------|-------------|-----|
| 1.3.1 | Create `__tests__/scoring.test.ts` | 10m |
| 1.3.2 | Test hard filters: stage mismatch | 15m |
| 1.3.3 | Test hard filters: lens excluded | 15m |
| 1.3.4 | Test hard filters: minInteractions | 15m |
| 1.3.5 | Test scoring: stage match adds weight | 15m |
| 1.3.6 | Test scoring: entropy window fit | 15m |
| 1.3.7 | Test scoring: lens affinity | 15m |
| 1.3.8 | Test scoring: moment boost additive | 15m |
| 1.3.9 | Test rankPrompts: sorted output | 15m |
| 1.3.10 | Achieve 100% coverage | 20m |

**Acceptance Criteria:**
- [ ] All scoring edge cases covered
- [ ] 100% line coverage on scoring.ts
- [ ] Tests are behavior-focused, not implementation

**BUILD GATE:** `npm test -- scoring.test.ts`

---

## Epic 2: Data Layer (Day 2)

**Goal:** Prompt library and lens configuration  
**Story Points:** 5

### Story 2.1: Base Prompts Library
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 2.1.1 | Create `src/data/prompts/base.prompts.json` | 10m |
| 2.1.2 | Add genesis stage prompts (3-4) | 30m |
| 2.1.3 | Add exploration stage prompts (3-4) | 30m |
| 2.1.4 | Add synthesis stage prompts (2-3) | 20m |
| 2.1.5 | Add advocacy stage prompts (2-3) | 20m |
| 2.1.6 | Validate JSON schema | 10m |

**Acceptance Criteria:**
- [ ] 10+ prompts covering all stages
- [ ] Each prompt has valid targeting criteria
- [ ] JSON is valid and parseable

### Story 2.2: Dr. Chiang Prompts
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 2.2.1 | Create `src/data/prompts/dr-chiang.prompts.json` | 10m |
| 2.2.2 | Add research-infrastructure prompt | 20m |
| 2.2.3 | Add land-grant-mission prompt | 20m |
| 2.2.4 | Add distributed-ai prompt | 20m |
| 2.2.5 | Add partnership prompt | 20m |
| 2.2.6 | Add stabilize (high-entropy) prompt | 20m |
| 2.2.7 | Add next-steps prompt | 20m |

**Acceptance Criteria:**
- [ ] 6 prompts specific to Dr. Chiang lens
- [ ] Each has lens affinity for `dr-chiang`
- [ ] Stabilize prompt targets high entropy

### Story 2.3: Prompt Aggregator & Lens Config
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 2.3.1 | Create `src/data/prompts/index.ts` | 15m |
| 2.3.2 | Load and merge JSON files | 20m |
| 2.3.3 | Create `src/data/lenses/dr-chiang.lens.ts` | 20m |
| 2.3.4 | Create `src/data/lenses/index.ts` | 10m |

**Acceptance Criteria:**
- [ ] `getPromptLibrary()` returns all prompts
- [ ] `getLensConfig('dr-chiang')` returns lens
- [ ] Lens includes scoring overrides

**BUILD GATE:** `npm run build`

---

## Epic 3: State Integration (Day 3)

**Goal:** Connect Context Fields to EngagementBus  
**Story Points:** 6

### Story 3.1: Entropy in EngagementState
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 3.1.1 | Add `computedEntropy` to EngagementState interface | 10m |
| 3.1.2 | Add `activeMoments` to EngagementState interface | 10m |
| 3.1.3 | Compute entropy in EngagementProvider | 30m |
| 3.1.4 | Detect high_entropy moment (entropy > 0.7) | 20m |
| 3.1.5 | Update context value | 10m |

**Acceptance Criteria:**
- [ ] `computedEntropy` available from useEngagementState()
- [ ] `activeMoments` includes 'high_entropy' when appropriate
- [ ] Existing functionality unaffected

### Story 3.2: useContextState Hook
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 3.2.1 | Create `hooks/useContextState.ts` | 10m |
| 3.2.2 | Import useEngagementState | 10m |
| 3.2.3 | Map SessionStage to Stage | 15m |
| 3.2.4 | Aggregate all 4D fields | 20m |
| 3.2.5 | Add off-topic detection logic | 30m |
| 3.2.6 | Return ContextState | 10m |

**Acceptance Criteria:**
- [ ] Returns `ContextState` with all 4 dimensions
- [ ] Stage is mapped correctly
- [ ] offTopicCount tracked

### Story 3.3: PromptCollection
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 3.3.1 | Create `src/core/context-fields/collection.ts` | 10m |
| 3.3.2 | Implement PromptCollection class | 30m |
| 3.3.3 | Method: `getLibrary()` | 15m |
| 3.3.4 | Method: `getGenerated()` | 15m |
| 3.3.5 | Method: `cacheGenerated()` | 15m |
| 3.3.6 | Create `hooks/usePromptCollection.ts` | 20m |

**Acceptance Criteria:**
- [ ] Library prompts loaded on init
- [ ] Generated prompts cached in memory
- [ ] Hook returns both sources

**BUILD GATE:** `npm test && npm run build`

---

## Epic 4: Hook Rewrite (Days 3-4)

**Goal:** Replace useSuggestedPrompts with 4D targeting  
**Story Points:** 8

### Story 4.1: Hook Rewrite
**Points:** 4

| Task | Description | Est |
|------|-------------|-----|
| 4.1.1 | Back up current useSuggestedPrompts.ts | 5m |
| 4.1.2 | Import new modules | 10m |
| 4.1.3 | Replace useEngagementState with useContextState | 15m |
| 4.1.4 | Replace static config with usePromptCollection | 15m |
| 4.1.5 | Implement hard filter step | 20m |
| 4.1.6 | Implement scoring step | 20m |
| 4.1.7 | Return sorted top N | 10m |
| 4.1.8 | Add trackSelection() for analytics | 30m |
| 4.1.9 | Add refreshPrompts() | 15m |
| 4.1.10 | Handle loading/error states | 20m |

**Acceptance Criteria:**
- [ ] Hook compiles without errors
- [ ] Returns prompts matching current context
- [ ] Analytics tracking works

### Story 4.2: Hook Integration Tests
**Points:** 3

| Task | Description | Est |
|------|-------------|-----|
| 4.2.1 | Create `__tests__/useSuggestedPrompts.test.ts` | 10m |
| 4.2.2 | Mock EngagementBus context | 20m |
| 4.2.3 | Test: genesis stage returns genesis prompts | 20m |
| 4.2.4 | Test: lens filter excludes non-matching | 20m |
| 4.2.5 | Test: high entropy boosts stabilization | 20m |
| 4.2.6 | Test: Dr. Chiang lens returns custom prompts | 25m |
| 4.2.7 | Test: maxPrompts limits output | 15m |

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Dr. Chiang lens scenario verified
- [ ] Entropy-based selection verified

### Story 4.3: Visual Verification
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 4.3.1 | Run dev server | 5m |
| 4.3.2 | Navigate to /explore | 5m |
| 4.3.3 | Verify prompts render in KineticWelcome | 10m |
| 4.3.4 | Select lens, verify prompts change | 10m |
| 4.3.5 | Capture screenshot for baseline | 5m |

**Acceptance Criteria:**
- [ ] Prompts visible on page
- [ ] Prompts change with lens selection
- [ ] No visual regressions

**BUILD GATE:** `npm test && npx playwright test`

---

## Epic 5: Generator (Day 5)

**Goal:** Rule-based prompt generation  
**Story Points:** 5

### Story 5.1: Telemetry Schema
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 5.1.1 | Create `src/core/context-fields/telemetry.ts` | 10m |
| 5.1.2 | Define SessionTelemetry interface | 20m |
| 5.1.3 | Define TelemetryCollector class | 30m |

**Acceptance Criteria:**
- [ ] SessionTelemetry captures relevant signals
- [ ] Collector can track events

### Story 5.2: Rule-Based Generator
**Points:** 3

| Task | Description | Est |
|------|-------------|-----|
| 5.2.1 | Create `src/core/context-fields/generator.ts` | 10m |
| 5.2.2 | Implement PromptGenerator class | 20m |
| 5.2.3 | Method: `generateAhead()` | 60m |
| 5.2.4 | Identify unexplored topics | 30m |
| 5.2.5 | Create template prompts | 30m |
| 5.2.6 | Method: `getCached()` | 15m |
| 5.2.7 | Method: `invalidateCache()` | 10m |

**Acceptance Criteria:**
- [ ] Generator produces valid PromptObjects
- [ ] Generated prompts have `source: 'generated'`
- [ ] Provenance includes telemetry snapshot

### Story 5.3: Generator Integration
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 5.3.1 | Create `hooks/useSessionTelemetry.ts` | 20m |
| 5.3.2 | Integrate generator into useSuggestedPrompts | 30m |
| 5.3.3 | Trigger generation after 2 interactions | 15m |

**Acceptance Criteria:**
- [ ] Generated prompts appear after interaction 2
- [ ] Generated prompts compete with library in scoring

**BUILD GATE:** `npm test && npm run build`

---

## Epic 6: Deprecation & Cleanup (Day 5-6)

**Goal:** Mark legacy code as deprecated  
**Story Points:** 2

### Story 6.1: Deprecation Markers
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 6.1.1 | Add @deprecated to stage-prompts.ts | 10m |
| 6.1.2 | Add @deprecated to suggested-prompts.ts schema | 10m |
| 6.1.3 | Add deprecation notice to useJourneyProgress.ts | 10m |
| 6.1.4 | Update any remaining imports in new code | 20m |

**Acceptance Criteria:**
- [ ] Deprecated files have JSDoc warnings
- [ ] No new code imports deprecated files

### Story 6.2: Documentation Update
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 6.2.1 | Update README with Context Fields overview | 20m |
| 6.2.2 | Add inline comments to new files | 20m |
| 6.2.3 | Update any affected docs | 15m |

**Acceptance Criteria:**
- [ ] README explains Context Fields
- [ ] New modules have header comments

---

## Epic 7: E2E & Polish (Day 6-7)

**Goal:** End-to-end verification and polish  
**Story Points:** 4

### Story 7.1: E2E Tests
**Points:** 2

| Task | Description | Est |
|------|-------------|-----|
| 7.1.1 | Create `e2e/genesis-prompts.spec.ts` | 15m |
| 7.1.2 | Test: prompts visible on /explore | 30m |
| 7.1.3 | Test: clicking prompt sends query | 30m |
| 7.1.4 | Create `e2e/lens-personalization.spec.ts` | 15m |
| 7.1.5 | Test: lens change updates prompts | 30m |

**Acceptance Criteria:**
- [ ] E2E tests pass in CI
- [ ] Critical paths verified

### Story 7.2: Visual Regression
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 7.2.1 | Capture baseline screenshots | 15m |
| 7.2.2 | Compare with pre-sprint baselines | 15m |
| 7.2.3 | Document any intentional changes | 10m |

**Acceptance Criteria:**
- [ ] No unintended visual changes
- [ ] Intentional changes documented

### Story 7.3: Final Verification
**Points:** 1

| Task | Description | Est |
|------|-------------|-----|
| 7.3.1 | Run full test suite | 10m |
| 7.3.2 | Run Playwright tests | 10m |
| 7.3.3 | Manual smoke test on /explore | 15m |
| 7.3.4 | Verify Dr. Chiang lens experience | 15m |
| 7.3.5 | Update INDEX.md status | 5m |

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Sprint marked complete

**FINAL BUILD GATE:** `npm test && npx playwright test && npm run build`

---

## Commit Sequence

```
feat: add context-fields types and scoring algorithm
test: add scoring algorithm unit tests (100% coverage)
feat: add base prompt library (JSON)
feat: add dr-chiang prompts and lens config
feat: add entropy to EngagementState
feat: add useContextState hook
feat: add PromptCollection and usePromptCollection
refactor: rewrite useSuggestedPrompts with 4D targeting
test: add useSuggestedPrompts integration tests
feat: add telemetry schema and collector
feat: add rule-based PromptGenerator
chore: deprecate stage-prompts.ts and suggested-prompts.ts
test: add E2E tests for prompt surfacing
docs: update README with Context Fields overview
chore: update INDEX.md - sprint complete
```

---

## Sprint Summary

| Epic | Points | Duration |
|------|--------|----------|
| 1. Core Types & Scoring | 8 | Day 1 |
| 2. Data Layer | 5 | Day 2 |
| 3. State Integration | 6 | Day 3 |
| 4. Hook Rewrite | 8 | Days 3-4 |
| 5. Generator | 5 | Day 5 |
| 6. Deprecation | 2 | Days 5-6 |
| 7. E2E & Polish | 4 | Days 6-7 |
| **Total** | **34** | **5-7 days** |

---

**Ready for:** Phase 7 (Execution Prompt)
