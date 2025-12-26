# Execution Prompt: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Status:** Ready for Execution  
**Prerequisite:** object-versioning-v1 must be complete  
**Estimated:** 3-4 hours

---

## Context

You are implementing a thin abstraction layer (InspectorSurface) between Inspector UI components and data/versioning operations. This enables:

1. Future A2UI adoption without rewriting components
2. Better testability (mock surface instead of hooks)
3. Clear contract documentation

**Key Constraint:** No behavior changes. All existing functionality must be preserved.

**Key Files to Reference:**
- `docs/sprints/inspector-surface-v1/ARCHITECTURE.md` — Full design with code
- `docs/sprints/inspector-surface-v1/DECISIONS.md` — ADRs
- `docs/sprints/inspector-surface-v1/MIGRATION_MAP.md` — Before/after

---

## Pre-Execution Checklist

```bash
cd C:\GitHub\the-grove-foundation

# Verify object-versioning-v1 is complete
ls src/core/versioning/
# Should see: schema.ts, store.ts, indexeddb.ts, cache.ts, utils.ts, index.ts

git checkout main
git pull
git checkout -b feature/inspector-surface-v1

npm run build
npm test
```

---

## Epic 1: Types & Interface

### File: src/shared/inspector/surface/types.ts

```typescript
// src/shared/inspector/surface/types.ts
// InspectorSurface interface and related types

import { GroveObject } from '../../../core/schema/grove-object';
import { JsonPatch } from '../../../core/copilot/schema';
import { 
  VersionActor, 
  VersionSource, 
  ObjectVersion 
} from '../../../core/versioning';
import { CopilotMessage } from '../hooks/useCopilot';

// ═══════════════════════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Actions that can be dispatched to the Inspector surface.
 * 
 * A2UI Mapping: These correspond to userAction types in A2UI.
 */
export type InspectorAction =
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'APPLY_PATCH'; messageId: string }
  | { type: 'REJECT_PATCH'; messageId: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MODEL'; modelId: string };

/**
 * Handler for Inspector actions.
 */
export type ActionHandler = (action: InspectorAction) => void;

// ═══════════════════════════════════════════════════════════════════════════
// INFO TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Version metadata for display.
 */
export interface VersionInfo {
  ordinal: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}

/**
 * Current model information for display.
 */
export interface ModelInfo {
  id: string;
  label: string;
  isSimulated: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// INSPECTOR SURFACE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Abstract surface for Inspector interactions.
 * 
 * This interface enables:
 * 1. Current: React implementation via hooks (ReactInspectorSurface)
 * 2. Future: A2UI implementation if protocol matures
 * 3. Testing: Mock implementations for unit tests
 * 
 * ## A2UI Compatibility
 * 
 * - dataModel → A2UI data model state
 * - getValue/setValue → A2UI JSON Pointer binding
 * - dispatchAction → A2UI userAction dispatch
 * - onAction → A2UI action handler subscription
 * 
 * @template T - Payload type of the GroveObject
 */
export interface InspectorSurface<T = unknown> {
  // ═══════════════════════════════════════════════════════════════
  // DATA MODEL (A2UI: dataModel state)
  // ═══════════════════════════════════════════════════════════════
  
  /** Current object state */
  readonly dataModel: GroveObject<T>;
  
  /** Replace entire data model */
  setDataModel(model: GroveObject<T>): void;
  
  /** Get value at JSON Pointer path (RFC 6901) */
  getValue(path: string): unknown;
  
  /** Set value at JSON Pointer path */
  setValue(path: string, value: unknown): void;
  
  // ═══════════════════════════════════════════════════════════════
  // ACTIONS (A2UI: userAction)
  // ═══════════════════════════════════════════════════════════════
  
  /** Dispatch an action */
  dispatchAction(action: InspectorAction): void;
  
  /** Subscribe to actions. Returns unsubscribe function. */
  onAction(handler: ActionHandler): () => void;
  
  // ═══════════════════════════════════════════════════════════════
  // VERSIONING (Grove extension)
  // ═══════════════════════════════════════════════════════════════
  
  /** Current version metadata (null if unsaved) */
  readonly version: VersionInfo | null;
  
  /** Apply patch with provenance */
  applyPatch(
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  // ═══════════════════════════════════════════════════════════════
  // COPILOT (Grove extension)
  // ═══════════════════════════════════════════════════════════════
  
  /** Chat message history */
  readonly messages: CopilotMessage[];
  
  /** Current model info */
  readonly currentModel: ModelInfo;
  
  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  
  /** Loading state */
  readonly loading: boolean;
  
  /** Error state */
  readonly error: Error | null;
  
  /** Initialize surface */
  initialize(): Promise<void>;
  
  /** Cleanup */
  dispose(): void;
}
```

### Build Gate: Epic 1

```bash
npm run build
```

---

## Epic 2: React Implementation

### File: src/shared/inspector/surface/ReactInspectorSurface.ts

```typescript
// src/shared/inspector/surface/ReactInspectorSurface.ts
// React implementation of InspectorSurface

import { 
  InspectorSurface, 
  InspectorAction, 
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';
import { GroveObject } from '../../../core/schema/grove-object';
import { JsonPatch } from '../../../core/copilot/schema';
import { 
  VersionActor, 
  VersionSource, 
  ObjectVersion,
  getVersionedObjectStore 
} from '../../../core/versioning';
import { CopilotMessage } from '../hooks/useCopilot';

/**
 * Configuration for ReactInspectorSurface.
 */
export interface ReactInspectorSurfaceConfig<T> {
  objectId: string;
  initialObject: GroveObject<T>;
  onStateChange: () => void;
}

/**
 * React implementation of InspectorSurface.
 * Wraps existing hooks behind the interface for future renderer swaps.
 */
export class ReactInspectorSurface<T = unknown> implements InspectorSurface<T> {
  private config: ReactInspectorSurfaceConfig<T>;
  
  // State
  private _dataModel: GroveObject<T>;
  private _version: VersionInfo | null = null;
  private _messages: CopilotMessage[] = [];
  private _currentModel: ModelInfo = {
    id: 'hybrid-local',
    label: 'Local 7B (Simulated)',
    isSimulated: true
  };
  private _loading: boolean = true;
  private _error: Error | null = null;
  
  // Subscriptions
  private actionHandlers: Set<ActionHandler> = new Set();
  private disposed: boolean = false;
  
  constructor(config: ReactInspectorSurfaceConfig<T>) {
    this.config = config;
    this._dataModel = config.initialObject;
  }
  
  // DATA MODEL
  
  get dataModel(): GroveObject<T> {
    return this._dataModel;
  }
  
  setDataModel(model: GroveObject<T>): void {
    this._dataModel = model;
    this.notifyChange();
  }
  
  getValue(path: string): unknown {
    const segments = path.split('/').filter(Boolean);
    let current: unknown = this._dataModel;
    
    for (const segment of segments) {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    
    return current;
  }
  
  setValue(path: string, value: unknown): void {
    const newModel = JSON.parse(JSON.stringify(this._dataModel));
    const segments = path.split('/').filter(Boolean);
    let current = newModel;
    
    for (let i = 0; i < segments.length - 1; i++) {
      current = current[segments[i]];
    }
    
    current[segments[segments.length - 1]] = value;
    this._dataModel = newModel;
    this.notifyChange();
  }
  
  // ACTIONS
  
  dispatchAction(action: InspectorAction): void {
    this.actionHandlers.forEach(handler => {
      try {
        handler(action);
      } catch (error) {
        console.error('Action handler error:', error);
      }
    });
    
    this.handleInternalAction(action);
  }
  
  onAction(handler: ActionHandler): () => void {
    this.actionHandlers.add(handler);
    return () => this.actionHandlers.delete(handler);
  }
  
  private handleInternalAction(action: InspectorAction): void {
    switch (action.type) {
      case 'CLEAR_HISTORY':
        this._messages = [];
        this.notifyChange();
        break;
    }
  }
  
  // VERSIONING
  
  get version(): VersionInfo | null {
    return this._version;
  }
  
  async applyPatch(
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion> {
    const store = getVersionedObjectStore();
    
    const version = await store.applyPatch(
      this.config.objectId,
      patch,
      actor,
      source,
      message
    );
    
    const stored = await store.get(this.config.objectId);
    if (stored) {
      this._dataModel = stored.current as GroveObject<T>;
      this._version = {
        ordinal: stored.versionCount,
        lastModifiedAt: stored.lastModifiedAt,
        lastModifiedBy: stored.lastModifiedBy
      };
    }
    
    this.notifyChange();
    return version;
  }
  
  // COPILOT
  
  get messages(): CopilotMessage[] {
    return this._messages;
  }
  
  get currentModel(): ModelInfo {
    return this._currentModel;
  }
  
  updateMessages(messages: CopilotMessage[]): void {
    this._messages = messages;
    this.notifyChange();
  }
  
  // LIFECYCLE
  
  get loading(): boolean {
    return this._loading;
  }
  
  get error(): Error | null {
    return this._error;
  }
  
  async initialize(): Promise<void> {
    if (this.disposed) return;
    
    try {
      const store = getVersionedObjectStore();
      await store.initialize();
      
      let stored = await store.get(this.config.objectId);
      
      if (!stored) {
        await store.importObject(this.config.initialObject, {
          type: 'system',
          model: null
        });
        stored = await store.get(this.config.objectId);
      }
      
      if (stored) {
        this._dataModel = stored.current as GroveObject<T>;
        this._version = {
          ordinal: stored.versionCount,
          lastModifiedAt: stored.lastModifiedAt,
          lastModifiedBy: stored.lastModifiedBy
        };
      }
      
      this._loading = false;
      this.notifyChange();
    } catch (error) {
      this._error = error instanceof Error ? error : new Error(String(error));
      this._loading = false;
      this.notifyChange();
    }
  }
  
  dispose(): void {
    this.disposed = true;
    this.actionHandlers.clear();
  }
  
  // INTERNAL
  
  private notifyChange(): void {
    if (!this.disposed) {
      this.config.onStateChange();
    }
  }
}
```

### Build Gate: Epic 2

```bash
npm run build
```

---

## Epic 3: Context & Provider

### File: src/shared/inspector/surface/context.tsx

```typescript
// src/shared/inspector/surface/context.tsx
// React context for InspectorSurface

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState,
  useRef
} from 'react';
import { InspectorSurface } from './types';
import { ReactInspectorSurface } from './ReactInspectorSurface';
import { GroveObject } from '../../../core/schema/grove-object';

const InspectorSurfaceContext = createContext<InspectorSurface | undefined>(undefined);

export interface InspectorSurfaceProviderProps {
  objectId: string;
  initialObject: GroveObject;
  children: React.ReactNode;
}

export function InspectorSurfaceProvider({
  objectId,
  initialObject,
  children
}: InspectorSurfaceProviderProps) {
  const [, forceUpdate] = useState({});
  
  const surfaceRef = useRef<ReactInspectorSurface | null>(null);
  
  if (!surfaceRef.current) {
    surfaceRef.current = new ReactInspectorSurface({
      objectId,
      initialObject,
      onStateChange: () => forceUpdate({})
    });
  }
  
  const surface = surfaceRef.current;
  
  useEffect(() => {
    surface.initialize();
    return () => surface.dispose();
  }, [surface]);
  
  return (
    <InspectorSurfaceContext.Provider value={surface}>
      {children}
    </InspectorSurfaceContext.Provider>
  );
}

export function useInspectorSurface<T = unknown>(): InspectorSurface<T> {
  const surface = useContext(InspectorSurfaceContext);
  
  if (!surface) {
    throw new Error(
      'useInspectorSurface must be used within an InspectorSurfaceProvider'
    );
  }
  
  return surface as InspectorSurface<T>;
}
```

### File: src/shared/inspector/surface/index.ts

```typescript
// src/shared/inspector/surface/index.ts

export type { 
  InspectorSurface, 
  InspectorAction, 
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';

export { ReactInspectorSurface } from './ReactInspectorSurface';
export type { ReactInspectorSurfaceConfig } from './ReactInspectorSurface';

export { 
  InspectorSurfaceProvider, 
  useInspectorSurface 
} from './context';
export type { InspectorSurfaceProviderProps } from './context';
```

### Build Gate: Epic 3

```bash
npm run build
```

---

## Epic 4: Wire ObjectInspector

Update `src/shared/inspector/ObjectInspector.tsx` to consume surface from context.

**Key Changes:**
1. Remove direct hook imports (`useCopilot`, `useVersionedObject`)
2. Add `useInspectorSurface()` call
3. Replace hook references with surface properties
4. Update handlers to use `surface.dispatchAction()`

See MIGRATION_MAP.md for detailed before/after code.

### Build Gate: Epic 4

```bash
npm run build
npm test
# Manual: Inspector renders, Copilot works
```

---

## Epic 5: Wire Parent Inspectors

Update `JourneyInspector.tsx` and `LensInspector.tsx` to wrap with provider.

See MIGRATION_MAP.md for code changes.

### Build Gate: Epic 5

```bash
npm run build
npm test
npm run lint
```

---

## Final Verification

```bash
# Full build
npm run build
npm test
npm run lint

# Manual QA
# [ ] Open journey inspector
# [ ] Send Copilot message
# [ ] Apply patch
# [ ] Verify version indicator updates
# [ ] Refresh page
# [ ] Verify persistence
# [ ] Open lens inspector
# [ ] Repeat above
```

---

## Commit Strategy

```bash
# After Epic 1
git add src/shared/inspector/surface/types.ts
git commit -m "feat(inspector): add InspectorSurface interface"

# After Epic 2
git add src/shared/inspector/surface/ReactInspectorSurface.ts
git commit -m "feat(inspector): add ReactInspectorSurface implementation"

# After Epic 3
git add src/shared/inspector/surface/
git commit -m "feat(inspector): add surface context and provider"

# After Epic 4-5
git add src/shared/inspector/ src/explore/
git commit -m "refactor(inspector): wire components through surface"

# Final
git push -u origin feature/inspector-surface-v1
```

---

## Troubleshooting

### "useInspectorSurface must be used within provider"
- Ensure parent component (JourneyInspector, LensInspector) wraps with provider

### Surface not initializing
- Check console for errors
- Verify object-versioning-v1 is complete

### Actions not dispatching
- Check action handler subscription
- Verify action type matches exactly

---

*Canonical location: `docs/sprints/inspector-surface-v1/EXECUTION_PROMPT.md`*
