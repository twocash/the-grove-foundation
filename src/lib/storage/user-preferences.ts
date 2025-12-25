// src/lib/storage/user-preferences.ts
// User-local preferences storage (Pattern 7: Object Model)

const STORAGE_PREFIX = 'grove:';
const FAVORITES_KEY = `${STORAGE_PREFIX}favorites`;
const TAGS_KEY = `${STORAGE_PREFIX}user-tags`;
const MAX_FAVORITES = 1000;

/**
 * Get all favorited object IDs
 */
export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Check if an object is favorited
 */
export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

/**
 * Set favorite status for an object
 */
export function setFavorite(id: string, favorite: boolean): void {
  if (typeof window === 'undefined') return;

  const favorites = getFavorites();

  if (favorite && !favorites.includes(id)) {
    const updated = [id, ...favorites].slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } else if (!favorite && favorites.includes(id)) {
    const updated = favorites.filter(f => f !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id: string): boolean {
  const current = isFavorite(id);
  setFavorite(id, !current);
  return !current;
}

/**
 * Get user-defined tags for an object
 */
export function getUserTags(id: string): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TAGS_KEY);
  const allTags: Record<string, string[]> = stored ? JSON.parse(stored) : {};
  return allTags[id] ?? [];
}

/**
 * Set user-defined tags for an object
 */
export function setUserTags(id: string, tags: string[]): void {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(TAGS_KEY);
  const allTags: Record<string, string[]> = stored ? JSON.parse(stored) : {};
  allTags[id] = tags;
  localStorage.setItem(TAGS_KEY, JSON.stringify(allTags));
}
