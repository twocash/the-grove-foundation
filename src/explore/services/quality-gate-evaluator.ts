// src/explore/services/quality-gate-evaluator.ts
// Quality gate evaluation logic for the Sprout Research System
// Sprint: sprout-research-v1, Phase 1d
//
// Quality gates provide system-level QA without blocking creativity.
// They ensure researchers explore within the grove's hypothesis space.
// Gates are optional—a grove can operate without them.

import type {
  QualityGateConfig,
  GateDecision,
  ReviewThreshold,
} from '@core/schema/quality-gate';
import type { PromptArchitectConfigPayload } from '@core/schema/prompt-architect-config';
import type { ResearchBranch } from '@core/schema/research-strategy';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for intake gate evaluation
 */
export interface IntakeGateInput {
  /** User's original spark */
  spark: string;

  /** Inference confidence from the inference engine */
  inferenceConfidence: number;

  /** Grove's hypothesis goals */
  hypothesisGoals: string[];

  /** Inferred branches (if any) */
  branches: { id: string; label: string }[];
}

/**
 * Input for execution gate evaluation
 */
export interface ExecutionGateInput {
  /** Current spawn depth (0 = root sprout) */
  spawnDepth: number;

  /** Number of branches in the manifest */
  branchCount: number;

  /** Parent sprout ID (if agent-spawned) */
  parentSproutId?: string;
}

/**
 * Input for review gate evaluation
 */
export interface ReviewGateInput {
  /** Overall confidence score for the research results */
  confidence: number;

  /** Number of branches that completed successfully */
  completedBranches: number;

  /** Total number of branches */
  totalBranches: number;

  /** Whether any evidence was collected */
  hasEvidence: boolean;
}

/**
 * Result of gate evaluation
 */
export interface GateEvaluationResult {
  /** Whether all gates passed */
  passed: boolean;

  /** Individual gate decisions */
  decisions: GateDecision[];

  /** Blocking decision (if any) */
  blockingDecision?: GateDecision;

  /** Suggested action for the user */
  suggestion?: string;
}

// =============================================================================
// Intake Gates
// =============================================================================

/**
 * Evaluate intake gates before creating a research sprout
 *
 * @param input - Information about the spark and inference
 * @param config - Quality gate configuration
 * @returns Gate evaluation result
 */
export function evaluateIntakeGates(
  input: IntakeGateInput,
  config: QualityGateConfig | undefined
): GateEvaluationResult {
  const decisions: GateDecision[] = [];

  // Gates disabled - auto-pass
  if (!config?.enabled) {
    return {
      passed: true,
      decisions: [{
        gateId: 'intake-disabled',
        gateType: 'intake',
        passed: true,
        reason: 'Quality gates are disabled for this grove',
        decidedAt: new Date().toISOString(),
      }],
    };
  }

  // Gate: Hypothesis alignment
  if (config.enforceHypothesisAlignment) {
    const alignmentScore = calculateHypothesisAlignment(input.spark, input.hypothesisGoals);
    const threshold = config.alignmentThreshold ?? 0.5;
    const passed = alignmentScore >= threshold;

    decisions.push({
      gateId: 'hypothesis-alignment',
      gateType: 'intake',
      passed,
      reason: passed
        ? `Spark aligns with grove hypothesis (${Math.round(alignmentScore * 100)}%)`
        : `Spark may be off-topic (${Math.round(alignmentScore * 100)}% alignment, requires ${Math.round(threshold * 100)}%)`,
      score: alignmentScore,
      threshold,
      decidedAt: new Date().toISOString(),
    });
  }

  // Gate: Minimum context
  if (config.requireMinimumContext) {
    const hasContext = input.inferenceConfidence > 0.3 || input.branches.length > 0;

    decisions.push({
      gateId: 'minimum-context',
      gateType: 'intake',
      passed: hasContext,
      reason: hasContext
        ? 'Sufficient context inferred from spark'
        : 'Spark is too vague - please provide more detail',
      score: input.inferenceConfidence,
      decidedAt: new Date().toISOString(),
    });
  }

  // Check for blocking decisions
  const blockingDecision = decisions.find(d => !d.passed);

  return {
    passed: !blockingDecision,
    decisions,
    blockingDecision,
    suggestion: blockingDecision
      ? config.rejectionMessage || getSuggestionForBlockedGate(blockingDecision)
      : undefined,
  };
}

// =============================================================================
// Execution Gates
// =============================================================================

/**
 * Evaluate execution gates before spawning child sprouts or adding branches
 *
 * @param input - Information about the current execution state
 * @param config - Quality gate configuration
 * @returns Gate evaluation result
 */
export function evaluateExecutionGates(
  input: ExecutionGateInput,
  config: QualityGateConfig | undefined
): GateEvaluationResult {
  const decisions: GateDecision[] = [];

  // Gates disabled - auto-pass
  if (!config?.enabled) {
    return {
      passed: true,
      decisions: [{
        gateId: 'execution-disabled',
        gateType: 'execution',
        passed: true,
        reason: 'Quality gates are disabled for this grove',
        decidedAt: new Date().toISOString(),
      }],
    };
  }

  // Gate: Spawn depth limit
  const maxDepth = config.maxSpawnDepth ?? 2;
  const depthPassed = input.spawnDepth < maxDepth;

  decisions.push({
    gateId: 'spawn-depth',
    gateType: 'execution',
    passed: depthPassed,
    reason: depthPassed
      ? `Spawn depth ${input.spawnDepth} is within limit (max: ${maxDepth})`
      : `Maximum spawn depth reached (${input.spawnDepth}/${maxDepth})`,
    score: input.spawnDepth,
    threshold: maxDepth,
    decidedAt: new Date().toISOString(),
  });

  // Gate: Branch count limit
  const maxBranches = config.maxBranchesPerSprout ?? 5;
  const branchPassed = input.branchCount <= maxBranches;

  decisions.push({
    gateId: 'branch-count',
    gateType: 'execution',
    passed: branchPassed,
    reason: branchPassed
      ? `Branch count ${input.branchCount} is within limit (max: ${maxBranches})`
      : `Too many branches (${input.branchCount}/${maxBranches})`,
    score: input.branchCount,
    threshold: maxBranches,
    decidedAt: new Date().toISOString(),
  });

  // Check for blocking decisions
  const blockingDecision = decisions.find(d => !d.passed);

  return {
    passed: !blockingDecision,
    decisions,
    blockingDecision,
    suggestion: blockingDecision
      ? getSuggestionForBlockedGate(blockingDecision)
      : undefined,
  };
}

// =============================================================================
// Review Gates
// =============================================================================

/**
 * Evaluate review gates before marking research as ready
 *
 * @param input - Information about the research results
 * @param config - Quality gate configuration
 * @returns Gate evaluation result with review requirement
 */
export function evaluateReviewGates(
  input: ReviewGateInput,
  config: QualityGateConfig | undefined
): GateEvaluationResult & { requiresReview: boolean } {
  const decisions: GateDecision[] = [];
  let requiresReview = false;

  // Gates disabled - auto-pass, no review required
  if (!config?.enabled) {
    return {
      passed: true,
      requiresReview: false,
      decisions: [{
        gateId: 'review-disabled',
        gateType: 'review',
        passed: true,
        reason: 'Quality gates are disabled for this grove',
        decidedAt: new Date().toISOString(),
      }],
    };
  }

  // Determine if review is required based on threshold
  const reviewThreshold = config.reviewThreshold ?? 'none';

  switch (reviewThreshold) {
    case 'all':
      requiresReview = true;
      decisions.push({
        gateId: 'review-all',
        gateType: 'review',
        passed: true,
        reason: 'All research requires human review in this grove',
        decidedAt: new Date().toISOString(),
      });
      break;

    case 'low-confidence':
      const confidenceFloor = config.confidenceFloor ?? 0.5;
      requiresReview = input.confidence < confidenceFloor;

      decisions.push({
        gateId: 'review-confidence',
        gateType: 'review',
        passed: true, // This gate doesn't block, just flags for review
        reason: requiresReview
          ? `Low confidence (${Math.round(input.confidence * 100)}%) - requires review`
          : `Confidence ${Math.round(input.confidence * 100)}% exceeds threshold`,
        score: input.confidence,
        threshold: confidenceFloor,
        decidedAt: new Date().toISOString(),
      });
      break;

    case 'none':
    default:
      decisions.push({
        gateId: 'review-none',
        gateType: 'review',
        passed: true,
        reason: 'No automatic review required',
        decidedAt: new Date().toISOString(),
      });
      break;
  }

  // Additional review triggers
  if (!input.hasEvidence) {
    requiresReview = true;
    decisions.push({
      gateId: 'no-evidence',
      gateType: 'review',
      passed: true, // Warning, not blocking
      reason: 'No evidence collected - manual review recommended',
      decidedAt: new Date().toISOString(),
    });
  }

  const completionRate = input.completedBranches / Math.max(1, input.totalBranches);
  if (completionRate < 0.5) {
    requiresReview = true;
    decisions.push({
      gateId: 'low-completion',
      gateType: 'review',
      passed: true, // Warning, not blocking
      reason: `Only ${Math.round(completionRate * 100)}% of branches completed`,
      score: completionRate,
      decidedAt: new Date().toISOString(),
    });
  }

  return {
    passed: true, // Review gates don't block, they flag
    requiresReview,
    decisions,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate hypothesis alignment score
 * Simple keyword-based matching for MVP - can be upgraded to embeddings later
 */
function calculateHypothesisAlignment(spark: string, goals: string[]): number {
  if (goals.length === 0) return 1; // No goals = everything aligns

  const sparkLower = spark.toLowerCase();
  const sparkWords = new Set(sparkLower.split(/\s+/));

  let totalMatches = 0;
  let totalWords = 0;

  for (const goal of goals) {
    const goalWords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    totalWords += goalWords.length;

    for (const word of goalWords) {
      if (sparkWords.has(word) || sparkLower.includes(word)) {
        totalMatches++;
      }
    }
  }

  if (totalWords === 0) return 1;

  // Score is ratio of matching words, with bonus for multiple goal coverage
  const baseScore = totalMatches / totalWords;
  return Math.min(1, baseScore * 1.5); // Allow score up to 1.0
}

/**
 * Get a helpful suggestion for a blocked gate
 */
function getSuggestionForBlockedGate(decision: GateDecision): string {
  switch (decision.gateId) {
    case 'hypothesis-alignment':
      return 'Try rephrasing your spark to more directly relate to this grove\'s research objectives.';
    case 'minimum-context':
      return 'Your spark is too brief. Add more detail about what you want to investigate.';
    case 'spawn-depth':
      return 'This research has reached maximum depth. Consider synthesizing findings instead of spawning new branches.';
    case 'branch-count':
      return 'Too many branches. Focus on the most important lines of inquiry.';
    default:
      return 'Please refine your research request.';
  }
}

/**
 * Create a summary of all gate evaluations for logging
 */
export function summarizeGateEvaluations(
  intake: GateEvaluationResult,
  execution?: GateEvaluationResult,
  review?: GateEvaluationResult & { requiresReview: boolean }
): string {
  const parts: string[] = [];

  parts.push(`Intake: ${intake.passed ? 'PASS' : 'BLOCKED'}`);

  if (execution) {
    parts.push(`Execution: ${execution.passed ? 'PASS' : 'BLOCKED'}`);
  }

  if (review) {
    parts.push(`Review: ${review.requiresReview ? 'REQUIRED' : 'AUTO-APPROVE'}`);
  }

  return parts.join(' | ');
}
