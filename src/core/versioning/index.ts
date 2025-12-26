// src/core/versioning/index.ts
// Public API for versioning module

// Types
export type {
  HybridModelId,
  VersionActor,
  VersionSource,
  ObjectVersion,
  StoredObject,
} from './schema';

export { getActorLabel, getModelLabel } from './schema';

// Interface
export type { ListVersionsOptions, VersionedObjectStore } from './store';
export { getVersionedObjectStore, setVersionedObjectStore, resetVersionedObjectStore } from './store';

// Implementation
export { IndexedDBVersionStore } from './indexeddb';

// Utilities
export { generateUUID, formatRelativeTime, generateChangeMessage } from './utils';

// Cache utilities
export { getCached, setCache, clearCache, clearAllCache } from './cache';
