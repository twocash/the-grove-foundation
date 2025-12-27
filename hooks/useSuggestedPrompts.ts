// hooks/useSuggestedPrompts.ts
// Computes stage-aware, lens-filtered prompts with weighted random selection
// Sprint: adaptive-engagement-v1
// Sprint: engagement-consolidation-v1 (uses EngagementBus stage directly)
//
// ⚠️ TECHNICAL DEBT (TD-003): Prompt filtering logic is imperative.
// Should be refactored to use declarative filter rules from schema.
// See: docs/sprints/ROADMAP.md → Technical Debt Register

import { useMemo, useCallback, useState, useRef } from 'react';
import { useEngagementState } from './useEngagementBus';
import { stagePromptsConfig } from '../src/data/prompts/stage-prompts';
import type { SuggestedPrompt } from '../src/core/schema/suggested-prompts';
import type { SessionStage } from '../src/core/schema/engagement';

interface UseSuggestedPromptsOptions {
  lensId?: string | null;
  lensName?: string;
  maxPrompts?: number;
}

interface UseSuggestedPromptsResult {
  prompts: SuggestedPrompt[];
  stage: SessionStage;
  refreshPrompts: () => void;
}

// Known topic areas for fallbacks
const TOPIC_AREAS = ['agents', 'economics', 'simulation', 'infrastructure', 'governance'];

/**
 * Weighted random selection without replacement
 * Selects n items from array, with probability proportional to weight
 */
function weightedRandomSelect<T extends { weight?: number }>(
  items: T[],
  count: number
): T[] {
  if (items.length <= count) return items;

  const selected: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate total weight of remaining items
    const totalWeight = remaining.reduce((sum, item) => sum + (item.weight ?? 1), 0);

    // Pick a random point in the weight range
    let random = Math.random() * totalWeight;

    // Find the item at that point
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight ?? 1;
      if (random <= 0) {
        selected.push(remaining[j]);
        remaining.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { lensId, lensName, maxPrompts = 3 } = options;
  const engagementState = useEngagementState();
  const [refreshKey, setRefreshKey] = useState(0);

  // Track last exchange count to auto-refresh when it changes
  const lastExchangeCount = useRef(engagementState.exchangeCount);
  if (engagementState.exchangeCount !== lastExchangeCount.current) {
    lastExchangeCount.current = engagementState.exchangeCount;
    // Force re-randomization on next render by incrementing key
    setRefreshKey(k => k + 1);
  }

  // Debug logging
  console.log('[useSuggestedPrompts] engagementState:', {
    stage: engagementState.stage,
    exchangeCount: engagementState.exchangeCount,
    topicsExplored: engagementState.topicsExplored,
    journeysCompleted: engagementState.journeysCompleted,
    refreshKey,
  });

  // Use stage directly from EngagementBus (computed in updateState)
  const stage = engagementState.stage;

  const prompts = useMemo(() => {
    console.log('[useSuggestedPrompts] Looking up stage config for:', stage);
    const stageConfig = stagePromptsConfig.stages[stage];
    console.log('[useSuggestedPrompts] stageConfig:', stageConfig ? `${stageConfig.prompts.length} prompts` : 'NOT FOUND');
    if (!stageConfig) return [];

    // Filter by lens
    let filtered = stageConfig.prompts.filter(prompt => {
      // Exclude if lens is in exclude list
      if (lensId && prompt.lensExclude?.includes(lensId)) return false;
      // If has affinity and lens selected, only show if lens matches
      if (prompt.lensAffinity && prompt.lensAffinity.length > 0) {
        if (!lensId) return false;
        return prompt.lensAffinity.includes(lensId);
      }
      return true;
    });

    // Weighted random selection (higher weight = more likely to be picked)
    const selected = weightedRandomSelect(filtered, maxPrompts);

    // Substitute dynamic variables in selected prompts
    const substituted = selected.map(prompt => {
      if (!prompt.dynamic) return prompt;

      let text = prompt.text;

      // Build variables from engagement state
      const lastTopic = engagementState.topicsExplored.slice(-1)[0] ?? 'distributed AI';
      const explored = new Set(engagementState.topicsExplored);
      const underexplored = TOPIC_AREAS.find(a => !explored.has(a)) ?? 'edge cases';

      const vars: Record<string, string> = {
        lastTopic,
        lensName: lensName ?? 'curious explorer',
        topicA: engagementState.topicsExplored[0] ?? 'agents',
        topicB: engagementState.topicsExplored[1] ?? 'economics',
        underexploredArea: underexplored,
      };

      for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, value);
      }

      return { ...prompt, text };
    });

    return substituted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, engagementState.topicsExplored, lensId, lensName, maxPrompts, refreshKey]);

  const refreshPrompts = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return {
    prompts,
    stage,
    refreshPrompts,
  };
}
