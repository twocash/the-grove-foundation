# Execution Prompt — Epic 6.1: React 19 Test Infrastructure Fix

## Context

Epic 6 consumer migrations are blocked by 46 failing React hook tests. The issue is React 19 compatibility: `React.act is not a function` errors occur because Vitest uses Node environment instead of jsdom.

**Blocking:** This must be fixed before any Epic 6 consumer migrations.

## Documentation

Sprint documentation in `docs/sprints/engagement-phase2/epic-6.1-react19-test-fix/`:
- `REPO_AUDIT.md` — Analysis of failing tests and root cause
- `SPEC.md` — Requirements and acceptance criteria  
- `ARCHITECTURE.md` — Test stack before/after diagrams
- `MIGRATION_MAP.md` — Exact file changes with diffs
- `DECISIONS.md` — ADRs 072-075
- `SPRINTS.md` — Task breakdown with full code

## Execution Order

### Phase 1: Update Vitest Config (5 min)

Modify `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@core': path.resolve(__dirname, './src/core'),
      '@surface': path.resolve(__dirname, './src/surface'),
      '@foundation': path.resolve(__dirname, './src/foundation'),
    }
  }
})
```

**Key changes:**
1. `environment: 'jsdom'` (was `'node'`)
2. `setupFiles: ['./tests/setup.ts']` (new)

### Phase 2: Create Setup File (10 min)

Create `tests/setup.ts`:

```typescript
// tests/setup.ts
// Vitest setup file for React 19 compatibility

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage for tests
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

// Mock window.location for URL tests
Object.defineProperty(globalThis, 'location', {
  value: {
    href: 'http://localhost:3000',
    search: '',
    pathname: '/',
  },
  writable: true,
});
```

### Phase 3: Verify Tests Pass (10 min)

Run all tests:
```bash
npm test
```

**Expected results:**
- 152 tests total
- 152 passing
- 0 failing

Previously failing tests that should now pass:
- `engagement-context.test.tsx` — 8 tests
- `use-lens-state.test.ts` — 11 tests  
- `use-journey-state.test.ts` — 15 tests
- `use-entropy-state.test.ts` — 12 tests

**Note:** You may still see deprecation warnings in stderr:
```
`ReactDOMTestUtils.act` is deprecated in favor of `React.act`
```
These are informational only. The tests will pass.

### Phase 4: Verify E2E Unaffected

```bash
npx playwright test
```

Expected: 17 tests passing (no change)

### Phase 5: Health Check

```bash
npm run health
```

Expected: All checks pass

---

## Troubleshooting

### If tests still fail with React.act error

Check that vitest.config.ts has:
1. `environment: 'jsdom'` (not 'node')
2. `setupFiles` array includes `'./tests/setup.ts'`

### If import errors in setup.ts

Ensure packages are installed:
```bash
npm ls @testing-library/react
npm ls @testing-library/jest-dom
```

### If localStorage tests fail

The setup file mock should handle this. Check:
1. Setup file is being loaded (add console.log to verify)
2. No duplicate localStorage definitions in individual tests

---

## Success Criteria

- [ ] vitest.config.ts updated (2 changes)
- [ ] tests/setup.ts created (~35 lines)
- [ ] `npm test` — 152 passing, 0 failing
- [ ] `npx playwright test` — 17 passing
- [ ] `npm run health` — all pass

---

## Forbidden Actions

- Do NOT modify any test files
- Do NOT modify any source code files
- Do NOT change package.json dependencies
- Do NOT touch the engagement hooks or context

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

---

## Next Steps (After This Sprint)

Once all tests pass, return to **Epic 6: Consumer Migration**:
1. Resume at Phase 3: Migrate first consumer (JourneyList.tsx)
2. Continue with remaining 7 consumers
3. Create E2E migration tests
