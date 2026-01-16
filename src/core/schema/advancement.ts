// src/core/schema/advancement.ts
// Sprint: S7-SL-AutoAdvancement v1
// Types for automatic tier advancement based on observable signals
//
// DEX Principle: Declarative Sovereignty
// Advancement rules are defined as JSON configuration, not hardcoded logic.
// DEX Principle: Capability Agnosticism
// Pure TypeScript evaluation engine with no model-specific code.
// DEX Principle: Provenance as Infrastructure
// Full audit trail with signal snapshots at evaluation time.

// =============================================================================
// Signal Types (mapped from S6-ObservableSignals)
// =============================================================================

/**
 * Observable signals available for advancement criteria.
 * These map to the signal_aggregations table from S6.
 */
export interface ObservableSignals {
  /** Total number of times the sprout was retrieved */
  retrievals: number;
  /** Number of times the sprout was cited/referenced */
  citations: number;
  /** Diversity score of queries (0-1) */
  queryDiversity: number;
  /** Utility score from user ratings (0-1) */
  utilityScore: number;
  /** Timestamp of last signal update */
  lastUpdated?: string;
}

/**
 * Available signal types for criteria configuration
 */
export type SignalType = keyof Omit<ObservableSignals, 'lastUpdated'>;

/**
 * Signal metadata for UI display
 */
export const SIGNAL_METADATA: Record<SignalType, { label: string; description: string; unit: string }> = {
  retrievals: {
    label: 'Retrievals',
    description: 'Total number of times the sprout was retrieved in search results',
    unit: 'count',
  },
  citations: {
    label: 'Citations',
    description: 'Number of times the sprout was cited or referenced by other content',
    unit: 'count',
  },
  queryDiversity: {
    label: 'Query Diversity',
    description: 'Diversity of search queries that retrieved this sprout (0-1 scale)',
    unit: 'score',
  },
  utilityScore: {
    label: 'Utility Score',
    description: 'Aggregate utility score from user ratings (0-1 scale)',
    unit: 'score',
  },
};

/**
 * Default signal values when no data available
 */
export const DEFAULT_SIGNALS: ObservableSignals = {
  retrievals: 0,
  citations: 0,
  queryDiversity: 0,
  utilityScore: 0,
};

// =============================================================================
// Criterion Types
// =============================================================================

/**
 * Comparison operators for criteria evaluation
 */
export type ComparisonOperator = '>=' | '>' | '==' | '<' | '<=';

/**
 * Single criterion for advancement evaluation
 */
export interface AdvancementCriterion {
  /** Signal to evaluate */
  signal: SignalType;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Threshold value */
  threshold: number;
}

/**
 * Logic operator for combining multiple criteria
 */
export type LogicOperator = 'AND' | 'OR';

// =============================================================================
// Advancement Rule Payload
// =============================================================================

/**
 * Payload for an advancement rule object.
 * Follows GroveObject<AdvancementRulePayload> pattern.
 *
 * @example
 * ```typescript
 * const seedToSproutRule: AdvancementRulePayload = {
 *   lifecycleModelId: 'botanical',
 *   fromTier: 'seed',
 *   toTier: 'sprout',
 *   criteria: [
 *     { signal: 'retrievals', operator: '>=', threshold: 10 },
 *     { signal: 'citations', operator: '>=', threshold: 3 },
 *   ],
 *   logicOperator: 'AND',
 *   isEnabled: true,
 * };
 * ```
 */
export interface AdvancementRulePayload {
  /** ID of the lifecycle model (e.g., 'botanical') */
  lifecycleModelId: string;
  /** Source tier for advancement */
  fromTier: string;
  /** Target tier for advancement */
  toTier: string;
  /** Criteria that must be met for advancement */
  criteria: AdvancementCriterion[];
  /** Logic operator for combining criteria */
  logicOperator: LogicOperator;
  /** Whether this rule is active for batch evaluation */
  isEnabled: boolean;
}

/**
 * Default payload for new advancement rules
 */
export const DEFAULT_ADVANCEMENT_RULE_PAYLOAD: AdvancementRulePayload = {
  lifecycleModelId: 'botanical',
  fromTier: 'seed',
  toTier: 'sprout',
  criteria: [],
  logicOperator: 'AND',
  isEnabled: false,
};

/**
 * Factory function to create a new advancement rule payload
 */
export function createAdvancementRulePayload(
  fromTier: string,
  toTier: string,
  options?: Partial<Omit<AdvancementRulePayload, 'fromTier' | 'toTier'>>
): AdvancementRulePayload {
  return {
    ...DEFAULT_ADVANCEMENT_RULE_PAYLOAD,
    fromTier,
    toTier,
    ...options,
  };
}

// =============================================================================
// Evaluation Result Types
// =============================================================================

/**
 * Result of a single criterion evaluation
 */
export interface CriterionResult {
  criterion: AdvancementCriterion;
  /** Actual signal value */
  actual: number;
  /** Whether criterion was met */
  met: boolean;
  /** Whether signal was missing (criterion skipped) */
  skipped?: boolean;
}

/**
 * Result of advancement evaluation for a sprout
 */
export interface AdvancementResult {
  /** Whether the sprout should advance */
  shouldAdvance: boolean;
  /** Target tier (if advancing) */
  toTier: string;
  /** Rule that triggered advancement */
  ruleId: string;
  /** Criteria evaluation results */
  criteriaResults: CriterionResult[];
  /** Full signal snapshot at evaluation time */
  signalValues: ObservableSignals;
}

// =============================================================================
// Advancement Event Types
// =============================================================================

/**
 * Types of advancement events
 */
export type AdvancementEventType = 'auto-advancement' | 'manual-override' | 'bulk-rollback';

/**
 * Advancement event record (for audit trail)
 */
export interface AdvancementEvent {
  id: string;
  sproutId: string;
  ruleId?: string;
  fromTier: string;
  toTier: string;
  criteriaMet: CriterionResult[];
  signalValues: ObservableSignals;
  timestamp: string;
  eventType: AdvancementEventType;
  operatorId?: string;
  reason?: string;
  rolledBack: boolean;
  rollbackEventId?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard for AdvancementRulePayload
 */
export function isAdvancementRulePayload(obj: unknown): obj is AdvancementRulePayload {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.lifecycleModelId === 'string' &&
    typeof o.fromTier === 'string' &&
    typeof o.toTier === 'string' &&
    Array.isArray(o.criteria) &&
    (o.logicOperator === 'AND' || o.logicOperator === 'OR') &&
    typeof o.isEnabled === 'boolean'
  );
}

/**
 * Type guard for AdvancementCriterion
 */
export function isAdvancementCriterion(obj: unknown): obj is AdvancementCriterion {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  const validOperators: ComparisonOperator[] = ['>=', '>', '==', '<', '<='];
  const validSignals: SignalType[] = ['retrievals', 'citations', 'queryDiversity', 'utilityScore'];
  return (
    validSignals.includes(o.signal as SignalType) &&
    validOperators.includes(o.operator as ComparisonOperator) &&
    typeof o.threshold === 'number'
  );
}
