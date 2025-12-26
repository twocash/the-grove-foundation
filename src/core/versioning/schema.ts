// src/core/versioning/schema.ts
// Version record types with full provenance for DEX Pillar III

import type { JsonPatch } from '../copilot/schema';
import type { GroveObjectType, GroveObject } from '../schema/grove-object';

/**
 * Model routing identifiers for the hybrid architecture.
 * - hybrid-local: Processed by local model (simulated or real 7B)
 * - hybrid-cloud: Routed to cloud API for complex reasoning
 *
 * UI displays friendly labels (e.g., "Local 7B (Simulated)").
 * Backend uses these for analytics and routing.
 */
export type HybridModelId = 'hybrid-local' | 'hybrid-cloud';

/**
 * Who made this change (Provenance: Actor)
 */
export interface VersionActor {
  type: 'human' | 'copilot' | 'system' | 'agent';

  /** Model routing identifier (null for system/human) */
  model?: HybridModelId | null;

  /** User or agent identifier (for future user management) */
  id?: string;
}

/**
 * How this change was made (Provenance: Source)
 */
export interface VersionSource {
  type: 'copilot' | 'direct-edit' | 'import' | 'migration' | 'system';

  /** Engagement session identifier */
  sessionId?: string;

  /** Original user input that triggered this change */
  intent?: string;
}

/**
 * A single version of a Grove object.
 * Implements DEX Pillar III: Provenance as Infrastructure.
 */
export interface ObjectVersion {
  /** UUID v4 for this specific version */
  versionId: string;

  /** The object being versioned */
  objectId: string;

  /** Object type (journey, lens, sprout, etc.) */
  objectType: GroveObjectType;

  /** Monotonic ordinal within object scope (1, 2, 3...) */
  ordinal: number;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** Provenance: who made this change */
  actor: VersionActor;

  /** Provenance: how was this change made */
  source: VersionSource;

  /** RFC 6902 patch that produced this version from the previous */
  patch: JsonPatch;

  /** Link to prior version (null for v1) */
  previousVersionId: string | null;

  /** Human-readable change description */
  message?: string;
}

/**
 * Stored object with version metadata.
 * This is what gets persisted and cached.
 */
export interface StoredObject<T = unknown> {
  /** Current materialized state */
  current: GroveObject<T>;

  /** Current version ID */
  currentVersionId: string;

  /** Total version count */
  versionCount: number;

  /** ISO timestamp of last modification */
  lastModifiedAt: string;

  /** Who made the last change */
  lastModifiedBy: VersionActor;
}

/**
 * Get display label for actor type
 */
export function getActorLabel(actor: VersionActor | null): string {
  if (!actor) return 'Unknown';
  switch (actor.type) {
    case 'copilot': return 'Copilot';
    case 'human': return 'Manual Edit';
    case 'system': return 'System';
    case 'agent': return 'Agent';
    default: return actor.type;
  }
}

/**
 * Get display label for model identifier
 */
export function getModelLabel(model: HybridModelId | null | undefined): string {
  if (!model) return '';
  switch (model) {
    case 'hybrid-local': return 'Local 7B (Simulated)';
    case 'hybrid-cloud': return 'Cloud API';
    default: return model;
  }
}
