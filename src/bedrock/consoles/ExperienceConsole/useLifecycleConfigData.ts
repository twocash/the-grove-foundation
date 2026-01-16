// src/bedrock/consoles/ExperienceConsole/useLifecycleConfigData.ts
// Data hook for Lifecycle Config objects
// Sprint: S5-SL-LifecycleEngine v1
//
// DEX: Organic Scalability - data hook follows established pattern from useResearchAgentConfigData
// SINGLETON pattern: One active lifecycle config per grove

import { useCallback, useMemo, useState } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { LifecycleConfigPayload } from '@core/schema/lifecycle-config';
import { DEFAULT_LIFECYCLE_CONFIG_PAYLOAD } from '@core/schema/lifecycle-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Optimistic State Types
// =============================================================================

/**
 * Tracks pending activation for optimistic UI updates
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
 * Create a default Lifecycle Config GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultLifecycleConfig(
  defaults?: Partial<LifecycleConfigPayload>
): GroveObject<LifecycleConfigPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'lifecycle-config',
      title: 'Lifecycle Configuration',
      description: 'Configure tier labels, emojis, and stage-to-tier mappings',
      icon: 'timeline',
      status: 'draft', // New configs start as draft (singleton pattern)
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_LIFECYCLE_CONFIG_PAYLOAD,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface LifecycleConfigDataResult extends CollectionDataResult<LifecycleConfigPayload> {
  /** Get the active (singleton) config */
  activeConfig: GroveObject<LifecycleConfigPayload> | undefined;
  /** Draft configurations */
  draftConfigs: GroveObject<LifecycleConfigPayload>[];
  /** Archived configurations */
  archivedConfigs: GroveObject<LifecycleConfigPayload>[];
  /** Activate a config (archives current active, sets target to active) */
  activate: (id: string) => Promise<void>;
  /** Save changes to active config as new version (creates new record, archives old) */
  saveAndActivate: (
    currentConfig: GroveObject<LifecycleConfigPayload>,
    pendingChanges: Partial<LifecycleConfigPayload>
  ) => Promise<GroveObject<LifecycleConfigPayload>>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Lifecycle Config in Experience Console
 *
 * This is a SINGLETON type - only one active instance should exist.
 * Wraps useGroveData<LifecycleConfigPayload>('lifecycle-config') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activeConfig`: The active configuration instance
 * - `activate(id)`: Archives current active, activates selected
 * - `saveAndActivate`: Creates new version when editing active config
 */
export function useLifecycleConfigData(): LifecycleConfigDataResult {
  const groveData = useGroveData<LifecycleConfigPayload>('lifecycle-config');

  // Optimistic state for immediate UI updates during activation
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
    async (defaults?: Partial<LifecycleConfigPayload>) => {
      const newConfig = createDefaultLifecycleConfig(defaults);
      return groveData.create(newConfig);
    },
    [groveData]
  );

  // Duplicate config - creates as DRAFT (singleton pattern)
  const duplicate = useCallback(
    async (object: GroveObject<LifecycleConfigPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<LifecycleConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'lifecycle-config',
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
          console.log('[LifecycleConfigData] Archived previous active:', activeConfig.meta.id);
        }

        // 2. Activate selected config
        await groveData.update(id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: now },
        ]);
        console.log('[LifecycleConfigData] Activated:', id);

        // 3. Refetch to update UI state
        await groveData.refetch();
      } finally {
        // 4. Clear optimistic state after refetch completes (or on error)
        setPendingActivation(null);
      }
    },
    [activeConfig, groveData]
  );

  /**
   * Save changes to active config as a new version.
   * Creates new record, archives old.
   * Only valid for configs with status: 'active'.
   */
  const saveAndActivate = useCallback(
    async (
      currentConfig: GroveObject<LifecycleConfigPayload>,
      pendingChanges: Partial<LifecycleConfigPayload>
    ): Promise<GroveObject<LifecycleConfigPayload>> => {
      // Validate: only active configs can use this flow
      if (currentConfig.meta.status !== 'active') {
        throw new Error('saveAndActivate only valid for active configs');
      }

      const now = new Date().toISOString();

      // Build new payload with changes
      const newPayload: LifecycleConfigPayload = {
        ...currentConfig.payload,
        ...pendingChanges,
      };

      // Build new object with fresh UUID
      const newConfig: GroveObject<LifecycleConfigPayload> = {
        meta: {
          ...currentConfig.meta,
          id: generateUUID(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        payload: newPayload,
      };

      console.log('[LifecycleConfigData] Creating new version:', {
        oldId: currentConfig.meta.id,
        newId: newConfig.meta.id,
      });

      // Step 1: Archive old record FIRST
      await groveData.update(currentConfig.meta.id, [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);
      console.log('[LifecycleConfigData] Archived old version:', currentConfig.meta.id);

      // Step 2: Create new active record
      let created: GroveObject<LifecycleConfigPayload>;
      try {
        created = await groveData.create(newConfig);
      } catch (createError) {
        // CRITICAL: Rollback - restore old config to active
        console.error('[LifecycleConfigData] Create failed, rolling back archive:', createError);
        await groveData.update(currentConfig.meta.id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: new Date().toISOString() },
        ]);
        console.log('[LifecycleConfigData] Rollback complete - restored old version to active');
        throw createError;
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
    saveAndActivate,
  };
}

export default useLifecycleConfigData;
