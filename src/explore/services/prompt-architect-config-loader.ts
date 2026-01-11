// src/explore/services/prompt-architect-config-loader.ts
// Configuration loader for PromptArchitectConfig
// Sprint: sprout-research-v1, Phase 3b
//
// Loads the active PromptArchitectConfig for a grove.
// Falls back to defaults if no config exists.

import type { PromptArchitectConfigPayload } from '@core/schema/prompt-architect-config';
import { DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD } from '@core/schema/prompt-architect-config';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of loading a grove's config
 */
export interface ConfigLoadResult {
  /** The loaded config payload */
  config: PromptArchitectConfigPayload;

  /** Where the config came from */
  source: 'database' | 'default';

  /** Config version ID (null for default) */
  versionId: string | null;

  /** Last updated timestamp (null for default) */
  updatedAt: string | null;
}

/**
 * Error thrown when config loading fails
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly groveId: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

// =============================================================================
// In-Memory Cache
// =============================================================================

interface CacheEntry {
  result: ConfigLoadResult;
  cachedAt: number;
}

const configCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the config cache for a grove (call after updates)
 */
export function clearConfigCache(groveId?: string): void {
  if (groveId) {
    configCache.delete(groveId);
  } else {
    configCache.clear();
  }
}

/**
 * Get a cached config if still valid
 */
function getCachedConfig(groveId: string): ConfigLoadResult | null {
  const entry = configCache.get(groveId);
  if (!entry) return null;

  const age = Date.now() - entry.cachedAt;
  if (age > CACHE_TTL_MS) {
    configCache.delete(groveId);
    return null;
  }

  return entry.result;
}

/**
 * Cache a config result
 */
function setCachedConfig(groveId: string, result: ConfigLoadResult): void {
  configCache.set(groveId, {
    result,
    cachedAt: Date.now(),
  });
}

// =============================================================================
// Loader
// =============================================================================

/**
 * Load the active PromptArchitectConfig for a grove
 *
 * @param groveId - The grove ID to load config for
 * @param options - Optional settings
 * @returns The loaded config with metadata
 *
 * @example
 * const { config, source } = await loadPromptArchitectConfig('grove-123');
 * if (source === 'default') {
 *   console.log('No custom config - using defaults');
 * }
 */
export async function loadPromptArchitectConfig(
  groveId: string,
  options: {
    /** Skip cache and force fresh load */
    skipCache?: boolean;
    /** Use default without attempting database fetch */
    useDefaultOnly?: boolean;
  } = {}
): Promise<ConfigLoadResult> {
  // Check cache first
  if (!options.skipCache && !options.useDefaultOnly) {
    const cached = getCachedConfig(groveId);
    if (cached) {
      return cached;
    }
  }

  // If useDefaultOnly, return default immediately
  if (options.useDefaultOnly) {
    return {
      config: {
        ...DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
        groveId,
      },
      source: 'default',
      versionId: null,
      updatedAt: null,
    };
  }

  try {
    // TODO Phase 3+: Fetch from Supabase
    // For now, use localStorage for development
    const result = await loadFromLocalStorage(groveId);

    // Cache the result
    setCachedConfig(groveId, result);

    return result;
  } catch (error) {
    // Log error but don't fail - return default
    console.warn(
      `[PromptArchitectConfig] Failed to load config for grove ${groveId}, using defaults:`,
      error
    );

    const defaultResult: ConfigLoadResult = {
      config: {
        ...DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
        groveId,
      },
      source: 'default',
      versionId: null,
      updatedAt: null,
    };

    return defaultResult;
  }
}

/**
 * Load config from localStorage (development fallback)
 */
async function loadFromLocalStorage(groveId: string): Promise<ConfigLoadResult> {
  const storageKey = `grove-prompt-architect-config-${groveId}`;

  try {
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      // No stored config - return default
      return {
        config: {
          ...DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
          groveId,
        },
        source: 'default',
        versionId: null,
        updatedAt: null,
      };
    }

    const parsed = JSON.parse(stored);

    return {
      config: {
        ...DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
        ...parsed.payload,
        groveId, // Ensure groveId matches
      },
      source: 'database', // Treat localStorage as "database" for consistency
      versionId: parsed.versionId ?? null,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch (error) {
    // JSON parse error or other issue
    console.warn(`[PromptArchitectConfig] localStorage parse error:`, error);

    return {
      config: {
        ...DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD,
        groveId,
      },
      source: 'default',
      versionId: null,
      updatedAt: null,
    };
  }
}

/**
 * Save config to localStorage (development only)
 * In production, use Supabase directly via the Bedrock console
 */
export async function savePromptArchitectConfig(
  groveId: string,
  config: PromptArchitectConfigPayload
): Promise<{ versionId: string; updatedAt: string }> {
  const storageKey = `grove-prompt-architect-config-${groveId}`;
  const versionId = `local-${Date.now()}`;
  const updatedAt = new Date().toISOString();

  const stored = {
    payload: config,
    versionId,
    updatedAt,
  };

  localStorage.setItem(storageKey, JSON.stringify(stored));

  // Invalidate cache
  clearConfigCache(groveId);

  return { versionId, updatedAt };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a grove has a custom config (not just defaults)
 */
export async function hasCustomConfig(groveId: string): Promise<boolean> {
  const result = await loadPromptArchitectConfig(groveId);
  return result.source === 'database';
}

/**
 * Get config with guaranteed groveId match
 * Throws if groveId in config doesn't match requested groveId
 */
export async function loadAndValidateConfig(
  groveId: string
): Promise<ConfigLoadResult> {
  const result = await loadPromptArchitectConfig(groveId);

  if (result.config.groveId !== groveId) {
    throw new ConfigLoadError(
      `Config groveId mismatch: expected ${groveId}, got ${result.config.groveId}`,
      groveId
    );
  }

  return result;
}
