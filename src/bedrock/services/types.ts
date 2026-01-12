// src/bedrock/services/types.ts
// Console Factory v2 - Service Layer Contracts
// Sprint: unified-experience-console-v1 (Console Factory v2)
//
// DEX Principle: Capability Agnosticism
// Service contracts work regardless of backend (MCP, REST, mock, etc.)

// =============================================================================
// Service Response Types
// =============================================================================

/**
 * Standard response wrapper for all service operations
 * Provides consistent error handling across the service layer
 */
export interface ServiceResponse<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The returned data (if success) */
  data?: T;
  /** Error message (if failure) */
  error?: string;
  /** Optional metadata about the operation */
  meta?: {
    /** Timestamp of operation */
    timestamp?: string;
    /** Duration in milliseconds */
    duration?: number;
    /** Source of data (cache, network, etc.) */
    source?: 'cache' | 'network' | 'mock';
  };
}

// =============================================================================
// Data Service Interface
// =============================================================================

/**
 * Generic data service interface
 * All console data services implement this contract
 *
 * @template T - The entity type managed by this service
 */
export interface IDataService<T> {
  /**
   * Fetch all entities
   * @returns Array of all entities
   */
  getAll(): Promise<T[]>;

  /**
   * Fetch a single entity by ID
   * @param id - Entity identifier
   * @returns The entity or null if not found
   */
  getById(id: string): Promise<T | null>;

  /**
   * Update an existing entity
   * @param id - Entity identifier
   * @param updates - Partial entity with fields to update
   * @returns ServiceResponse with updated entity
   */
  update(id: string, updates: Partial<T>): Promise<ServiceResponse<T>>;

  /**
   * Create a new entity
   * @param newItem - Entity data (without ID, which will be generated)
   * @returns ServiceResponse with created entity (including generated ID)
   */
  create(newItem: Omit<T, 'id'>): Promise<ServiceResponse<T>>;

  /**
   * Delete an entity
   * @param id - Entity identifier
   * @returns ServiceResponse indicating success/failure
   */
  delete(id: string): Promise<ServiceResponse<void>>;
}

// =============================================================================
// Extended Service Interface
// =============================================================================

/**
 * Extended data service with filtering and search capabilities
 * Optional interface for services that support advanced queries
 *
 * @template T - The entity type managed by this service
 */
export interface IQueryableDataService<T> extends IDataService<T> {
  /**
   * Search entities with filters
   * @param filters - Key-value pairs for filtering
   * @returns Filtered array of entities
   */
  search(filters: Record<string, unknown>): Promise<T[]>;

  /**
   * Count entities matching filters
   * @param filters - Optional filters
   * @returns Count of matching entities
   */
  count(filters?: Record<string, unknown>): Promise<number>;
}

// =============================================================================
// Service Registry Type
// =============================================================================

/**
 * Maps console IDs to their data services
 * Used by useConsoleData hook to resolve the correct service
 */
export type ServiceRegistry = Record<string, IDataService<unknown>>;

// =============================================================================
// Entity Base Type
// =============================================================================

/**
 * Base interface for all console entities
 * Ensures consistent ID field across all data types
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
}

/**
 * Entity with standard metadata fields
 */
export interface EntityWithMeta extends BaseEntity {
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Entity status */
  status?: 'active' | 'inactive' | 'archived';
}

// =============================================================================
// Draft State Types
// =============================================================================

/**
 * State for buffered editing with dirty tracking
 * Used by useDraftState hook
 */
export interface DraftState<T> {
  /** Original entity data (before edits) */
  original: T | null;
  /** Current draft with pending changes */
  draft: T | null;
  /** Whether draft differs from original */
  isDirty: boolean;
  /** Fields that have been modified */
  dirtyFields: Set<keyof T>;
}

/**
 * Actions for draft state management
 */
export interface DraftActions<T> {
  /** Load entity into draft state */
  load: (entity: T) => void;
  /** Update draft field */
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Reset draft to original */
  reset: () => void;
  /** Clear draft state entirely */
  clear: () => void;
  /** Get changes as partial object */
  getChanges: () => Partial<T>;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if response indicates success
 */
export function isSuccessResponse<T>(
  response: ServiceResponse<T>
): response is ServiceResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}

/**
 * Check if entity has base fields
 */
export function isBaseEntity(value: unknown): value is BaseEntity {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BaseEntity).id === 'string'
  );
}
