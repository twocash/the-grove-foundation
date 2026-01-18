# Migration Plan: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Date:** December 28, 2025

---

## Migration Overview

This sprint enhances existing infrastructure rather than replacing it. The migration is **low-risk** because:

1. TerminalChat → StreamRenderer integration already complete
2. Core rendering pipeline unchanged
3. New features are additive (JourneyFork, NavigationParser)
4. Backward compatibility maintained for all existing types

---

## Migration Phases

### Phase 1: Schema Enhancement (Non-Breaking)

**Goal:** Add discriminated union types without breaking existing code.

**Files Modified:**
- `src/core/schema/stream.ts`

**Strategy:**
1. ADD new interfaces (QueryStreamItem, ResponseStreamItem, etc.)
2. KEEP existing StreamItem interface as alias
3. ADD JourneyFork and PivotContext types
4. ENHANCE type guards with proper narrowing

**Backward Compatibility:**
```typescript
// Existing code still works
const item: StreamItem = { type: 'query', content: 'test', ... };

// New code gets better types
if (isQueryItem(item)) {
  // item is QueryStreamItem
}
```

**Rollback:** Revert `stream.ts` to previous version. No other files affected.

---

### Phase 2: Parser Addition (Additive)

**Goal:** Add NavigationParser without affecting existing parsing.

**Files Added:**
- `src/core/transformers/NavigationParser.ts`

**Files Modified:**
- `src/core/engagement/machine.ts` (finalizeResponse action)

**Strategy:**
1. CREATE NavigationParser.ts
2. IMPORT in machine.ts
3. CALL parseNavigation BEFORE rhetorical parsing
4. STORE forks on ResponseStreamItem

**Integration Point:**
```typescript
// In finalizeResponse action
const { forks, cleanContent } = parseNavigation(rawContent);
const { spans } = parse(cleanContent);
const item: ResponseStreamItem = {
  ...context.currentStreamItem,
  content: cleanContent,
  parsedSpans: spans,
  navigation: forks
};
```

**Rollback:** Delete NavigationParser.ts, remove import from machine.ts.

---

### Phase 3: Machine Events (Additive)

**Goal:** Add pivot/fork event handlers.

**Files Modified:**
- `src/core/engagement/types.ts`
- `src/core/engagement/machine.ts`

**Strategy:**
1. ADD new event types to EngagementEvent union
2. ADD action handlers for pivot/fork
3. ADD event listeners in machine `on` block

**Event Additions:**
```typescript
| { type: 'USER.CLICK_PIVOT'; span: RhetoricalSpan; responseId: string }
| { type: 'USER.SELECT_FORK'; fork: JourneyFork; responseId: string }
```

**Rollback:** Remove event types and handlers. Existing events unaffected.

---

### Phase 4: Component Enhancement (Additive)

**Goal:** Enhance NavigationBlock and ResponseBlock.

**Files Modified:**
- `components/Terminal/Stream/blocks/NavigationBlock.tsx`
- `components/Terminal/Stream/blocks/ResponseBlock.tsx`
- `components/Terminal/Stream/StreamRenderer.tsx`

**Strategy:**

**NavigationBlock:**
1. ADD ForkButton component
2. ADD fork type grouping
3. CHANGE props from `item` to `forks`
4. KEEP existing SuggestionChip path for legacy `suggestedPaths`

**ResponseBlock:**
1. ADD inline NavigationBlock mount point
2. ADD `onForkSelect` prop
3. KEEP existing `suggestedPaths` rendering (legacy compat)

**StreamRenderer:**
1. ADD `onForkSelect` prop
2. PASS to ResponseBlock
3. CHANGE `onSpanClick` signature to include responseId

**Rollback:** Revert component files. No data changes.

---

### Phase 5: CSS Tokens (Additive)

**Goal:** Add fork button styling.

**Files Modified:**
- `styles/globals.css`

**Strategy:**
1. ADD `--fork-*` token block after `--chat-entity-text`
2. ADD `.fork-button` base class
3. ADD `.fork-button--primary/secondary/tertiary` variants

**Rollback:** Remove CSS block. No other impact.

---

## Deprecation Path

### Components to Deprecate (Future Sprint)

| Component | Current Usage | Replacement | Timeline |
|-----------|--------------|-------------|----------|
| SuggestionChip | NavigationBlock, ResponseBlock | ForkButton | After validation |

**Deprecation Steps:**
1. Mark SuggestionChip with `@deprecated` JSDoc
2. Migrate remaining usages to ForkButton
3. Remove in future cleanup sprint

### Types to Deprecate (Future Sprint)

| Type | Replacement | Timeline |
|------|-------------|----------|
| JourneyPath | JourneyFork | After NavigationBlock migration |
| suggestedPaths field | navigation field | After full validation |

---

## Feature Flag Strategy

Per REPO_AUDIT.md, TerminalChat already uses StreamRenderer. No feature flag needed for core rendering.

**Optional Enhancement Flag:**
```typescript
// For navigation system if rollback needed
const useNewNavigation = useFeatureFlag('kinetic-navigation') ?? true;

{useNewNavigation && hasNavigation(item) ? (
  <NavigationBlock forks={item.navigation} onSelect={onForkSelect} />
) : hasPaths(item) ? (
  <LegacyNavigationBlock item={item} onPathClick={onPathClick} />
) : null}
```

**Recommendation:** Don't add flag unless issues encountered. Migration is low-risk.

---

## Rollback Procedures

### Level 1: Component Rollback

**Trigger:** UI issues with new NavigationBlock or ForkButton.

**Steps:**
1. Revert `NavigationBlock.tsx` to previous version
2. Revert `ResponseBlock.tsx` to previous version
3. Redeploy

**Impact:** No data loss. Users see old suggestion chips.

---

### Level 2: Parser Rollback

**Trigger:** NavigationParser causing errors or content corruption.

**Steps:**
1. In `machine.ts`, comment out parseNavigation call
2. Set `navigation: []` on all response items
3. Redeploy

**Impact:** Forks stop appearing. Content unaffected.

---

### Level 3: Schema Rollback

**Trigger:** Type errors breaking build.

**Steps:**
1. Revert `stream.ts` to previous version
2. Revert any files with type errors
3. Run `npm run build` to verify
4. Redeploy

**Impact:** Lose discriminated union benefits. Functionality preserved.

---

### Level 4: Full Rollback

**Trigger:** Critical failure requiring sprint revert.

**Steps:**
1. `git revert` all commits in sprint
2. Verify build passes
3. Redeploy

**Impact:** Returns to pre-sprint state.

---

## Data Migration

**None Required.**

This sprint adds new fields to types but doesn't change stored data:
- `navigation` field on ResponseStreamItem is optional
- `pivot` field on QueryStreamItem is optional
- Existing stream items in localStorage remain valid

---

## Validation Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass (or skip gracefully)
- [ ] Build succeeds with no type errors
- [ ] Manual smoke test: query → response → forks visible (if LLM outputs them)
- [ ] Manual smoke test: concept click triggers pivot

### Post-Deployment

- [ ] Monitor for console errors
- [ ] Verify stream rendering works
- [ ] Check that existing sessions load correctly
- [ ] Verify fork clicks submit queries
- [ ] Confirm pivot context appears in QueryBlock (optional)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Type errors in existing code | Low | Medium | Backward-compatible types |
| NavigationParser corrupts content | Low | High | Regex is conservative, strips only `<navigation>` |
| Fork clicks don't work | Medium | Low | Falls back to no navigation |
| CSS breaks in some browsers | Low | Low | Standard CSS, no new features |
| Performance regression | Low | Medium | Parsing is O(n), already fast |

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Schema | 1h | None |
| Phase 2: Parser | 2h | Phase 1 |
| Phase 3: Machine | 1h | Phase 1, 2 |
| Phase 4: Components | 3h | Phase 1, 3 |
| Phase 5: CSS | 30min | Phase 4 |
| Testing | 2h | All phases |
| Deployment | 30min | Testing |

**Total:** ~10 hours of focused work

---

*Migration plan complete. Proceed to SPRINTS.md.*
