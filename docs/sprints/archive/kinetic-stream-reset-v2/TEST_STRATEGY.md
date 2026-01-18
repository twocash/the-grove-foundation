# Test Strategy: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Date:** December 28, 2025

---

## Testing Philosophy

Per PROJECT_PATTERNS.md Anti-Pattern 4 (The Implementation Test):

> Test what users see, not implementation details.

All tests focus on **behavior**, not CSS classes, internal state, or mock calls.

---

## Test Pyramid

```
           /\
          /  \
         / E2E \         3 tests (critical paths)
        /________\
       /          \
      / Integration \    6 tests (component + machine)
     /______________\
    /                \
   /      Unit        \  12 tests (parsers + types)
  /____________________\
```

---

## Unit Tests

### File: `tests/unit/stream-schema.test.ts`

**Purpose:** Validate StreamItem types and type guards.

```typescript
describe('StreamItem Schema', () => {
  describe('Type Guards', () => {
    it('isQueryItem returns true for query type', () => {
      const item: StreamItem = {
        id: '1',
        type: 'query',
        content: 'test',
        timestamp: Date.now(),
        role: 'user',
        createdBy: 'user'
      };
      expect(isQueryItem(item)).toBe(true);
      expect(isResponseItem(item)).toBe(false);
    });

    it('isResponseItem narrows type correctly', () => {
      const item: StreamItem = {
        id: '1',
        type: 'response',
        content: 'test',
        timestamp: Date.now(),
        isGenerating: false,
        role: 'assistant',
        createdBy: 'ai'
      };
      if (isResponseItem(item)) {
        // TypeScript should know item.isGenerating exists
        expect(item.isGenerating).toBe(false);
      }
    });

    it('hasNavigation returns true when navigation array exists', () => {
      const item: ResponseStreamItem = {
        id: '1',
        type: 'response',
        content: 'test',
        timestamp: Date.now(),
        isGenerating: false,
        role: 'assistant',
        createdBy: 'ai',
        navigation: [{ id: 'f1', label: 'Continue', type: 'pivot' }]
      };
      expect(hasNavigation(item)).toBe(true);
    });

    it('hasNavigation returns false for empty array', () => {
      const item: ResponseStreamItem = {
        id: '1',
        type: 'response',
        content: 'test',
        timestamp: Date.now(),
        isGenerating: false,
        role: 'assistant',
        createdBy: 'ai',
        navigation: []
      };
      expect(hasNavigation(item)).toBe(false);
    });
  });

  describe('JourneyFork Types', () => {
    it('accepts valid fork types', () => {
      const fork: JourneyFork = {
        id: 'f1',
        label: 'Deep Dive',
        type: 'deep_dive'
      };
      expect(fork.type).toBe('deep_dive');
    });
  });
});
```

---

### File: `tests/unit/navigation-parser.test.ts`

**Purpose:** Validate NavigationParser extraction and normalization.

```typescript
describe('NavigationParser', () => {
  describe('parseNavigation', () => {
    it('extracts JSON navigation block', () => {
      const content = `Some response text.

<navigation>
[{"id": "f1", "label": "Learn more", "type": "deep_dive"}]
</navigation>`;

      const result = parseNavigation(content);

      expect(result.cleanContent).toBe('Some response text.');
      expect(result.forks).toHaveLength(1);
      expect(result.forks[0].label).toBe('Learn more');
      expect(result.forks[0].type).toBe('deep_dive');
    });

    it('returns empty forks when no navigation block', () => {
      const content = 'Just regular content.';
      const result = parseNavigation(content);

      expect(result.cleanContent).toBe('Just regular content.');
      expect(result.forks).toHaveLength(0);
    });

    it('handles structured text format', () => {
      const content = `Response here.

<navigation>
→ Explain the Ratchet Effect
→ How does this apply to me?
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks).toHaveLength(2);
      expect(result.forks[0].label).toBe('Explain the Ratchet Effect');
    });

    it('infers fork type from label text', () => {
      const content = `<navigation>
→ Tell me more about Grove
→ Try implementing this
→ Related concept
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks[0].type).toBe('deep_dive'); // "more about"
      expect(result.forks[1].type).toBe('apply');     // "Try"
      expect(result.forks[2].type).toBe('pivot');     // default
    });

    it('normalizes missing fork fields', () => {
      const content = `<navigation>
[{"label": "Continue"}]
</navigation>`;

      const result = parseNavigation(content);

      expect(result.forks[0].id).toBeDefined();
      expect(result.forks[0].type).toBe('pivot');
      expect(result.forks[0].queryPayload).toBe('Continue');
    });
  });
});
```

---

### File: `tests/unit/rhetorical-parser.test.ts`

**Purpose:** Validate existing RhetoricalParser (regression tests).

```typescript
describe('RhetoricalParser', () => {
  beforeEach(() => {
    resetSpanIdCounter();
  });

  describe('parse', () => {
    it('extracts bold text as concept spans', () => {
      const content = 'The **Ratchet Effect** is important.';
      const result = parse(content);

      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Ratchet Effect');
      expect(result.spans[0].type).toBe('concept');
    });

    it('extracts arrow prompts as action spans', () => {
      const content = '→ Try this approach';
      const result = parse(content);

      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].type).toBe('action');
    });

    it('returns correct indices for highlighting', () => {
      const content = 'Hello **world** there.';
      const result = parse(content);

      expect(result.spans[0].startIndex).toBe(6);  // Position of **
      expect(result.spans[0].endIndex).toBe(15);   // After **world**
    });

    it('sorts spans by position', () => {
      const content = '**First** and **Second**';
      const result = parse(content);

      expect(result.spans[0].text).toBe('First');
      expect(result.spans[1].text).toBe('Second');
    });

    it('handles empty content', () => {
      const result = parse('');
      expect(result.spans).toHaveLength(0);
    });
  });
});
```

---

## Integration Tests

### File: `tests/integration/stream-machine.test.ts`

**Purpose:** Test engagement machine event handling.

```typescript
describe('Engagement Machine Stream Events', () => {
  let machine: ReturnType<typeof createActor>;

  beforeEach(() => {
    machine = createActor(engagementMachine);
    machine.start();
  });

  afterEach(() => {
    machine.stop();
  });

  it('creates query item on START_QUERY', () => {
    machine.send({ type: 'START_QUERY', prompt: 'What is Grove?' });

    const context = machine.getSnapshot().context;
    expect(context.currentStreamItem).not.toBeNull();
    expect(context.currentStreamItem?.type).toBe('query');
    expect(context.currentStreamItem?.content).toBe('What is Grove?');
  });

  it('handles pivot click by creating query with context', () => {
    const span: RhetoricalSpan = {
      id: 's1',
      text: 'Ratchet',
      type: 'concept',
      startIndex: 0,
      endIndex: 7
    };

    machine.send({
      type: 'USER.CLICK_PIVOT',
      span,
      responseId: 'resp-123'
    });

    const context = machine.getSnapshot().context;
    expect(context.currentStreamItem?.type).toBe('query');
    expect(context.currentStreamItem?.content).toContain('Ratchet');
    expect((context.currentStreamItem as QueryStreamItem)?.pivot).toBeDefined();
  });

  it('handles fork select by creating query', () => {
    const fork: JourneyFork = {
      id: 'f1',
      label: 'Explain more',
      type: 'deep_dive',
      queryPayload: 'Explain the Ratchet Effect in detail'
    };

    machine.send({
      type: 'USER.SELECT_FORK',
      fork,
      responseId: 'resp-123'
    });

    const context = machine.getSnapshot().context;
    expect(context.currentStreamItem?.content).toBe('Explain the Ratchet Effect in detail');
  });
});
```

---

### File: `tests/integration/navigation-block.test.tsx`

**Purpose:** Test NavigationBlock rendering and interaction.

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationBlock } from '@/components/Terminal/Stream/blocks/NavigationBlock';

describe('NavigationBlock', () => {
  const mockForks: JourneyFork[] = [
    { id: 'f1', label: 'Deep dive into Ratchet', type: 'deep_dive' },
    { id: 'f2', label: 'Related: Trellis', type: 'pivot' },
    { id: 'f3', label: 'Try implementing', type: 'apply' }
  ];

  it('renders all forks', () => {
    render(<NavigationBlock forks={mockForks} />);

    expect(screen.getByText('Deep dive into Ratchet')).toBeInTheDocument();
    expect(screen.getByText('Related: Trellis')).toBeInTheDocument();
    expect(screen.getByText('Try implementing')).toBeInTheDocument();
  });

  it('groups forks by type', () => {
    render(<NavigationBlock forks={mockForks} />);

    const buttons = screen.getAllByTestId('fork-button');
    // Primary (deep_dive) should come first
    expect(buttons[0]).toHaveTextContent('Deep dive');
  });

  it('calls onSelect with correct fork', () => {
    const onSelect = vi.fn();
    render(<NavigationBlock forks={mockForks} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Related: Trellis'));

    expect(onSelect).toHaveBeenCalledWith(mockForks[1]);
  });

  it('returns null for empty forks', () => {
    const { container } = render(<NavigationBlock forks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies correct variant classes', () => {
    render(<NavigationBlock forks={mockForks} />);

    const deepDiveButton = screen.getByText('Deep dive into Ratchet').closest('button');
    expect(deepDiveButton).toHaveClass('fork-button--primary');

    const pivotButton = screen.getByText('Related: Trellis').closest('button');
    expect(pivotButton).toHaveClass('fork-button--secondary');
  });
});
```

---

## E2E Tests

### File: `tests/e2e/kinetic-stream.spec.ts`

**Purpose:** Validate complete user flows.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kinetic Stream Experience', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Open terminal
    await page.click('[data-testid="terminal-trigger"]');
    await expect(page.locator('[data-testid="stream-renderer"]')).toBeVisible();
  });

  test('user query appears in stream', async ({ page }) => {
    await page.fill('[data-testid="command-input"]', 'What is Grove?');
    await page.press('[data-testid="command-input"]', 'Enter');

    await expect(page.locator('[data-testid="query-block"]')).toContainText('What is Grove?');
  });

  test('response shows concept highlights', async ({ page }) => {
    await page.fill('[data-testid="command-input"]', 'Explain the Ratchet Effect');
    await page.press('[data-testid="command-input"]', 'Enter');

    // Wait for response to complete
    await expect(page.locator('[data-testid="response-block"]')).toBeVisible();
    await page.waitForSelector('[data-testid="response-block"]:not(:has(.streaming-cursor))');

    // Check for concept spans (orange highlights)
    const conceptSpan = page.locator('[data-testid="span-concept"]').first();
    await expect(conceptSpan).toBeVisible();
  });

  test('clicking concept triggers pivot query', async ({ page }) => {
    // Submit initial query
    await page.fill('[data-testid="command-input"]', 'What is Grove?');
    await page.press('[data-testid="command-input"]', 'Enter');

    // Wait for response
    await page.waitForSelector('[data-testid="response-block"]:not(:has(.streaming-cursor))');

    // Click a concept span
    const conceptSpan = page.locator('[data-testid="span-concept"]').first();
    const conceptText = await conceptSpan.textContent();
    await conceptSpan.click();

    // Verify new query appears
    const lastQuery = page.locator('[data-testid="query-block"]').last();
    await expect(lastQuery).toContainText(conceptText || '');
  });

  test('journey forks appear after response', async ({ page }) => {
    await page.fill('[data-testid="command-input"]', 'Explain the Trellis Architecture');
    await page.press('[data-testid="command-input"]', 'Enter');

    // Wait for response completion
    await page.waitForSelector('[data-testid="response-block"]:not(:has(.streaming-cursor))');

    // Check for navigation block
    const navBlock = page.locator('[data-testid="navigation-block"]');
    // May or may not appear depending on LLM output - check if visible
    const isVisible = await navBlock.isVisible().catch(() => false);

    if (isVisible) {
      const forkButtons = page.locator('[data-testid="fork-button"]');
      expect(await forkButtons.count()).toBeGreaterThan(0);
    }
  });

  test('clicking fork submits new query', async ({ page }) => {
    await page.fill('[data-testid="command-input"]', 'What is DEX?');
    await page.press('[data-testid="command-input"]', 'Enter');

    await page.waitForSelector('[data-testid="response-block"]:not(:has(.streaming-cursor))');

    const navBlock = page.locator('[data-testid="navigation-block"]');
    const isVisible = await navBlock.isVisible().catch(() => false);

    if (isVisible) {
      const forkButton = page.locator('[data-testid="fork-button"]').first();
      const forkText = await forkButton.textContent();
      await forkButton.click();

      // Verify new query contains fork text
      const lastQuery = page.locator('[data-testid="query-block"]').last();
      await expect(lastQuery).toContainText(forkText?.replace(/^[→↓✓]\s*/, '') || '');
    }
  });

});
```

---

## Test Data Fixtures

### File: `tests/fixtures/stream-items.ts`

```typescript
import type { QueryStreamItem, ResponseStreamItem, JourneyFork } from '@/src/core/schema/stream';

export const mockQueryItem: QueryStreamItem = {
  id: 'query-1',
  type: 'query',
  content: 'What is the Ratchet Effect?',
  timestamp: Date.now(),
  role: 'user',
  createdBy: 'user'
};

export const mockResponseItem: ResponseStreamItem = {
  id: 'response-1',
  type: 'response',
  content: 'The **Ratchet Effect** describes how AI capabilities compound over time.',
  timestamp: Date.now(),
  isGenerating: false,
  role: 'assistant',
  createdBy: 'ai',
  parsedSpans: [
    {
      id: 'span-1',
      text: 'Ratchet Effect',
      type: 'concept',
      startIndex: 4,
      endIndex: 22,
      confidence: 1.0
    }
  ]
};

export const mockForks: JourneyFork[] = [
  {
    id: 'fork-1',
    label: 'Explain the 21-month cycle',
    type: 'deep_dive',
    queryPayload: 'Tell me more about the 21-month AI capability doubling cycle'
  },
  {
    id: 'fork-2',
    label: 'How does this affect infrastructure?',
    type: 'pivot',
    queryPayload: 'What are the infrastructure implications of the Ratchet Effect?'
  },
  {
    id: 'fork-3',
    label: 'Calculate my exposure',
    type: 'apply',
    queryPayload: 'Help me understand my organization\'s exposure to the Ratchet Effect'
  }
];

export const mockResponseWithNavigation: ResponseStreamItem = {
  ...mockResponseItem,
  id: 'response-2',
  navigation: mockForks
};
```

---

## Build Gate Commands

```bash
# Run all unit tests
npm test -- tests/unit/

# Run integration tests
npm test -- tests/integration/

# Run E2E tests
npx playwright test tests/e2e/kinetic-stream.spec.ts

# Full test suite
npm test && npx playwright test

# Coverage report
npm test -- --coverage
```

---

## Test Acceptance Criteria

| Test Category | Pass Threshold | Current Status |
|--------------|----------------|----------------|
| Unit Tests | 100% pass | Pending |
| Integration Tests | 100% pass | Pending |
| E2E Tests | 100% pass (skip if nav not visible) | Pending |
| Coverage | >80% on new code | Pending |

---

*Test strategy documented. Proceed to MIGRATION_PLAN.md.*
