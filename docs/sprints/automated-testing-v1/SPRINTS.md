# Sprint Stories — Automated Testing Infrastructure

## Epic 1: Test Framework Setup (Priority: Critical)

### Story 1.1: Install Test Dependencies
**Task:** Add Vitest and Playwright
**Commands:**
```bash
npm install -D vitest @vitest/ui @playwright/test
npx playwright install chromium
```
**Acceptance:** Dependencies in package.json, no install errors
**Commit:** `chore: add vitest and playwright test frameworks`

### Story 1.2: Create Test Directory Structure
**Task:** Create test directories
**Commands:**
```bash
mkdir -p tests/unit tests/integration tests/e2e tests/fixtures tests/utils
```
**Acceptance:** Directories exist
**Commit:** `chore: create test directory structure`

### Story 1.3: Configure Vitest
**File:** Create `vitest.config.ts`
**Task:** Configure for TypeScript, exclude E2E
**Acceptance:** `npx vitest --version` works
**Commit:** `chore: configure vitest`

### Story 1.4: Configure Playwright
**File:** Create `playwright.config.ts`
**Task:** Configure for Grove Terminal
**Acceptance:** `npx playwright --version` works
**Commit:** `chore: configure playwright`

### Story 1.5: Add Test Scripts to package.json
**File:** `package.json`
**Task:** Add test, test:watch, test:e2e, health scripts
**Acceptance:** `npm test` runs (even with no tests)
**Commit:** `chore: add test scripts to package.json`

---

## Epic 2: Schema Validation Tests (Priority: Critical)

### Story 2.1: Create Schema Loader Utility
**File:** Create `tests/utils/schema-loader.ts`
**Task:** Export functions to load hubs, journeys, nodes
**Acceptance:** Can import and use in tests
**Commit:** `test: add schema loader utility`

### Story 2.2: Test Schema File Parsing
**File:** Create `tests/unit/schema.test.ts`
**Task:** Test all JSON files parse without errors
**Acceptance:** Test passes
**Commit:** `test: add schema parsing tests`

### Story 2.3: Test Journey→Hub References
**File:** `tests/unit/schema.test.ts`
**Task:** Test all journey.hubId references exist in hubs.json
**Acceptance:** Test passes
**Commit:** `test: add journey-hub reference validation`

### Story 2.4: Test Journey→Node References
**File:** `tests/unit/schema.test.ts`
**Task:** Test all journey.entryNode references exist in nodes.json
**Acceptance:** Test passes
**Commit:** `test: add journey-node reference validation`

### Story 2.5: Test Node→Journey References
**File:** `tests/unit/schema.test.ts`
**Task:** Test all node.journeyId references exist in journeys.json
**Acceptance:** Test passes
**Commit:** `test: add node-journey reference validation`

### Story 2.6: Test Node Chain References
**File:** `tests/unit/schema.test.ts`
**Task:** Test all node.primaryNext references exist
**Acceptance:** Test passes
**Commit:** `test: add node chain reference validation`

### Story 2.7: Test Hub Path Pattern
**File:** `tests/unit/schema.test.ts`
**Task:** Test all hub paths follow `hubs/{id}/` pattern
**Acceptance:** Test passes
**Commit:** `test: add hub path pattern validation`

---

## Epic 3: Journey Navigation Tests (Priority: High)

### Story 3.1: Test Journey Node Counts
**File:** Create `tests/unit/journey-navigation.test.ts`
**Task:** Test each journey has expected node count
**Test data:**
| Journey | Expected Nodes |
|---------|----------------|
| simulation | 5 |
| stakes | 3 |
| ratchet | 4 |
| diary | 4 |
| emergence | 5 |
| architecture | 3 |
**Acceptance:** All journey counts match
**Commit:** `test: add journey node count validation`

### Story 3.2: Test Node Chain Traversal
**File:** `tests/unit/journey-navigation.test.ts`
**Task:** Test all node chains traverse from entry to terminal
**Acceptance:** No dead-end nodes (except intended terminals)
**Commit:** `test: add node chain traversal validation`

### Story 3.3: Test Journey Progress Calculation
**File:** `tests/unit/journey-navigation.test.ts`
**Task:** Test function that calculates current step / total
**Acceptance:** Returns correct X/N for each journey
**Commit:** `test: add journey progress calculation`

---

## Epic 4: Health Report System (Priority: High)

### Story 4.1: Create Health Report Types
**File:** Create `tests/utils/health-report.ts`
**Task:** Define TypeScript types for health report
**Types:** `HealthCheck`, `HealthCategory`, `HealthReport`
**Commit:** `test: add health report types`

### Story 4.2: Implement Schema Health Checks
**File:** `tests/utils/health-report.ts`
**Task:** Check schema integrity, return status + details
**Acceptance:** Returns pass/fail with context
**Commit:** `test: implement schema health checks`

### Story 4.3: Implement Journey Health Checks
**File:** `tests/utils/health-report.ts`
**Task:** Check journey navigation, return status + details
**Acceptance:** Returns pass/fail with context
**Commit:** `test: implement journey health checks`

### Story 4.4: Implement Report Formatter
**File:** `tests/utils/health-report.ts`
**Task:** Format report as human-readable ASCII
**Output:** Box-drawing characters, colors, sections
**Commit:** `test: implement health report formatter`

### Story 4.5: Create Health Check CLI
**File:** Create `scripts/health-check.js`
**Task:** CLI entry point that runs checks and outputs report
**Usage:** `npm run health`, `npm run health -- --json`
**Acceptance:** Running shows formatted report
**Commit:** `feat: add health check CLI`

---

## Epic 5: API Contract Tests (Priority: High)

### Story 5.1: Create API Test Utilities
**File:** Create `tests/utils/api.ts`
**Task:** Export `fetchNarrative()`, `sendChat()` wrappers
**Config:** Use `API_URL` env var with localhost default
**Commit:** `test: add API test utilities`

### Story 5.2: Test Narrative Endpoint Shape
**File:** Create `tests/integration/narrative-api.test.ts`
**Task:** Test /api/narrative returns expected shape
**Checks:** Has journeys, nodes, hubs objects
**Acceptance:** Test passes against running server
**Commit:** `test: add narrative API contract tests`

### Story 5.3: Test Narrative Endpoint Counts
**File:** `tests/integration/narrative-api.test.ts`
**Task:** Test counts match expected
**Checks:** 6 journeys, 24 nodes, 6 hubs
**Acceptance:** Test passes
**Commit:** `test: add narrative count validation`

---

## Epic 6: RAG Orchestration Tests (Priority: Medium)

### Story 6.1: Test Deterministic Hub Loading
**File:** Create `tests/integration/rag-orchestration.test.ts`
**Task:** Test each journey loads correct hub
**Test matrix:**
| Journey | Expected Hub |
|---------|--------------|
| simulation | meta-philosophy |
| stakes | infrastructure-bet |
| ratchet | ratchet-effect |
| diary | diary-system |
| emergence | translation-emergence |
| architecture | technical-architecture |
**Commit:** `test: add deterministic hub loading tests`

### Story 6.2: Test Fallback Behavior
**File:** `tests/integration/rag-orchestration.test.ts`
**Task:** Test fallback to narratives.json when split files missing
**Acceptance:** Graceful degradation
**Commit:** `test: add RAG fallback tests`

---

## Epic 7: E2E Smoke Tests (Priority: Medium)

### Story 7.1: Test Landing Page Loads
**File:** Create `tests/e2e/smoke.spec.ts`
**Task:** Test page loads without console errors
**Acceptance:** No JS errors in console
**Commit:** `test: add landing page e2e test`

### Story 7.2: Test Journey Start
**File:** `tests/e2e/smoke.spec.ts`
**Task:** Test can click journey and see first node
**Acceptance:** Step indicator visible
**Commit:** `test: add journey start e2e test`

### Story 7.3: Test Query Submission
**File:** `tests/e2e/smoke.spec.ts`
**Task:** Test can type query and get response
**Acceptance:** Response appears
**Commit:** `test: add query submission e2e test`

---

## Epic 8: CI Integration (Priority: High)

### Story 8.1: Create GitHub Actions Workflow
**File:** Create `.github/workflows/test.yml`
**Task:** Run tests on every PR and push to main
**Jobs:** unit-tests (fast), e2e-tests (after unit passes)
**Commit:** `ci: add test workflow`

### Story 8.2: Upload Health Report Artifact
**File:** `.github/workflows/test.yml`
**Task:** Generate and upload health report as artifact
**Acceptance:** Report downloadable from CI
**Commit:** `ci: upload health report artifact`

---

## Epic 9: Documentation & Methodology (Priority: Critical)

### Story 9.1: Create Testing Guide
**File:** Create `docs/TESTING.md`
**Task:** Document how to run tests, add tests, debug failures
**Sections:** Running tests, Adding tests, Health check, CI
**Commit:** `docs: add testing guide`

### Story 9.2: Update SKILL.md with Testing Phase
**File:** `SKILL.md` (in project knowledge)
**Task:** Add Phase 9: Testing to sprint methodology
**Content:** Required tests, health check verification
**Commit:** `docs: add testing requirements to sprint methodology`

---

## Commit Sequence

```
1. chore: add vitest and playwright test frameworks
2. chore: create test directory structure
3. chore: configure vitest
4. chore: configure playwright
5. chore: add test scripts to package.json
6. test: add schema loader utility
7. test: add schema parsing tests
8. test: add journey-hub reference validation
9. test: add journey-node reference validation
10. test: add node-journey reference validation
11. test: add node chain reference validation
12. test: add hub path pattern validation
13. test: add journey node count validation
14. test: add node chain traversal validation
15. test: add journey progress calculation
16. test: add health report types
17. test: implement schema health checks
18. test: implement journey health checks
19. test: implement health report formatter
20. feat: add health check CLI
21. test: add API test utilities
22. test: add narrative API contract tests
23. test: add narrative count validation
24. test: add deterministic hub loading tests
25. test: add RAG fallback tests
26. test: add landing page e2e test
27. test: add journey start e2e test
28. test: add query submission e2e test
29. ci: add test workflow
30. ci: upload health report artifact
31. docs: add testing guide
32. docs: add testing requirements to sprint methodology
```

---

## Build Gates

- After Epic 1: `npm test` runs (empty)
- After Epic 2: `npm test` passes schema tests
- After Epic 3: `npm test` passes all unit tests
- After Epic 4: `npm run health` outputs report
- After Epic 5: `npm run test:integration` passes (server required)
- After Epic 7: `npm run test:e2e` passes
- After Epic 8: CI runs on PR

---

## Smoke Test Checklist

- [ ] `npm test` runs in <10 seconds
- [ ] `npm run health` shows formatted report
- [ ] Schema validation catches intentionally broken reference
- [ ] Health report shows failure with IMPACT and INSPECT
- [ ] CI blocks PR with failing test
- [ ] SKILL.md updated with testing phase
