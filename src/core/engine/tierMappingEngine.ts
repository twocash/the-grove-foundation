// src/core/engine/tierMappingEngine.ts
// Tier Mapping Engine - S9-SL-Federation-v1
// Handles semantic tier equivalence between groves

import type {
  TierSystemDefinition,
  TierDefinition,
  TierEquivalence,
  TierMappingPayload,
  EquivalenceType
} from '../schema/federation';

/**
 * Validation result for tier mapping.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  coverage: {
    source: number;  // Percentage of source tiers mapped
    target: number;  // Percentage of target tiers mapped
  };
}

/**
 * Suggestion for tier mapping with confidence score.
 */
export interface MappingSuggestion extends TierEquivalence {
  confidence: number;  // 0-1
  reasoning: string;
}

/**
 * Levenshtein distance for string similarity.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  for (let i = 0; i <= aLower.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bLower.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[aLower.length][bLower.length];
}

/**
 * Calculate string similarity (0-1, 1 = identical).
 */
function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Common botanical/academic tier synonyms.
 */
const TIER_SYNONYMS: Record<string, string[]> = {
  // Botanical terms
  'seed': ['seedling', 'sprout', 'beginning', 'novice', 'tier-1', 'level-1', 'starter'],
  'sapling': ['young', 'growing', 'developing', 'tier-2', 'level-2', 'intermediate'],
  'tree': ['mature', 'established', 'competent', 'tier-3', 'level-3', 'advanced'],
  'forest': ['elder', 'master', 'expert', 'legendary', 'tier-4', 'tier-5', 'level-4', 'level-5'],

  // Academic terms
  'undergraduate': ['freshman', 'novice', 'beginner', 'entry', 'tier-1'],
  'graduate': ['master', 'developing', 'intermediate', 'tier-2'],
  'doctoral': ['phd', 'advanced', 'expert', 'tier-3'],
  'professor': ['faculty', 'senior', 'leader', 'tier-4'],
  'distinguished': ['emeritus', 'legendary', 'master', 'tier-5']
};

/**
 * Check if two tier names are synonymous.
 */
function areSynonyms(name1: string, name2: string): boolean {
  const lower1 = name1.toLowerCase();
  const lower2 = name2.toLowerCase();

  for (const [key, synonyms] of Object.entries(TIER_SYNONYMS)) {
    const allRelated = [key, ...synonyms];
    const match1 = allRelated.some(s => lower1.includes(s) || s.includes(lower1));
    const match2 = allRelated.some(s => lower2.includes(s) || s.includes(lower2));
    if (match1 && match2) return true;
  }

  return false;
}

/**
 * TierMappingEngine - Core engine for tier equivalence operations.
 */
export class TierMappingEngine {
  /**
   * Suggest tier mappings between two tier systems.
   * Uses multiple signals: level position, name similarity, synonyms.
   */
  suggestMappings(
    source: TierSystemDefinition,
    target: TierSystemDefinition
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];
    const sourceTiers = [...source.tiers].sort((a, b) => a.level - b.level);
    const targetTiers = [...target.tiers].sort((a, b) => a.level - b.level);

    for (const sourceTier of sourceTiers) {
      let bestMatch: { tier: TierDefinition; score: number; type: EquivalenceType; reasoning: string } | null = null;

      for (const targetTier of targetTiers) {
        let score = 0;
        let reasoning = '';
        let equivalenceType: EquivalenceType = 'approximate';

        // Factor 1: Level position similarity (normalized 0-1)
        const sourcePos = sourceTier.level / source.tiers.length;
        const targetPos = targetTier.level / target.tiers.length;
        const positionSimilarity = 1 - Math.abs(sourcePos - targetPos);
        score += positionSimilarity * 0.4;

        if (positionSimilarity > 0.9) {
          reasoning += 'Same relative position. ';
          equivalenceType = 'exact';
        } else if (positionSimilarity > 0.7) {
          reasoning += 'Similar position in hierarchy. ';
        }

        // Factor 2: Name similarity
        const nameSimilarity = stringSimilarity(sourceTier.name, targetTier.name);
        score += nameSimilarity * 0.3;

        if (nameSimilarity > 0.8) {
          reasoning += 'Very similar names. ';
          equivalenceType = 'exact';
        } else if (nameSimilarity > 0.5) {
          reasoning += 'Somewhat similar names. ';
        }

        // Factor 3: Synonym matching
        if (areSynonyms(sourceTier.name, targetTier.name)) {
          score += 0.3;
          reasoning += 'Recognized as synonymous terms. ';
          if (equivalenceType !== 'exact') {
            equivalenceType = 'approximate';
          }
        }

        // Factor 4: Level count difference (subset/superset detection)
        if (source.tiers.length !== target.tiers.length) {
          const ratio = source.tiers.length / target.tiers.length;
          if (ratio > 1.3) {
            // Source has more tiers - might be superset
            if (sourceTier.level > 1 && sourceTier.level < source.tiers.length) {
              equivalenceType = 'superset';
              reasoning += 'Source tier may cover narrower range. ';
            }
          } else if (ratio < 0.77) {
            // Target has more tiers - source might be subset
            if (targetTier.level > 1 && targetTier.level < target.tiers.length) {
              equivalenceType = 'subset';
              reasoning += 'Source tier may cover broader range. ';
            }
          }
        }

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            tier: targetTier,
            score,
            type: equivalenceType,
            reasoning: reasoning.trim() || 'Level-based mapping.'
          };
        }
      }

      if (bestMatch) {
        suggestions.push({
          sourceTierId: sourceTier.id,
          targetTierId: bestMatch.tier.id,
          equivalenceType: bestMatch.type,
          confidence: Math.min(1, bestMatch.score),
          reasoning: bestMatch.reasoning
        });
      }
    }

    return suggestions;
  }

  /**
   * Apply mapping to translate a tier reference.
   * Returns null if no mapping found.
   */
  mapTier(
    mapping: TierMappingPayload,
    tierId: string,
    direction: 'source-to-target' | 'target-to-source'
  ): string | null {
    for (const equiv of mapping.mappings) {
      if (direction === 'source-to-target' && equiv.sourceTierId === tierId) {
        return equiv.targetTierId;
      }
      if (direction === 'target-to-source' && equiv.targetTierId === tierId) {
        return equiv.sourceTierId;
      }
    }
    return null;
  }

  /**
   * Validate that a mapping is complete and consistent.
   */
  validateMapping(
    mapping: TierMappingPayload,
    sourceSystem: TierSystemDefinition,
    targetSystem: TierSystemDefinition
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sourceTierIds = new Set(sourceSystem.tiers.map(t => t.id));
    const targetTierIds = new Set(targetSystem.tiers.map(t => t.id));

    const mappedSourceTiers = new Set<string>();
    const mappedTargetTiers = new Set<string>();

    // Check each mapping
    for (const equiv of mapping.mappings) {
      // Validate source tier exists
      if (!sourceTierIds.has(equiv.sourceTierId)) {
        errors.push(`Source tier "${equiv.sourceTierId}" does not exist in source system`);
      } else {
        mappedSourceTiers.add(equiv.sourceTierId);
      }

      // Validate target tier exists
      if (!targetTierIds.has(equiv.targetTierId)) {
        errors.push(`Target tier "${equiv.targetTierId}" does not exist in target system`);
      } else {
        mappedTargetTiers.add(equiv.targetTierId);
      }
    }

    // Check for unmapped source tiers
    for (const tier of sourceSystem.tiers) {
      if (!mappedSourceTiers.has(tier.id)) {
        warnings.push(`Source tier "${tier.name}" (${tier.id}) is not mapped`);
      }
    }

    // Check for unmapped target tiers
    for (const tier of targetSystem.tiers) {
      if (!mappedTargetTiers.has(tier.id)) {
        warnings.push(`Target tier "${tier.name}" (${tier.id}) is not mapped`);
      }
    }

    // Check for duplicate mappings
    const seenMappings = new Set<string>();
    for (const equiv of mapping.mappings) {
      const key = `${equiv.sourceTierId}->${equiv.targetTierId}`;
      if (seenMappings.has(key)) {
        errors.push(`Duplicate mapping: ${key}`);
      }
      seenMappings.add(key);
    }

    // Check for one-to-many mappings (source tier mapped to multiple targets)
    const sourceToTargets = new Map<string, string[]>();
    for (const equiv of mapping.mappings) {
      const targets = sourceToTargets.get(equiv.sourceTierId) || [];
      targets.push(equiv.targetTierId);
      sourceToTargets.set(equiv.sourceTierId, targets);
    }
    for (const [sourceId, targets] of sourceToTargets) {
      if (targets.length > 1) {
        warnings.push(`Source tier "${sourceId}" maps to multiple targets: ${targets.join(', ')}`);
      }
    }

    // Calculate coverage
    const sourceCoverage = mappedSourceTiers.size / sourceTierIds.size;
    const targetCoverage = mappedTargetTiers.size / targetTierIds.size;

    if (sourceCoverage < 1) {
      warnings.push(`Only ${Math.round(sourceCoverage * 100)}% of source tiers are mapped`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      coverage: {
        source: sourceCoverage,
        target: targetCoverage
      }
    };
  }

  /**
   * Calculate confidence score for an entire mapping.
   * Based on coverage, equivalence types, and consistency.
   */
  calculateConfidence(
    mapping: TierMappingPayload,
    sourceSystem: TierSystemDefinition,
    targetSystem: TierSystemDefinition
  ): number {
    const validation = this.validateMapping(mapping, sourceSystem, targetSystem);

    if (!validation.isValid) {
      return 0; // Invalid mappings have 0 confidence
    }

    let score = 0;

    // Coverage contributes 40%
    const avgCoverage = (validation.coverage.source + validation.coverage.target) / 2;
    score += avgCoverage * 0.4;

    // Equivalence type quality contributes 40%
    if (mapping.mappings.length > 0) {
      const typeScores: Record<EquivalenceType, number> = {
        exact: 1.0,
        approximate: 0.75,
        subset: 0.5,
        superset: 0.5
      };
      const avgTypeScore = mapping.mappings.reduce(
        (sum, m) => sum + typeScores[m.equivalenceType],
        0
      ) / mapping.mappings.length;
      score += avgTypeScore * 0.4;
    }

    // Fewer warnings is better - contributes 20%
    const warningPenalty = Math.min(1, validation.warnings.length * 0.1);
    score += (1 - warningPenalty) * 0.2;

    return Math.round(score * 100) / 100;
  }

  /**
   * Get the tier definition by ID from a tier system.
   */
  getTierById(
    system: TierSystemDefinition,
    tierId: string
  ): TierDefinition | undefined {
    return system.tiers.find(t => t.id === tierId);
  }

  /**
   * Get tier display name with fallback.
   */
  getTierDisplayName(
    system: TierSystemDefinition,
    tierId: string
  ): string {
    const tier = this.getTierById(system, tierId);
    return tier?.name || tierId;
  }
}

// Singleton instance
let tierMappingEngineInstance: TierMappingEngine | null = null;

/**
 * Get singleton instance of TierMappingEngine.
 */
export function getTierMappingEngine(): TierMappingEngine {
  if (!tierMappingEngineInstance) {
    tierMappingEngineInstance = new TierMappingEngine();
  }
  return tierMappingEngineInstance;
}

// Export for testing
export { TierMappingEngine };
