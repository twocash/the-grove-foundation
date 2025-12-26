// src/shared/inspector/surface/ReactInspectorSurface.ts
// React implementation of InspectorSurface

import type {
  InspectorSurface,
  InspectorAction,
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';
import type { GroveObject } from '@core/schema/grove-object';
import type { JsonPatch, CopilotMessage } from '@core/copilot/schema';
import type { VersionActor, VersionSource, ObjectVersion } from '@core/versioning';
import { getVersionedObjectStore } from '@core/versioning';

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
    const store = await getVersionedObjectStore();

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
      const store = await getVersionedObjectStore();

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
