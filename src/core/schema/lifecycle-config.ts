// src/core/schema/lifecycle-config.ts
// Sprint: S5-SL-LifecycleEngine v1
// Declarative lifecycle configuration for tier system
// Pattern: Supabase + ExperienceConsole polymorphic factory

import type { SproutStage } from './sprout';

// ─────────────────────────────────────────────────────────────
// Tier Definition - Individual tier in a lifecycle model
// ─────────────────────────────────────────────────────────────

/**
 * A single tier in a lifecycle model.
 * Defines the visual representation and ordering of growth stages.
 */
export interface TierDefinition {
  /** Unique identifier for this tier */
  id: string;

  /** Display label (e.g., "Seed", "Sprout") */
  label: string;

  /** Emoji representation (e.g., "🌰", "🌱") */
  emoji: string;

  /** Order in the progression (0 = first tier) */
  order: number;

  /** Optional description of this tier */
  description?: string;
}

// ─────────────────────────────────────────────────────────────
// Stage-to-Tier Mapping - Links internal stages to display tiers
// ─────────────────────────────────────────────────────────────

/**
 * Maps a sprout's internal stage to a display tier.
 * Allows multiple stages to map to the same tier.
 */
export interface StageTierMapping {
  /** Internal sprout stage */
  stage: SproutStage;

  /** Target tier ID */
  tierId: string;
}

// ─────────────────────────────────────────────────────────────
// Lifecycle Model - Complete tier progression scheme
// ─────────────────────────────────────────────────────────────

/**
 * A complete lifecycle model defining tier progression.
 * System models (isEditable: false) cannot be modified via ExperienceConsole.
 */
export interface LifecycleModel {
  /** Unique identifier for this model */
  id: string;

  /** Display name (e.g., "Botanical Growth") */
  name: string;

  /** Optional description of the model */
  description?: string;

  /** Whether operators can edit this model (false for system models) */
  isEditable: boolean;

  /** Tier definitions in order */
  tiers: TierDefinition[];

  /** Stage-to-tier mappings */
  mappings: StageTierMapping[];
}

// ─────────────────────────────────────────────────────────────
// Lifecycle Config Payload - Top-level configuration
// ─────────────────────────────────────────────────────────────

/**
 * Complete lifecycle configuration stored in Supabase.
 * Follows JSONB meta+payload pattern from GroveDataProvider.
 */
export interface LifecycleConfigPayload {
  /** ID of the currently active model */
  activeModelId: string;

  /** All available lifecycle models */
  models: LifecycleModel[];
}

// ─────────────────────────────────────────────────────────────
// Default Configuration - Botanical Growth Model
// ─────────────────────────────────────────────────────────────

/**
 * Default botanical growth model - maps 8 stages to 5 tiers.
 *
 * Tier progression: Seed → Sprout → Sapling → Tree → Grove
 *
 * Stage mappings:
 * - tender, rooting → Seed (early stages)
 * - branching → Sprout (actively growing)
 * - hardened, grafted → Sapling (maturing)
 * - established → Tree (mature)
 * - dormant, withered → Grove (archive state)
 */
export const DEFAULT_BOTANICAL_MODEL: LifecycleModel = {
  id: 'botanical',
  name: 'Botanical Growth',
  description: 'The default 5-tier botanical lifecycle model',
  isEditable: false, // System model - cannot be modified
  tiers: [
    { id: 'seed', label: 'Seed', emoji: '🌰', order: 0, description: 'Just planted, not yet sprouted' },
    { id: 'sprout', label: 'Sprout', emoji: '🌱', order: 1, description: 'Breaking ground, early growth' },
    { id: 'sapling', label: 'Sapling', emoji: '🌿', order: 2, description: 'Growing stronger, taking shape' },
    { id: 'tree', label: 'Tree', emoji: '🌳', order: 3, description: 'Fully established, bearing fruit' },
    { id: 'grove', label: 'Grove', emoji: '🌲', order: 4, description: 'Part of the greater forest' },
  ],
  mappings: [
    // Early stages → Seed
    { stage: 'tender', tierId: 'seed' },
    { stage: 'rooting', tierId: 'seed' },
    // Active growth → Sprout
    { stage: 'branching', tierId: 'sprout' },
    // Maturing → Sapling
    { stage: 'hardened', tierId: 'sapling' },
    { stage: 'grafted', tierId: 'sapling' },
    // Mature → Tree
    { stage: 'established', tierId: 'tree' },
    // Archive states → Grove
    { stage: 'dormant', tierId: 'grove' },
    { stage: 'withered', tierId: 'grove' },
  ],
};

/**
 * Default lifecycle configuration payload.
 * Seeds Supabase with botanical model as the active configuration.
 */
export const DEFAULT_LIFECYCLE_CONFIG_PAYLOAD: LifecycleConfigPayload = {
  activeModelId: 'botanical',
  models: [DEFAULT_BOTANICAL_MODEL],
};

// ─────────────────────────────────────────────────────────────
// Fallback Configuration - Used when Supabase unavailable
// ─────────────────────────────────────────────────────────────

/**
 * Fallback tier configuration for when Supabase is unavailable.
 * Used by useLifecycleConfig hook when config cannot be loaded.
 */
export const FALLBACK_TIER_CONFIG: Record<string, TierDefinition> = {
  seed: { id: 'seed', label: 'Seed', emoji: '🌰', order: 0 },
  sprout: { id: 'sprout', label: 'Sprout', emoji: '🌱', order: 1 },
  sapling: { id: 'sapling', label: 'Sapling', emoji: '🌿', order: 2 },
  tree: { id: 'tree', label: 'Tree', emoji: '🌳', order: 3 },
  grove: { id: 'grove', label: 'Grove', emoji: '🌲', order: 4 },
};

/**
 * Fallback stage-to-tier mapping for when config unavailable.
 * Used by useLifecycleConfig hook as safety net.
 */
export const FALLBACK_STAGE_TO_TIER: Record<SproutStage, string> = {
  tender: 'seed',
  rooting: 'seed',
  branching: 'sprout',
  hardened: 'sapling',
  grafted: 'sapling',
  established: 'tree',
  dormant: 'grove',
  withered: 'grove',
};

// ─────────────────────────────────────────────────────────────
// Type Guards and Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Check if an object is a valid TierDefinition
 */
export function isTierDefinition(obj: unknown): obj is TierDefinition {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as Partial<TierDefinition>;
  return (
    typeof t.id === 'string' &&
    typeof t.label === 'string' &&
    typeof t.emoji === 'string' &&
    typeof t.order === 'number'
  );
}

/**
 * Check if an object is a valid LifecycleModel
 */
export function isLifecycleModel(obj: unknown): obj is LifecycleModel {
  if (!obj || typeof obj !== 'object') return false;
  const m = obj as Partial<LifecycleModel>;
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.isEditable === 'boolean' &&
    Array.isArray(m.tiers) &&
    Array.isArray(m.mappings) &&
    m.tiers.every(isTierDefinition)
  );
}

/**
 * Check if an object is a valid LifecycleConfigPayload
 */
export function isLifecycleConfigPayload(obj: unknown): obj is LifecycleConfigPayload {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Partial<LifecycleConfigPayload>;
  return (
    typeof p.activeModelId === 'string' &&
    Array.isArray(p.models) &&
    p.models.every(isLifecycleModel)
  );
}

/**
 * Get the active model from a config payload.
 * Returns undefined if activeModelId doesn't match any model.
 */
export function getActiveModel(payload: LifecycleConfigPayload): LifecycleModel | undefined {
  return payload.models.find(m => m.id === payload.activeModelId);
}

/**
 * Get tier for a given stage from a lifecycle model.
 * Returns undefined if stage is not mapped.
 */
export function getTierForStageFromModel(
  model: LifecycleModel,
  stage: SproutStage
): TierDefinition | undefined {
  const mapping = model.mappings.find(m => m.stage === stage);
  if (!mapping) return undefined;
  return model.tiers.find(t => t.id === mapping.tierId);
}
