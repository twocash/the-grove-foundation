# MIGRATION_MAP: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025

---

## Migration Strategy

**Type:** Additive Extension (No breaking changes)

This sprint adds new capabilities without modifying existing behavior. All changes are additive.

---

## File Change Map

### Phase 1: Schema Layer (Core)

| File | Action | Dependencies | Risk |
|------|--------|--------------|------|
| `src/core/schema/stream.ts` | EXTEND | None | Low |
| `src/core/transformers/LensOfferParser.ts` | CREATE | `stream.ts` | Low |
| `src/core/transformers/index.ts` | EXTEND | `LensOfferParser.ts` | None |

**Order:** stream.ts → LensOfferParser.ts → index.ts

### Phase 2: Component Layer (Surface)

| File | Action | Dependencies | Risk |
|------|--------|--------------|------|
| `src/surface/.../blocks/LensOfferObject.tsx` | CREATE | `stream.ts` | Low |
| `src/surface/.../blocks/index.ts` | EXTEND | `LensOfferObject.tsx` | None |
| `src/surface/.../Stream/KineticRenderer.tsx` | EXTEND | `LensOfferObject.tsx` | Low |

**Order:** LensOfferObject.tsx → index.ts → KineticRenderer.tsx

### Phase 3: Integration Layer

| File | Action | Dependencies | Risk |
|------|--------|--------------|------|
| `src/surface/.../hooks/useKineticStream.ts` | EXTEND | `LensOfferParser.ts` | Medium |
| `src/surface/.../ExploreShell.tsx` | EXTEND | `useKineticStream.ts`, `useLensState` | Medium |

**Order:** useKineticStream.ts → ExploreShell.tsx

---

## Detailed Change Specifications

### 1. `src/core/schema/stream.ts`

**Insert after line ~30 (after JourneyFork interface):**

```typescript
// ─────────────────────────────────────────────────────────────────
// LENS OFFER (Inline lens recommendation)
// Sprint: lens-offer-v1
// ─────────────────────────────────────────────────────────────────

export type LensOfferStatus = 'pending' | 'accepted' | 'dismissed';
```

**Insert after line ~107 (after SystemStreamItem):**

```typescript
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

**Modify StreamItemType (line ~45):**

```typescript
export type StreamItemType =
  | 'query'
  | 'response'
  | 'navigation'
  | 'reveal'
  | 'system'
  | 'lens_offer';  // <-- Add
```

**Modify StreamItem union (line ~113):**

```typescript
export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | RevealStreamItem
  | LensOfferStreamItem;  // <-- Add
```

**Insert after isRevealItem guard (line ~140):**

```typescript
export function isLensOfferItem(item: StreamItem): item is LensOfferStreamItem {
  return item.type === 'lens_offer';
}
```

---

### 2. `src/core/transformers/LensOfferParser.ts`

**Create new file:**

```typescript
// src/core/transformers/LensOfferParser.ts
// Extract <lens_offer> tags from LLM output
// Sprint: lens-offer-v1

import type { LensOfferStreamItem, LensOfferStatus } from '../schema/stream';

export interface ParsedLensOffer {
  offer: LensOfferStreamItem | null;
  cleanContent: string;
}

const LENS_OFFER_REGEX = /<lens_offer\s+([^>]+)\/>/i;

export function parseLensOffer(
  rawContent: string,
  sourceResponseId: string
): ParsedLensOffer {
  if (!rawContent) {
    return { offer: null, cleanContent: '' };
  }

  const match = rawContent.match(LENS_OFFER_REGEX);

  if (!match) {
    return { offer: null, cleanContent: rawContent };
  }

  const attributeString = match[1];
  const cleanContent = rawContent.replace(LENS_OFFER_REGEX, '').trim();

  const offer = parseAttributes(attributeString, sourceResponseId);

  return { offer, cleanContent };
}

function parseAttributes(
  attrString: string,
  sourceResponseId: string
): LensOfferStreamItem | null {
  const attrs: Record<string, string> = {};
  
  const attrRegex = /(\w+)="([^"]+)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const lensId = attrs.id || attrs.lens;
  if (!lensId) {
    console.warn('[LensOfferParser] Missing lens id');
    return null;
  }

  return {
    id: `lens_offer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'lens_offer',
    timestamp: Date.now(),
    lensId,
    lensName: attrs.name || formatLensName(lensId),
    reason: attrs.reason || '',
    previewText: attrs.preview || '',
    status: 'pending' as LensOfferStatus,
    sourceResponseId
  };
}

function formatLensName(lensId: string): string {
  return lensId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Lens';
}
```

---

### 3. `src/core/transformers/index.ts`

**Add export:**

```typescript
export {
  parseLensOffer,
  type ParsedLensOffer
} from './LensOfferParser';
```

---

### 4. LensOfferObject.tsx (see SPEC for full component)

Location: `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx`

---

### 5. `src/surface/.../blocks/index.ts`

**Add export:**

```typescript
export { LensOfferObject } from './LensOfferObject';
```

---

### 6. `KineticRenderer.tsx`

**Add import:**

```typescript
import { LensOfferObject } from './blocks/LensOfferObject';
```

**Extend props:**

```typescript
export interface KineticRendererProps {
  // ... existing props
  onLensOfferAccept?: (lensId: string, sourceResponseId: string) => void;
  onLensOfferDismiss?: (itemId: string) => void;
}
```

**Add case to switch (in KineticBlock):**

```typescript
case 'lens_offer':
  return (
    <LensOfferObject
      item={item}
      onAccept={onLensOfferAccept ?? (() => {})}
      onDismiss={onLensOfferDismiss ?? (() => {})}
    />
  );
```

---

### 7. `useKineticStream.ts`

**Add import:**

```typescript
import { parseLensOffer } from '@core/transformers/LensOfferParser';
```

**Modify return type:**

```typescript
interface UseKineticStreamReturn {
  // ... existing
  updateStreamItem: (id: string, updates: Partial<StreamItem>) => void;
}
```

**Add updateStreamItem function:**

```typescript
const updateStreamItem = useCallback((id: string, updates: Partial<StreamItem>) => {
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, ...updates } as StreamItem : item
  ));
}, []);
```

**Modify response hydration (after parseNavigation):**

```typescript
// Parse lens offer
const { offer, cleanContent: finalContent } = parseLensOffer(cleanContent, responseId);

// ... build finalResponse with finalContent ...

// Add response + lens offer to items
setItems(prev => {
  const newItems = [...prev, finalResponse];
  if (offer) {
    newItems.push(offer);
  }
  return newItems;
});
```

---

### 8. `ExploreShell.tsx`

**Add imports:**

```typescript
import { useEngagement, useLensState } from '@core/engagement';
```

**Add hooks (inside component):**

```typescript
const { actor } = useEngagement();
const { selectLens } = useLensState({ actor });
```

**Modify useKineticStream destructuring:**

```typescript
const { items, currentItem, isLoading, submit, updateStreamItem } = useKineticStream();
```

**Add handlers:**

```typescript
const handleLensOfferAccept = useCallback((lensId: string, sourceResponseId: string) => {
  // Find and update the offer
  const offer = items.find(i => i.type === 'lens_offer' && i.sourceResponseId === sourceResponseId);
  if (offer) {
    updateStreamItem(offer.id, { status: 'accepted' });
  }
  
  // Activate the lens
  selectLens(lensId);
  
  // Auto-submit pivot query
  const lensName = lensId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  submit(`Analyze the previous response through the ${lensName} lens.`, {
    sourceResponseId,
    sourceText: 'lens offer',
    sourceContext: `User accepted ${lensId} lens suggestion`
  });
}, [items, updateStreamItem, selectLens, submit]);

const handleLensOfferDismiss = useCallback((itemId: string) => {
  updateStreamItem(itemId, { status: 'dismissed' });
}, [updateStreamItem]);
```

**Wire to KineticRenderer:**

```typescript
<KineticRenderer
  // ... existing props
  onLensOfferAccept={handleLensOfferAccept}
  onLensOfferDismiss={handleLensOfferDismiss}
/>
```

---

## Rollback Plan

Since all changes are additive:
1. Remove `LensOfferParser.ts`
2. Remove `LensOfferObject.tsx`
3. Revert schema additions
4. Revert hook/shell modifications

Git revert single commit is sufficient.

---

*Migration map complete. Proceed to TEST_STRATEGY.md*
