// src/explore/utils/scorePrompt.ts
// Prompt scoring algorithm for contextual suggestions
// Sprint: prompt-unification-v1

import type { Prompt, PromptStage } from '@core/schema/prompt';

/**
 * Exploration context for prompt scoring
 */
export interface ExplorationContext {
  /** Current lifecycle stage */
  stage: PromptStage;
  /** Active lens ID */
  lensId: string;
  /** Current entropy level (0-1) */
  entropy: number;
  /** Active topic IDs */
  activeTopics: string[];
  /** Active moment triggers */
  activeMoments: string[];
  /** Number of interactions in session */
  interactions: number;
  /** Previously shown prompt IDs */
  shownPromptIds?: string[];
  /** Previously acknowledged reveal IDs */
  acknowledgedReveals?: string[];
}

/**
 * Score a prompt based on exploration context
 *
 * Higher scores indicate better fit for the current context.
 * Returns 0 if the prompt should be filtered out.
 *
 * Scoring factors:
 * - Stage match: +20 for matching stage
 * - Lens match: +30 for explicit lens targeting
 * - Lens affinity: +0-25 based on weight
 * - Topic affinity: +0-15 per matching topic
 * - Moment triggers: +40 for matching moment
 * - Entropy window: filter if outside range
 * - Interaction requirements: filter if not met
 * - Cooldown: filter if recently shown
 * - Max shows: filter if exceeded
 */
export function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  const p = prompt.payload;
  let score = p.baseWeight ?? 50;

  // ==========================================================================
  // Stage filtering
  // ==========================================================================

  // Positive match for target stages
  if (p.targeting.stages?.includes(context.stage)) {
    score += 20;
  }

  // Exclude if in excluded stages
  if (p.targeting.excludeStages?.includes(context.stage)) {
    return 0;
  }

  // ==========================================================================
  // Entropy window filtering
  // ==========================================================================

  if (p.targeting.entropyWindow) {
    const { min = 0, max = 1 } = p.targeting.entropyWindow;
    if (context.entropy < min || context.entropy > max) {
      return 0;
    }
  }

  // ==========================================================================
  // Lens targeting
  // ==========================================================================

  // Explicit lens targeting
  if (p.targeting.lensIds?.includes(context.lensId)) {
    score += 30;
  }

  // Exclude from specific lenses
  if (p.targeting.excludeLenses?.includes(context.lensId)) {
    return 0;
  }

  // Lens affinity (weighted preference)
  const lensAffinity = p.lensAffinities.find((a) => a.lensId === context.lensId);
  if (lensAffinity) {
    score += lensAffinity.weight * 25;
  }

  // ==========================================================================
  // Topic affinity
  // ==========================================================================

  context.activeTopics.forEach((topic) => {
    const affinity = p.topicAffinities.find((a) => a.topicId === topic);
    if (affinity) {
      score += affinity.weight * 15;
    }
  });

  // Topic cluster matching
  if (p.targeting.topicClusters?.some((c) => context.activeTopics.includes(c))) {
    score += 15;
  }

  // ==========================================================================
  // Moment triggers
  // ==========================================================================

  if (p.targeting.momentTriggers?.some((m) => context.activeMoments.includes(m))) {
    score += 40;
  }

  // Require moment - filter if no matching moment active
  if (p.targeting.requireMoment && !context.activeMoments.length) {
    return 0;
  }

  // ==========================================================================
  // Interaction requirements
  // ==========================================================================

  if (p.targeting.minInteractions !== undefined) {
    if (context.interactions < p.targeting.minInteractions) {
      return 0;
    }
  }

  // ==========================================================================
  // Sequence ordering (afterPromptIds)
  // ==========================================================================

  if (p.targeting.afterPromptIds?.length) {
    const hasSeenAll = p.targeting.afterPromptIds.every(
      (id) => context.shownPromptIds?.includes(id)
    );
    if (!hasSeenAll) {
      return 0;
    }
  }

  // ==========================================================================
  // Cooldown and max shows
  // ==========================================================================

  // Cooldown check
  if (p.cooldownMs && p.stats.lastSurfaced) {
    const elapsed = Date.now() - new Date(p.stats.lastSurfaced).getTime();
    if (elapsed < p.cooldownMs) {
      return 0;
    }
  }

  // Max shows check
  if (p.maxShows !== undefined && p.stats.impressions >= p.maxShows) {
    return 0;
  }

  return score;
}

/**
 * Get top N prompts for a context, sorted by score
 */
export function getTopPrompts(
  prompts: Prompt[],
  context: ExplorationContext,
  limit: number = 6
): Prompt[] {
  return prompts
    .filter((p) => p.meta.status === 'active')
    .map((p) => ({ prompt: p, score: scorePrompt(p, context) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ prompt }) => prompt);
}

export default scorePrompt;
