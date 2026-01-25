// src/core/schema/research-strategy.ts
// Research strategy and branch types for the Sprout Research System
// Sprint: sprout-research-v1, Phase 1a

// =============================================================================
// Research Strategy
// =============================================================================

/**
 * Research depth levels - how exhaustively to explore
 */
export type ResearchDepth = 'shallow' | 'medium' | 'deep' | 'exhaustive';

/**
 * Source type preferences for research
 */
export type SourceType = 'academic' | 'practitioner' | 'primary' | 'news';

/**
 * Research balance mode - how to weight supporting vs challenging evidence
 */
export type BalanceMode = 'supporting' | 'challenging' | 'balanced';

/**
 * Research execution strategy
 * Defines HOW research should be conducted
 */
export interface ResearchStrategy {
  /** How deep to investigate */
  depth: ResearchDepth;

  /** Preferred source types, in order of preference */
  sourceTypes: SourceType[];

  /** How to balance supporting vs challenging evidence */
  balanceMode: BalanceMode;
}

// =============================================================================
// Research Branch
// =============================================================================

/**
 * Branch execution status
 */
export type BranchStatus = 'pending' | 'active' | 'complete';

/**
 * Branch priority level
 */
export type BranchPriority = 'primary' | 'secondary' | 'exploratory';

/**
 * Evidence collected by a research branch
 */
export interface Evidence {
  /** Unique identifier */
  id: string;

  /** Source URL or reference */
  source: string;

  /** Source type classification */
  sourceType: SourceType;

  /** Extracted content */
  content: string;

  /** Relevance score (0-1) */
  relevance: number;

  /** Confidence in the evidence (0-1) */
  confidence: number;

  /** When this evidence was collected */
  collectedAt: string;

  /**
   * S22-WP: Optional metadata for display purposes
   * Stores additional info like source title that may not fit in main fields
   */
  metadata?: {
    title?: string;
    [key: string]: unknown;
  };
}

/**
 * A research branch - a distinct line of inquiry within a sprout
 */
export interface ResearchBranch {
  /** Unique identifier */
  id: string;

  /** Human-readable label */
  label: string;

  /** Search queries to execute */
  queries: string[];

  /** Priority level */
  priority: BranchPriority;

  /** Execution status */
  status: BranchStatus;

  /** Collected evidence (populated during execution) */
  evidence?: Evidence[];
}

/**
 * Template for auto-populating branches based on inference rules
 */
export interface BranchTemplate {
  /** Template identifier */
  id: string;

  /** Label template (may include placeholders) */
  label: string;

  /** Default queries */
  queries: string[];

  /** Default priority */
  priority: BranchPriority;
}

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default research strategy for new sprouts
 */
export const DEFAULT_RESEARCH_STRATEGY: ResearchStrategy = {
  depth: 'medium',
  sourceTypes: ['academic', 'practitioner', 'primary'],
  balanceMode: 'balanced',
};
