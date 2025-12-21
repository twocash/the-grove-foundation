# Sprint Stories — health-dashboard-v1

## Epic 1: Extract Shared Validation (Priority: Critical)

### Story 1.1: Create health-validator.js module
**Task:** Extract validation logic from health-check.js to lib/health-validator.js
**File:** Create `lib/health-validator.js`
**Acceptance:** Module exports `generateHealthReport()` function
**Commit:** `refactor: extract health validation to lib/health-validator.js`

### Story 1.2: Update health-check.js to use shared module
**Task:** Import from lib/health-validator.js, remove inline logic
**File:** `scripts/health-check.js`
**Acceptance:** `npm run health` produces identical output
**Commit:** `refactor: use shared health validator in CLI`

---

## Epic 2: Health Log Infrastructure (Priority: Critical)

### Story 2.1: Create health log data file
**Task:** Create initial health-log.json with empty entries
**File:** Create `data/infrastructure/health-log.json`
**Acceptance:** File exists with valid schema
**Commit:** `feat: add health log data file`

### Story 2.2: Add log management functions
**Task:** Add functions to load, append, and cap health log
**File:** `lib/health-validator.js` (extend)
**Acceptance:** `appendToHealthLog()` adds entry and enforces cap
**Commit:** `feat: add health log management functions`

---

## Epic 3: Health API Endpoints (Priority: Critical)

### Story 3.1: Add GET /api/health endpoint
**Task:** Return current health report as JSON
**File:** `server.js`
**Acceptance:** `curl localhost:8080/api/health` returns valid JSON
**Commit:** `feat: add GET /api/health endpoint`

### Story 3.2: Add GET /api/health/history endpoint
**Task:** Return health log entries with optional limit
**File:** `server.js`
**Acceptance:** `curl localhost:8080/api/health/history?limit=10` works
**Commit:** `feat: add GET /api/health/history endpoint`

### Story 3.3: Add POST /api/health/run endpoint
**Task:** Trigger health check, append to log, return result
**File:** `server.js`
**Acceptance:** POST creates new log entry
**Commit:** `feat: add POST /api/health/run endpoint`

---

## Epic 4: Health Dashboard UI (Priority: High)

### Story 4.1: Create HealthDashboard console component
**Task:** Create component with status summary and history list
**File:** Create `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Component renders with mock data
**Commit:** `feat: add HealthDashboard console component`

### Story 4.2: Add API integration to dashboard
**Task:** Fetch from /api/health and /api/health/history
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Real data displays in UI
**Commit:** `feat: integrate health API in dashboard`

### Story 4.3: Add "Run Health Check" button
**Task:** Button that POSTs to /api/health/run and refreshes UI
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Click triggers check and updates display
**Commit:** `feat: add run health check button`

### Story 4.4: Add category expansion for failed checks
**Task:** Failed checks show IMPACT and INSPECT info when clicked
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Clicking failed check reveals details
**Commit:** `feat: add expandable failed check details`

---

## Epic 5: Navigation Integration (Priority: High)

### Story 5.1: Add health nav item to sidebar
**Task:** Add HeartPulse icon and link to /foundation/health
**File:** `src/foundation/layout/NavSidebar.tsx`
**Acceptance:** "System Health" appears in nav
**Commit:** `feat: add health dashboard to Foundation nav`

### Story 5.2: Add route for health dashboard
**Task:** Wire up /foundation/health route to HealthDashboard
**File:** Router file (App.tsx or router/index.tsx)
**Acceptance:** Navigation works end-to-end
**Commit:** `feat: add health dashboard route`

---

## Epic 6: Testing (Priority: High)

### Story 6.1: Add health API integration tests
**Task:** Test GET /api/health, /history, POST /run
**File:** Create `tests/integration/health-api.test.ts`
**Acceptance:** Tests pass with server running
**Commit:** `test: add health API integration tests`

### Story 6.2: Update existing tests for refactored validator
**Task:** Ensure schema.test.ts still passes after refactor
**File:** `tests/unit/schema.test.ts`
**Acceptance:** `npm test` passes
**Commit:** `test: verify schema tests with shared validator`

---

## Commit Sequence
```
1. refactor: extract health validation to lib/health-validator.js
2. refactor: use shared health validator in CLI
3. feat: add health log data file
4. feat: add health log management functions
5. feat: add GET /api/health endpoint
6. feat: add GET /api/health/history endpoint
7. feat: add POST /api/health/run endpoint
8. feat: add HealthDashboard console component
9. feat: integrate health API in dashboard
10. feat: add run health check button
11. feat: add expandable failed check details
12. feat: add health dashboard to Foundation nav
13. feat: add health dashboard route
14. test: add health API integration tests
15. test: verify schema tests with shared validator
```

## Build Gates
- After Epic 1: `npm run health` (unchanged output)
- After Epic 2: Health log file exists
- After Epic 3: `curl localhost:8080/api/health`
- After Epic 4: UI renders at /foundation/health
- After Epic 5: Navigation works
- Before deploy: `npm run test:all && npm run health`

## Smoke Test Checklist
- [ ] `npm run health` works (CLI)
- [ ] GET /api/health returns JSON
- [ ] GET /api/health/history returns array
- [ ] POST /api/health/run creates log entry
- [ ] Foundation nav shows "System Health"
- [ ] /foundation/health renders dashboard
- [ ] "Run Health Check" button works
- [ ] Failed checks expand to show details
- [ ] Tests pass: `npm test`
- [ ] Health check passes: `npm run health`
