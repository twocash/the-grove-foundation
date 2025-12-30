# Feature Spec: Inline Lens Offer

**Sprint:** lens-offer-v1
**Date:** December 28, 2025
**Status:** Specification
**Sprint Owner:** Jim Calhoun

---

## Executive Summary

This feature extends the Kinetic Stream to surface **lens recommendations** inline when the LLM detects high resonance between the current topic and a specific analytical perspective. Unlike modal dialogs or overlays, lens offers appear as first-class stream objects—glass-molded cards that invite the user to "collapse the superposition" from a different vantage point.

**The Insight:** The system notices what the user might not—that discussing "incentives" would benefit from the Economic lens, or that exploring "agent memory" would reveal more through the Systems lens. This transforms lens selection from user burden to system intelligence.

---

## Pattern Check (Phase 0)

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| New stream item type | Pattern 3: Schema System | Add `LensOfferStreamItem` to `StreamItem` union in `stream.ts` |
| Parsing LLM output | NavigationParser precedent | Create `LensOfferParser.ts` following same structure |
| Rendering in stream | KineticRenderer routing | Add case for `lens_offer` type → `LensOfferObject` |
| Lens activation | Pattern 2: Engagement Machine | Use existing `LENS.SET` event |
| Lens context | Pattern 1: Quantum Interface | Read available lenses from `useQuantumInterface` |

### New Patterns Proposed

**None.** This feature is pure pattern extension:
- Schema extension (StreamItem union)
- Parser extension (new parser, same pattern as NavigationParser)
- Renderer extension (new block, same structure as NavigationObject)
- State machine reuse (existing `LENS.SET` event)

---

## Canonical Source Audit (Phase 0.5)

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| StreamItem types | `src/core/schema/stream.ts` | Correct | EXTEND with LensOfferStreamItem |
| Parsing LLM tags | `src/core/transformers/NavigationParser.ts` | Correct pattern | CREATE `LensOfferParser.ts` |
| Block rendering | `src/surface/components/KineticStream/Stream/blocks/` | Correct | CREATE `LensOfferObject.tsx` |
| Lens state | `src/core/engagement/machine.ts` | Correct | USE existing `LENS.SET` |
| Lens metadata | `src/data/quantum-content.ts` | Correct | USE existing lens definitions |

---

## Part I: The Concept

### User Flow

1. **Trigger:** User asks about "The Ratchet mechanism" or "Grove's economic model"
2. **Response:** System explains the concept naturally
3. **Detection:** LLM recognizes high resonance with Economic lens
4. **Offer:** As response completes, a `<lens_offer>` tag is parsed
5. **Render:** Glass-molded card slides into stream after the response
6. **Interaction:**
   - Hover: Subtle glow, lens-color tint
   - Click: Engagement machine fires `LENS.SET`, reality collapses to new lens
7. **Pivot:** System generates a follow-up that re-examines the prior context through the new lens

### The DEX Principle

> **The system notices; the user chooses.**

Lens offers embody Declarative Sovereignty: the LLM's analysis (domain logic) produces structured output (declarative), which the engine interprets (execution). The user retains agency—they can ignore, dismiss, or accept.

---

## Part II: Schema Extension

### Location: `src/core/schema/stream.ts`

Add `lens_offer` to the existing architecture:

```typescript
// ─────────────────────────────────────────────────────────────────
// LENS OFFER (Inline lens recommendation)
// Sprint: lens-offer-v1
// ─────────────────────────────────────────────────────────────────

export type LensOfferStatus = 'pending' | 'accepted' | 'dismissed';

export interface LensOfferStreamItem extends BaseStreamItem {
  type: 'lens_offer';
  
  // Which lens is being recommended
  lensId: string;
  lensName: string;
  
  // Why the system recommends it (the semantic hook)
  reason: string;
  
  // Preview of what the user will discover
  previewText: string;
  
  // Tracks user interaction
  status: LensOfferStatus;
  
  // Links back to the response that triggered it
  sourceResponseId: string;
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM UNION (updated)
// ─────────────────────────────────────────────────────────────────

export type StreamItemType =
  | 'query'
  | 'response'
  | 'navigation'
  | 'reveal'
  | 'system'
  | 'lens_offer';  // <-- Added

export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | RevealStreamItem
  | LensOfferStreamItem;  // <-- Added

// ─────────────────────────────────────────────────────────────────
// TYPE GUARD (added)
// ─────────────────────────────────────────────────────────────────

export function isLensOfferItem(item: StreamItem): item is LensOfferStreamItem {
  return item.type === 'lens_offer';
}
```

### Why This Design

| Field | Purpose | DEX Alignment |
|-------|---------|---------------|
| `lensId` | Machine-readable identifier | Capability Agnostic (works with any lens system) |
| `lensName` | Human-readable display | Declarative Sovereignty (from config, not code) |
| `reason` | The semantic connection detected | Provenance (why this recommendation?) |
| `previewText` | Teaser of insight | Organic Scalability (content from LLM) |
| `status` | Interaction state | Engine tracks; doesn't hardcode behavior |
| `sourceResponseId` | Links to parent response | Provenance as Infrastructure |

---

## Part III: Parser

### Location: `src/core/transformers/LensOfferParser.ts`

Follows the NavigationParser pattern exactly:

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
  
  // Parse key="value" pairs
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

// Export for index
export default { parseLensOffer };
```

### Add to Transformers Index

```typescript
// src/core/transformers/index.ts
export { parseNavigation } from './NavigationParser';
export { parseLensOffer } from './LensOfferParser';  // <-- Added
export { parseRhetoricalSpans } from './RhetoricalParser';
```

---

## Part IV: Component

### Location: `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx`

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
  // Only render pending offers
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
      {/* Main card - clickable */}
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
        {/* Icon */}
        <div className="
          flex-shrink-0 p-3 rounded-full
          bg-indigo-500/10 text-indigo-400
          group-hover:scale-110 group-hover:bg-indigo-500/20
          transition-all duration-300
        ">
          <Sparkles className="w-5 h-5" />
        </div>

        {/* Content */}
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

        {/* Arrow indicator */}
        <div className="
          flex-shrink-0 pr-2
          opacity-0 -translate-x-2
          group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-300
        ">
          <ArrowRight className="w-5 h-5 text-indigo-400" />
        </div>
      </button>

      {/* Dismiss button */}
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

## Part V: Renderer Integration

### Update: `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

```typescript
// Add to imports
import { LensOfferObject } from './blocks/LensOfferObject';
import { isLensOfferItem } from '@core/schema/stream';

// Add to KineticRendererProps
export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensOfferAccept?: (lensId: string, sourceResponseId: string) => void;  // <-- Added
  onLensOfferDismiss?: (itemId: string) => void;  // <-- Added
}

// Add to KineticBlock switch statement
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

## Part VI: System Prompt Update

### Location: System prompt configuration (wherever Grove prompts are defined)

Add to available output tags:

```markdown
## Available Output Tags

### Navigation (existing)
<navigation>
→ Deep dive: Explore the mechanism's edge cases
→ Pivot: How does this relate to agent memory?
→ Apply: Try implementing a basic ratchet
</navigation>

### Lens Offer (new)
When your response has strong resonance with a specific analytical lens that is NOT currently active, you may append a lens offer:

<lens_offer id="economics" name="Economic Lens" reason="The user is exploring incentive structures" preview="Reveal the hidden value flows in this mechanism" />

Available lenses:
- economics: Focus on incentives, value flows, market dynamics
- systems: Focus on feedback loops, entropy, architecture
- historical: Focus on evolution, provenance, patterns over time
- ethical: Focus on values, tradeoffs, stakeholder impact

Rules:
1. Only offer a lens if the current conversation lacks that perspective
2. Only offer ONE lens per response (avoid choice paralysis)
3. The preview should tease genuine insight, not generic promises
4. The reason should connect the user's current query to the lens
```

---

## Part VII: Engagement Machine Integration

### Location: `src/core/engagement/machine.ts`

The existing `LENS.SET` event handles lens activation. The lens offer interaction should:

1. **On Accept:** Fire `LENS.SET` event with the offered `lensId`
2. **Auto-Submit:** After lens activation, submit a re-analysis query

### Orchestration in ExploreShell

```typescript
// In ExploreShell.tsx or useKineticStream.ts

const handleLensOfferAccept = useCallback((lensId: string, sourceResponseId: string) => {
  // 1. Update the offer status in stream state
  updateStreamItem(offerId, { status: 'accepted' });
  
  // 2. Activate the lens via engagement machine
  send({ type: 'LENS.SET', lens: lensId });
  
  // 3. Auto-submit a pivot query
  const pivotQuery = `Analyze the previous response using the ${formatLensName(lensId)}.`;
  handleSubmit(pivotQuery, {
    pivot: {
      sourceResponseId,
      sourceText: 'lens offer',
      sourceContext: `User accepted ${lensId} lens suggestion`
    }
  });
}, [send, updateStreamItem, handleSubmit]);

const handleLensOfferDismiss = useCallback((itemId: string) => {
  updateStreamItem(itemId, { status: 'dismissed' });
}, [updateStreamItem]);
```

---

## Part VIII: Processing Pipeline

### Where Parsing Happens

In the stream hydration flow (wherever responses are processed):

```typescript
import { parseNavigation } from '@core/transformers/NavigationParser';
import { parseLensOffer } from '@core/transformers/LensOfferParser';

function hydrateResponse(rawContent: string, responseId: string): {
  response: ResponseStreamItem;
  additionalItems: StreamItem[];
} {
  // 1. Parse navigation first
  const { forks, cleanContent: afterNav } = parseNavigation(rawContent);
  
  // 2. Parse lens offer second
  const { offer, cleanContent: finalContent } = parseLensOffer(afterNav, responseId);
  
  // 3. Build response item
  const response: ResponseStreamItem = {
    id: responseId,
    type: 'response',
    content: finalContent,
    navigation: forks.length > 0 ? forks : undefined,
    // ... other fields
  };
  
  // 4. Collect additional items
  const additionalItems: StreamItem[] = [];
  if (offer) {
    additionalItems.push(offer);
  }
  
  return { response, additionalItems };
}
```

---

## Part IX: Success Criteria

### MVP Definition

The feature is complete when:

1. **Schema extended:** `LensOfferStreamItem` added to `stream.ts`
2. **Parser works:** `<lens_offer ... />` tags extracted and cleaned
3. **Renders correctly:** Glass card appears after response
4. **Accept works:** Click activates lens + submits pivot query
5. **Dismiss works:** Click collapses card
6. **Prompt updated:** LLM knows how to emit lens offers

### Quality Gates

```bash
# Type checking passes
npx tsc --noEmit

# No hardcoded lens conditionals
grep -r "if.*lensId.*===\|if.*lens.*===\|switch.*lens" src/surface/
# Should return: empty (logic in config, not code)

# New files follow patterns
ls src/core/transformers/LensOfferParser.ts
ls src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx

# E2E test
npx playwright test tests/e2e/lens-offer.spec.ts
```

---

## Part X: DEX Compliance

| Principle | How This Feature Honors It |
|-----------|---------------------------|
| **Declarative Sovereignty** | Lens definitions come from config. LLM output is declarative (`<lens_offer ... />`). Engine interprets; doesn't hardcode. |
| **Capability Agnosticism** | Works whether GPT-4, Claude, or local model emits the tag. Parser handles structured output. |
| **Provenance as Infrastructure** | `sourceResponseId` links offer to triggering response. `reason` documents why recommendation was made. |
| **Organic Scalability** | Adding new lenses requires only config changes. LLM learns new lens IDs from prompt. |

---

## Part XI: Advisory Council Perspective

### Park (Weight 10) - Technical Feasibility
> "The parser pattern is proven. Extending StreamItem is safe. The risk is LLM compliance—smaller models may struggle with the structured output format. Consider a fallback where the system detects lens resonance post-hoc if tags aren't emitted."

### Short (Weight 8) - Narrative Craft
> "The preview text is where voice lives. 'Reveal the hidden value flows' is compelling. 'Learn more about economics' is death. The prompt should include examples of good vs. bad previews."

### Buterin (Weight 6) - Mechanism Design
> "This is a nudge, not a mandate. Good. But track acceptance rates. If users rarely accept offers, either the detection is wrong or the value proposition isn't clear. Instrument from day one."

### Vallor (Weight 6) - Ethics
> "The system is making recommendations. Document the basis. Users should understand why a lens is suggested—transparency builds trust. The 'reason' field is essential, not optional."

---

## Appendix: Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/core/schema/stream.ts` | EXTEND | Add `LensOfferStreamItem` type |
| `src/core/transformers/LensOfferParser.ts` | CREATE | Parser for `<lens_offer>` tags |
| `src/core/transformers/index.ts` | EXTEND | Export new parser |
| `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx` | CREATE | Render component |
| `src/surface/components/KineticStream/Stream/blocks/index.ts` | EXTEND | Export new component |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | EXTEND | Add case for `lens_offer` |
| `src/surface/components/KineticStream/ExploreShell.tsx` | EXTEND | Wire handlers |
| System prompt | EXTEND | Add lens offer instructions |

---

*Specification complete. Ready for Foundation Loop Phase 1 (REPO_AUDIT) through Phase 7 (EXECUTION_PROMPT).*
