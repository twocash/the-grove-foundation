# Sprint Execution: engagement-consolidation-v1

## Overview

| Phase | Focus | Duration | Gate |
|-------|-------|----------|------|
| 1 | Schema Consolidation | 30 min | Types compile |
| 2 | Utility Migration | 20 min | Unit tests pass |
| 3 | Hook Consolidation | 30 min | Hooks work |
| 4 | UI Wiring | 20 min | Stage visible |
| 5 | Cleanup | 20 min | Build succeeds |
| 6 | Test | 30 min | All tests green |

**Total:** ~2.5 hours

---

## Phase 1: Schema Consolidation

### Tasks

1.1. Add SessionStage types to `src/core/schema/engagement.ts`
1.2. Add StageThresholds interface to `src/core/schema/engagement.ts`
1.3. Extend EngagementState with stage fields
1.4. Add DEFAULT_STAGE_THRESHOLDS to `src/core/config/defaults.ts`
1.5. Update DEFAULT_ENGAGEMENT_STATE with new fields
1.6. Export new types from index files

### Tests
- TypeScript compiles without errors

### Gate
```bash
npx tsc --noEmit
```

---

## Phase 2: Utility Migration

### Tasks

2.1. Create `utils/stageComputation.ts` with computeSessionStage function
2.2. Write unit test `utils/stageComputation.test.ts`
2.3. Verify stage computation for all thresholds

### Tests
- computeSessionStage returns ARRIVAL for empty state
- computeSessionStage returns ORIENTED at 3 exchanges
- computeSessionStage returns EXPLORING at 5 exchanges
- computeSessionStage returns ENGAGED at 1 sprout

### Gate
```bash
npm run test -- stageComputation
```

---

## Phase 3: Hook Consolidation

### Tasks

3.1. Add migration logic to EngagementBusSingleton constructor
3.2. Add stage computation to updateState method
3.3. Add SPROUT_CAPTURED event handling
3.4. Update useEngagementState return type to include stage
3.5. Refactor useSuggestedPrompts to use useEngagementState
3.6. Delete useSessionTelemetry.ts

### Tests
- useEngagementState returns stage field
- Stage updates when exchangeCount crosses threshold
- Legacy data migrated on first load

### Gate
```bash
npm run test -- useEngagementBus
npm run test -- useSuggestedPrompts
```

---

## Phase 4: UI Wiring

### Tasks

4.1. Update TerminalWelcome to use useEngagementState
4.2. Add stage indicator display (emoji + label)
4.3. Wire adaptive prompts from useSuggestedPrompts
4.4. Add console.log for debugging

### Tests
- Stage indicator visible in UI
- Correct stage shown for engagement level
- Prompts change with stage

### Gate
Manual verification:
1. Load Terminal
2. Verify stage shows "🌱 New"
3. Send 3 messages
4. Verify stage shows "🌿 Exploring"

---

## Phase 5: Cleanup

### Tasks

5.1. Delete `src/lib/telemetry/` directory
5.2. Delete `src/core/schema/session-telemetry.ts`
5.3. Delete `hooks/useSessionTelemetry.ts`
5.4. Delete `services/telemetryService.ts`
5.5. Remove all imports referencing deleted files
5.6. Update any barrel exports

### Tests
- No TypeScript errors
- No unresolved imports

### Gate
```bash
npx tsc --noEmit
npm run build
```

---

## Phase 6: Test & Verify

### Tasks

6.1. Run full test suite
6.2. Verify localStorage has single key
6.3. Verify data migration works
6.4. Verify no console errors
6.5. Visual verification of stage progression

### Tests
- All existing tests pass
- New unit tests pass
- E2E smoke test passes

### Gate
```bash
npm run test
npm run build
# Manual: Clear localStorage, reload, verify stage="ARRIVAL"
# Manual: Send 3 messages, verify stage="ORIENTED"
```

---

## Definition of Done

- [ ] Single localStorage key: `grove-engagement-state`
- [ ] No `grove-telemetry` key created
- [ ] Stage field exists in EngagementState
- [ ] Stage visible in TerminalWelcome
- [ ] Prompts adapt to stage
- [ ] All deleted files removed
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Console has no errors

---

## Rollback Plan

If consolidation causes issues:

1. Revert Git commits
2. Restore deleted files from Git history
3. localStorage data preserved (migration is additive)

Low risk: We're deleting redundant code, not changing core functionality.
