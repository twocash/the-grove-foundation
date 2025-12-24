// tests/setup.ts
// Vitest setup file for React 19 compatibility

import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, afterEach } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Clear localStorage between tests (jsdom provides native localStorage)
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});
