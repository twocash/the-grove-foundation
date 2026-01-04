# Migration Map — hybrid-search-toggle-v1

## Overview

Add hybrid search toggle to /explore UI, wire through service layer to backend.

## Files to Create

### `tests/e2e/explore-hybrid-toggle.spec.ts`
**Purpose:** E2E tests for hybrid search toggle
**Depends on:** KineticHeader changes
**Tests:** Toggle visibility, state persistence
**Content summary:** Playwright test verifying toggle renders and persists

---

## Files to Modify

### `services/chatService.ts`
**Lines:** 22-28 (ChatOptions interface)
**Change Type:** Add field
**Before:**
```typescript
export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: import('../data/narratives-schema').PersonaBehaviors;
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
}
```
**After:**
```typescript
export interface ChatOptions {
  sessionId?: string;
  sectionContext?: string;
  personaTone?: string;
  personaBehaviors?: import('../data/narratives-schema').PersonaBehaviors;
  verboseMode?: boolean;
  terminatorMode?: boolean;
  journeyId?: string;
  useHybridSearch?: boolean;  // Sprint: hybrid-search-toggle-v1
}
```
**Reason:** Enable service to accept hybrid flag
**Tests:** Integration test via E2E

---

### `services/chatService.ts`
**Lines:** 87-97 (sendMessageStream requestBody)
**Change Type:** Add field to request body
**Before:**
```typescript
const requestBody = {
  message,
  sessionId: options.sessionId ?? currentSessionId,
  sectionContext: options.sectionContext,
  personaTone: options.personaTone,
  personaBehaviors: options.personaBehaviors,
  verboseMode: options.verboseMode ?? false,
  terminatorMode: options.terminatorMode ?? false,
  journeyId: options.journeyId ?? null
};
```
**After:**
```typescript
const requestBody = {
  message,
  sessionId: options.sessionId ?? currentSessionId,
  sectionContext: options.sectionContext,
  personaTone: options.personaTone,
  personaBehaviors: options.personaBehaviors,
  verboseMode: options.verboseMode ?? false,
  terminatorMode: options.terminatorMode ?? false,
  journeyId: options.journeyId ?? null,
  useHybridSearch: options.useHybridSearch ?? false  // Sprint: hybrid-search-toggle-v1
};
```
**Reason:** Pass flag to server
**Tests:** E2E verifies search mode reaches backend (console log)

---

### `src/surface/components/KineticStream/hooks/useKineticStream.ts`
**Lines:** 38-45 (function signature/options)
**Change Type:** Add parameter
**Before:**
```typescript
export function useKineticStream(): UseKineticStreamReturn {
```
**After:**
```typescript
export interface UseKineticStreamOptions {
  useHybridSearch?: boolean;
}

export function useKineticStream(options: UseKineticStreamOptions = {}): UseKineticStreamReturn {
```
**Reason:** Accept hybrid flag from ExploreShell
**Tests:** N/A (internal wiring)

---

### `src/surface/components/KineticStream/hooks/useKineticStream.ts`
**Lines:** ~90 (sendMessageStream call)
**Change Type:** Pass flag
**Before:**
```typescript
const chatResponse = await sendMessageStream(
  query,
  (chunk: string) => { /* ... */ },
  {
    personaTone: effectiveLensId || undefined
  }
);
```
**After:**
```typescript
const chatResponse = await sendMessageStream(
  query,
  (chunk: string) => { /* ... */ },
  {
    personaTone: effectiveLensId || undefined,
    useHybridSearch: options.useHybridSearch  // Sprint: hybrid-search-toggle-v1
  }
);
```
**Reason:** Wire flag through to service
**Tests:** N/A (internal wiring)

---

### `src/surface/components/KineticStream/KineticHeader.tsx`
**Lines:** 22-30 (props interface)
**Change Type:** Add props
**Before:**
```typescript
export interface KineticHeaderProps {
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  journeyName?: string;
  onJourneyClick?: () => void;
  stage?: string;
  exchangeCount?: number;
  currentStreak?: number;
  showStreak?: boolean;
  onStreakClick?: () => void;
}
```
**After:**
```typescript
export interface KineticHeaderProps {
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  journeyName?: string;
  onJourneyClick?: () => void;
  stage?: string;
  exchangeCount?: number;
  currentStreak?: number;
  showStreak?: boolean;
  onStreakClick?: () => void;
  // Sprint: hybrid-search-toggle-v1
  useHybridSearch?: boolean;
  onHybridSearchToggle?: () => void;
}
```
**Reason:** Enable toggle UI
**Tests:** E2E visibility test

---

### `src/surface/components/KineticStream/KineticHeader.tsx`
**Lines:** ~75-85 (between stage badge and context pills)
**Change Type:** Add toggle UI
**Before:**
```typescript
{/* Center: Context Pills */}
<div className="flex items-center gap-2 flex-1 min-w-0 justify-end mr-2">
```
**After:**
```typescript
{/* Hybrid Search Toggle (Sprint: hybrid-search-toggle-v1) */}
{onHybridSearchToggle && (
  <button
    onClick={onHybridSearchToggle}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
      border transition-all duration-200
      ${useHybridSearch 
        ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]' 
        : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
      }
      hover:border-[var(--neon-cyan)]/70`}
    title={useHybridSearch ? 'Hybrid search enabled (vector + keyword + temporal)' : 'Basic vector search'}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${useHybridSearch ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
    <span>RAG</span>
    <span className="text-[9px] opacity-70">{useHybridSearch ? 'ON' : 'OFF'}</span>
  </button>
)}

{/* Center: Context Pills */}
<div className="flex items-center gap-2 flex-1 min-w-0 justify-end mr-2">
```
**Reason:** Render toggle in header
**Tests:** E2E visibility and click tests

---

### `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~48 (after existing state hooks)
**Change Type:** Add state
**Before:**
```typescript
const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });
```
**After:**
```typescript
const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });

// Hybrid search toggle (Sprint: hybrid-search-toggle-v1)
const [useHybridSearch, setUseHybridSearch] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('grove-hybrid-search') === 'true';
  }
  return false;
});

const handleHybridSearchToggle = useCallback(() => {
  setUseHybridSearch(prev => {
    const next = !prev;
    localStorage.setItem('grove-hybrid-search', String(next));
    console.log('[ExploreShell] Hybrid search:', next ? 'ON' : 'OFF');
    return next;
  });
}, []);
```
**Reason:** Own toggle state at container level
**Tests:** E2E persistence test

---

### `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~50 (useKineticStream call)
**Change Type:** Pass option
**Before:**
```typescript
const {
  items,
  currentItem,
  isLoading,
  submit,
  // ...
} = useKineticStream();
```
**After:**
```typescript
const {
  items,
  currentItem,
  isLoading,
  submit,
  // ...
} = useKineticStream({ useHybridSearch });
```
**Reason:** Wire state to stream hook
**Tests:** N/A (internal wiring)

---

### `src/surface/components/KineticStream/ExploreShell.tsx`
**Lines:** ~340 (KineticHeader rendering)
**Change Type:** Pass props
**Before:**
```typescript
<KineticHeader
  lensName={lensData?.publicLabel || 'Choose Lens'}
  lensColor={lensData?.color}
  onLensClick={() => setOverlay({ type: 'lens-picker' })}
  journeyName={journey?.title || (isJourneyActive ? 'Guided' : 'Self-Guided')}
  onJourneyClick={() => setOverlay({ type: 'journey-picker' })}
  stage={stage}
  exchangeCount={exchangeCount}
/>
```
**After:**
```typescript
<KineticHeader
  lensName={lensData?.publicLabel || 'Choose Lens'}
  lensColor={lensData?.color}
  onLensClick={() => setOverlay({ type: 'lens-picker' })}
  journeyName={journey?.title || (isJourneyActive ? 'Guided' : 'Self-Guided')}
  onJourneyClick={() => setOverlay({ type: 'journey-picker' })}
  stage={stage}
  exchangeCount={exchangeCount}
  useHybridSearch={useHybridSearch}
  onHybridSearchToggle={handleHybridSearchToggle}
/>
```
**Reason:** Connect header to state
**Tests:** E2E visibility test

---

## Files to Delete
None.

---

## Test Changes

### Tests to Create
| Test File | Tests | Verifies |
|-----------|-------|----------|
| `tests/e2e/explore-hybrid-toggle.spec.ts` | 3 tests | Toggle visible, clickable, persists |

### Tests to Update
None.

### Tests to Deprecate
None.

---

## Execution Order
1. Add `useHybridSearch` to ChatOptions interface (chatService.ts)
2. Add `useHybridSearch` to requestBody (chatService.ts)
3. **Verify:** TypeScript compiles
4. Add options interface to useKineticStream (useKineticStream.ts)
5. Pass useHybridSearch in sendMessageStream call (useKineticStream.ts)
6. **Verify:** TypeScript compiles
7. Add props to KineticHeaderProps (KineticHeader.tsx)
8. Add toggle UI to KineticHeader (KineticHeader.tsx)
9. **Verify:** TypeScript compiles
10. Add state + handler to ExploreShell (ExploreShell.tsx)
11. Pass options to useKineticStream (ExploreShell.tsx)
12. Pass props to KineticHeader (ExploreShell.tsx)
13. **Verify:** `npm run build` succeeds
14. **Verify:** Toggle visible at localhost:8080/explore
15. Add E2E test (explore-hybrid-toggle.spec.ts)
16. **Verify:** `npx playwright test explore-hybrid-toggle`

## Build Gates
After each phase:
```bash
npm run build
npm test
npx playwright test tests/e2e/explore-hybrid-toggle.spec.ts
```

## Rollback Plan

### If build fails:
1. Revert changes in reverse order
2. Verify build succeeds

### Full rollback:
```bash
git checkout -- services/chatService.ts
git checkout -- src/surface/components/KineticStream/
rm tests/e2e/explore-hybrid-toggle.spec.ts
```

## Verification Checklist
- [ ] All TypeScript compiles
- [ ] Toggle visible in /explore header
- [ ] Toggle state persists on refresh
- [ ] Console shows "useHybridSearch: true/false" in API call
- [ ] E2E tests pass
