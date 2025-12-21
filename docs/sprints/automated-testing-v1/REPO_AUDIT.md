# Repository Audit — Automated Testing Infrastructure

## Audit Date: 2025-12-21

## Current State Summary

Grove Terminal has **zero automated tests**. Bug isolation relies entirely on:
- Manual testing in browser
- Production log inspection
- User-reported issues

### Evidence of Testing Gap

The knowledge architecture sprint (2025-12-21) deployed with three bugs that would have been caught by basic tests:

| Bug | Root Cause | Time to Diagnose | Test That Would Catch It |
|-----|------------|------------------|--------------------------|
| Journey showed 1/1 nodes | `nodes.json` not loaded by `loadKnowledgeConfig()` | ~30 min | Schema cross-reference test |
| `/api/narrative` ignored split files | Endpoint still reading only `narratives.json` | ~20 min | API contract test |
| Step counter showed 1/11 | Frontend counting all nodes, not journey nodes | ~10 min | Journey navigation unit test |

**Total debugging time: ~60 minutes** — all preventable with <30 seconds of automated tests.

## File Structure Analysis

### Test-Related Files Found

```
test/                           # Empty directory exists
├── (no files)

scripts/
├── validate-knowledge-schema.js  # Exists but not integrated into CI
├── kb.js                         # CLI tool, no tests

package.json                     # No test scripts defined
```

### package.json Scripts (Current)

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "server": "node server.js"
}
```

**Missing:** `test`, `test:watch`, `test:e2e`, `test:ci`

## Critical Paths Without Coverage

### 1. Knowledge Schema Integrity
- **Files:** `data/exploration/*.json`, `data/knowledge/*.json`
- **Risk:** Broken references cause runtime failures
- **Current validation:** Manual script execution (not automated)

### 2. API Endpoints
- **Files:** `server.js` (1600+ lines)
- **Endpoints:** `/api/narrative`, `/api/chat`, `/api/feedback`
- **Risk:** Response shape changes break frontend
- **Current validation:** None

### 3. Journey Navigation
- **Files:** `data/exploration/journeys.json`, `nodes.json`
- **Logic:** Node chains, step counting, progress tracking
- **Risk:** Dead ends, wrong counts, broken progression
- **Current validation:** Manual browser testing

### 4. RAG Orchestration
- **Files:** `server.js:895-1200`
- **Logic:** Hub routing (deterministic + discovery modes)
- **Risk:** Wrong context loaded, fallback not triggering
- **Current validation:** Log inspection

### 5. Event Flow
- **Files:** Frontend components, analytics integration
- **Events:** journey_started, node_completed, feedback_submitted
- **Risk:** Silent failures, missing analytics
- **Current validation:** None

## Dependencies Analysis

### Current Dev Dependencies
```json
"devDependencies": {
  "@types/node": "^20.10.0",
  "typescript": "^5.3.0",
  "vite": "^5.0.0"
}
```

### Required for Testing
```
vitest              # Fast unit/integration test runner
@vitest/ui          # Visual test interface
@playwright/test    # E2E browser testing
msw                 # API mocking (optional)
```

## CI/CD Analysis

### Current: `.github/workflows/` Contents
(Need to verify — likely minimal or none)

### Required for Test Integration
- Run tests on every PR
- Block merge on test failure
- Run E2E tests on staging deploy

## Risk Assessment

| Area | Current Risk | With Tests |
|------|--------------|------------|
| Schema integrity | High | Low |
| API contracts | High | Low |
| Journey navigation | Medium | Low |
| RAG routing | Medium | Low |
| Event flow | Medium | Low |
| Deployment confidence | Low | High |

## Recommendations

1. **Immediate:** Add Vitest + basic schema tests
2. **Short-term:** API contract tests for critical endpoints
3. **Medium-term:** E2E smoke tests with Playwright
4. **Ongoing:** Require tests for new features (update SKILL.md)

## Files to Create

```
tests/
├── unit/
│   ├── schema.test.ts
│   └── journey-navigation.test.ts
├── integration/
│   ├── narrative-api.test.ts
│   └── rag-orchestration.test.ts
├── e2e/
│   └── smoke.spec.ts
├── fixtures/
│   └── (test data)
└── utils/
    ├── api.ts
    └── health-report.ts    # Human-readable health check

scripts/
└── health-check.js          # CLI health report generator

vitest.config.ts
playwright.config.ts
.github/workflows/test.yml
```

## Conclusion

The repository has no testing infrastructure. The knowledge architecture sprint proved that even small changes can introduce multiple bugs. Adding automated tests is a force multiplier for development velocity and deployment confidence.
