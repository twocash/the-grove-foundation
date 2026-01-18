// src/bedrock/consoles/FederationConsole/useFederationExchangesData.ts
// Data hook for Federation Exchange objects
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - data hook follows established pattern

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type {
  FederationExchangePayload,
  ExchangeType,
  ExchangeStatus,
  ExchangeContentType,
} from '@core/schema/federation';
import { CONTENT_TYPE_CONFIG } from './FederationConsole.config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Federation Exchange GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultFederationExchange(
  defaults?: Partial<FederationExchangePayload>
): GroveObject<FederationExchangePayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'federation-exchange',
      title: 'New Exchange',
      description: 'Knowledge exchange between groves',
      icon: 'swap_horiz',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      type: 'request',
      requestingGroveId: '',
      providingGroveId: '',
      contentType: 'sprout',
      status: 'pending',
      initiatedAt: now,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface FederationExchangesDataResult extends CollectionDataResult<FederationExchangePayload> {
  /** Exchanges by type */
  requests: GroveObject<FederationExchangePayload>[];
  offers: GroveObject<FederationExchangePayload>[];
  /** Exchanges by status */
  pendingExchanges: GroveObject<FederationExchangePayload>[];
  activeExchanges: GroveObject<FederationExchangePayload>[];
  completedExchanges: GroveObject<FederationExchangePayload>[];
  failedExchanges: GroveObject<FederationExchangePayload>[];
  /** Get exchanges for a grove */
  getExchangesForGrove: (groveId: string) => GroveObject<FederationExchangePayload>[];
  /** Calculate total tokens exchanged */
  totalTokensExchanged: number;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Federation Exchanges in Federation Console
 *
 * Wraps useGroveData<FederationExchangePayload>('federation-exchange') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - Grouped views by type and status
 * - Token calculations
 */
export function useFederationExchangesData(): FederationExchangesDataResult {
  const groveData = useGroveData<FederationExchangePayload>('federation-exchange');

  // Grouped by type
  const requests = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.type === 'request');
  }, [groveData.objects]);

  const offers = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.type === 'offer');
  }, [groveData.objects]);

  // Grouped by status
  const pendingExchanges = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'pending');
  }, [groveData.objects]);

  const activeExchanges = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'active');
  }, [groveData.objects]);

  const completedExchanges = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'completed');
  }, [groveData.objects]);

  const failedExchanges = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.status === 'failed');
  }, [groveData.objects]);

  // Get exchanges for a grove (as requester or provider)
  const getExchangesForGrove = useCallback(
    (groveId: string) => {
      return groveData.objects.filter(
        (obj) =>
          obj.payload.requestingGroveId === groveId || obj.payload.providingGroveId === groveId
      );
    },
    [groveData.objects]
  );

  // Calculate total tokens exchanged
  const totalTokensExchanged = useMemo(() => {
    return completedExchanges.reduce((sum, obj) => {
      if (obj.payload.tokenValue) {
        return sum + obj.payload.tokenValue;
      }
      // Use base value from content type if no explicit value
      const config = CONTENT_TYPE_CONFIG[obj.payload.contentType];
      return sum + (config?.tokens || 0);
    }, 0);
  }, [completedExchanges]);

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<FederationExchangePayload>) => {
      const newExchange = createDefaultFederationExchange(defaults);
      return groveData.create(newExchange);
    },
    [groveData]
  );

  // Duplicate exchange
  const duplicate = useCallback(
    async (object: GroveObject<FederationExchangePayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<FederationExchangePayload> = {
        meta: {
          id: generateUUID(),
          type: 'federation-exchange',
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
          status: 'pending',
          initiatedAt: now,
          completedAt: undefined,
          tokenValue: undefined,
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
    requests,
    offers,
    pendingExchanges,
    activeExchanges,
    completedExchanges,
    failedExchanges,
    getExchangesForGrove,
    totalTokensExchanged,
  };
}

export default useFederationExchangesData;
