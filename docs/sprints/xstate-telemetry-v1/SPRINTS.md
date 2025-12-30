# SPRINTS.md — Epic & Story Breakdown

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29
**Estimated Effort:** ~4 hours

---

## Epic 1: Extend XState Types

**Goal:** Add all new context fields and event types

### Story 1.1: Add Context Fields

**Task:** Extend `EngagementContext` interface and `initialContext`

**File:** `src/core/engagement/types.ts`

**Changes:**
- Add `sessionStartedAt: number`
- Add `sessionCount: number`
- Add `journeysCompleted: number`
- Add `sproutsCaptured: number`
- Add `topicsExplored: string[]`
- Add `hasCustomLens: boolean`
- Update `initialContext` with default values

**Tests:**
- TypeScript compilation (`npm run typecheck`)

### Story 1.2: Add Event Types

**Task:** Add new event types to `EngagementEvent` union

**File:** `src/core/engagement/types.ts`

**Changes:**
- Add `SESSION_STARTED`
- Add `JOURNEY_COMPLETED_TRACKED`
- Add `SPROUT_CAPTURED`
- Add `TOPIC_EXPLORED`
- Add `MOMENT_SHOWN`
- Add `MOMENT_ACTIONED`
- Add `MOMENT_DISMISSED`

**Tests:**
- TypeScript compilation

### Build Gate
```bash
npm run typecheck
npm run build
```

---

## Epic 2: Extend Persistence Layer

**Goal:** Add cumulative metrics storage with session detection

### Story 2.1: Add Storage Types and Key

**Task:** Add `CumulativeMetrics` interface and storage key

**File:** `src/core/engagement/persistence.ts`

**Changes:**
- Add `cumulativeMetrics` to `STORAGE_KEYS`
- Add `CumulativeMetrics` interface
- Export interface for use in context.tsx

### Story 2.2: Add Persistence Functions

**Task:** Implement get/set/isNewSession functions

**File:** `src/core/engagement/persistence.ts`

**Changes:**
- Add `getCumulativeMetrics(): CumulativeMetrics | null`
- Add `setCumulativeMetrics(metrics: CumulativeMetrics): void`
- Add `isNewSession(lastSessionAt: number | undefined): boolean`
- Add `SESSION_TIMEOUT_MS` constant (30 minutes)

**Tests:**
- Unit test: getCumulativeMetrics returns null when empty
- Unit test: setCumulativeMetrics stores JSON correctly
- Unit test: isNewSession returns true after timeout

### Build Gate
```bash
npm run typecheck
npm test -- persistence
```

---

## Epic 3: Extend XState Machine

**Goal:** Add actions and event handlers for new events

### Story 3.1: Add Helper Function

**Task:** Add `isCustomLensId` function for custom lens detection

**File:** `src/core/engagement/machine.ts`

**Changes:**
- Add function to detect `custom-*` prefix or UUID pattern

### Story 3.2: Add Metric Actions

**Task:** Add assign actions for cumulative metrics

**File:** `src/core/engagement/machine.ts`

**Changes:**
- Add `incrementJourneysCompleted` action
- Add `incrementSproutsCaptured` action
- Add `addTopicExplored` action
- Add `updateHasCustomLens` action
- Add `persistMetrics` action

### Story 3.3: Add Event Handlers

**Task:** Wire new events to actions

**File:** `src/core/engagement/machine.ts`

**Changes:**
- Add handler for `JOURNEY_COMPLETED_TRACKED`
- Add handler for `SPROUT_CAPTURED`
- Add handler for `TOPIC_EXPLORED`
- Add handlers for `MOMENT_SHOWN/ACTIONED/DISMISSED`
- Update `SELECT_LENS` handler to call `updateHasCustomLens`

### Build Gate
```bash
npm run typecheck
npm run build
```

---

## Epic 4: Add Context Hydration

**Goal:** Hydrate XState context from localStorage on mount

### Story 4.1: Add Hydration Function

**Task:** Create function to build hydrated initial context

**File:** `src/core/engagement/context.tsx`

**Changes:**
- Add `getHydratedContext(): EngagementContext` function
- Handle missing storage gracefully
- Detect new session and increment sessionCount
- Set sessionStartedAt to current time

### Story 4.2: Update Actor Creation

**Task:** Use hydrated context when creating actor

**File:** `src/core/engagement/context.tsx`

**Changes:**
- Use `engagementMachine.withContext(getHydratedContext())`
- Ensure hydration runs only on client (isBrowser check)

**Tests:**
- Integration: Provider mounts with hydrated context
- Integration: New session increments sessionCount

### Build Gate
```bash
npm run typecheck
npm run build
npm test
```

---

## Epic 5: Migrate useMoments.ts

**Goal:** Remove Engagement Bus dependency, use XState for telemetry

### Story 5.1: Remove Engagement Bus Import

**Task:** Delete import and hook usage

**File:** `src/surface/hooks/useMoments.ts`

**Changes:**
- Remove `import { useEngagementEmit } from '../../../hooks/useEngagementBus'`
- Remove `const emit = useEngagementEmit()`

### Story 5.2: Replace Telemetry Calls

**Task:** Convert emit calls to actor.send

**File:** `src/surface/hooks/useMoments.ts`

**Changes:**
- Replace `emit.momentShown()` with `actor.send({ type: 'MOMENT_SHOWN', ... })`
- Replace `emit.momentActioned()` with `actor.send({ type: 'MOMENT_ACTIONED', ... })`
- Replace `emit.momentDismissed()` with `actor.send({ type: 'MOMENT_DISMISSED', ... })`

### Story 5.3: Update Context Mapping

**Task:** Map new XState fields to MomentEvaluationContext

**File:** `src/surface/hooks/useMoments.ts`

**Changes:**
- Map `journeysCompleted` from XState context
- Map `sproutsCaptured` from XState context
- Map `topicsExplored` from XState context
- Compute `minutesActive` from `sessionStartedAt`
- Map `sessionCount` from XState context
- Map `hasCustomLens` from XState context

**Tests:**
- Unit: evaluationContext has correct field mappings
- E2E: Moments trigger correctly with new context

### Build Gate
```bash
npm run typecheck
npm run build
npm test
npx playwright test tests/e2e/moments*.spec.ts
```

---

## Epic 6: Verification & Cleanup

**Goal:** Verify all acceptance criteria and document completion

### Story 6.1: Verify Engagement Bus Removal

**Task:** Confirm no useMoments.ts references to Engagement Bus

**Verification:**
```bash
grep -rn "useEngagementBus" src/surface/hooks/useMoments.ts
# Expected: no output
```

### Story 6.2: Manual Testing

**Task:** Verify cumulative metrics work end-to-end

**Steps:**
1. Open Terminal, complete a journey
2. Check localStorage for `grove-telemetry-cumulative`
3. Verify `journeysCompleted` incremented
4. Reload page
5. Verify values persist

### Story 6.3: Update DEVLOG

**Task:** Document completion and any issues

**File:** `docs/sprints/xstate-telemetry-v1/DEVLOG.md`

### Build Gate (Final)
```bash
npm run build
npm test
npx playwright test
```

---

## Commit Sequence

| # | Commit Message | Stories |
|---|----------------|---------|
| 1 | `feat(engagement): add telemetry context fields and events` | 1.1, 1.2 |
| 2 | `feat(persistence): add cumulative metrics storage` | 2.1, 2.2 |
| 3 | `feat(engagement): add telemetry actions and handlers` | 3.1, 3.2, 3.3 |
| 4 | `feat(engagement): hydrate context from localStorage` | 4.1, 4.2 |
| 5 | `refactor(moments): migrate from engagement bus to xstate` | 5.1, 5.2, 5.3 |
| 6 | `docs: complete xstate-telemetry-v1 sprint` | 6.1, 6.2, 6.3 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Persistence fails silently | Wrap in try/catch, log warnings |
| Context hydration breaks SSR | Guard with `isBrowser()` check |
| Moment triggers break | Keep existing Engagement Bus until verified |
| Type errors cascade | Build after each epic |
