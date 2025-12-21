# Architectural Decision Records — Automated Testing

## ADR-001: Test Framework Selection

### Status
Accepted

### Context
Grove Terminal needs a test framework that:
- Runs fast (developer experience)
- Integrates with Vite (existing build tool)
- Supports TypeScript natively
- Has good ecosystem

### Options Considered
1. **Jest** — Industry standard, slower, requires config for ESM
2. **Vitest** — Vite-native, fast, compatible Jest API
3. **Node test runner** — Built-in, minimal features

### Decision
Use **Vitest** for unit/integration tests.

### Rationale
- Native Vite integration (Grove already uses Vite)
- Jest-compatible API (familiar patterns)
- Fast startup and watch mode
- Built-in TypeScript support

### Consequences
- Must use Vitest-specific features carefully for portability
- Team needs to learn Vitest if unfamiliar

---

## ADR-002: E2E Framework Selection

### Status
Accepted

### Context
Need browser testing for critical user paths.

### Options Considered
1. **Playwright** — Modern, reliable, multi-browser
2. **Cypress** — Popular, good DX, slower
3. **Puppeteer** — Chrome-only, lower-level

### Decision
Use **Playwright** for E2E tests.

### Rationale
- Cross-browser support
- Fast and reliable
- Built-in trace recording for debugging
- Better CI support than Cypress

### Consequences
- Larger install size (~400MB with browsers)
- Different API than Cypress (if team has Cypress experience)

---

## ADR-003: Test Scope Philosophy

### Status
Accepted

### Context
Testing can become a maintenance burden. Need to define what we test.

### Decision
**Test critical paths, not coverage percentage.**

Priority order:
1. Schema integrity (prevents runtime crashes)
2. API contracts (prevents frontend breaks)
3. Journey navigation (core user experience)
4. RAG orchestration (core functionality)
5. E2E smoke tests (sanity check)

### Rationale
- 80/20 rule: 20% of tests catch 80% of bugs
- The knowledge architecture sprint bugs were all in these categories
- Comprehensive testing of edge cases has diminishing returns

### Consequences
- Some bugs will not be caught by tests
- Focus on high-impact failures
- Accept that manual testing still required for UX nuance

---

## ADR-004: Health Report as First-Class Feature

### Status
Accepted

### Context
Test failures need to be actionable. "Test failed" is not enough.

### Decision
Create a **human-readable health report** that shows:
1. What's failing
2. Impact of failure
3. How to investigate (commands, file locations)
4. Suggested fixes

### Rationale
- Developers need context to fix issues fast
- Non-developers (Jim) need to understand system status
- CI artifacts should be self-documenting

### Implementation
- `npm run health` generates console report
- `npm run health -- --json` for CI integration
- Report includes INSPECT commands and FILE references

### Consequences
- Additional code to maintain (health report generator)
- Must keep report in sync with tests
- Worth it for bug isolation speed

---

## ADR-005: Integration into Sprint Methodology

### Status
Accepted

### Context
Testing only helps if it's consistent. One-time test suites decay.

### Decision
**Update SKILL.md** to require:
1. Tests for new features (acceptance criteria include test coverage)
2. Health check passes before deploy
3. CI blocks merge on test failure

### Rationale
- Process enforcement > hoping developers write tests
- Makes testing a first-class development activity
- Prevents regression in test coverage

### Implementation
Add to SKILL.md:
- "Phase 9: Testing" in every sprint template
- Test acceptance criteria in SPEC template
- Health check verification in smoke test checklist

### Consequences
- Sprints take slightly longer (test writing)
- Much faster debugging when issues arise
- Higher deployment confidence

---

## ADR-006: No Mocking of LLM Responses

### Status
Accepted

### Context
RAG orchestration involves Gemini API calls. Should we mock them?

### Decision
**Do not mock LLM responses.** Test routing logic, not output quality.

### Rationale
- LLM output is non-deterministic
- Testing "does hub X get loaded" is deterministic
- Testing "is the response good" is subjective
- Mock at the routing layer, not the API layer

### Implementation
```typescript
// Test this (deterministic):
expect(getHubForJourney('ratchet')).toBe('ratchet-effect')

// Not this (non-deterministic):
expect(response.text).toContain('7-month doubling')
```

### Consequences
- Cannot test response quality automatically
- Must rely on human review for content quality
- Keep test suite fast and reliable

---

## ADR-007: Separate Unit and Integration Test Runs

### Status
Accepted

### Context
Integration tests require server running. Unit tests don't.

### Decision
- `npm test` — Runs unit tests only (fast, no server)
- `npm run test:integration` — Runs integration tests (needs server)
- `npm run test:all` — Runs everything

### Rationale
- Developers can run unit tests constantly (fast feedback)
- Integration tests run in CI or before deploy
- Clear separation of concerns

### Consequences
- Must ensure both are run before deploy
- CI runs both
- Local development primarily uses unit tests
