# Architecture — Epic 5: Context Provider

## Overview

The EngagementProvider creates a single machine actor and shares it via React Context. Components use the `useEngagement` hook to access the actor, then pass it to individual hooks (`useLensState`, `useJourneyState`, `useEntropyState`).

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Epic 5 Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EngagementProvider                              │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │  const actor = useActorRef(engagementMachine)               │    │   │
│   │  │                                                              │    │   │
│   │  │  return (                                                    │    │   │
│   │  │    <EngagementContext.Provider value={{ actor }}>           │    │   │
│   │  │      {children}                                              │    │   │
│   │  │    </EngagementContext.Provider>                             │    │   │
│   │  │  )                                                           │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EngagementContext                               │   │
│   │                                                                      │   │
│   │  interface EngagementContextValue {                                  │   │
│   │    actor: Actor<EngagementMachine>                                   │   │
│   │  }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        useEngagement()                               │   │
│   │                                                                      │   │
│   │  const context = useContext(EngagementContext)                       │   │
│   │  if (!context) throw new Error('...')                                │   │
│   │  return context                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│              ┌──────────────────────┼──────────────────────┐                │
│              ▼                      ▼                      ▼                │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐       │
│   │  useLensState    │   │ useJourneyState  │   │ useEntropyState  │       │
│   │  ({ actor })     │   │ ({ actor })      │   │ ({ actor })      │       │
│   └──────────────────┘   └──────────────────┘   └──────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

### context.tsx

```typescript
// src/core/engagement/context.tsx

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActorRef, type Actor } from '@xstate/react';
import { engagementMachine, type EngagementMachine } from './machine';

// Context value type
export interface EngagementContextValue {
  actor: Actor<EngagementMachine>;
}

// Context with null default (enforced via hook)
const EngagementContext = createContext<EngagementContextValue | null>(null);

// Provider props
export interface EngagementProviderProps {
  children: ReactNode;
}

// Provider component
export function EngagementProvider({ children }: EngagementProviderProps): JSX.Element {
  // useActorRef creates, starts, and manages actor lifecycle
  const actor = useActorRef(engagementMachine);

  return (
    <EngagementContext.Provider value={{ actor }}>
      {children}
    </EngagementContext.Provider>
  );
}

// Hook for accessing context
export function useEngagement(): EngagementContextValue {
  const context = useContext(EngagementContext);
  
  if (!context) {
    throw new Error(
      'useEngagement must be used within an EngagementProvider. ' +
      'Wrap your component tree with <EngagementProvider>.'
    );
  }
  
  return context;
}

// Export context for testing
export { EngagementContext };
```

## Component Lifecycle

### Actor Lifecycle

```
1. EngagementProvider mounts
   │
2. useActorRef(engagementMachine) called
   │   - Creates actor from machine
   │   - Starts actor automatically
   │   - Returns stable actor reference
   │
3. Actor available via context
   │
4. Components use useEngagement() to access
   │
5. EngagementProvider unmounts
   │
6. useActorRef cleanup runs
   │   - Stops actor automatically
```

### Consumer Access Flow

```
1. Component calls useEngagement()
   │
2. useContext(EngagementContext) returns value
   │
   ├── value exists ──► return { actor }
   │
   └── value null ───► throw Error (outside provider)
   │
3. Component passes actor to hooks:
   │   - useLensState({ actor })
   │   - useJourneyState({ actor })
   │   - useEntropyState({ actor })
   │
4. Hooks subscribe to machine via useSyncExternalStore
```

## File Organization

```
src/core/engagement/
├── index.ts              # Add context exports
├── context.tsx           # NEW
├── machine.ts            # Unchanged
├── types.ts              # Unchanged
├── config.ts             # Unchanged
├── persistence.ts        # Unchanged
└── hooks/
    ├── index.ts          # Unchanged
    ├── useLensState.ts   # Unchanged
    ├── useJourneyState.ts # Unchanged
    └── useEntropyState.ts # Unchanged

tests/unit/
├── engagement-context.test.tsx  # NEW
└── ... existing tests
```

## Test Strategy

### Unit Tests Structure

```typescript
// tests/unit/engagement-context.test.tsx

describe('EngagementProvider', () => {
  test('renders children');
  test('provides actor via context');
  test('actor is started on mount');
});

describe('useEngagement', () => {
  test('returns context value when inside provider');
  test('throws descriptive error when outside provider');
});

describe('integration', () => {
  test('multiple consumers share same actor');
  test('hooks work via useEngagement');
});
```

## Usage Patterns

### Basic Usage

```typescript
// App entry point
import { EngagementProvider } from '@/core/engagement';

function App() {
  return (
    <EngagementProvider>
      <MainContent />
    </EngagementProvider>
  );
}
```

### Component Usage

```typescript
import { 
  useEngagement, 
  useLensState, 
  useJourneyState, 
  useEntropyState 
} from '@/core/engagement';

function Terminal() {
  const { actor } = useEngagement();
  
  // All hooks share the same actor
  const lens = useLensState({ actor });
  const journey = useJourneyState({ actor });
  const entropy = useEntropyState({ actor });
  
  // Use state and actions from hooks
}
```

### Selective Hook Usage

```typescript
// Components can use only the hooks they need
function LensDisplay() {
  const { actor } = useEngagement();
  const { lens } = useLensState({ actor });
  
  return <div>Current lens: {lens}</div>;
}

function EntropyMeter() {
  const { actor } = useEngagement();
  const { entropyPercent, isHighEntropy } = useEntropyState({ actor });
  
  return <Meter value={entropyPercent} warning={isHighEntropy} />;
}
```

## Error Handling

### Missing Provider

```typescript
// Component outside provider
function Orphan() {
  const { actor } = useEngagement();  // THROWS
}

// Error message:
// "useEngagement must be used within an EngagementProvider.
//  Wrap your component tree with <EngagementProvider>."
```

### Graceful Degradation Pattern

```typescript
// Optional pattern for components that might be outside provider
function MaybeEngaged() {
  try {
    const { actor } = useEngagement();
    const lens = useLensState({ actor });
    return <EngagedView lens={lens} />;
  } catch {
    return <FallbackView />;
  }
}
```

## Performance Considerations

- Single actor instance via useActorRef
- Context value is stable object reference
- No re-renders from context changes (actor ref is stable)
- Child re-renders only when their subscribed state changes

## Integration with Existing Code

### Coexistence with NarrativeEngineContext

During migration (Epic 6), both providers can coexist:

```typescript
function App() {
  return (
    <NarrativeEngineProvider>  {/* Existing */}
      <EngagementProvider>      {/* New */}
        <MainContent />
      </EngagementProvider>
    </NarrativeEngineProvider>
  );
}
```

Components can gradually migrate from NarrativeEngineContext to useEngagement.
