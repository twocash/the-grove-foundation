// src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts
// Stage-depth mapping and lens targeting inference
// Sprint: prompt-refinement-v1
//
// Core principle: Prompts aren't assigned to ONE lens—they're explorable
// across MANY lenses at different depths. The stage determines response
// characteristics.

import type { PromptStage } from '@core/schema/prompt';
import type { VocabularyLevel, NarrativeStyle, ArcEmphasis } from '@core/schema/narrative';

// ============================================================================
// Types
// ============================================================================

export interface StageCharacteristics {
  vocabularyLevel: VocabularyLevel;
  narrativeStyle: NarrativeStyle;
  responseLength: 'short' | 'medium' | 'long' | 'comprehensive';
  arcEmphasis: ArcEmphasis;
}

export interface LensAffinitySuggestion {
  lensId: string;
  weight: number;
  reasoning: string;
  stagesAvailable: PromptStage[];
}

export interface TargetingSuggestion {
  suggestedStages: PromptStage[];
  lensAffinities: LensAffinitySuggestion[];
  reasoning: string;
}

// ============================================================================
// Stage → Response Characteristics
// ============================================================================

/**
 * Maps each stage to its response characteristics
 * This determines how the LLM should respond at each exploration depth
 */
export const STAGE_DEPTH_MAP: Record<PromptStage, StageCharacteristics> = {
  genesis: {
    vocabularyLevel: 'accessible',
    narrativeStyle: 'stakes-heavy',
    responseLength: 'short',
    arcEmphasis: { hook: 4, stakes: 3, mechanics: 1, evidence: 1, resolution: 2 },
  },
  exploration: {
    vocabularyLevel: 'technical',
    narrativeStyle: 'mechanics-deep',
    responseLength: 'medium',
    arcEmphasis: { hook: 2, stakes: 2, mechanics: 4, evidence: 2, resolution: 1 },
  },
  synthesis: {
    vocabularyLevel: 'academic',
    narrativeStyle: 'evidence-first',
    responseLength: 'long',
    arcEmphasis: { hook: 1, stakes: 2, mechanics: 3, evidence: 4, resolution: 2 },
  },
  advocacy: {
    vocabularyLevel: 'executive',
    narrativeStyle: 'resolution-oriented',
    responseLength: 'comprehensive',
    arcEmphasis: { hook: 2, stakes: 3, mechanics: 2, evidence: 2, resolution: 4 },
  },
};

// ============================================================================
// Lens-Stage Compatibility
// ============================================================================

/**
 * Not all lenses support all stages.
 * A "general" lens may only work at Genesis, while "academic" can go deep.
 */
export const LENS_STAGE_COMPATIBILITY: Record<string, PromptStage[]> = {
  // General audience
  'general': ['genesis'],
  'concerned-citizen': ['genesis', 'exploration'],

  // Professional
  'executive': ['genesis', 'exploration', 'advocacy'],
  'technical': ['genesis', 'exploration', 'synthesis'],
  'engineer': ['genesis', 'exploration', 'synthesis'],

  // Academic/Research
  'academic': ['genesis', 'exploration', 'synthesis', 'advocacy'],
  'researcher': ['genesis', 'exploration', 'synthesis', 'advocacy'],

  // Specialized
  'geopolitical': ['genesis', 'exploration', 'synthesis'],
  'big-ai-exec': ['genesis', 'exploration', 'advocacy'],
  'family-office': ['genesis', 'exploration', 'advocacy'],

  // Default fallback
  'default': ['genesis'],
};

/**
 * Get available stages for a specific lens
 */
export function getAvailableStagesForLens(lensId: string): PromptStage[] {
  return LENS_STAGE_COMPATIBILITY[lensId] || LENS_STAGE_COMPATIBILITY['default'];
}

/**
 * Check if a stage is available for a lens
 */
export function isStageAvailableForLens(lensId: string, stage: PromptStage): boolean {
  const available = getAvailableStagesForLens(lensId);
  return available.includes(stage);
}

/**
 * Get all lenses that support a specific stage
 */
export function getLensesForStage(stage: PromptStage): string[] {
  return Object.entries(LENS_STAGE_COMPATIBILITY)
    .filter(([_, stages]) => stages.includes(stage))
    .map(([lensId]) => lensId);
}

// ============================================================================
// Salience-Based Inference
// ============================================================================

/**
 * Infer targeting suggestions based on prompt's salience dimensions
 */
export function inferTargetingFromSalience(
  salienceDimensions: string[],
  interestingBecause?: string
): TargetingSuggestion {
  const suggestions: LensAffinitySuggestion[] = [];
  const stageScores: Record<PromptStage, number> = {
    genesis: 1, // Base score - all prompts can be explored at genesis
    exploration: 0,
    synthesis: 0,
    advocacy: 0,
  };

  // Technical salience → Technical/Academic lenses
  if (salienceDimensions.includes('technical')) {
    suggestions.push({
      lensId: 'technical',
      weight: 0.8,
      reasoning: 'Concept has technical implementation details',
      stagesAvailable: ['genesis', 'exploration', 'synthesis'],
    });
    suggestions.push({
      lensId: 'academic',
      weight: 0.9,
      reasoning: 'Technical depth supports academic exploration',
      stagesAvailable: ['genesis', 'exploration', 'synthesis', 'advocacy'],
    });
    stageScores.exploration += 2;
    stageScores.synthesis += 2;
  }

  // Economic salience → Executive/Family Office lenses
  if (salienceDimensions.includes('economic')) {
    suggestions.push({
      lensId: 'executive',
      weight: 0.7,
      reasoning: 'Economic implications relevant to decision-makers',
      stagesAvailable: ['genesis', 'exploration', 'advocacy'],
    });
    suggestions.push({
      lensId: 'family-office',
      weight: 0.6,
      reasoning: 'Investment and economic perspective',
      stagesAvailable: ['genesis', 'exploration', 'advocacy'],
    });
    stageScores.exploration += 1;
    stageScores.advocacy += 2;
  }

  // Philosophical salience → Academic/Concerned Citizen
  if (salienceDimensions.includes('philosophical')) {
    suggestions.push({
      lensId: 'academic',
      weight: 0.85,
      reasoning: 'Philosophical depth suits academic exploration',
      stagesAvailable: ['genesis', 'exploration', 'synthesis', 'advocacy'],
    });
    suggestions.push({
      lensId: 'concerned-citizen',
      weight: 0.7,
      reasoning: 'Societal implications resonate with engaged citizens',
      stagesAvailable: ['genesis', 'exploration'],
    });
    stageScores.synthesis += 2;
  }

  // Practical salience → General/Executive
  if (salienceDimensions.includes('practical')) {
    suggestions.push({
      lensId: 'general',
      weight: 0.9,
      reasoning: 'Practical applications accessible to general audience',
      stagesAvailable: ['genesis'],
    });
    stageScores.genesis += 1;
  }

  // Analyze interestingBecause for additional signals
  if (interestingBecause) {
    const lower = interestingBecause.toLowerCase();

    if (lower.includes('implementation') || lower.includes('how to')) {
      stageScores.exploration += 1;
    }
    if (lower.includes('research') || lower.includes('study')) {
      stageScores.synthesis += 1;
    }
    if (lower.includes('decision') || lower.includes('strategy')) {
      stageScores.advocacy += 1;
    }
  }

  // Determine suggested stages based on scores
  const suggestedStages: PromptStage[] = ['genesis']; // Always include genesis

  if (stageScores.exploration >= 2) {
    suggestedStages.push('exploration');
  }
  if (stageScores.synthesis >= 2) {
    suggestedStages.push('synthesis');
  }
  if (stageScores.advocacy >= 2) {
    suggestedStages.push('advocacy');
  }

  // Dedupe and sort suggestions by weight
  const uniqueSuggestions = suggestions.reduce((acc, curr) => {
    const existing = acc.find(s => s.lensId === curr.lensId);
    if (existing) {
      if (curr.weight > existing.weight) {
        Object.assign(existing, curr);
      }
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as LensAffinitySuggestion[]);

  uniqueSuggestions.sort((a, b) => b.weight - a.weight);

  // Build reasoning summary
  const dimensionText = salienceDimensions.length > 0
    ? `Based on ${salienceDimensions.join(', ')} dimensions`
    : 'Based on general content analysis';

  const stageText = suggestedStages.length > 1
    ? `suitable for ${suggestedStages.join(' → ')} progression`
    : 'best suited for genesis-level exploration';

  return {
    suggestedStages,
    lensAffinities: uniqueSuggestions.slice(0, 5), // Top 5 suggestions
    reasoning: `${dimensionText}, this prompt is ${stageText}.`,
  };
}

// ============================================================================
// Stage Characteristics Helpers
// ============================================================================

/**
 * Get characteristics for a specific stage
 */
export function getStageCharacteristics(stage: PromptStage): StageCharacteristics {
  return STAGE_DEPTH_MAP[stage];
}

/**
 * Get a human-readable description of a stage
 */
export function getStageDescription(stage: PromptStage): string {
  switch (stage) {
    case 'genesis':
      return 'Initial exploration - accessible, stakes-focused, short responses';
    case 'exploration':
      return 'Deep dive - technical, mechanics-focused, medium responses';
    case 'synthesis':
      return 'Integration - academic, evidence-focused, comprehensive responses';
    case 'advocacy':
      return 'Action-oriented - executive, resolution-focused, strategic responses';
  }
}

/**
 * Get stage progression path
 * Returns the recommended order of stages for a full exploration
 */
export function getStageProgressionPath(): PromptStage[] {
  return ['genesis', 'exploration', 'synthesis', 'advocacy'];
}

/**
 * Get the next stage in the progression
 */
export function getNextStage(currentStage: PromptStage): PromptStage | null {
  const path = getStageProgressionPath();
  const currentIndex = path.indexOf(currentStage);
  return currentIndex >= 0 && currentIndex < path.length - 1
    ? path[currentIndex + 1]
    : null;
}
