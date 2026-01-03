// hooks/usePromptCollection.ts
// Prompt collection management hook
// Sprint: genesis-context-fields-v1 (Epic 3, 5)

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { PromptObject, ContextState } from '@core/context-fields/types';
import { getPromptGenerator } from '@core/context-fields/generator';
import { libraryPrompts } from '../src/data/prompts';

export interface UsePromptCollectionResult {
  library: PromptObject[];
  generated: PromptObject[];
  usedIds: Set<string>;
  isLoading: boolean;
  error: Error | null;
  trackSelection: (promptId: string) => void;
  addGeneratedPrompt: (prompt: PromptObject) => void;
  clearGenerated: () => void;
  generateForContext: (context: ContextState) => Promise<void>;
}

/**
 * Hook for managing prompt collections
 * Provides library prompts and generated prompts
 */
export function usePromptCollection(): UsePromptCollectionResult {
  const [generated, setGenerated] = useState<PromptObject[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const generatorRef = useRef(getPromptGenerator());

  // Filter to active library prompts only
  const library = useMemo(() => {
    return libraryPrompts.filter(p => p.status === 'active');
  }, []);

  // Track prompt selection (excludes from future suggestions)
  const trackSelection = useCallback((promptId: string) => {
    setUsedIds(prev => {
      const next = new Set(prev);
      next.add(promptId);
      console.log('[PromptCollection] Selection tracked, used count:', next.size);
      return next;
    });
  }, []);

  // Add a generated prompt to the collection
  const addGeneratedPrompt = useCallback((prompt: PromptObject) => {
    setGenerated(prev => {
      // Prevent duplicates
      if (prev.some(p => p.id === prompt.id)) {
        return prev;
      }
      return [...prev, prompt];
    });
  }, []);

  // Clear generated prompts (e.g., on session reset)
  const clearGenerated = useCallback(() => {
    setGenerated([]);
    generatorRef.current.invalidateCache();
  }, []);

  // Generate prompts for a given context (Epic 5)
  const generateForContext = useCallback(async (context: ContextState) => {
    // Only generate after minimum interactions
    if (context.interactionCount < 2) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newPrompts = await generatorRef.current.generateAhead(context);

      // Add unique prompts to collection
      setGenerated(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const unique = newPrompts.filter(p => !existingIds.has(p.id));
        if (unique.length === 0) return prev;

        console.log('[PromptCollection] Generated', unique.length, 'new prompts');
        return [...prev, ...unique];
      });
    } catch (err) {
      console.error('[PromptCollection] Generation failed:', err);
      setError(err instanceof Error ? err : new Error('Generation failed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    library,
    generated,
    usedIds,
    isLoading,
    error,
    trackSelection,
    addGeneratedPrompt,
    clearGenerated,
    generateForContext
  };
}
