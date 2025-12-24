# Architectural Decision Records — Epic 5: Context Provider

## ADR-061: Single Context Value (Actor Only)

### Status
Accepted

### Context
What should the EngagementContext provide? Just the actor, or also derived state?

### Options Considered

1. **Actor only** — `{ actor }`
2. **Actor + hooks** — `{ actor, lens, journey, entropy }`
3. **Full state** — All derived values
4. **Hooks directly** — Context provides hook results

### Decision
Provide actor only. Consumers compose hooks as needed.

### Rationale
- Minimal API surface
- No unnecessary re-renders
- Consumers decide what state they need
- Consistent with existing hook pattern
- Easy to understand

```typescript
interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}
```

### Consequences

**Positive:**
- Simple context value
- No wasted subscriptions
- Clear responsibility

**Negative:**
- Consumers must call useEngagement + hooks
- Slightly more boilerplate per component

---

## ADR-062: Throw Error When Outside Provider

### Status
Accepted

### Context
What should useEngagement do when called outside EngagementProvider?

### Options Considered

1. **Throw error** — Clear failure, good DX
2. **Return null** — Let consumer handle
3. **Return mock** — Fake actor for testing
4. **Create actor** — Each component gets own actor

### Decision
Throw descriptive error when context is null.

### Rationale
- Fail fast principle
- Clear error message guides fix
- Prevents silent bugs
- Standard React pattern
- Runtime check catches mistakes

```typescript
function useEngagement(): EngagementContextValue {
  const context = useContext(EngagementContext);
  
  if (!context) {
    throw new Error(
      'useEngagement must be used within an EngagementProvider. ' +
      'Wrap your component tree with <EngagementProvider>.'
    );
  }
  
  return context;
}
```

### Consequences

**Positive:**
- Immediate feedback on misuse
- Clear fix guidance
- No silent failures

**Negative:**
- Requires try/catch for optional usage
- Can break rendering if not wrapped

---

## ADR-063: useActorRef for Actor Management

### Status
Accepted

### Context
How should the provider create and manage the machine actor?

### Options Considered

1. **useActorRef** — XState React hook
2. **createActor + useEffect** — Manual management
3. **useMachine** — Deprecated XState v4 pattern
4. **External store** — Actor outside React

### Decision
Use `useActorRef` from `@xstate/react`.

### Rationale
- Official XState v5 pattern
- Handles lifecycle automatically
- Starts actor on mount
- Stops actor on unmount
- Stable reference across renders

```typescript
import { useActorRef } from '@xstate/react';

function EngagementProvider({ children }) {
  const actor = useActorRef(engagementMachine);
  // ...
}
```

### Consequences

**Positive:**
- Clean lifecycle management
- No manual start/stop
- Stable reference
- Tested by XState team

**Negative:**
- Dependency on @xstate/react
- Less control over timing

---

## ADR-064: 'use client' Directive

### Status
Accepted

### Context
Should the context file have the 'use client' directive for Next.js?

### Options Considered

1. **Include 'use client'** — Works in Next.js App Router
2. **No directive** — Pure React, consumer handles
3. **Separate files** — Client and server versions

### Decision
Include `'use client'` at top of context.tsx.

### Rationale
- Project uses Next.js
- Context requires client-side React
- useContext, useActorRef are client-only
- No SSR for engagement state

```typescript
'use client';

import { createContext, useContext, type ReactNode } from 'react';
```

### Consequences

**Positive:**
- Works with Next.js App Router
- Clear client boundary
- No consumer confusion

**Negative:**
- Couples to Next.js convention
- Not needed for pure React apps

---

## ADR-065: Export Context for Testing

### Status
Accepted

### Context
Should EngagementContext be exported, or only Provider and hook?

### Options Considered

1. **Export all** — Context, Provider, hook
2. **Export Provider and hook only** — Hide context
3. **Named export for testing** — Conditional export

### Decision
Export EngagementContext for testing purposes.

### Rationale
- Tests can provide custom values
- Mock actor without full provider
- Useful for unit testing
- No harm in exposing

```typescript
// Export for testing
export { EngagementContext };
```

### Consequences

**Positive:**
- Test flexibility
- Can mock context value
- Easier unit tests

**Negative:**
- Consumers might misuse
- Slightly larger API surface

---

## ADR-066: No Initial State Props on Provider

### Status
Accepted

### Context
Should EngagementProvider accept initial state props (initialLens, etc.)?

### Options Considered

1. **No props** — Hooks handle their own hydration
2. **Initial lens** — Provider hydrates lens
3. **Full initial state** — All state via props
4. **Separate InitialStateProvider** — Composition

### Decision
No initial state props. Hooks handle their own hydration.

### Rationale
- Hooks already handle URL/localStorage hydration
- Would duplicate hydration logic
- Provider should be simple
- Separation of concerns
- useLensState already handles this

```typescript
// Simple provider - no state props
interface EngagementProviderProps {
  children: ReactNode;
}
```

### Consequences

**Positive:**
- Simple provider API
- No duplicate hydration
- Clear responsibility

**Negative:**
- Can't control initial state from provider level
- Must rely on hook hydration
