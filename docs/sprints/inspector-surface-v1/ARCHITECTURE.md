# Architecture: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Date:** 2024-12-26

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        INSPECTOR SURFACE ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         COMPONENT LAYER                                  │ │
│  │  ┌─────────────────┐                                                    │ │
│  │  │ JourneyInspector│                                                    │ │
│  │  │ LensInspector   │  ──► InspectorSurfaceProvider                      │ │
│  │  └─────────────────┘              │                                     │ │
│  │                                   ▼                                     │ │
│  │                      ┌───────────────────────┐                          │ │
│  │                      │   ObjectInspector     │                          │ │
│  │                      │   useInspectorSurface │                          │ │
│  │                      └───────────────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         SURFACE LAYER (New)                              │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│ │
│  │  │                    InspectorSurface (interface)                     ││ │
│  │  │  dataModel | getValue | setValue | dispatchAction | applyPatch      ││ │
│  │  └─────────────────────────────────────────────────────────────────────┘│ │
│  │                                      │                                   │ │
│  │                                      ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐│ │
│  │  │                 ReactInspectorSurface (implementation)              ││ │
│  │  │  Wraps: useCopilot + useVersionedObject                             ││ │
│  │  └─────────────────────────────────────────────────────────────────────┘│ │
│  │                                                                          │ │
│  │  Future: A2UIInspectorSurface (if protocol matures)                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         EXISTING LAYERS                                  │ │
│  │                                                                          │ │
│  │  useCopilot ───────► Copilot Parser/Generator                           │ │
│  │  useVersionedObject ───────► VersionedObjectStore                       │ │
│  │                                     │                                    │ │
│  │                                     ▼                                    │ │
│  │                              IndexedDB + Cache                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Interface declares operations; implementation executes. Future implementations can use different execution strategies. |
| **Capability Agnosticism** | Same interface works with React hooks or A2UI or any future renderer. Components don't know which. |
| **Provenance** | `applyPatch` requires actor/source; versioning layer handles persistence. |
| **Organic Scalability** | Interface can grow (new methods) without breaking existing implementations. |

---

## Component Design

### 1. Types (src/shared/inspector/surface/types.ts)

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
 * Each action may trigger UI updates, API calls, or state transitions.
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
// VERSION INFO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Version metadata for display.
 */
export interface VersionInfo {
  ordinal: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL INFO
// ═══════════════════════════════════════════════════════════════════════════

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
 * The interface is designed to map cleanly to A2UI concepts:
 * - dataModel → A2UI data model state
 * - getValue/setValue → A2UI JSON Pointer binding resolution
 * - dispatchAction → A2UI userAction dispatch
 * - onAction → A2UI action handler subscription
 * 
 * Grove-specific extensions (versioning, copilot) extend beyond A2UI
 * but could be implemented as A2UI extensions.
 * 
 * @template T - Payload type of the GroveObject
 */
export interface InspectorSurface<T = unknown> {
  // ═══════════════════════════════════════════════════════════════
  // DATA MODEL
  // A2UI: dataModel state, updateDataModel
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Current object state.
   * A2UI: Corresponds to the data model state.
   */
  readonly dataModel: GroveObject<T>;
  
  /**
   * Replace the entire data model.
   * A2UI: Corresponds to updateDataModel.
   */
  setDataModel(model: GroveObject<T>): void;
  
  /**
   * Get value at a JSON Pointer path (RFC 6901).
   * A2UI: Automatic binding resolution.
   * 
   * @param path - JSON Pointer path (e.g., "/meta/title")
   * @returns Value at path, or undefined if not found
   */
  getValue(path: string): unknown;
  
  /**
   * Set value at a JSON Pointer path (RFC 6901).
   * A2UI: Two-way binding update.
   * 
   * @param path - JSON Pointer path
   * @param value - Value to set
   */
  setValue(path: string, value: unknown): void;
  
  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // A2UI: userAction dispatch and handling
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Dispatch an action to the surface.
   * A2UI: Corresponds to userAction dispatch.
   * 
   * @param action - The action to dispatch
   */
  dispatchAction(action: InspectorAction): void;
  
  /**
   * Subscribe to actions dispatched to the surface.
   * A2UI: Action handler registration.
   * 
   * @param handler - Function called when action is dispatched
   * @returns Unsubscribe function
   */
  onAction(handler: ActionHandler): () => void;
  
  // ═══════════════════════════════════════════════════════════════
  // VERSIONING (Grove extension)
  // A2UI: Could be implemented as mutation + response pattern
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Current version metadata.
   * null if object hasn't been saved yet.
   */
  readonly version: VersionInfo | null;
  
  /**
   * Apply a JSON Patch with full provenance tracking.
   * Creates a new version in the versioning store.
   * 
   * @param patch - RFC 6902 JSON Patch
   * @param actor - Who is making this change
   * @param source - How this change was made
   * @param message - Optional change description
   * @returns The created version
   */
  applyPatch(
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  // ═══════════════════════════════════════════════════════════════
  // COPILOT (Grove extension)
  // A2UI: Could be implemented as chat component
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Copilot chat message history.
   */
  readonly messages: CopilotMessage[];
  
  /**
   * Current model information.
   */
  readonly currentModel: ModelInfo;
  
  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Whether the surface is loading initial data.
   */
  readonly loading: boolean;
  
  /**
   * Error encountered during operations.
   */
  readonly error: Error | null;
  
  /**
   * Initialize the surface.
   * Loads data from versioned store, sets up subscriptions.
   */
  initialize(): Promise<void>;
  
  /**
   * Dispose the surface.
   * Unsubscribes from events, cleans up resources.
   */
  dispose(): void;
}
```

### 2. React Implementation (src/shared/inspector/surface/ReactInspectorSurface.ts)

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
import { CopilotMessage, CopilotState } from '../hooks/useCopilot';
import { getSessionId } from '../../../core/engagement/persistence';

/**
 * Configuration for ReactInspectorSurface.
 */
export interface ReactInspectorSurfaceConfig<T> {
  objectId: string;
  initialObject: GroveObject<T>;
  onStateChange: () => void;  // Trigger React re-render
}

/**
 * React implementation of InspectorSurface.
 * 
 * This class wraps the existing hooks (useCopilot, useVersionedObject)
 * behind the InspectorSurface interface, enabling future renderer swaps.
 * 
 * NOTE: This is a class, not a hook. It's instantiated by the provider
 * and exposed via context. React state updates are triggered via the
 * onStateChange callback.
 */
export class ReactInspectorSurface<T = unknown> implements InspectorSurface<T> {
  // Configuration
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
  
  // ═══════════════════════════════════════════════════════════════
  // DATA MODEL
  // ═══════════════════════════════════════════════════════════════
  
  get dataModel(): GroveObject<T> {
    return this._dataModel;
  }
  
  setDataModel(model: GroveObject<T>): void {
    this._dataModel = model;
    this.notifyChange();
  }
  
  getValue(path: string): unknown {
    // Parse JSON Pointer path
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
    // This creates a patch and applies it
    const patch: JsonPatch = [
      { op: 'replace', path, value }
    ];
    
    // Apply immediately to local state
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
  
  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════
  
  dispatchAction(action: InspectorAction): void {
    // Notify all handlers
    this.actionHandlers.forEach(handler => {
      try {
        handler(action);
      } catch (error) {
        console.error('Action handler error:', error);
      }
    });
    
    // Handle internal actions
    this.handleAction(action);
  }
  
  onAction(handler: ActionHandler): () => void {
    this.actionHandlers.add(handler);
    return () => {
      this.actionHandlers.delete(handler);
    };
  }
  
  private handleAction(action: InspectorAction): void {
    switch (action.type) {
      case 'CLEAR_HISTORY':
        this._messages = [];
        this.notifyChange();
        break;
      case 'SET_MODEL':
        // For now, only simulated model
        break;
      // SEND_MESSAGE, APPLY_PATCH, REJECT_PATCH handled by Copilot hook
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // VERSIONING
  // ═══════════════════════════════════════════════════════════════
  
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
    
    // Reload from store to get updated state
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
  
  // ═══════════════════════════════════════════════════════════════
  // COPILOT
  // ═══════════════════════════════════════════════════════════════
  
  get messages(): CopilotMessage[] {
    return this._messages;
  }
  
  get currentModel(): ModelInfo {
    return this._currentModel;
  }
  
  // Method to update messages (called by Copilot integration)
  updateMessages(messages: CopilotMessage[]): void {
    this._messages = messages;
    this.notifyChange();
  }
  
  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════
  
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
      
      // Try to load from store
      let stored = await store.get(this.config.objectId);
      
      // Auto-import if not found
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
  
  // ═══════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════
  
  private notifyChange(): void {
    if (!this.disposed) {
      this.config.onStateChange();
    }
  }
}
```

### 3. Context (src/shared/inspector/surface/context.tsx)

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

// Context with undefined default (must be used within provider)
const InspectorSurfaceContext = createContext<InspectorSurface | undefined>(undefined);

/**
 * Props for InspectorSurfaceProvider.
 */
export interface InspectorSurfaceProviderProps {
  objectId: string;
  initialObject: GroveObject;
  children: React.ReactNode;
}

/**
 * Provider that creates and manages an InspectorSurface instance.
 */
export function InspectorSurfaceProvider({
  objectId,
  initialObject,
  children
}: InspectorSurfaceProviderProps) {
  // Force re-render when surface state changes
  const [, forceUpdate] = useState({});
  
  // Create surface instance (stable across renders)
  const surfaceRef = useRef<ReactInspectorSurface | null>(null);
  
  if (!surfaceRef.current) {
    surfaceRef.current = new ReactInspectorSurface({
      objectId,
      initialObject,
      onStateChange: () => forceUpdate({})
    });
  }
  
  const surface = surfaceRef.current;
  
  // Initialize on mount
  useEffect(() => {
    surface.initialize();
    
    return () => {
      surface.dispose();
    };
  }, [surface]);
  
  return (
    <InspectorSurfaceContext.Provider value={surface}>
      {children}
    </InspectorSurfaceContext.Provider>
  );
}

/**
 * Hook to consume InspectorSurface from context.
 * Throws if used outside of InspectorSurfaceProvider.
 */
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

### 4. Index (src/shared/inspector/surface/index.ts)

```typescript
// src/shared/inspector/surface/index.ts
// Public exports for inspector surface

// Types
export type { 
  InspectorSurface, 
  InspectorAction, 
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';

// React implementation
export { ReactInspectorSurface } from './ReactInspectorSurface';
export type { ReactInspectorSurfaceConfig } from './ReactInspectorSurface';

// Context
export { 
  InspectorSurfaceProvider, 
  useInspectorSurface 
} from './context';
export type { InspectorSurfaceProviderProps } from './context';
```

---

## Data Flow

### Action Dispatch Flow

```
1. User clicks "Send" in Copilot input
2. ObjectInspector calls surface.dispatchAction({ type: 'SEND_MESSAGE', content })
3. ReactInspectorSurface notifies all actionHandlers
4. Copilot integration handles SEND_MESSAGE:
   - Parses intent
   - Generates patch
   - Updates messages
5. Surface.updateMessages() called
6. onStateChange triggers React re-render
7. UI updates with new message
```

### Apply Patch Flow

```
1. User clicks "Apply" on patch preview
2. ObjectInspector calls surface.dispatchAction({ type: 'APPLY_PATCH', messageId })
3. Copilot integration receives action:
   - Gets patch from message
   - Calls surface.applyPatch(patch, actor, source)
4. ReactInspectorSurface:
   - Calls VersionedObjectStore.applyPatch()
   - Reloads object from store
   - Updates _dataModel and _version
   - Calls notifyChange()
5. React re-renders with updated data
```

---

## A2UI Migration Path

If A2UI matures and we decide to adopt:

### Step 1: Create A2UIInspectorSurface

```typescript
class A2UIInspectorSurface<T> implements InspectorSurface<T> {
  private a2uiApp: A2UIApplication;
  
  get dataModel() {
    return this.a2uiApp.getDataModel();
  }
  
  dispatchAction(action: InspectorAction) {
    this.a2uiApp.dispatch({
      type: 'userAction',
      action: mapToA2UIAction(action)
    });
  }
  
  // ... etc
}
```

### Step 2: Swap in Provider

```typescript
// Change from:
surfaceRef.current = new ReactInspectorSurface(config);

// To:
surfaceRef.current = new A2UIInspectorSurface(config);
```

### Step 3: Components Unchanged

All components using `useInspectorSurface()` continue to work unchanged.

---

*Canonical location: `docs/sprints/inspector-surface-v1/ARCHITECTURE.md`*
