# Sprint Breakdown: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Date:** January 4, 2026  
**Est. Duration:** 1 day

---

## Story Summary

| Epic | Story | Est. | Priority |
|------|-------|------|----------|
| 1 | Create useLegacyBridge.ts | 1.5h | P0 |
| 2 | Rewrite useEventBridge.ts | 2h | P0 |
| 2 | Update EventBridgeEmit types | 0.5h | P0 |
| 3 | Update index exports | 0.5h | P0 |
| 4 | Create integration tests | 2h | P1 |
| 5 | Sprint 2 DECISIONS.md | 0.5h | P2 |
| 5 | Sprint 2 DEX matrix | 0.5h | P2 |

**Total:** ~7.5 hours

---

## Epic 1: Legacy Bridge Isolation

### Story 1.1: Create useLegacyBridge.ts

**Priority:** P0 (blocks Epic 2)

**Acceptance Criteria:**
- [ ] Lazy-loads legacy engagement bus
- [ ] Provides `onSessionStarted()` (no-op)
- [ ] Provides `onQuerySubmitted(content)`
- [ ] Provides `onResponseCompleted(hubId?)`
- [ ] Provides `onLensActivated(lensId, isCustom)`
- [ ] Provides `onHubEntered(hubId, hubName?)`
- [ ] Provides `onJourneyStarted(lensId, waypointCount)`
- [ ] Provides `onJourneyCompleted(lensId, durationMs?, cardsVisited?)`
- [ ] Provides `onInsightCaptured(sproutId)`
- [ ] Exports `LegacyBridgeAPI` type
- [ ] Marked for deprecation in comments

**Test:** Build passes, no TypeScript errors

---

## Epic 2: Thin Bridge Rewrite

### Story 2.1: Rewrite useEventBridge.ts

**Priority:** P0 (core deliverable)

**Acceptance Criteria:**
- [ ] Discards existing WIP (git checkout)
- [ ] Checks feature flag via `useIsEventSystemEnabled()`
- [ ] Checks provider availability via context
- [ ] Calls `useEventHelpers().emit.*` for new system
- [ ] Calls `useLegacyBridge().*` for legacy
- [ ] Never creates raw event objects
- [ ] Exports `useEventBridge` function
- [ ] Exports `useSafeEventBridge` function (try/catch wrapper)
- [ ] Exports `EventBridgeAPI` type
- [ ] Exports `EventBridgeEmit` type

**Test:** Build passes, hooks.test.tsx passes

### Story 2.2: Update EventBridgeEmit Types

**Priority:** P0 (schema alignment)

**Acceptance Criteria:**
- [ ] `sessionStarted` matches SESSION_STARTED schema
- [ ] `querySubmitted` matches QUERY_SUBMITTED schema
- [ ] `responseCompleted` matches RESPONSE_COMPLETED schema (with required fields!)
- [ ] `lensActivated` matches LENS_ACTIVATED schema (source, not trigger!)
- [ ] `hubEntered` matches HUB_ENTERED schema
- [ ] `journeyStarted` matches JOURNEY_STARTED schema
- [ ] `journeyAdvanced` matches JOURNEY_ADVANCED schema
- [ ] `journeyCompleted` matches JOURNEY_COMPLETED schema
- [ ] `insightCaptured` matches INSIGHT_CAPTURED schema
- [ ] LensSource type imported or defined
- [ ] HubSource type imported or defined

**Test:** TypeScript compiles without errors

---

## Epic 3: Update Exports

### Story 3.1: Update hooks/index.ts

**Priority:** P0 (public API)

**Acceptance Criteria:**
- [ ] Exports `useLegacyBridge` function
- [ ] Exports `LegacyBridgeAPI` type
- [ ] Sprint comment updated
- [ ] All existing exports preserved

**Test:** Build passes

---

## Epic 4: Integration Tests

### Story 4.1: Create integration.test.tsx

**Priority:** P1 (verification)

**Acceptance Criteria:**
- [ ] Tests ExploreEventProvider flag behavior
- [ ] Tests useEventBridge with new system enabled
- [ ] Tests useEventBridge with new system disabled
- [ ] Tests useSafeEventBridge outside providers
- [ ] Tests dual-write behavior (both systems receive events)
- [ ] Tests schema validation (invalid events rejected)

**Test:** `npm test -- tests/unit/events/` passes

---

## Epic 5: Documentation

### Story 5.1: Create Sprint 2 DECISIONS.md

**Priority:** P2 (documentation)

**Acceptance Criteria:**
- [ ] Documents hooks location decision
- [ ] Documents useContextState naming
- [ ] Documents migration in provider
- [ ] Documents memoization strategy

### Story 5.2: Add Sprint 2 DEX Matrix

**Priority:** P2 (documentation)

**Acceptance Criteria:**
- [ ] DEX compliance matrix added to SPEC.md
- [ ] All four tests pass with evidence

---

## Definition of Done

### Per Story
- [ ] Code complete
- [ ] Build passes
- [ ] Relevant tests pass

### Per Epic
- [ ] All stories complete
- [ ] Build gate passes
- [ ] No TypeScript errors

### Per Sprint
- [ ] All epics complete
- [ ] Full test suite passes
- [ ] Clean git commit
- [ ] Pushed to origin

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy bus import fails | Medium | Low | Try/catch with fallback |
| Hook call order issues | Low | High | Test thoroughly |
| Feature flag check race | Low | Medium | Check synchronously |

---

*Story breakdown for Foundation Loop Phase 5*
