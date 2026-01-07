// src/bedrock/consoles/PromptWorkshop/usePromptData.ts
// Data hook for Prompt Workshop - wraps useGroveData for console factory compatibility
// Sprint: prompt-unification-v1, prompt-library-readonly-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { PatchOperation } from '@core/data/grove-data-provider';
import type { PromptPayload, SequenceDefinition } from '@core/schema/prompt';
import { deriveSequences } from '@core/schema/prompt';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';
import { libraryPrompts } from '@data/prompts';
import type { PromptObject } from '@core/context-fields/types';

// =============================================================================
// Library Prompt Converter
// Sprint: prompt-library-readonly-v1
// =============================================================================

/**
 * Convert PromptObject (JSON library format) to GroveObject<PromptPayload>
 */
function convertLibraryPrompt(prompt: PromptObject): GroveObject<PromptPayload> {
  return {
    meta: {
      id: prompt.id,
      type: 'prompt',
      title: prompt.label,
      description: prompt.description || '',
      icon: prompt.icon || 'chat',
      status: prompt.status === 'active' ? 'active' : 'draft',
      createdAt: new Date(prompt.created).toISOString(),
      updatedAt: new Date(prompt.modified).toISOString(),
      tags: prompt.tags || [],
    },
    payload: {
      executionPrompt: prompt.executionPrompt,
      systemContext: prompt.systemContext,
      topicAffinities: prompt.topicAffinities || [],
      lensAffinities: prompt.lensAffinities || [],
      targeting: prompt.targeting || {},
      baseWeight: prompt.baseWeight ?? 50,
      stats: {
        impressions: prompt.stats?.impressions ?? 0,
        selections: prompt.stats?.selections ?? 0,
        completions: prompt.stats?.completions ?? 0,
        avgEntropyDelta: prompt.stats?.avgEntropyDelta ?? 0,
        avgDwellMs: prompt.stats?.avgDwellAfter ?? 0,
      },
      source: 'library', // Always library for these
      provenance: prompt.provenance,
      surfaces: prompt.surfaces,
      highlightTriggers: prompt.highlightTriggers,
    },
  };
}

/**
 * Memoized conversion of library prompts
 */
const convertedLibraryPrompts: GroveObject<PromptPayload>[] = libraryPrompts.map(convertLibraryPrompt);

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
  // Review queue (Sprint: prompt-extraction-pipeline-v1)
  reviewQueue: GroveObject<PromptPayload>[];
  createExtracted: (object: GroveObject<PromptPayload>) => Promise<GroveObject<PromptPayload>>;
  approveExtracted: (object: GroveObject<PromptPayload>) => Promise<void>;
  rejectExtracted: (object: GroveObject<PromptPayload>, notes?: string) => Promise<void>;
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

  // Strangler fig pattern: Library prompts from JSON, user/generated prompts from data layer
  // Legacy library prompts in Supabase (source: 'library') are ignored
  // User-created (source: 'user') and extracted (source: 'generated') come from data layer
  const allObjects = useMemo(() => {
    const dataLayerPrompts = groveData.objects.filter(
      (p) => p.payload.source === 'user' || p.payload.source === 'generated'
    );
    return [...convertedLibraryPrompts, ...dataLayerPrompts];
  }, [groveData.objects]);

  // Review queue: extracted prompts pending review (Sprint: prompt-extraction-pipeline-v1)
  const reviewQueue = useMemo(() => {
    return groveData.objects.filter(
      (p) =>
        p.payload.source === 'generated' &&
        p.payload.provenance?.type === 'extracted' &&
        p.meta.tags?.includes('pending-review')
    );
  }, [groveData.objects]);

  // Derive sequences from ALL prompts (library + user)
  const sequences = useMemo(() => {
    return deriveSequences(allObjects);
  }, [allObjects]);

  // Get prompts for a specific sequence, ordered
  const getPromptsForSequence = useCallback(
    (groupId: string): GroveObject<PromptPayload>[] => {
      return allObjects
        .filter((p) => p.payload.sequences?.some((s) => s.groupId === groupId))
        .sort((a, b) => {
          const aOrder = a.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
          const bOrder = b.payload.sequences?.find((s) => s.groupId === groupId)?.order ?? 0;
          return aOrder - bOrder;
        });
    },
    [allObjects]
  );

  // Get prompts not in any sequence
  const getUnsequencedPrompts = useCallback((): GroveObject<PromptPayload>[] => {
    return allObjects.filter((p) => !p.payload.sequences?.length);
  }, [allObjects]);

  // Adapt create: console factory expects Partial<PromptPayload>
  const create = useCallback(
    async (defaults?: Partial<PromptPayload>) => {
      const newPrompt = createDefaultPrompt(defaults);
      return groveData.create(newPrompt);
    },
    [groveData]
  );

  // Create from full GroveObject (Sprint: prompt-extraction-pipeline-v1)
  const createExtracted = useCallback(
    async (object: GroveObject<PromptPayload>) => {
      console.log('[usePromptData.createExtracted] Saving prompt:', {
        id: object.meta.id,
        title: object.meta.title,
        description: object.meta.description,
        type: object.meta.type,
        source: object.payload.source,
      });
      const created = await groveData.create(object);
      console.log('[usePromptData.createExtracted] Created:', {
        id: created.meta.id,
        title: created.meta.title,
        description: created.meta.description,
      });
      return created;
    },
    [groveData]
  );

  // Adapt refetch for console factory
  const refetch = useCallback(() => {
    groveData.refetch();
  }, [groveData]);

  // Duplicate prompt - ALWAYS creates a user-owned copy (Sprint: prompt-library-readonly-v1)
  const duplicate = useCallback(
    async (object: GroveObject<PromptPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<PromptPayload> = {
        meta: {
          id: generateUUID(),
          type: 'prompt',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft', // Duplicates start as draft
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          topicAffinities: [...object.payload.topicAffinities],
          lensAffinities: [...object.payload.lensAffinities],
          targeting: { ...object.payload.targeting },
          sequences: object.payload.sequences?.map((s) => ({ ...s })),
          // Reset stats for the copy
          stats: {
            impressions: 0,
            selections: 0,
            completions: 0,
            avgEntropyDelta: 0,
            avgDwellMs: 0,
          },
          // CRITICAL: Always set source to 'user' for duplicates
          source: 'user',
          // Track provenance: where did this come from?
          provenance: {
            ...object.payload.provenance,
            type: 'authored', // User is authoring their own version
            reviewStatus: 'pending',
            duplicatedFrom: object.meta.id,
            duplicatedAt: now,
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

  // Approve extracted prompt (Sprint: prompt-extraction-pipeline-v1)
  const approveExtracted = useCallback(
    async (object: GroveObject<PromptPayload>) => {
      const now = new Date().toISOString();
      const patches: PatchOperation[] = [
        { op: 'replace', path: '/meta/status', value: 'active' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
        {
          op: 'replace',
          path: '/meta/tags',
          value: (object.meta.tags || []).filter((t) => t !== 'pending-review'),
        },
        { op: 'replace', path: '/payload/source', value: 'user' },
        { op: 'replace', path: '/payload/provenance/reviewStatus', value: 'approved' },
        { op: 'add', path: '/payload/provenance/reviewedAt', value: Date.now() },
      ];
      return groveData.update(object.meta.id, patches);
    },
    [groveData]
  );

  // Reject extracted prompt (Sprint: prompt-extraction-pipeline-v1)
  const rejectExtracted = useCallback(
    async (object: GroveObject<PromptPayload>, notes?: string) => {
      const now = new Date().toISOString();
      const patches: PatchOperation[] = [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
        {
          op: 'replace',
          path: '/meta/tags',
          value: [
            ...(object.meta.tags || []).filter((t) => t !== 'pending-review'),
            'rejected',
          ],
        },
        { op: 'replace', path: '/payload/provenance/reviewStatus', value: 'rejected' },
        { op: 'add', path: '/payload/provenance/reviewedAt', value: Date.now() },
        ...(notes ? [{ op: 'add' as const, path: '/payload/provenance/reviewNotes', value: notes }] : []),
      ];
      return groveData.update(object.meta.id, patches);
    },
    [groveData]
  );

  return {
    objects: allObjects, // Library + user prompts merged
    loading: groveData.loading,
    error: groveData.error,
    refetch,
    create,
    createExtracted, // Sprint: prompt-extraction-pipeline-v1
    update: groveData.update,
    remove: groveData.remove,
    duplicate,
    sequences,
    getPromptsForSequence,
    getUnsequencedPrompts,
    reset,
    // Review queue (Sprint: prompt-extraction-pipeline-v1)
    reviewQueue,
    approveExtracted,
    rejectExtracted,
  };
}

export default usePromptData;
