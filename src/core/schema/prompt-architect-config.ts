// src/core/schema/prompt-architect-config.ts
// PromptArchitectConfig schema for grove-level research configuration
// Sprint: sprout-research-v1, Phase 1a
//
// =============================================================================
// PATTERN: SINGLETON (mirrors SystemPrompt)
// =============================================================================
//
// PromptArchitectConfig follows the SINGLETON pattern established by SystemPrompt:
//
// - ONE active config per grove at any time
// - Multiple VERSIONS can exist (draft, archived)
// - Versioning creates NEW records (immutable history)
// - Activation archives the previous active config
//
// Database constraint: UNIQUE WHERE status='active' ON grove_id
// This enforces "only one live" at the database level.
//
// Uniqueness keys:
// - Active constraint: (grove_id) WHERE status = 'active'
// - Version history: (grove_id, version)
//
// Compare to ResearchSprout (INSTANCE pattern):
// - MANY active sprouts per grove simultaneously
// - Each sprout has independent version chain
// - No global "only one active" constraint
// - Uniqueness: (id) for sprout, (id, version) for history
//
// =============================================================================

import type { GroveObject, GroveObjectStatus } from './grove-object';
import type { ResearchStrategy, BranchTemplate } from './research-strategy';
import type { QualityGateConfig } from './quality-gate';

// =============================================================================
// Inference Rules
// =============================================================================

/**
 * Trigger conditions for inference rules
 */
export interface InferenceTrigger {
  /** Keywords that trigger this rule (OR logic) */
  keywords?: string[];

  /** Regex patterns to match (OR logic) */
  patterns?: string[];

  /** Semantic similarity description (future: embedding match) */
  semantic?: string;
}

/**
 * What to infer when a rule triggers
 */
export interface InferenceResult {
  /** Branch templates to auto-add */
  branches?: BranchTemplate[];

  /** Source preferences to apply */
  sourcePreferences?: string[];

  /** Override default research depth */
  depth?: ResearchStrategy['depth'];

  /** Auto-link to existing sprouts with matching topics */
  relatedSprouts?: 'auto-link';
}

/**
 * Inference rule for contextual auto-population
 *
 * When a researcher's spark matches a trigger, the system
 * infers context rather than asking for clarification.
 */
export interface InferenceRule {
  /** Unique rule identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Trigger conditions */
  trigger: InferenceTrigger;

  /** What to infer when triggered */
  infer: InferenceResult;

  /** Whether this rule is active */
  enabled: boolean;
}

// =============================================================================
// Confirmation Mode
// =============================================================================

/**
 * How the Prompt Architect handles confirmation dialogs
 */
export type ConfirmationMode = 'always' | 'ambiguous' | 'never';

// =============================================================================
// PromptArchitectConfig Payload
// =============================================================================

/**
 * PromptArchitectConfig payload - grove-level research DNA
 *
 * SINGLETON PATTERN: Only ONE active config per grove.
 * The groveId field anchors the singleton constraint.
 *
 * This config shapes how the Prompt Architect interprets sparks,
 * infers context, and generates research manifests. A legal discovery
 * grove's config knows case theory; a scientific grove knows
 * experimental methodology.
 */
export interface PromptArchitectConfigPayload {
  // === Grove Binding (Singleton Anchor) ===
  /**
   * The grove this config belongs to.
   * Combined with status='active', enforces singleton pattern.
   *
   * Database constraint: UNIQUE(grove_id) WHERE status = 'active'
   */
  groveId: string;

  // === Research Objectives ===
  /** What the grove is proving/disproving */
  hypothesisGoals: string[];

  /** What sources are in scope */
  corpusBoundaries: string[];

  /** Prose description of research objectives */
  researchContext: string;

  // === Default Behaviors ===
  /** Default research strategy for new sprouts */
  defaultStrategy: ResearchStrategy;

  /** Branch templates to auto-populate */
  defaultBranches?: BranchTemplate[];

  // === Inference Engine ===
  /** Context-based auto-fill rules */
  inferenceRules: InferenceRule[];

  // === Quality Control ===
  /** Quality gate configuration (optional) */
  qualityGates?: QualityGateConfig;

  // === Personality ===
  /** Voice/tone for Architect dialogue */
  personality?: string;

  /** How often to show confirmation dialog */
  confirmationMode: ConfirmationMode;

  // === Versioning (mirrors SystemPrompt) ===
  /** Version number (increments on saveAndActivate) */
  version: number;

  /** Change description for this version */
  changelog?: string;

  /** Reference to previous version for history chain */
  previousVersionId?: string;

  // === Provenance (DEX: Provenance as Infrastructure) ===
  /** User ID who created this config */
  createdByUserId?: string | null;

  /** User ID who last modified this config */
  updatedByUserId?: string | null;
}

/**
 * PromptArchitectConfig as a GroveObject
 *
 * The meta.status field works with groveId to enforce singleton:
 * - Only one config can have status='active' per groveId
 * - Activating a new version auto-archives the previous
 */
export type PromptArchitectConfig = GroveObject<PromptArchitectConfigPayload>;

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default payload for new PromptArchitectConfig objects
 */
export const DEFAULT_PROMPT_ARCHITECT_CONFIG_PAYLOAD: PromptArchitectConfigPayload = {
  groveId: '', // Must be set on creation
  hypothesisGoals: [],
  corpusBoundaries: [],
  researchContext: '',
  defaultStrategy: {
    depth: 'medium',
    sourceTypes: ['academic', 'practitioner', 'primary'],
    balanceMode: 'balanced',
  },
  defaultBranches: [],
  inferenceRules: [],
  qualityGates: undefined, // Off by default
  personality: undefined,
  confirmationMode: 'ambiguous', // Show dialog only when uncertain
  version: 1,
  createdByUserId: null,
  updatedByUserId: null,
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if an object is a PromptArchitectConfig
 */
export function isPromptArchitectConfig(obj: unknown): obj is PromptArchitectConfig {
  if (typeof obj !== 'object' || obj === null) return false;

  const candidate = obj as Record<string, unknown>;

  // Check meta
  if (typeof candidate.meta !== 'object' || candidate.meta === null) return false;
  const meta = candidate.meta as Record<string, unknown>;
  if (meta.type !== 'prompt-architect-config') return false;

  // Check payload
  if (typeof candidate.payload !== 'object' || candidate.payload === null) return false;
  const payload = candidate.payload as Record<string, unknown>;

  // Validate required payload fields
  return (
    typeof payload.groveId === 'string' &&
    Array.isArray(payload.hypothesisGoals) &&
    Array.isArray(payload.corpusBoundaries) &&
    typeof payload.researchContext === 'string' &&
    typeof payload.defaultStrategy === 'object' &&
    Array.isArray(payload.inferenceRules) &&
    typeof payload.confirmationMode === 'string' &&
    typeof payload.version === 'number'
  );
}

/**
 * Validate a PromptArchitectConfigPayload
 */
export function validatePromptArchitectConfigPayload(
  payload: Partial<PromptArchitectConfigPayload>
): string[] {
  const errors: string[] = [];

  // Required fields
  if (!payload.groveId) {
    errors.push('groveId is required');
  }

  if (payload.hypothesisGoals && !Array.isArray(payload.hypothesisGoals)) {
    errors.push('hypothesisGoals must be an array');
  }

  if (payload.corpusBoundaries && !Array.isArray(payload.corpusBoundaries)) {
    errors.push('corpusBoundaries must be an array');
  }

  if (payload.inferenceRules && !Array.isArray(payload.inferenceRules)) {
    errors.push('inferenceRules must be an array');
  }

  // Validate confirmation mode
  const validModes: ConfirmationMode[] = ['always', 'ambiguous', 'never'];
  if (payload.confirmationMode && !validModes.includes(payload.confirmationMode)) {
    errors.push(`Invalid confirmationMode: ${payload.confirmationMode}`);
  }

  // Validate version
  if (payload.version !== undefined && (payload.version < 1 || !Number.isInteger(payload.version))) {
    errors.push('Version must be a positive integer');
  }

  return errors;
}
