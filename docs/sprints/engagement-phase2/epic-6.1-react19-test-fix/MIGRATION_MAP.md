# Migration Map — Epic 6.1: React 19 Test Infrastructure Fix

## File Changes Overview

| File | Action | Lines Changed |
|------|--------|---------------|
| vitest.config.ts | MODIFY | ~10 lines changed |
| tests/setup.ts | CREATE | ~35 lines new |

## Detailed Changes

### 1. vitest.config.ts

**Location:** `C:\GitHub\the-grove-foundation\vitest.config.ts`

**Before:**
```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
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

**After:**
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

**Changes:**
1. Line 7: `environment: 'node'` → `environment: 'jsdom'`
2. Line 10: Add `setupFiles: ['./tests/setup.ts'],`

---

### 2. tests/setup.ts (NEW)

**Location:** `C:\GitHub\the-grove-foundation\tests\setup.ts`

**Content:**
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

---

## Rollback Plan

If tests still fail after changes:

1. Restore vitest.config.ts:
```bash
git checkout vitest.config.ts
```

2. Remove setup file:
```bash
rm tests/setup.ts
```

3. Investigate @testing-library/react version upgrade

---

## Verification Commands

```bash
# Run all tests
npm test

# Run specific failing tests
npx vitest run tests/unit/engagement-context.test.tsx
npx vitest run tests/unit/use-lens-state.test.ts
npx vitest run tests/unit/use-journey-state.test.ts
npx vitest run tests/unit/use-entropy-state.test.ts

# Verify E2E unaffected
npx playwright test
```
