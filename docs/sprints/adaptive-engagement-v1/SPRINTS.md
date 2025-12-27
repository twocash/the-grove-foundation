# Adaptive Engagement System — SPRINTS v1.0

**Sprint:** `adaptive-engagement-v1`
**Date:** 2025-12-26

---

## Sprint Overview

| Phase | Name | Effort | Dependencies |
|-------|------|--------|--------------|
| 1 | Session Telemetry | 4h | server-side-capture-v1 |
| 2 | Adaptive Prompts | 4h | Phase 1 |
| 3 | Journey Framework | 6h | Phase 1, 2 |
| 4 | Server Persistence | 3h | Phase 1, server-side-capture-v1 |
| 5 | Lens Integration | 2h | Phase 2 |

**Total Estimate:** ~19 hours

---

## Phase 1: Session Telemetry

### Epic 1.1: Telemetry Schema

**Story 1.1.1:** Create session telemetry type definitions
**Task:** Create `src/core/schema/session-telemetry.ts` with:
- `SessionTelemetry` interface
- `SessionStage` type
- `StageThresholds` interface

**Acceptance:**
- Types export correctly
- Build passes

**Tests:**
- Unit: Type validation tests

---

**Story 1.1.2:** Create telemetry collector
**Task:** Create `src/lib/telemetry/collector.ts` with:
- `TelemetryCollector` class
- localStorage persistence
- Subscription pattern for updates
- Update methods for exchanges, topics, sprouts

**Acceptance:**
- Collector tracks events
- Persists to localStorage
- Survives page refresh

**Tests:**
- Unit: `tests/unit/telemetry-collector.test.ts`

---

**Story 1.1.3:** Create stage computation
**Task:** Create `src/lib/telemetry/stage-computation.ts` with:
- `computeSessionStage()` function
- Default thresholds
- Threshold override support

**Acceptance:**
- Returns correct stage for various inputs
- Thresholds are configurable

**Tests:**
- Unit: `tests/unit/stage-computation.test.ts`

### Build Gate
```bash
npm run build
npm test -- --grep "telemetry"
```

---

### Epic 1.2: Telemetry Hook

**Story 1.2.1:** Create useSessionTelemetry hook
**Task:** Create `hooks/useSessionTelemetry.ts` with:
- Wraps TelemetryCollector
- Provides telemetry state
- Provides update methods
- Subscribes to changes

**Acceptance:**
- Hook provides current telemetry
- Updates trigger re-renders
- Stage computed automatically

**Tests:**
- Unit: `tests/unit/useSessionTelemetry.test.ts`

---

**Story 1.2.2:** Integrate with chat
**Task:** Update chat handler to call telemetry:
- Track each exchange
- Track topic/hub mentions
- Non-blocking, fire-and-forget

**Acceptance:**
- Exchange count increments on send
- Topic tracking on hub reference
- No performance impact

**Tests:**
- E2E: Verify telemetry increments

### Build Gate
```bash
npm run build
npm test
```

---

## Phase 2: Adaptive Prompts

### Epic 2.1: Prompt Schema & Config

**Story 2.1.1:** Create prompt type definitions
**Task:** Create `src/core/schema/suggested-prompts.ts` with:
- `SuggestedPrompt` interface
- `PromptIntent` type
- `StagePromptConfig` interface

**Acceptance:**
- Types export correctly
- Build passes

---

**Story 2.1.2:** Create stage prompts config
**Task:** Create `content/prompts/stage-prompts.yaml` with:
- ARRIVAL prompts (orientation)
- ORIENTED prompts (discovery)
- EXPLORING prompts (depth)
- ENGAGED prompts (contribution)

**Acceptance:**
- Valid YAML syntax
- All stages have 3+ prompts
- Includes lens filtering

---

**Story 2.1.3:** Create prompt loader
**Task:** Create `src/data/prompts/loader.ts` with:
- YAML loading at build time
- Type validation
- Export for runtime use

**Acceptance:**
- Config loads without errors
- Types match schema

### Build Gate
```bash
npm run build
```

---

### Epic 2.2: Suggested Prompts Hook

**Story 2.2.1:** Create useSuggestedPrompts hook
**Task:** Create `hooks/useSuggestedPrompts.ts` with:
- Stage-based filtering
- Lens-based filtering
- Weight-based sorting
- Dynamic variable substitution
- Memoization

**Acceptance:**
- Returns correct prompts for stage
- Respects lens affinity/exclusion
- Substitutes variables correctly

**Tests:**
- Unit: `tests/unit/useSuggestedPrompts.test.ts`

---

**Story 2.2.2:** Update TerminalWelcome
**Task:** Modify `components/Terminal/TerminalWelcome.tsx` to:
- Use useSuggestedPrompts hook
- Fallback to static prompts
- Show subtle stage indicator
- Track prompt clicks

**Acceptance:**
- New users see ARRIVAL prompts
- Returning users see stage-appropriate prompts
- Clicking prompt sends to chat

**Tests:**
- E2E: `tests/e2e/adaptive-prompts.spec.ts`

### Build Gate
```bash
npm run build
npm test
npx playwright test tests/e2e/adaptive-prompts.spec.ts
```

---

## Phase 3: Journey Framework

### Epic 3.1: Journey Schema & Config

**Story 3.1.1:** Create journey type definitions
**Task:** Create `src/core/schema/journey.ts` with:
- `Journey` interface
- `JourneyWaypoint` interface
- Entry pattern matching types

**Acceptance:**
- Types export correctly
- Build passes

---

**Story 3.1.2:** Create grove-fundamentals journey
**Task:** Create `content/journeys/grove-fundamentals.yaml` with:
- 4 waypoints (Why, How, What, You)
- Entry patterns for implicit entry
- Completion message
- Next journey suggestions

**Acceptance:**
- Valid YAML syntax
- Entry patterns are valid regex
- Waypoints have clear success criteria

---

**Story 3.1.3:** Create journey loader
**Task:** Create `content/journeys/index.ts` with:
- Load all journey configs
- Validate structure
- Export typed array

**Acceptance:**
- Journeys load without errors
- Types match schema

### Build Gate
```bash
npm run build
```

---

### Epic 3.2: Journey Progress Hook

**Story 3.2.1:** Create useJourneyProgress hook
**Task:** Create `hooks/useJourneyProgress.ts` with:
- Active journey state
- Progress computation
- Start journey method
- Complete waypoint method
- Implicit entry detection

**Acceptance:**
- Can start journey explicitly
- Progress tracks correctly
- Implicit entry works

**Tests:**
- Unit: `tests/unit/useJourneyProgress.test.ts`

---

**Story 3.2.2:** Create JourneyProgressIndicator
**Task:** Create `components/Terminal/JourneyProgressIndicator.tsx` with:
- Subtle progress bar
- Current waypoint label
- Click to see journey map

**Acceptance:**
- Shows when journey active
- Progress updates on waypoint completion
- Non-intrusive design

---

**Story 3.2.3:** Create JourneyCompletionCard
**Task:** Create `components/Terminal/JourneyCompletionCard.tsx` with:
- Celebration message
- Journey summary
- Next journey suggestions

**Acceptance:**
- Shows on journey completion
- Links to suggested next journeys
- Dismissible

---

**Story 3.2.4:** Integrate implicit entry
**Task:** Update chat handler to:
- Check queries against entry patterns
- Start journey if match found
- Update telemetry with journey

**Acceptance:**
- Asking "Why are we building Grove?" enters journey
- Non-intrusive notification
- Can dismiss without starting

**Tests:**
- E2E: `tests/e2e/journey-implicit-entry.spec.ts`

### Build Gate
```bash
npm run build
npm test
npx playwright test tests/e2e/journey*.spec.ts
```

---

## Phase 4: Server Persistence

### Epic 4.1: Database Schema

**Story 4.1.1:** Create Supabase migration
**Task:** Run SQL in Supabase to create:
- `session_telemetry` table
- `journey_progress` table
- Indexes
- RLS policies

**Acceptance:**
- Tables created
- RLS enabled
- Can insert/select

---

### Epic 4.2: Sync Layer

**Story 4.2.1:** Create telemetry storage module
**Task:** Create `src/lib/telemetry/storage.ts` with:
- `syncTelemetryToServer()` function
- `loadTelemetryFromServer()` function
- Feature flag check
- Error handling

**Acceptance:**
- Syncs when server mode enabled
- Graceful fallback on failure
- Loads persisted data on return visit

---

**Story 4.2.2:** Integrate sync with collector
**Task:** Update TelemetryCollector to:
- Sync on significant events
- Debounced sync (30s interval)
- Load from server on init

**Acceptance:**
- Data persists across devices
- No blocking of UI
- Merge strategy for conflicts

**Tests:**
- Integration: Test with Supabase

### Build Gate
```bash
npm run build
npm test
```

---

## Phase 5: Lens Integration

### Epic 5.1: Per-Lens Configuration

**Story 5.1.1:** Add lens stage thresholds
**Task:** Extend lens config to support:
- Per-lens stage thresholds
- Per-lens prompt overrides
- Lens-specific journeys

**Acceptance:**
- Academic lens can have faster progression
- Prompt overrides apply correctly
- No breaking changes

---

**Story 5.1.2:** Implement lens switch reactivity
**Task:** Update useSuggestedPrompts to:
- React to lens changes immediately
- Recompute prompts with new lens context
- Update variable substitutions

**Acceptance:**
- Switching lens updates prompts instantly
- Stage stays same (only prompts change)
- Variables use new lens name

**Tests:**
- E2E: Test lens switch updates prompts

### Build Gate
```bash
npm run build
npm test
npx playwright test
```

---

## Final Verification

### Full Test Suite
```bash
npm run build
npm test
npx playwright test
```

### Manual Testing Checklist

- [ ] New user (clear localStorage) sees ARRIVAL prompts
- [ ] After 3 messages, stage changes to ORIENTED
- [ ] Returning user starts at ORIENTED
- [ ] Capturing sprout advances to ENGAGED
- [ ] Switching lens updates prompt text
- [ ] Journey can be started explicitly
- [ ] Asking relevant question triggers implicit entry
- [ ] Journey progress shows in UI
- [ ] Journey completion shows celebration
- [ ] Server sync persists telemetry (if enabled)

### Smoke Test Script

```bash
# 1. Clear state
localStorage.clear()

# 2. Visit terminal - should see ARRIVAL
# "What is The Grove?" visible

# 3. Send 3 messages - should advance to ORIENTED
# Prompts change to discovery-focused

# 4. Capture a sprout - should advance to ENGAGED
# /sprout → Prompts change to contribution-focused

# 5. Switch lens - prompts update immediately
# Academic lens shows research-focused prompts

# 6. Ask "Why are we building Grove?"
# Journey implicit entry notification appears
```

---

## Definition of Done

- [ ] All phases complete
- [ ] All tests pass
- [ ] No console errors
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] DEVLOG.md captures decisions
- [ ] Visual regression baselines updated (if UI changed)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| YAML loading in browser | Build-time compilation to JSON |
| Telemetry performance | Debounced updates, async storage |
| Journey implicit entry false positives | Conservative patterns, dismissible |
| Breaking existing Terminal | Fallback to static prompts |
