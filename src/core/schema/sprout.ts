// src/core/schema/sprout.ts
// Sprint: Sprout System
// Sprout data model for capturing LLM responses with full provenance

/**
 * Provenance - Human-readable lineage of an insight
 *
 * Captures the "clues" that produced this sprout:
 * what lens was active, which hub matched, what knowledge informed it.
 *
 * POST-MVP: Foundation Refactor Spec defines 8 botanical growth stages:
 * 'tender' | 'rooting' | 'branching' | 'hardened' | 'grafted' | 'established' | 'dormant' | 'withered'
 * Current MVP uses simplified: 'sprout' | 'sapling' | 'tree'
 */
export interface SproutProvenance {
  /** Lens/persona that shaped the response */
  lens: { id: string; name: string } | null;

  /** Topic hub that was matched */
  hub: { id: string; name: string } | null;

  /** Journey context if in guided mode */
  journey: { id: string; name: string } | null;

  /** Specific node/card that triggered the query */
  node: { id: string; name: string } | null;

  /** Knowledge base files that informed the response */
  knowledgeFiles: string[];

  /** Model/API used for generation (future-proofing) */
  model?: string;

  /** ISO timestamp of generation */
  generatedAt: string;
}

/**
 * Sprout - A captured LLM response with full generation context
 *
 * Sprouts are the atomic unit of user contribution to the Knowledge Commons.
 * Each sprout preserves the exact response verbatim along with the complete
 * context that produced it (query, persona, journey, topic hub, etc.)
 *
 * POST-MVP: Foundation Refactor Spec defines 8 botanical growth stages.
 * Current MVP uses simplified 3-stage lifecycle.
 */
export interface Sprout {
  /** Unique identifier (UUID) */
  id: string;

  /** ISO timestamp of capture */
  capturedAt: string;

  // ─────────────────────────────────────────────────────────────
  // Preserved Content (VERBATIM)
  // ─────────────────────────────────────────────────────────────

  /** Exact LLM response text */
  response: string;

  /** Original user query that generated this response */
  query: string;

  // ─────────────────────────────────────────────────────────────
  // Generation Context (Provenance)
  // ─────────────────────────────────────────────────────────────

  /** Human-readable provenance with names (v2+) */
  provenance?: SproutProvenance;

  /** @deprecated Use provenance.lens.id - Active persona/lens ID at time of generation */
  personaId: string | null;

  /** @deprecated Use provenance.journey.id - Active journey ID if in journey mode */
  journeyId: string | null;

  /** @deprecated Use provenance.hub.id - Topic hub that was matched (if any) */
  hubId: string | null;

  /** @deprecated Use provenance.node.id - Narrative card/node that triggered the query (if any) */
  nodeId: string | null;

  // ─────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────

  /** Current status in the contribution lifecycle */
  status: SproutStatus;

  /** User-assigned tags for categorization */
  tags: string[];

  /** Optional human commentary on the sprout */
  notes: string | null;

  // ─────────────────────────────────────────────────────────────
  // Attribution (Future-Ready)
  // ─────────────────────────────────────────────────────────────

  /** Anonymous session ID for grouping sprouts */
  sessionId: string;

  /** Grove ID of creator (future: when auth is implemented) */
  creatorId: string | null;
}

/**
 * Sprout lifecycle status
 *
 * MVP only uses 'sprout'. Future phases will implement:
 * - sapling: Under review by curator
 * - tree: Published to Knowledge Commons
 */
export type SproutStatus = 'sprout' | 'sapling' | 'tree';

/**
 * localStorage schema for sprout persistence
 */
export interface SproutStorage {
  /** Schema version for migrations (v2 adds provenance) */
  version: 1 | 2;

  /** All captured sprouts */
  sprouts: Sprout[];

  /** Session ID for this browser (generated once) */
  sessionId: string;
}

/** Current storage schema version */
export const CURRENT_STORAGE_VERSION = 2;

/**
 * Options for capturing a sprout
 */
export interface SproutCaptureOptions {
  /** Tags to associate with the sprout */
  tags?: string[];

  /** Human annotation/notes */
  notes?: string;
}

/**
 * Context required to capture a sprout
 */
export interface SproutCaptureContext {
  /** The LLM response text */
  response: string;

  /** The user's query */
  query: string;

  /** Human-readable provenance (v2+) */
  provenance: SproutProvenance;
}

/**
 * @deprecated Legacy capture context - use SproutCaptureContext with provenance instead
 */
export interface LegacySproutCaptureContext {
  response: string;
  query: string;
  personaId: string | null;
  journeyId: string | null;
  hubId: string | null;
  nodeId: string | null;
}

/**
 * Aggregated sprout statistics
 */
export interface SproutStats {
  /** Total number of sprouts captured (all time) */
  totalSprouts: number;

  /** Number of sprouts in current session */
  sessionSprouts: number;

  /** Count of sprouts by topic hub */
  sproutsByHub: Record<string, number>;

  /** Count of sprouts by tag */
  sproutsByTag: Record<string, number>;

  /** Most recent sprouts (for display) */
  recentSprouts: Sprout[];
}

// ─────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────

/**
 * Check if an object is a valid Sprout
 */
export function isSprout(obj: unknown): obj is Sprout {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<Sprout>;
  return (
    typeof s.id === 'string' &&
    typeof s.capturedAt === 'string' &&
    typeof s.response === 'string' &&
    typeof s.query === 'string' &&
    typeof s.status === 'string' &&
    Array.isArray(s.tags) &&
    typeof s.sessionId === 'string'
  );
}

/**
 * Check if storage object is valid (supports v1 and v2)
 */
export function isValidSproutStorage(obj: unknown): obj is SproutStorage {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<SproutStorage>;
  return (
    (s.version === 1 || s.version === 2) &&
    Array.isArray(s.sprouts) &&
    typeof s.sessionId === 'string'
  );
}

/**
 * Migrate v1 storage to v2 (adds empty provenance to existing sprouts)
 */
export function migrateStorageToV2(storage: SproutStorage): SproutStorage {
  if (storage.version === 2) return storage;

  // Migrate v1 sprouts: add empty provenance from legacy fields
  const migratedSprouts = storage.sprouts.map(sprout => ({
    ...sprout,
    provenance: sprout.provenance || {
      lens: sprout.personaId ? { id: sprout.personaId, name: sprout.personaId } : null,
      hub: sprout.hubId ? { id: sprout.hubId, name: sprout.hubId } : null,
      journey: sprout.journeyId ? { id: sprout.journeyId, name: sprout.journeyId } : null,
      node: sprout.nodeId ? { id: sprout.nodeId, name: sprout.nodeId } : null,
      knowledgeFiles: [],
      generatedAt: sprout.capturedAt
    } as SproutProvenance
  }));

  return {
    version: 2,
    sprouts: migratedSprouts,
    sessionId: storage.sessionId
  };
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** localStorage key for sprout data */
export const SPROUT_STORAGE_KEY = 'grove-sprouts';

/** Maximum number of recent sprouts to return in stats */
export const MAX_RECENT_SPROUTS = 10;
