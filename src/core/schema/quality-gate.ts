// src/core/schema/quality-gate.ts
// Quality gate configuration for the Sprout Research System
// Sprint: sprout-research-v1, Phase 1a
//
// Quality gates provide system-level QA without blocking creativity.
// They ensure individual researchers explore within the grove's hypothesis space.
// Gates are optional—a grove can operate without them—but when enabled,
// they catch drift before wasting compute.

// =============================================================================
// Review Threshold
// =============================================================================

/**
 * When to require human review of research results
 */
export type ReviewThreshold = 'all' | 'low-confidence' | 'none';

// =============================================================================
// Quality Gate Configuration
// =============================================================================

/**
 * Quality gate configuration for a grove's research system
 *
 * These settings control how strictly the system enforces
 * hypothesis alignment and research quality.
 */
export interface QualityGateConfig {
  /** Master toggle - gates have no effect when disabled */
  enabled: boolean;

  // === Intake Gates ===
  // Applied when a new spark is submitted

  /** Reject sparks that don't align with grove hypothesis goals */
  enforceHypothesisAlignment: boolean;

  /** How strictly to enforce alignment (0-1, higher = stricter) */
  alignmentThreshold?: number;

  /** Force clarification dialog if spark is too vague */
  requireMinimumContext: boolean;

  // === Execution Gates ===
  // Applied during research execution

  /** Maximum depth for recursive agent spawning */
  maxSpawnDepth: number;

  /** Maximum branches per individual sprout */
  maxBranchesPerSprout: number;

  // === Review Gates ===
  // Applied before marking research as ready

  /** When to require human review */
  reviewThreshold: ReviewThreshold;

  /** Confidence score below which review is required (0-1) */
  confidenceFloor?: number;

  // === User Experience ===

  /** Custom message shown when a spark is rejected */
  rejectionMessage?: string;
}

// =============================================================================
// Gate Decision Record
// =============================================================================

/**
 * Record of a quality gate decision
 * Used for audit trail and debugging
 */
export interface GateDecision {
  /** Which gate made this decision */
  gateId: string;

  /** Gate type for categorization */
  gateType: 'intake' | 'execution' | 'review';

  /** Whether the gate passed or blocked */
  passed: boolean;

  /** Human-readable reason */
  reason: string;

  /** Computed score if applicable */
  score?: number;

  /** Threshold that was applied */
  threshold?: number;

  /** Timestamp of decision */
  decidedAt: string;
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default quality gate configuration - permissive for MVP
 */
export const DEFAULT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  enabled: false, // Off by default - opt-in feature
  enforceHypothesisAlignment: false,
  alignmentThreshold: 0.5,
  requireMinimumContext: false,
  maxSpawnDepth: 2,
  maxBranchesPerSprout: 5,
  reviewThreshold: 'none',
  confidenceFloor: 0.3,
};

/**
 * Strict quality gate configuration - for production groves
 */
export const STRICT_QUALITY_GATE_CONFIG: QualityGateConfig = {
  enabled: true,
  enforceHypothesisAlignment: true,
  alignmentThreshold: 0.7,
  requireMinimumContext: true,
  maxSpawnDepth: 3,
  maxBranchesPerSprout: 8,
  reviewThreshold: 'low-confidence',
  confidenceFloor: 0.5,
  rejectionMessage: 'This research topic appears to be outside the scope of this grove. Please refine your spark to align with our research objectives.',
};
