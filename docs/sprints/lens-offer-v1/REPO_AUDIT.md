# REPO_AUDIT: lens-offer-v1

**Sprint:** lens-offer-v1
**Date:** December 28, 2025
**Auditor:** Claude (Foundation Loop Phase 1)

---

## Executive Summary

This audit validates the current state of the codebase for implementing inline lens offers in the Kinetic Stream. The kinetic-experience-v1 sprint completed successfully, establishing a clean component tree that this sprint extends.

---

## Files to Modify

### 1. Schema: `src/core/schema/stream.ts`

**Current State:** 231 lines, well-structured discriminated union
**Relevant Types:**
- `BaseStreamItem` (line ~70) - base interface to extend
- `StreamItemType` union (line ~45-50) - add `'lens_offer'`
- `StreamItem` union (line ~108-114) - add `LensOfferStreamItem`

**Change Required:** 
- Add `LensOfferStatus` type
- Add `LensOfferStreamItem` interface
- Add `isLensOfferItem()` type guard
- Extend `StreamItemType` and `StreamItem` unions

**Risk:** Low - additive changes only, no breaking changes

---

### 2. Transformers Index: `src/core/transformers/index.ts`

**Current State:** 19 lines, barrel exports

```typescript
export { parseNavigation, type ParsedNavigation } from './NavigationParser';
```

**Change Required:** Add export for new LensOfferParser

**Risk:** None - pure addition

---

### 3. Hook: `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Current State:** 132 lines
**Key Section (lines 70-95):** Response hydration

```typescript
// Parse completed response
const { forks, cleanContent } = parseNavigation(fullContent);
const { spans } = parseRhetoric(cleanContent);
```

**Change Required:**
- Import `parseLensOffer` 
- Add lens offer parsing after navigation parsing
- Return additional items (lens offers) alongside response
- Add `updateStreamItem` function for status updates

**Risk:** Medium - core flow modification, needs careful integration

---

### 4. Renderer: `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Current State:** 93 lines
**Key Section (lines 65-85):** Switch statement routing

```typescript
switch (item.type) {
  case 'query': return <QueryObject ... />;
  case 'response': return <ResponseObject ... />;
  case 'navigation': return <NavigationObject ... />;
  case 'system': return <SystemObject ... />;
  default: return null;
}
```

**Change Required:**
- Import `LensOfferObject`
- Add case for `'lens_offer'`
- Add props: `onLensOfferAccept`, `onLensOfferDismiss`

**Risk:** Low - pattern already established

---

### 5. Shell: `src/surface/components/KineticStream/ExploreShell.tsx`

**Current State:** 77 lines
**Missing:** Lens offer handlers, engagement machine integration

**Change Required:**
- Import `useEngagement`, `useLensState` from `@core/engagement`
- Add `handleLensOfferAccept(lensId, sourceResponseId)`
- Add `handleLensOfferDismiss(itemId)`
- Wire to KineticRenderer

**Risk:** Medium - adds engagement machine dependency

---

### 6. Blocks Index: `src/surface/components/KineticStream/Stream/blocks/index.ts`

**Current State:** 5 lines

```typescript
export { QueryObject } from './QueryObject';
export { ResponseObject } from './ResponseObject';
export { NavigationObject } from './NavigationObject';
export { SystemObject } from './SystemObject';
```

**Change Required:** Add `LensOfferObject` export

**Risk:** None

---

## Files to Create

| File | Lines (est.) | Purpose |
|------|--------------|---------|
| `src/core/transformers/LensOfferParser.ts` | ~60 | Parse `<lens_offer ... />` tags |
| `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx` | ~90 | Render lens offer card |

---

## Engagement Machine Analysis

### Lens Events (from `src/core/engagement/types.ts`)

```typescript
| { type: 'SELECT_LENS'; lens: string; source: 'url' | 'localStorage' | 'selection' }
| { type: 'CHANGE_LENS'; lens: string }
```

### Hook Pattern (from `src/core/engagement/hooks/useLensState.ts`)

```typescript
const selectLens = useCallback((newLens: string) => {
  if (lens) {
    actor.send({ type: 'CHANGE_LENS', lens: newLens });
  } else {
    actor.send({ type: 'SELECT_LENS', lens: newLens, source: 'selection' });
  }
}, [actor, lens]);
```

**Integration Point:** Use `selectLens` from `useLensState` hook - handles both initial selection and changes.

---

## System Prompt Location

**Not in codebase.** System prompts for Grove are configured externally (Gemini API configuration or prompt files not in this repository).

**Action Required:** Document the lens offer prompt format. Implementation may require adding to a prompts config file or API configuration.

---

## Dependency Check

### Required Packages (Already Present)
- `framer-motion` ✅ (used in KineticRenderer)
- `lucide-react` ✅ (used throughout)
- `xstate` ✅ (engagement machine)

### No New Dependencies Required

---

## Pattern Compliance Verification

| Pattern | Status | Evidence |
|---------|--------|----------|
| StreamItem Extension | ✅ Ready | Existing union supports additon |
| Parser Pattern | ✅ Ready | NavigationParser is template |
| Block Pattern | ✅ Ready | 4 existing blocks follow same structure |
| Engagement Machine | ✅ Ready | `useLensState` provides `selectLens` |
| CSS Tokens | ✅ Ready | `--glass-*` tokens exist |

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM not emitting tags | Medium | Add fallback post-hoc detection in future sprint |
| Streaming parse complexity | Low | Parse only on complete response (current pattern) |
| State sync issues | Medium | Use XState machine as single source of truth |

---

## Verification Commands

```bash
# Verify no Terminal imports (should be empty)
grep -r "from.*components/Terminal" src/surface/components/KineticStream/

# Verify TypeScript compiles
npx tsc --noEmit

# Verify build succeeds
npm run build

# Verify tests pass
npm test
```

---

## Audit Conclusion

**Status:** ✅ Ready for Implementation

The codebase is well-prepared for this feature:
1. Schema system supports extension
2. Parser pattern is proven (NavigationParser)
3. Block component pattern is established
4. Engagement machine has required lens events
5. No new dependencies required

**Estimated Effort:** 2-3 hours for implementation, 1 hour for testing

---

*Audit complete. Proceed to ARCH_DECISIONS.md*
