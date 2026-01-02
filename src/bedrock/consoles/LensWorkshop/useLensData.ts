// src/bedrock/consoles/LensWorkshop/useLensData.ts
// Data hook for Lens Workshop - wraps useGroveData for console factory compatibility
// Sprint: grove-data-layer-v1 (Epic 2)

import { useCallback } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import { createDefaultLens } from './lens-transforms';

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Lens Workshop
 *
 * Wraps useGroveData<LensPayload>('lens') to provide the CollectionDataResult
 * interface expected by the console factory pattern.
 *
 * Key adaptations:
 * - `create` accepts Partial<LensPayload> instead of full GroveObject
 * - `duplicate` is added for console factory compatibility
 * - `reset` is preserved for testing/development
 */
export function useLensData(): CollectionDataResult<LensPayload> & { reset: () => void } {
  const groveData = useGroveData<LensPayload>('lens');

  // Adapt create: console factory expects Partial<LensPayload>, not full GroveObject
  const create = useCallback(
    async (defaults?: Partial<LensPayload>) => {
      const newLens = createDefaultLens(defaults);
      return groveData.create(newLens);
    },
    [groveData]
  );

  // Adapt refetch: console factory expects () => void, not () => Promise<void>
  const refetch = useCallback(() => {
    groveData.refetch();
  }, [groveData]);

  // Duplicate: builds copy and creates via provider
  const duplicate = useCallback(
    async (object: GroveObject<LensPayload>) => {
      const duplicated: GroveObject<LensPayload> = {
        meta: {
          id: `lens-${Date.now()}`,
          type: 'lens',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        payload: {
          ...object.payload,
          arcEmphasis: { ...object.payload.arcEmphasis },
          entryPoints: [...object.payload.entryPoints],
          suggestedThread: [...object.payload.suggestedThread],
        },
      };
      return groveData.create(duplicated);
    },
    [groveData]
  );

  // Reset: clears storage and refetches (triggers defaults from provider)
  const reset = useCallback(() => {
    // Clear the lens storage key used by LocalStorageAdapter
    localStorage.removeItem('grove-data-lens-v1');
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
    reset,
  };
}

export default useLensData;
