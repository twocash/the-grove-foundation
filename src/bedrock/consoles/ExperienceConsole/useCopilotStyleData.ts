// src/bedrock/consoles/ExperienceConsole/useCopilotStyleData.ts
// Data hook for Copilot Style objects
// Sprint: inspector-copilot-v1
// Hotfix: singleton-pattern-v1 - added versioning, optimistic UI, saveAndActivate
//
// DEX: Organic Scalability - data hook follows established pattern from useResearchAgentConfigData

import { useCallback, useMemo, useState } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { CopilotStylePayload } from '@core/schema/copilot-style';
import { DEFAULT_COPILOT_STYLE_PAYLOAD, createCopilotStylePayload } from '@core/schema/copilot-style';
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
  /** ID of style being activated */
  newActiveId: string;
  /** ID of style being archived (null if none) */
  oldActiveId: string | null;
}

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default CopilotStyle GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultCopilotStyle(
  defaults?: Partial<CopilotStylePayload>
): GroveObject<CopilotStylePayload> {
  const now = new Date().toISOString();
  const preset = defaults?.preset ?? 'terminal-green';

  return {
    meta: {
      id: generateUUID(),
      type: 'copilot-style',
      title: defaults?.styleId ?? `Copilot Style (${preset})`,
      description: 'Terminal styling configuration for inspector copilot',
      icon: 'terminal',
      status: 'draft', // New styles start as draft (singleton pattern)
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...createCopilotStylePayload(preset, defaults),
      version: 1, // New objects start at version 1
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with activation and versioning (singleton pattern)
 */
export interface CopilotStyleDataResult extends CollectionDataResult<CopilotStylePayload> {
  /** Get the active (singleton) style */
  activeStyle: GroveObject<CopilotStylePayload> | undefined;
  /** Draft styles */
  draftStyles: GroveObject<CopilotStylePayload>[];
  /** Archived styles */
  archivedStyles: GroveObject<CopilotStylePayload>[];
  /** Activate a style (archives current active, sets target to active) */
  activate: (id: string) => Promise<void>;
  /** Create a new version from an existing style */
  createVersion: (sourceId: string, changelog?: string) => Promise<GroveObject<CopilotStylePayload>>;
  /** Save changes to active style as new version (creates new record, archives old) */
  saveAndActivate: (
    currentStyle: GroveObject<CopilotStylePayload>,
    pendingChanges: Partial<CopilotStylePayload>
  ) => Promise<GroveObject<CopilotStylePayload>>;
  /** Get style by preset name */
  getStyleByPreset: (preset: CopilotStylePayload['preset']) => GroveObject<CopilotStylePayload> | undefined;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Copilot Style in Experience Console
 *
 * This is a SINGLETON type - only one active instance should exist.
 * Wraps useGroveData<CopilotStylePayload>('copilot-style') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `activeStyle`: The active configuration instance
 * - `activate(id)`: Archives current active, activates selected
 * - `saveAndActivate`: Creates new version when editing active style
 */
export function useCopilotStyleData(): CopilotStyleDataResult {
  const groveData = useGroveData<CopilotStylePayload>('copilot-style');

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
        // This style is being activated
        return {
          ...obj,
          meta: { ...obj.meta, status: 'active' as const },
        };
      }
      if (obj.meta.id === pendingActivation.oldActiveId) {
        // This style is being archived
        return {
          ...obj,
          meta: { ...obj.meta, status: 'archived' as const },
        };
      }
      return obj;
    });
  }, [groveData.objects, pendingActivation]);

  // Computed views - use optimistic objects
  const activeStyle = useMemo(() => {
    return objects.find((obj) => obj.meta.status === 'active');
  }, [objects]);

  const draftStyles = useMemo(() => {
    return objects.filter((obj) => obj.meta.status === 'draft');
  }, [objects]);

  const archivedStyles = useMemo(() => {
    return objects.filter((obj) => obj.meta.status === 'archived');
  }, [objects]);

  // Find style by preset
  const getStyleByPreset = useCallback(
    (preset: CopilotStylePayload['preset']) => {
      return objects.find((s) => s.payload.preset === preset);
    },
    [objects]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<CopilotStylePayload>) => {
      const newStyle = createDefaultCopilotStyle(defaults);
      return groveData.create(newStyle);
    },
    [groveData]
  );

  // Duplicate style - creates as DRAFT with version reset (singleton pattern)
  const duplicate = useCallback(
    async (object: GroveObject<CopilotStylePayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<CopilotStylePayload> = {
        meta: {
          id: generateUUID(),
          type: 'copilot-style',
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
          styleId: `${object.payload.styleId}-copy-${Date.now()}`,
          version: 1, // Reset version for copies
          changelog: undefined,
          previousVersionId: undefined,
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  // Activate a style (singleton pattern: archives current active, sets target to active)
  const activate = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();

      // 0. Set optimistic state FIRST for immediate UI update
      const oldActiveId = activeStyle?.meta.id !== id ? activeStyle?.meta.id ?? null : null;
      setPendingActivation({ newActiveId: id, oldActiveId });

      try {
        // 1. Archive current active (if different from target)
        if (activeStyle && activeStyle.meta.id !== id) {
          await groveData.update(activeStyle.meta.id, [
            { op: 'replace', path: '/meta/status', value: 'archived' },
            { op: 'replace', path: '/meta/updatedAt', value: now },
          ]);
          console.log('[CopilotStyleData] Archived previous active:', activeStyle.meta.id);
        }

        // 2. Activate selected style
        await groveData.update(id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: now },
        ]);
        console.log('[CopilotStyleData] Activated:', id);

        // 3. Refetch to update UI state
        await groveData.refetch();
      } finally {
        // 4. Clear optimistic state after refetch completes (or on error)
        setPendingActivation(null);
      }
    },
    [activeStyle, groveData]
  );

  // Create a new version from existing style
  const createVersion = useCallback(
    async (sourceId: string, changelog?: string) => {
      const source = groveData.objects.find((s) => s.meta.id === sourceId);
      if (!source) {
        throw new Error(`Source style not found: ${sourceId}`);
      }

      const now = new Date().toISOString();
      const newVersion = (source.payload.version || 1) + 1;

      const versionedStyle: GroveObject<CopilotStylePayload> = {
        meta: {
          id: generateUUID(),
          type: 'copilot-style',
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

      return groveData.create(versionedStyle);
    },
    [groveData]
  );

  /**
   * Save changes to active style as a new version.
   * Creates new record with incremented version, archives old.
   * Only valid for styles with status: 'active'.
   * Sprint: singleton-pattern-v1
   */
  const saveAndActivate = useCallback(
    async (
      currentStyle: GroveObject<CopilotStylePayload>,
      pendingChanges: Partial<CopilotStylePayload>
    ): Promise<GroveObject<CopilotStylePayload>> => {
      // Validate: only active styles can use this flow
      if (currentStyle.meta.status !== 'active') {
        throw new Error('saveAndActivate only valid for active styles');
      }

      const now = new Date().toISOString();

      // Build new payload with version increment and provenance
      const newPayload: CopilotStylePayload = {
        ...currentStyle.payload,
        ...pendingChanges,
        version: (currentStyle.payload.version || 1) + 1,
        previousVersionId: currentStyle.meta.id,
      };

      // Build new object with fresh UUID
      const newStyle: GroveObject<CopilotStylePayload> = {
        meta: {
          ...currentStyle.meta,
          id: generateUUID(),
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        payload: newPayload,
      };

      console.log('[CopilotStyleData] Creating new version:', {
        oldId: currentStyle.meta.id,
        newId: newStyle.meta.id,
        version: newPayload.version,
      });

      // Step 1: Archive old record FIRST (to avoid unique constraint violation)
      await groveData.update(currentStyle.meta.id, [
        { op: 'replace', path: '/meta/status', value: 'archived' },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);
      console.log('[CopilotStyleData] Archived old version:', currentStyle.meta.id);

      // Step 2: Create new active record (now safe - no other active exists)
      let created: GroveObject<CopilotStylePayload>;
      try {
        created = await groveData.create(newStyle);
      } catch (createError) {
        // CRITICAL: Rollback - restore old style to active (never leave with no active)
        console.error('[CopilotStyleData] Create failed, rolling back archive:', createError);
        await groveData.update(currentStyle.meta.id, [
          { op: 'replace', path: '/meta/status', value: 'active' },
          { op: 'replace', path: '/meta/updatedAt', value: new Date().toISOString() },
        ]);
        console.log('[CopilotStyleData] Rollback complete - restored old version to active');
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
    activeStyle,
    draftStyles,
    archivedStyles,
    activate,
    createVersion,
    saveAndActivate,
    getStyleByPreset,
  };
}

export default useCopilotStyleData;
