// src/bedrock/consoles/FederationConsole/useTrustRelationshipsData.ts
// Data hook for Trust Relationship objects
// Sprint: S9-SL-Federation v1
//
// DEX: Organic Scalability - data hook follows established pattern

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { TrustRelationshipPayload, TrustLevel, TrustComponents } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Trust Relationship GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultTrustRelationship(
  defaults?: Partial<TrustRelationshipPayload>
): GroveObject<TrustRelationshipPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: generateUUID(),
      type: 'trust-relationship',
      title: 'New Trust Relationship',
      description: 'Trust between two groves',
      icon: 'verified_user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      groveIds: ['', ''],
      level: 'new',
      overallScore: 0,
      components: {
        exchangeSuccess: 0,
        tierAccuracy: 0,
        responseTime: 0,
        contentQuality: 0,
      },
      exchangeCount: 0,
      successfulExchanges: 0,
      establishedAt: now,
      ...defaults,
    },
  };
}

// =============================================================================
// Trust Score Calculation
// =============================================================================

/**
 * Calculate overall trust score from component scores
 * Weights: Exchange Success (35%), Tier Accuracy (25%), Response Time (15%), Content Quality (25%)
 */
export function calculateTrustScore(components: TrustComponents): number {
  return Math.round(
    components.exchangeSuccess * 0.35 +
    components.tierAccuracy * 0.25 +
    components.responseTime * 0.15 +
    components.contentQuality * 0.25
  );
}

/**
 * Determine trust level from overall score
 */
export function determineTrustLevel(score: number): TrustLevel {
  if (score >= 75) return 'verified';
  if (score >= 50) return 'trusted';
  if (score >= 25) return 'established';
  return 'new';
}

// =============================================================================
// Extended Result Type
// =============================================================================

export interface TrustRelationshipsDataResult extends CollectionDataResult<TrustRelationshipPayload> {
  /** Relationships by trust level */
  verifiedRelationships: GroveObject<TrustRelationshipPayload>[];
  trustedRelationships: GroveObject<TrustRelationshipPayload>[];
  establishedRelationships: GroveObject<TrustRelationshipPayload>[];
  newRelationships: GroveObject<TrustRelationshipPayload>[];
  /** Get relationship for a grove pair */
  getRelationshipForGroves: (groveId1: string, groveId2: string) => GroveObject<TrustRelationshipPayload> | undefined;
  /** Get all relationships for a grove */
  getRelationshipsForGrove: (groveId: string) => GroveObject<TrustRelationshipPayload>[];
  /** Calculate average trust score across all relationships */
  averageTrustScore: number;
  /** Total successful exchanges across all relationships */
  totalSuccessfulExchanges: number;
  /** Recalculate and update trust scores for a relationship */
  recalculateTrust: (id: string, newComponents: TrustComponents) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Trust Relationships in Federation Console
 *
 * Wraps useGroveData<TrustRelationshipPayload>('trust-relationship') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - Grouped views by trust level
 * - Trust score calculations
 */
export function useTrustRelationshipsData(): TrustRelationshipsDataResult {
  const groveData = useGroveData<TrustRelationshipPayload>('trust-relationship');

  // Grouped by trust level
  const verifiedRelationships = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.level === 'verified');
  }, [groveData.objects]);

  const trustedRelationships = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.level === 'trusted');
  }, [groveData.objects]);

  const establishedRelationships = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.level === 'established');
  }, [groveData.objects]);

  const newRelationships = useMemo(() => {
    return groveData.objects.filter((obj) => obj.payload.level === 'new');
  }, [groveData.objects]);

  // Get relationship for a grove pair
  const getRelationshipForGroves = useCallback(
    (groveId1: string, groveId2: string) => {
      // Grove IDs are stored alphabetically sorted
      const [first, second] = [groveId1, groveId2].sort();
      return groveData.objects.find(
        (obj) => obj.payload.groveIds[0] === first && obj.payload.groveIds[1] === second
      );
    },
    [groveData.objects]
  );

  // Get all relationships for a grove
  const getRelationshipsForGrove = useCallback(
    (groveId: string) => {
      return groveData.objects.filter(
        (obj) => obj.payload.groveIds.includes(groveId)
      );
    },
    [groveData.objects]
  );

  // Calculate average trust score
  const averageTrustScore = useMemo(() => {
    if (groveData.objects.length === 0) return 0;
    const total = groveData.objects.reduce((sum, obj) => sum + obj.payload.overallScore, 0);
    return Math.round(total / groveData.objects.length);
  }, [groveData.objects]);

  // Total successful exchanges
  const totalSuccessfulExchanges = useMemo(() => {
    return groveData.objects.reduce((sum, obj) => sum + obj.payload.successfulExchanges, 0);
  }, [groveData.objects]);

  // Recalculate and update trust scores
  const recalculateTrust = useCallback(
    async (id: string, newComponents: TrustComponents) => {
      const now = new Date().toISOString();
      const overallScore = calculateTrustScore(newComponents);
      const level = determineTrustLevel(overallScore);

      await groveData.update(id, [
        { op: 'replace', path: '/payload/components', value: newComponents },
        { op: 'replace', path: '/payload/overallScore', value: overallScore },
        { op: 'replace', path: '/payload/level', value: level },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);
    },
    [groveData]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<TrustRelationshipPayload>) => {
      const newRelationship = createDefaultTrustRelationship(defaults);
      return groveData.create(newRelationship);
    },
    [groveData]
  );

  // Duplicate relationship
  const duplicate = useCallback(
    async (object: GroveObject<TrustRelationshipPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<TrustRelationshipPayload> = {
        meta: {
          id: generateUUID(),
          type: 'trust-relationship',
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
          level: 'new',
          overallScore: 0,
          components: {
            exchangeSuccess: 0,
            tierAccuracy: 0,
            responseTime: 0,
            contentQuality: 0,
          },
          exchangeCount: 0,
          successfulExchanges: 0,
          establishedAt: now,
          verifiedAt: undefined,
          verifiedBy: undefined,
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
    verifiedRelationships,
    trustedRelationships,
    establishedRelationships,
    newRelationships,
    getRelationshipForGroves,
    getRelationshipsForGrove,
    averageTrustScore,
    totalSuccessfulExchanges,
    recalculateTrust,
  };
}

export default useTrustRelationshipsData;
