# Sprint Tasks — Epic 6.1: React 19 Test Infrastructure Fix

## Sprint Overview

| Metric | Value |
|--------|-------|
| Total Duration | 25 minutes |
| Epics | 3 |
| Files Created | 1 |
| Files Modified | 1 |
| Tests Fixed | 46 |

---

## Epic 1: Vitest Configuration Update

### Story 1.1: Change Environment to jsdom

**Task:** Modify `vitest.config.ts` line 7: `environment: 'node'` → `environment: 'jsdom'`

**Tests:**
- Verify: `npx vitest --version` runs without config errors

### Story 1.2: Add Setup File Reference

**Task:** Add `setupFiles: ['./tests/setup.ts']` to test config block

**Tests:**
- Verify: Config parses correctly (no syntax errors)

### Build Gate
```bash
npx vitest --version   # Config valid
```

---

## Epic 2: Setup File Creation

### Story 2.1: Create Base Setup File

**Task:** Create `tests/setup.ts` with imports and matchers

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

**Tests:**
- Verify: `npx tsc tests/setup.ts --noEmit --skipLibCheck`

### Story 2.2: Add localStorage Mock

**Task:** Add localStorage mock to setup file

```typescript
const localStorageMock = {
  getItem: (key: string) => localStorageMock.store[key] || null,
  setItem: (key: string, value: string) => { localStorageMock.store[key] = value; },
  removeItem: (key: string) => { delete localStorageMock.store[key]; },
  clear: () => { localStorageMock.store = {}; },
  store: {} as Record<string, string>,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});
```

**Tests:**
- Verify: persistence.test.ts continues to pass

### Story 2.3: Add Location Mock

**Task:** Add window.location mock to setup file

```typescript
Object.defineProperty(globalThis, 'location', {
  value: {
    href: 'http://localhost:3000',
    search: '',
    pathname: '/',
  },
  writable: true,
});
```

**Tests:**
- Verify: URL-dependent tests pass

### Build Gate
```bash
npx tsc tests/setup.ts --noEmit --skipLibCheck  # Types valid
```

---

## Epic 3: Test Verification

### Story 3.1: Run All Unit Tests

**Task:** Execute full test suite

```bash
npm test
```

**Tests:**
- [ ] engagement-context.test.tsx — 8 tests pass
- [ ] use-lens-state.test.ts — 11 tests pass
- [ ] use-journey-state.test.ts — 15 tests pass
- [ ] use-entropy-state.test.ts — 12 tests pass
- [ ] All other tests — no regressions

**Expected:** 152 passing, 0 failing

### Story 3.2: Verify E2E Unaffected

**Task:** Run Playwright tests

```bash
npx playwright test
```

**Tests:**
- [ ] 17 E2E tests pass (no change from before)

### Story 3.3: Verify Health Check

**Task:** Run health system

```bash
npm run health
```

**Tests:**
- [ ] All health checks pass

### Build Gate
```bash
npm test                # 152 passing
npx playwright test     # 17 passing
npm run health          # All pass
```

---

## Final Verification

### All Build Gates Pass
```bash
npm run build           # Compiles
npm test                # Unit tests pass (152)
npx playwright test     # E2E tests pass (17)
npm run health          # Health check passes
```

### Success Checklist

- [ ] vitest.config.ts has `environment: 'jsdom'`
- [ ] vitest.config.ts has `setupFiles: ['./tests/setup.ts']`
- [ ] tests/setup.ts exists with all mocks
- [ ] 152 unit tests passing
- [ ] 17 E2E tests passing
- [ ] Health check passing

---

## Commit Message

```
fix(tests): React 19 compatibility for Vitest

- Change vitest environment from node to jsdom
- Create tests/setup.ts with jest-dom matchers
- Add localStorage and location mocks to setup
- All 152 tests now pass

Fixes React.act deprecation errors blocking Epic 6.
ADR-072 through ADR-075
```
