# Specification — Automated Testing Infrastructure

## Overview

Embed automated testing into Grove Terminal to catch bugs before deploy, speed up bug isolation, and enable confident refactoring.

## Goals

1. **Catch schema errors before deploy** — Broken references fail CI, not production
2. **Verify API contracts** — Endpoint changes that break frontend fail immediately
3. **Validate journey navigation** — Node chains and progress counting are correct
4. **Confirm RAG routing** — Hub orchestration works in both modes
5. **Enable rapid bug isolation** — Human-readable health reports show what's broken
6. **Integrate into methodology** — Every future sprint includes test requirements

## Non-Goals

- 100% code coverage (target critical paths only)
- E2E tests for every user flow (too brittle, too slow)
- Performance/load testing (separate concern)
- Testing LLM output quality (mock Gemini, test routing)
- Testing third-party services (Notion, GCS — mock at boundary)

## Success Criteria

After this sprint:

1. `npm test` runs in <30 seconds and catches broken schema references
2. A schema change that breaks journey→hub references fails CI before merge
3. An API endpoint change that removes required fields fails CI
4. Developer can run health check and see human-readable status
5. SKILL.md requires tests for every future sprint

## Acceptance Criteria

### Infrastructure (Must Have)
- [ ] AC-1: Vitest installed and configured
- [ ] AC-2: Playwright installed and configured
- [ ] AC-3: `npm test` runs all unit/integration tests
- [ ] AC-4: `npm run test:e2e` runs browser tests
- [ ] AC-5: `npm run health` generates human-readable report

### Schema Tests (Must Have)
- [ ] AC-6: Test all journey.hubId references resolve
- [ ] AC-7: Test all journey.entryNode references resolve
- [ ] AC-8: Test all node.journeyId references resolve
- [ ] AC-9: Test all node.primaryNext references resolve
- [ ] AC-10: Test hub paths follow standard pattern

### API Tests (Must Have)
- [ ] AC-11: Test `/api/narrative` returns expected shape
- [ ] AC-12: Test `/api/narrative` returns correct counts

### Journey Tests (Must Have)
- [ ] AC-13: Test each journey has expected node count
- [ ] AC-14: Test node chains are traversable (no dead ends)

### Health Report (Must Have)
- [ ] AC-15: `npm run health` outputs human-readable status
- [ ] AC-16: Report shows what's failing and impact
- [ ] AC-17: Report includes inspection routes for failures

### CI Integration (Should Have)
- [ ] AC-18: Tests run on every PR
- [ ] AC-19: CI blocks merge on test failure

### E2E Tests (Nice to Have)
- [ ] AC-20: Landing page loads without errors
- [ ] AC-21: Can start a journey
- [ ] AC-22: Can submit a query

### Documentation (Must Have)
- [ ] AC-23: TESTING.md explains how to run and add tests
- [ ] AC-24: SKILL.md updated to require tests in sprints

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| vitest | Unit/integration tests | ^2.0.0 |
| @vitest/ui | Visual test interface | ^2.0.0 |
| @playwright/test | E2E browser tests | ^1.40.0 |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tests become maintenance burden | Medium | Medium | Focus on critical paths, not coverage % |
| E2E tests are flaky | High | Medium | Limit E2E scope, prefer integration tests |
| CI time grows too long | Low | Medium | Parallelize, cache dependencies |
| Team doesn't write tests | Medium | High | Enforce via SKILL.md and PR review |

## Out of Scope

- Refactoring existing code for testability
- Adding tests for legacy features
- Visual regression testing
- Accessibility testing
- Mobile-specific testing
