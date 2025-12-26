// src/core/versioning/store.ts
// Abstract interface for versioned object storage

import type { GroveObject } from '../schema/grove-object';
import type { JsonPatch } from '../copilot/schema';
import type { ObjectVersion, VersionActor, VersionSource, StoredObject } from './schema';

export interface ListVersionsOptions {
  /** Maximum versions to return. Default: 50 */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order. Default: 'desc' (newest first) */
  order?: 'asc' | 'desc';
}

/**
 * Abstract interface for versioned object storage.
 *
 * This abstraction enables:
 * 1. Current: IndexedDB + localStorage implementation
 * 2. Future: A2UI data model integration
 * 3. Future: Cloud sync layer
 */
export interface VersionedObjectStore {
  /** Initialize storage (open database, etc.) */
  initialize(): Promise<void>;

  /** Get object with current state and version metadata */
  get(objectId: string): Promise<StoredObject | null>;

  /** Get a specific version record */
  getVersion(versionId: string): Promise<ObjectVersion | null>;

  /** List versions for an object */
  listVersions(objectId: string, options?: ListVersionsOptions): Promise<ObjectVersion[]>;

  /** Apply a patch, creating a new version. Returns the created version. */
  applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;

  /** Import an object (creates baseline v1) */
  importObject(object: GroveObject, actor: VersionActor): Promise<ObjectVersion>;

  /** Prune old versions, keeping the N most recent. Returns count pruned. */
  pruneVersions(objectId: string, keepCount: number): Promise<number>;

  /** Clear all stored data */
  clear(): Promise<void>;
}

// Singleton store instance
let storeInstance: VersionedObjectStore | null = null;
let initPromise: Promise<VersionedObjectStore> | null = null;

/**
 * Get the versioned object store singleton.
 * Lazily initializes with IndexedDB implementation.
 */
export async function getVersionedObjectStore(): Promise<VersionedObjectStore> {
  if (storeInstance) return storeInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Dynamic import to avoid circular dependencies
    const { IndexedDBVersionStore } = await import('./indexeddb');
    storeInstance = new IndexedDBVersionStore();
    await storeInstance.initialize();
    return storeInstance;
  })();

  return initPromise;
}

/**
 * Set the store instance (for testing or alternative implementations)
 */
export function setVersionedObjectStore(store: VersionedObjectStore): void {
  storeInstance = store;
  initPromise = null;
}

/**
 * Reset the store instance (for testing)
 */
export function resetVersionedObjectStore(): void {
  storeInstance = null;
  initPromise = null;
}
