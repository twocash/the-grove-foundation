// src/bedrock/consoles/FederationConsole/useFederatedGrovesData.ts
// Data hook for Federated Grove objects
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - data hook follows established pattern from useLifecycleConfigData

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { FederatedGrovePayload, ConnectionStatus, TrustLevel } from '@core/schema/federation';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Federated Grove GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultFederatedGrove(
  defaults?: Partial<FederatedGrovePayload>
): GroveObject<FederatedGrovePayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'federated-grove',
      title: 'New Federated Grove',
      description: 'A grove community for knowledge exchange',
      icon: 'forest',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      groveId: '',
      name: '',
      description: '',
      endpoint: '',
      tierSystem: {
        name: 'Default',
        tiers: [
          { id: 'tier-1', name: 'Seedling', level: 1, icon: '🌱', color: '#94a3b8' },
          { id: 'tier-2', name: 'Sprout', level: 2, icon: '🌿', color: '#4ade80' },
          { id: 'tier-3', name: 'Sapling', level: 3, icon: '🌳', color: '#22c55e' },
        ],
      },
      capabilities: ['exchange', 'query'],
      status: 'active',
      connectionStatus: 'none',
      trustLevel: 'new',
      trustScore: 0,
      sproutCount: 0,
      exchangeCount: 0,
      registeredAt: now,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface FederatedGrovesDataResult extends CollectionDataResult<FederatedGrovePayload> {
  /** Groves by connection status */
  connectedGroves: GroveObject<FederatedGrovePayload>[];
  pendingGroves: GroveObject<FederatedGrovePayload>[];
  failedGroves: GroveObject<FederatedGrovePayload>[];
  /** Groves by trust level */
  grovesByTrust: (level: TrustLevel) => GroveObject<FederatedGrovePayload>[];
  /** Get grove by grove ID */
  getByGroveId: (groveId: string) => GroveObject<FederatedGrovePayload> | undefined;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Federated Groves in Federation Console
 *
 * Wraps useGroveData<FederatedGrovePayload>('federated-grove') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - Grouped views by connection status and trust level
 * - Lookup by grove ID
 */
export function useFederatedGrovesData(): FederatedGrovesDataResult {
  const groveData = useGroveData<FederatedGrovePayload>('federated-grove');

  // Grouped by connection status
  const connectedGroves = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.connectionStatus === 'connected');
  }, [groveData.objects]);

  const pendingGroves = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.connectionStatus === 'pending');
  }, [groveData.objects]);

  const failedGroves = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.connectionStatus === 'failed');
  }, [groveData.objects]);

  // Filter by trust level
  const grovesByTrust = useCallback(
    (level: TrustLevel) => {
      return groveData.objects.filter((obj) => obj.payload.trustLevel === level);
    },
    [groveData.objects]
  );

  // Lookup by grove ID
  const getByGroveId = useCallback(
    (groveId: string) => {
      return groveData.objects.find((obj) => obj.payload.groveId === groveId);
    },
    [groveData.objects]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<FederatedGrovePayload>) => {
      const newGrove = createDefaultFederatedGrove(defaults);
      return groveData.create(newGrove);
    },
    [groveData]
  );

  // Duplicate grove
  const duplicate = useCallback(
    async (object: GroveObject<FederatedGrovePayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<FederatedGrovePayload> = {
        meta: {
          id: generateUUID(),
          type: 'federated-grove',
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
          groveId: `${object.payload.groveId}-copy`,
          connectionStatus: 'none',
          trustLevel: 'new',
          trustScore: 0,
          exchangeCount: 0,
          registeredAt: now,
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
    connectedGroves,
    pendingGroves,
    failedGroves,
    grovesByTrust,
    getByGroveId,
  };
}

export default useFederatedGrovesData;
