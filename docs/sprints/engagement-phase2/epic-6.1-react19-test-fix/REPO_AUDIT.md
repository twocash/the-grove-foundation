# Repository Audit — Epic 6.1: React 19 Test Infrastructure Fix

## Problem Statement

Epic 6 consumer migrations are blocked by 46 failing React hook tests. All failures show:
```
TypeError: React.act is not a function
```

Root cause: React 19 moved `act` from `react-dom/test-utils` to `react` package, but `@testing-library/react` uses the deprecated import path.

## Current State

### Package Versions
```json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "@testing-library/react": "^16.3.1",
  "vitest": "^4.0.16",
  "jsdom": "^27.3.0"
}
```

### Test Results (Pre-Fix)
- **Total tests:** 152
- **Passing:** 106
- **Failing:** 46

### Failing Test Files
| File | Tests | Issue |
|------|-------|-------|
| engagement-context.test.tsx | 8 | React.act not a function |
| use-lens-state.test.ts | 11 | React.act not a function |
| use-journey-state.test.ts | 15 | React.act not a function |
| use-entropy-state.test.ts | 12 | React.act not a function |

### Passing Test Files
| File | Tests | Type |
|------|-------|------|
| health-config.test.ts | 15 | Pure Node |
| journey-navigation.test.ts | 15 | Pure logic |
| schema.test.ts | 11 | Pure validation |
| engagement-machine.test.ts | 24 | XState machine |
| persistence.test.ts | 16 | localStorage mock |
| health-api.test.ts | 17 | Integration |
| narrative-api.test.ts | 7 | Integration |

## Root Cause Analysis

### Issue 1: Wrong Test Environment
```typescript
// vitest.config.ts (current)
export default defineConfig({
  test: {
    environment: 'node',  // ❌ React needs jsdom
  }
})
```

### Issue 2: React 19 Breaking Change
React 19 deprecated `ReactDOMTestUtils.act` in favor of `React.act`:
```javascript
// Old (React 18) - in @testing-library/react internals
import { act } from 'react-dom/test-utils';

// New (React 19) - required
import { act } from 'react';
```

### Issue 3: No Setup File
No centralized test setup for:
- React 19 act polyfill
- jsdom matchers
- Global cleanup
- localStorage mock

## Files Requiring Modification

### Primary
1. `vitest.config.ts` — Change environment to jsdom, add setup file
2. `tests/setup.ts` — Create React 19 compatible setup (NEW)

### Secondary (May Need Updates)
3. `package.json` — Version check only (no changes expected)

## Blocking Relationship

```
Epic 6.1 (This) → Epic 6 Consumer Migration → Epic 7+ Future Work
     │
     └── All React hook tests must pass before component migrations
```

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Total tests | 152 | 152 |
| Passing | 106 | 152 |
| Failing | 46 | 0 |
| React hook tests | 46 failing | 46 passing |
