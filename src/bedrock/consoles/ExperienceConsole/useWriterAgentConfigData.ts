// src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts
// Data hook for Writer Agent Config objects
// Sprint: experience-console-cleanup-v1
// Hotfix: singleton-pattern-v1 - added versioning, optimistic UI, saveAndActivate
//
// DEX: Organic Scalability - data hook follows established pattern from useExperienceData

import { useCallback, useMemo, useState } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Optimistic State Types
// =============================================================================

/**
 * Tracks pending activation for optimistic UI updates
 * Sprint: singleton-pattern-v1
 */
interface PendingActivation {
  /** ID of config being activated */
  newActiveId: string;
  /** ID of config being archived (null if none) */
  oldActiveId: string | null;
}

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Writer Agent Config GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultWriterAgentConfig(
  defaults?: Partial<WriterAgentConfigPayload>
): GroveObject<WriterAgentConfigPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'writer-agent-config',
      title: 'Writer Agent Config',
      description: 'Configure document writing behavior',
      icon: 'edit_note',
      status: 'draft', // New configs start as draft (singleton pattern)
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface WriterAgentConfigDataResult extends CollectionDataResult<WriterAgentConfigPayload> {
  /** Get the active (singleton) config */
  activeConfig: GroveObject<WriterAgentConfigPayload> | undefined;
  /** Draft configurations */
  draftConfigs: GroveObject<WriterAgentConfigPayload>[];
  /** Archived configurations */
  archivedConfigs: GroveObject<WriterAgentConfigPayload>[];
  /** Activate a config (archives current active, sets target to active) */
  activate: (id: string) => Promise<void>;
  /** Create a new version from an existing config */
  createVersion: (sourceId: string, changelog?: string) => Promise<GroveObject<WriterAgentConfigPayload>>;
  /** Save changes to active config as new version (creates new record, archives old) */
  saveAndActivate: (
    currentConfig: GroveObject<WriterAgentConfigPayload>,
    pendingChanges: Partial<WriterAgentConfigPayload>
  ) => Promise<GroveObject<WriterAgentConfigPayload>>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Writer Agent Config in Experience Console
 *
 * This is a SINGLETON type - only one active instance should exist.
 * Wraps useGroveData<WriterAgentConfigPayload>('writer-agent-config') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activeConfig`: The active configuration instance
 * - `activate(id)`: Archives current active, activates selected
 * - `saveAndActivate`: Creates new version when editing active config
 */
export function useWriterAgentConfigData(): WriterAgentConfigDataResult {
  const groveData = useGroveData<WriterAgentConfigPayload>('writer-agent-config');

  // Optimistic state for immediate UI updates during activation
  // Sprint: singleton-pattern-v1
  const [pendingActivation, setPendingActivation] = useState<PendingActivation | null>(null);

  // Apply optimistic updates to objects array for immediate card updates
  const objects = useMemo(() => {
    if (!pendingActivation) {
      return groveData.objects;
    }

    // Apply pending status changes optimistically
    return groveData.objects.map((obj) => {
      if (obj.meta.id === pendingActivation.newActiveId) {
        // This config is being activated
        return {
          ...obj,
          meta: { ...obj.meta, status: 'active' as const },
        };
      }
      if (obj.meta.id === pendingActivation.oldActiveId) {
        // This config is being archived
        return {
          ...obj,
          meta: { ...obj.meta, status: 'archived' as const },
        };
      }
      return obj;
    });
  }, [groveData.objects, pendingActivation]);

  // Computed views - use optimistic objects
  const activeConfig = useMemo(() => {
    return objects.find((obj) => obj.meta.status === 'active');
  }, [objects]);

  const draftConfigs = useMemo(() => {
    return objects.filter((obj) => obj.meta.status === 'draft');
  }, [objects]);

  const archivedConfigs = useMemo(() => {
    return objects.filter((obj) => obj.meta.status === 'archived');
  }, [objects]);

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<WriterAgentConfigPayload>) => {
      const newConfig = createDefaultWriterAgentConfig(defaults);
      return groveData.create(newConfig);
    },
    [groveData]
  );

  // Duplicate config - creates as DRAFT with version reset (singleton pattern)
  const duplicate = useCallback(
    async (object: GroveObject<WriterAgentConfigPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<WriterAgentConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'writer-agent-config',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft', // SINGLETON: duplicates start as draft
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

  // Activate a config (singleton pattern: archives current active, sets target to active)
  const activate = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();

      // 0. Set optimistic state FIRST for immediate UI update
      const oldActiveId = activeConfig?.meta.id !== id ? activeConfig?.meta.id ?? null : null;
      setPendingActivation({ newActiveId: id, oldActiveId });

      try {
        // 1. Archive current active (if different from target)
        if (activeConfig && activeConfig.meta.id !== id) {
          await groveData.update(activeConfig.meta.id, [
            { op: 'replace', path: '/meta/status', value: 'archived' },
            { op: 'replace', path: '/meta/updatedAt', value: now },
          ]);
          console.log('[WriterAgentConfigData] Archived previous active:', activeConfig.meta.id);
        }

        // 2. Activate selected config
        await groveData.update(id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: now },
        ]);
        console.log('[WriterAgentConfigData] Activated:', id);

        // 3. Refetch to update UI state
        await groveData.refetch();
      } finally {
        // 4. Clear optimistic state after refetch completes (or on error)
        setPendingActivation(null);
      }
    },
    [activeConfig, groveData]
  );

  // Create a new version from existing config
  const createVersion = useCallback(
    async (sourceId: string, changelog?: string) => {
      const source = groveData.objects.find((c) => c.meta.id === sourceId);
      if (!source) {
        throw new Error(`Source config not found: ${sourceId}`);
      }

      const now = new Date().toISOString();
      const newVersion = (source.payload.version || 1) + 1;

      const versionedConfig: GroveObject<WriterAgentConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'writer-agent-config',
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
          changelog: changelog || `Cloned from v${source.payload.version || 1}`,
          previousVersionId: source.meta.id,
        },
      };

      return groveData.create(versionedConfig);
    },
    [groveData]
  );

  /**
   * Save changes to active config as a new version.
   * Creates new record with incremented version, archives old.
   * Only valid for configs with status: 'active'.
   * Sprint: singleton-pattern-v1
   */
  const saveAndActivate = useCallback(
    async (
      currentConfig: GroveObject<WriterAgentConfigPayload>,
      pendingChanges: Partial<WriterAgentConfigPayload>
    ): Promise<GroveObject<WriterAgentConfigPayload>> => {
      // Validate: only active configs can use this flow
      if (currentConfig.meta.status !== 'active') {
        throw new Error('saveAndActivate only valid for active configs');
      }

      const now = new Date().toISOString();

      // Build new payload with version increment and provenance
      const newPayload: WriterAgentConfigPayload = {
        ...currentConfig.payload,
        ...pendingChanges,
        version: (currentConfig.payload.version || 1) + 1,
        previousVersionId: currentConfig.meta.id,
      };

      // Build new object with fresh UUID
      const newConfig: GroveObject<WriterAgentConfigPayload> = {
        meta: {
          ...currentConfig.meta,
          id: generateUUID(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        payload: newPayload,
      };

      console.log('[WriterAgentConfigData] Creating new version:', {
        oldId: currentConfig.meta.id,
        newId: newConfig.meta.id,
        version: newPayload.version,
      });

      // Step 1: Archive old record FIRST (to avoid unique constraint violation)
      await groveData.update(currentConfig.meta.id, [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);
      console.log('[WriterAgentConfigData] Archived old version:', currentConfig.meta.id);

      // Step 2: Create new active record (now safe - no other active exists)
      let created: GroveObject<WriterAgentConfigPayload>;
      try {
        created = await groveData.create(newConfig);
      } catch (createError) {
        // CRITICAL: Rollback - restore old config to active (never leave with no active)
        console.error('[WriterAgentConfigData] Create failed, rolling back archive:', createError);
        await groveData.update(currentConfig.meta.id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: new Date().toISOString() },
        ]);
        console.log('[WriterAgentConfigData] Rollback complete - restored old version to active');
        throw createError; // Re-throw to notify caller
      }

      // Step 3: Refetch to update UI state
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

    // Extended functionality (singleton pattern)
    activeConfig,
    draftConfigs,
    archivedConfigs,
    activate,
    createVersion,
    saveAndActivate,
  };
}

export default useWriterAgentConfigData;
