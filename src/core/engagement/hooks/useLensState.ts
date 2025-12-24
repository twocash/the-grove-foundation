// src/core/engagement/hooks/useLensState.ts

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import type { Actor } from 'xstate';
import type { EngagementMachine } from '../machine';
import { getLens, setLens as persistLens } from '../persistence';
import { VALID_LENSES, isValidLens } from '../config';

export interface UseLensStateOptions {
  actor: Actor<EngagementMachine>;
}

export interface UseLensStateReturn {
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;
  selectLens: (lens: string) => void;
  isHydrated: boolean;
}

export function useLensState({ actor }: UseLensStateOptions): UseLensStateReturn {
  const [isHydrated, setIsHydrated] = useState(false);

  // Subscribe to machine state using useSyncExternalStore
  const snapshot = useSyncExternalStore(
    useCallback((callback) => {
      const subscription = actor.subscribe(callback);
      return () => subscription.unsubscribe();
    }, [actor]),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );

  const lens = snapshot.context.lens;
  const lensSource = snapshot.context.lensSource;

  // Hydration effect - runs once on mount
  useEffect(() => {
    if (isHydrated) return;

    // Priority 1: URL parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLens = urlParams.get('lens');
      if (urlLens && isValidLens(urlLens)) {
        actor.send({ type: 'SELECT_LENS', lens: urlLens, source: 'url' });
        setIsHydrated(true);
        return;
      }
    }

    // Priority 2: localStorage
    const storedLens = getLens();
    if (storedLens && isValidLens(storedLens)) {
      actor.send({ type: 'SELECT_LENS', lens: storedLens, source: 'localStorage' });
      setIsHydrated(true);
      return;
    }

    // No lens found
    setIsHydrated(true);
  }, [actor, isHydrated]);

  // Persistence effect - persist user selections only
  useEffect(() => {
    if (lens && lensSource === 'selection') {
      persistLens(lens);
    }
  }, [lens, lensSource]);

  // Select lens action
  const selectLens = useCallback((newLens: string) => {
    if (!isValidLens(newLens)) {
      console.warn(`Invalid lens: ${newLens}. Valid lenses: ${VALID_LENSES.join(', ')}`);
      return;
    }
    actor.send({ type: 'SELECT_LENS', lens: newLens, source: 'selection' });
  }, [actor]);

  return {
    lens,
    lensSource,
    selectLens,
    isHydrated,
  };
}
