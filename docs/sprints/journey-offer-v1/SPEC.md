# SPEC.md — journey-offer-v1

## Quick Reference

### Schema Type
```typescript
export interface JourneyOfferStreamItem extends BaseStreamItem {
  type: 'journey_offer';
  journeyId: string;
  journeyName: string;
  reason: string;
  previewText: string;
  estimatedMinutes?: number;
  status: JourneyOfferStatus;
  sourceResponseId: string;
}

export type JourneyOfferStatus = 'pending' | 'accepted' | 'dismissed';
```

### Parser API
```typescript
interface ParsedJourneyOffer {
  offer: JourneyOfferStreamItem | null;
  cleanContent: string;
}

function parseJourneyOffer(
  rawContent: string,
  sourceResponseId: string
): ParsedJourneyOffer
```

### Component Props
```typescript
interface JourneyOfferObjectProps {
  item: JourneyOfferStreamItem;
  onAccept?: (journeyId: string) => void;
  onDismiss?: (offerId: string) => void;
}
```

### LLM Tag Format
```xml
<journey_offer 
  id="journey-id" 
  name="Display Name"
  reason="Why this journey fits"
  preview="What you'll learn"
  minutes="15"
/>
```

### Integration Points
- ExploreShell: `onJourneyAccept` → calls `engStartJourney()`
- KineticRenderer: renders `<JourneyOfferObject />` for type `journey_offer`
- useKineticStream: may inject offers based on entropy/context

### Visual Styling
- Badge: Compass icon, cyan/teal accent (vs green for lens)
- Button: "Start Journey" with duration indicator
- Dismissed: Fades out
- Accepted: Confirmation then fades
