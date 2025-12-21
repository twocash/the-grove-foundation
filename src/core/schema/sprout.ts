// src/core/schema/sprout.ts
// Sprint: Sprout System
// Sprout data model for capturing LLM responses with full provenance

/**
 * Sprout - A captured LLM response with full generation context
 *
 * Sprouts are the atomic unit of user contribution to the Knowledge Commons.
 * Each sprout preserves the exact response verbatim along with the complete
 * context that produced it (query, persona, journey, topic hub, etc.)
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

  /** Active persona/lens ID at time of generation */
  personaId: string | null;

  /** Active journey ID if in journey mode */
  journeyId: string | null;

  /** Topic hub that was matched (if any) */
  hubId: string | null;

  /** Narrative card/node that triggered the query (if any) */
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
  /** Schema version for migrations */
  version: 1;

  /** All captured sprouts */
  sprouts: Sprout[];

  /** Session ID for this browser (generated once) */
  sessionId: string;
}

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

  /** Current persona/lens ID */
  personaId: string | null;

  /** Current journey ID (if in journey mode) */
  journeyId: string | null;

  /** Matched topic hub ID */
  hubId: string | null;

  /** Current narrative node ID */
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
 * Check if storage object is valid
 */
export function isValidSproutStorage(obj: unknown): obj is SproutStorage {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<SproutStorage>;
  return (
    s.version === 1 &&
    Array.isArray(s.sprouts) &&
    typeof s.sessionId === 'string'
  );
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** localStorage key for sprout data */
export const SPROUT_STORAGE_KEY = 'grove-sprouts';

/** Maximum number of recent sprouts to return in stats */
export const MAX_RECENT_SPROUTS = 10;
