# Execution Prompt: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Branch:** bedrock  
**Type:** Core Infrastructure (per BEDROCK_SPRINT_CONTRACT.md v1.1 Section 6.3)

---

## Context

You are executing Sprint 3 of the Grove event system refactor. Sprints 1-2 created:
- Event types and schemas (`src/core/events/types.ts`, `schema.ts`)
- Projections for derived state
- React hooks for consumption (`src/core/events/hooks/`)

Sprint 3 wires the event system to explore routes with feature flag control and backward compatibility.

---

## Pre-Execution Checklist

- [ ] On `bedrock` branch: `git branch`
- [ ] Working tree status: `git status`
- [ ] Read SPEC.md in full
- [ ] Read ARCHITECTURE.md for data flow
- [ ] Read DECISIONS.md for pattern choices
- [ ] Read MIGRATION_MAP.md for file changes

---

## Critical Fix Required

**The existing `useEventBridge.ts` WIP has schema violations and must be discarded.**

Before starting, run:
```bash
git checkout -- src/core/events/hooks/useEventBridge.ts
```

Keep these changes (already correct):
- `ExploreEventProvider.tsx`
- Feature flag additions in schema files

---

## Epic 1: Legacy Bridge Isolation

### Goal
Extract legacy engagement bus writes to dedicated hook.

### Files to Create

**File: `src/core/events/hooks/useLegacyBridge.ts`**

Create hook that:
1. Lazy-loads legacy engagement bus
2. Provides translation methods for each event type
3. Has no knowledge of new event system
4. Is clearly marked for deprecation

Key translations:
- `onQuerySubmitted(content)` → `emit('EXCHANGE_SENT', { query: content, responseLength: 0 })`
- `onLensActivated(lensId, isCustom)` → `emit('LENS_SELECTED', { lensId, isCustom })`
- `onHubEntered(hubId, hubName)` → `emit('TOPIC_EXPLORED', {...})` + `emit('HUB_VISITED', {...})`
- `onJourneyStarted(lensId, waypointCount)` → `emit('JOURNEY_STARTED', { lensId, threadLength: waypointCount })`
- `onJourneyCompleted(lensId, durationMs, cardsVisited)` → `emit('JOURNEY_COMPLETED', {...})`
- `onInsightCaptured(sproutId)` → `emit('SPROUT_CAPTURED', { sproutId })`

### Build Gate
```bash
npx tsc --noEmit
```

---

## Epic 2: Thin Bridge Rewrite

### Goal
Rewrite useEventBridge to delegate to useEventHelpers.

### Files to Create/Modify

**File: `src/core/events/hooks/useEventBridge.ts`** (rewrite)

Pattern:
```typescript
export function useEventBridge(): EventBridgeAPI {
  const isEnabled = useIsEventSystemEnabled();
  const context = useContext(GroveEventContext);
  const isProviderAvailable = context !== null;

  // Get typed emit from Sprint 2 hooks
  let typedEmit: ReturnType<typeof useEventHelpers>['emit'];
  if (isProviderAvailable) {
    const helpers = useEventHelpers();
    typedEmit = helpers.emit;
  }

  // Get legacy bridge
  const legacy = useLegacyBridge();

  // Unified routing
  const emit = useMemo<EventBridgeEmit>(() => ({
    sessionStarted: (isReturning, previousSessionId) => {
      if (isEnabled && isProviderAvailable && typedEmit) {
        typedEmit.sessionStarted(isReturning ?? false, previousSessionId);
      }
      legacy.onSessionStarted();
    },

    querySubmitted: (queryId, content, intent, sourceResponseId) => {
      if (isEnabled && isProviderAvailable && typedEmit) {
        typedEmit.querySubmitted(queryId, content, intent, sourceResponseId);
      }
      legacy.onQuerySubmitted(content);
    },

    // ... continue for all methods in EventBridgeEmit
  }), [isEnabled, isProviderAvailable, typedEmit, legacy]);

  return { emit, isNewSystemEnabled: isEnabled, isProviderAvailable };
}
```

**Important:** Bridge must NOT create event objects. Only call `typedEmit.*` methods.

### EventBridgeEmit Interface

Match these signatures to Sprint 1 types:

```typescript
interface EventBridgeEmit {
  sessionStarted: (isReturning?: boolean, previousSessionId?: string) => void;
  querySubmitted: (queryId: string, content: string, intent?: string, sourceResponseId?: string) => void;
  responseCompleted: (responseId: string, queryId: string, hasNavigation: boolean, spanCount: number, hubId?: string, nodeId?: string) => void;
  lensActivated: (lensId: string, source: LensSource, isCustom: boolean, archetypeId?: string) => void;
  hubEntered: (hubId: string, source: HubSource, queryTrigger?: string) => void;
  journeyStarted: (journeyId: string, lensId: string, waypointCount: number) => void;
  journeyAdvanced: (journeyId: string, waypointId: string, position: number) => void;
  journeyCompleted: (journeyId: string, durationMs?: number, waypointsVisited?: number) => void;
  insightCaptured: (sproutId: string, journeyId?: string, hubId?: string, responseId?: string) => void;
}
```

### Type Imports

```typescript
type LensSource = 'url' | 'selection' | 'system' | 'localStorage';
type HubSource = 'query' | 'pivot' | 'fork' | 'navigation';
```

### Build Gate
```bash
npx tsc --noEmit
npm test -- tests/unit/events/hooks.test.tsx
```

---

## Epic 3: Update Index Exports

### File: `src/core/events/hooks/index.ts`

Add export for useLegacyBridge:

```typescript
// Integration Layer (Sprint: bedrock-event-integration-v1)
export {
  ExploreEventProvider,
  useIsEventSystemEnabled,
  GROVE_EVENT_SYSTEM_FLAG
} from './ExploreEventProvider';

export {
  useEventBridge,
  useSafeEventBridge
} from './useEventBridge';
export type { EventBridgeAPI, EventBridgeEmit } from './useEventBridge';

export { useLegacyBridge } from './useLegacyBridge';
export type { LegacyBridgeAPI } from './useLegacyBridge';
```

### Build Gate
```bash
npx tsc --noEmit
```

---

## Epic 4: Integration Tests

### File: `tests/unit/events/integration.test.tsx`

Create tests for:

1. **ExploreEventProvider**
   - Renders children when flag disabled
   - Wraps with GroveEventProvider when flag enabled
   - Respects URL param override
   - Respects localStorage override

2. **useEventBridge (new system enabled)**
   - Dispatches to provider via useEventHelpers
   - Also writes to legacy bus
   - Events validate against schema

3. **useEventBridge (new system disabled)**
   - Only writes to legacy bus
   - Doesn't throw without provider

4. **useSafeEventBridge**
   - Returns no-op emit outside providers

### Build Gate
```bash
npm test -- tests/unit/events/
```

---

## Epic 5: Sprint 2 Documentation

### File: `docs/sprints/bedrock-event-hooks-v1/DECISIONS.md`

Create retroactive decisions doc:

```markdown
# Architectural Decisions: bedrock-event-hooks-v1

## ADR-001: Hooks in src/core/events/
Hooks live with event system, not in src/hooks/.

## ADR-002: useContextState Naming
Avoids collision with React's useContext.

## ADR-003: Provider Handles Migration
V2→V3 migration in initializeEventLog.

## ADR-004: Memoization Strategy
useMemo on projections, not on log access.
```

### Update: `docs/sprints/bedrock-event-hooks-v1/SPEC.md`

Add DEX compliance matrix after Overview section.

---

## Bedrock Verification

Per BEDROCK_SPRINT_CONTRACT.md v1.1 Section 6.3:

**Before starting:**
- [x] Constitutional Reference checked
- [x] DEX Compliance Matrix in SPEC.md
- [x] Pattern Check via REPO_AUDIT.md

**After each epic:**
- [ ] `npx tsc --noEmit` passes
- [ ] No imports from `src/foundation/`
- [ ] Events use MetricAttribution base (Sprint 1)

**Final verification:**
- [ ] All events dispatch via useEventHelpers (no raw objects)
- [ ] Feature flag controls behavior declaratively
- [ ] Legacy dual-write isolated in useLegacyBridge.ts
- [ ] All tests pass: `npm test -- tests/unit/events/`

---

## Final Commit

After all epics complete:

```bash
git add -A
git commit -m "feat(events): bedrock-event-integration-v1 - thin bridge pattern

Integration layer for explore routes:
- ExploreEventProvider with feature flag control
- useEventBridge thin routing (delegates to useEventHelpers)  
- useLegacyBridge for backward compat dual-write
- Integration tests (ExploreEventProvider, bridge, legacy)
- Sprint 2 retroactive documentation

Fixes:
- Discarded WIP with schema violations
- Bridge now delegates (no raw event creation)
- Correct event type mappings per Sprint 1 schema

DEX Compliance:
- ✅ Declarative Sovereignty: Feature flag control
- ✅ Capability Agnosticism: No model dependency
- ✅ Provenance as Infrastructure: Via useEventHelpers
- ✅ Organic Scalability: Bridge delegates, new events auto-available

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push origin bedrock
```

---

## Success Criteria

- [ ] `useLegacyBridge.ts` created with all translations
- [ ] `useEventBridge.ts` rewritten with thin bridge pattern
- [ ] No Zod validation errors when dispatching events
- [ ] Feature flag enables/disables new system
- [ ] Legacy bus receives translated events
- [ ] All 25+ event tests pass
- [ ] Integration tests pass
- [ ] Clean build: `npm run build`
- [ ] Clean types: `npx tsc --noEmit`

---

## Reference Files

| File | Purpose |
|------|---------|
| `src/core/events/types.ts` | Event type definitions (Sprint 1) |
| `src/core/events/schema.ts` | Zod validation (Sprint 1) |
| `src/core/events/hooks/useEventHelpers.ts` | Typed emit methods (Sprint 2) |
| `src/core/events/hooks/ExploreEventProvider.tsx` | Feature flag wrapper (keep) |

---

*Execute in order: Epic 1 → 2 → 3 → 4 → 5 → Final Commit*
