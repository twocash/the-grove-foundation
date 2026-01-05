# Kinetic Suggested Prompts v1 — Migration Map

**Sprint:** kinetic-suggested-prompts-v1  
**Date:** January 4, 2026

---

## Overview

This sprint introduces the canonical 4D navigation system while deprecating legacy parallel implementations. Migration is non-breaking—legacy code continues to work with deprecation warnings.

---

## Deprecation Targets

### 1. usePromptSuggestions.ts

**Location:** `src/explore/hooks/usePromptSuggestions.ts`

**Status:** DEPRECATE (do not delete)

**Reason:** Replaced by `useNavigationPrompts` which uses the canonical 4D `selectPrompts()` system.

**Action:**
```typescript
/**
 * @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
 * This hook uses a parallel scoring system. The canonical system is in
 * `@core/context-fields/scoring.ts`.
 * 
 * Migration: Replace usePromptSuggestions() with useNavigationPrompts()
 * Sprint: kinetic-suggested-prompts-v1
 * Removal target: Sprint 6+
 */
export function usePromptSuggestions(...) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEPRECATED] usePromptSuggestions - use useNavigationPrompts');
  }
  // ... existing implementation unchanged
}
```

**Consumer Migration:**
```typescript
// Before
import { usePromptSuggestions } from '@explore/hooks';
const suggestions = usePromptSuggestions(context);

// After
import { useNavigationPrompts } from '@explore/hooks';
const { forks } = useNavigationPrompts({ maxPrompts: 3 });
```

---

### 2. scorePrompt.ts

**Location:** `src/explore/utils/scorePrompt.ts` (if exists)

**Status:** DEPRECATE (do not delete)

**Reason:** Parallel scoring logic. Canonical scoring is in `src/core/context-fields/scoring.ts`.

**Action:**
```typescript
/**
 * @deprecated Use `selectPrompts` from `@core/context-fields/scoring` instead.
 * 
 * Sprint: kinetic-suggested-prompts-v1
 * Removal target: Sprint 6+
 */
export function scorePrompt(...) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEPRECATED] scorePrompt - use selectPrompts from @core/context-fields');
  }
  // ... existing
}
```

---

## New Exports

### src/core/context-fields/index.ts

**Add:**
```typescript
// Hooks
export { useContextState } from './useContextState';

// Adapters
export { promptToFork, promptsToForks, inferForkType } from './adapters';

// Existing (unchanged)
export { selectPrompts, applyHardFilters, calculateRelevance } from './scoring';
export type { ContextState, PromptObject, ContextTargeting } from './types';
```

### src/explore/hooks/index.ts

**Add:**
```typescript
export { useNavigationPrompts } from './useNavigationPrompts';
export type { 
  UseNavigationPromptsOptions, 
  NavigationPromptsResult 
} from './useNavigationPrompts';
```

---

## Feature Flags

### src/config/features.ts

**Add:**
```typescript
export const FEATURES = {
  // ... existing
  
  /** 
   * Enable 4D-selected inline navigation prompts after responses.
   * Sprint: kinetic-suggested-prompts-v1
   */
  INLINE_NAVIGATION_PROMPTS: true,
  
  /**
   * Future: floating suggestion widget (not this sprint)
   */
  FLOATING_SUGGESTION_WIDGET: false
};
```

---

## Event Bridge Extension

### src/core/events/hooks/useEventBridge.ts

**Add to EventBridgeEmit interface:**
```typescript
interface EventBridgeEmit {
  // ... existing
  
  /**
   * Emitted when user clicks a navigation fork
   * Sprint: kinetic-suggested-prompts-v1
   */
  forkSelected: (
    forkId: string, 
    forkType: string, 
    label: string, 
    responseId: string
  ) => void;
}
```

**Add implementation:**
```typescript
forkSelected: (forkId, forkType, label, responseId) => {
  if (isNewSystemEnabled && newDispatch) {
    newDispatch({
      type: 'FORK_SELECTED',
      forkId,
      forkType,
      label,
      responseId,
      timestamp: Date.now(),
      ...baseAttribution
    });
  }
  // Dual-write to legacy if needed
  if (legacyEmit) {
    legacyEmit('fork_selected', { forkId, forkType, label, responseId });
  }
}
```

---

## Type Additions

### src/core/events/types.ts

**Add to EventPayloadMap:**
```typescript
interface EventPayloadMap {
  // ... existing
  
  FORK_SELECTED: {
    forkId: string;
    forkType: JourneyForkType;
    label: string;
    responseId: string;
  };
}
```

---

## File Creation Summary

| File | Action | Path |
|------|--------|------|
| useContextState.ts | CREATE | `src/core/context-fields/useContextState.ts` |
| adapters.ts | CREATE | `src/core/context-fields/adapters.ts` |
| useNavigationPrompts.ts | CREATE | `src/explore/hooks/useNavigationPrompts.ts` |
| useContextState.test.tsx | CREATE | `tests/unit/context-fields/useContextState.test.tsx` |
| adapters.test.ts | CREATE | `tests/unit/context-fields/adapters.test.ts` |
| useNavigationPrompts.test.tsx | CREATE | `tests/unit/context-fields/useNavigationPrompts.test.tsx` |

## File Modification Summary

| File | Action | Changes |
|------|--------|---------|
| ResponseBlock.tsx | MODIFY | Wire useNavigationPrompts, add merge logic |
| useEventBridge.ts | MODIFY | Add forkSelected emit |
| features.ts | MODIFY | Add feature flags |
| context-fields/index.ts | MODIFY | Export new modules |
| explore/hooks/index.ts | MODIFY | Export new hook |
| events/types.ts | MODIFY | Add FORK_SELECTED type |
| usePromptSuggestions.ts | MODIFY | Add @deprecated annotation |

---

## Rollback Plan

If issues arise:

1. **Quick rollback:** Set `FEATURES.INLINE_NAVIGATION_PROMPTS = false`
2. **Full rollback:** Revert ResponseBlock.tsx changes only

The new hooks and adapters are additive—they don't break existing code.

---

## Future Removal (Sprint 6+)

After confirming no consumers use deprecated code:

1. Search codebase for `usePromptSuggestions` imports
2. Search for `scorePrompt` imports
3. If zero consumers, delete files
4. Remove deprecation warnings

---

*Migration preserves backward compatibility while establishing canonical patterns.*
