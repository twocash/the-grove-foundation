// src/core/data/adapters/local-storage-adapter.ts
// LocalStorage-backed adapter for development/testing

import type { GroveObject } from '@core/schema/grove-object';
import type {
  GroveDataProvider,
  GroveObjectType,
  ListOptions,
  CreateOptions,
  PatchOperation,
} from '../grove-data-provider';
import { getDefaults } from '../defaults';
import { applyPatches } from '@core/copilot/patch-generator';

type Subscriber<T> = (objects: GroveObject<T>[]) => void;

/**
 * LocalStorage-backed GroveDataProvider.
 *
 * Best for:
 * - Local development without Supabase
 * - Unit testing
 * - Offline-first fallback
 *
 * Limitations:
 * - 5MB storage limit per origin
 * - No cross-tab sync (use BroadcastChannel if needed)
 * - No real-time subscriptions (polling-based)
 */
export class LocalStorageAdapter implements GroveDataProvider {
  private subscribers = new Map<GroveObjectType, Set<Subscriber<unknown>>>();

  private getStorageKey(type: GroveObjectType): string {
    return `grove-data-${type}-v1`;
  }

  async list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]> {
    const raw = localStorage.getItem(this.getStorageKey(type));
    let objects: GroveObject<T>[] = raw ? JSON.parse(raw) : getDefaults<T>(type);

    // Apply filters if specified
    if (options?.filter) {
      objects = objects.filter((obj) => {
        return Object.entries(options.filter!).every(([key, value]) => {
          return (obj.payload as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Apply sort if specified
    if (options?.sort) {
      const { field, direction } = options.sort;
      objects.sort((a, b) => {
        const aVal = (a.payload as Record<string, unknown>)[field];
        const bVal = (b.payload as Record<string, unknown>)[field];
        if (aVal === undefined || aVal === null) return direction === 'asc' ? 1 : -1;
        if (bVal === undefined || bVal === null) return direction === 'asc' ? -1 : 1;
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options?.offset || options?.limit) {
      const start = options.offset ?? 0;
      const end = options.limit ? start + options.limit : undefined;
      objects = objects.slice(start, end);
    }

    return objects;
  }

  async get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null> {
    const all = await this.list<T>(type);
    return all.find((obj) => obj.meta.id === id) || null;
  }

  async create<T>(
    type: GroveObjectType,
    object: GroveObject<T>,
    _options?: CreateOptions
  ): Promise<GroveObject<T>> {
    const all = await this.list<T>(type);

    // Check for duplicate ID
    if (all.some((obj) => obj.meta.id === object.meta.id)) {
      throw new Error(`Object with ID ${object.meta.id} already exists`);
    }

    const now = new Date().toISOString();
    const withMeta: GroveObject<T> = {
      ...object,
      meta: {
        ...object.meta,
        createdAt: object.meta.createdAt || now,
        updatedAt: now,
      },
    };

    all.push(withMeta);
    localStorage.setItem(this.getStorageKey(type), JSON.stringify(all));
    this.notify(type, all);

    // Note: triggerEmbedding option is ignored in localStorage adapter
    // Only SupabaseAdapter supports embedding triggers

    return withMeta;
  }

  async update<T>(
    type: GroveObjectType,
    id: string,
    patches: PatchOperation[]
  ): Promise<GroveObject<T>> {
    const all = await this.list<T>(type);
    const index = all.findIndex((obj) => obj.meta.id === id);

    if (index === -1) {
      throw new Error(`Object not found: ${id}`);
    }

    const updated = applyPatches(all[index], patches);
    updated.meta.updatedAt = new Date().toISOString();
    all[index] = updated;

    localStorage.setItem(this.getStorageKey(type), JSON.stringify(all));
    this.notify(type, all);

    return updated;
  }

  async delete(type: GroveObjectType, id: string): Promise<void> {
    const all = await this.list(type);
    const filtered = all.filter((obj) => obj.meta.id !== id);

    if (filtered.length === all.length) {
      throw new Error(`Object not found: ${id}`);
    }

    localStorage.setItem(this.getStorageKey(type), JSON.stringify(filtered));
    this.notify(type, filtered);
  }

  subscribe<T>(
    type: GroveObjectType,
    callback: (objects: GroveObject<T>[]) => void
  ): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback as Subscriber<unknown>);

    return () => {
      this.subscribers.get(type)?.delete(callback as Subscriber<unknown>);
    };
  }

  private notify<T>(type: GroveObjectType, objects: GroveObject<T>[]): void {
    this.subscribers.get(type)?.forEach((cb) => cb(objects));
  }

  /**
   * Clear all data for a type (useful for testing).
   */
  async clear(type: GroveObjectType): Promise<void> {
    localStorage.removeItem(this.getStorageKey(type));
    this.notify(type, []);
  }

  /**
   * Clear all Grove data (useful for testing).
   */
  async clearAll(): Promise<void> {
    const types: GroveObjectType[] = [
      'lens',
      'journey',
      'node',
      'hub',
      'sprout',
      'card',
      'moment',
      'document',
    ];
    for (const type of types) {
      await this.clear(type);
    }
  }
}
