// utils/engagementTriggers.ts - Declarative reveal trigger configuration
// Sprint 7: Configurable engagement-based reveals

import {
  TriggerConfig,
  TriggerCondition,
  SimpleCondition,
  CompoundCondition,
  EngagementState,
  RevealQueueItem,
  RevealType
} from '../types/engagement';

// ============================================================================
// DEFAULT TRIGGER CONFIGURATION
// ============================================================================

export const DEFAULT_TRIGGERS: TriggerConfig[] = [
  // 1. Simulation Reveal - Gateway to the full experience
  {
    id: 'simulation-reveal',
    reveal: 'simulation',
    priority: 100,
    enabled: true,
    conditions: {
      OR: [
        { field: 'journeysCompleted', value: { gte: 1 } },
        { field: 'exchangeCount', value: { gte: 5 } },
        { field: 'minutesActive', value: { gte: 3 } }
      ]
    },
    blockedBy: [],  // First reveal, nothing blocks it
    requiresAcknowledgment: []
  },

  // 2. Custom Lens Offer - After simulation acknowledged
  {
    id: 'custom-lens-offer',
    reveal: 'customLensOffer',
    priority: 90,
    enabled: true,
    conditions: {
      AND: [
        { field: 'hasCustomLens', value: { eq: false } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 3. Terminator Mode Prompt - Deep engagement reward
  {
    id: 'terminator-prompt',
    reveal: 'terminatorPrompt',
    priority: 80,
    enabled: true,
    conditions: {
      OR: [
        { field: 'hasCustomLens', value: { eq: true } },
        { field: 'minutesActive', value: { gte: 10 } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 4. Founder Story - After deep engagement
  {
    id: 'founder-story',
    reveal: 'founderStory',
    priority: 70,
    enabled: true,
    conditions: {
      OR: [
        { field: 'terminatorModeActive', value: { eq: true } },
        { field: 'minutesActive', value: { gte: 15 } },
        { field: 'journeysCompleted', value: { gte: 2 } }
      ]
    },
    requiresAcknowledgment: ['simulation'],
    blockedBy: []
  },

  // 5. Journey Completion - After completing a thread
  {
    id: 'journey-completion',
    reveal: 'journeyCompletion',
    priority: 95,  // High priority - immediate feedback
    enabled: true,
    conditions: {
      // This is triggered directly, not by state conditions
      // We use a sentinel value that gets set momentarily
      AND: [
        { field: 'journeysCompleted', value: { gt: 0 } }
      ]
    },
    blockedBy: [],
    requiresAcknowledgment: [],
    metadata: { immediateOnEvent: 'JOURNEY_COMPLETED' }
  },

  // 6. Conversion CTA - Final conversion push
  {
    id: 'conversion-cta',
    reveal: 'conversionCTA',
    priority: 60,
    enabled: true,
    conditions: {
      AND: [
        { field: 'minutesActive', value: { gte: 20 } }
      ]
    },
    requiresAcknowledgment: ['simulation', 'founderStory'],
    blockedBy: []
  }
];

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

  // Check if any blocking reveals haven't been acknowledged
  // (This logic might need refinement based on your exact requirements)

  return true;
}

/**
 * Evaluate all triggers and return the reveal queue
 */
export function evaluateTriggers(
  triggers: TriggerConfig[],
  state: EngagementState
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
  state: EngagementState
): RevealQueueItem | null {
  const queue = evaluateTriggers(triggers, state);
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
