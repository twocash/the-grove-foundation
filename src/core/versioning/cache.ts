// src/core/versioning/cache.ts
// localStorage caching layer for fast reads

import type { StoredObject } from './schema';

const CACHE_PREFIX = 'grove:objects:';

/**
 * Get cached stored object.
 * Returns null if not in cache or in SSR environment.
 */
export function getCached(objectId: string): StoredObject | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = `${CACHE_PREFIX}${objectId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set cached stored object.
 * Stores current state + metadata, NOT full version history.
 */
export function setCache(objectId: string, obj: StoredObject): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${CACHE_PREFIX}${objectId}`;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (error) {
    // Storage full or other error - cache is optional
    console.warn('Failed to cache object:', error);
  }
}

/**
 * Clear cache for a single object.
 */
export function clearCache(objectId: string): void {
  if (typeof window === 'undefined') return;

  const key = `${CACHE_PREFIX}${objectId}`;
  localStorage.removeItem(key);
}

/**
 * Clear all versioned object cache.
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
