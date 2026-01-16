// src/core/data/grove-data-provider.ts
// Grove Data Layer - Core Interface
// Pattern 8: Unified Data Access

import type { GroveObject } from '../schema/grove-object';
import type { PatchOperation } from '../copilot/patch-generator';

/**
 * Object types managed by GroveDataProvider.
 * Maps to Supabase tables and localStorage keys.
 */
export type GroveObjectType =
  | 'lens'
  | 'journey'
  | 'node'
  | 'hub'
  | 'sprout'
  | 'card'
  | 'moment'
  | 'document'
  | 'prompt'
  | 'system-prompt'
  | 'feature-flag'
  | 'research-agent-config'
  | 'writer-agent-config'
  | 'copilot-style'
  | 'lifecycle-config'; // Sprint: S5-SL-LifecycleEngine v1

/**
 * Options for listing objects.
 */
export interface ListOptions {
  /** Filter by payload fields */
  filter?: Record<string, unknown>;
  /** Sort by field */
  sort?: { field: string; direction: 'asc' | 'desc' };
  /** Max number of results */
  limit?: number;
  /** Skip first N results */
  offset?: number;
}

/**
 * Options for creating objects.
 */
export interface CreateOptions {
  /** Trigger embedding pipeline after creation (documents only) */
  triggerEmbedding?: boolean;
}

/**
 * Unified data access interface for Grove objects.
 *
 * Implementations:
 * - LocalStorageAdapter: Development/testing with browser storage
 * - SupabaseAdapter: Production with Postgres backend
 * - HybridAdapter: Supabase + localStorage cache
 *
 * @see Pattern 8: Data Layer in PROJECT_PATTERNS.md
 */
export interface GroveDataProvider {
  /**
   * Get a single object by ID.
   * @returns The object or null if not found
   */
  get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null>;

  /**
   * List all objects of a type with optional filtering/sorting.
   */
  list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]>;

  /**
   * Create a new object.
   * @param type Object type
   * @param object The object to create (must have meta.id)
   * @param options Creation options (e.g., trigger embedding)
   */
  create<T>(
    type: GroveObjectType,
    object: GroveObject<T>,
    options?: CreateOptions
  ): Promise<GroveObject<T>>;

  /**
   * Update an object using JSON Patch operations.
   * @param type Object type
   * @param id Object ID
   * @param patches JSON Patch operations to apply
   */
  update<T>(
    type: GroveObjectType,
    id: string,
    patches: PatchOperation[]
  ): Promise<GroveObject<T>>;

  /**
   * Delete an object.
   */
  delete(type: GroveObjectType, id: string): Promise<void>;

  /**
   * Subscribe to changes for a type.
   * @returns Unsubscribe function
   */
  subscribe?<T>(
    type: GroveObjectType,
    callback: (objects: GroveObject<T>[]) => void
  ): () => void;
}

// Re-export PatchOperation for convenience
export type { PatchOperation };
