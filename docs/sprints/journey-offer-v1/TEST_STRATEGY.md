# TEST_STRATEGY.md — journey-offer-v1

## Unit Tests

### File: `src/core/transformers/__tests__/JourneyOfferParser.test.ts`

```typescript
import { parseJourneyOffer } from '../JourneyOfferParser';

describe('JourneyOfferParser', () => {
  const sourceId = 'response_123';

  it('returns null offer when no tag present', () => {
    const result = parseJourneyOffer('Just some text', sourceId);
    expect(result.offer).toBeNull();
    expect(result.cleanContent).toBe('Just some text');
  });

  it('extracts journey offer with all attributes', () => {
    const content = 'Before <journey_offer id="test-journey" name="Test Journey" reason="Good fit" preview="Learn things" minutes="15" /> After';
    const result = parseJourneyOffer(content, sourceId);

    expect(result.offer).not.toBeNull();
    expect(result.offer?.journeyId).toBe('test-journey');
    expect(result.offer?.journeyName).toBe('Test Journey');
    expect(result.offer?.reason).toBe('Good fit');
    expect(result.offer?.previewText).toBe('Learn things');
    expect(result.offer?.estimatedMinutes).toBe(15);
    expect(result.offer?.status).toBe('pending');
    expect(result.cleanContent).toBe('Before After');
  });

  it('generates name from id when name missing', () => {
    const content = '<journey_offer id="distributed-ai-basics" />';
    const result = parseJourneyOffer(content, sourceId);

    expect(result.offer?.journeyName).toBe('Distributed Ai Basics');
  });

  it('returns null offer when id missing', () => {
    const content = '<journey_offer name="No ID" />';
    const result = parseJourneyOffer(content, sourceId);

    expect(result.offer).toBeNull();
  });

  it('handles empty content', () => {
    const result = parseJourneyOffer('', sourceId);
    expect(result.offer).toBeNull();
    expect(result.cleanContent).toBe('');
  });
});
```

## Component Tests

### File: `src/surface/components/KineticStream/Stream/blocks/__tests__/JourneyOfferObject.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyOfferObject } from '../JourneyOfferObject';
import type { JourneyOfferStreamItem } from '@core/schema/stream';

const mockOffer: JourneyOfferStreamItem = {
  id: 'offer_1',
  type: 'journey_offer',
  timestamp: Date.now(),
  journeyId: 'test-journey',
  journeyName: 'Test Journey',
  reason: 'This fits your interests',
  previewText: 'Learn about AI',
  estimatedMinutes: 15,
  status: 'pending',
  sourceResponseId: 'resp_1'
};

describe('JourneyOfferObject', () => {
  it('renders pending offer correctly', () => {
    render(<JourneyOfferObject item={mockOffer} />);
    
    expect(screen.getByText('Test Journey')).toBeInTheDocument();
    expect(screen.getByText('This fits your interests')).toBeInTheDocument();
    expect(screen.getByText('"Learn about AI"')).toBeInTheDocument();
    expect(screen.getByText('~15 min')).toBeInTheDocument();
    expect(screen.getByText(/Start Journey/)).toBeInTheDocument();
  });

  it('calls onAccept with journeyId', () => {
    const onAccept = jest.fn();
    render(<JourneyOfferObject item={mockOffer} onAccept={onAccept} />);
    
    fireEvent.click(screen.getByText(/Start Journey/));
    expect(onAccept).toHaveBeenCalledWith('test-journey');
  });

  it('calls onDismiss with offerId', () => {
    const onDismiss = jest.fn();
    render(<JourneyOfferObject item={mockOffer} onDismiss={onDismiss} />);
    
    fireEvent.click(screen.getByLabelText('Dismiss suggestion'));
    expect(onDismiss).toHaveBeenCalledWith('offer_1');
  });

  it('renders nothing when dismissed', () => {
    const dismissed = { ...mockOffer, status: 'dismissed' as const };
    const { container } = render(<JourneyOfferObject item={dismissed} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders accepted confirmation', () => {
    const accepted = { ...mockOffer, status: 'accepted' as const };
    render(<JourneyOfferObject item={accepted} />);
    
    expect(screen.getByText(/Starting Test Journey/)).toBeInTheDocument();
  });
});
```

## Integration Tests

### File: `src/surface/components/KineticStream/__tests__/KineticRenderer.journey.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { KineticRenderer } from '../Stream/KineticRenderer';
import type { JourneyOfferStreamItem } from '@core/schema/stream';

describe('KineticRenderer - Journey Offers', () => {
  it('renders journey_offer items', () => {
    const items: JourneyOfferStreamItem[] = [{
      id: 'offer_1',
      type: 'journey_offer',
      timestamp: Date.now(),
      journeyId: 'test',
      journeyName: 'Test Journey',
      reason: 'Test reason',
      previewText: '',
      status: 'pending',
      sourceResponseId: 'resp_1'
    }];

    render(<KineticRenderer items={items} />);
    
    expect(screen.getByTestId('journey-offer-object')).toBeInTheDocument();
    expect(screen.getByText('Test Journey')).toBeInTheDocument();
  });
});
```

## Manual Testing Checklist

1. **Parser Verification**
   - [ ] Create response with `<journey_offer />` tag
   - [ ] Verify tag is stripped from displayed content
   - [ ] Verify offer card appears in stream

2. **Component Interaction**
   - [ ] Click "Start Journey" → journey begins
   - [ ] Click dismiss (X) → card disappears
   - [ ] Accepted state shows confirmation then fades

3. **Visual Verification**
   - [ ] Cyan accent color (not green like lens)
   - [ ] Compass icon visible
   - [ ] Duration displays when available
   - [ ] Glass styling matches lens offers

4. **Integration**
   - [ ] Accepting offer triggers `engStartJourney`
   - [ ] Journey waypoints appear after accept
   - [ ] Analytics emitted correctly

## Browser Testing

- Chrome: Primary
- Firefox: Verify framer-motion animations
- Safari: Check glass styling

## Coverage Goals

- Parser: 100% line coverage
- Component: All render states (pending, accepted, dismissed)
- Integration: Accept/dismiss flows
