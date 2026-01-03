// src/bedrock/consoles/PromptWorkshop/usePromptData.ts
// Data hook for Prompt Workshop - wraps useGroveData for console factory compatibility
// Sprint: prompt-unification-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, SequenceDefinition } from '@core/schema/prompt';
import { deriveSequences } from '@core/schema/prompt';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Prompt Factory
// =============================================================================

export function createDefaultPrompt(defaults?: Partial<PromptPayload>): GroveObject<PromptPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'prompt',
      title: 'New Prompt',
      description: '',
      icon: 'chat',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      executionPrompt: '',
      topicAffinities: [],
      lensAffinities: [],
      targeting: {},
      baseWeight: 50,
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellMs: 0,
      },
      source: 'user',
      variant: 'default',
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface PromptDataResult extends CollectionDataResult<PromptPayload> {
  sequences: SequenceDefinition[];
  getPromptsForSequence: (groupId: string) => GroveObject<PromptPayload>[];
  getUnsequencedPrompts: () => GroveObject<PromptPayload>[];
  reset: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Prompt Workshop
 *
 * Wraps useGroveData<PromptPayload>('prompt') to provide the CollectionDataResult
 * interface expected by the console factory pattern.
 *
 * Additional features:
 * - `sequences`: Derived sequence definitions from prompts
 * - `getPromptsForSequence`: Get ordered prompts for a sequence
 * - `getUnsequencedPrompts`: Get prompts not in any sequence
 */
export function usePromptData(): PromptDataResult {
  const groveData = useGroveData<PromptPayload>('prompt');

  // Derive sequences from prompts
  const sequences = useMemo(() => {
    return deriveSequences(groveData.objects);
  }, [groveData.objects]);

  // Get prompts for a specific sequence, ordered
  const getPromptsForSequence = useCallback(
    (groupId: string): GroveObject<PromptPayload>[] => {
      return groveData.objects
        .filter((p) => p.payload.sequences?.some((s) => s.groupId === groupId))
        .sort((a, b) => {
          const aOrder = a.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
          const bOrder = b.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
          return aOrder - bOrder;
        });
    },
    [groveData.objects]
  );

  // Get prompts not in any sequence
  const getUnsequencedPrompts = useCallback((): GroveObject<PromptPayload>[] => {
    return groveData.objects.filter((p) => !p.payload.sequences?.length);
  }, [groveData.objects]);

  // Adapt create: console factory expects Partial<PromptPayload>
  const create = useCallback(
    async (defaults?: Partial<PromptPayload>) => {
      const newPrompt = createDefaultPrompt(defaults);
      return groveData.create(newPrompt);
    },
    [groveData]
  );

  // Adapt refetch for console factory
  const refetch = useCallback(() => {
    groveData.refetch();
  }, [groveData]);

  // Duplicate prompt
  const duplicate = useCallback(
    async (object: GroveObject<PromptPayload>) => {
      const duplicated: GroveObject<PromptPayload> = {
        meta: {
          id: generateUUID(),
          type: 'prompt',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          topicAffinities: [...object.payload.topicAffinities],
          lensAffinities: [...object.payload.lensAffinities],
          targeting: { ...object.payload.targeting },
          sequences: object.payload.sequences?.map((s) => ({ ...s })),
          stats: {
            impressions: 0,
            selections: 0,
            completions: 0,
            avgEntropyDelta: 0,
            avgDwellMs: 0,
          },
        },
      };
      return groveData.create(duplicated);
    },
    [groveData]
  );

  // Reset: clears storage and refetches
  const reset = useCallback(() => {
    localStorage.removeItem('grove-data-prompt-v1');
    groveData.refetch();
  }, [groveData]);

  return {
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,
    sequences,
    getPromptsForSequence,
    getUnsequencedPrompts,
    reset,
  };
}

export default usePromptData;
