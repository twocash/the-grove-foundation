# Architectural Decision Records — Epic 2: Lens State Extraction

## ADR-040: useSyncExternalStore for Machine Subscription

### Status
Accepted

### Context
The `useLensState` hook needs to subscribe to XState machine state changes. React 18 provides multiple patterns for external state subscription.

### Options Considered

1. **useSyncExternalStore** — React 18 primitive for external stores
2. **useSelector from @xstate/react** — XState's built-in selector hook
3. **Manual subscription with useEffect** — Subscribe/unsubscribe in effect
4. **useReducer mirror** — Copy machine state to React state

### Decision
Use `useSyncExternalStore` for subscription, with potential fallback to `@xstate/react` hooks.

### Rationale
- `useSyncExternalStore` is the React-recommended pattern
- Handles concurrent mode correctly
- No tearing issues
- Works with any external store, not XState-specific
- @xstate/react v4 is built on this pattern anyway

```typescript
const snapshot = useSyncExternalStore(
  (callback) => actor.subscribe(callback).unsubscribe,
  () => actor.getSnapshot(),
  () => actor.getSnapshot()  // SSR fallback
);
```

### Consequences

**Positive:**
- Correct concurrent mode behavior
- React-native pattern
- No external dependency for subscription

**Negative:**
- More verbose than useSelector
- Need to handle getServerSnapshot for SSR

---

## ADR-041: Hydration Flag Pattern

### Status
Accepted

### Context
The hook must hydrate from URL or localStorage on mount, but only once. Subsequent renders should not re-trigger hydration.

### Options Considered

1. **isHydrated state flag** — Track hydration completion
2. **useRef flag** — Mutable ref to prevent re-run
3. **Empty dependency array** — Rely on [] to run once
4. **Initialization function** — useState initializer

### Decision
Use `isHydrated` state flag that gates hydration effect and is returned to consumers.

### Rationale
- Consumers need to know when hydration is complete
- State change triggers re-render with correct `isHydrated` value
- Clear debugging—can see hydration state in devtools
- Effect can check flag before running

```typescript
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  if (isHydrated) return;
  
  // ... hydration logic
  
  setIsHydrated(true);
}, [actor, isHydrated]);

return { lens, lensSource, selectLens, isHydrated };
```

### Consequences

**Positive:**
- Consumers can show loading state
- Clear hydration lifecycle
- Prevents race conditions

**Negative:**
- Extra state variable
- Extra render on hydration complete

---

## ADR-042: URL Priority Over localStorage

### Status
Accepted

### Context
Lens can come from URL parameter or localStorage. When both exist, which takes precedence?

### Options Considered

1. **URL > localStorage** — URL is explicit, intentional
2. **localStorage > URL** — User preference persists
3. **Most recent** — Track timestamps
4. **Merge** — Combine somehow

### Decision
URL parameter always takes precedence over localStorage.

### Rationale
- URL is explicit—user/system intentionally navigated there
- Enables sharing links with specific lens: `?lens=engineer`
- localStorage is convenience, not authority
- Matches user mental model—"I clicked this link for a reason"

```
Priority:
1. URL parameter (?lens=X)     → Explicit intent
2. localStorage (grove-lens)   → Session convenience
3. null                        → New user
```

### Consequences

**Positive:**
- Shareable links work correctly
- Predictable behavior
- User intent respected

**Negative:**
- Stored preference overridden by URL
- Need to handle URL removal case

---

## ADR-043: Persist Only User Selections

### Status
Accepted

### Context
When should lens be persisted to localStorage? Every change, or only certain sources?

### Options Considered

1. **Always persist** — Any lens change saves
2. **Only user selections** — source === 'selection'
3. **Never persist URL** — Skip source === 'url'
4. **Explicit persist flag** — Consumer controls

### Decision
Only persist when `lensSource === 'selection'`.

### Rationale
- URL lens shouldn't override stored preference permanently
- localStorage restoration shouldn't re-persist (no-op)
- Only deliberate user choices should persist
- Prevents accidental preference changes from links

```typescript
useEffect(() => {
  if (lens && lensSource === 'selection') {
    persistLens(lens);
  }
}, [lens, lensSource]);
```

### Consequences

**Positive:**
- User preference not silently changed by links
- Clear mental model
- No persistence loops

**Negative:**
- URL lens lost after navigation
- Slightly more complex logic

---

## ADR-044: Config-Driven Lens Validation

### Status
Accepted

### Context
Lens values must be validated. Where should valid lenses be defined?

### Options Considered

1. **Hardcoded in hook** — `['engineer', 'academic', ...]`
2. **Config file** — `config.ts` with VALID_LENSES
3. **External JSON** — `data/lenses.json`
4. **Runtime fetch** — API call for valid lenses

### Decision
Config file (`config.ts`) with exported constant.

### Rationale
- DEX compliance: config, not hardcoded
- TypeScript inference: `type ValidLens = typeof VALID_LENSES[number]`
- Easy to modify without touching hook logic
- Build-time validation
- Can be moved to JSON later if needed

```typescript
// config.ts
export const VALID_LENSES = [
  'engineer',
  'academic',
  'citizen',
  'investor',
  'policymaker',
] as const;

export type ValidLens = typeof VALID_LENSES[number];
```

### Consequences

**Positive:**
- Type-safe lens values
- Centralized configuration
- DEX compliant

**Negative:**
- Requires rebuild to add lenses
- Not runtime-configurable

---

## ADR-045: Actor Injection Pattern

### Status
Accepted

### Context
The hook needs access to the XState actor. How should it receive it?

### Options Considered

1. **Prop injection** — `useLensState({ actor })`
2. **Context provider** — `useEngagement().actor`
3. **Global singleton** — Module-level actor
4. **Create internally** — Hook creates actor

### Decision
Prop injection with required `actor` option.

### Rationale
- Explicit dependency—clear what hook needs
- Testable—easy to provide mock actor
- Flexible—works with any actor source
- No hidden dependencies
- Context provider comes in Epic 5

```typescript
interface UseLensStateOptions {
  actor: Actor<EngagementMachine>;
}

function useLensState({ actor }: UseLensStateOptions) { ... }
```

### Consequences

**Positive:**
- Testable without provider
- Explicit dependencies
- Works standalone

**Negative:**
- Consumer must manage actor
- More verbose usage

---

## ADR-046: Testing Strategy for React Hooks

### Status
Accepted

### Context
React hooks require special testing setup. What approach should we use?

### Options Considered

1. **@testing-library/react** — renderHook, act
2. **React Test Renderer** — Direct React testing
3. **Custom wrapper component** — Test via component
4. **Vitest browser mode** — Real browser

### Decision
Use @testing-library/react with renderHook for unit tests.

### Rationale
- Industry standard for hook testing
- `renderHook` isolates hook from component
- `act` handles async updates correctly
- Works well with Vitest
- E2E tests cover real browser behavior

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

test('selectLens updates machine', async () => {
  const actor = createActor(engagementMachine).start();
  const { result } = renderHook(() => useLensState({ actor }));
  
  await waitFor(() => expect(result.current.isHydrated).toBe(true));
  
  act(() => {
    result.current.selectLens('academic');
  });
  
  expect(result.current.lens).toBe('academic');
});
```

### Consequences

**Positive:**
- Standard testing pattern
- Good async handling
- Isolated hook tests

**Negative:**
- Additional dev dependency
- Some learning curve
