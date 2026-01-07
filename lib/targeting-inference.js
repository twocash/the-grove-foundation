// lib/targeting-inference.js
// Server-side targeting inference for extraction pipeline
// Sprint: prompt-wiring-v1
//
// Mirrors src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts
// for use in server.js (which requires JavaScript)

/**
 * Infer targeting suggestions based on prompt's salience dimensions
 * @param {string[]} salienceDimensions - Array of salience types (technical, economic, philosophical, practical)
 * @param {string} [interestingBecause] - Description of why the concept is interesting
 * @returns {{ suggestedStages: string[], lensAffinities: Array<{lensId: string, weight: number, reasoning: string}>, reasoning: string }}
 */
function inferTargetingFromSalience(salienceDimensions = [], interestingBecause = '') {
  const suggestions = [];
  const stageScores = {
    genesis: 1, // Base score - all prompts can be explored at genesis
    exploration: 0,
    synthesis: 0,
    advocacy: 0,
  };

  // Technical salience -> Technical/Academic lenses
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

  // Economic salience -> Executive/Family Office lenses
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

  // Philosophical salience -> Academic/Concerned Citizen
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

  // Practical salience -> General/Executive
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
  const suggestedStages = ['genesis']; // Always include genesis

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
  }, []);

  uniqueSuggestions.sort((a, b) => b.weight - a.weight);

  // Build reasoning summary
  const dimensionText = salienceDimensions.length > 0
    ? `Based on ${salienceDimensions.join(', ')} dimensions`
    : 'Based on general content analysis';

  const stageText = suggestedStages.length > 1
    ? `suitable for ${suggestedStages.join(' -> ')} progression`
    : 'best suited for genesis-level exploration';

  return {
    suggestedStages,
    lensAffinities: uniqueSuggestions.slice(0, 5), // Top 5 suggestions
    reasoning: `${dimensionText}, this prompt is ${stageText}.`,
  };
}

export { inferTargetingFromSalience };
