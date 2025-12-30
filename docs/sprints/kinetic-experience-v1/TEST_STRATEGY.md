# Kinetic Experience v1: Test Strategy

**Sprint:** kinetic-experience-v1
**Date:** December 28, 2025

---

## Testing Philosophy

The Kinetic Stream is an exploration surface where user experience quality matters more than code coverage metrics. Our testing strategy prioritizes:

1. **User journey confidence** — Can users explore successfully?
2. **Visual consistency** — Does the glass system render correctly?
3. **Boundary enforcement** — Are Terminal imports blocked?
4. **Regression prevention** — Do changes break existing flows?

---

## Test Pyramid

```
                    ╭─────────────╮
                    │   E2E (5)   │  ← Critical user journeys
                    ╰──────┬──────╯
               ╭───────────┴───────────╮
               │   Integration (10)    │  ← Component interactions
               ╰───────────┬───────────╯
          ╭────────────────┴────────────────╮
          │        Unit Tests (20)          │  ← Pure logic
          ╰─────────────────────────────────╯
     ╭──────────────────────────────────────────╮
     │        Static Analysis (Always)          │  ← Import rules, types
     ╰──────────────────────────────────────────╯
```

---

## Layer 1: Static Analysis

### TypeScript Compilation

```bash
npx tsc --noEmit
```

**Checks:**
- All types resolve
- No implicit any
- Props interfaces match usage

### ESLint Import Rules

Add to `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/components/Terminal/**', '**/components/Terminal'],
        message: 'Terminal imports are forbidden in KineticStream. Use src/core/ for canonical sources.'
      }]
    }]
  },
  overrides: [{
    files: ['src/surface/components/KineticStream/**/*'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/components/Terminal/**', '**/components/Terminal'],
          message: 'HARD BOUNDARY VIOLATION: KineticStream cannot import from Terminal.'
        }]
      }]
    }
  }]
};
```

### CI Boundary Check

Add to CI pipeline:

```yaml
- name: Check Terminal Import Boundary
  run: |
    if grep -r "from.*components/Terminal" src/surface/components/KineticStream/; then
      echo "::error::Terminal imports detected in KineticStream"
      exit 1
    fi
    echo "Boundary check passed"
```

---

## Layer 2: Unit Tests

### Test Framework

- **Runner:** Vitest (or Jest)
- **Location:** `tests/unit/`
- **Naming:** `{ComponentName}.test.tsx`

### Test Categories

#### A. Pure Logic Tests

**useKineticStream.test.ts**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useKineticStream } from '@/surface/components/KineticStream/hooks/useKineticStream';

describe('useKineticStream', () => {
  it('initializes with empty items', () => {
    const { result } = renderHook(() => useKineticStream());
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('adds query item on submit', async () => {
    const { result } = renderHook(() => useKineticStream());
    
    await act(async () => {
      await result.current.submit('test query');
    });

    expect(result.current.items[0].type).toBe('query');
    expect(result.current.items[0].content).toBe('test query');
  });

  it('attaches pivot context when provided', async () => {
    const { result } = renderHook(() => useKineticStream());
    const pivot = { sourceResponseId: '123', sourceText: 'concept' };
    
    await act(async () => {
      await result.current.submit('concept', pivot);
    });

    expect(result.current.items[0].pivot).toEqual(pivot);
  });

  it('clears all items on clear()', () => {
    const { result } = renderHook(() => useKineticStream());
    
    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toEqual([]);
  });
});
```

**RhetoricRenderer.test.tsx**
```typescript
import { render, screen } from '@testing-library/react';
import { RhetoricRenderer } from '@/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer';

describe('RhetoricRenderer', () => {
  it('renders plain text when no spans', () => {
    render(<RhetoricRenderer content="Hello world" spans={[]} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('injects ConceptSpan at correct positions', () => {
    const spans = [{
      text: 'concept',
      startIndex: 6,
      endIndex: 13,
      type: 'concept' as const
    }];
    
    render(
      <RhetoricRenderer 
        content="Hello concept world" 
        spans={spans} 
      />
    );
    
    expect(screen.getByTestId('concept-span')).toHaveTextContent('concept');
  });

  it('handles multiple spans without overlap', () => {
    const spans = [
      { text: 'first', startIndex: 0, endIndex: 5, type: 'concept' as const },
      { text: 'second', startIndex: 10, endIndex: 16, type: 'concept' as const }
    ];
    
    render(
      <RhetoricRenderer 
        content="first and second" 
        spans={spans} 
      />
    );
    
    const concepts = screen.getAllByTestId('concept-span');
    expect(concepts).toHaveLength(2);
  });
});
```

#### B. Component Render Tests

**QueryObject.test.tsx**
```typescript
import { render, screen } from '@testing-library/react';
import { QueryObject } from '@/surface/components/KineticStream/Stream/blocks/QueryObject';

describe('QueryObject', () => {
  const baseItem = {
    id: '1',
    type: 'query' as const,
    timestamp: Date.now(),
    content: 'Test question',
    role: 'user' as const,
    createdBy: 'user' as const
  };

  it('renders user content', () => {
    render(<QueryObject item={baseItem} />);
    expect(screen.getByText('Test question')).toBeInTheDocument();
  });

  it('shows pivot indicator when pivot context present', () => {
    const itemWithPivot = {
      ...baseItem,
      pivot: { sourceResponseId: '123', sourceText: 'concept' }
    };
    
    render(<QueryObject item={itemWithPivot} />);
    expect(screen.getByText(/Exploring concept/)).toBeInTheDocument();
  });
});
```

**NavigationObject.test.tsx**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationObject } from '@/surface/components/KineticStream/Stream/blocks/NavigationObject';

describe('NavigationObject', () => {
  const mockForks = [
    { id: '1', type: 'deep_dive' as const, label: 'Go deeper' },
    { id: '2', type: 'pivot' as const, label: 'Related topic' },
    { id: '3', type: 'challenge' as const, label: 'Counter-argument' }
  ];

  it('renders all fork buttons', () => {
    render(<NavigationObject forks={mockForks} />);
    
    expect(screen.getByText('Go deeper')).toBeInTheDocument();
    expect(screen.getByText('Related topic')).toBeInTheDocument();
    expect(screen.getByText('Counter-argument')).toBeInTheDocument();
  });

  it('groups forks by type', () => {
    render(<NavigationObject forks={mockForks} />);
    
    const buttons = screen.getAllByTestId('fork-button');
    // deep_dive first, then pivot, then challenge
    expect(buttons[0]).toHaveTextContent('Go deeper');
  });

  it('calls onSelect with fork data on click', () => {
    const onSelect = jest.fn();
    render(<NavigationObject forks={mockForks} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Go deeper'));
    
    expect(onSelect).toHaveBeenCalledWith(mockForks[0]);
  });

  it('returns null when forks array is empty', () => {
    const { container } = render(<NavigationObject forks={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

---

## Layer 3: Integration Tests

### Test Framework

- **Runner:** Vitest with React Testing Library
- **Location:** `tests/integration/`
- **Purpose:** Test component interactions

### Key Integration Tests

**ExploreShell.integration.test.tsx**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExploreShell } from '@/surface/components/KineticStream';

// Mock the chat service
jest.mock('@/services/chatService', () => ({
  sendMessageStream: jest.fn((messages, onChunk) => {
    // Simulate streaming response
    setTimeout(() => onChunk('Hello '), 10);
    setTimeout(() => onChunk('**world**'), 20);
    setTimeout(() => onChunk('!'), 30);
    return Promise.resolve();
  })
}));

describe('ExploreShell Integration', () => {
  it('handles complete chat flow', async () => {
    render(<ExploreShell />);
    
    // Submit query
    const input = screen.getByTestId('command-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input);
    
    // Query appears
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    
    // Response streams in
    await waitFor(() => {
      expect(screen.getByText(/world/)).toBeInTheDocument();
    });
  });

  it('handles concept click pivot', async () => {
    render(<ExploreShell />);
    
    // ... setup with response containing concept
    
    // Click concept
    const concept = screen.getByTestId('concept-span');
    fireEvent.click(concept);
    
    // New query appears with pivot indicator
    await waitFor(() => {
      expect(screen.getByText(/Exploring concept/)).toBeInTheDocument();
    });
  });
});
```

**KineticRenderer.integration.test.tsx**
```typescript
import { render, screen } from '@testing-library/react';
import { KineticRenderer } from '@/surface/components/KineticStream/Stream/KineticRenderer';

describe('KineticRenderer Integration', () => {
  it('routes items to correct block components', () => {
    const items = [
      { id: '1', type: 'query', content: 'Question', ... },
      { id: '2', type: 'response', content: 'Answer', isGenerating: false, ... },
      { id: '3', type: 'system', content: 'System message', ... }
    ];
    
    render(<KineticRenderer items={items} />);
    
    expect(screen.getByTestId('query-object')).toBeInTheDocument();
    expect(screen.getByTestId('response-object')).toBeInTheDocument();
    expect(screen.getByTestId('system-object')).toBeInTheDocument();
  });

  it('renders current streaming item', () => {
    const items = [];
    const currentItem = {
      id: 'streaming',
      type: 'response',
      content: 'Loading...',
      isGenerating: true
    };
    
    render(<KineticRenderer items={items} currentItem={currentItem} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

---

## Layer 4: End-to-End Tests

### Test Framework

- **Runner:** Playwright
- **Location:** `tests/e2e/`
- **Purpose:** Validate user journeys

### Critical User Journeys

**explore-basic.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Explore Basic Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
  });

  test('loads explore page without errors', async ({ page }) => {
    await expect(page.locator('[data-testid="kinetic-renderer"]')).toBeVisible();
    await expect(page.locator('[data-testid="command-input"]')).toBeVisible();
  });

  test('submits query and receives response', async ({ page }) => {
    // Type and submit
    await page.fill('[data-testid="command-input"]', 'What is the Grove?');
    await page.press('[data-testid="command-input"]', 'Enter');
    
    // Query appears
    await expect(page.locator('[data-testid="query-object"]')).toBeVisible();
    await expect(page.locator('[data-testid="query-object"]')).toContainText('What is the Grove?');
    
    // Response appears (may take time)
    await expect(page.locator('[data-testid="response-object"]')).toBeVisible({ timeout: 30000 });
  });

  test('concept click triggers pivot query', async ({ page }) => {
    // Submit initial query
    await page.fill('[data-testid="command-input"]', 'Tell me about distributed AI');
    await page.press('[data-testid="command-input"]', 'Enter');
    
    // Wait for response with concepts
    await page.waitForSelector('[data-testid="concept-span"]', { timeout: 30000 });
    
    // Click first concept
    await page.click('[data-testid="concept-span"]:first-child');
    
    // Verify pivot query appears
    const queries = page.locator('[data-testid="query-object"]');
    await expect(queries).toHaveCount(2);
    await expect(queries.last()).toContainText('Exploring concept');
  });

  test('fork button triggers follow-up', async ({ page }) => {
    // Submit query that should generate forks
    await page.fill('[data-testid="command-input"]', 'Explain the Grove architecture');
    await page.press('[data-testid="command-input"]', 'Enter');
    
    // Wait for navigation forks
    await page.waitForSelector('[data-testid="fork-button"]', { timeout: 30000 });
    
    // Click first fork
    await page.click('[data-testid="fork-button"]:first-child');
    
    // Verify new query submitted
    const queries = page.locator('[data-testid="query-object"]');
    await expect(queries).toHaveCount(2);
  });
});
```

**explore-visual.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Explore Visual Regression', () => {
  test('empty state matches baseline', async ({ page }) => {
    await page.goto('/explore');
    await expect(page).toHaveScreenshot('explore-empty.png');
  });

  test('response with glass styling matches baseline', async ({ page }) => {
    await page.goto('/explore');
    
    // Submit query
    await page.fill('[data-testid="command-input"]', 'Hello');
    await page.press('[data-testid="command-input"]', 'Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="response-object"]', { timeout: 30000 });
    
    // Wait for generation to complete
    await page.waitForFunction(() => {
      const response = document.querySelector('[data-testid="response-object"]');
      return response && !response.querySelector('.animate-pulse');
    });
    
    await expect(page).toHaveScreenshot('explore-response.png', {
      mask: [page.locator('[data-testid="response-object"] p')], // Mask variable content
    });
  });

  test('navigation forks match baseline', async ({ page }) => {
    await page.goto('/explore');
    
    // Inject mock response with forks
    await page.evaluate(() => {
      // Add test response with navigation
    });
    
    await expect(page.locator('[data-testid="navigation-object"]')).toHaveScreenshot('forks.png');
  });
});
```

---

## Layer 5: Accessibility Tests

### Automated A11y Testing

**explore-a11y.spec.ts**
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explore Accessibility', () => {
  test('page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/explore');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('concept spans are keyboard navigable', async ({ page }) => {
    await page.goto('/explore');
    
    // Submit query to get response with concepts
    await page.fill('[data-testid="command-input"]', 'Test');
    await page.press('[data-testid="command-input"]', 'Enter');
    await page.waitForSelector('[data-testid="concept-span"]', { timeout: 30000 });
    
    // Tab to concept
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs
    
    // Verify focus
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('data-testid', 'concept-span');
    
    // Activate with keyboard
    await page.keyboard.press('Enter');
    
    // Verify pivot triggered
    const queries = page.locator('[data-testid="query-object"]');
    await expect(queries).toHaveCount(2);
  });

  test('fork buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/explore');
    
    // ... setup with forks
    
    // Tab to fork button
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('data-testid', 'fork-button');
    
    // Activate with space
    await page.keyboard.press('Space');
    
    // Verify action triggered
  });
});
```

---

## Test Configuration

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
    },
  },
});
```

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Execution

### Local Development

```bash
# Unit tests (fast feedback)
npm test

# Integration tests
npm test -- --grep "integration"

# E2E tests
npx playwright test

# Visual regression
npx playwright test --update-snapshots
```

### CI Pipeline

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npx tsc --noEmit
        
      - name: Boundary check
        run: |
          if grep -r "from.*components/Terminal" src/surface/components/KineticStream/; then
            exit 1
          fi
          
      - name: Unit tests
        run: npm test
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: E2E tests
        run: npx playwright test
        
      - name: Upload test artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Static | 100% pass | No TypeScript errors, no import violations |
| Unit | 80% logic | Core hooks and pure functions |
| Integration | Key flows | Component interactions |
| E2E | Critical paths | User journeys that must work |
| Visual | Baseline | Prevent unintended styling changes |

---

## Test-First Stories

For each story in SPRINTS.md, write tests before implementation:

1. **Story 1.3 (ExploreShell)** — Write ExploreShell.test.tsx first
2. **Story 1.4 (useKineticStream)** — Write hook tests first
3. **Story 2.4 (ResponseObject)** — Write render state tests first
4. **Story 3.4 (Pivot)** — Write integration test first

---

*Test strategy complete. Execute tests continuously during development.*
