// src/core/telemetry/usePromptTelemetry.ts
// React Hook for Prompt Telemetry
// Sprint: 4d-prompt-refactor-telemetry-v1

import { useCallback, useRef, useEffect } from 'react';
import type { ContextState, ScoredPrompt } from '@core/context-fields/types';
import type { PromptTelemetryEvent, TelemetryContext, TelemetryOutcome } from './types';
import { submitTelemetryEvent } from './client';
import { createTelemetryBatcher } from './batch';

// =============================================================================
// HOOK OPTIONS & RETURN TYPES
// =============================================================================

export interface UsePromptTelemetryOptions {
  /** Session ID for tracking across events */
  sessionId: string;
  /** Enable/disable telemetry (default: true) */
  enabled?: boolean;
}

export interface UsePromptTelemetryReturn {
  /** Record impression events for displayed prompts (batched) */
  recordImpressions: (scoredPrompts: ScoredPrompt[], context: ContextState) => void;
  /** Record selection event when user clicks a prompt (immediate) */
  recordSelection: (promptId: string) => void;
  /** Record completion event after AI responds (immediate) */
  recordCompletion: (promptId: string, outcome: TelemetryOutcome) => void;
}

// =============================================================================
// CONTEXT CONVERSION
// =============================================================================

function contextToTelemetry(context: ContextState): TelemetryContext {
  return {
    stage: context.stage,
    lensId: context.activeLensId,
    entropy: context.entropy,
    interactionCount: context.interactionCount,
    activeTopics: context.topicsExplored,
    activeMoments: context.activeMoments,
  };
}

function createDefaultContext(): TelemetryContext {
  return {
    stage: 'genesis',
    lensId: null,
    entropy: 0,
    interactionCount: 0,
    activeTopics: [],
    activeMoments: [],
  };
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for recording prompt telemetry events
 *
 * @example
 * ```tsx
 * const { recordImpressions, recordSelection, recordCompletion } = usePromptTelemetry({
 *   sessionId: session.id,
 * });
 *
 * // When prompts are displayed (batched)
 * useEffect(() => {
 *   if (scoredPrompts.length > 0) {
 *     recordImpressions(scoredPrompts, contextState);
 *   }
 * }, [scoredPrompts]);
 *
 * // When user clicks a prompt (immediate)
 * const handlePromptClick = (promptId: string) => {
 *   recordSelection(promptId);
 *   // ... handle prompt execution
 * };
 *
 * // When AI response completes
 * recordCompletion(promptId, { dwellTimeMs: 5000, entropyDelta: -0.1 });
 * ```
 */
export function usePromptTelemetry({
  sessionId,
  enabled = true,
}: UsePromptTelemetryOptions): UsePromptTelemetryReturn {
  // Batcher for impression events (auto-flushes)
  const batcherRef = useRef(
    createTelemetryBatcher({
      maxSize: 20,
      flushDelayMs: 100,
      onError: (error) => {
        console.warn('[Telemetry] Batch submission failed:', error.message);
      },
    })
  );

  // Store context for use in selection events
  const contextRef = useRef<TelemetryContext | null>(null);

  // Store scoring details for selection events
  const scoringMapRef = useRef<Map<string, { score: number; rank: number; matchDetails: ScoredPrompt['matchDetails'] }>>(new Map());

  // Flush on unmount
  useEffect(() => {
    return () => {
      batcherRef.current.flush();
    };
  }, []);

  /**
   * Record impression events for displayed prompts
   * Events are batched for efficiency
   */
  const recordImpressions = useCallback(
    (scoredPrompts: ScoredPrompt[], context: ContextState) => {
      if (!enabled) return;

      // Store context and scoring for selection events
      const telemetryContext = contextToTelemetry(context);
      contextRef.current = telemetryContext;
      scoringMapRef.current.clear();

      const timestamp = Date.now();

      scoredPrompts.forEach((scored, index) => {
        // Store scoring for potential selection event
        scoringMapRef.current.set(scored.prompt.id, {
          score: scored.score,
          rank: index,
          matchDetails: scored.matchDetails,
        });

        const event: PromptTelemetryEvent = {
          eventType: 'impression',
          promptId: scored.prompt.id,
          sessionId,
          timestamp,
          context: telemetryContext,
          scoring: {
            finalScore: scored.score,
            rank: index,
            matchDetails: {
              stageMatch: scored.matchDetails.stageMatch,
              lensWeight: scored.matchDetails.lensWeight,
              topicWeight: scored.matchDetails.topicWeight,
              momentBoost: scored.matchDetails.momentBoosts,
            },
          },
        };

        batcherRef.current.add(event);
      });
    },
    [sessionId, enabled]
  );

  /**
   * Record selection event when user clicks a prompt
   * Submitted immediately (not batched) for accuracy
   */
  const recordSelection = useCallback(
    (promptId: string) => {
      if (!enabled) return;

      const context = contextRef.current ?? createDefaultContext();
      const scoring = scoringMapRef.current.get(promptId);

      const event: PromptTelemetryEvent = {
        eventType: 'selection',
        promptId,
        sessionId,
        timestamp: Date.now(),
        context,
        scoring: scoring
          ? {
              finalScore: scoring.score,
              rank: scoring.rank,
              matchDetails: {
                stageMatch: scoring.matchDetails.stageMatch,
                lensWeight: scoring.matchDetails.lensWeight,
                topicWeight: scoring.matchDetails.topicWeight,
                momentBoost: scoring.matchDetails.momentBoosts,
              },
            }
          : undefined,
      };

      // Submit immediately - selection is important
      submitTelemetryEvent(event).catch((error) => {
        console.warn('[Telemetry] Selection submission failed:', error.message);
      });
    },
    [sessionId, enabled]
  );

  /**
   * Record completion event after AI responds
   * Includes outcome metrics like dwell time and entropy delta
   */
  const recordCompletion = useCallback(
    (promptId: string, outcome: TelemetryOutcome) => {
      if (!enabled) return;

      const context = contextRef.current ?? createDefaultContext();

      const event: PromptTelemetryEvent = {
        eventType: 'completion',
        promptId,
        sessionId,
        timestamp: Date.now(),
        context,
        outcome,
      };

      submitTelemetryEvent(event).catch((error) => {
        console.warn('[Telemetry] Completion submission failed:', error.message);
      });
    },
    [sessionId, enabled]
  );

  return {
    recordImpressions,
    recordSelection,
    recordCompletion,
  };
}
