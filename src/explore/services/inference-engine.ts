// src/explore/services/inference-engine.ts
// Inference rule engine for the Prompt Architect
// Sprint: sprout-research-v1, Phase 1c
//
// This engine processes user sparks against configured inference rules
// to auto-populate research manifest fields. It reduces interrogation
// by inferring context from grove configuration.

import type {
  InferenceRule,
  InferenceTrigger,
  InferenceResult,
  PromptArchitectConfigPayload,
} from '@core/schema/prompt-architect-config';
import type { BranchTemplate, ResearchStrategy } from '@core/schema/research-strategy';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of applying inference rules to a spark
 */
export interface InferenceOutput {
  /** Branches to auto-add to the manifest */
  branches: BranchTemplate[];

  /** Source preferences to apply */
  sourcePreferences: string[];

  /** Depth override (if any rule specified it) */
  depth?: ResearchStrategy['depth'];

  /** Whether to auto-link related sprouts */
  autoLinkRelated: boolean;

  /** IDs of rules that fired */
  appliedRuleIds: string[];

  /** Confidence score (0-1) based on match quality */
  confidence: number;
}

/**
 * Match result for a single rule
 */
interface RuleMatch {
  rule: InferenceRule;
  matchType: 'keyword' | 'pattern' | 'semantic';
  matchedTerms: string[];
  score: number; // 0-1
}

// =============================================================================
// Engine
// =============================================================================

/**
 * Apply inference rules to a spark
 *
 * @param spark - The user's research spark (raw input)
 * @param config - The grove's PromptArchitectConfig
 * @returns Inferred context for the research manifest
 */
export function applyInferenceRules(
  spark: string,
  config: PromptArchitectConfigPayload
): InferenceOutput {
  const sparkLower = spark.toLowerCase();
  const matches: RuleMatch[] = [];

  // Evaluate each enabled rule
  for (const rule of config.inferenceRules) {
    if (!rule.enabled) continue;

    const match = evaluateRule(sparkLower, rule);
    if (match) {
      matches.push(match);
    }
  }

  // No matches - return empty inference
  if (matches.length === 0) {
    return {
      branches: [],
      sourcePreferences: [],
      depth: undefined,
      autoLinkRelated: false,
      appliedRuleIds: [],
      confidence: 0,
    };
  }

  // Merge results from all matching rules
  return mergeInferences(matches, config);
}

/**
 * Evaluate a single rule against the spark
 */
function evaluateRule(sparkLower: string, rule: InferenceRule): RuleMatch | null {
  const trigger = rule.trigger;
  const matchedTerms: string[] = [];
  let matchType: RuleMatch['matchType'] = 'keyword';
  let score = 0;

  // Check keywords (OR logic - any match counts)
  if (trigger.keywords && trigger.keywords.length > 0) {
    for (const keyword of trigger.keywords) {
      if (sparkLower.includes(keyword.toLowerCase())) {
        matchedTerms.push(keyword);
        score += 0.3; // Each keyword adds to score
      }
    }
    if (matchedTerms.length > 0) {
      matchType = 'keyword';
    }
  }

  // Check regex patterns (OR logic)
  if (trigger.patterns && trigger.patterns.length > 0) {
    for (const pattern of trigger.patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        const match = sparkLower.match(regex);
        if (match) {
          matchedTerms.push(match[0]);
          score += 0.4; // Pattern match is higher value
          matchType = 'pattern';
        }
      } catch (e) {
        // Invalid regex - skip
        console.warn(`[InferenceEngine] Invalid regex pattern: ${pattern}`);
      }
    }
  }

  // Semantic matching (placeholder for future embedding-based matching)
  if (trigger.semantic) {
    // For now, do a simple keyword extraction from semantic description
    const semanticKeywords = extractSemanticKeywords(trigger.semantic);
    for (const keyword of semanticKeywords) {
      if (sparkLower.includes(keyword.toLowerCase())) {
        matchedTerms.push(`semantic:${keyword}`);
        score += 0.2;
        matchType = 'semantic';
      }
    }
  }

  // No match
  if (score === 0) {
    return null;
  }

  // Normalize score to 0-1
  const normalizedScore = Math.min(1, score);

  return {
    rule,
    matchType,
    matchedTerms,
    score: normalizedScore,
  };
}

/**
 * Extract keywords from a semantic description
 * Placeholder for future embedding-based approach
 */
function extractSemanticKeywords(semantic: string): string[] {
  // Simple word extraction - in production this would use embeddings
  return semantic
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
}

/**
 * Merge inference results from multiple matching rules
 */
function mergeInferences(
  matches: RuleMatch[],
  config: PromptArchitectConfigPayload
): InferenceOutput {
  const branches: BranchTemplate[] = [];
  const sourcePreferences: Set<string> = new Set();
  let depth: ResearchStrategy['depth'] | undefined;
  let autoLinkRelated = false;
  const appliedRuleIds: string[] = [];

  // Sort by score (highest first) for priority
  matches.sort((a, b) => b.score - a.score);

  // Merge results
  for (const match of matches) {
    const infer = match.rule.infer;
    appliedRuleIds.push(match.rule.id);

    // Add branches (avoiding duplicates by ID)
    if (infer.branches) {
      for (const branch of infer.branches) {
        if (!branches.some(b => b.id === branch.id)) {
          branches.push(branch);
        }
      }
    }

    // Add source preferences
    if (infer.sourcePreferences) {
      for (const pref of infer.sourcePreferences) {
        sourcePreferences.add(pref);
      }
    }

    // Take first depth override (highest priority rule wins)
    if (infer.depth && !depth) {
      depth = infer.depth;
    }

    // Auto-link if any rule requests it
    if (infer.relatedSprouts === 'auto-link') {
      autoLinkRelated = true;
    }
  }

  // Calculate overall confidence
  const avgScore = matches.reduce((sum, m) => sum + m.score, 0) / matches.length;
  const confidence = Math.min(1, avgScore * (1 + Math.log10(matches.length + 1)));

  return {
    branches,
    sourcePreferences: Array.from(sourcePreferences),
    depth,
    autoLinkRelated,
    appliedRuleIds,
    confidence,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a spark likely requires confirmation based on inference confidence
 *
 * @param inference - The inference output
 * @param config - The grove's config
 * @returns Whether to show confirmation dialog
 */
export function shouldShowConfirmation(
  inference: InferenceOutput,
  config: PromptArchitectConfigPayload
): boolean {
  switch (config.confirmationMode) {
    case 'always':
      return true;
    case 'never':
      return false;
    case 'ambiguous':
      // Show confirmation if confidence is below threshold
      return inference.confidence < 0.6;
    default:
      return true;
  }
}

/**
 * Get a human-readable summary of what was inferred
 */
export function summarizeInference(inference: InferenceOutput): string {
  const parts: string[] = [];

  if (inference.branches.length > 0) {
    parts.push(`${inference.branches.length} research ${inference.branches.length === 1 ? 'branch' : 'branches'}`);
  }

  if (inference.sourcePreferences.length > 0) {
    parts.push(`${inference.sourcePreferences.length} source ${inference.sourcePreferences.length === 1 ? 'preference' : 'preferences'}`);
  }

  if (inference.depth) {
    parts.push(`${inference.depth} depth`);
  }

  if (inference.autoLinkRelated) {
    parts.push('auto-link enabled');
  }

  if (parts.length === 0) {
    return 'No context inferred';
  }

  return `Inferred: ${parts.join(', ')} (${Math.round(inference.confidence * 100)}% confidence)`;
}
