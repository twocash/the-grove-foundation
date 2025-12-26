# Specification: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Status:** Final  
**Author:** Claude + Jim Calhoun  
**Date:** 2024-12-26

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Data abstraction | Pattern 2: State Management | Surface owns state coordination |
| Component decoupling | Pattern 6: Component Composition | Surface enables clean composition |
| Canonical operations | Pattern 8: Canonical Source | Surface is canonical for Inspector data ops |

## New Patterns Proposed

### Proposed: Surface Abstraction Pattern

**Why existing patterns are insufficient:**
- No existing pattern for abstracting React hooks behind an interface
- Need swappable implementations (React now, potentially A2UI later)
- Testing requires mocking individual hooks; surface provides single mock point

**DEX compliance:**
- **Declarative Sovereignty:** Interface defines operations declaratively; implementation handles execution
- **Capability Agnosticism:** Same interface works regardless of underlying renderer
- **Provenance:** Versioning operations preserve full provenance chain
- **Organic Scalability:** Interface can grow (new methods) without breaking implementations

---

## Requirements

### R1: InspectorSurface Interface

**R1.1:** Interface MUST define data model operations:
- `dataModel: GroveObject<T>` — Current object state (readonly)
- `setDataModel(model)` — Replace entire model
- `getValue(path: string)` — Get value at JSON Pointer path
- `setValue(path: string, value)` — Set value at JSON Pointer path

**R1.2:** Interface MUST define action operations:
- `dispatchAction(action: InspectorAction)` — Dispatch action
- `onAction(handler): () => void` — Subscribe to actions, returns unsubscribe

**R1.3:** Interface MUST define versioning operations:
- `version: VersionInfo | null` — Current version metadata
- `applyPatch(patch, actor, source, message?)` — Apply patch with provenance

**R1.4:** Interface MUST define lifecycle operations:
- `loading: boolean` — Loading state
- `error: Error | null` — Error state
- `initialize(): Promise<void>` — Initialize surface
- `dispose(): void` — Cleanup

**R1.5:** Interface MUST define Copilot operations:
- `messages: CopilotMessage[]` — Chat history
- `currentModel: ModelInfo` — Current model info

**R1.6:** All interface methods MUST have JSDoc comments with A2UI mapping notes.

### R2: Action Types

**R2.1:** InspectorAction MUST be a discriminated union:
```typescript
type InspectorAction =
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'APPLY_PATCH'; messageId: string }
  | { type: 'REJECT_PATCH'; messageId: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MODEL'; modelId: string };
```

**R2.2:** Action types MUST be extensible for future operations.

### R3: ReactInspectorSurface Implementation

**R3.1:** Implementation MUST wrap existing hooks:
- `useCopilot` for message/action handling
- `useVersionedObject` for data/versioning

**R3.2:** Implementation MUST NOT duplicate hook logic—only coordinate.

**R3.3:** Implementation MUST be a class (not hook) to allow instance methods.

**R3.4:** Implementation MUST memoize expensive operations.

### R4: Context Provider

**R4.1:** `InspectorSurfaceProvider` MUST create and provide surface instance.

**R4.2:** Provider MUST accept props:
- `objectId: string` — Object being inspected
- `initialObject: GroveObject` — Fallback object
- `children: ReactNode`

**R4.3:** Provider MUST initialize surface on mount.

**R4.4:** Provider MUST dispose surface on unmount.

### R5: Consumer Hook

**R5.1:** `useInspectorSurface()` MUST return the surface from context.

**R5.2:** Hook MUST throw if used outside provider.

### R6: Component Integration

**R6.1:** `ObjectInspector` MUST consume surface via `useInspectorSurface()`.

**R6.2:** `ObjectInspector` MUST NOT directly import `useCopilot` or `useVersionedObject`.

**R6.3:** Parent components (`JourneyInspector`, `LensInspector`) MUST wrap with provider.

### R7: Behavior Preservation

**R7.1:** All existing Inspector functionality MUST be preserved.

**R7.2:** No user-visible changes.

**R7.3:** All existing tests MUST continue to pass.

---

## Interface Definition

```typescript
/**
 * Abstract surface for Inspector interactions.
 * 
 * This interface enables:
 * 1. Current: React implementation via hooks
 * 2. Future: A2UI implementation if protocol matures
 * 3. Testing: Mock implementations for unit tests
 */
interface InspectorSurface<T = unknown> {
  // ═══════════════════════════════════════════════════════════════
  // DATA MODEL
  // A2UI: dataModel state, updateDataModel
  // ═══════════════════════════════════════════════════════════════
  
  readonly dataModel: GroveObject<T>;
  setDataModel(model: GroveObject<T>): void;
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void;
  
  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // A2UI: userAction dispatch
  // ═══════════════════════════════════════════════════════════════
  
  dispatchAction(action: InspectorAction): void;
  onAction(handler: ActionHandler): () => void;
  
  // ═══════════════════════════════════════════════════════════════
  // VERSIONING (Grove extension)
  // ═══════════════════════════════════════════════════════════════
  
  readonly version: VersionInfo | null;
  applyPatch(
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  // ═══════════════════════════════════════════════════════════════
  // COPILOT (Grove extension)
  // ═══════════════════════════════════════════════════════════════
  
  readonly messages: CopilotMessage[];
  readonly currentModel: ModelInfo;
  
  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  
  readonly loading: boolean;
  readonly error: Error | null;
  initialize(): Promise<void>;
  dispose(): void;
}
```

---

## Acceptance Criteria

### P0: Must Have

- [ ] `InspectorSurface` interface defined with JSDoc
- [ ] `ReactInspectorSurface` implements interface
- [ ] `InspectorSurfaceProvider` creates and provides surface
- [ ] `useInspectorSurface` hook consumes from context
- [ ] `ObjectInspector` uses surface instead of direct hooks
- [ ] All existing behavior preserved
- [ ] A2UI mapping documented in comments

### P1: Should Have

- [ ] Unit tests for `ReactInspectorSurface`
- [ ] `JourneyInspector` wrapped with provider
- [ ] `LensInspector` wrapped with provider

### P2: Nice to Have

- [ ] Example mock surface for testing documentation
- [ ] Performance comparison (before/after)

---

*Canonical location: `docs/sprints/inspector-surface-v1/SPEC.md`*
