# Epic 0: Health Integration - Sprint Plan

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23
**Estimated Duration**: 2-3 hours

---

## Sprint Overview

| Task | Effort | Dependencies |
|------|--------|--------------|
| T1: Add e2e-behavior check type | 20 min | None |
| T2: Update health config | 15 min | T1 |
| T3: Add API endpoint | 25 min | T1, T2 |
| T4: Create health reporter | 30 min | T3 |
| T5: Update playwright config | 5 min | T4 |
| T6: Add integration tests | 20 min | T3 |
| T7: Verify end-to-end | 15 min | All |

**Total: ~2.5 hours**

---

## Task Details

### T1: Add e2e-behavior Check Type (20 min)

**File**: `lib/health-validator.js`

**Actions**:
1. Add `executeE2EBehavior` function after `executeChainValid`
2. Add case to `executeCheck` switch statement
3. Test manually with mock log entry

**Acceptance Criteria**:
- [ ] `executeE2EBehavior` function exists
- [ ] Switch case added for `'e2e-behavior'`
- [ ] Returns `warn` if no test reference
- [ ] Returns `warn` if no E2E data in log
- [ ] Returns test status if found

**Code Location**: After line ~160

---

### T2: Update Health Config (15 min)

**File**: `data/infrastructure/health-config.json`

**Actions**:
1. Bump version to "1.1"
2. Add `e2e-tests` and `engagement` category labels
3. Add `engagementChecks` array with 3 initial checks

**Acceptance Criteria**:
- [ ] Version is "1.1"
- [ ] `e2e-tests` label in categoryLabels
- [ ] `engagement` label in categoryLabels
- [ ] 3 engagement checks defined
- [ ] Each check has id, name, type, test, impact, inspect

**Validation**: `node -e "console.log(JSON.parse(require('fs').readFileSync('data/infrastructure/health-config.json')))"` succeeds

---

### T3: Add API Endpoint (25 min)

**File**: `server.js`

**Actions**:
1. Add `POST /api/health/report` endpoint
2. Validate required fields (category, checks)
3. Validate status values
4. Calculate summary
5. Call `appendToHealthLog`

**Acceptance Criteria**:
- [ ] Endpoint responds to POST
- [ ] Returns 400 for missing category
- [ ] Returns 400 for missing checks
- [ ] Returns 400 for invalid status
- [ ] Returns 201 with entry on success
- [ ] Entry appears in health log

**Manual Test**:
```bash
curl -X POST http://localhost:5173/api/health/report \
  -H "Content-Type: application/json" \
  -d '{"category":"test","checks":[{"id":"t1","status":"pass"}]}'
```

---

### T4: Create Health Reporter (30 min)

**Files**: 
- `tests/reporters/health-reporter.ts` (create)
- `tests/reporters/index.ts` (create)

**Actions**:
1. Create reporters directory
2. Implement HealthReporter class
3. Implement `onTestEnd` to collect results
4. Implement `onEnd` to POST to API
5. Add graceful error handling
6. Create index.ts barrel export

**Acceptance Criteria**:
- [ ] Class implements Playwright Reporter interface
- [ ] Collects results in `onTestEnd`
- [ ] POSTs results in `onEnd`
- [ ] Maps status correctly
- [ ] Slugifies test names
- [ ] Gracefully handles API errors
- [ ] Logs success/failure to console

**Type Check**: `npx tsc tests/reporters/health-reporter.ts --noEmit` succeeds

---

### T5: Update Playwright Config (5 min)

**File**: `playwright.config.ts`

**Actions**:
1. Add health reporter to reporter array
2. Configure baseUrl option

**Acceptance Criteria**:
- [ ] Health reporter in reporter array
- [ ] Accepts baseUrl option
- [ ] Existing reporters still work

**Validation**: `npx playwright test --list` shows tests

---

### T6: Add Integration Tests (20 min)

**File**: `tests/integration/health-api.test.ts`

**Actions**:
1. Add describe block for `POST /api/health/report`
2. Test valid report acceptance
3. Test missing category rejection
4. Test missing checks rejection
5. Test invalid status rejection
6. Test report appears in history

**Acceptance Criteria**:
- [ ] 5+ new tests added
- [ ] All tests pass when server running
- [ ] Tests skip gracefully when server not running

**Run**: `npx vitest tests/integration/health-api.test.ts`

---

### T7: Verify End-to-End (15 min)

**Actions**:
1. Start dev server: `npm run dev`
2. Run E2E tests: `npx playwright test`
3. Check health log for e2e-tests entry
4. Run health checks: `curl http://localhost:5173/api/health`
5. Verify engagement category appears
6. Verify engagement checks reference tests

**Acceptance Criteria**:
- [ ] E2E tests run successfully
- [ ] Console shows "[HealthReporter] Reported N tests"
- [ ] health-log.json contains e2e-tests entry
- [ ] Health API returns engagement category
- [ ] Engagement checks show test status

**Verification Script**:
```bash
# Run after tests complete
cat data/infrastructure/health-log.json | jq '.entries[0].categories[] | select(.id=="e2e-tests")'
```

---

## Definition of Done

### Code Complete
- [ ] All 7 tasks completed
- [ ] No TypeScript errors
- [ ] No console errors in reporter

### Tests Pass
- [ ] Existing E2E tests pass (34)
- [ ] New integration tests pass (5+)
- [ ] Existing health checks pass

### Documentation Updated
- [ ] DEVLOG.md filled in
- [ ] README mention if appropriate
- [ ] Code comments for complex logic

### Verified Working
- [ ] Reporter POSTs to API
- [ ] Health log contains e2e-tests
- [ ] Engagement checks return status
- [ ] Graceful degradation works (stop server, run tests, tests still pass)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Reporter breaks tests | Graceful error handling, never throw |
| API validation too strict | Validate only required fields |
| Log file corruption | Use existing appendToHealthLog |
| TypeScript issues | Test compilation early |

---

## Checkpoint Opportunities

### After T3 (API Endpoint)
- Can test endpoint manually with curl
- Independent of reporter implementation
- Good stopping point if needed

### After T4 (Reporter)
- Can run reporter manually
- Can debug output before config
- Verify data format before integration

### After T6 (Integration Tests)
- Full API coverage
- Safety net for changes
- Confidence before E2E verification

---

## Commit Strategy

### Option A: Single Commit
```
feat: integrate E2E tests with Health system (Epic 0)

- Add e2e-behavior check type to health-validator
- Add POST /api/health/report endpoint
- Create Playwright health reporter
- Add engagement health checks
- Add integration tests for health report API
```

### Option B: Task-by-Task Commits (Recommended)
```
feat(health): add e2e-behavior check type
feat(health): add engagement category to health config
feat(api): add POST /api/health/report endpoint
feat(test): create Playwright health reporter
chore(test): add health report integration tests
docs: update DEVLOG with Epic 0 implementation
```

---

## Execution Order

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Execution Flow                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────┐                                                                    │
│  │ T1  │ Add e2e-behavior check type                                       │
│  └──┬──┘                                                                    │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────┐                                                                    │
│  │ T2  │ Update health config                                              │
│  └──┬──┘                                                                    │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────┐          ┌─────┐                                                  │
│  │ T3  │─────────►│ T6  │ (can run in parallel)                           │
│  └──┬──┘ API      └─────┘ Integration tests                                │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────┐                                                                    │
│  │ T4  │ Create reporter                                                   │
│  └──┬──┘                                                                    │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────┐                                                                    │
│  │ T5  │ Update Playwright config                                          │
│  └──┬──┘                                                                    │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────┐                                                                    │
│  │ T7  │ End-to-end verification                                           │
│  └─────┘                                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Key Files
- `lib/health-validator.js` - Add executor
- `data/infrastructure/health-config.json` - Add checks
- `server.js` - Add endpoint
- `tests/reporters/health-reporter.ts` - Create reporter
- `playwright.config.ts` - Wire up reporter

### Key Commands
```bash
# Start server
npm run dev

# Run E2E tests (with reporting)
npx playwright test

# Run integration tests
npx vitest tests/integration/health-api.test.ts

# Check health log
cat data/infrastructure/health-log.json | jq '.entries[0]'

# Call health API
curl http://localhost:5173/api/health | jq
```

---

## References

- MIGRATION_MAP.md - Detailed file changes
- DECISIONS.md - Why we made these choices
- SPEC.md - Full implementation specs
