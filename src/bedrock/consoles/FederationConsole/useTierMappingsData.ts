// src/bedrock/consoles/FederationConsole/useTierMappingsData.ts
// Data hook for Tier Mapping objects
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - data hook follows established pattern

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { TierMappingPayload, MappingStatus } from '@core/schema/federation';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Tier Mapping GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultTierMapping(
  defaults?: Partial<TierMappingPayload>
): GroveObject<TierMappingPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'tier-mapping',
      title: 'New Tier Mapping',
      description: 'Maps tier systems between groves',
      icon: 'compare_arrows',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      sourceGroveId: '',
      targetGroveId: '',
      mappings: [],
      confidenceScore: 0.5,
      status: 'draft',
      createdAt: now,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface TierMappingsDataResult extends CollectionDataResult<TierMappingPayload> {
  /** Mappings by status */
  draftMappings: GroveObject<TierMappingPayload>[];
  proposedMappings: GroveObject<TierMappingPayload>[];
  acceptedMappings: GroveObject<TierMappingPayload>[];
  rejectedMappings: GroveObject<TierMappingPayload>[];
  /** Get mappings for a grove pair */
  getMappingsForGroves: (groveId1: string, groveId2: string) => GroveObject<TierMappingPayload>[];
  /** Get mappings by source grove */
  getMappingsBySourceGrove: (groveId: string) => GroveObject<TierMappingPayload>[];
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Tier Mappings in Federation Console
 *
 * Wraps useGroveData<TierMappingPayload>('tier-mapping') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - Grouped views by mapping status
 * - Lookup by grove pair
 */
export function useTierMappingsData(): TierMappingsDataResult {
  const groveData = useGroveData<TierMappingPayload>('tier-mapping');

  // Grouped by status
  const draftMappings = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'draft');
  }, [groveData.objects]);

  const proposedMappings = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'proposed');
  }, [groveData.objects]);

  const acceptedMappings = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'accepted');
  }, [groveData.objects]);

  const rejectedMappings = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'rejected');
  }, [groveData.objects]);

  // Get mappings for a grove pair (in either direction)
  const getMappingsForGroves = useCallback(
    (groveId1: string, groveId2: string) => {
      return groveData.objects.filter(
        (obj) =>
          (obj.payload.sourceGroveId === groveId1 && obj.payload.targetGroveId === groveId2) ||
          (obj.payload.sourceGroveId === groveId2 && obj.payload.targetGroveId === groveId1)
      );
    },
    [groveData.objects]
  );

  // Get mappings by source grove
  const getMappingsBySourceGrove = useCallback(
    (groveId: string) => {
      return groveData.objects.filter((obj) => obj.payload.sourceGroveId === groveId);
    },
    [groveData.objects]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<TierMappingPayload>) => {
      const newMapping = createDefaultTierMapping(defaults);
      return groveData.create(newMapping);
    },
    [groveData]
  );

  // Duplicate mapping
  const duplicate = useCallback(
    async (object: GroveObject<TierMappingPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<TierMappingPayload> = {
        meta: {
          id: generateUUID(),
          type: 'tier-mapping',
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
          status: 'draft',
          validatedAt: undefined,
          validatedBy: undefined,
          createdAt: now,
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
    draftMappings,
    proposedMappings,
    acceptedMappings,
    rejectedMappings,
    getMappingsForGroves,
    getMappingsBySourceGrove,
  };
}

export default useTierMappingsData;
