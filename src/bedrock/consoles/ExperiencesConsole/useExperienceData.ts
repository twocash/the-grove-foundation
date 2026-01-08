// src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts
// Data hook for Experiences Console - wraps useGroveData for console factory compatibility
// Sprint: experiences-console-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { PatchOperation } from '@core/data/grove-data-provider';
import type { SystemPromptPayload } from '@core/schema/system-prompt';
import { DEFAULT_SYSTEM_PROMPT_PAYLOAD } from '@core/schema/system-prompt';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default SystemPrompt object
 * @param defaults - Optional payload defaults
 * @param userId - Optional user ID for provenance tracking (null if no auth)
 */
export function createDefaultSystemPrompt(
  defaults?: Partial<SystemPromptPayload>,
  userId?: string | null
): GroveObject<SystemPromptPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'system-prompt',
      title: 'New System Prompt',
      description: '',
      icon: 'smart_toy',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_SYSTEM_PROMPT_PAYLOAD,
      ...defaults,
      createdByUserId: userId ?? null,
      updatedByUserId: userId ?? null,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with activation and versioning
 */
export interface ExperienceDataResult extends CollectionDataResult<SystemPromptPayload> {
  /** Currently active system prompt (status: 'active') */
  activePrompt: GroveObject<SystemPromptPayload> | null;
  /** Draft system prompts */
  draftPrompts: GroveObject<SystemPromptPayload>[];
  /** Archived system prompts */
  archivedPrompts: GroveObject<SystemPromptPayload>[];
  /** Activate a prompt (archives current active, invalidates cache) */
  activate: (id: string, userId?: string | null) => Promise<void>;
  /** Create a new version from an existing prompt */
  createVersion: (sourceId: string, changelog?: string, userId?: string | null) => Promise<GroveObject<SystemPromptPayload>>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Experiences Console
 *
 * Wraps useGroveData<SystemPromptPayload>('system-prompt') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activePrompt`: The currently active prompt
 * - `activate(id)`: Archives current active, activates selected, invalidates cache
 * - `createVersion(sourceId, changelog)`: Creates new version from existing prompt
 */
export function useExperienceData(): ExperienceDataResult {
  const groveData = useGroveData<SystemPromptPayload>('system-prompt');

  // Computed views
  const activePrompt = useMemo(() => {
    return groveData.objects.find((p) => p.meta.status === 'active') || null;
  }, [groveData.objects]);

  const draftPrompts = useMemo(() => {
    return groveData.objects.filter((p) => p.meta.status === 'draft');
  }, [groveData.objects]);

  const archivedPrompts = useMemo(() => {
    return groveData.objects.filter((p) => p.meta.status === 'archived');
  }, [groveData.objects]);

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<SystemPromptPayload>, userId?: string | null) => {
      const newPrompt = createDefaultSystemPrompt(defaults, userId);
      return groveData.create(newPrompt);
    },
    [groveData]
  );

  // Activate a prompt
  const activate = useCallback(
    async (id: string, userId?: string | null) => {
      const now = new Date().toISOString();

      // 1. Archive current active (if different from target)
      if (activePrompt && activePrompt.meta.id !== id) {
        await groveData.update(activePrompt.meta.id, [
          { op: 'replace', path: '/meta/status', value: 'archived' },
          { op: 'replace', path: '/meta/updatedAt', value: now },
          { op: 'replace', path: '/payload/updatedByUserId', value: userId ?? null },
        ]);
      }

      // 2. Activate selected prompt
      await groveData.update(id, [
        { op: 'replace', path: '/meta/status', value: 'active' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
        { op: 'replace', path: '/payload/updatedByUserId', value: userId ?? null },
      ]);

      // 3. Invalidate server cache
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'system-prompt' }),
        });
        console.log('[useExperienceData] Cache invalidated');
      } catch (error) {
        console.warn('[useExperienceData] Failed to invalidate cache:', error);
      }
    },
    [activePrompt, groveData]
  );

  // Create a new version from existing
  const createVersion = useCallback(
    async (sourceId: string, changelog?: string, userId?: string | null) => {
      const source = groveData.objects.find((p) => p.meta.id === sourceId);
      if (!source) {
        throw new Error(`Source prompt not found: ${sourceId}`);
      }

      const now = new Date().toISOString();
      const newVersion = source.payload.version + 1;

      const versionedPrompt: GroveObject<SystemPromptPayload> = {
        meta: {
          id: generateUUID(),
          type: 'system-prompt',
          title: `${source.meta.title} v${newVersion}`,
          description: source.meta.description,
          icon: source.meta.icon,
          status: 'draft', // New versions start as draft
          createdAt: now,
          updatedAt: now,
          tags: [...(source.meta.tags || [])],
        },
        payload: {
          ...source.payload,
          version: newVersion,
          changelog: changelog || `Cloned from v${source.payload.version}`,
          previousVersionId: source.meta.id,
          createdByUserId: userId ?? null,
          updatedByUserId: userId ?? null,
        },
      };

      return groveData.create(versionedPrompt);
    },
    [groveData]
  );

  // Duplicate prompt
  const duplicate = useCallback(
    async (object: GroveObject<SystemPromptPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<SystemPromptPayload> = {
        meta: {
          id: generateUUID(),
          type: 'system-prompt',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          version: 1, // Reset version for copies
          changelog: undefined,
          previousVersionId: undefined,
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  return {
    // Standard CollectionDataResult
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch: groveData.refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,

    // Extended functionality
    activePrompt,
    draftPrompts,
    archivedPrompts,
    activate,
    createVersion,
  };
}

export default useExperienceData;
