// src/core/context-fields/types.ts
// Context Fields type definitions for 4D prompt targeting
// Sprint: genesis-context-fields-v1

// ============================================================================
// STAGE TYPE (Maps from SessionStage)
// ============================================================================

/**
 * Stage in user lifecycle (Context Fields terminology)
 * Maps from SessionStage: ARRIVAL→genesis, ORIENTED→exploration, etc.
 */
export type Stage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

/**
 * Map SessionStage to Stage
 */
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

export function mapSessionStageToStage(sessionStage: SessionStage): Stage {
  const mapping: Record<SessionStage, Stage> = {
    'ARRIVAL': 'genesis',
    'ORIENTED': 'exploration',
    'EXPLORING': 'synthesis',
    'ENGAGED': 'advocacy',
  };
  return mapping[sessionStage];
}

// ============================================================================
// CONTEXT STATE (4D Aggregation)
// ============================================================================

/**
 * Aggregated 4-dimensional context state
 */
export interface ContextState {
  stage: Stage;
  entropy: number;                // 0.0-1.0
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}

// ============================================================================
// CONTEXT TARGETING (Declarative Filters)
// ============================================================================

/**
 * Declarative targeting criteria for when a prompt is relevant
 */
export interface ContextTargeting {
  stages?: Stage[];
  excludeStages?: Stage[];
  entropyWindow?: { min?: number; max?: number };
  lensIds?: string[];
  excludeLenses?: string[];
  momentTriggers?: string[];
  requireMoment?: boolean;
  minInteractions?: number;
  afterPromptIds?: string[];
  topicClusters?: string[];
}

// ============================================================================
// AFFINITIES (Weighted Connections)
// ============================================================================

/**
 * Topic affinity for weighted connections
 */
export interface TopicAffinity {
  topicId: string;
  weight: number;  // 0.0-1.0
}

/**
 * Lens affinity with optional label override
 */
export interface LensAffinity {
  lensId: string;
  weight: number;  // 0.0-1.0
  customLabel?: string;
}

// ============================================================================
// PROMPT ANALYTICS
// ============================================================================

/**
 * Prompt analytics
 */
export interface PromptStats {
  impressions: number;
  selections: number;
  completions: number;
  avgEntropyDelta: number;
  avgDwellAfter: number;
  lastSurfaced?: number;
}

// ============================================================================
// GENERATION CONTEXT (Provenance)
// ============================================================================

/**
 * Generation provenance
 */
export interface GenerationContext {
  sessionId: string;
  telemetrySnapshot: Record<string, unknown>;
  generatedAt: number;
  reasoning: string;
}

// ============================================================================
// PROMPT OBJECT (First-Class DEX Object)
// ============================================================================

/**
 * First-class DEX object for prompts
 */
export interface PromptObject {
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;
  
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  
  targeting: ContextTargeting;
  baseWeight?: number;
  
  stats: PromptStats;
  
  status: 'draft' | 'active' | 'deprecated';
  source: 'library' | 'generated' | 'user';
  generatedFrom?: GenerationContext;
  
  cooldown?: number;
  maxShows?: number;
}

// ============================================================================
// SCORING (Weights & Results)
// ============================================================================

/**
 * Scoring weights (configurable per lens)
 */
export interface ScoringWeights {
  stageMatch: number;       // Default: 2.0
  entropyFit: number;       // Default: 1.5
  lensPrecision: number;    // Default: 3.0
  topicRelevance: number;   // Default: 2.0
  momentBoost: number;      // Default: 3.0
  baseWeightScale: number;  // Default: 0.5
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  stageMatch: 2.0,
  entropyFit: 1.5,
  lensPrecision: 3.0,
  topicRelevance: 2.0,
  momentBoost: 3.0,
  baseWeightScale: 0.5,
};

/**
 * Scored prompt result
 */
export interface ScoredPrompt {
  prompt: PromptObject;
  score: number;
  matchDetails: {
    stageMatch: boolean;
    entropyFit: boolean;
    lensWeight: number;
    topicWeight: number;
    momentBoosts: number;
  };
}
