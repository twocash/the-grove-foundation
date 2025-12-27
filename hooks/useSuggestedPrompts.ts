// hooks/useSuggestedPrompts.ts
// Computes stage-aware, lens-filtered prompts
// Sprint: adaptive-engagement-v1

import { useMemo, useCallback, useState } from 'react';
import { useSessionTelemetry } from './useSessionTelemetry';
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

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { lensId, lensName, maxPrompts = 3 } = options;
  const { telemetry } = useSessionTelemetry();
  const [refreshKey, setRefreshKey] = useState(0);

  const prompts = useMemo(() => {
    const stageConfig = stagePromptsConfig.stages[telemetry.stage];
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

      // Build variables
      const lastTopic = telemetry.topicsExplored.slice(-1)[0] ?? 'distributed AI';
      const explored = new Set(telemetry.allTopicsExplored);
      const underexplored = TOPIC_AREAS.find(a => !explored.has(a)) ?? 'edge cases';

      const vars: Record<string, string> = {
        lastTopic,
        lensName: lensName ?? 'curious explorer',
        topicA: telemetry.topicsExplored[0] ?? 'agents',
        topicB: telemetry.topicsExplored[1] ?? 'economics',
        underexploredArea: underexplored,
      };

      for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, value);
      }

      return { ...prompt, text };
    });

    return filtered.slice(0, maxPrompts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetry.stage, telemetry.topicsExplored, lensId, lensName, maxPrompts, refreshKey]);

  const refreshPrompts = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return {
    prompts,
    stage: telemetry.stage,
    refreshPrompts,
  };
}
