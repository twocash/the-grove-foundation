# ARCH_DECISIONS: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025

---

## ADR-001: Lens Offer as Separate Stream Item

### Context
We need to surface lens recommendations inline. Options:
1. Embed lens offer data in `ResponseStreamItem`
2. Create separate `LensOfferStreamItem`

### Decision
**Create separate `LensOfferStreamItem`.**

### Rationale
- Lens offers have their own lifecycle (pending → accepted/dismissed)
- Separation enables independent animation (appear after response completes)
- Matches `NavigationStreamItem` precedent for extracted content
- Cleaner state management (update offer status without touching response)

### Consequences
- Additional item in stream array
- Parser returns `additionalItems[]` alongside response
- Renderer needs dedicated block component

---

## ADR-002: Parser Follows NavigationParser Pattern

### Context
Need to extract `<lens_offer ... />` tags from LLM output.

### Decision
**Create `LensOfferParser.ts` mirroring `NavigationParser.ts` structure.**

### Rationale
- Proven pattern (NavigationParser works reliably)
- Consistent developer experience
- Same parse-clean-return signature
- Easy to test in isolation

### Implementation
```typescript
export function parseLensOffer(rawContent: string, sourceResponseId: string): ParsedLensOffer {
  // Same structure as parseNavigation
}
```

### Consequences
- Two sequential parses: navigation → lens offer
- Order matters: navigation strips its block first
- Clean content flows through pipeline

---

## ADR-003: Use Existing Lens State Hook

### Context
Need to activate lens when user accepts offer.

### Decision
**Use `useLensState` from `@core/engagement` with its `selectLens` function.**

### Rationale
- `selectLens` handles both initial selection and changes
- Automatically persists to localStorage
- Integrates with existing URL hydration
- No new machine events needed

### Implementation
```typescript
const { selectLens } = useLensState({ actor });

const handleLensOfferAccept = (lensId: string, sourceResponseId: string) => {
  selectLens(lensId);
  // Then submit pivot query
};
```

### Consequences
- ExploreShell needs `useEngagement` for actor
- Clean integration with existing lens system
- No machine modifications required

---

## ADR-004: Self-Closing XML Tag Format

### Context
LLM needs a format for emitting lens offers.

### Decision
**Use self-closing XML: `<lens_offer id="..." reason="..." preview="..." />`**

### Rationale
- Consistent with navigation block pattern
- Attribute-based format is easier to parse than JSON
- Single line, appears at end of response
- No nested content to worry about

### Format
```
<lens_offer id="economics" name="Economic Lens" reason="The user is exploring incentive structures" preview="Reveal the hidden value flows in this mechanism" />
```

### Consequences
- Parser uses attribute regex (not JSON parsing)
- Must handle missing optional attributes gracefully
- `name` auto-generated from `id` if not provided

---

## ADR-005: Auto-Pivot on Accept

### Context
When user accepts a lens offer, what happens next?

### Decision
**Auto-submit a pivot query that re-analyzes through the new lens.**

### Rationale
- Immediate value demonstration
- User doesn't have to think of what to ask
- Creates "magic" feeling - click button, get insight
- `sourceResponseId` enables contextual re-analysis

### Implementation
```typescript
const handleLensOfferAccept = (lensId: string, sourceResponseId: string) => {
  updateStreamItem(offerId, { status: 'accepted' });
  selectLens(lensId);
  
  // Auto-pivot
  submit(`Analyze the previous response through the ${lensName}.`, {
    sourceResponseId,
    sourceText: 'lens offer',
    sourceContext: `User accepted ${lensId} lens suggestion`
  });
};
```

### Consequences
- Two actions from one click (lens change + query)
- Need formatted lens name for natural query
- Creates provenance chain (offer → response)

---

## ADR-006: Status Updates via Item Mutation

### Context
Need to track offer status (pending → accepted/dismissed) without full re-render.

### Decision
**Add `updateStreamItem` function to `useKineticStream` hook.**

### Rationale
- Minimal change to existing hook
- Enables updating any stream item by ID
- Supports future needs (editing, archiving)

### Implementation
```typescript
const updateStreamItem = useCallback((id: string, updates: Partial<StreamItem>) => {
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, ...updates } : item
  ));
}, []);
```

### Consequences
- Type safety requires careful handling of union types
- Only updates committed items (not currentItem)
- Dismissed offers collapse via CSS (status !== 'pending')

---

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Lens definitions in config, LLM output is declarative XML |
| **Capability Agnosticism** | Parser works with any model that emits valid tags |
| **Provenance as Infrastructure** | `sourceResponseId` + `reason` create attribution chain |
| **Organic Scalability** | New lenses require only config changes |

---

*Architecture decisions complete. Proceed to MIGRATION_MAP.md*
