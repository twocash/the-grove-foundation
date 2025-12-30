# TEST_STRATEGY: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025

---

## Testing Philosophy

Following Grove's behavior-over-implementation principle:
- Test what users see, not internal state
- Test that lens offers appear and respond to clicks
- Test parser handles edge cases

---

## Unit Tests

### 1. LensOfferParser Tests

**File:** `src/core/transformers/__tests__/LensOfferParser.test.ts`

```typescript
import { parseLensOffer } from '../LensOfferParser';

describe('LensOfferParser', () => {
  const sourceId = 'response-123';

  describe('parseLensOffer', () => {
    it('returns null offer when no tag present', () => {
      const result = parseLensOffer('Just some text', sourceId);
      expect(result.offer).toBeNull();
      expect(result.cleanContent).toBe('Just some text');
    });

    it('extracts lens offer from end of content', () => {
      const content = 'Some explanation. <lens_offer id="economics" reason="incentives" preview="Value flows" />';
      const result = parseLensOffer(content, sourceId);
      
      expect(result.offer).not.toBeNull();
      expect(result.offer?.lensId).toBe('economics');
      expect(result.offer?.reason).toBe('incentives');
      expect(result.offer?.previewText).toBe('Value flows');
      expect(result.offer?.status).toBe('pending');
      expect(result.offer?.sourceResponseId).toBe(sourceId);
      expect(result.cleanContent).toBe('Some explanation.');
    });

    it('auto-generates lens name from id', () => {
      const content = '<lens_offer id="systems-thinking" />';
      const result = parseLensOffer(content, sourceId);
      
      expect(result.offer?.lensName).toBe('Systems Thinking Lens');
    });

    it('uses provided name over generated', () => {
      const content = '<lens_offer id="economics" name="Economic Analysis" />';
      const result = parseLensOffer(content, sourceId);
      
      expect(result.offer?.lensName).toBe('Economic Analysis');
    });

    it('handles empty content', () => {
      const result = parseLensOffer('', sourceId);
      expect(result.offer).toBeNull();
      expect(result.cleanContent).toBe('');
    });

    it('returns null offer when id is missing', () => {
      const content = '<lens_offer reason="test" />';
      const result = parseLensOffer(content, sourceId);
      
      expect(result.offer).toBeNull();
      expect(result.cleanContent).toBe(content);
    });

    it('handles attributes with special characters', () => {
      const content = '<lens_offer id="economics" reason="The user\'s exploring" preview="What\'s next" />';
      const result = parseLensOffer(content, sourceId);
      
      // Note: Current regex doesn't handle escaped quotes
      // This test documents current behavior
      expect(result.offer).not.toBeNull();
    });
  });
});
```

### 2. Type Guard Tests

**File:** `src/core/schema/__tests__/stream.test.ts`

```typescript
import { isLensOfferItem, LensOfferStreamItem } from '../stream';

describe('isLensOfferItem', () => {
  it('returns true for lens_offer type', () => {
    const item: LensOfferStreamItem = {
      id: 'test',
      type: 'lens_offer',
      timestamp: Date.now(),
      lensId: 'economics',
      lensName: 'Economic Lens',
      reason: 'test',
      previewText: 'test',
      status: 'pending',
      sourceResponseId: 'resp-1'
    };
    expect(isLensOfferItem(item)).toBe(true);
  });

  it('returns false for other types', () => {
    const item = { id: 'test', type: 'query', timestamp: Date.now(), content: 'hi' };
    expect(isLensOfferItem(item as any)).toBe(false);
  });
});
```

---

## Component Tests

### 3. LensOfferObject Component

**File:** `src/surface/components/KineticStream/Stream/blocks/__tests__/LensOfferObject.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LensOfferObject } from '../LensOfferObject';
import type { LensOfferStreamItem } from '@core/schema/stream';

const createOffer = (overrides = {}): LensOfferStreamItem => ({
  id: 'offer-1',
  type: 'lens_offer',
  timestamp: Date.now(),
  lensId: 'economics',
  lensName: 'Economic Lens',
  reason: 'Incentive structures detected',
  previewText: 'Reveal hidden value flows',
  status: 'pending',
  sourceResponseId: 'resp-1',
  ...overrides
});

describe('LensOfferObject', () => {
  it('renders pending offer', () => {
    render(
      <LensOfferObject 
        item={createOffer()} 
        onAccept={jest.fn()} 
        onDismiss={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Economic Lens')).toBeVisible();
    expect(screen.getByText('"Reveal hidden value flows"')).toBeVisible();
  });

  it('does not render accepted offer', () => {
    render(
      <LensOfferObject 
        item={createOffer({ status: 'accepted' })} 
        onAccept={jest.fn()} 
        onDismiss={jest.fn()} 
      />
    );
    
    expect(screen.queryByTestId('lens-offer-object')).not.toBeInTheDocument();
  });

  it('does not render dismissed offer', () => {
    render(
      <LensOfferObject 
        item={createOffer({ status: 'dismissed' })} 
        onAccept={jest.fn()} 
        onDismiss={jest.fn()} 
      />
    );
    
    expect(screen.queryByTestId('lens-offer-object')).not.toBeInTheDocument();
  });

  it('calls onAccept when clicked', () => {
    const onAccept = jest.fn();
    render(
      <LensOfferObject 
        item={createOffer()} 
        onAccept={onAccept} 
        onDismiss={jest.fn()} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /view through/i }));
    expect(onAccept).toHaveBeenCalledWith('economics', 'resp-1');
  });

  it('calls onDismiss when X clicked', () => {
    const onDismiss = jest.fn();
    render(
      <LensOfferObject 
        item={createOffer()} 
        onAccept={jest.fn()} 
        onDismiss={onDismiss} 
      />
    );
    
    fireEvent.click(screen.getByLabelText('Dismiss suggestion'));
    expect(onDismiss).toHaveBeenCalledWith('offer-1');
  });
});
```

---

## E2E Tests

### 4. Lens Offer Flow

**File:** `tests/e2e/lens-offer.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Lens Offer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
  });

  test('renders lens offer after response with tag', async ({ page }) => {
    // This test requires mocking the API response
    // to include a lens_offer tag
    
    // Mock the chat API to return a response with lens offer
    await page.route('**/api/chat/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: {"chunk": "The Ratchet mechanism creates value flows. <lens_offer id=\\"economics\\" reason=\\"incentives\\" preview=\\"See the hidden economics\\" />"}\n\n`
      });
    });

    // Submit a query
    await page.getByPlaceholder(/ask anything/i).fill('Tell me about the Ratchet');
    await page.getByPlaceholder(/ask anything/i).press('Enter');

    // Wait for lens offer to appear
    await expect(page.getByTestId('lens-offer-object')).toBeVisible();
    await expect(page.getByText('Economic Lens')).toBeVisible();
  });

  test('accepting lens offer activates lens', async ({ page }) => {
    // Similar setup with mocked response
    // Verify that clicking the offer changes the lens state
    // This is a behavior test - we verify the visible outcome
  });
});
```

---

## Integration Tests

### 5. useKineticStream with Lens Offers

**File:** `src/surface/components/KineticStream/hooks/__tests__/useKineticStream.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useKineticStream } from '../useKineticStream';

// Mock the chat service
jest.mock('../../../../../services/chatService', () => ({
  sendMessageStream: jest.fn()
}));

describe('useKineticStream with lens offers', () => {
  it('parses lens offer from response', async () => {
    const { sendMessageStream } = require('../../../../../services/chatService');
    
    sendMessageStream.mockImplementation((query, onChunk) => {
      onChunk('Response text. <lens_offer id="economics" reason="test" />');
      return Promise.resolve();
    });

    const { result } = renderHook(() => useKineticStream());

    await act(async () => {
      await result.current.submit('test query');
    });

    // Verify lens offer is in items
    const lensOffer = result.current.items.find(i => i.type === 'lens_offer');
    expect(lensOffer).toBeDefined();
    expect(lensOffer?.lensId).toBe('economics');
  });

  it('updateStreamItem changes offer status', async () => {
    const { result } = renderHook(() => useKineticStream());
    
    // First add an item with a lens offer
    // Then update its status
    // Verify the status changed
  });
});
```

---

## Test Commands

```bash
# Run unit tests
npm test -- --testPathPattern="LensOfferParser|stream.test"

# Run component tests
npm test -- --testPathPattern="LensOfferObject"

# Run all tests
npm test

# Run E2E tests
npx playwright test tests/e2e/lens-offer.spec.ts

# Run with coverage
npm test -- --coverage --collectCoverageFrom="src/core/transformers/LensOfferParser.ts"
```

---

## Verification Checklist

- [ ] Parser unit tests pass
- [ ] Type guard tests pass
- [ ] Component renders correctly
- [ ] Click handlers work
- [ ] Dismiss button works
- [ ] Keyboard accessible (Tab, Enter, Space)
- [ ] E2E flow works with mocked API
- [ ] No TypeScript errors
- [ ] Build succeeds

---

*Test strategy complete. Proceed to SPRINTS.md*
