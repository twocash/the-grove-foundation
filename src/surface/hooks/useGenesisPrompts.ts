// src/surface/hooks/useGenesisPrompts.ts
// Fetch genesis-welcome prompts using Grove data layer
// Sprint: system-prompt-integration-v1

import { useMemo, useRef, useEffect } from 'react';
import { useGroveData } from '@core/data';

export interface GenesisPrompt {
  id: string;
  text: string;
  order: number;
}

interface PromptPayload {
  genesisOrder?: number;
  executionPrompt?: string;
  source?: string;
}

/**
 * Fetch prompts tagged 'genesis-welcome' from Grove data layer, ordered by genesisOrder
 */
export function useGenesisPrompts(_lensId?: string | null) {
  const { objects: allPrompts, loading, error } = useGroveData<PromptPayload>('prompt');
  const hasLoggedRef = useRef(false);

  const prompts = useMemo(() => {
    // Filter to genesis-welcome tagged prompts
    const genesisPrompts = allPrompts.filter(p =>
      p.meta.tags?.includes('genesis-welcome') &&
      p.meta.status === 'active'
    );

    // Sort by genesisOrder, then transform to expected format
    return genesisPrompts
      .sort((a, b) => {
        const orderA = a.payload?.genesisOrder ?? 999;
        const orderB = b.payload?.genesisOrder ?? 999;
        return orderA - orderB;
      })
      .map(p => ({
        id: p.meta.id,
        text: p.meta.title,
        order: p.payload?.genesisOrder ?? 999,
      }));
  }, [allPrompts]);

  // Log only once on initial load
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && prompts.length > 0 && !hasLoggedRef.current) {
      console.log('[useGenesisPrompts] Loaded', prompts.length, 'genesis-welcome prompts');
      hasLoggedRef.current = true;
    }
  }, [prompts.length]);

  return {
    prompts,
    isLoading: loading,
    error: error ? new Error(error) : null
  };
}
