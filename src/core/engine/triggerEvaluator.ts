// src/core/engine/triggerEvaluator.ts
// Pure trigger evaluation logic - no React dependencies

import {
  TriggerConfig,
  TriggerCondition,
  SimpleCondition,
  CompoundCondition,
  EngagementState,
  RevealQueueItem,
  RevealType
} from '../schema';

// ============================================================================
// TRIGGER EVALUATION ENGINE
// ============================================================================

/**
 * Check if a simple condition is met
 */
function evaluateSimpleCondition(condition: SimpleCondition, state: EngagementState): boolean {
  const fieldValue = state[condition.field];
  const { value } = condition;

  // Handle each comparison operator
  if (value.eq !== undefined) {
    return fieldValue === value.eq;
  }
  if (value.neq !== undefined) {
    return fieldValue !== value.neq;
  }
  if (value.gt !== undefined && typeof fieldValue === 'number') {
    return fieldValue > value.gt;
  }
  if (value.gte !== undefined && typeof fieldValue === 'number') {
    return fieldValue >= value.gte;
  }
  if (value.lt !== undefined && typeof fieldValue === 'number') {
    return fieldValue < value.lt;
  }
  if (value.lte !== undefined && typeof fieldValue === 'number') {
    return fieldValue <= value.lte;
  }
  if (value.includes !== undefined && Array.isArray(fieldValue)) {
    return fieldValue.includes(value.includes);
  }
  if (value.notIncludes !== undefined && Array.isArray(fieldValue)) {
    return !fieldValue.includes(value.notIncludes);
  }

  return false;
}

/**
 * Check if a condition (simple or compound) is met
 */
function evaluateCondition(condition: TriggerCondition, state: EngagementState): boolean {
  // Check if it's a compound condition
  const compound = condition as CompoundCondition;

  if (compound.AND) {
    return compound.AND.every(c => evaluateCondition(c, state));
  }
  if (compound.OR) {
    return compound.OR.some(c => evaluateCondition(c, state));
  }
  if (compound.NOT) {
    return !evaluateCondition(compound.NOT, state);
  }

  // It's a simple condition
  return evaluateSimpleCondition(condition as SimpleCondition, state);
}

/**
 * Check if a trigger's blocking/requirement conditions are satisfied
 */
function checkTriggerPrerequisites(trigger: TriggerConfig, state: EngagementState): boolean {
  // Check if required acknowledgments are present
  if (trigger.requiresAcknowledgment?.length) {
    for (const required of trigger.requiresAcknowledgment) {
      if (!state.revealsAcknowledged.includes(required)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate all triggers and return the reveal queue
 */
export function evaluateTriggers(
  triggers: TriggerConfig[],
  state: EngagementState,
  options?: {
    onCrossSprintEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  }
): RevealQueueItem[] {
  const queue: RevealQueueItem[] = [];

  // Sort by priority (highest first)
  const sortedTriggers = [...triggers].sort((a, b) => b.priority - a.priority);

  for (const trigger of sortedTriggers) {
    // Skip disabled triggers
    if (!trigger.enabled) continue;

    // Skip if already shown
    if (state.revealsShown.includes(trigger.reveal)) continue;

    // Check prerequisites (acknowledgments, blockers)
    if (!checkTriggerPrerequisites(trigger, state)) continue;

    // Evaluate the condition
    if (evaluateCondition(trigger.conditions, state)) {
      queue.push({
        type: trigger.reveal,
        priority: trigger.priority,
        queuedAt: new Date().toISOString(),
        metadata: trigger.metadata
      });

      // Emit federation event for cross-sprint triggers (EPIC5-SL-Federation v1)
      if (options?.onCrossSprintEvent && trigger.metadata?.crossSprint) {
        options.onCrossSprintEvent({
          type: 'trigger.cross-sprint',
          data: {
            triggerId: trigger.id,
            reveal: trigger.reveal,
            state: {
              sessionId: state.sessionId,
              stage: state.stage,
            },
          },
        });
      }
    }
  }

  // Return sorted by priority (only show one at a time in most UIs)
  return queue.sort((a, b) => b.priority - a.priority);
}

/**
 * Get the next reveal to show (highest priority)
 */
export function getNextReveal(
  triggers: TriggerConfig[],
  state: EngagementState,
  options?: {
    onCrossSprintEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  }
): RevealQueueItem | null {
  const queue = evaluateTriggers(triggers, state, options);
  return queue[0] || null;
}

/**
 * Check if a specific reveal should be shown
 */
export function shouldShowReveal(
  revealType: RevealType,
  triggers: TriggerConfig[],
  state: EngagementState
): boolean {
  const trigger = triggers.find(t => t.reveal === revealType);
  if (!trigger || !trigger.enabled) return false;
  if (state.revealsShown.includes(revealType)) return false;
  if (!checkTriggerPrerequisites(trigger, state)) return false;
  return evaluateCondition(trigger.conditions, state);
}

// ============================================================================
// TRIGGER CONFIGURATION UTILITIES
// ============================================================================

/**
 * Merge custom triggers with defaults (custom overrides by ID)
 */
export function mergeTriggers(
  defaults: TriggerConfig[],
  custom: Partial<TriggerConfig>[]
): TriggerConfig[] {
  const merged = [...defaults];

  for (const customTrigger of custom) {
    if (!customTrigger.id) continue;

    const existingIndex = merged.findIndex(t => t.id === customTrigger.id);
    if (existingIndex >= 0) {
      // Merge with existing
      merged[existingIndex] = { ...merged[existingIndex], ...customTrigger };
    } else if (customTrigger.reveal && customTrigger.conditions) {
      // Add as new trigger
      merged.push(customTrigger as TriggerConfig);
    }
  }

  return merged;
}

/**
 * Validate a trigger configuration
 */
export function validateTrigger(trigger: Partial<TriggerConfig>): string[] {
  const errors: string[] = [];

  if (!trigger.id) errors.push('Trigger must have an ID');
  if (!trigger.reveal) errors.push('Trigger must specify a reveal type');
  if (!trigger.conditions) errors.push('Trigger must have conditions');
  if (typeof trigger.priority !== 'number') errors.push('Trigger must have a numeric priority');

  return errors;
}
