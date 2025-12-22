# Sprint Stories — health-dashboard-v1 (Revised)

## Epic 1: Health Configuration Schema (Priority: Critical)

### Story 1.1: Create health-config.json with check definitions
**Task:** Create declarative health config with engine and corpus checks
**File:** Create `data/infrastructure/health-config.json`
**Acceptance:** Config parses, defines all current checks declaratively
**Commit:** `feat: add declarative health-config.json`

### Story 1.2: Create health-log.json initial structure
**Task:** Create empty health log with version and maxEntries
**File:** Create `data/infrastructure/health-log.json`
**Acceptance:** File exists, parses, has correct schema
**Commit:** `feat: add health-log.json`

---

## Epic 2: Config-Driven Validator Engine (Priority: Critical)

### Story 2.1: Create health-validator.js with config loading
**Task:** Implement loadConfig() with validation and fallback defaults
**File:** Create `lib/health-validator.js`
**Acceptance:** loadConfig() returns parsed config or defaults with warning
**Commit:** `feat: add config loader with progressive enhancement`

### Story 2.2: Implement check type executors
**Task:** Implement executors for json-exists, reference-check, chain-valid
**File:** `lib/health-validator.js` (extend)
**Acceptance:** Each executor handles its check type correctly
**Commit:** `feat: implement check type executors`

### Story 2.3: Implement runChecks() orchestration
**Task:** Iterate config checks, dispatch to executors, build report
**File:** `lib/health-validator.js` (extend)
**Acceptance:** runChecks(config) returns complete HealthReport with attribution
**Commit:** `feat: implement runChecks orchestration`

### Story 2.4: Implement health log management
**Task:** Add loadHealthLog(), appendToHealthLog() with FIFO cap
**File:** `lib/health-validator.js` (extend)
**Acceptance:** Log entries include attribution, cap enforced at 100
**Commit:** `feat: add health log management with attribution`

---

## Epic 3: CLI Migration (Priority: High)

### Story 3.1: Refactor health-check.js to use shared validator
**Task:** Replace inline logic with import from lib/health-validator.js
**File:** `scripts/health-check.js`
**Acceptance:** `npm run health` produces config-driven output
**Commit:** `refactor: use config-driven validator in CLI`

### Story 3.2: Update CLI output to use display config
**Task:** Read category labels from config.display for human output
**File:** `scripts/health-check.js`
**Acceptance:** Category names in output match config.display.categoryLabels
**Commit:** `feat: use config display labels in CLI output`

---

## Epic 4: Health API Endpoints (Priority: High)

### Story 4.1: Add GET /api/health endpoint
**Task:** Return current health report with configVersion
**File:** `server.js`
**Acceptance:** `curl localhost:8080/api/health` returns config-driven report
**Commit:** `feat: add GET /api/health endpoint`

### Story 4.2: Add GET /api/health/config endpoint
**Task:** Return display settings for UI consumption
**File:** `server.js`
**Acceptance:** Response includes display.dashboardTitle and categoryLabels
**Commit:** `feat: add GET /api/health/config endpoint`

### Story 4.3: Add GET /api/health/history endpoint
**Task:** Return health log entries with attribution
**File:** `server.js`
**Acceptance:** Entries include attribution chain
**Commit:** `feat: add GET /api/health/history endpoint`

### Story 4.4: Add POST /api/health/run endpoint
**Task:** Trigger check, append to log with attribution, return result
**File:** `server.js`
**Acceptance:** POST creates log entry with triggeredBy: 'api'
**Commit:** `feat: add POST /api/health/run endpoint`

---

## Epic 5: Health Dashboard UI (Priority: High)

### Story 5.1: Create HealthDashboard component shell
**Task:** Create component with layout following Genesis patterns
**File:** Create `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Component renders with placeholder content
**Commit:** `feat: add HealthDashboard component shell`

### Story 5.2: Fetch and display config-driven labels
**Task:** Load /api/health/config, render dashboardTitle and categories
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Dashboard title and category names from config
**Commit:** `feat: integrate config-driven display labels`

### Story 5.3: Display current health status
**Task:** Fetch /api/health, render status cards with check results
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Status summary and category breakdown visible
**Commit:** `feat: display current health status`

### Story 5.4: Display health history with attribution
**Task:** Fetch /api/health/history, render log entries
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** History shows timestamp, status, triggeredBy
**Commit:** `feat: display health history with attribution`

### Story 5.5: Add "Run Health Check" button
**Task:** Button POSTs to /api/health/run, refreshes display
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Click triggers check and updates UI
**Commit:** `feat: add run health check button`

### Story 5.6: Add expandable failed check details
**Task:** Failed checks expand to show impact and inspect guidance
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Acceptance:** Clicking failed check reveals impact/inspect from config
**Commit:** `feat: add expandable failed check details`

---

## Epic 6: Navigation Integration (Priority: High)

### Story 6.1: Add health nav item to sidebar
**Task:** Add HeartPulse icon and link to /foundation/health
**File:** `src/foundation/layout/NavSidebar.tsx`
**Acceptance:** "System Health" appears in Foundation nav
**Commit:** `feat: add health dashboard to Foundation nav`

### Story 6.2: Add route for health dashboard
**Task:** Wire up /foundation/health route to HealthDashboard
**File:** Router file (App.tsx or router/index.tsx)
**Acceptance:** Navigation works end-to-end
**Commit:** `feat: add health dashboard route`

---

## Epic 7: Testing (Priority: High)

### Story 7.1: Add health API integration tests
**Task:** Test all four endpoints including attribution
**File:** Create `tests/integration/health-api.test.ts`
**Acceptance:** Tests verify configVersion, attribution chain
**Commit:** `test: add health API integration tests`

### Story 7.2: Add config validation tests
**Task:** Test config loading, fallback defaults, malformed handling
**File:** Create `tests/unit/health-config.test.ts`
**Acceptance:** Tests cover progressive enhancement scenarios
**Commit:** `test: add health config validation tests`

### Story 7.3: Verify existing tests still pass
**Task:** Run full test suite, fix any regressions
**File:** All test files
**Acceptance:** `npm test` passes
**Commit:** `test: verify test suite passes with new validator`

---

## Commit Sequence
```
1. feat: add declarative health-config.json
2. feat: add health-log.json
3. feat: add config loader with progressive enhancement
4. feat: implement check type executors
5. feat: implement runChecks orchestration
6. feat: add health log management with attribution
7. refactor: use config-driven validator in CLI
8. feat: use config display labels in CLI output
9. feat: add GET /api/health endpoint
10. feat: add GET /api/health/config endpoint
11. feat: add GET /api/health/history endpoint
12. feat: add POST /api/health/run endpoint
13. feat: add HealthDashboard component shell
14. feat: integrate config-driven display labels
15. feat: display current health status
16. feat: display health history with attribution
17. feat: add run health check button
18. feat: add expandable failed check details
19. feat: add health dashboard to Foundation nav
20. feat: add health dashboard route
21. test: add health API integration tests
22. test: add health config validation tests
23. test: verify test suite passes with new validator
```

## Build Gates

- After Epic 1: Config files exist and parse
- After Epic 2: `node -e "import('./lib/health-validator.js').then(m => console.log(m.runChecks(m.loadConfig())))"`
- After Epic 3: `npm run health` produces config-driven output
- After Epic 4: All four API endpoints respond correctly
- After Epic 5: Dashboard renders with config-driven labels
- After Epic 6: Navigation works end-to-end
- Before deploy: `npm run test:all && npm run health`

## Smoke Test Checklist

### DEX Standard Alignment
- [ ] Health checks defined declaratively in config (not hardcoded)
- [ ] Adding a check requires only config change (no code)
- [ ] Engine checks separated from corpus checks
- [ ] Display labels come from config
- [ ] Log entries include attribution (configVersion, engineVersion, triggeredBy)

### Functionality
- [ ] `npm run health` works (CLI)
- [ ] GET /api/health returns config-driven report
- [ ] GET /api/health/config returns display settings
- [ ] GET /api/health/history returns entries with attribution
- [ ] POST /api/health/run creates log entry
- [ ] Foundation nav shows "System Health"
- [ ] /foundation/health renders dashboard
- [ ] Dashboard title matches config.display.dashboardTitle
- [ ] Category names match config.display.categoryLabels
- [ ] "Run Health Check" button works
- [ ] Failed checks expand to show impact/inspect
- [ ] Tests pass: `npm test`
