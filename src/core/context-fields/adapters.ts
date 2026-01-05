// src/core/context-fields/adapters.ts
// Sprint: kinetic-suggested-prompts-v1
// Adapts PromptObject → JourneyFork for inline navigation

import type { PromptObject } from './types';
import type { JourneyFork, JourneyForkType } from '../schema/stream';

/**
 * Infer the appropriate fork type from a PromptObject.
 *
 * Rules:
 * - High entropy window or urgent variant → challenge
 * - Has topic affinities → pivot (connects to another topic)
 * - Has synthesis/action/reflection tags → apply
 * - Default → deep_dive (continue exploring current topic)
 */
export function inferForkType(prompt: PromptObject): JourneyForkType {
  const { targeting, topicAffinities, tags, variant } = prompt;

  // Challenge: High entropy or urgent
  if (targeting.entropyWindow?.min && targeting.entropyWindow.min > 0.6) {
    return 'challenge';
  }
  if (variant === 'urgent') {
    return 'challenge';
  }

  // Pivot: Has topic connections
  if (topicAffinities.length > 0) {
    return 'pivot';
  }

  // Apply: Action-oriented prompts
  const applyTags = ['synthesis', 'reflection', 'action', 'contribution', 'apply'];
  if (tags?.some(t => applyTags.includes(t))) {
    return 'apply';
  }

  // Default: Deep dive
  return 'deep_dive';
}

/**
 * Convert a PromptObject to a JourneyFork.
 */
export function promptToFork(prompt: PromptObject): JourneyFork {
  return {
    id: prompt.id,
    type: inferForkType(prompt),
    label: prompt.label,
    queryPayload: prompt.executionPrompt,
    context: prompt.systemContext
  };
}

/**
 * Convert an array of PromptObjects to JourneyForks.
 */
export function promptsToForks(prompts: PromptObject[]): JourneyFork[] {
  return prompts.map(promptToFork);
}

/**
 * Ensure diversity in fork types.
 * If all forks are the same type, try to rebalance.
 */
export function diversifyForks(forks: JourneyFork[]): JourneyFork[] {
  if (forks.length <= 1) return forks;

  const types = new Set(forks.map(f => f.type));
  if (types.size > 1) {
    // Already diverse
    return forks;
  }

  // All same type - return as-is (caller should provide diverse prompts)
  return forks;
}
