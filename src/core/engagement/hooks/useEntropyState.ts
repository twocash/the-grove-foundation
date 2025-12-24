// src/core/engagement/hooks/useEntropyState.ts

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { ENTROPY_CONFIG } from '../config';

export interface UseEntropyStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseEntropyStateReturn {
  // State from machine
  entropy: number;
  entropyThreshold: number;

  // Computed
  isHighEntropy: boolean;
  entropyPercent: number;

  // Actions
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
}

export function useEntropyState({ actor }: UseEntropyStateOptions): UseEntropyStateReturn {
  // Subscribe to machine state
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  // Derive state from machine
  const { entropy, entropyThreshold } = snapshot.context;

  // Computed values
  const isHighEntropy = useMemo(() => {
    return entropy >= entropyThreshold;
  }, [entropy, entropyThreshold]);

  const entropyPercent = useMemo(() => {
    return Math.round(entropy * 100);
  }, [entropy]);

  // Actions
  const updateEntropy = useCallback((delta: number) => {
    const currentEntropy = actor.getSnapshot().context.entropy;
    const newValue = currentEntropy + delta;
    const clampedValue = Math.max(
      ENTROPY_CONFIG.minValue,
      Math.min(ENTROPY_CONFIG.maxValue, newValue)
    );

    if (clampedValue !== currentEntropy) {
      actor.send({ type: 'UPDATE_ENTROPY', value: clampedValue });
    }
  }, [actor]);

  const resetEntropy = useCallback(() => {
    const currentEntropy = actor.getSnapshot().context.entropy;
    if (currentEntropy !== ENTROPY_CONFIG.resetValue) {
      actor.send({ type: 'UPDATE_ENTROPY', value: ENTROPY_CONFIG.resetValue });
    }
  }, [actor]);

  return {
    entropy,
    entropyThreshold,
    isHighEntropy,
    entropyPercent,
    updateEntropy,
    resetEntropy,
  };
}
