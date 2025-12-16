// src/core/engine/ragLoader.ts
// Tiered RAG context loader - no React dependencies
// Implements: Tier 1 (default ~15KB) + Tier 2 (hub-specific ~20-40KB)

import { Storage } from '@google-cloud/storage';
import {
  HubsManifest,
  HubConfig,
  TieredContextResult,
  TieredContextOptions,
  ManifestCacheEntry,
  FileContentCacheEntry,
  isValidHubsManifest,
} from '../schema/rag';
import { TopicHub } from '../schema';
import { routeToHub, getMatchDetails } from './topicRouter';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'grove-assets';
const KNOWLEDGE_PREFIX = 'knowledge/';
const MANIFEST_PATH = 'knowledge/hubs.json';

/** Manifest cache TTL: 5 minutes */
const MANIFEST_CACHE_TTL_MS = 5 * 60 * 1000;

/** File content cache TTL: 10 minutes */
const FILE_CACHE_TTL_MS = 10 * 60 * 1000;

/** Default Tier 1 budget if not specified */
const DEFAULT_TIER1_BUDGET = 15000;

/** Default Tier 2 budget if not specified */
const DEFAULT_TIER2_BUDGET = 40000;

// ============================================================================
// CACHES
// ============================================================================

let manifestCache: ManifestCacheEntry | null = null;
const fileContentCache = new Map<string, FileContentCacheEntry>();

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Invalidate the manifest cache.
 * Call this on admin save events.
 */
export function invalidateManifestCache(): void {
  console.log('[RAG] Manifest cache invalidated');
  manifestCache = null;
}

/**
 * Invalidate a specific file from the cache.
 */
export function invalidateFileCache(filePath: string): void {
  fileContentCache.delete(filePath);
}

/**
 * Clear all caches (for testing).
 */
export function clearAllCaches(): void {
  manifestCache = null;
  fileContentCache.clear();
}

// ============================================================================
// MANIFEST LOADING
// ============================================================================

/**
 * Load the hubs manifest from GCS (cached).
 */
export async function loadManifest(storage: Storage): Promise<HubsManifest | null> {
  const now = Date.now();

  // Check cache
  if (manifestCache && now < manifestCache.expiresAt) {
    return manifestCache.manifest;
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(MANIFEST_PATH);

    const [exists] = await file.exists();
    if (!exists) {
      console.warn('[RAG] Manifest not found at', MANIFEST_PATH);
      return null;
    }

    const [content] = await file.download();
    const parsed = JSON.parse(content.toString());

    if (!isValidHubsManifest(parsed)) {
      console.error('[RAG] Invalid manifest schema');
      return null;
    }

    // Update cache
    manifestCache = {
      manifest: parsed,
      loadedAt: now,
      expiresAt: now + MANIFEST_CACHE_TTL_MS,
    };

    console.log(`[RAG] Manifest loaded: ${Object.keys(parsed.hubs).length} hubs`);
    return parsed;
  } catch (error) {
    console.error('[RAG] Failed to load manifest:', (error as Error).message);
    return null;
  }
}

// ============================================================================
// FILE LOADING
// ============================================================================

/**
 * Load a file from GCS with caching.
 * Returns null if file doesn't exist or on error.
 */
async function loadFile(
  storage: Storage,
  filePath: string
): Promise<{ content: string; bytes: number } | null> {
  const now = Date.now();
  const fullPath = filePath.startsWith(KNOWLEDGE_PREFIX)
    ? filePath
    : `${KNOWLEDGE_PREFIX}${filePath}`;

  // Check cache
  const cached = fileContentCache.get(fullPath);
  if (cached && now - cached.loadedAt < FILE_CACHE_TTL_MS) {
    return { content: cached.content, bytes: cached.bytes };
  }

  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fullPath);

    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`[RAG] File not found: ${fullPath}`);
      return null;
    }

    const [content] = await file.download();
    const contentStr = content.toString();
    const bytes = Buffer.byteLength(contentStr, 'utf8');

    // Update cache
    fileContentCache.set(fullPath, {
      content: contentStr,
      bytes,
      loadedAt: now,
    });

    return { content: contentStr, bytes };
  } catch (error) {
    console.error(`[RAG] Failed to load file ${fullPath}:`, (error as Error).message);
    return null;
  }
}

/**
 * Resolve a clean file name to its GCS path using the manifest mapping.
 */
function resolveFilePath(
  cleanName: string,
  hubPath: string,
  manifest: HubsManifest
): string {
  // Check explicit mapping first
  const mapping = manifest._meta?.gcsFileMapping as Record<string, string> | undefined;
  if (mapping?.[cleanName]) {
    // Mapped to root knowledge/ folder with hashed name
    return mapping[cleanName];
  }

  // Default: look in hub's folder with clean name
  return `${hubPath}${cleanName}`;
}

// ============================================================================
// TIERED CONTEXT LOADING
// ============================================================================

/**
 * Build tiered RAG context based on query and manifest.
 *
 * Load order:
 * 1. Tier 1 (default context) - always loaded first
 * 2. Tier 2 (hub context) - loaded if hub matches query
 *
 * Respects byte budgets and never truncates mid-file.
 */
export async function buildTieredContext(
  storage: Storage,
  options: TieredContextOptions,
  topicHubs?: TopicHub[]
): Promise<TieredContextResult> {
  const result: TieredContextResult = {
    context: '',
    tier1Bytes: 0,
    tier2Bytes: 0,
    totalBytes: 0,
    matchedHub: null,
    filesLoaded: [],
    matchedTags: [],
  };

  // Load manifest
  const manifest = await loadManifest(storage);
  if (!manifest) {
    console.warn('[RAG] No manifest available, returning empty context');
    return result;
  }

  const contextParts: string[] = [];

  // -------------------------------------------------------------------------
  // TIER 1: Default Context (always loaded)
  // -------------------------------------------------------------------------
  const tier1Budget = options.tier1Budget ?? manifest.defaultContext.maxBytes ?? DEFAULT_TIER1_BUDGET;
  let tier1BytesUsed = 0;

  console.log(`[RAG] Loading Tier 1 (budget: ${tier1Budget} bytes)`);

  for (const filename of manifest.defaultContext.files) {
    const filePath = `${manifest.defaultContext.path}${filename}`;
    const fileData = await loadFile(storage, filePath);

    if (!fileData) {
      console.warn(`[RAG] Tier 1 file missing: ${filePath}`);
      continue;
    }

    // Check budget BEFORE adding
    if (tier1BytesUsed + fileData.bytes > tier1Budget) {
      console.log(`[RAG] Tier 1 budget exceeded, skipping ${filename}`);
      break;
    }

    contextParts.push(`\n\n--- ${filename} ---\n${fileData.content}`);
    tier1BytesUsed += fileData.bytes;
    result.filesLoaded.push(filePath);
  }

  result.tier1Bytes = tier1BytesUsed;
  console.log(`[RAG] Tier 1 loaded: ${tier1BytesUsed} bytes from ${result.filesLoaded.length} files`);

  // -------------------------------------------------------------------------
  // TIER 2: Hub Context (loaded if query matches)
  // -------------------------------------------------------------------------
  let matchedHubId: string | null = null;
  let matchedHubConfig: HubConfig | null = null;

  // Option 1: Explicit hub IDs provided
  if (options.contextHubs && options.contextHubs.length > 0) {
    matchedHubId = options.contextHubs[0]; // Take first
    matchedHubConfig = manifest.hubs[matchedHubId] ?? null;
  }
  // Option 2: Auto-detect from query using TopicHub routing
  else if (options.autoDetectHubs !== false && topicHubs) {
    const matchedTopicHub = routeToHub(options.message, topicHubs);
    if (matchedTopicHub) {
      matchedHubId = matchedTopicHub.id;
      matchedHubConfig = manifest.hubs[matchedHubId] ?? null;

      // Capture matched tags for debugging
      const matchDetails = getMatchDetails(options.message, topicHubs);
      if (matchDetails.length > 0) {
        result.matchedTags = matchDetails[0].matchedTags;
      }
    }
  }

  if (matchedHubId && matchedHubConfig) {
    const tier2Budget = options.tier2Budget ?? matchedHubConfig.maxBytes ?? DEFAULT_TIER2_BUDGET;
    let tier2BytesUsed = 0;

    console.log(`[RAG] Loading Tier 2: ${matchedHubId} (budget: ${tier2Budget} bytes)`);
    result.matchedHub = matchedHubId;

    // Load primary file first
    const primaryPath = resolveFilePath(
      matchedHubConfig.primaryFile,
      matchedHubConfig.path,
      manifest
    );
    const primaryData = await loadFile(storage, primaryPath);

    if (primaryData) {
      if (tier2BytesUsed + primaryData.bytes <= tier2Budget) {
        contextParts.push(`\n\n--- [${matchedHubConfig.title}] ${matchedHubConfig.primaryFile} ---\n${primaryData.content}`);
        tier2BytesUsed += primaryData.bytes;
        result.filesLoaded.push(primaryPath);
      } else {
        console.warn(`[RAG] Primary file exceeds Tier 2 budget, skipping`);
      }
    } else {
      console.warn(`[RAG] Hub ${matchedHubId} primaryFile missing: ${primaryPath}`);
    }

    // Load supporting files (in order, respecting budget)
    for (const supportingFile of matchedHubConfig.supportingFiles) {
      const supportPath = resolveFilePath(
        supportingFile,
        matchedHubConfig.path,
        manifest
      );
      const supportData = await loadFile(storage, supportPath);

      if (!supportData) {
        console.warn(`[RAG] Supporting file missing: ${supportPath}`);
        continue;
      }

      // Check budget BEFORE adding
      if (tier2BytesUsed + supportData.bytes > tier2Budget) {
        console.log(`[RAG] Tier 2 budget exceeded, skipping ${supportingFile}`);
        break;
      }

      contextParts.push(`\n\n--- [${matchedHubConfig.title}] ${supportingFile} ---\n${supportData.content}`);
      tier2BytesUsed += supportData.bytes;
      result.filesLoaded.push(supportPath);
    }

    result.tier2Bytes = tier2BytesUsed;
    console.log(`[RAG] Tier 2 loaded: ${tier2BytesUsed} bytes`);
  } else if (options.autoDetectHubs !== false) {
    console.log(`[RAG] No hub matched for query`);
  }

  // -------------------------------------------------------------------------
  // COMBINE & RETURN
  // -------------------------------------------------------------------------
  result.context = contextParts.join('');
  result.totalBytes = result.tier1Bytes + result.tier2Bytes;

  console.log(`[RAG] Total context: ${result.totalBytes} bytes (~${Math.round(result.totalBytes / 4)} tokens)`);

  return result;
}

// ============================================================================
// LEGACY COMPATIBILITY SHIM
// ============================================================================

/**
 * Legacy fetchRagContext shim for gradual migration.
 * Wraps buildTieredContext with message-less default behavior.
 *
 * @deprecated Use buildTieredContext directly for hub-aware loading
 */
export async function fetchRagContextLegacy(storage: Storage): Promise<string> {
  const result = await buildTieredContext(storage, {
    message: '',
    autoDetectHubs: false, // Tier 1 only for legacy
  });

  return result.context || '';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BUCKET_NAME,
  KNOWLEDGE_PREFIX,
  MANIFEST_PATH,
};
