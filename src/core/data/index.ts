// src/core/data/index.ts
// Grove Data Layer - Public API

// Core interface
export type {
  GroveDataProvider,
  GroveObjectType,
  ListOptions,
  CreateOptions,
  PatchOperation,
} from './grove-data-provider';

// Adapters
export { LocalStorageAdapter } from './adapters/local-storage-adapter';
export { SupabaseAdapter } from './adapters/supabase-adapter';
export type { SupabaseAdapterOptions } from './adapters/supabase-adapter';
export { HybridAdapter } from './adapters/hybrid-adapter';
export type { HybridAdapterOptions } from './adapters/hybrid-adapter';

// Context and Provider
export {
  GroveDataProviderComponent,
  useDataProvider,
  useHasDataProvider,
} from './grove-data-context';
export type { GroveDataProviderProps } from './grove-data-context';

// Hooks
export { useGroveData, useGroveObject } from './use-grove-data';
export type { UseGroveDataResult } from './use-grove-data';
export { useKnowledgeSearch } from './use-knowledge-search';
export type {
  SearchOptions,
  SearchResult,
  UseKnowledgeSearchResult,
} from './use-knowledge-search';

// Triggers
export { triggerEmbedding, checkEmbeddingHealth } from './triggers/embedding-trigger';

// Defaults
export { getDefaults } from './defaults';
