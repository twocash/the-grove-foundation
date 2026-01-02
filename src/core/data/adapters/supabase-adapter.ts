// src/core/data/adapters/supabase-adapter.ts
// Supabase-backed adapter for production

import type { GroveObject } from '@core/schema/grove-object';
import type {
  GroveDataProvider,
  GroveObjectType,
  ListOptions,
  CreateOptions,
  PatchOperation,
} from '../grove-data-provider';
import { applyPatches } from '@core/copilot/patch-generator';

// Lazy import to avoid bundling server-side code in client
type SupabaseClient = import('@supabase/supabase-js').SupabaseClient;

/**
 * Table name mapping for each object type.
 * Some types share tables and are differentiated by tier/type column.
 */
const TABLE_MAP: Record<GroveObjectType, string> = {
  lens: 'lenses',
  journey: 'journeys',
  hub: 'hubs',
  sprout: 'documents', // Filter by tier = 'sprout'
  document: 'documents', // No tier filter
  node: 'journey_nodes',
  card: 'cards',
  moment: 'moments',
};

/**
 * camelCase to snake_case converter
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * snake_case to camelCase converter
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys to snake_case (for DB writes)
 */
function toSnakeCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = toSnakeCaseKeys(value as Record<string, unknown>);
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

/**
 * Convert object keys to camelCase (for DB reads)
 */
function toCamelCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = toCamelCaseKeys(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Transform database row to GroveObject
 */
function rowToGroveObject<T>(row: Record<string, unknown>): GroveObject<T> {
  const camelRow = toCamelCaseKeys(row);

  // Extract meta fields
  const meta = {
    id: camelRow.id as string,
    type: camelRow.type as string,
    title: camelRow.title as string,
    description: camelRow.description as string | undefined,
    icon: camelRow.icon as string | undefined,
    color: camelRow.color as string | undefined,
    createdAt: camelRow.createdAt as string,
    updatedAt: camelRow.updatedAt as string,
    status: camelRow.status as 'active' | 'draft' | 'archived' | 'pending' | undefined,
    tags: camelRow.tags as string[] | undefined,
    favorite: camelRow.favorite as boolean | undefined,
  };

  // Payload is stored as JSONB
  const payload = (camelRow.payload as T) || ({} as T);

  return { meta, payload };
}

/**
 * Transform GroveObject to database row
 */
function groveObjectToRow<T>(
  type: GroveObjectType,
  obj: GroveObject<T>
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: obj.meta.id,
    type: obj.meta.type || type,
    title: obj.meta.title,
    description: obj.meta.description,
    icon: obj.meta.icon,
    color: obj.meta.color,
    created_at: obj.meta.createdAt,
    updated_at: obj.meta.updatedAt,
    status: obj.meta.status || 'active',
    tags: obj.meta.tags,
    favorite: obj.meta.favorite,
    payload: obj.payload,
  };

  // Add tier for sprout type
  if (type === 'sprout') {
    row.tier = 'sprout';
  }

  return row;
}

/**
 * Options for SupabaseAdapter initialization.
 */
export interface SupabaseAdapterOptions {
  /** Supabase client instance */
  client: SupabaseClient;
  /** Trigger embedding API after document creation (default: false) */
  autoEmbed?: boolean;
}

/**
 * Supabase-backed GroveDataProvider.
 *
 * Best for:
 * - Production environments
 * - Multi-user/multi-device sync
 * - Real-time subscriptions
 *
 * Requirements:
 * - Supabase project with proper table schema
 * - Service role key for admin operations
 */
export class SupabaseAdapter implements GroveDataProvider {
  private client: SupabaseClient;
  private autoEmbed: boolean;

  constructor(options: SupabaseAdapterOptions) {
    this.client = options.client;
    this.autoEmbed = options.autoEmbed ?? false;
  }

  async list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]> {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    let query = this.client.from(table).select('*');

    // Add tier filter for sprout type
    if (type === 'sprout') {
      query = query.eq('tier', 'sprout');
    }

    // Apply filters
    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        // Check if it's a meta field or payload field
        if (['id', 'type', 'title', 'status', 'favorite'].includes(key)) {
          query = query.eq(toSnakeCase(key), value);
        } else {
          // Filter on JSONB payload field
          query = query.eq(`payload->${key}`, value);
        }
      }
    }

    // Apply sort
    if (options?.sort) {
      const column = toSnakeCase(options.sort.field);
      query = query.order(column, { ascending: options.sort.direction === 'asc' });
    } else {
      // Default sort by updated_at desc
      query = query.order('updated_at', { ascending: false });
    }

    // Apply pagination
    if (options?.limit || options?.offset) {
      const start = options.offset ?? 0;
      const end = options.limit ? start + options.limit - 1 : start + 999;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[SupabaseAdapter] list error for ${type}:`, error);
      throw new Error(`Failed to list ${type}: ${error.message}`);
    }

    return (data || []).map((row) => rowToGroveObject<T>(row as Record<string, unknown>));
  }

  async get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null> {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    let query = this.client.from(table).select('*').eq('id', id);

    // Add tier filter for sprout type
    if (type === 'sprout') {
      query = query.eq('tier', 'sprout');
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error(`[SupabaseAdapter] get error for ${type}/${id}:`, error);
      throw new Error(`Failed to get ${type}/${id}: ${error.message}`);
    }

    return data ? rowToGroveObject<T>(data as Record<string, unknown>) : null;
  }

  async create<T>(
    type: GroveObjectType,
    object: GroveObject<T>,
    options?: CreateOptions
  ): Promise<GroveObject<T>> {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    const now = new Date().toISOString();
    const withTimestamps: GroveObject<T> = {
      ...object,
      meta: {
        ...object.meta,
        createdAt: object.meta.createdAt || now,
        updatedAt: now,
      },
    };

    const row = groveObjectToRow(type, withTimestamps);
    const { data, error } = await this.client.from(table).insert(row).select().single();

    if (error) {
      console.error(`[SupabaseAdapter] create error for ${type}:`, error);
      throw new Error(`Failed to create ${type}: ${error.message}`);
    }

    const created = rowToGroveObject<T>(data as Record<string, unknown>);

    // Optionally trigger embedding pipeline
    const shouldEmbed =
      options?.triggerEmbedding ?? this.autoEmbed;
    if (shouldEmbed && (type === 'document' || type === 'sprout')) {
      this.triggerEmbedding(created.meta.id);
    }

    return created;
  }

  async update<T>(
    type: GroveObjectType,
    id: string,
    patches: PatchOperation[]
  ): Promise<GroveObject<T>> {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    // Fetch current object
    const current = await this.get<T>(type, id);
    if (!current) {
      throw new Error(`Object not found: ${type}/${id}`);
    }

    // Apply patches
    const updated = applyPatches(current, patches);
    updated.meta.updatedAt = new Date().toISOString();

    // Convert to row and update
    const row = groveObjectToRow(type, updated);
    const { data, error } = await this.client
      .from(table)
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`[SupabaseAdapter] update error for ${type}/${id}:`, error);
      throw new Error(`Failed to update ${type}/${id}: ${error.message}`);
    }

    return rowToGroveObject<T>(data as Record<string, unknown>);
  }

  async delete(type: GroveObjectType, id: string): Promise<void> {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    const { error } = await this.client.from(table).delete().eq('id', id);

    if (error) {
      console.error(`[SupabaseAdapter] delete error for ${type}/${id}:`, error);
      throw new Error(`Failed to delete ${type}/${id}: ${error.message}`);
    }
  }

  subscribe<T>(
    type: GroveObjectType,
    callback: (objects: GroveObject<T>[]) => void
  ): () => void {
    const table = TABLE_MAP[type];
    if (!table) {
      throw new Error(`Unknown object type: ${type}`);
    }

    // Set up Supabase realtime subscription
    const channel = this.client
      .channel(`grove-${type}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        async () => {
          // Refetch all on any change (simple approach)
          const objects = await this.list<T>(type);
          callback(objects);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * Trigger embedding pipeline for a document (non-blocking).
   */
  private async triggerEmbedding(documentId: string): Promise<void> {
    try {
      await fetch('/api/knowledge/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      console.log(`[SupabaseAdapter] Triggered embedding for ${documentId}`);
    } catch (error) {
      // Non-blocking - log but don't throw
      console.error('[SupabaseAdapter] Failed to trigger embedding:', error);
    }
  }
}
