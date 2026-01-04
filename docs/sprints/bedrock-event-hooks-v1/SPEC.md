# Bedrock Event Hooks v1 — Specification

**Sprint:** bedrock-event-hooks-v1
**Depends On:** bedrock-event-architecture-v1 (✅ Complete)
**Date:** January 4, 2026
**Est. Duration:** 2 days

---

## Overview

Create React hooks that bridge the pure TypeScript event system (`src/core/events/`) to React components. These hooks provide:

1. **State Access** — Read GroveEventLog via React context
2. **Event Dispatch** — Type-safe event emission
3. **Projections** — Memoized derived state (session, context, telemetry, moments)
4. **Backward Compatibility** — Drop-in replacements for legacy hooks

---

## Goals

- [ ] React context provider for GroveEventLog
- [ ] Type-safe dispatch hook with validation
- [ ] Memoized projection hooks (no re-computation on unrelated changes)
- [ ] Backward-compatible telemetry hook for legacy consumers
- [ ] localStorage persistence with hydration

## Non-Goals

- Route integration (Sprint 3)
- Migration of existing components to new hooks (Sprint 3+)
- Real-time sync across tabs (future)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Application                            │
├─────────────────────────────────────────────────────────────────┤
│  <GroveEventProvider>                                            │
│     │                                                            │
│     ├── useGroveEvents()      → GroveEventLog (full access)     │
│     ├── useDispatch()         → dispatch(event) function         │
│     ├── useSession()          → SessionState (memoized)          │
│     ├── useContext()          → ContextState (memoized)          │
│     ├── useTelemetry()        → CumulativeMetricsV2 (compat)     │
│     └── useMomentContext()    → MomentEvaluationContext          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    src/core/events/                              │
│                                                                  │
│  Types ─► Schemas ─► Projections ─► Store                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Epics

### Epic 1: Context Provider (4 hrs)

**Goal:** Create React context for GroveEventLog with persistence

#### Story 1.1: Create GroveEventContext

**File:** `src/core/events/hooks/context.tsx`

```typescript
import { createContext, useContext } from 'react';
import type { GroveEventLog, GroveEvent } from '../types';

interface GroveEventContextValue {
  log: GroveEventLog;
  dispatch: (event: GroveEvent) => void;
}

export const GroveEventContext = createContext<GroveEventContextValue | null>(null);
```

**Acceptance Criteria:**
- [ ] Context created with proper typing
- [ ] Null default for error detection

#### Story 1.2: Create GroveEventProvider

**File:** `src/core/events/hooks/provider.tsx`

```typescript
export function GroveEventProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<GroveEventLog>(() => initializeEventLog());

  const dispatch = useCallback((event: GroveEvent) => {
    const validated = validateEvent(event);
    setLog(prev => appendEvent(prev, validated));
  }, []);

  // Persist on change
  useEffect(() => {
    persistEventLog(log);
  }, [log]);

  return (
    <GroveEventContext.Provider value={{ log, dispatch }}>
      {children}
    </GroveEventContext.Provider>
  );
}
```

**Acceptance Criteria:**
- [ ] Provider initializes from localStorage or creates fresh log
- [ ] Provider handles V2 → V3 migration on init
- [ ] Provider persists to localStorage on change
- [ ] Invalid events throw with descriptive error

#### Story 1.3: Implement initializeEventLog

**Acceptance Criteria:**
- [ ] Checks for existing V3 log
- [ ] Falls back to V2 migration if V3 not found
- [ ] Creates fresh log if no data exists
- [ ] Validates loaded data against schema

---

### Epic 2: Core Hooks (3 hrs)

**Goal:** Create base hooks for log access and dispatch

#### Story 2.1: Create useGroveEvents

**File:** `src/core/events/hooks/useGroveEvents.ts`

```typescript
export function useGroveEvents(): GroveEventLog {
  const context = useContext(GroveEventContext);
  if (!context) {
    throw new Error('useGroveEvents must be used within GroveEventProvider');
  }
  return context.log;
}
```

**Acceptance Criteria:**
- [ ] Returns full GroveEventLog
- [ ] Throws descriptive error outside provider

#### Story 2.2: Create useDispatch

**File:** `src/core/events/hooks/useDispatch.ts`

```typescript
export function useDispatch() {
  const context = useContext(GroveEventContext);
  if (!context) {
    throw new Error('useDispatch must be used within GroveEventProvider');
  }
  return context.dispatch;
}
```

**Acceptance Criteria:**
- [ ] Returns dispatch function
- [ ] Dispatch validates events via Zod
- [ ] Invalid dispatch throws ZodError

#### Story 2.3: Create useEventHelpers

**File:** `src/core/events/hooks/useEventHelpers.ts`

```typescript
export function useEventHelpers() {
  const log = useGroveEvents();
  const dispatch = useDispatch();

  return {
    emit: {
      sessionStarted: (isReturning: boolean, previousSessionId?: string) => {
        dispatch(createEventBase(log, 'SESSION_STARTED', { isReturning, previousSessionId }));
      },
      lensActivated: (lensId: string, source: LensSource, isCustom: boolean) => {
        dispatch(createEventBase(log, 'LENS_ACTIVATED', { lensId, source, isCustom }));
      },
      // ... all 15 event types
    },
  };
}
```

**Acceptance Criteria:**
- [ ] Helper methods for all 15 event types
- [ ] Auto-populates base fields (fieldId, timestamp, sessionId)
- [ ] Full TypeScript inference on parameters

---

### Epic 3: Projection Hooks (4 hrs)

**Goal:** Memoized hooks for derived state

#### Story 3.1: Create useSession

**File:** `src/core/events/hooks/useSession.ts`

```typescript
export function useSession(): SessionState {
  const log = useGroveEvents();
  return useMemo(() => projectSession(log.sessionEvents), [log.sessionEvents]);
}
```

**Acceptance Criteria:**
- [ ] Returns SessionState
- [ ] Memoized — only recomputes when sessionEvents change
- [ ] Re-exports SessionState type

#### Story 3.2: Create useContext

**File:** `src/core/events/hooks/useContext.ts`

```typescript
export function useContextState(): ContextState {
  const log = useGroveEvents();
  return useMemo(() => projectContext(log), [log]);
}
```

**Note:** Named `useContextState` to avoid collision with React's `useContext`.

**Acceptance Criteria:**
- [ ] Returns ContextState (stage, entropy, activeMoments, etc.)
- [ ] Properly memoized

#### Story 3.3: Create useTelemetry (Backward Compat)

**File:** `src/core/events/hooks/useTelemetry.ts`

```typescript
export function useTelemetry(): {
  metrics: CumulativeMetricsV2;
  computed: ComputedMetrics;
} {
  const log = useGroveEvents();

  const metrics = useMemo(() => projectToCumulativeMetricsV2(log), [log]);
  const computed = useMemo(() => projectComputedMetrics(log), [log]);

  return { metrics, computed };
}
```

**Acceptance Criteria:**
- [ ] Returns CumulativeMetricsV2 for legacy consumers
- [ ] Returns ComputedMetrics (journeysCompleted, topicsExplored, etc.)
- [ ] Drop-in compatible with existing useTelemetry consumers

#### Story 3.4: Create useMomentContext

**File:** `src/core/events/hooks/useMomentContext.ts`

```typescript
export function useMomentContext(): MomentEvaluationContext {
  const log = useGroveEvents();
  return useMemo(() => projectMomentContext(log), [log]);
}
```

**Acceptance Criteria:**
- [ ] Returns MomentEvaluationContext for moment-evaluator
- [ ] Includes all required fields (stage, flags, cooldowns, etc.)

#### Story 3.5: Create useStream

**File:** `src/core/events/hooks/useStream.ts`

```typescript
export function useStream(): StreamHistoryState {
  const log = useGroveEvents();
  return useMemo(() => projectStream(log.sessionEvents), [log.sessionEvents]);
}
```

**Acceptance Criteria:**
- [ ] Returns conversation history for UI
- [ ] Query/response pairs correctly ordered

---

### Epic 4: Index and Tests (3 hrs)

#### Story 4.1: Create hooks/index.ts

**File:** `src/core/events/hooks/index.ts`

```typescript
// Provider
export { GroveEventProvider } from './provider';
export { GroveEventContext } from './context';

// Core hooks
export { useGroveEvents } from './useGroveEvents';
export { useDispatch } from './useDispatch';
export { useEventHelpers } from './useEventHelpers';

// Projection hooks
export { useSession } from './useSession';
export { useContextState } from './useContext';
export { useTelemetry } from './useTelemetry';
export { useMomentContext } from './useMomentContext';
export { useStream } from './useStream';
```

#### Story 4.2: Update main events/index.ts

Add hooks export to main index:

```typescript
// Hooks (React)
export * from './hooks';
```

#### Story 4.3: Write Hook Tests

**File:** `tests/unit/events/hooks.test.tsx`

```typescript
describe('GroveEventProvider', () => {
  it('initializes with fresh log when no storage', () => {});
  it('loads existing V3 log from storage', () => {});
  it('migrates V2 data on first load', () => {});
});

describe('useDispatch', () => {
  it('adds valid event to log', () => {});
  it('throws on invalid event', () => {});
});

describe('useSession', () => {
  it('returns memoized session state', () => {});
  it('updates when session events change', () => {});
});

// ... tests for all hooks
```

**Acceptance Criteria:**
- [ ] Provider tests with mock localStorage
- [ ] Dispatch validation tests
- [ ] Memoization tests (verify no recompute on unrelated changes)
- [ ] All projection hooks tested

---

## File Summary

| File | Purpose |
|------|---------|
| `src/core/events/hooks/context.tsx` | React context definition |
| `src/core/events/hooks/provider.tsx` | Provider with persistence |
| `src/core/events/hooks/useGroveEvents.ts` | Full log access |
| `src/core/events/hooks/useDispatch.ts` | Event dispatch |
| `src/core/events/hooks/useEventHelpers.ts` | Typed emit helpers |
| `src/core/events/hooks/useSession.ts` | Session projection |
| `src/core/events/hooks/useContext.ts` | Context projection |
| `src/core/events/hooks/useTelemetry.ts` | V2 compat projection |
| `src/core/events/hooks/useMomentContext.ts` | Moment context projection |
| `src/core/events/hooks/useStream.ts` | Stream projection |
| `src/core/events/hooks/index.ts` | Public exports |
| `tests/unit/events/hooks.test.tsx` | Hook tests |

---

## Build Gates

### Epic 1 Complete
```bash
npx tsc --noEmit
npm run build
```

### Epic 2 Complete
```bash
npx tsc --noEmit
npm test -- tests/unit/events/hooks.test.tsx
```

### Epic 3 Complete
```bash
npx tsc --noEmit
npm test -- tests/unit/events/
```

### Sprint Complete
```bash
npm run build
npm test
npx tsc --noEmit
```

---

## Success Criteria

- [ ] All 7 hooks created and exported
- [ ] Provider handles initialization and persistence
- [ ] Dispatch validates via Zod schemas
- [ ] Projections properly memoized
- [ ] useTelemetry backward compatible
- [ ] 90%+ test coverage on hooks
- [ ] No TypeScript errors
- [ ] Build passes

---

## Notes

- Hooks are in `src/core/events/hooks/` even though they use React — they're still part of the events module's public API
- `useContextState` avoids naming collision with React's `useContext`
- Provider must wrap the app at a high level (likely in router or App.tsx)
- Sprint 3 will integrate provider into routes

---

*Generated by Foundation Loop*
