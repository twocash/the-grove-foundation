// src/bedrock/consoles/PromptWorkshop/utils/libraryPromptOverrides.ts
// localStorage-based status overrides for library prompts
// Sprint: prompt-library-deactivation-v1
//
// Library prompts are shipped with Grove as static JSON files.
// This utility allows users to override their status (active/draft)
// without modifying the source files.

const STORAGE_KEY = 'grove-library-prompt-overrides';

export interface LibraryPromptOverride {
  status: 'active' | 'draft';
  updatedAt: string;
}

export type LibraryPromptOverrides = Record<string, LibraryPromptOverride>;

/**
 * Get all library prompt status overrides from localStorage
 */
export function getLibraryPromptOverrides(): LibraryPromptOverrides {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as LibraryPromptOverrides;
  } catch (e) {
    console.warn('[LibraryPromptOverrides] Failed to parse stored overrides:', e);
    return {};
  }
}

/**
 * Custom event name for library prompt override changes
 * Used to notify React components of localStorage changes
 */
export const LIBRARY_OVERRIDE_EVENT = 'grove-library-prompt-override';

/**
 * Set a status override for a library prompt
 * Dispatches a custom event to notify React components of the change
 */
export function setLibraryPromptOverride(
  promptId: string,
  status: 'active' | 'draft'
): void {
  if (typeof window === 'undefined') return;

  const overrides = getLibraryPromptOverrides();
  overrides[promptId] = {
    status,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));

  // Dispatch custom event to notify React components
  window.dispatchEvent(new CustomEvent(LIBRARY_OVERRIDE_EVENT, {
    detail: { promptId, status }
  }));
}

/**
 * Remove a status override for a library prompt (revert to default)
 */
export function removeLibraryPromptOverride(promptId: string): void {
  if (typeof window === 'undefined') return;

  const overrides = getLibraryPromptOverrides();
  delete overrides[promptId];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/**
 * Get the effective status for a library prompt
 * Returns the override status if one exists, otherwise the default status
 */
export function getEffectiveStatus(
  promptId: string,
  defaultStatus: 'active' | 'draft' = 'active'
): 'active' | 'draft' {
  const overrides = getLibraryPromptOverrides();
  return overrides[promptId]?.status ?? defaultStatus;
}

/**
 * Check if a library prompt has a status override
 */
export function hasOverride(promptId: string): boolean {
  const overrides = getLibraryPromptOverrides();
  return promptId in overrides;
}
