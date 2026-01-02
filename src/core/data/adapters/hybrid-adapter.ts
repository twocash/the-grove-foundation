// src/core/data/adapters/hybrid-adapter.ts
// Hybrid adapter: localStorage cache + Supabase source of truth

import type { GroveObject } from '@core/schema/grove-object';
import type {
  GroveDataProvider,
  GroveObjectType,
  ListOptions,
  CreateOptions,
  PatchOperation,
} from '../grove-data-provider';
import { LocalStorageAdapter } from './local-storage-adapter';
import { SupabaseAdapter, SupabaseAdapterOptions } from './supabase-adapter';

type Subscriber<T> = (objects: GroveObject<T>[]) => void;

/**
 * Options for HybridAdapter initialization.
 */
export interface HybridAdapterOptions extends SupabaseAdapterOptions {
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtlMs?: number;
  /** Sync interval in milliseconds (default: 30 seconds) */
  syncIntervalMs?: number;
  /** Whether to use stale cache on network error (default: true) */
  staleOnError?: boolean;
}

interface CacheMetadata {
  /** Last successful sync timestamp */
  lastSyncAt: number;
  /** Whether cache is currently valid */
  valid: boolean;
}

/**
 * Hybrid adapter combining localStorage (cache) + Supabase (source of truth).
 *
 * Strategy:
 * - READ: Return cache immediately, background sync from Supabase
 * - WRITE: Write to Supabase, update cache on success
 * - OFFLINE: Fallback to cache with stale indicator
 *
 * Best for:
 * - Production with offline support
 * - Fast initial load with eventual consistency
 */
export class HybridAdapter implements GroveDataProvider {
  private localStorage: LocalStorageAdapter;
  private supabase: SupabaseAdapter;
  private cacheTtlMs: number;
  private syncIntervalMs: number;
  private staleOnError: boolean;
  private syncIntervals = new Map<GroveObjectType, NodeJS.Timeout>();
  private cacheMetadata = new Map<GroveObjectType, CacheMetadata>();
  private subscribers = new Map<GroveObjectType, Set<Subscriber<unknown>>>();
  private isOnline = true;

  constructor(options: HybridAdapterOptions) {
    this.localStorage = new LocalStorageAdapter();
    this.supabase = new SupabaseAdapter({
      client: options.client,
      autoEmbed: options.autoEmbed,
    });
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes
    this.syncIntervalMs = options.syncIntervalMs ?? 30 * 1000; // 30 seconds
    this.staleOnError = options.staleOnError ?? true;

    // Monitor online status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncAll();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private getCacheMetadataKey(type: GroveObjectType): string {
    return `grove-cache-meta-${type}`;
  }

  private getCacheMetadata(type: GroveObjectType): CacheMetadata {
    // Check in-memory first
    const cached = this.cacheMetadata.get(type);
    if (cached) return cached;

    // Try localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.getCacheMetadataKey(type));
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CacheMetadata;
          this.cacheMetadata.set(type, parsed);
          return parsed;
        } catch {
          // Invalid cache metadata, reset
        }
      }
    }

    // Default: no valid cache
    return { lastSyncAt: 0, valid: false };
  }

  private setCacheMetadata(type: GroveObjectType, metadata: CacheMetadata): void {
    this.cacheMetadata.set(type, metadata);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getCacheMetadataKey(type), JSON.stringify(metadata));
    }
  }

  private isCacheStale(type: GroveObjectType): boolean {
    const metadata = this.getCacheMetadata(type);
    if (!metadata.valid) return true;
    return Date.now() - metadata.lastSyncAt > this.cacheTtlMs;
  }

  /**
   * Sync a type from Supabase to localStorage.
   */
  private async syncType(type: GroveObjectType): Promise<void> {
    if (!this.isOnline) return;

    try {
      const remoteData = await this.supabase.list(type);

      // Clear and repopulate cache
      await this.localStorage.clear(type);
      for (const obj of remoteData) {
        // Direct write to avoid triggering notifications per item
        const key = `grove-data-${type}-v1`;
        const current = localStorage.getItem(key);
        const items = current ? JSON.parse(current) : [];
        items.push(obj);
        localStorage.setItem(key, JSON.stringify(items));
      }

      // Update metadata
      this.setCacheMetadata(type, { lastSyncAt: Date.now(), valid: true });

      // Notify subscribers
      this.notifySubscribers(type, remoteData);

      console.log(`[HybridAdapter] Synced ${type}: ${remoteData.length} items`);
    } catch (error) {
      console.error(`[HybridAdapter] Sync failed for ${type}:`, error);
      // Don't invalidate cache on sync failure
    }
  }

  /**
   * Sync all active types.
   */
  private async syncAll(): Promise<void> {
    const types: GroveObjectType[] = [
      'lens',
      'journey',
      'hub',
      'sprout',
      'document',
      'node',
      'card',
      'moment',
    ];
    await Promise.all(types.map((type) => this.syncType(type)));
  }

  private notifySubscribers<T>(type: GroveObjectType, objects: GroveObject<T>[]): void {
    this.subscribers.get(type)?.forEach((cb) => cb(objects));
  }

  async list<T>(type: GroveObjectType, options?: ListOptions): Promise<GroveObject<T>[]> {
    // Always return cache first for instant response
    const cached = await this.localStorage.list<T>(type, options);

    // If cache is stale, trigger background sync
    if (this.isCacheStale(type)) {
      this.syncType(type).catch(() => {
        // Sync failed, but we already returned cache
      });
    }

    return cached;
  }

  async get<T>(type: GroveObjectType, id: string): Promise<GroveObject<T> | null> {
    // Try cache first
    const cached = await this.localStorage.get<T>(type, id);

    // If not in cache or cache is stale, try Supabase
    if (!cached || this.isCacheStale(type)) {
      try {
        const remote = await this.supabase.get<T>(type, id);
        if (remote) {
          // Update cache with this specific item
          const all = await this.localStorage.list<T>(type);
          const existingIndex = all.findIndex((obj) => obj.meta.id === id);
          if (existingIndex >= 0) {
            all[existingIndex] = remote;
          } else {
            all.push(remote);
          }
          const key = `grove-data-${type}-v1`;
          localStorage.setItem(key, JSON.stringify(all));
          return remote;
        }
      } catch (error) {
        console.error(`[HybridAdapter] Remote get failed for ${type}/${id}:`, error);
        // Fall through to return cache
      }
    }

    return cached;
  }

  async create<T>(
    type: GroveObjectType,
    object: GroveObject<T>,
    options?: CreateOptions
  ): Promise<GroveObject<T>> {
    // Write to Supabase first (source of truth)
    try {
      const created = await this.supabase.create<T>(type, object, options);

      // Update cache
      await this.localStorage.create<T>(type, created);

      // Notify subscribers
      const all = await this.localStorage.list<T>(type);
      this.notifySubscribers(type, all);

      return created;
    } catch (error) {
      // If Supabase fails, don't create in cache (would cause sync issues)
      console.error(`[HybridAdapter] Create failed for ${type}:`, error);
      throw error;
    }
  }

  async update<T>(
    type: GroveObjectType,
    id: string,
    patches: PatchOperation[]
  ): Promise<GroveObject<T>> {
    // Write to Supabase first
    try {
      const updated = await this.supabase.update<T>(type, id, patches);

      // Update cache
      await this.localStorage.update<T>(type, id, patches);

      // Notify subscribers
      const all = await this.localStorage.list<T>(type);
      this.notifySubscribers(type, all);

      return updated;
    } catch (error) {
      console.error(`[HybridAdapter] Update failed for ${type}/${id}:`, error);
      throw error;
    }
  }

  async delete(type: GroveObjectType, id: string): Promise<void> {
    // Delete from Supabase first
    try {
      await this.supabase.delete(type, id);

      // Delete from cache
      await this.localStorage.delete(type, id);

      // Notify subscribers
      const all = await this.localStorage.list(type);
      this.notifySubscribers(type, all);
    } catch (error) {
      console.error(`[HybridAdapter] Delete failed for ${type}/${id}:`, error);
      throw error;
    }
  }

  subscribe<T>(
    type: GroveObjectType,
    callback: (objects: GroveObject<T>[]) => void
  ): () => void {
    // Add to local subscribers
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback as Subscriber<unknown>);

    // Set up periodic sync if not already running
    if (!this.syncIntervals.has(type)) {
      const interval = setInterval(() => {
        this.syncType(type);
      }, this.syncIntervalMs);
      this.syncIntervals.set(type, interval);
    }

    // Also subscribe to Supabase realtime
    const unsubscribeSupabase = this.supabase.subscribe<T>(type, async () => {
      // On Supabase change, sync to cache and notify
      await this.syncType(type);
    });

    return () => {
      this.subscribers.get(type)?.delete(callback as Subscriber<unknown>);

      // Stop sync interval if no more subscribers
      if (this.subscribers.get(type)?.size === 0) {
        const interval = this.syncIntervals.get(type);
        if (interval) {
          clearInterval(interval);
          this.syncIntervals.delete(type);
        }
      }

      unsubscribeSupabase();
    };
  }

  /**
   * Force a sync for a specific type.
   */
  async forceSync(type: GroveObjectType): Promise<void> {
    await this.syncType(type);
  }

  /**
   * Clear all caches and metadata.
   */
  async clearCache(): Promise<void> {
    await this.localStorage.clearAll();
    this.cacheMetadata.clear();

    // Clear localStorage metadata
    if (typeof window !== 'undefined') {
      const types: GroveObjectType[] = [
        'lens',
        'journey',
        'hub',
        'sprout',
        'document',
        'node',
        'card',
        'moment',
      ];
      types.forEach((type) => {
        localStorage.removeItem(this.getCacheMetadataKey(type));
      });
    }
  }

  /**
   * Clean up resources on unmount.
   */
  dispose(): void {
    // Clear all sync intervals
    this.syncIntervals.forEach((interval) => clearInterval(interval));
    this.syncIntervals.clear();
    this.subscribers.clear();
  }
}
