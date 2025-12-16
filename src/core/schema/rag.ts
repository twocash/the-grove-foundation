// src/core/schema/rag.ts
// RAG (Retrieval-Augmented Generation) type definitions
// No React dependencies - pure TypeScript types

// ============================================================================
// HUBS MANIFEST (GCS: knowledge/hubs.json)
// ============================================================================

/**
 * Declarative manifest for tiered RAG context loading.
 * Stored in GCS at knowledge/hubs.json
 * Cached server-side with event-driven invalidation.
 */
export interface HubsManifest {
  version: '1.0';
  description?: string;

  /** Tier 1: Always loaded for every query (~15KB) */
  defaultContext: DefaultContextConfig;

  /** Tier 2: Loaded when query matches hub tags */
  hubs: Record<string, HubConfig>;

  /** Optional metadata for tooling */
  _meta?: ManifestMeta;
}

/**
 * Configuration for default (Tier 1) context.
 * Always loaded regardless of query content.
 */
export interface DefaultContextConfig {
  /** GCS path prefix (e.g., "_default/") */
  path: string;

  /** Maximum bytes to load from default context */
  maxBytes: number;

  /** Files to load in order */
  files: string[];
}

/**
 * Configuration for a single topic hub (Tier 2).
 * Loaded when user query matches hub tags.
 */
export interface HubConfig {
  /** Display title for admin UI */
  title: string;

  /** GCS path prefix (e.g., "hubs/ratchet-effect/") */
  path: string;

  /** Maximum bytes to load for this hub */
  maxBytes: number;

  /** Primary knowledge file - loaded first */
  primaryFile: string;

  /** Supporting files - loaded after primary, in order */
  supportingFiles: string[];

  /** Tags for matching against TopicHub schema (validation) */
  tags: string[];

  /** Optional notes for admin reference */
  notes?: string;

  /** Optional trigger conditions for special hubs (e.g., meta-philosophy) */
  triggerConditions?: HubTriggerConditions;
}

/**
 * Special trigger conditions for hubs that require
 * more than simple keyword matching.
 */
export interface HubTriggerConditions {
  description: string;
  indicators: string[];
}

/**
 * Manifest metadata for tooling and debugging.
 */
export interface ManifestMeta {
  lastUpdated?: string;
  totalHubs?: number;
  notes?: string[];
  /** Mapping from clean file names to hashed GCS file names */
  gcsFileMapping?: Record<string, string>;
}

// ============================================================================
// RAG LOADING RESULTS
// ============================================================================

/**
 * Result from tiered context loading.
 * Returned by ragLoader.buildTieredContext()
 */
export interface TieredContextResult {
  /** Combined context string for system prompt */
  context: string;

  /** Bytes loaded from Tier 1 (default) */
  tier1Bytes: number;

  /** Bytes loaded from Tier 2 (matched hub) */
  tier2Bytes: number;

  /** Total bytes loaded */
  totalBytes: number;

  /** Hub ID that matched, or null if no match */
  matchedHub: string | null;

  /** List of files that were loaded */
  filesLoaded: string[];

  /** Tags that matched the query (for debugging) */
  matchedTags?: string[];
}

/**
 * Individual file load result for detailed tracking.
 */
export interface FileLoadResult {
  /** File path relative to knowledge/ */
  path: string;

  /** Bytes loaded */
  bytes: number;

  /** Whether file was truncated due to budget */
  truncated: boolean;

  /** Error message if load failed */
  error?: string;
}

// ============================================================================
// RAG LOADER OPTIONS
// ============================================================================

/**
 * Options for building tiered context.
 */
export interface TieredContextOptions {
  /** User's query message */
  message: string;

  /** Explicit hub IDs to load (bypasses routing) */
  contextHubs?: string[];

  /** Whether to auto-detect hubs from query (default: true) */
  autoDetectHubs?: boolean;

  /** Override default context budget */
  tier1Budget?: number;

  /** Override hub context budget */
  tier2Budget?: number;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Server-side manifest cache entry.
 */
export interface ManifestCacheEntry {
  manifest: HubsManifest;
  loadedAt: number;
  expiresAt: number;
}

/**
 * File content cache entry.
 */
export interface FileContentCacheEntry {
  content: string;
  bytes: number;
  loadedAt: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to validate HubsManifest structure.
 */
export function isValidHubsManifest(obj: unknown): obj is HubsManifest {
  if (typeof obj !== 'object' || obj === null) return false;

  const manifest = obj as Record<string, unknown>;

  // Check version
  if (manifest.version !== '1.0') return false;

  // Check defaultContext
  if (typeof manifest.defaultContext !== 'object' || manifest.defaultContext === null) return false;
  const dc = manifest.defaultContext as Record<string, unknown>;
  if (typeof dc.path !== 'string') return false;
  if (typeof dc.maxBytes !== 'number') return false;
  if (!Array.isArray(dc.files)) return false;

  // Check hubs
  if (typeof manifest.hubs !== 'object' || manifest.hubs === null) return false;

  return true;
}

/**
 * Type guard to validate HubConfig structure.
 */
export function isValidHubConfig(obj: unknown): obj is HubConfig {
  if (typeof obj !== 'object' || obj === null) return false;

  const hub = obj as Record<string, unknown>;

  if (typeof hub.title !== 'string') return false;
  if (typeof hub.path !== 'string') return false;
  if (typeof hub.maxBytes !== 'number') return false;
  if (typeof hub.primaryFile !== 'string') return false;
  if (!Array.isArray(hub.supportingFiles)) return false;
  if (!Array.isArray(hub.tags)) return false;

  return true;
}
