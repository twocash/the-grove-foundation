# Kinetic Suggested Prompts v1 — Story Breakdown

**Sprint:** kinetic-suggested-prompts-v1  
**Date:** January 4, 2026  
**Total Estimate:** 8 hours

---

## Epic 1: Context State Hook (2 hrs)

### Story 1.1: Create useContextState Hook
**Estimate:** 1.5 hrs

**As a** developer  
**I want** a hook that aggregates EngagementContext into ContextState  
**So that** I can pass 4D context to selectPrompts()

**Acceptance Criteria:**
- [ ] Hook extracts stage, entropy, lens, moments from EngagementMachine
- [ ] Stage computed from interaction count (genesis/exploration/synthesis/advocacy)
- [ ] Moments evaluated (high_entropy when entropy > 0.7, first_visit when no history)
- [ ] Topics extracted from topicExplorations
- [ ] Returns typed ContextState object

**Technical Notes:**
- Use `useSelector` from @xstate/react
- Memoize selector for performance
- Handle undefined/null context gracefully

**Files:**
- CREATE: `src/core/context-fields/useContextState.ts`

---

### Story 1.2: Unit Tests for useContextState
**Estimate:** 0.5 hrs

**As a** developer  
**I want** comprehensive tests for useContextState  
**So that** I can trust the 4D aggregation logic

**Acceptance Criteria:**
- [ ] Test genesis stage when no interactions
- [ ] Test exploration stage with 1-4 interactions
- [ ] Test synthesis stage with 5+ interactions
- [ ] Test advocacy stage when sprouts captured
- [ ] Test high_entropy moment evaluation
- [ ] Test first_visit moment evaluation
- [ ] Test lens passthrough

**Files:**
- CREATE: `tests/unit/context-fields/useContextState.test.tsx`

---

## Epic 2: Type Adapters (1.5 hrs)

### Story 2.1: Create PromptObject → JourneyFork Adapter
**Estimate:** 1 hr

**As a** developer  
**I want** functions to convert PromptObject to JourneyFork  
**So that** NavigationBlock can render 4D-selected prompts

**Acceptance Criteria:**
- [ ] `inferForkType()` determines fork type from PromptObject metadata
- [ ] `promptToFork()` converts single PromptObject to JourneyFork
- [ ] `promptsToForks()` converts array
- [ ] Fork type inference: challenge (high entropy), pivot (topic affinity), apply (synthesis tags), deep_dive (default)

**Technical Notes:**
- entropyWindow.min > 0.6 → challenge
- topicAffinities.length > 0 → pivot
- tags includes 'synthesis'/'reflection'/'action' → apply
- Default → deep_dive

**Files:**
- CREATE: `src/core/context-fields/adapters.ts`

---

### Story 2.2: Unit Tests for Adapters
**Estimate:** 0.5 hrs

**As a** developer  
**I want** tests for type conversion logic  
**So that** fork type inference is reliable

**Acceptance Criteria:**
- [ ] Test deep_dive for default prompts
- [ ] Test pivot for topic-connected prompts
- [ ] Test apply for synthesis-tagged prompts
- [ ] Test challenge for high-entropy prompts
- [ ] Test challenge for urgent variant
- [ ] Test executionPrompt → queryPayload mapping

**Files:**
- CREATE: `tests/unit/context-fields/adapters.test.ts`

---

## Epic 3: Navigation Prompts Hook (1.5 hrs)

### Story 3.1: Create useNavigationPrompts Hook
**Estimate:** 1 hr

**As a** developer  
**I want** a hook that returns navigation forks  
**So that** ResponseBlock can render 4D-selected prompts

**Acceptance Criteria:**
- [ ] Hook calls useContextState for 4D context
- [ ] Hook calls selectPrompts with library prompts
- [ ] Hook converts results via promptsToForks
- [ ] Hook accepts options (maxPrompts, minScore)
- [ ] Results memoized on context changes
- [ ] Returns { forks, isReady }

**Technical Notes:**
- Import libraryPrompts from @data/prompts
- Default maxPrompts = 3
- Default minScore = 1.0

**Files:**
- CREATE: `src/explore/hooks/useNavigationPrompts.ts`

---

### Story 3.2: Unit Tests for useNavigationPrompts
**Estimate:** 0.5 hrs

**As a** developer  
**I want** tests for the navigation prompts hook  
**So that** I can trust prompt selection

**Acceptance Criteria:**
- [ ] Test returns 3 forks by default
- [ ] Test respects maxPrompts option
- [ ] Test memoization works correctly

**Files:**
- CREATE: `tests/unit/context-fields/useNavigationPrompts.test.tsx`

---

## Epic 4: ResponseBlock Integration (1.5 hrs)

### Story 4.1: Wire useNavigationPrompts to ResponseBlock
**Estimate:** 1 hr

**As a** user  
**I want** to see contextual navigation prompts after responses  
**So that** I can explore related topics

**Acceptance Criteria:**
- [ ] ResponseBlock calls useNavigationPrompts when not streaming
- [ ] Merge logic: prefer parsed navigation, fallback to library forks
- [ ] NavigationBlock receives merged forks
- [ ] Click triggers onPromptSubmit with queryPayload
- [ ] Feature flag controls behavior

**Technical Notes:**
- Only call hook when item.isComplete
- Guard with FEATURES.INLINE_NAVIGATION_PROMPTS
- Preserve existing parsed navigation priority

**Files:**
- MODIFY: `components/Terminal/Stream/blocks/ResponseBlock.tsx`

---

### Story 4.2: Add Feature Flags
**Estimate:** 0.25 hrs

**As a** developer  
**I want** feature flags for safe rollout  
**So that** I can toggle behavior without code changes

**Acceptance Criteria:**
- [ ] INLINE_NAVIGATION_PROMPTS flag added (default: true)
- [ ] FLOATING_SUGGESTION_WIDGET flag added (default: false)
- [ ] Flags documented with JSDoc

**Files:**
- MODIFY: `src/config/features.ts`

---

### Story 4.3: Integration Test
**Estimate:** 0.25 hrs

**As a** developer  
**I want** integration tests for ResponseBlock  
**So that** I can verify end-to-end behavior

**Acceptance Criteria:**
- [ ] Test NavigationBlock renders after response
- [ ] Test clicking fork calls onPromptSubmit
- [ ] Test feature flag disables prompts

**Files:**
- CREATE: `tests/integration/ResponseBlock.navigation.test.tsx`

---

## Epic 5: Event Bridge Extension (0.5 hrs)

### Story 5.1: Add forkSelected Event
**Estimate:** 0.5 hrs

**As a** developer  
**I want** to emit events when forks are clicked  
**So that** analytics can track navigation patterns

**Acceptance Criteria:**
- [ ] forkSelected added to EventBridgeEmit interface
- [ ] Implementation emits to new system
- [ ] Dual-write to legacy if enabled
- [ ] FORK_SELECTED added to event types

**Files:**
- MODIFY: `src/core/events/hooks/useEventBridge.ts`
- MODIFY: `src/core/events/types.ts`

---

## Epic 6: Exports & Deprecation (0.5 hrs)

### Story 6.1: Update Module Exports
**Estimate:** 0.25 hrs

**As a** developer  
**I want** clean exports for new modules  
**So that** consumers can import easily

**Acceptance Criteria:**
- [ ] useContextState exported from context-fields
- [ ] Adapters exported from context-fields
- [ ] useNavigationPrompts exported from explore/hooks
- [ ] Types exported correctly

**Files:**
- MODIFY: `src/core/context-fields/index.ts`
- MODIFY: `src/explore/hooks/index.ts`

---

### Story 6.2: Deprecate Legacy Hooks
**Estimate:** 0.25 hrs

**As a** developer  
**I want** legacy hooks marked deprecated  
**So that** consumers know to migrate

**Acceptance Criteria:**
- [ ] usePromptSuggestions has @deprecated JSDoc
- [ ] Console warning in development mode
- [ ] Migration path documented in comment
- [ ] scorePrompt.ts deprecated if exists

**Files:**
- MODIFY: `src/explore/hooks/usePromptSuggestions.ts`

---

## Summary

| Epic | Stories | Estimate |
|------|---------|----------|
| 1. Context State Hook | 2 | 2 hrs |
| 2. Type Adapters | 2 | 1.5 hrs |
| 3. Navigation Prompts Hook | 2 | 1.5 hrs |
| 4. ResponseBlock Integration | 3 | 1.5 hrs |
| 5. Event Bridge Extension | 1 | 0.5 hrs |
| 6. Exports & Deprecation | 2 | 0.5 hrs |
| **Total** | **12** | **8 hrs** |

---

## Execution Order

1. Epic 1 → Foundation (context aggregation)
2. Epic 2 → Types (conversion layer)
3. Epic 3 → Hook (selection logic)
4. Epic 4 → Integration (user-facing)
5. Epic 5 → Events (analytics)
6. Epic 6 → Cleanup (exports, deprecation)

Each epic builds on previous. Run tests after each epic.

---

*Stories sized for single-session execution with clear boundaries.*
