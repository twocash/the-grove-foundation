# EXECUTION_PROMPT: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025
**Handoff To:** Claude Code CLI

---

## Mission

Implement inline lens offers in the Kinetic Stream. When the LLM detects content resonance with a specific analytical perspective, it emits a `<lens_offer>` tag that renders as a glass-molded card inviting the user to "view through" that lens.

**Repository:** `C:\GitHub\the-grove-foundation`

---

## Pre-Flight Checks

Before starting, verify the environment:

```bash
cd C:\GitHub\the-grove-foundation

# Verify clean state
git status

# Verify build works
npm run build

# Verify tests pass
npm test

# Verify /explore route works
npm run dev
# Navigate to http://localhost:5173/explore
```

---

## Epic 1: Schema & Parser

### Task 1.1: Extend stream.ts

**File:** `src/core/schema/stream.ts`

**Add after line ~30 (after JourneyFork interface):**

```typescript
// ─────────────────────────────────────────────────────────────────
// LENS OFFER (Inline lens recommendation)
// Sprint: lens-offer-v1
// ─────────────────────────────────────────────────────────────────

export type LensOfferStatus = 'pending' | 'accepted' | 'dismissed';
```

**Add after SystemStreamItem (around line 107):**

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

**Update StreamItemType union:**

```typescript
export type StreamItemType =
  | 'query'
  | 'response'
  | 'navigation'
  | 'reveal'
  | 'system'
  | 'lens_offer';  // <-- Add this
```

**Update StreamItem union:**

```typescript
export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | RevealStreamItem
  | LensOfferStreamItem;  // <-- Add this
```

**Add type guard after other guards (around line 140):**

```typescript
export function isLensOfferItem(item: StreamItem): item is LensOfferStreamItem {
  return item.type === 'lens_offer';
}
```

**Verify:**
```bash
npx tsc --noEmit
```

---

### Task 1.2: Create LensOfferParser.ts

**Create file:** `src/core/transformers/LensOfferParser.ts`

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

### Task 1.3: Export from index.ts

**File:** `src/core/transformers/index.ts`

**Add at end:**

```typescript
export {
  parseLensOffer,
  type ParsedLensOffer
} from './LensOfferParser';
```

**Verify:**
```bash
npx tsc --noEmit
```

---

## Epic 2: Component Layer

### Task 2.1: Create LensOfferObject.tsx

**Create file:** `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx`

```typescript
// src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx
// Inline lens recommendation card
// Sprint: lens-offer-v1

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import type { LensOfferStreamItem } from '@core/schema/stream';

export interface LensOfferObjectProps {
  item: LensOfferStreamItem;
  onAccept: (lensId: string, sourceResponseId: string) => void;
  onDismiss: (itemId: string) => void;
}

export const LensOfferObject: React.FC<LensOfferObjectProps> = ({
  item,
  onAccept,
  onDismiss
}) => {
  if (item.status !== 'pending') return null;

  const handleAccept = () => {
    onAccept(item.lensId, item.sourceResponseId);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(item.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="relative my-4 group"
      data-testid="lens-offer-object"
    >
      <button
        onClick={handleAccept}
        className="
          w-full flex items-center gap-4 p-4 rounded-xl text-left
          bg-[var(--glass-surface)] backdrop-blur-md
          border border-[var(--glass-border)]
          hover:border-indigo-400/50 hover:bg-[var(--glass-elevated)]
          transition-all duration-300 ease-out
          shadow-[0_0_20px_-8px_rgba(99,102,241,0.15)]
          hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)]
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        "
      >
        <div className="
          flex-shrink-0 p-3 rounded-full
          bg-indigo-500/10 text-indigo-400
          group-hover:scale-110 group-hover:bg-indigo-500/20
          transition-all duration-300
        ">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">
              Lens Suggestion
            </span>
          </div>
          <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">
            View through the{' '}
            <span className="text-white font-bold">{item.lensName}</span>
          </h4>
          {item.previewText && (
            <p className="text-xs text-[var(--glass-text-subtle)] mt-1 line-clamp-1">
              "{item.previewText}"
            </p>
          )}
          {item.reason && (
            <p className="text-[10px] text-[var(--glass-text-subtle)]/70 mt-1">
              {item.reason}
            </p>
          )}
        </div>

        <div className="
          flex-shrink-0 pr-2
          opacity-0 -translate-x-2
          group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-300
        ">
          <ArrowRight className="w-5 h-5 text-indigo-400" />
        </div>
      </button>

      <button
        onClick={handleDismiss}
        className="
          absolute top-2 right-2
          p-1.5 rounded-full
          bg-[var(--glass-solid)]/50 text-[var(--glass-text-subtle)]
          opacity-0 group-hover:opacity-100
          hover:bg-[var(--glass-solid)] hover:text-[var(--glass-text-body)]
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-slate-500/50
        "
        aria-label="Dismiss suggestion"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export default LensOfferObject;
```

---

### Task 2.2: Export from blocks/index.ts

**File:** `src/surface/components/KineticStream/Stream/blocks/index.ts`

**Add:**

```typescript
export { LensOfferObject } from './LensOfferObject';
```

---

### Task 2.3: Wire into KineticRenderer.tsx

**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Add import:**

```typescript
import { LensOfferObject } from './blocks/LensOfferObject';
```

**Update KineticRendererProps interface:**

```typescript
export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensOfferAccept?: (lensId: string, sourceResponseId: string) => void;
  onLensOfferDismiss?: (itemId: string) => void;
}
```

**Update KineticBlockProps and add props to KineticBlock component:**

```typescript
interface KineticBlockProps {
  item: StreamItem;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensOfferAccept?: (lensId: string, sourceResponseId: string) => void;
  onLensOfferDismiss?: (itemId: string) => void;
}
```

**Add case to switch statement in KineticBlock:**

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

**Pass props from KineticRenderer to KineticBlock:**

```typescript
<KineticBlock
  item={item}
  onConceptClick={onConceptClick}
  onForkSelect={onForkSelect}
  onPromptSubmit={onPromptSubmit}
  onLensOfferAccept={onLensOfferAccept}
  onLensOfferDismiss={onLensOfferDismiss}
/>
```

**Verify:**
```bash
npx tsc --noEmit
```

---

## Epic 3: Integration Layer

### Task 3.1: Extend useKineticStream.ts

**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Add import:**

```typescript
import { parseLensOffer } from '@core/transformers/LensOfferParser';
```

**Update UseKineticStreamReturn interface:**

```typescript
interface UseKineticStreamReturn {
  items: StreamItem[];
  currentItem: StreamItem | null;
  isLoading: boolean;
  submit: (query: string, pivot?: PivotContext) => Promise<void>;
  clear: () => void;
  updateStreamItem: (id: string, updates: Partial<StreamItem>) => void;
}
```

**Add updateStreamItem function (after clear):**

```typescript
const updateStreamItem = useCallback((id: string, updates: Partial<StreamItem>) => {
  setItems(prev => prev.map(item => 
    item.id === id ? { ...item, ...updates } as StreamItem : item
  ));
}, []);
```

**Modify response hydration section (around line 75-95):**

Replace:
```typescript
// Parse completed response
const { forks, cleanContent } = parseNavigation(fullContent);
const { spans } = parseRhetoric(cleanContent);

// Finalize response
const finalResponse: ResponseStreamItem = {
  id: responseId,
  type: 'response',
  timestamp: Date.now(),
  content: cleanContent,
  isGenerating: false,
  role: 'assistant',
  createdBy: 'ai',
  parsedSpans: spans.length > 0 ? spans : undefined,
  navigation: forks.length > 0 ? forks : undefined
};

setItems(prev => [...prev, finalResponse]);
```

With:
```typescript
// Parse navigation first
const { forks, cleanContent: afterNav } = parseNavigation(fullContent);

// Parse lens offer second
const { offer, cleanContent: finalContent } = parseLensOffer(afterNav, responseId);

// Parse rhetoric
const { spans } = parseRhetoric(finalContent);

// Finalize response
const finalResponse: ResponseStreamItem = {
  id: responseId,
  type: 'response',
  timestamp: Date.now(),
  content: finalContent,
  isGenerating: false,
  role: 'assistant',
  createdBy: 'ai',
  parsedSpans: spans.length > 0 ? spans : undefined,
  navigation: forks.length > 0 ? forks : undefined
};

// Add response and lens offer (if present)
setItems(prev => {
  const newItems = [...prev, finalResponse];
  if (offer) {
    newItems.push(offer);
  }
  return newItems;
});
```

**Update return statement:**

```typescript
return { items, currentItem, isLoading, submit, clear, updateStreamItem };
```

---

### Task 3.2: Wire ExploreShell.tsx

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Add imports:**

```typescript
import { useEngagement, useLensState } from '@core/engagement';
```

**Add hooks inside component (after useKineticStream):**

```typescript
const { items, currentItem, isLoading, submit, updateStreamItem } = useKineticStream();
const { actor } = useEngagement();
const { selectLens } = useLensState({ actor });
```

**Add handlers (after handleSubmit):**

```typescript
const handleLensOfferAccept = useCallback((lensId: string, sourceResponseId: string) => {
  // Find and update the offer
  const offer = items.find(i => i.type === 'lens_offer' && 
    (i as LensOfferStreamItem).sourceResponseId === sourceResponseId
  );
  if (offer) {
    updateStreamItem(offer.id, { status: 'accepted' } as Partial<LensOfferStreamItem>);
  }
  
  // Activate the lens
  selectLens(lensId);
  
  // Format lens name for query
  const lensName = lensId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  // Auto-submit pivot query
  const pivotContext: PivotContext = {
    sourceResponseId,
    sourceText: 'lens offer',
    sourceContext: `User accepted ${lensId} lens suggestion`
  };
  submit(`Analyze the previous response through the ${lensName} lens.`, pivotContext);
}, [items, updateStreamItem, selectLens, submit]);

const handleLensOfferDismiss = useCallback((itemId: string) => {
  updateStreamItem(itemId, { status: 'dismissed' } as Partial<LensOfferStreamItem>);
}, [updateStreamItem]);
```

**Add LensOfferStreamItem to imports:**

```typescript
import type { RhetoricalSpan, JourneyFork, PivotContext, LensOfferStreamItem } from '@core/schema/stream';
```

**Update KineticRenderer props:**

```typescript
<KineticRenderer
  items={items}
  currentItem={currentItem}
  onConceptClick={handleConceptClick}
  onForkSelect={handleForkSelect}
  onPromptSubmit={handleSubmit}
  onLensOfferAccept={handleLensOfferAccept}
  onLensOfferDismiss={handleLensOfferDismiss}
/>
```

---

## Final Verification

```bash
# TypeScript check
npx tsc --noEmit

# Run tests
npm test

# Build
npm run build

# No Terminal imports (should be empty)
grep -r "from.*components/Terminal" src/surface/components/KineticStream/

# Start dev server
npm run dev

# Manual test: Navigate to http://localhost:5173/explore
# Submit a query and verify chat works (lens offers require LLM to emit tags)
```

---

## Troubleshooting

### TypeScript Errors

**"Cannot find module '@core/engagement'"**
- Check tsconfig paths include `@core/*`
- Verify `src/core/engagement/index.ts` exports `useEngagement` and `useLensState`

**"Property does not exist on type 'StreamItem'"**
- Ensure `LensOfferStreamItem` is added to the `StreamItem` union
- Use type guards or type assertions where needed

### Runtime Errors

**"selectLens is not a function"**
- Verify `useLensState` is imported correctly
- Check that `actor` from `useEngagement()` is passed to `useLensState`

**Lens offer not appearing**
- Check that the LLM response contains `<lens_offer ... />` tag
- Verify parser regex matches the tag format
- Check browser console for parser warnings

---

## Success Criteria

- [ ] `/explore` loads without errors
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No Terminal imports in KineticStream
- [ ] LensOfferParser extracts tags correctly
- [ ] LensOfferObject renders for pending offers
- [ ] Click on offer activates lens and submits pivot
- [ ] Dismiss button hides the offer

---

## Commit Message

```
feat(kinetic): add inline lens offers

Implements lens recommendation cards in the Kinetic Stream:
- Add LensOfferStreamItem to schema
- Create LensOfferParser for <lens_offer> tags
- Add LensOfferObject component
- Wire into KineticRenderer and ExploreShell
- Auto-pivot on lens offer accept

Sprint: lens-offer-v1
```

---

*Execution prompt complete. Hand off to Claude Code CLI.*
