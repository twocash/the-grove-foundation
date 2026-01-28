// src/core/schema/research-sprout.ts
// Research Sprout - Agent-driven research object
// Sprint: sprout-research-v1, Phase 2a
//
// PATTERN: INSTANCE (contrast with PromptArchitectConfig SINGLETON)
// - MANY active ResearchSprouts per grove simultaneously
// - Each sprout has its own independent version chain
// - Parent-child relationships via parentSproutId
//
// Key differences from capture-based Sprout:
// - Research-initiated, not capture-initiated
// - Agent-driven execution, not user-driven save
// - Supabase-stored (grove-level), not localStorage (browser-level)
// - Full lifecycle with status machine

import type { ResearchStrategy, ResearchBranch, Evidence } from './research-strategy';
import type { ConfirmationMode } from './prompt-architect-config';
import type { ResearchDocument } from './research-document';
// S22-WP: Import canonical research for 100% lossless structured output storage
// S26-NUR: Import GeneratedArtifact for persistent artifact history
import type { CanonicalResearch, GeneratedArtifact } from './sprout';

// =============================================================================
// Status Lifecycle
// =============================================================================

/**
 * Research sprout status lifecycle
 *
 * State machine:
 *
 *   pending → active → completed
 *              ↓         ↓
 *           paused    archived
 *              ↓
 *           blocked
 *              ↓
 *           archived
 *
 * Transitions:
 * - pending: Created, waiting for agent pickup
 * - active: Agent is executing research
 * - paused: User paused research (can resume)
 * - blocked: Gate check failed (needs intervention)
 * - completed: Research finished successfully
 * - archived: Soft-deleted or superseded
 */
export type ResearchSproutStatus =
  | 'pending'    // Awaiting agent pickup
  | 'active'     // Agent currently executing
  | 'paused'     // User paused (resumable)
  | 'blocked'    // Quality gate failed
  | 'completed'  // Research finished
  | 'promoted'   // Promoted to Garden (S26-NUR)
  | 'archived';  // Soft-deleted

/**
 * Status transition record for audit trail
 */
export interface StatusTransition {
  /** Previous status */
  from: ResearchSproutStatus;

  /** New status */
  to: ResearchSproutStatus;

  /** Reason for transition */
  reason: string;

  /** ISO timestamp */
  transitionedAt: string;

  /** Actor (userId or 'system') */
  actor: string;
}

// =============================================================================
// Grove Config Snapshot (Provenance)
// =============================================================================

/**
 * Snapshot of PromptArchitectConfig at sprout creation time.
 *
 * This captures the grove's "research DNA" when the sprout was born.
 * If the grove config changes mid-research, we can still reconstruct
 * what context shaped THIS sprout's inference.
 *
 * DEX Pillar III: Provenance as Infrastructure
 */
export interface GroveConfigSnapshot {
  /** Config version ID at creation time */
  configVersionId: string;

  /** Hypothesis goals that applied */
  hypothesisGoals: string[];

  /** Corpus boundaries that applied */
  corpusBoundaries: string[];

  /** Confirmation mode that applied */
  confirmationMode: ConfirmationMode;
}

// =============================================================================
// Research Sprout
// =============================================================================

/**
 * ResearchSprout - A research-initiated investigation
 *
 * PATTERN: INSTANCE (many active per grove)
 * Unlike PromptArchitectConfig (SINGLETON), multiple ResearchSprouts
 * can be active simultaneously within a grove.
 *
 * Lifecycle:
 * 1. User issues `sprout:` command with a "spark" (research question)
 * 2. PromptArchitect infers context from grove config
 * 3. ResearchSprout created with status='pending'
 * 4. ResearchAgent picks up sprout, transitions to status='active'
 * 5. Agent executes branches, collects evidence
 * 6. Agent may spawn child sprouts (parentSproutId set)
 * 7. Results populate, transitions to status='completed'
 * 8. User can view in Garden Inspector panel
 */
export interface ResearchSprout {
  // ─────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────

  /** Unique identifier (UUID) */
  id: string;

  /** Grove this sprout belongs to (NOT nullable for research sprouts) */
  groveId: string;

  /** Parent sprout ID if this is a child manifest (spawned by agent) */
  parentSproutId: string | null;

  /** Depth in spawn chain (0 = root, 1 = first child, etc.) */
  spawnDepth: number;

  // ─────────────────────────────────────────────────────────────
  // Origin
  // ─────────────────────────────────────────────────────────────

  /**
   * The user's original "spark" - the research question/topic
   * This is the raw input that initiated the research.
   */
  spark: string;

  /**
   * Normalized title (auto-generated or user-edited)
   * Short, human-readable summary of the research
   */
  title: string;

  /** Creator user ID (null for anonymous/legacy) */
  creatorId: string | null;

  /** Session ID for anonymous tracking */
  sessionId: string;

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last update */
  updatedAt: string;

  // ─────────────────────────────────────────────────────────────
  // Template Selection (Sprint: research-template-wiring-v1)
  // ─────────────────────────────────────────────────────────────

  /**
   * Output template ID for research execution.
   * Links to output_templates table for provenance tracking.
   * Template's systemPrompt shapes the research agent's behavior.
   *
   * DEX Pillar III: Provenance as Infrastructure
   */
  templateId?: string;

  // ─────────────────────────────────────────────────────────────
  // Research Configuration
  // ─────────────────────────────────────────────────────────────

  /**
   * Research strategy (depth, sources, balance)
   * Populated from grove config or inference
   */
  strategy: ResearchStrategy;

  /**
   * Research branches to execute
   * Each branch is a distinct line of inquiry
   */
  branches: ResearchBranch[];

  /**
   * IDs of inference rules that fired
   * For audit trail and debugging
   */
  appliedRuleIds: string[];

  /**
   * Confidence score from inference (0-1)
   * How confident the system is about the inferred context
   */
  inferenceConfidence: number;

  // ─────────────────────────────────────────────────────────────
  // Provenance (Grove Context Snapshot)
  // ─────────────────────────────────────────────────────────────

  /**
   * Snapshot of PromptArchitectConfig at sprout creation time
   * Captures the grove's research DNA when this sprout was born.
   *
   * WHY: If grove config changes mid-research, we need to know
   * what context shaped THIS sprout's inference, not current config.
   */
  groveConfigSnapshot: GroveConfigSnapshot;

  /**
   * Prompt Architect session that produced this sprout
   * For reconstructing the intake dialogue if needed.
   * Null if zero-dialogue confirmation (confirmationMode='never').
   */
  architectSessionId: string | null;

  // ─────────────────────────────────────────────────────────────
  // Execution State
  // ─────────────────────────────────────────────────────────────

  /** Current status in lifecycle */
  status: ResearchSproutStatus;

  /** Status transition history */
  statusHistory: StatusTransition[];

  /** Agent execution metadata */
  execution?: {
    /** Agent instance ID that's processing this sprout */
    agentId: string;

    /** When execution started */
    startedAt: string;

    /** When execution completed (if done) */
    completedAt?: string;

    /** Number of API calls made */
    apiCallCount: number;

    /** Total tokens consumed */
    tokenCount: number;

    /** Error message if blocked */
    errorMessage?: string;
  };

  // ─────────────────────────────────────────────────────────────
  // Results
  // ─────────────────────────────────────────────────────────────

  /**
   * Synthesized research output
   * Populated when status transitions to 'completed'
   */
  synthesis?: {
    /** Summary of findings */
    summary: string;

    /** Key insights extracted */
    insights: string[];

    /** Overall confidence score (0-1) */
    confidence: number;

    /** When synthesis was generated */
    synthesizedAt: string;
  };

  /**
   * All collected evidence across branches
   * Aggregated from branch.evidence arrays
   */
  evidence: Evidence[];

  /**
   * Full ResearchDocument generated by writer agent.
   * Stored when pipeline completes for direct display.
   * If absent (legacy sprouts), use sproutToResearchDocument() fallback.
   */
  researchDocument?: ResearchDocument;

  /**
   * S22-WP: 100% lossless canonical research from structured API output.
   * Contains the FULL structured output from `deliver_research_results` tool.
   * Single source of truth for research results - refinement happens in Writer.
   *
   * DEX Pillar III: Provenance as Infrastructure
   * @see CanonicalResearch type in sprout.ts for full structure
   */
  canonicalResearch?: CanonicalResearch;

  /**
   * S26-NUR: Generated artifacts from Writer agent, persisted to Supabase.
   * Each artifact is a document generated via a Writer template.
   * Mapped from `generated_artifacts` column in research_sprouts table.
   */
  generatedArtifacts?: GeneratedArtifact[];

  /**
   * IDs of child sprouts spawned during research
   * For tree navigation in Garden Inspector
   */
  childSproutIds: string[];

  // ─────────────────────────────────────────────────────────────
  // User Interaction
  // ─────────────────────────────────────────────────────────────

  /** User-assigned tags */
  tags: string[];

  /** User notes/annotations */
  notes: string | null;

  /** Whether user has reviewed this sprout */
  reviewed: boolean;

  /** User rating (1-5, null if unrated) */
  rating: number | null;

  // ─────────────────────────────────────────────────────────────
  // Quality Gates
  // ─────────────────────────────────────────────────────────────

  /**
   * Gate decisions made during lifecycle
   * Captures intake, execution, and review gate outcomes
   */
  gateDecisions: GateDecisionRecord[];

  /** Whether this sprout requires human review before completion */
  requiresReview: boolean;
}

/**
 * Record of a quality gate decision
 */
export interface GateDecisionRecord {
  /** Gate identifier */
  gateId: string;

  /** Gate type */
  gateType: 'intake' | 'execution' | 'review';

  /** Whether the gate passed */
  passed: boolean;

  /** Human-readable reason */
  reason: string;

  /** Score if applicable */
  score?: number;

  /** Threshold if applicable */
  threshold?: number;

  /** ISO timestamp */
  decidedAt: string;
}

// =============================================================================
// Creation Types
// =============================================================================

/**
 * Input for creating a new ResearchSprout
 * Used by the Prompt Architect when processing `sprout:` commands
 */
export interface CreateResearchSproutInput {
  /** User's spark (research question) */
  spark: string;

  /** Grove ID (required) */
  groveId: string;

  /** Parent sprout ID if child spawn */
  parentSproutId?: string;

  /**
   * Output template ID for research execution.
   * Sprint: research-template-wiring-v1
   */
  templateId?: string;

  /** Inferred strategy (from grove config) */
  strategy: ResearchStrategy;

  /** Inferred branches (from inference rules) */
  branches: ResearchBranch[];

  /** Rule IDs that fired */
  appliedRuleIds: string[];

  /** Inference confidence */
  inferenceConfidence: number;

  /**
   * Grove config snapshot (required for provenance)
   * Captures the grove's research DNA at creation time
   */
  groveConfigSnapshot: GroveConfigSnapshot;

  /**
   * Architect session ID (null if zero-dialogue confirmation)
   * Links to the intake dialogue for audit trail
   */
  architectSessionId?: string;

  /** Creator user ID (optional) */
  creatorId?: string;

  /** Session ID */
  sessionId: string;

  /** Initial tags (optional) */
  tags?: string[];

  /** Initial notes (optional) */
  notes?: string;
}

/**
 * Create a fallback branch when none provided
 * S22-WP: Defensive guard against zero API calls
 */
function createFallbackBranch(spark: string): ResearchBranch {
  return {
    id: `main-${Date.now()}`,
    label: 'Main Research',
    queries: [spark],
    status: 'pending',
    priority: 1,
    evidence: [],
  };
}

/**
 * Create a new ResearchSprout with defaults
 */
export function createResearchSprout(
  input: CreateResearchSproutInput
): Omit<ResearchSprout, 'id'> {
  const now = new Date().toISOString();

  // S22-WP: CRITICAL - Ensure branches is NEVER empty
  // Zero branches = zero API calls = tiny useless stubs
  const branches = input.branches && input.branches.length > 0
    ? input.branches
    : [createFallbackBranch(input.spark)];

  if (!input.branches?.length) {
    console.warn(`[createResearchSprout] ⚠️ No branches provided, using fallback for: "${input.spark.slice(0, 50)}..."`);
  }

  return {
    groveId: input.groveId,
    parentSproutId: input.parentSproutId ?? null,
    spawnDepth: input.parentSproutId ? 1 : 0, // Will be computed properly by service

    spark: input.spark,
    title: generateTitle(input.spark),
    creatorId: input.creatorId ?? null,
    sessionId: input.sessionId,
    createdAt: now,
    updatedAt: now,

    // Template selection (Sprint: research-template-wiring-v1)
    templateId: input.templateId,

    strategy: input.strategy,
    branches,
    appliedRuleIds: input.appliedRuleIds,
    inferenceConfidence: input.inferenceConfidence,

    // Provenance snapshot (DEX Pillar III)
    groveConfigSnapshot: input.groveConfigSnapshot,
    architectSessionId: input.architectSessionId ?? null,

    status: 'pending',
    statusHistory: [{
      from: 'pending' as ResearchSproutStatus, // Initial state
      to: 'pending',
      reason: 'Created via sprout: command',
      transitionedAt: now,
      actor: input.creatorId ?? 'anonymous',
    }],

    evidence: [],
    childSproutIds: [],

    tags: input.tags ?? [],
    notes: input.notes ?? null,
    reviewed: false,
    rating: null,

    gateDecisions: [],
    requiresReview: false,
  };
}

/**
 * Generate a title from the spark
 * Simple heuristic: first 50 chars, truncated at word boundary
 */
function generateTitle(spark: string): string {
  const maxLen = 50;
  if (spark.length <= maxLen) return spark;

  const truncated = spark.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 20
    ? truncated.slice(0, lastSpace) + '...'
    : truncated + '...';
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Valid status values for type guard
 */
const VALID_STATUSES: ResearchSproutStatus[] = [
  'pending', 'active', 'paused', 'blocked', 'completed', 'promoted', 'archived'
];

/**
 * Check if an object is a valid ResearchSprout
 */
export function isResearchSprout(obj: unknown): obj is ResearchSprout {
  if (!obj || typeof obj !== 'object') return false;

  const rs = obj as Partial<ResearchSprout>;

  return (
    typeof rs.id === 'string' &&
    typeof rs.groveId === 'string' &&
    typeof rs.spark === 'string' &&
    typeof rs.title === 'string' &&
    typeof rs.status === 'string' &&
    VALID_STATUSES.includes(rs.status as ResearchSproutStatus) &&
    Array.isArray(rs.branches) &&
    Array.isArray(rs.evidence) &&
    // Provenance check
    rs.groveConfigSnapshot !== undefined &&
    typeof rs.groveConfigSnapshot === 'object' &&
    typeof rs.groveConfigSnapshot.configVersionId === 'string'
  );
}

/**
 * Check if a sprout can transition to a given status
 */
export function canTransitionTo(
  current: ResearchSproutStatus,
  target: ResearchSproutStatus
): boolean {
  const allowedTransitions: Record<ResearchSproutStatus, ResearchSproutStatus[]> = {
    pending: ['active', 'archived'],
    active: ['paused', 'blocked', 'completed', 'archived'],
    paused: ['active', 'archived'],
    blocked: ['archived'],
    completed: ['promoted', 'archived'],
    promoted: ['archived'],
    archived: [], // Terminal state
  };

  return allowedTransitions[current]?.includes(target) ?? false;
}

// =============================================================================
// Constants
// =============================================================================

/** Maximum spawn depth allowed (configurable via quality gates) */
export const DEFAULT_MAX_SPAWN_DEPTH = 2;

/** Maximum branches per sprout (configurable via quality gates) */
export const DEFAULT_MAX_BRANCHES = 5;
