// src/explore/hooks/useSequence.ts
// Hook for navigating through prompt sequences
// Sprint: prompt-unification-v1

import { useState, useMemo, useCallback } from 'react';
import { useGroveData } from '@core/data';
import type { Prompt, PromptPayload, SequenceDefinition, SequenceType } from '@core/schema/prompt';

/**
 * Sequence navigation state
 */
export interface SequenceState {
  /** Sequence definition */
  definition: SequenceDefinition;
  /** All prompts in the sequence, ordered */
  prompts: Prompt[];
  /** Current prompt */
  currentPrompt: Prompt | undefined;
  /** Current index in sequence */
  currentIndex: number;
  /** Whether at the end of the sequence */
  isComplete: boolean;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Sequence navigation actions
 */
export interface SequenceActions {
  /** Move to next prompt */
  advance: () => void;
  /** Move to previous prompt */
  back: () => void;
  /** Jump to specific index */
  goTo: (index: number) => void;
  /** Reset to beginning */
  reset: () => void;
}

/**
 * Hook for navigating through a prompt sequence
 *
 * Provides ordered access to prompts within a sequence (journey, briefing, etc.)
 * and navigation controls for stepping through them.
 *
 * @example
 * ```tsx
 * const { state, actions } = useSequence('journey-ratchet');
 *
 * return (
 *   <div>
 *     <h2>{state.definition.title}</h2>
 *     <p>Step {state.currentIndex + 1} of {state.prompts.length}</p>
 *     <PromptDisplay prompt={state.currentPrompt} />
 *     <button onClick={actions.advance} disabled={state.isComplete}>
 *       Next
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useSequence(groupId: string): {
  state: SequenceState;
  actions: SequenceActions;
} {
  const { data: allPrompts, loading } = useGroveData<PromptPayload>('prompt');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get prompts for this sequence, sorted by order
  const prompts = useMemo(() => {
    return allPrompts
      .filter((p) => p.payload.sequences?.some((s) => s.groupId === groupId))
      .sort((a, b) => {
        const aOrder = a.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
        const bOrder = b.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
        return aOrder - bOrder;
      });
  }, [allPrompts, groupId]);

  // Build sequence definition
  const definition = useMemo((): SequenceDefinition => {
    const first = prompts[0]?.payload.sequences?.find((s) => s.groupId === groupId);
    return {
      groupId,
      groupType: (first?.groupType as SequenceType) ?? 'journey',
      title: formatGroupTitle(groupId),
      promptCount: prompts.length,
    };
  }, [prompts, groupId]);

  // Navigation actions
  const advance = useCallback(() => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, prompts.length]);

  const back = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < prompts.length) {
        setCurrentIndex(index);
      }
    },
    [prompts.length]
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  // Build state
  const state: SequenceState = {
    definition,
    prompts,
    currentPrompt: prompts[currentIndex],
    currentIndex,
    isComplete: currentIndex >= prompts.length - 1,
    progress: prompts.length > 0 ? ((currentIndex + 1) / prompts.length) * 100 : 0,
  };

  const actions: SequenceActions = {
    advance,
    back,
    goTo,
    reset,
  };

  return { state, actions };
}

/**
 * Format group ID into readable title
 * e.g., "journey-ratchet-effect" -> "Ratchet Effect"
 */
function formatGroupTitle(groupId: string): string {
  const parts = groupId.split('-').slice(1);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export default useSequence;
