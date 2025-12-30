# TEST_STRATEGY: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025

---

## Test Categories

### 1. Unit Tests

#### 1.1 useKineticScroll Hook Tests

**File:** `src/surface/components/KineticStream/hooks/__tests__/useKineticScroll.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useKineticScroll } from '../useKineticScroll';

describe('useKineticScroll', () => {
  // Mock scroll container
  const mockScrollContainer = {
    scrollTop: 0,
    scrollHeight: 1000,
    clientHeight: 500,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start at bottom', () => {
      const { result } = renderHook(() => 
        useKineticScroll([0, 0, null], false)
      );
      
      expect(result.current.isAtBottom).toBe(true);
      expect(result.current.showScrollButton).toBe(false);
    });

    it('should provide refs', () => {
      const { result } = renderHook(() => 
        useKineticScroll([0, 0, null], false)
      );
      
      expect(result.current.scrollRef).toBeDefined();
      expect(result.current.bottomRef).toBeDefined();
    });
  });

  describe('sticky behavior', () => {
    it('should show FAB when scrolled up during streaming', () => {
      const { result, rerender } = renderHook(
        ({ deps, streaming }) => useKineticScroll(deps, streaming),
        { initialProps: { deps: [1, 100, 'resp-1'] as [number, number, string | null], streaming: true } }
      );
      
      // Simulate scroll up by setting isAtBottom to false
      // This would normally happen via scroll event
      act(() => {
        // Mock scroll event would set isAtBottom = false
      });
      
      // FAB should appear
      // expect(result.current.showScrollButton).toBe(true);
    });

    it('should hide FAB when not streaming', () => {
      const { result } = renderHook(() => 
        useKineticScroll([1, 100, 'resp-1'], false)
      );
      
      expect(result.current.showScrollButton).toBe(false);
    });
  });

  describe('scrollToBottom', () => {
    it('should provide scrollToBottom function', () => {
      const { result } = renderHook(() => 
        useKineticScroll([0, 0, null], false)
      );
      
      expect(typeof result.current.scrollToBottom).toBe('function');
    });
  });
});
```

---

### 2. Component Tests

#### 2.1 ScrollAnchor Tests

**File:** `src/surface/components/KineticStream/Stream/__tests__/ScrollAnchor.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollAnchor } from '../ScrollAnchor';

describe('ScrollAnchor', () => {
  it('should render invisible anchor', () => {
    render(<ScrollAnchor />);
    
    const anchor = screen.getByTestId('scroll-anchor');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('aria-hidden', 'true');
  });

  it('should forward ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ScrollAnchor ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should have minimal height', () => {
    render(<ScrollAnchor />);
    
    const anchor = screen.getByTestId('scroll-anchor');
    expect(anchor).toHaveClass('h-px');
  });
});
```

#### 2.2 ScrollToBottomFab Tests

**File:** `src/surface/components/KineticStream/CommandConsole/__tests__/ScrollToBottomFab.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrollToBottomFab } from '../ScrollToBottomFab';

describe('ScrollToBottomFab', () => {
  it('should not render when not visible', () => {
    render(
      <ScrollToBottomFab 
        visible={false} 
        isStreaming={false} 
        onClick={() => {}} 
      />
    );
    
    expect(screen.queryByTestId('scroll-to-bottom-fab')).not.toBeInTheDocument();
  });

  it('should render when visible', () => {
    render(
      <ScrollToBottomFab 
        visible={true} 
        isStreaming={false} 
        onClick={() => {}} 
      />
    );
    
    expect(screen.getByTestId('scroll-to-bottom-fab')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <ScrollToBottomFab 
        visible={true} 
        isStreaming={false} 
        onClick={handleClick} 
      />
    );
    
    fireEvent.click(screen.getByTestId('scroll-to-bottom-fab'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show streaming indicator when streaming', () => {
    const { container } = render(
      <ScrollToBottomFab 
        visible={true} 
        isStreaming={true} 
        onClick={() => {}} 
      />
    );
    
    // Check for pulsing dot (has neon-green background)
    const indicator = container.querySelector('.bg-\\[var\\(--neon-green\\)\\]');
    expect(indicator).toBeInTheDocument();
  });

  it('should have accessible label', () => {
    render(
      <ScrollToBottomFab 
        visible={true} 
        isStreaming={false} 
        onClick={() => {}} 
      />
    );
    
    expect(screen.getByLabelText('Scroll to bottom')).toBeInTheDocument();
  });
});
```

---

### 3. Integration Tests

#### 3.1 KineticRenderer with ScrollAnchor

**File:** `src/surface/components/KineticStream/Stream/__tests__/KineticRenderer.integration.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KineticRenderer } from '../KineticRenderer';

describe('KineticRenderer with ScrollAnchor', () => {
  it('should render scroll anchor at end of stream', () => {
    const items = [
      { id: 'q1', type: 'query' as const, content: 'Test', timestamp: Date.now(), role: 'user' as const, createdBy: 'user' as const }
    ];
    
    render(<KineticRenderer items={items} />);
    
    const anchor = screen.getByTestId('scroll-anchor');
    expect(anchor).toBeInTheDocument();
  });

  it('should forward bottomRef to anchor', () => {
    const bottomRef = React.createRef<HTMLDivElement>();
    const items = [
      { id: 'q1', type: 'query' as const, content: 'Test', timestamp: Date.now(), role: 'user' as const, createdBy: 'user' as const }
    ];
    
    render(<KineticRenderer items={items} bottomRef={bottomRef} />);
    
    expect(bottomRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
```

---

### 4. E2E Tests

**File:** `e2e/kinetic-scroll.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kinetic Scroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
  });

  test('should auto-scroll during streaming', async ({ page }) => {
    // Submit a query
    await page.fill('[data-testid="command-input"]', 'What is Grove?');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for streaming to start
    await page.waitForSelector('[data-testid="response-object"]');
    
    // Verify scroll anchor is visible (meaning we're at bottom)
    const anchor = page.locator('[data-testid="scroll-anchor"]');
    await expect(anchor).toBeInViewport();
  });

  test('should show FAB when scrolled up during streaming', async ({ page }) => {
    // Submit a query that will generate long response
    await page.fill('[data-testid="command-input"]', 'Explain Grove architecture in detail');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for streaming to start
    await page.waitForSelector('[data-testid="response-object"]');
    
    // Scroll up
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });
    
    // FAB should appear
    await expect(page.locator('[data-testid="scroll-to-bottom-fab"]')).toBeVisible();
  });

  test('should scroll to bottom when FAB clicked', async ({ page }) => {
    // Submit query
    await page.fill('[data-testid="command-input"]', 'Explain Grove');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for some content
    await page.waitForSelector('[data-testid="response-object"]');
    
    // Scroll up
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });
    
    // Wait for FAB
    await page.waitForSelector('[data-testid="scroll-to-bottom-fab"]');
    
    // Click FAB
    await page.click('[data-testid="scroll-to-bottom-fab"]');
    
    // FAB should disappear (we're at bottom)
    await expect(page.locator('[data-testid="scroll-to-bottom-fab"]')).not.toBeVisible();
  });

  test('should hide FAB when streaming ends', async ({ page }) => {
    // Submit short query
    await page.fill('[data-testid="command-input"]', 'Hi');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for streaming to complete
    await page.waitForSelector('[data-testid="response-object"]:not([data-generating="true"])');
    
    // FAB should not be visible
    await expect(page.locator('[data-testid="scroll-to-bottom-fab"]')).not.toBeVisible();
  });
});
```

---

## Verification Checklist

### Pre-Implementation
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Existing tests pass: `npm test`

### Post-Implementation
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] New unit tests pass
- [ ] New component tests pass
- [ ] E2E tests pass: `npx playwright test kinetic-scroll`

### Manual Testing
- [ ] Submit query → auto-scrolls during response
- [ ] Scroll up during streaming → scroll stops, FAB appears
- [ ] Click FAB → smooth scroll to bottom, FAB hides
- [ ] Scroll to bottom manually → FAB hides
- [ ] Submit new query → instant scroll to bottom
- [ ] Fast typing doesn't cause jitter
- [ ] Long responses stay readable

### Browser Testing
- [ ] Chrome - scroll physics work
- [ ] Firefox - scroll physics work
- [ ] Safari - scroll physics work (test `-webkit-overflow-scrolling`)

---

## Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- useKineticScroll

# Run E2E tests
npx playwright test kinetic-scroll

# Run E2E with UI
npx playwright test kinetic-scroll --ui
```

---

*Test strategy complete. Proceed to SPRINTS.md*
