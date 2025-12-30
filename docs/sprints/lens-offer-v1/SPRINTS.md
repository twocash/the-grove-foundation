# SPRINTS.md: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025
**Estimated Duration:** 2-3 hours

---

## Sprint Overview

Implement inline lens offers in the Kinetic Stream—glass-molded cards that recommend analytical perspectives based on content resonance.

---

## Epic 1: Schema & Parser (Core Layer)

**Goal:** Extend StreamItem union and create parser for `<lens_offer>` tags.

### Story 1.1: Add LensOfferStreamItem to Schema

**File:** `src/core/schema/stream.ts`

**Tasks:**
1. Add `LensOfferStatus` type after line ~30
2. Add `LensOfferStreamItem` interface after SystemStreamItem
3. Add `'lens_offer'` to `StreamItemType` union
4. Add `LensOfferStreamItem` to `StreamItem` union
5. Add `isLensOfferItem` type guard

**Tests:**
- Type guard returns correct boolean

**Verification:**
```bash
npx tsc --noEmit
```

### Story 1.2: Create LensOfferParser

**File:** `src/core/transformers/LensOfferParser.ts` (CREATE)

**Tasks:**
1. Create file with `parseLensOffer` function
2. Implement attribute regex parsing
3. Handle missing required fields gracefully
4. Auto-generate lensName from id

**Tests:**
- Returns null when no tag
- Extracts all attributes
- Cleans content properly

**Verification:**
```bash
npm test -- --testPathPattern="LensOfferParser"
```

### Story 1.3: Export Parser

**File:** `src/core/transformers/index.ts`

**Tasks:**
1. Add export for `parseLensOffer` and `ParsedLensOffer` type

**Verification:**
```bash
# Import should resolve
grep "parseLensOffer" src/core/transformers/index.ts
```

### Build Gate
```bash
npx tsc --noEmit
npm test -- --testPathPattern="LensOffer"
```

---

## Epic 2: Component Layer (Surface)

**Goal:** Create LensOfferObject component and wire into renderer.

### Story 2.1: Create LensOfferObject Component

**File:** `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx` (CREATE)

**Tasks:**
1. Create component with glass styling
2. Implement pending/accepted/dismissed states
3. Add click handler for accept
4. Add dismiss button with X icon
5. Add proper accessibility (button semantics, aria-label)
6. Add framer-motion animations

**Tests:**
- Renders when pending
- Hidden when accepted/dismissed
- onClick fires with correct args
- Dismiss fires with item id

**Verification:**
```bash
npm test -- --testPathPattern="LensOfferObject"
```

### Story 2.2: Export Component

**File:** `src/surface/components/KineticStream/Stream/blocks/index.ts`

**Tasks:**
1. Add `LensOfferObject` export

### Story 2.3: Wire into KineticRenderer

**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Tasks:**
1. Import `LensOfferObject`
2. Add `onLensOfferAccept` and `onLensOfferDismiss` to props interface
3. Pass props to KineticBlock
4. Add case for `'lens_offer'` in switch statement

**Verification:**
```bash
npx tsc --noEmit
```

### Build Gate
```bash
npx tsc --noEmit
npm test
```

---

## Epic 3: Integration Layer

**Goal:** Wire parsing into hook and handlers into shell.

### Story 3.1: Extend useKineticStream Hook

**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Tasks:**
1. Import `parseLensOffer` from transformers
2. Add `updateStreamItem` function to hook
3. Modify response hydration to parse lens offer after navigation
4. Add lens offer to items array if present
5. Update return type to include `updateStreamItem`

**Verification:**
```bash
npx tsc --noEmit
```

### Story 3.2: Wire ExploreShell Handlers

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Tasks:**
1. Import `useEngagement`, `useLensState` from `@core/engagement`
2. Get actor from `useEngagement`
3. Get `selectLens` from `useLensState({ actor })`
4. Destructure `updateStreamItem` from `useKineticStream`
5. Create `handleLensOfferAccept` handler:
   - Update offer status to 'accepted'
   - Call `selectLens(lensId)`
   - Submit pivot query with context
6. Create `handleLensOfferDismiss` handler:
   - Update offer status to 'dismissed'
7. Pass handlers to KineticRenderer

**Verification:**
```bash
npx tsc --noEmit
npm run build
```

### Build Gate
```bash
npm run build
npm test
npx playwright test tests/e2e/explore-baseline.spec.ts
```

---

## Epic 4: Testing & Documentation

**Goal:** Ensure feature works end-to-end and is documented.

### Story 4.1: Write Unit Tests

**Tasks:**
1. Create `LensOfferParser.test.ts`
2. Create `LensOfferObject.test.tsx`
3. Add type guard tests to stream.test.ts

**Verification:**
```bash
npm test -- --coverage
```

### Story 4.2: Update DEVLOG

**File:** `docs/DEVLOG.md`

**Tasks:**
1. Add lens-offer-v1 section
2. Document files created/modified
3. List verification steps completed

---

## Final Verification

```bash
# TypeScript
npx tsc --noEmit

# Unit tests
npm test

# Build
npm run build

# No Terminal imports
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
# Should return empty

# E2E tests
npx playwright test

# Manual verification
npm run dev
# Navigate to /explore
# Submit query, verify lens offer appears (if LLM emits tag)
```

---

## Files Summary

### Created (2 files)
| File | Lines |
|------|-------|
| `src/core/transformers/LensOfferParser.ts` | ~60 |
| `src/surface/.../blocks/LensOfferObject.tsx` | ~90 |

### Modified (6 files)
| File | Changes |
|------|---------|
| `src/core/schema/stream.ts` | +30 lines (types, guard) |
| `src/core/transformers/index.ts` | +2 lines (export) |
| `src/surface/.../blocks/index.ts` | +1 line (export) |
| `src/surface/.../Stream/KineticRenderer.tsx` | +15 lines (case, props) |
| `src/surface/.../hooks/useKineticStream.ts` | +20 lines (parsing, update) |
| `src/surface/.../ExploreShell.tsx` | +30 lines (handlers) |

---

*Sprint breakdown complete. Proceed to EXECUTION_PROMPT.md*
