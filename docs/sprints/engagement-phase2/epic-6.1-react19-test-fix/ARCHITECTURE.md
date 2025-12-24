# Architecture — Epic 6.1: React 19 Test Infrastructure Fix

## Current Test Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Test Execution                        │
├─────────────────────────────────────────────────────────┤
│  Vitest                     │  Playwright               │
│  (Unit + Integration)       │  (E2E)                    │
├─────────────────────────────┼───────────────────────────┤
│  environment: node ❌        │  Browser-based ✓          │
│  No setup file             │  Separate config          │
└─────────────────────────────┴───────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              @testing-library/react                      │
├─────────────────────────────────────────────────────────┤
│  render()      │  renderHook()   │  cleanup()           │
│  Uses act() from react-dom/test-utils ❌                 │
│  React 19 moved act to 'react' package                  │
└─────────────────────────────────────────────────────────┘
```

## Target Test Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Test Execution                        │
├─────────────────────────────────────────────────────────┤
│  Vitest                     │  Playwright               │
│  (Unit + Integration)       │  (E2E)                    │
├─────────────────────────────┼───────────────────────────┤
│  environment: jsdom ✓       │  Browser-based ✓          │
│  setupFiles: tests/setup.ts │  Separate config          │
└─────────────────────────────┴───────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   tests/setup.ts                         │
├─────────────────────────────────────────────────────────┤
│  1. Import @testing-library/jest-dom/matchers           │
│  2. Extend expect with matchers                         │
│  3. afterEach cleanup                                   │
│  4. localStorage mock                                   │
│  5. location mock                                       │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              @testing-library/react                      │
├─────────────────────────────────────────────────────────┤
│  jsdom environment provides DOM APIs                    │
│  React 19 act() works correctly                         │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
the-grove-foundation/
├── vitest.config.ts          # Modified: environment + setupFiles
├── tests/
│   ├── setup.ts              # NEW: React 19 compatible setup
│   ├── unit/
│   │   ├── engagement-context.test.tsx   # Will pass
│   │   ├── use-lens-state.test.ts        # Will pass
│   │   ├── use-journey-state.test.ts     # Will pass
│   │   └── use-entropy-state.test.ts     # Will pass
│   └── integration/
│       └── (unchanged)
└── playwright.config.ts      # Unchanged (separate)
```

## Key Technical Details

### Why jsdom is Required
React Testing Library's `render` and `renderHook` need DOM APIs that only jsdom provides in Node:
- `document.createElement`
- `document.body.appendChild`
- Event dispatching

### Why the Act Error Occurs
```javascript
// @testing-library/react internals (v16.x)
const { act } = require('react-dom/test-utils');
// React 19 removed this, moved to:
const { act } = require('react');
```

The jsdom environment and proper setup allows testing-library to handle this correctly.

### Vitest Environment Isolation
Each test file runs in isolation. The jsdom environment doesn't break pure Node tests because:
- They don't import React components
- They don't use render/renderHook
- They only test pure functions/logic
