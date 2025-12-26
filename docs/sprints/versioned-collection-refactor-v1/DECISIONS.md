# Architectural Decisions: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## ADR-001: Generic Hook Over Type-Specific Hooks

### Context
Currently we have `useVersionedPersonas` and `useVersionedJourneys` with 90%+ code duplication.

### Decision
Create single `useVersionedCollection<T>()` generic hook.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Keep separate hooks** | Simpler types | DRY violation, harder to extend |
| **HOC pattern** | Familiar React pattern | More complex, wrapping overhead |
| **Generic hook** ✓ | Single source of truth, easy to extend | TypeScript generics complexity |

### Consequences
- Adding new versioned collection = one config entry
- TypeScript generics require `extends { id: string }` constraint
- Slightly more abstract code

---

## ADR-002: Declarative Merge Configuration

### Context
Current merge logic hardcodes field mappings:
```typescript
publicLabel: (versionedMeta.title as string) || schemaPersona.publicLabel,
```

### Decision
Use declarative `MERGE_CONFIGS` registry mapping object types to field mappings.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Hardcoded per type** | Simple, explicit | Violates DEX, code changes for new types |
| **Callback function** | Flexible | Still code, not config |
| **Declarative config** ✓ | DEX compliant, extensible | Requires type registry |

### Consequences
- Adding new type = add config entry (no code changes)
- Field mappings are discoverable and auditable
- Slightly more indirection

---

## ADR-003: Event-Driven Refresh Over Imperative Effect

### Context
Current pattern:
```typescript
useEffect(() => {
  if (!inspectorOpen) refresh();
}, [inspectorOpen]);
```

This fires on mount and watches the wrong signal.

### Decision
Add `onInspectorClosed` event to WorkspaceUIContext.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Keep imperative effect** | No context changes | Fires on mount, wrong abstraction |
| **useRef to track transition** | Fixes mount issue | Still imperative, scattered logic |
| **Event emission** ✓ | Precise timing, clean abstraction | Adds event system to context |

### Consequences
- Refresh only fires when inspector actually closes
- Pattern is reusable for other inspector lifecycle hooks
- Minimal event API (just one event for now)

---

## ADR-004: Simple Event Emitter Over Full Pub/Sub

### Context
Need to notify consumers when inspector closes.

### Decision
Use simple `Set<() => void>` for callbacks, not full pub/sub library.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Full pub/sub (EventEmitter)** | Feature-rich | Overkill for one event |
| **RxJS Subject** | Reactive, composable | Heavy dependency |
| **Simple Set callbacks** ✓ | Minimal, sufficient | Limited features |

### Consequences
- Zero new dependencies
- Simple API: `onInspectorClosed(cb) → unsubscribe`
- If we need more events later, can upgrade to EventEmitter

---

## ADR-005: Keep WorkspaceUIContext Over Creating New Context

### Context
Could create a dedicated `InspectorEventsContext` for the event system.

### Decision
Add events to existing `WorkspaceUIContext`.

### Rationale
- Inspector state already lives in WorkspaceUIContext
- Keeps related functionality together
- Avoids context proliferation

### Consequences
- WorkspaceUIContext grows slightly
- Single source of truth for inspector state + events
