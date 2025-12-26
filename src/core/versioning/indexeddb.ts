// src/core/versioning/indexeddb.ts
// IndexedDB implementation of VersionedObjectStore

import type { VersionedObjectStore, ListVersionsOptions } from './store';
import type { ObjectVersion, StoredObject, VersionActor, VersionSource } from './schema';
import type { JsonPatch } from '../copilot/schema';
import type { GroveObject } from '../schema/grove-object';
import { applyPatch } from 'fast-json-patch';
import { generateUUID } from './utils';
import { getCached, setCache, clearAllCache } from './cache';

const DB_NAME = 'grove-versioning';
const DB_VERSION = 1;
const OBJECTS_STORE = 'objects';
const VERSIONS_STORE = 'versions';

/**
 * MVP version limit per object.
 *
 * This is a pragmatic constraint for the MVP, not an architectural limitation.
 * Future versions may support:
 * - Configurable retention policies
 * - Unlimited history with archival
 * - Time-based retention
 */
const VERSION_LIMIT = 50;

export class IndexedDBVersionStore implements VersionedObjectStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.openDatabase().then((db) => {
      this.db = db;
    });

    return this.initPromise;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Objects store: keyed by objectId
        if (!db.objectStoreNames.contains(OBJECTS_STORE)) {
          db.createObjectStore(OBJECTS_STORE, { keyPath: 'current.meta.id' });
        }

        // Versions store: keyed by versionId, indexed by objectId
        if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
          const versionsStore = db.createObjectStore(VERSIONS_STORE, { keyPath: 'versionId' });
          versionsStore.createIndex('objectId', 'objectId', { unique: false });
          versionsStore.createIndex('objectId_ordinal', ['objectId', 'ordinal'], { unique: true });
        }
      };
    });
  }

  async get(objectId: string): Promise<StoredObject | null> {
    // Try cache first
    const cached = getCached(objectId);
    if (cached) return cached;

    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(OBJECTS_STORE, 'readonly');
      const store = tx.objectStore(OBJECTS_STORE);
      const request = store.get(objectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as StoredObject | undefined;
        if (result) {
          setCache(objectId, result);
        }
        resolve(result ?? null);
      };
    });
  }

  async getVersion(versionId: string): Promise<ObjectVersion | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readonly');
      const store = tx.objectStore(VERSIONS_STORE);
      const request = store.get(versionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async listVersions(objectId: string, options: ListVersionsOptions = {}): Promise<ObjectVersion[]> {
    const { limit = 50, offset = 0, order = 'desc' } = options;

    await this.initialize();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readonly');
      const store = tx.objectStore(VERSIONS_STORE);
      const index = store.index('objectId');
      const request = index.getAll(IDBKeyRange.only(objectId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let versions = request.result as ObjectVersion[];

        // Sort by ordinal
        versions.sort((a, b) =>
          order === 'desc' ? b.ordinal - a.ordinal : a.ordinal - b.ordinal
        );

        // Apply pagination
        versions = versions.slice(offset, offset + limit);

        resolve(versions);
      };
    });
  }

  async applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    // Get current object
    const stored = await this.get(objectId);
    if (!stored) {
      throw new Error(`Object not found: ${objectId}`);
    }

    // Apply patch to get new state (deep clone first)
    const newState = JSON.parse(JSON.stringify(stored.current));
    applyPatch(newState, patch);

    // Create version record
    const version: ObjectVersion = {
      versionId: generateUUID(),
      objectId,
      objectType: stored.current.meta.type,
      ordinal: stored.versionCount + 1,
      createdAt: new Date().toISOString(),
      actor,
      source,
      patch,
      previousVersionId: stored.currentVersionId,
      message,
    };

    // Update stored object
    const updated: StoredObject = {
      current: newState,
      currentVersionId: version.versionId,
      versionCount: version.ordinal,
      lastModifiedAt: version.createdAt,
      lastModifiedBy: actor,
    };

    // Write both in a transaction
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(VERSIONS_STORE).put(version);
      tx.objectStore(OBJECTS_STORE).put(updated);
    });

    // Update cache
    setCache(objectId, updated);

    // Prune if over limit
    // MVP: 50 version limit. This is a pragmatic constraint.
    // Future versions may support configurable retention.
    if (version.ordinal > VERSION_LIMIT) {
      // Fire and forget - don't block on pruning
      this.pruneVersions(objectId, VERSION_LIMIT).catch(console.error);
    }

    return version;
  }

  async importObject(object: GroveObject, actor: VersionActor): Promise<ObjectVersion> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const objectId = object.meta.id;

    // Check if already exists
    const existing = await this.get(objectId);
    if (existing) {
      // Already imported, return current version info
      const versions = await this.listVersions(objectId, { limit: 1 });
      if (versions.length > 0) {
        return versions[0];
      }
    }

    // Create baseline version
    const version: ObjectVersion = {
      versionId: generateUUID(),
      objectId,
      objectType: object.meta.type,
      ordinal: 1,
      createdAt: new Date().toISOString(),
      actor: { type: 'system', model: null },
      source: { type: 'import' },
      patch: [], // Empty patch for baseline
      previousVersionId: null,
      message: 'Initial import from system configuration',
    };

    // Create stored object
    const stored: StoredObject = {
      current: object,
      currentVersionId: version.versionId,
      versionCount: 1,
      lastModifiedAt: version.createdAt,
      lastModifiedBy: version.actor,
    };

    // Write both
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(VERSIONS_STORE).put(version);
      tx.objectStore(OBJECTS_STORE).put(stored);
    });

    // Update cache
    setCache(objectId, stored);

    return version;
  }

  async pruneVersions(objectId: string, keepCount: number): Promise<number> {
    await this.initialize();
    if (!this.db) return 0;

    const allVersions = await this.listVersions(objectId, {
      limit: 1000,
      order: 'desc',
    });

    if (allVersions.length <= keepCount) {
      return 0;
    }

    const toPrune = allVersions.slice(keepCount);

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readwrite');
      const store = tx.objectStore(VERSIONS_STORE);

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      for (const version of toPrune) {
        store.delete(version.versionId);
      }
    });

    return toPrune.length;
  }

  async clear(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');

      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(OBJECTS_STORE).clear();
      tx.objectStore(VERSIONS_STORE).clear();
    });

    // Clear all cache
    clearAllCache();
  }
}
