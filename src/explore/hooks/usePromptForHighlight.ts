// src/explore/hooks/usePromptForHighlight.ts
// Hook for looking up prompts for kinetic highlights
// Sprint: kinetic-highlights-v1

import { useCallback, useMemo } from 'react';
import { libraryPrompts } from '@data/prompts';
import {
  findPromptForHighlight,
  getHighlightPrompts,
  type HighlightLookupContext,
} from '@core/context-fields';
import type { PromptObject } from '@core/context-fields/types';

export interface UsePromptForHighlightResult {
  findPrompt: (spanText: string, context?: HighlightLookupContext) => PromptObject | null;
  highlightPrompts: PromptObject[];
  isReady: boolean;
}

/**
 * Hook for looking up backing prompts for kinetic highlights.
 *
 * Uses libraryPrompts which includes highlights.prompts.json data.
 * Provides:
 * - findPrompt: Find the best prompt for a highlighted text span
 * - highlightPrompts: All prompts that can render as highlights
 * - isReady: Always true (library prompts are synchronous)
 */
export function usePromptForHighlight(): UsePromptForHighlightResult {
  // Filter to prompts with highlight surface
  const highlightPrompts = useMemo(() => {
    return getHighlightPrompts(libraryPrompts);
  }, []);

  // Find prompt for a given span text
  const findPrompt = useCallback(
    (spanText: string, context?: HighlightLookupContext): PromptObject | null => {
      return findPromptForHighlight(spanText, libraryPrompts, context);
    },
    []
  );

  return {
    findPrompt,
    highlightPrompts,
    isReady: true, // Library prompts are synchronous
  };
}

export default usePromptForHighlight;
