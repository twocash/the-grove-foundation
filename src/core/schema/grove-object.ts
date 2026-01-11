// src/core/schema/grove-object.ts
// Grove Object Model - Pattern 7
// Base types for unified object identity across Grove

/**
 * Recognized Grove object types.
 * Known types get autocomplete; string allows custom types.
 */
export type GroveObjectType =
  | 'lens'
  | 'journey'
  | 'hub'
  | 'sprout'
  | 'research-sprout'        // Sprint: sprout-research-v1
  | 'prompt-architect-config' // Sprint: sprout-research-v1
  | 'system-prompt'
  | 'node'
  | 'card'
  | string;

/**
 * Object lifecycle states.
 */
export type GroveObjectStatus = 'active' | 'draft' | 'archived' | 'pending';

/**
 * Provenance record tracking object origin.
 */
export interface GroveObjectProvenance {
  /** Who/what created this object */
  type: 'human' | 'ai' | 'system' | 'import';

  /** Identifier of the creator (user ID, model ID, etc.) */
  actorId?: string;

  /** Context at creation time */
  context?: {
    lensId?: string;
    journeyId?: string;
    sessionId?: string;
    sourceFile?: string;
  };
}

/**
 * Common metadata shared by all Grove objects.
 *
 * Enables unified operations:
 * - Find/filter by any field
 * - Sort by date, title, type
 * - Mark as favorite
 * - Track provenance
 *
 * @see Pattern 7: Object Model in PROJECT_PATTERNS.md
 */
export interface GroveObjectMeta {
  // Identity
  id: string;
  type: GroveObjectType;

  // Display
  title: string;
  description?: string;
  icon?: string;
  color?: string;

  // Timestamps (ISO 8601)
  createdAt: string;
  updatedAt: string;

  // Provenance
  createdBy?: GroveObjectProvenance;

  // Lifecycle
  status?: GroveObjectStatus;

  // Organization
  tags?: string[];
  favorite?: boolean;
}

/**
 * A complete Grove object: metadata + type-specific payload.
 *
 * @template T - The type-specific payload interface
 */
export interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}

/**
 * Type guard: Check if object has GroveObjectMeta fields
 */
export function isGroveObjectMeta(obj: unknown): obj is GroveObjectMeta {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof o.title === 'string'
  );
}
