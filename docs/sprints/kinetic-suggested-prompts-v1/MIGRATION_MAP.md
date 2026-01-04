# MIGRATION_MAP: kinetic-suggested-prompts-v1

**Sprint:** kinetic-suggested-prompts-v1  
**Author:** Claude (Foundation Loop v2)  
**Created:** 2025-01-04  

---

## Migration Overview

This sprint adds integration code. No destructive migrations. All changes are additive until the final deprecation step.

---

## File Change Sequence

### Phase 1: Core Adapters (No UI Impact)

| Order | Action | File | Dependencies |
|-------|--------|------|--------------|
| 1.1 | CREATE | `src/core/context-fields/adapters.ts` | types.ts |
| 1.2 | CREATE | `src/core/context-fields/useContextState.ts` | engagement/context.tsx |
| 1.3 | UPDATE | `src/core/context-fields/index.ts` | Re-export new modules |

**Test gate:** Unit tests for adapters pass

### Phase 2: Selection Hook (No UI Impact)

| Order | Action | File | Dependencies |
|-------|--------|------|--------------|
| 2.1 | CREATE | `src/explore/hooks/useNavigationPrompts.ts` | adapters.ts, scoring.ts |
| 2.2 | UPDATE | `src/explore/hooks/index.ts` | Re-export new hook |

**Test gate:** Integration tests for hook pass

### Phase 3: Feature Flag

| Order | Action | File | Dependencies |
|-------|--------|------|--------------|
| 3.1 | CREATE | `src/config/features.ts` | None (if not exists) |
| 3.2 | UPDATE | `src/config/features.ts` | Add INLINE_NAVIGATION_PROMPTS flag |

### Phase 4: UI Integration (Behind Flag)

| Order | Action | File | Dependencies |
|-------|--------|------|--------------|
| 4.1 | UPDATE | `components/Terminal/Stream/blocks/ResponseBlock.tsx` | useNavigationPrompts |
| 4.2 | UPDATE | `components/Terminal/Stream/blocks/NavigationBlock.tsx` | Add variant styles |

**Test gate:** E2E tests with flag enabled pass

### Phase 5: Deprecation (After Validation)

| Order | Action | File | Dependencies |
|-------|--------|------|--------------|
| 5.1 | UPDATE | `src/explore/hooks/usePromptSuggestions.ts` | Add @deprecated JSDoc |
| 5.2 | UPDATE | `src/explore/utils/scorePrompt.ts` | Add @deprecated JSDoc |
| 5.3 | HIDE | Floating suggestion widget | Feature flag |

---

## Detailed File Changes

### 1.1 CREATE: adapters.ts

**Path:** `src/core/context-fields/adapters.ts`

**Content:** See ARCHITECTURE.md § Type Definitions

**Exports:**
- `promptToFork(prompt: PromptObject): JourneyFork`
- `inferForkType(prompt: PromptObject): JourneyForkType`
- `promptsToForks(prompts: PromptObject[]): JourneyFork[]`

---

### 1.2 CREATE: useContextState.ts

**Path:** `src/core/context-fields/useContextState.ts`

**Content:** See ARCHITECTURE.md § Type Definitions

**Exports:**
- `useContextState(): ContextState`
- `type { ContextState }` (re-export)

**Dependencies:**
- `@xstate/react` - useSelector
- `@core/engagement` - useEngagement

---

### 1.3 UPDATE: context-fields/index.ts

**Path:** `src/core/context-fields/index.ts`

**Changes:**
```typescript
// Add to existing exports
export { promptToFork, inferForkType, promptsToForks } from './adapters';
export { useContextState } from './useContextState';
```

---

### 2.1 CREATE: useNavigationPrompts.ts

**Path:** `src/explore/hooks/useNavigationPrompts.ts`

**Content:** See ARCHITECTURE.md § Type Definitions

**Exports:**
- `useNavigationPrompts(options?): NavigationPromptsResult`
- `type UseNavigationPromptsOptions`
- `type NavigationPromptsResult`

---

### 2.2 UPDATE: explore/hooks/index.ts

**Path:** `src/explore/hooks/index.ts`

**Changes:**
```typescript
// Add to existing exports
export { useNavigationPrompts } from './useNavigationPrompts';
export type { UseNavigationPromptsOptions, NavigationPromptsResult } from './useNavigationPrompts';
```

---

### 3.1/3.2 UPDATE: features.ts

**Path:** `src/config/features.ts`

**Changes:**
```typescript
export const FEATURES = {
  // ... existing flags ...
  
  /**
   * Enable inline navigation prompts using 4D Context Fields
   * Sprint: kinetic-suggested-prompts-v1
   */
  INLINE_NAVIGATION_PROMPTS: true,
  
  /**
   * Show floating suggestion widget (legacy)
   * Sprint: kinetic-suggested-prompts-v1 deprecation
   */
  FLOATING_SUGGESTION_WIDGET: false
};
```

---

### 4.1 UPDATE: ResponseBlock.tsx

**Path:** `components/Terminal/Stream/blocks/ResponseBlock.tsx`

**Changes:**

```diff
 import React from 'react';
 import { motion } from 'framer-motion';
+import { FEATURES } from '@config/features';
+import { useNavigationPrompts } from '@explore/hooks/useNavigationPrompts';
 import type { ResponseStreamItem, RhetoricalSpan, JourneyFork } from '../../../../src/core/schema/stream';
 // ... other imports ...

 export const ResponseBlock: React.FC<ResponseBlockProps> = ({
   item,
   onSpanClick,
   onForkSelect,
   onPromptSubmit,
   loadingMessages
 }) => {
+  // 4D-aware navigation prompts
+  const { forks: libraryForks } = FEATURES.INLINE_NAVIGATION_PROMPTS 
+    ? useNavigationPrompts({ maxPrompts: 3 })
+    : { forks: [] };
+  
+  // Merge: prefer parsed navigation, fallback to library
+  const navigationForks = item.navigation?.length 
+    ? item.navigation 
+    : libraryForks;
+  
   const isError = item.content.startsWith('SYSTEM ERROR') ||
                   item.content.startsWith('Error:');

   return (
     <motion.div
       className="flex flex-col items-start"
       data-testid="response-block"
       // ...
     >
       {/* ... existing content ... */}

-      {hasNavigation(item) && !item.isGenerating && (
+      {!item.isGenerating && navigationForks.length > 0 && (
         <NavigationBlock
-          forks={item.navigation!}
+          forks={navigationForks}
           onSelect={onForkSelect}
         />
       )}
     </motion.div>
   );
 };
```

---

### 4.2 UPDATE: NavigationBlock.tsx

**Path:** `components/Terminal/Stream/blocks/NavigationBlock.tsx`

**Changes:**

```diff
 const FORK_ICONS: Record<JourneyForkType, string> = {
   deep_dive: '↓',
   pivot: '→',
-  apply: '✓',
+  apply: '✨',
   challenge: '?'
 };

+const VARIANT_CLASSES: Record<string, string> = {
+  primary: 'bg-[var(--chat-accent)] text-white hover:bg-[var(--chat-accent-hover)]',
+  secondary: 'bg-[var(--glass-bg)] text-[var(--glass-text)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)]',
+  tertiary: 'bg-transparent text-[var(--glass-text-muted)] hover:text-[var(--glass-text)]',
+  quaternary: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
+};

 const ForkButton: React.FC<{
   fork: JourneyFork;
   variant: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
   onClick: () => void;
 }> = ({ fork, variant, onClick }) => (
   <button
     onClick={onClick}
-    className={`
-      fork-button fork-button--${variant}
+    className={`
       px-4 py-2 rounded-full text-sm font-medium
       transition-all duration-200
       hover:scale-105 active:scale-95
-    `}
+      ${VARIANT_CLASSES[variant]}
+    `}
     data-testid="fork-button"
   >
     <span className="mr-2">{FORK_ICONS[fork.type]}</span>
     {fork.label}
   </button>
 );
```

---

### 5.1 UPDATE: usePromptSuggestions.ts (Deprecation)

**Path:** `src/explore/hooks/usePromptSuggestions.ts`

**Changes:**

```diff
+/**
+ * @deprecated Use `useNavigationPrompts` from `@explore/hooks` instead.
+ * This hook uses the legacy scoring algorithm. The new hook uses the
+ * canonical Context Fields system with 4D targeting.
+ * 
+ * Migration: Replace `usePromptSuggestions(options)` with 
+ * `useNavigationPrompts({ maxPrompts: options.limit })`
+ * 
+ * Sprint: kinetic-suggested-prompts-v1
+ */
 export function usePromptSuggestions(options: UsePromptSuggestionsOptions): Prompt[] {
+  console.warn('usePromptSuggestions is deprecated. Use useNavigationPrompts instead.');
   // ... existing implementation ...
 }
```

---

### 5.2 UPDATE: scorePrompt.ts (Deprecation)

**Path:** `src/explore/utils/scorePrompt.ts`

**Changes:**

```diff
+/**
+ * @deprecated Use `selectPrompts` from `@core/context-fields` instead.
+ * This scoring algorithm is superseded by the canonical Context Fields system.
+ * 
+ * Migration: Replace `scorePrompt(prompt, context)` with 
+ * `selectPrompts([prompt], contextState)[0]`
+ * 
+ * Sprint: kinetic-suggested-prompts-v1
+ */
 export function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
+  console.warn('scorePrompt is deprecated. Use @core/context-fields/scoring instead.');
   // ... existing implementation ...
 }
```

---

## Rollback Procedure

### Quick Rollback (Feature Flag)

1. Set `INLINE_NAVIGATION_PROMPTS: false` in `src/config/features.ts`
2. Deploy

### Full Rollback (Code Revert)

1. Revert changes to `ResponseBlock.tsx`
2. Revert changes to `NavigationBlock.tsx`
3. Keep new files (no harm in orphaned code)

---

## Verification Checklist

### After Phase 1
- [ ] `adapters.ts` exports compile
- [ ] `useContextState.ts` exports compile
- [ ] Unit tests pass

### After Phase 2
- [ ] `useNavigationPrompts.ts` exports compile
- [ ] Hook renders without error in test
- [ ] Integration tests pass

### After Phase 3
- [ ] Feature flag defaults to `true`
- [ ] App compiles with flag

### After Phase 4
- [ ] NavigationBlock appears after responses
- [ ] Clicking fork submits executionPrompt
- [ ] Correct fork types inferred
- [ ] E2E tests pass

### After Phase 5
- [ ] Deprecation warnings appear in console
- [ ] No floating widget visible
- [ ] No regressions in main flow

---

## Dependency Graph

```
types.ts (existing)
    │
    ├───▶ adapters.ts (new)
    │         │
    │         ▼
    │     scoring.ts (existing)
    │         │
    └─────────┼───▶ useContextState.ts (new)
              │              │
              │              ▼
              └────▶ useNavigationPrompts.ts (new)
                             │
                             ▼
                     ResponseBlock.tsx (modified)
                             │
                             ▼
                     NavigationBlock.tsx (modified)
```

---

## Next: DECISIONS.md

Document architectural decisions with rationale.

