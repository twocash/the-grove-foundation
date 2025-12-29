// src/core/engagement/moment-evaluator.ts
// Moment Trigger Evaluation
// Sprint: engagement-orchestrator-v1

import type {
  Moment,
  MomentTrigger,
  MomentSurface,
  NumericRange,
  TriggerStage
} from '@core/schema/moment';

// =============================================================================
// Engagement Context for Moment Evaluation
// =============================================================================

/**
 * Context used to evaluate moment triggers
 * This is a snapshot of current engagement state
 */
export interface MomentEvaluationContext {
  stage: TriggerStage;
  exchangeCount: number;
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  entropy: number;
  minutesActive: number;
  sessionCount: number;

  // Current selections
  activeLens: string | null;
  activeJourney: string | null;
  hasCustomLens: boolean;

  // Flags for moment triggers
  flags: Record<string, boolean>;

  // Cooldown tracking
  momentCooldowns: Record<string, number>;  // momentId -> lastShownTimestamp
}

// =============================================================================
// Evaluation Result
// =============================================================================

export interface EvaluationResult {
  eligible: boolean;
  reason?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a value is within a numeric range
 */
function inRange(value: number, range: NumericRange): boolean {
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

/**
 * Check if actual value matches expected context value
 * null means "no selection", arrays use OR logic
 */
function matchesContextValue(
  actual: string | null,
  expected: string | string[] | null
): boolean {
  if (expected === null) return actual === null;
  if (Array.isArray(expected)) return actual !== null && expected.includes(actual);
  return actual === expected;
}

// =============================================================================
// Trigger Evaluation
// =============================================================================

/**
 * Evaluate if a moment's trigger conditions are met
 *
 * Logic:
 * - Stage: OR (any matching stage)
 * - All other conditions: AND (all must be true)
 * - Flags: AND (all specified flags must match)
 */
export function evaluateTrigger(
  trigger: MomentTrigger,
  context: MomentEvaluationContext
): EvaluationResult {

  // Stage check (OR logic - any stage matches)
  if (trigger.stage && trigger.stage.length > 0) {
    if (!trigger.stage.includes(context.stage)) {
      return { eligible: false, reason: `Stage ${context.stage} not in [${trigger.stage.join(', ')}]` };
    }
  }

  // Numeric range checks
  if (trigger.exchangeCount && !inRange(context.exchangeCount, trigger.exchangeCount)) {
    return { eligible: false, reason: 'exchangeCount out of range' };
  }
  if (trigger.journeysCompleted && !inRange(context.journeysCompleted, trigger.journeysCompleted)) {
    return { eligible: false, reason: 'journeysCompleted out of range' };
  }
  if (trigger.sproutsCaptured && !inRange(context.sproutsCaptured, trigger.sproutsCaptured)) {
    return { eligible: false, reason: 'sproutsCaptured out of range' };
  }
  if (trigger.entropy && !inRange(context.entropy, trigger.entropy)) {
    return { eligible: false, reason: 'entropy out of range' };
  }
  if (trigger.minutesActive && !inRange(context.minutesActive, trigger.minutesActive)) {
    return { eligible: false, reason: 'minutesActive out of range' };
  }
  if (trigger.sessionCount && !inRange(context.sessionCount, trigger.sessionCount)) {
    return { eligible: false, reason: 'sessionCount out of range' };
  }

  // Flag checks (AND logic - all must match)
  if (trigger.flags) {
    for (const [flag, expected] of Object.entries(trigger.flags)) {
      const actual = context.flags[flag] ?? false;
      if (actual !== expected) {
        return { eligible: false, reason: `Flag ${flag} is ${actual}, expected ${expected}` };
      }
    }
  }

  // Context checks
  if (trigger.lens !== undefined) {
    const matches = matchesContextValue(context.activeLens, trigger.lens);
    if (!matches) {
      return { eligible: false, reason: 'Lens mismatch' };
    }
  }
  if (trigger.journey !== undefined) {
    const matches = matchesContextValue(context.activeJourney, trigger.journey);
    if (!matches) {
      return { eligible: false, reason: 'Journey mismatch' };
    }
  }
  if (trigger.hasCustomLens !== undefined && context.hasCustomLens !== trigger.hasCustomLens) {
    return { eligible: false, reason: 'hasCustomLens mismatch' };
  }

  // Probability check (A/B testing)
  if (trigger.probability !== undefined && trigger.probability < 1) {
    if (Math.random() > trigger.probability) {
      return { eligible: false, reason: 'Probability check failed' };
    }
  }

  // Schedule check
  if (trigger.schedule) {
    const now = new Date();

    if (trigger.schedule.daysOfWeek && trigger.schedule.daysOfWeek.length > 0) {
      if (!trigger.schedule.daysOfWeek.includes(now.getUTCDay())) {
        return { eligible: false, reason: 'Not scheduled for today' };
      }
    }

    if (trigger.schedule.hoursUTC) {
      const hour = now.getUTCHours();
      if (hour < trigger.schedule.hoursUTC.start || hour >= trigger.schedule.hoursUTC.end) {
        return { eligible: false, reason: 'Outside scheduled hours' };
      }
    }
  }

  return { eligible: true };
}

// =============================================================================
// Moment Selection
// =============================================================================

/**
 * Get all eligible moments for a surface, sorted by priority (highest first)
 */
export function getEligibleMoments(
  moments: Moment[],
  context: MomentEvaluationContext,
  surface: MomentSurface,
  now: number = Date.now()
): Moment[] {
  return moments
    // Only enabled moments
    .filter(m => m.payload.enabled !== false)
    // Only active status
    .filter(m => m.meta.status === 'active')
    // Match surface
    .filter(m => m.payload.surface === surface)
    // Check cooldown
    .filter(m => {
      if (m.payload.cooldown) {
        const lastShown = context.momentCooldowns[m.meta.id];
        if (lastShown && (now - lastShown) < m.payload.cooldown) {
          return false;
        }
      }
      return true;
    })
    // Check once flag
    .filter(m => {
      if (m.payload.once) {
        const flagKey = `moment_${m.meta.id}_shown`;
        if (context.flags[flagKey]) {
          return false;
        }
      }
      return true;
    })
    // Evaluate trigger conditions
    .filter(m => evaluateTrigger(m.payload.trigger, context).eligible)
    // Sort by priority (highest first)
    .sort((a, b) => (b.payload.priority ?? 50) - (a.payload.priority ?? 50));
}

/**
 * Get the highest priority eligible moment for a surface
 */
export function getTopMoment(
  moments: Moment[],
  context: MomentEvaluationContext,
  surface: MomentSurface,
  now: number = Date.now()
): Moment | null {
  const eligible = getEligibleMoments(moments, context, surface, now);
  return eligible[0] ?? null;
}

// =============================================================================
// Default Context Factory
// =============================================================================

/**
 * Create a default evaluation context with sensible defaults
 */
export function createDefaultEvaluationContext(): MomentEvaluationContext {
  return {
    stage: 'ARRIVAL',
    exchangeCount: 0,
    journeysCompleted: 0,
    sproutsCaptured: 0,
    topicsExplored: [],
    entropy: 0,
    minutesActive: 0,
    sessionCount: 1,
    activeLens: null,
    activeJourney: null,
    hasCustomLens: false,
    flags: {},
    momentCooldowns: {},
  };
}
