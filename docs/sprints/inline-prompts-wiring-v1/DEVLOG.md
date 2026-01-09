# Inline Prompts Wiring v1 — Development Log

**Sprint:** inline-prompts-wiring-v1  
**Start:** 2026-01-09  
**Status:** ✅ COMPLETE

---

## Session 1: DEX-Aligned Diagnosis

### Phase 0: Pattern Check
Read PROJECT_PATTERNS.md (856 lines). Confirmed:
- Pattern 5 (Context Fields) exists for prompt selection
- Pattern 7 (Grove Data Layer) exists for Supabase → GroveObject transformation
- DEX compliance requires checking config before code

### Phase 1: Repository Audit
Created REPO_AUDIT.md documenting the expected data flow:
```
Supabase prompts → useGroveData → grovePromptToPromptObject → scoring → promptsToForks → NavigationBlock
```

### Phase 2: Configuration Verification

**Ran diagnostic script to check Supabase data:**
```
Total active prompts: 365
Stage targeting:
  genesis: 212
  exploration: 267
  synthesis: 165
  NO stage: 0

Exploration prompts (minInteractions <= 1): 253
```

**Result:** Configuration is CORRECT. 253 prompts should appear at exploration stage.

### Phase 3: Code Pipeline Analysis

**Checked data layer transformation:**
```
Supabase columns: [id, type, title, status, tags, payload...]
Has meta: false (flat schema)
```

The Supabase adapter's `rowToGroveObject()` correctly transforms flat rows to `{ meta, payload }` format.

**Found the bug at line 108 of useNavigationPrompts.ts:**

```typescript
// WRONG - 'data' doesn't exist on UseGroveDataResult
const { data: allPrompts, loading } = useGroveData<PromptPayload>('prompt');

// CORRECT - UseGroveDataResult returns 'objects'
const { objects: allPrompts, loading } = useGroveData<PromptPayload>('prompt');
```

**Root Cause:** Destructuring typo. `useGroveData` returns `{ objects, loading, error, ... }` but the hook was trying to destructure `{ data, loading }`. This made `allPrompts` always `undefined`, causing the early return with empty forks.

### Phase 4: Fix Applied

Fixed three files with the same bug:
1. `src/explore/hooks/useNavigationPrompts.ts:108` - Main inline prompts hook
2. `src/explore/hooks/usePromptSuggestions.ts:56` - Legacy deprecated hook
3. `src/explore/hooks/useSequence.ts:67` - Prompt sequence hook

---

## Session 2: UX Fix — Forks Persisting on Old Responses

### Problem
After the destructuring fix, forks appeared but **persisted on ALL responses** in the stream, causing visual duplication. When user clicked a fork:
- Fork text became their query
- AI responded
- New fork appeared below new response
- But OLD fork was still visible above their query

### Solution
Added `isLast` prop to `ResponseObject` — forks only render on the **most recent response**.

### Files Changed

**src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx:**
```typescript
export interface ResponseObjectProps {
  // ...existing props
  /** Sprint: inline-prompts-wiring-v1 - Only show navigation on most recent response */
  isLast?: boolean;
}

// Destructure with default
isLast = false

// Conditional render
{navigationForks.length > 0 && !item.isGenerating && isLast && (
  <NavigationObject ... />
)}
```

**src/surface/components/KineticStream/Stream/KineticRenderer.tsx:**
```typescript
// Calculate last response index
const lastResponseIndex = allItems.reduce((lastIdx, item, idx) => 
  item.type === 'response' ? idx : lastIdx, -1);

// Pass to KineticBlock
<KineticBlock
  item={item}
  isLastResponse={item.type === 'response' && index === lastResponseIndex}
  ...
/>
```

---

## DEX Compliance Analysis

**What went right:**
- Configuration was verified FIRST (diagnostic script)
- No new patterns introduced
- Fix was minimal (3 one-line changes + 1 UX fix)

**What the bug teaches:**
- API contract mismatches are easy to miss when TypeScript isn't enforcing return types
- The `useSafeNavigationPrompts` wrapper silently swallowed the `undefined` array, making debugging harder
- Having diagnostic scripts that query data directly helps isolate config vs code issues

---

## Files Changed

| File | Change |
|------|--------|
| `src/explore/hooks/useNavigationPrompts.ts` | `{ data: allPrompts }` → `{ objects: allPrompts }` |
| `src/explore/hooks/usePromptSuggestions.ts` | `{ data: prompts }` → `{ objects: prompts }` |
| `src/explore/hooks/useSequence.ts` | `{ data: allPrompts }` → `{ objects: allPrompts }` |
| `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx` | Added `isLast` prop |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | Pass `isLastResponse` to blocks |

---

## Verification

After fix, the navigation prompts should:
1. Load 365 active prompts from Supabase
2. Filter to 253 eligible for exploration stage (at interactionCount=1)
3. Score and return 1 prompt (per prompt-progression-v1 settings)
4. Render as NavigationBlock **only on the last response**
5. Disappear from previous responses when user continues conversation

Test by:
1. `npm run dev`
2. Navigate to `/bedrock/experiences`
3. Send a message
4. Verify fork appears below response
5. Click fork or send another message
6. Verify **only one fork** visible (on newest response)