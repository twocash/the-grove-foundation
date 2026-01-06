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
  // Prompt progression tracking (Sprint: prompt-progression-v1)
  promptsSelected: string[];
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
// PROVENANCE (Exploration Node Source Tracking)
// Sprint: exploration-node-unification-v1
// ============================================================================

/**
 * Provenance type - where the prompt originated
 */
export type ProvenanceType = 'authored' | 'extracted' | 'generated' | 'submitted';

/**
 * Review status for non-authored prompts
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/**
 * Provenance tracking for exploration nodes
 */
export interface PromptProvenance {
  type: ProvenanceType;
  reviewStatus: ReviewStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  // Authored
  authorId?: string;
  authorName?: string;
  // Extracted
  sourceDocIds?: string[];
  sourceDocTitles?: string[];
  extractedAt?: number;
  extractionModel?: string;
  extractionConfidence?: number;
  /** Method used for extraction @added highlight-extraction-v1 */
  extractionMethod?: 'general' | 'highlight-concept-detection';
  // Generated
  gapAnalysisId?: string;
  generationReason?: string;
  coverageGap?: { stage?: string; lens?: string; topic?: string };
}

/**
 * Default provenance for authored prompts
 */
export const AUTHORED_PROVENANCE: PromptProvenance = {
  type: 'authored',
  reviewStatus: 'approved',
  authorId: 'system',
  authorName: 'Grove Team',
};

/**
 * Create provenance for extracted prompt
 */
export function createExtractedProvenance(
  sourceDocIds: string[],
  sourceDocTitles: string[],
  confidence: number,
  model: string = 'gemini-2.0-flash'
): PromptProvenance {
  return {
    type: 'extracted',
    reviewStatus: 'pending',
    sourceDocIds,
    sourceDocTitles,
    extractedAt: Date.now(),
    extractionModel: model,
    extractionConfidence: confidence,
  };
}

// ============================================================================
// PROMPT SURFACES (Multi-context rendering)
// Sprint: kinetic-highlights-v1
// ============================================================================

/**
 * Where a prompt can be rendered
 * - suggestion: Standard prompt suggestions panel
 * - highlight: Clickable concepts in kinetic text
 * - journey: Steps in guided journeys
 * - followup: Contextual follow-up suggestions
 */
export type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

/**
 * Match mode for highlight triggers
 */
export type HighlightMatchMode = 'exact' | 'contains';

/**
 * Text pattern that triggers a prompt in highlight context
 */
export interface HighlightTrigger {
  /** Text that activates this prompt */
  text: string;
  /** How to match the text */
  matchMode: HighlightMatchMode;
  /** Case sensitivity (default: false) */
  caseSensitive?: boolean;
}

/**
 * Default surfaces when not specified
 */
export const DEFAULT_PROMPT_SURFACES: PromptSurface[] = ['suggestion'];

/**
 * Check if a prompt can render on a given surface
 */
export function canRenderOnSurface(
  prompt: PromptObject, 
  surface: PromptSurface
): boolean {
  const surfaces = prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
  return surfaces.includes(surface);
}

/**
 * Get all surfaces a prompt can render on
 */
export function getPromptSurfaces(prompt: PromptObject): PromptSurface[] {
  return prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
}

// ============================================================================
// GENERATION CONTEXT (Legacy Provenance)
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

  // === Sprint: exploration-node-unification-v1 ===

  /** Provenance tracking - where this prompt came from */
  provenance?: PromptProvenance;

  /** Embedding for similarity matching (optional) */
  embedding?: number[];

  // === Sprint: kinetic-highlights-v1 ===

  /** Where this prompt can appear (default: ['suggestion']) */
  surfaces?: PromptSurface[];

  /** For highlight surface: text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
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
