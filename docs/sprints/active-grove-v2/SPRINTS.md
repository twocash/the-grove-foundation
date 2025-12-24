# Sprint Breakdown — Active Grove E2E Test Suite v2

## Epic Overview

Add comprehensive E2E tests for the Active Grove lens-reactive content transformation flow.

## Story Breakdown

### Story 1: Infrastructure & Setup
**Points:** 2
**Priority:** P0 (Blocker)

#### Tasks
- [ ] 1.1: Add data-testid attributes to GenesisPage for test targeting
- [ ] 1.2: Add data-testid to WaveformCollapse component
- [ ] 1.3: Expose XState machine state via `data-engagement-state` attribute
- [ ] 1.4: Create test utility for waiting on quantum interface updates

#### Files
- `src/surface/pages/GenesisPage.tsx`
- `src/surface/components/WaveformCollapse.tsx`
- `components/Terminal.tsx`
- `tests/e2e/utils/quantum.ts` (new)

#### Acceptance
- Data attributes visible in browser DevTools
- Test utilities importable from `tests/e2e/utils`

---

### Story 2: Core Transformation Tests
**Points:** 5
**Priority:** P0 (Critical)

#### Tasks
- [ ] 2.1: Test AG-1.1 through AG-1.5 (seedling → lens picker flow)
- [ ] 2.2: Test AG-1.6 (XState update verification)
- [ ] 2.3: Test AG-1.7 (reality object validation)
- [ ] 2.4: Test AG-1.8 (WaveformCollapse animation trigger)
- [ ] 2.5: Test AG-1.9 (state persistence on reload)

#### Files
- `tests/e2e/active-grove.spec.ts`

#### Acceptance
- All 9 step-by-step tests pass
- Tests run in < 30 seconds
- Clear error messages on failure

---

### Story 3: User Behavior Simulation Tests
**Points:** 3
**Priority:** P1 (High)

#### Tasks
- [ ] 3.1: Test AG-2.1 (rapid lens switching)
- [ ] 3.2: Test AG-2.2 (close/reopen terminal)
- [ ] 3.3: Test AG-2.3 (URL deep link)
- [ ] 3.4: Test AG-2.4 (invalid URL lens)
- [ ] 3.5: Test AG-2.5 (multiple seedling clicks)
- [ ] 3.6: Test AG-2.6 (browser back button)
- [ ] 3.7: Test AG-2.7 (localStorage corruption recovery)

#### Files
- `tests/e2e/active-grove.spec.ts`

#### Acceptance
- All 7 behavior tests pass
- No flaky tests (3 consecutive runs clean)

---

### Story 4: Health Check Integration
**Points:** 2
**Priority:** P1 (High)

#### Tasks
- [ ] 4.1: Add `active-grove-transformation` check to health-config.json
- [ ] 4.2: Add `quantum-interface-returns-lens` check
- [ ] 4.3: Add `waveform-collapse-triggers` check
- [ ] 4.4: Add `lens-persistence-works` check (if not already present)

#### Files
- `data/infrastructure/health-config.json`

#### Acceptance
- `npm run health` shows Active Grove checks
- Failed checks have clear remediation instructions

---

### Story 5: Documentation & DEVLOG
**Points:** 1
**Priority:** P2 (Medium)

#### Tasks
- [ ] 5.1: Update TESTING.md with Active Grove test instructions
- [ ] 5.2: Create DEVLOG.md with implementation notes
- [ ] 5.3: Mark sprint as COMPLETED.md

#### Files
- `docs/TESTING.md`
- `docs/sprints/active-grove-v2/DEVLOG.md`
- `docs/sprints/active-grove-v2/COMPLETED.md`

#### Acceptance
- Documentation is accurate
- Future developers can understand and extend tests

---

## Sprint Schedule

| Story | Points | Status | Notes |
|-------|--------|--------|-------|
| Story 1: Infrastructure | 2 | Pending | Blocker for all other stories |
| Story 2: Core Tests | 5 | Pending | Critical path |
| Story 3: Behavior Tests | 3 | Pending | Can parallelize with Story 2 |
| Story 4: Health Checks | 2 | Pending | After Story 2 |
| Story 5: Documentation | 1 | Pending | Final step |

**Total Points:** 13

## Definition of Done

- [ ] All tests pass locally (`npx playwright test active-grove`)
- [ ] Tests pass in CI (Cloud Build)
- [ ] Health checks visible in `/foundation` dashboard
- [ ] No regressions in existing tests
- [ ] DEVLOG.md documents any decisions or workarounds
