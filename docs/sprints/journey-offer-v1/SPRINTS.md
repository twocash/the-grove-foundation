# SPRINTS.md — journey-offer-v1

## Sprint Overview

**Duration:** ~2 hours
**Files Created:** 2
**Files Modified:** 4

---

## Epic 1: Schema Layer (20 min)

### Story 1.1: Add JourneyOfferStreamItem Type
**File:** `src/core/schema/stream.ts`
**Effort:** 15 min

Tasks:
- Add `JourneyOfferStatus` type
- Add `JourneyOfferStreamItem` interface
- Extend `StreamItemType` union
- Extend `StreamItem` union
- Add `isJourneyOfferItem` type guard

Acceptance:
- TypeScript compiles clean
- Type guard works correctly

### Story 1.2: Verify Schema Consistency
**Effort:** 5 min

Tasks:
- Run `npx tsc --noEmit`
- Verify no circular dependencies

---

## Epic 2: Parser Layer (20 min)

### Story 2.1: Create JourneyOfferParser
**File:** `src/core/transformers/JourneyOfferParser.ts`
**Effort:** 15 min

Tasks:
- Create parser following LensOfferParser pattern
- Extract attributes: id, name, reason, preview, minutes
- Generate fallback name from id
- Return cleaned content

### Story 2.2: Export Parser
**File:** `src/core/transformers/index.ts`
**Effort:** 5 min

Tasks:
- Add export for parseJourneyOffer
- Add export for ParsedJourneyOffer type

---

## Epic 3: Component Layer (30 min)

### Story 3.1: Create JourneyOfferObject
**File:** `src/surface/.../blocks/JourneyOfferObject.tsx`
**Effort:** 25 min

Tasks:
- Create component with GlassContainer
- Implement pending state with full UI
- Implement accepted state with confirmation
- Implement dismissed state (return null)
- Add CompassIcon, CloseIcon, CheckIcon
- Use cyan accent (`--neon-cyan`)
- Show duration when available

### Story 3.2: Component Tests
**Effort:** 5 min

Tasks:
- Test all three states render correctly
- Test onAccept callback
- Test onDismiss callback

---

## Epic 4: Integration Layer (35 min)

### Story 4.1: Wire KineticRenderer
**File:** `src/surface/.../Stream/KineticRenderer.tsx`
**Effort:** 15 min

Tasks:
- Import JourneyOfferObject
- Add `onJourneyAccept` and `onJourneyDismiss` to props
- Add case for `journey_offer` in switch
- Pass props through KineticBlock

### Story 4.2: Wire ExploreShell
**File:** `src/surface/.../ExploreShell.tsx`
**Effort:** 20 min

Tasks:
- Add `handleJourneyAccept` callback
- Add `handleJourneyDismiss` callback
- Look up journey via getCanonicalJourney
- Call engStartJourney on accept
- Emit analytics
- Pass handlers to KineticRenderer

---

## Epic 5: Testing (15 min)

### Story 5.1: Parser Unit Tests
**Effort:** 10 min

Tasks:
- Test tag extraction
- Test missing id handling
- Test fallback name generation
- Test clean content

### Story 5.2: Manual Verification
**Effort:** 5 min

Tasks:
- Manually inject journey_offer tag in response
- Verify render and interaction
- Verify journey starts on accept

---

## Summary

| Epic | Stories | Duration |
|------|---------|----------|
| Schema | 2 | 20 min |
| Parser | 2 | 20 min |
| Component | 2 | 30 min |
| Integration | 2 | 35 min |
| Testing | 2 | 15 min |
| **Total** | **10** | **~2 hours** |

## File Change Summary

**Create:**
- `src/core/transformers/JourneyOfferParser.ts`
- `src/surface/.../blocks/JourneyOfferObject.tsx`

**Modify:**
- `src/core/schema/stream.ts`
- `src/core/transformers/index.ts`
- `src/surface/.../Stream/KineticRenderer.tsx`
- `src/surface/.../ExploreShell.tsx`
