# REPO_AUDIT.md — journey-offer-v1

**Sprint Goal:** Add inline journey recommendations to Kinetic Stream, symmetric to lens-offer-v1.

## 1. EXISTING PATTERNS TO FOLLOW

### Lens Offer Implementation (Reference)
```
src/core/schema/stream.ts          # LensOfferStreamItem type
src/core/transformers/LensOfferParser.ts    # Parser
src/surface/.../blocks/LensOfferObject.tsx  # UI component
```

### Stream Schema (stream.ts)
```typescript
// Lines 36-37: LensOfferStatus type
export type LensOfferStatus = 'pending' | 'accepted' | 'dismissed';

// Lines 56-57: StreamItemType includes 'lens_offer'
export type StreamItemType =
  | 'query' | 'response' | 'navigation' | 'reveal' | 'system' | 'lens_offer';

// Lines 114-122: LensOfferStreamItem
export interface LensOfferStreamItem extends BaseStreamItem {
  type: 'lens_offer';
  lensId: string;
  lensName: string;
  reason: string;
  previewText: string;
  status: LensOfferStatus;
  sourceResponseId: string;
}
```

### KineticRenderer.tsx (Switch Statement)
```typescript
// Lines 82-108: Block rendering switch
switch (item.type) {
  case 'query':
    return <QueryObject item={item} />;
  case 'response':
    return <ResponseObject ... />;
  case 'navigation':
    return <NavigationObject ... />;
  case 'system':
    return <SystemObject item={item} />;
  case 'lens_offer':
    return <LensOfferObject ... />;
  default:
    return null;
}
```

### Transformer Index (transformers/index.ts)
```typescript
export { parseNavigation, type ParsedNavigation } from './NavigationParser';
export { parse as parseRhetoric } from './RhetoricalParser';
export { parseLensOffer, type ParsedLensOffer } from './LensOfferParser';
```

## 2. FILES TO CREATE

| File | Purpose |
|------|---------|
| `src/core/transformers/JourneyOfferParser.ts` | Extract `<journey_offer>` tags |
| `src/surface/.../blocks/JourneyOfferObject.tsx` | UI component |

## 3. FILES TO MODIFY

| File | Change |
|------|--------|
| `src/core/schema/stream.ts` | Add `JourneyOfferStreamItem`, extend union |
| `src/core/transformers/index.ts` | Export `parseJourneyOffer` |
| `src/surface/.../KineticRenderer.tsx` | Add `journey_offer` case |
| `src/surface/.../ExploreShell.tsx` | Add `onJourneyAccept` handler |

## 4. JOURNEY REGISTRY CHECK

Journey definitions live in:
- `src/core/journey/index.ts` - `getCanonicalJourney()` function
- `data/narratives.json` - schema.journeys object

Journey type from `src/core/schema/journey.ts`:
```typescript
export interface Journey {
  id: string;
  title: string;
  description?: string;
  waypoints: Waypoint[];
  estimatedMinutes?: number;
  // ...
}
```

## 5. LLM TAG FORMAT

Symmetric to lens offers:
```xml
<journey_offer id="distributed-ai-basics" name="Distributed AI Fundamentals" 
  reason="Your questions suggest you'd benefit from structured exploration" 
  preview="A 15-minute journey through the core concepts" />
```

## 6. DEPENDENCIES

- No new npm packages required
- Uses existing motion/GlassContainer infrastructure
- Uses existing engagement hooks (useJourneyState)

## 7. VERIFICATION CHECKLIST

- [ ] JourneyOfferStreamItem type defined
- [ ] Type guard isJourneyOfferItem() exists
- [ ] Parser extracts journey_offer tags
- [ ] Component renders with glass styling
- [ ] Accept triggers journey start
- [ ] Dismiss hides the offer
- [ ] TypeScript compiles clean
- [ ] Tests pass

**STATUS: ✅ Ready for Implementation**
