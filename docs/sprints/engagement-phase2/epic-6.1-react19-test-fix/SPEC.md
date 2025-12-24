# Specification — Epic 6.1: React 19 Test Infrastructure Fix

## Overview

Fix Vitest configuration and create test setup file for React 19 compatibility. This unblocks 46 failing React hook tests that are preventing Epic 6 consumer migrations.

## Scope

### In Scope
- Update vitest.config.ts for jsdom environment
- Create tests/setup.ts with React 19 compatibility
- Verify all 152 tests pass
- Document the fix in ADR

### Out of Scope
- Component modifications
- Hook modifications
- Consumer migrations (Epic 6)
- New test creation

## Requirements

### R1: Vitest Environment
Vitest must use `jsdom` environment for React component/hook tests.

### R2: React 19 Act Compatibility
Test setup must handle React 19's `act` location change via proper @testing-library/react configuration.

### R3: Test Cleanup
Each test must properly clean up React tree to prevent memory leaks.

### R4: Global Mocks
Setup must provide:
- localStorage mock (already working)
- location mock (already working)
- jest-dom matchers

### R5: No Breaking Changes
All 106 currently passing tests must continue to pass.

## Technical Approach

### Vitest Config Changes
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',           // Changed from 'node'
    setupFiles: ['./tests/setup.ts'], // New
  }
})
```

### Setup File Responsibilities
```typescript
// tests/setup.ts
// 1. Import jest-dom matchers
// 2. Configure cleanup
// 3. Provide global mocks
```

## Acceptance Criteria

- [ ] `npm test` runs 152 tests
- [ ] All 152 tests pass (0 failures)
- [ ] No React.act deprecation warnings in output
- [ ] E2E tests unaffected (17 passing)
- [ ] Health check passes

## Estimated Time

| Task | Duration |
|------|----------|
| Update vitest.config.ts | 5 min |
| Create tests/setup.ts | 10 min |
| Verify all tests pass | 5 min |
| Document in ADR | 5 min |
| **Total** | **25 min** |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| jsdom breaks Node-only tests | Low | Those tests don't import React |
| Version incompatibility | Low | Versions already installed work |
| Side effects on E2E | None | Playwright runs separately |
