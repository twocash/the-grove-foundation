// src/bedrock/consoles/FederationConsole/useFederationData.ts
// Unified Federation Data Hook
// Dynamically composes data from all registered federation types
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - new types discovered automatically from registry

import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type {
  FederatedGrovePayload,
  TierMappingPayload,
  FederationExchangePayload,
  TrustRelationshipPayload,
} from '@core/schema/federation';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '@core/data/grove-data-provider';
import { useFederatedGrovesData } from './useFederatedGrovesData';
import { useTierMappingsData } from './useTierMappingsData';
import { useFederationExchangesData } from './useFederationExchangesData';
import { useTrustRelationshipsData } from './useTrustRelationshipsData';
import { FEDERATION_TYPE_REGISTRY } from '../../types/federation.types';

// =============================================================================
// Union Type for All Federation Payloads
// =============================================================================

/**
 * Union type of all federation payloads
 */
export type UnifiedFederationPayload =
  | FederatedGrovePayload
  | TierMappingPayload
  | FederationExchangePayload
  | TrustRelationshipPayload;

// =============================================================================
// Extended Result Type
// =============================================================================

export interface UnifiedFederationDataResult extends CollectionDataResult<UnifiedFederationPayload> {
  /**
   * Create an object of a specific type
   * @param type - The federation type to create
   * @param defaults - Optional payload defaults
   */
  createTyped: (type: string, defaults?: Partial<UnifiedFederationPayload>) => Promise<GroveObject<UnifiedFederationPayload>>;

  // Extended data from individual hooks
  /** Federated groves data */
  groves: {
    connected: GroveObject<FederatedGrovePayload>[];
    pending: GroveObject<FederatedGrovePayload>[];
    failed: GroveObject<FederatedGrovePayload>[];
  };
  /** Tier mappings data */
  tierMappings: {
    accepted: GroveObject<TierMappingPayload>[];
    pending: GroveObject<TierMappingPayload>[];
  };
  /** Exchange data */
  exchanges: {
    requests: GroveObject<FederationExchangePayload>[];
    offers: GroveObject<FederationExchangePayload>[];
    active: GroveObject<FederationExchangePayload>[];
    completed: GroveObject<FederationExchangePayload>[];
    totalTokens: number;
  };
  /** Trust relationships data */
  trust: {
    verified: GroveObject<TrustRelationshipPayload>[];
    trusted: GroveObject<TrustRelationshipPayload>[];
    averageScore: number;
    totalExchanges: number;
  };
}

// =============================================================================
// Unified Data Hook
// =============================================================================

/**
 * Unified data hook that composes all registered federation type hooks
 *
 * Architecture:
 * - Calls each registered type's hook explicitly (React hooks constraint)
 * - Merges results into unified collection
 * - Routes mutations to appropriate underlying hook based on object type
 * - Maintains type discrimination for proper CRUD operations
 *
 * @returns CollectionDataResult with objects from all registered types
 */
export function useFederationData(): UnifiedFederationDataResult {
  // =========================================================================
  // Explicit hook calls - update when adding new types
  // =========================================================================
  const grovesData = useFederatedGrovesData();
  const tierMappingsData = useTierMappingsData();
  const exchangesData = useFederationExchangesData();
  const trustData = useTrustRelationshipsData();

  // =========================================================================
  // Merge objects from all sources
  // =========================================================================
  const objects = useMemo(() => {
    return [
      ...grovesData.objects,
      ...tierMappingsData.objects,
      ...exchangesData.objects,
      ...trustData.objects,
    ] as GroveObject<UnifiedFederationPayload>[];
  }, [
    grovesData.objects,
    tierMappingsData.objects,
    exchangesData.objects,
    trustData.objects,
  ]);

  // =========================================================================
  // Aggregate loading state (any hook loading = unified loading)
  // =========================================================================
  const loading =
    grovesData.loading ||
    tierMappingsData.loading ||
    exchangesData.loading ||
    trustData.loading;

  // =========================================================================
  // Aggregate errors (first error wins)
  // =========================================================================
  const error =
    grovesData.error ||
    tierMappingsData.error ||
    exchangesData.error ||
    trustData.error;

  // =========================================================================
  // Refetch all data sources
  // =========================================================================
  const refetch = useCallback(() => {
    grovesData.refetch();
    tierMappingsData.refetch();
    exchangesData.refetch();
    trustData.refetch();
  }, [
    grovesData.refetch,
    tierMappingsData.refetch,
    exchangesData.refetch,
    trustData.refetch,
  ]);

  // =========================================================================
  // Route create to appropriate hook based on type
  // =========================================================================
  const createTyped = useCallback(
    async (
      type: string,
      defaults?: Partial<UnifiedFederationPayload>
    ): Promise<GroveObject<UnifiedFederationPayload>> => {
      switch (type) {
        case 'federated-grove':
          return grovesData.create(defaults as Partial<FederatedGrovePayload>) as Promise<
            GroveObject<UnifiedFederationPayload>
          >;
        case 'tier-mapping':
          return tierMappingsData.create(defaults as Partial<TierMappingPayload>) as Promise<
            GroveObject<UnifiedFederationPayload>
          >;
        case 'federation-exchange':
          return exchangesData.create(defaults as Partial<FederationExchangePayload>) as Promise<
            GroveObject<UnifiedFederationPayload>
          >;
        case 'trust-relationship':
          return trustData.create(defaults as Partial<TrustRelationshipPayload>) as Promise<
            GroveObject<UnifiedFederationPayload>
          >;
        default:
          throw new Error(`Unknown federation type: ${type}`);
      }
    },
    [grovesData.create, tierMappingsData.create, exchangesData.create, trustData.create]
  );

  // Legacy create (defaults to federated-grove)
  const create = useCallback(
    async (defaults?: Partial<UnifiedFederationPayload>): Promise<GroveObject<UnifiedFederationPayload>> => {
      return createTyped('federated-grove', defaults);
    },
    [createTyped]
  );

  // =========================================================================
  // Route update to appropriate hook based on object type
  // =========================================================================
  const update = useCallback(
    async (id: string, operations: PatchOperation[]) => {
      const obj = objects.find((o) => o.meta.id === id);
      if (!obj) {
        throw new Error(`Object not found: ${id}`);
      }

      switch (obj.meta.type) {
        case 'federated-grove':
          return grovesData.update(id, operations);
        case 'tier-mapping':
          return tierMappingsData.update(id, operations);
        case 'federation-exchange':
          return exchangesData.update(id, operations);
        case 'trust-relationship':
          return trustData.update(id, operations);
        default:
          throw new Error(`Unknown federation type: ${obj.meta.type}`);
      }
    },
    [objects, grovesData.update, tierMappingsData.update, exchangesData.update, trustData.update]
  );

  // =========================================================================
  // Route remove to appropriate hook based on object type
  // =========================================================================
  const remove = useCallback(
    async (id: string) => {
      const obj = objects.find((o) => o.meta.id === id);
      if (!obj) {
        throw new Error(`Object not found: ${id}`);
      }

      switch (obj.meta.type) {
        case 'federated-grove':
          return grovesData.remove(id);
        case 'tier-mapping':
          return tierMappingsData.remove(id);
        case 'federation-exchange':
          return exchangesData.remove(id);
        case 'trust-relationship':
          return trustData.remove(id);
        default:
          throw new Error(`Unknown federation type: ${obj.meta.type}`);
      }
    },
    [objects, grovesData.remove, tierMappingsData.remove, exchangesData.remove, trustData.remove]
  );

  // =========================================================================
  // Route duplicate to appropriate hook based on object type
  // =========================================================================
  const duplicate = useCallback(
    async (
      object: GroveObject<UnifiedFederationPayload>,
      overrides?: Record<string, unknown>
    ): Promise<GroveObject<UnifiedFederationPayload>> => {
      let result: GroveObject<UnifiedFederationPayload>;

      switch (object.meta.type) {
        case 'federated-grove':
          result = await grovesData.duplicate(object as GroveObject<FederatedGrovePayload>) as GroveObject<UnifiedFederationPayload>;
          break;
        case 'tier-mapping':
          result = await tierMappingsData.duplicate(object as GroveObject<TierMappingPayload>) as GroveObject<UnifiedFederationPayload>;
          break;
        case 'federation-exchange':
          result = await exchangesData.duplicate(object as GroveObject<FederationExchangePayload>) as GroveObject<UnifiedFederationPayload>;
          break;
        case 'trust-relationship':
          result = await trustData.duplicate(object as GroveObject<TrustRelationshipPayload>) as GroveObject<UnifiedFederationPayload>;
          break;
        default:
          throw new Error(`Unknown federation type: ${object.meta.type}`);
      }

      // Apply overrides if provided
      if (overrides) {
        for (const [path, value] of Object.entries(overrides)) {
          const parts = path.split('.');
          let current: Record<string, unknown> = result as unknown as Record<string, unknown>;
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
      }

      return result;
    },
    [
      grovesData.duplicate,
      tierMappingsData.duplicate,
      exchangesData.duplicate,
      trustData.duplicate,
    ]
  );

  // =========================================================================
  // Return unified result with extended data
  // =========================================================================
  return {
    objects,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
    createTyped,

    // Extended data from individual hooks
    groves: {
      connected: grovesData.connectedGroves,
      pending: grovesData.pendingGroves,
      failed: grovesData.failedGroves,
    },
    tierMappings: {
      accepted: tierMappingsData.acceptedMappings,
      pending: [...tierMappingsData.draftMappings, ...tierMappingsData.proposedMappings],
    },
    exchanges: {
      requests: exchangesData.requests,
      offers: exchangesData.offers,
      active: exchangesData.activeExchanges,
      completed: exchangesData.completedExchanges,
      totalTokens: exchangesData.totalTokensExchanged,
    },
    trust: {
      verified: trustData.verifiedRelationships,
      trusted: trustData.trustedRelationships,
      averageScore: trustData.averageTrustScore,
      totalExchanges: trustData.totalSuccessfulExchanges,
    },
  };
}

export default useFederationData;
