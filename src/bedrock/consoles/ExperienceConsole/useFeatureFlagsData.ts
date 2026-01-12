// src/bedrock/consoles/ExperienceConsole/useFeatureFlagsData.ts
// Data hook for Feature Flags - wraps useGroveData for console factory compatibility
// Sprint: feature-flags-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { FeatureFlagPayload, FeatureFlagCategory } from '@core/schema/feature-flag';
import { createFeatureFlagPayload, addAvailabilityChange } from '@core/schema/feature-flag';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default FeatureFlag GroveObject
 * @param defaults - Optional payload defaults (must include flagId)
 */
export function createDefaultFeatureFlag(
  defaults?: Partial<FeatureFlagPayload> & { flagId: string }
): GroveObject<FeatureFlagPayload> {
  const now = new Date().toISOString();
  const flagId = defaults?.flagId ?? `flag-${Date.now()}`;

  return {
    meta: {
      id: generateUUID(),
      type: 'feature-flag',
      title: defaults?.headerLabel ?? flagId,
      description: '',
      icon: 'toggle_on',
      status: 'active', // Flags are active by default (Instance pattern)
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: createFeatureFlagPayload(flagId, defaults),
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with feature flag specific helpers
 */
export interface FeatureFlagsDataResult extends CollectionDataResult<FeatureFlagPayload> {
  /** Flags visible in Explore header, sorted by headerOrder */
  headerFlags: GroveObject<FeatureFlagPayload>[];
  /** Flags by category */
  flagsByCategory: Record<FeatureFlagCategory, GroveObject<FeatureFlagPayload>[]>;
  /** Find flag by flagId */
  getFlagByFlagId: (flagId: string) => GroveObject<FeatureFlagPayload> | undefined;
  /** Toggle availability with changelog entry */
  toggleAvailability: (id: string, reason?: string) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Feature Flags in Experience Console
 *
 * Wraps useGroveData<FeatureFlagPayload>('feature-flag') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `headerFlags`: Flags to show in Explore header, sorted
 * - `flagsByCategory`: Flags grouped by category
 * - `getFlagByFlagId(flagId)`: Find by immutable flagId
 * - `toggleAvailability(id, reason)`: Toggle with changelog entry
 */
export function useFeatureFlagsData(): FeatureFlagsDataResult {
  const groveData = useGroveData<FeatureFlagPayload>('feature-flag');

  // Computed: Flags visible in Explore header, sorted by headerOrder
  const headerFlags = useMemo(() => {
    return groveData.objects
      .filter(
        (flag) =>
          flag.payload.showInExploreHeader &&
          flag.payload.available &&
          flag.meta.status === 'active'
      )
      .sort((a, b) => a.payload.headerOrder - b.payload.headerOrder);
  }, [groveData.objects]);

  // Computed: Flags grouped by category
  const flagsByCategory = useMemo(() => {
    const categories: Record<FeatureFlagCategory, GroveObject<FeatureFlagPayload>[]> = {
      experience: [],
      research: [],
      experimental: [],
      internal: [],
    };

    for (const flag of groveData.objects) {
      if (flag.meta.status === 'active') {
        categories[flag.payload.category].push(flag);
      }
    }

    return categories;
  }, [groveData.objects]);

  // Find flag by immutable flagId
  const getFlagByFlagId = useCallback(
    (flagId: string) => {
      return groveData.objects.find((flag) => flag.payload.flagId === flagId);
    },
    [groveData.objects]
  );

  // Create with defaults - requires flagId
  const create = useCallback(
    async (defaults?: Partial<FeatureFlagPayload>) => {
      // Generate a unique flagId if not provided
      const flagId = defaults?.flagId ?? `flag-${Date.now()}`;
      const newFlag = createDefaultFeatureFlag({
        ...defaults,
        flagId,
      });
      return groveData.create(newFlag);
    },
    [groveData]
  );

  // Toggle availability with changelog entry
  const toggleAvailability = useCallback(
    async (id: string, reason?: string) => {
      const flag = groveData.objects.find((f) => f.meta.id === id);
      if (!flag) {
        throw new Error(`Flag not found: ${id}`);
      }

      const now = new Date().toISOString();
      const updatedPayload = addAvailabilityChange(flag.payload, !flag.payload.available, reason);

      await groveData.update(id, [
        { op: 'replace', path: '/payload/available', value: updatedPayload.available },
        { op: 'replace', path: '/payload/changelog', value: updatedPayload.changelog },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Duplicate flag
  const duplicate = useCallback(
    async (object: GroveObject<FeatureFlagPayload>) => {
      const now = new Date().toISOString();
      // Generate new unique flagId for duplicate
      const newFlagId = `${object.payload.flagId}-copy-${Date.now()}`;

      const duplicated: GroveObject<FeatureFlagPayload> = {
        meta: {
          id: generateUUID(),
          type: 'feature-flag',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          flagId: newFlagId, // Must be unique
          changelog: [], // Reset changelog for copy
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
    headerFlags,
    flagsByCategory,
    getFlagByFlagId,
    toggleAvailability,
  };
}

export default useFeatureFlagsData;
