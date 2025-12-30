# MIGRATION_MAP.md — journey-offer-v1

## Phase 1: Schema Updates

### File: `src/core/schema/stream.ts`

**Add after line 37 (LensOfferStatus):**
```typescript
export type JourneyOfferStatus = 'pending' | 'accepted' | 'dismissed';
```

**Update StreamItemType union (around line 56):**
```typescript
export type StreamItemType =
  | 'query'
  | 'response'
  | 'navigation'
  | 'reveal'
  | 'system'
  | 'lens_offer'
  | 'journey_offer';  // ADD THIS
```

**Add after LensOfferStreamItem (around line 122):**
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
```

**Update StreamItem union (around line 130):**
```typescript
export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | LensOfferStreamItem
  | JourneyOfferStreamItem  // ADD THIS
  | RevealStreamItem;
```

**Add type guard (after isLensOfferItem):**
```typescript
export function isJourneyOfferItem(item: StreamItem): item is JourneyOfferStreamItem {
  return item.type === 'journey_offer';
}
```

---

## Phase 2: Parser

### File: `src/core/transformers/JourneyOfferParser.ts` (CREATE)

```typescript
// src/core/transformers/JourneyOfferParser.ts
// Extract <journey_offer> tags from LLM output
// Sprint: journey-offer-v1

import type { JourneyOfferStreamItem, JourneyOfferStatus } from '../schema/stream';

export interface ParsedJourneyOffer {
  offer: JourneyOfferStreamItem | null;
  cleanContent: string;
}

const JOURNEY_OFFER_REGEX = /<journey_offer\s+([^>]+)\/>/i;

export function parseJourneyOffer(
  rawContent: string,
  sourceResponseId: string
): ParsedJourneyOffer {
  if (!rawContent) {
    return { offer: null, cleanContent: '' };
  }

  const match = rawContent.match(JOURNEY_OFFER_REGEX);

  if (!match) {
    return { offer: null, cleanContent: rawContent };
  }

  const attributeString = match[1];
  const cleanContent = rawContent.replace(JOURNEY_OFFER_REGEX, '').trim();

  const offer = parseAttributes(attributeString, sourceResponseId);

  return { offer, cleanContent };
}

function parseAttributes(
  attrString: string,
  sourceResponseId: string
): JourneyOfferStreamItem | null {
  const attrs: Record<string, string> = {};

  const attrRegex = /(\w+)="([^"]+)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  const journeyId = attrs.id || attrs.journey;
  if (!journeyId) {
    console.warn('[JourneyOfferParser] Missing journey id');
    return null;
  }

  return {
    id: `journey_offer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'journey_offer',
    timestamp: Date.now(),
    journeyId,
    journeyName: attrs.name || formatJourneyName(journeyId),
    reason: attrs.reason || '',
    previewText: attrs.preview || '',
    estimatedMinutes: attrs.minutes ? parseInt(attrs.minutes, 10) : undefined,
    status: 'pending' as JourneyOfferStatus,
    sourceResponseId
  };
}

function formatJourneyName(journeyId: string): string {
  return journeyId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### File: `src/core/transformers/index.ts`

**Add export:**
```typescript
export { parseJourneyOffer, type ParsedJourneyOffer } from './JourneyOfferParser';
```

---

## Phase 3: Component

### File: `src/surface/components/KineticStream/Stream/blocks/JourneyOfferObject.tsx` (CREATE)

```typescript
// src/surface/components/KineticStream/Stream/blocks/JourneyOfferObject.tsx
// Inline journey recommendation card
// Sprint: journey-offer-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { JourneyOfferStreamItem } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';

export interface JourneyOfferObjectProps {
  item: JourneyOfferStreamItem;
  onAccept?: (journeyId: string) => void;
  onDismiss?: (offerId: string) => void;
}

export const JourneyOfferObject: React.FC<JourneyOfferObjectProps> = ({
  item,
  onAccept,
  onDismiss
}) => {
  if (item.status === 'dismissed') {
    return null;
  }

  const handleAccept = () => {
    onAccept?.(item.journeyId);
  };

  const handleDismiss = () => {
    onDismiss?.(item.id);
  };

  if (item.status === 'accepted') {
    return (
      <motion.div
        className="flex flex-col items-start"
        data-testid="journey-offer-object"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <GlassContainer
          intensity="elevated"
          variant="default"
          className="w-full max-w-[85%] px-5 py-4 border-[var(--neon-cyan)]/60"
        >
          <div className="flex items-center gap-3">
            <CheckIcon className="w-5 h-5 text-[var(--neon-cyan)]" />
            <span className="font-sans text-[13px] font-medium text-[var(--neon-cyan)]">
              Starting {item.journeyName}
            </span>
          </div>
        </GlassContainer>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-start" data-testid="journey-offer-object">
      <GlassContainer
        intensity="elevated"
        variant="default"
        className="w-full max-w-[85%] px-5 py-4 border-[var(--neon-cyan)]/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Journey badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30">
                <CompassIcon className="w-3 h-3 mr-1" />
                Guided Journey
              </span>
              {item.estimatedMinutes && (
                <span className="text-[11px] text-[var(--glass-text-subtle)]">
                  ~{item.estimatedMinutes} min
                </span>
              )}
            </div>

            {/* Journey name */}
            <h4 className="font-sans text-[14px] font-semibold text-[var(--glass-text-primary)] mb-1">
              {item.journeyName}
            </h4>

            {/* Reason */}
            {item.reason && (
              <p className="font-sans text-[12px] text-[var(--glass-text-subtle)] mb-2">
                {item.reason}
              </p>
            )}

            {/* Preview text */}
            {item.previewText && (
              <p className="font-sans text-[13px] text-[var(--glass-text-body)] italic leading-relaxed">
                "{item.previewText}"
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--glass-surface)] transition-colors text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-primary)]"
            aria-label="Dismiss suggestion"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Action button */}
        <motion.button
          onClick={handleAccept}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full px-4 py-2 rounded-lg font-sans text-[13px] font-medium
            bg-[var(--neon-cyan)]/90 text-[var(--deep-space)]
            hover:bg-[var(--neon-cyan)] transition-colors
            border border-[var(--neon-cyan)]/50"
        >
          Start Journey
          {item.estimatedMinutes && (
            <span className="ml-2 opacity-70">({item.estimatedMinutes} min)</span>
          )}
        </motion.button>
      </GlassContainer>
    </div>
  );
};

const CompassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default JourneyOfferObject;
```

---

## Phase 4: Integration

### File: `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Add import:**
```typescript
import { JourneyOfferObject } from './blocks/JourneyOfferObject';
```

**Update KineticRendererProps interface:**
```typescript
export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  bottomRef?: React.RefObject<HTMLDivElement>;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensAccept?: (lensId: string) => void;
  onLensDismiss?: (offerId: string) => void;
  onJourneyAccept?: (journeyId: string) => void;    // ADD
  onJourneyDismiss?: (offerId: string) => void;     // ADD
}
```

**Update KineticBlockProps interface similarly.**

**Add case in renderBlock switch:**
```typescript
case 'journey_offer':
  return (
    <JourneyOfferObject
      item={item as JourneyOfferStreamItem}
      onAccept={onJourneyAccept}
      onDismiss={onJourneyDismiss}
    />
  );
```

### File: `src/surface/components/KineticStream/ExploreShell.tsx`

**Add handlers:**
```typescript
const handleJourneyAccept = useCallback((journeyId: string) => {
  const journey = getCanonicalJourney(journeyId, schema);
  if (journey) {
    engStartJourney(journey);
    emit.journeyStarted(journeyId, journey.waypoints.length);
  } else {
    console.warn(`[ExploreShell] Journey not found: ${journeyId}`);
  }
  // Update offer status in stream
  setItems(prev => prev.map(item =>
    item.type === 'journey_offer' && (item as JourneyOfferStreamItem).journeyId === journeyId
      ? { ...item, status: 'accepted' }
      : item
  ));
}, [schema, engStartJourney, emit]);

const handleJourneyDismiss = useCallback((offerId: string) => {
  setItems(prev => prev.map(item =>
    item.id === offerId ? { ...item, status: 'dismissed' } : item
  ));
}, []);
```

**Pass to KineticRenderer:**
```tsx
<KineticRenderer
  items={items}
  // ... existing props
  onJourneyAccept={handleJourneyAccept}
  onJourneyDismiss={handleJourneyDismiss}
/>
```

---

## Rollback Plan

```bash
# Delete created files
rm src/core/transformers/JourneyOfferParser.ts
rm src/surface/components/KineticStream/Stream/blocks/JourneyOfferObject.tsx

# Revert modified files
git checkout -- src/core/schema/stream.ts
git checkout -- src/core/transformers/index.ts
git checkout -- src/surface/components/KineticStream/Stream/KineticRenderer.tsx
git checkout -- src/surface/components/KineticStream/ExploreShell.tsx
```
