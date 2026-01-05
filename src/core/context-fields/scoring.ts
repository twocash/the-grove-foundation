// src/core/context-fields/scoring.ts
// Context Fields scoring and filtering functions
// Sprint: genesis-context-fields-v1

import type { 
  PromptObject, 
  ContextState, 
  ScoringWeights, 
  ScoredPrompt 
} from './types';
import { DEFAULT_SCORING_WEIGHTS } from './types';

// ============================================================================
// HARD FILTERS (Disqualifying Criteria)
// ============================================================================

/**
 * Apply hard filters that disqualify prompts entirely.
 * Hard filters: stage mismatch, lens excluded, minInteractions not met, already selected
 * Sprint: prompt-progression-v1 - Added already-selected filter
 */
export function applyHardFilters(
  prompts: PromptObject[],
  context: ContextState
): PromptObject[] {
  return prompts.filter(prompt => {
    const { targeting } = prompt;

    // Already selected filter (Sprint: prompt-progression-v1)
    // Remove prompts the user has already clicked
    if (context.promptsSelected?.includes(prompt.id)) {
      return false;
    }

    // Stage filter
    if (targeting.stages && targeting.stages.length > 0) {
      if (!targeting.stages.includes(context.stage)) {
        return false;
      }
    }
    if (targeting.excludeStages?.includes(context.stage)) {
      return false;
    }

    // Lens exclusion (hard filter)
    if (targeting.excludeLenses?.includes(context.activeLensId ?? '')) {
      return false;
    }

    // Lens inclusion (hard filter) - if lensIds specified, require match
    if (targeting.lensIds && targeting.lensIds.length > 0) {
      if (!context.activeLensId || !targeting.lensIds.includes(context.activeLensId)) {
        return false;
      }
    }

    // Minimum interactions
    if (targeting.minInteractions && context.interactionCount < targeting.minInteractions) {
      return false;
    }

    // Require moment
    if (targeting.requireMoment && targeting.momentTriggers) {
      const hasMatch = targeting.momentTriggers.some(m => context.activeMoments.includes(m));
      if (!hasMatch) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// SOFT SCORING (Relevance Calculation)
// ============================================================================

/**
 * Calculate relevance score for a single prompt.
 */
export function calculateRelevance(
  prompt: PromptObject,
  context: ContextState,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const { targeting } = prompt;
  let score = 0;
  
  // Stage match (already filtered, but adds weight)
  const stageMatch = !targeting.stages || targeting.stages.includes(context.stage);
  if (stageMatch) {
    score += weights.stageMatch;
  }
  
  // Entropy fit
  const { entropyWindow } = targeting;
  let entropyFit = true;
  if (entropyWindow) {
    if (entropyWindow.min !== undefined && context.entropy < entropyWindow.min) {
      entropyFit = false;
    }
    if (entropyWindow.max !== undefined && context.entropy > entropyWindow.max) {
      entropyFit = false;
    }
  }
  if (entropyFit) {
    score += weights.entropyFit;
  }
  
  // Lens precision
  let lensWeight = 0;
  if (context.activeLensId) {
    const affinity = prompt.lensAffinities.find(a => a.lensId === context.activeLensId);
    if (affinity) {
      lensWeight = affinity.weight;
      score += lensWeight * weights.lensPrecision;
    }
  }
  
  // Topic relevance
  let topicWeight = 0;
  if (context.topicsExplored.length > 0) {
    const matchingAffinities = prompt.topicAffinities.filter(
      a => context.topicsExplored.includes(a.topicId)
    );
    if (matchingAffinities.length > 0) {
      topicWeight = Math.max(...matchingAffinities.map(a => a.weight));
      score += topicWeight * weights.topicRelevance;
    }
  }
  
  // Moment boost (additive per matching moment)
  let momentBoosts = 0;
  if (targeting.momentTriggers) {
    for (const moment of targeting.momentTriggers) {
      if (context.activeMoments.includes(moment)) {
        momentBoosts += weights.momentBoost;
      }
    }
  }
  score += momentBoosts;
  
  // Base weight contribution
  const baseWeight = prompt.baseWeight ?? 50;
  score += (baseWeight / 100) * weights.baseWeightScale;
  
  return score;
}

// ============================================================================
// RANKING (Score and Sort)
// ============================================================================

/**
 * Score and rank prompts by relevance.
 */
export function rankPrompts(
  prompts: PromptObject[],
  context: ContextState,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoredPrompt[] {
  const scored = prompts.map(prompt => {
    const score = calculateRelevance(prompt, context, weights);
    const { targeting } = prompt;
    
    // Calculate match details
    const stageMatch = !targeting.stages || targeting.stages.includes(context.stage);
    
    let entropyFit = true;
    if (targeting.entropyWindow) {
      if (targeting.entropyWindow.min !== undefined && context.entropy < targeting.entropyWindow.min) {
        entropyFit = false;
      }
      if (targeting.entropyWindow.max !== undefined && context.entropy > targeting.entropyWindow.max) {
        entropyFit = false;
      }
    }
    
    const lensWeight = context.activeLensId
      ? (prompt.lensAffinities.find(a => a.lensId === context.activeLensId)?.weight ?? 0)
      : 0;
    
    const topicWeights = prompt.topicAffinities
      .filter(a => context.topicsExplored.includes(a.topicId))
      .map(a => a.weight);
    const topicWeight = topicWeights.length > 0 ? Math.max(...topicWeights) : 0;
    
    const momentBoosts = (targeting.momentTriggers ?? [])
      .filter(m => context.activeMoments.includes(m)).length * weights.momentBoost;
    
    return {
      prompt,
      score,
      matchDetails: {
        stageMatch,
        entropyFit,
        lensWeight,
        topicWeight,
        momentBoosts,
      },
    };
  });
  
  return scored.sort((a, b) => b.score - a.score);
}

// ============================================================================
// SELECTION PIPELINE (Filter → Score → Rank)
// ============================================================================

/**
 * Full selection pipeline: filter, score, and select top prompts
 */
export function selectPrompts(
  prompts: PromptObject[],
  context: ContextState,
  options: {
    maxPrompts?: number;
    weights?: Partial<ScoringWeights>;
    minScore?: number;
  } = {}
): PromptObject[] {
  const { maxPrompts = 3, weights, minScore = 0 } = options;
  
  // Merge custom weights with defaults
  const scoringWeights = {
    ...DEFAULT_SCORING_WEIGHTS,
    ...weights,
  };
  
  // Filter → Score → Rank
  const eligible = applyHardFilters(prompts, context);
  const ranked = rankPrompts(eligible, context, scoringWeights);
  
  // Apply minimum score threshold and limit
  return ranked
    .filter(r => r.score >= minScore)
    .slice(0, maxPrompts)
    .map(r => r.prompt);
}
