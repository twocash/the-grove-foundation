// hooks/useSuggestedPrompts.ts
// Computes stage-aware, lens-filtered prompts
// Sprint: adaptive-engagement-v1

import { useMemo, useCallback, useState } from 'react';
import { useEngagementState } from './useEngagementBus';
import { stagePromptsConfig } from '../src/data/prompts/stage-prompts';
import type { SuggestedPrompt } from '../src/core/schema/suggested-prompts';
import type { SessionStage } from '../src/core/schema/session-telemetry';

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

// Compute stage from engagement state
function computeStageFromEngagement(state: {
  exchangeCount: number;
  topicsExplored: string[];
  journeysCompleted: number;
}): SessionStage {
  // ENGAGED: Has completed journeys or significant engagement
  if (state.journeysCompleted >= 1 || state.exchangeCount >= 10) {
    return 'ENGAGED';
  }

  // EXPLORING: Multiple topics or deeper engagement
  if (state.topicsExplored.length >= 2 || state.exchangeCount >= 5) {
    return 'EXPLORING';
  }

  // ORIENTED: Some engagement
  if (state.exchangeCount >= 3) {
    return 'ORIENTED';
  }

  // ARRIVAL: New user
  return 'ARRIVAL';
}

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { lensId, lensName, maxPrompts = 3 } = options;
  const engagementState = useEngagementState();
  const [refreshKey, setRefreshKey] = useState(0);

  // Compute stage from engagement bus state
  const stage = useMemo(() => computeStageFromEngagement({
    exchangeCount: engagementState.exchangeCount,
    topicsExplored: engagementState.topicsExplored,
    journeysCompleted: engagementState.journeysCompleted,
  }), [engagementState.exchangeCount, engagementState.topicsExplored, engagementState.journeysCompleted]);

  const prompts = useMemo(() => {
    const stageConfig = stagePromptsConfig.stages[stage];
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

    // Sort by weight (higher first)
    filtered = [...filtered].sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1));

    // Substitute dynamic variables
    filtered = filtered.map(prompt => {
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

    return filtered.slice(0, maxPrompts);
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
