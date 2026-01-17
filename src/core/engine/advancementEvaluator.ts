// src/core/engine/advancementEvaluator.ts
// Sprint: S7-SL-AutoAdvancement v1
// Pure TypeScript evaluation engine for advancement rules
//
// DEX: Capability Agnosticism - No model-specific code, pure evaluation logic
// DEX: Declarative Sovereignty - Rules are JSON config, evaluator is generic

import type {
  AdvancementRulePayload,
  AdvancementCriterion,
  ObservableSignals,
  CriterionResult,
  AdvancementResult,
  ComparisonOperator,
  SignalType,
} from '@core/schema/advancement';

// =============================================================================
// Criterion Evaluation
// =============================================================================

/**
 * Evaluate a single criterion against a signal value
 */
export function evaluateCriterion(
  criterion: AdvancementCriterion,
  signals: ObservableSignals
): CriterionResult {
  const signalValue = signals[criterion.signal as SignalType];

  // Handle missing signal
  if (signalValue === undefined || signalValue === null) {
    return {
      criterion,
      actual: 0,
      met: false,
      skipped: true,
    };
  }

  const met = compareValues(signalValue, criterion.operator, criterion.threshold);

  return {
    criterion,
    actual: signalValue,
    met,
  };
}

/**
 * Compare a value against a threshold using the specified operator
 */
export function compareValues(
  actual: number,
  operator: ComparisonOperator,
  threshold: number
): boolean {
  switch (operator) {
    case '>':
      return actual > threshold;
    case '>=':
      return actual >= threshold;
    case '==':
      return actual === threshold;
    case '<':
      return actual < threshold;
    case '<=':
      return actual <= threshold;
    default:
      // Type exhaustiveness check
      const _exhaustive: never = operator;
      console.warn(`Unknown operator: ${_exhaustive}`);
      return false;
  }
}

// =============================================================================
// Rule Evaluation
// =============================================================================

/**
 * Evaluate all criteria in a rule against signals
 * @returns Array of criterion results
 */
export function evaluateCriteria(
  criteria: AdvancementCriterion[],
  signals: ObservableSignals
): CriterionResult[] {
  return criteria.map((criterion) => evaluateCriterion(criterion, signals));
}

/**
 * Determine if overall criteria pass based on logic operator
 */
export function criteriaPass(
  results: CriterionResult[],
  logicOperator: 'AND' | 'OR'
): boolean {
  // Empty criteria = no advancement (safety)
  if (results.length === 0) {
    return false;
  }

  // Filter out skipped criteria for evaluation
  const evaluated = results.filter((r) => !r.skipped);

  // If all criteria were skipped, no advancement
  if (evaluated.length === 0) {
    return false;
  }

  if (logicOperator === 'AND') {
    return evaluated.every((r) => r.met);
  } else {
    return evaluated.some((r) => r.met);
  }
}

/**
 * Evaluate a single rule against signals
 * @returns Whether the rule criteria pass
 */
export function evaluateRule(
  rule: AdvancementRulePayload,
  signals: ObservableSignals
): { pass: boolean; results: CriterionResult[] } {
  const results = evaluateCriteria(rule.criteria, signals);
  const pass = criteriaPass(results, rule.logicOperator);
  return { pass, results };
}

// =============================================================================
// Advancement Evaluation (Main Export)
// =============================================================================

/**
 * Sprout context for advancement evaluation
 */
export interface SproutContext {
  id: string;
  currentTier: string;
  lifecycleModelId: string;
}

/**
 * Rule with ID for tracking
 */
export interface RuleWithId {
  id: string;
  payload: AdvancementRulePayload;
}

/**
 * Evaluate advancement for a single sprout against all applicable rules.
 *
 * Rules are evaluated in order. First matching rule wins.
 *
 * @param sprout - The sprout to evaluate
 * @param rules - All enabled advancement rules
 * @param signals - Observable signals for the sprout
 * @returns Advancement result (null if no advancement)
 */
export function evaluateAdvancement(
  sprout: SproutContext,
  rules: RuleWithId[],
  signals: ObservableSignals
): AdvancementResult | null {
  // Filter rules that apply to this sprout's current tier and lifecycle model
  const applicableRules = rules.filter((rule) => {
    const { payload } = rule;
    return (
      payload.isEnabled &&
      payload.fromTier === sprout.currentTier &&
      payload.lifecycleModelId === sprout.lifecycleModelId
    );
  });

  // No applicable rules
  if (applicableRules.length === 0) {
    return null;
  }

  // Evaluate each rule in order (first match wins)
  for (const rule of applicableRules) {
    const { pass, results } = evaluateRule(rule.payload, signals);

    if (pass) {
      return {
        shouldAdvance: true,
        toTier: rule.payload.toTier,
        ruleId: rule.id,
        criteriaResults: results,
        signalValues: { ...signals },
      };
    }
  }

  // No rules passed
  return null;
}

// =============================================================================
// Batch Evaluation
// =============================================================================

/**
 * Result of batch evaluation for a sprout
 */
export interface BatchEvaluationResult {
  sproutId: string;
  result: AdvancementResult | null;
}

/**
 * Evaluate advancement for multiple sprouts.
 * Used by the batch job for efficient processing.
 *
 * @param sprouts - Sprouts to evaluate
 * @param rules - All enabled advancement rules
 * @param getSignals - Function to retrieve signals for a sprout
 * @returns Array of evaluation results
 */
export async function evaluateAdvancementBatch(
  sprouts: SproutContext[],
  rules: RuleWithId[],
  getSignals: (sproutId: string) => Promise<ObservableSignals>
): Promise<BatchEvaluationResult[]> {
  const results: BatchEvaluationResult[] = [];

  for (const sprout of sprouts) {
    try {
      const signals = await getSignals(sprout.id);
      const result = evaluateAdvancement(sprout, rules, signals);
      results.push({ sproutId: sprout.id, result });
    } catch (error) {
      console.error(`Error evaluating sprout ${sprout.id}:`, error);
      results.push({ sproutId: sprout.id, result: null });
    }
  }

  return results;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format criterion for display
 */
export function formatCriterion(criterion: AdvancementCriterion): string {
  return `${criterion.signal} ${criterion.operator} ${criterion.threshold}`;
}

/**
 * Format evaluation result for logging
 */
export function formatEvaluationResult(result: AdvancementResult): string {
  const criteriaStr = result.criteriaResults
    .map((cr) => `${formatCriterion(cr.criterion)}: ${cr.met ? 'PASS' : 'FAIL'} (actual: ${cr.actual})`)
    .join(', ');
  return `Advance to ${result.toTier} via rule ${result.ruleId} [${criteriaStr}]`;
}
