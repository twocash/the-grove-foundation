// src/bedrock/consoles/ExperienceConsole/useExperienceData.ts
// Data hook for Experiences Console - wraps useGroveData for console factory compatibility
// Sprint: experiences-console-v1

import { useCallback, useMemo, useState } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { PatchOperation } from '@core/data/grove-data-provider';
import type { SystemPromptPayload } from '@core/schema/system-prompt';
import { DEFAULT_SYSTEM_PROMPT_PAYLOAD } from '@core/schema/system-prompt';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Optimistic State Types
// =============================================================================

/**
 * Tracks pending activation for optimistic UI updates
 * Sprint: system-prompt-versioning-v1
 */
interface PendingActivation {
  /** ID of prompt being activated */
  newActiveId: string;
  /** ID of prompt being archived (null if none) */
  oldActiveId: string | null;
}

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
  /** Save changes to active prompt as new version (creates new record, archives old) */
  saveAndActivate: (
    currentPrompt: GroveObject<SystemPromptPayload>,
    pendingChanges: Partial<SystemPromptPayload>,
    userId?: string | null
  ) => Promise<GroveObject<SystemPromptPayload>>;
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

  // Optimistic state for immediate UI updates during activation
  // Sprint: system-prompt-versioning-v1
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);

  // Apply optimistic updates to objects array for immediate card updates
  const objects = useMemo(() => {
    if (!pendingActivation) {
      return groveData.objects;
    }

    // Apply pending status changes optimistically
    return groveData.objects.map((obj) => {
      if (obj.meta.id === pendingActivation.newActiveId) {
        // This prompt is being activated
        return {
          ...obj,
          meta: { ...obj.meta, status: 'active' as const },
        };
      }
      if (obj.meta.id === pendingActivation.oldActiveId) {
        // This prompt is being archived
        return {
          ...obj,
          meta: { ...obj.meta, status: 'archived' as const },
        };
      }
      return obj;
    });
  }, [groveData.objects, pendingActivation]);

  // Computed views - use optimistic objects
  const activePrompt = useMemo(() => {
    return objects.find((p) => p.meta.status === 'active') || null;
  }, [objects]);

  const draftPrompts = useMemo(() => {
    return objects.filter((p) => p.meta.status === 'draft');
  }, [objects]);

  const archivedPrompts = useMemo(() => {
    return objects.filter((p) => p.meta.status === 'archived');
  }, [objects]);

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

      // 0. Set optimistic state FIRST for immediate UI update
      // Sprint: system-prompt-versioning-v1
      const oldActiveId = activePrompt?.meta.id !== id ? activePrompt?.meta.id ?? null : null;
      setPendingActivation({ newActiveId: id, oldActiveId });

      try {
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

        // 4. Refetch to update UI state
        await groveData.refetch();
      } finally {
        // 5. Clear optimistic state after refetch completes (or on error)
        setPendingActivation(null);
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

  /**
   * Save changes to active prompt as a new version.
   * Creates new record with incremented version, archives old.
   * Only valid for prompts with status: 'active'.
   * Sprint: system-prompt-versioning-v1
   */
  const saveAndActivate = useCallback(
    async (
      currentPrompt: GroveObject<SystemPromptPayload>,
      pendingChanges: Partial<SystemPromptPayload>,
      userId?: string | null
    ): Promise<GroveObject<SystemPromptPayload>> => {
      // Validate: only active prompts can use this flow
      if (currentPrompt.meta.status !== 'active') {
        throw new Error('saveAndActivate only valid for active prompts');
      }

      const now = new Date().toISOString();

      // Build new payload with version increment and provenance
      const newPayload: SystemPromptPayload = {
        ...currentPrompt.payload,
        ...pendingChanges,
        version: currentPrompt.payload.version + 1,
        previousVersionId: currentPrompt.meta.id,
        updatedByUserId: userId ?? currentPrompt.payload.updatedByUserId,
        createdByUserId: userId ?? currentPrompt.payload.createdByUserId,
      };

      // Build new object with fresh UUID
      const newPrompt: GroveObject<SystemPromptPayload> = {
        meta: {
          ...currentPrompt.meta,
          id: generateUUID(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        payload: newPayload,
      };

      console.log('[ExperienceData] Creating new version:', {
        oldId: currentPrompt.meta.id,
        newId: newPrompt.meta.id,
        version: newPayload.version,
      });

      // Step 1: Archive old record FIRST (to avoid unique constraint violation)
      await groveData.update(currentPrompt.meta.id, [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);
      console.log('[ExperienceData] Archived old version:', currentPrompt.meta.id);

      // Step 2: Create new active record (now safe - no other active exists)
      let created: GroveObject<SystemPromptPayload>;
      try {
        created = await groveData.create(newPrompt);
      } catch (createError) {
        // CRITICAL: Rollback - restore old prompt to active (never leave with no active prompt)
        console.error('[ExperienceData] Create failed, rolling back archive:', createError);
        await groveData.update(currentPrompt.meta.id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: new Date().toISOString() },
        ]);
        console.log('[ExperienceData] Rollback complete - restored old version to active');
        throw createError; // Re-throw to notify caller
      }

      // Step 3: Invalidate server cache
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'system-prompt' }),
        });
        console.log('[ExperienceData] Cache invalidated');
      } catch (e) {
        console.warn('[ExperienceData] Cache invalidation failed:', e);
      }

      // Step 4: Refetch to update UI state
      await groveData.refetch();

      return created;
    },
    [groveData]
  );

  return {
    // Standard CollectionDataResult (uses optimistic objects for immediate UI updates)
    objects,
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
    saveAndActivate,
  };
}

export default useExperienceData;
