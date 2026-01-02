// src/explore/hooks/useJourneyListData.ts
// Data hook for JourneyList - wraps useGroveData for unified data layer
// Sprint: grove-data-layer-v1 (Epic 3)

import { useMemo, useCallback } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { Journey } from '../../../data/narratives-schema';

/**
 * Versioned journey type with metadata.
 * Matches the type expected by JourneyList.
 */
export type VersionedJourney = Journey & {
  versionOrdinal?: number;
  hasLocalModifications?: boolean;
};

/**
 * Result interface for useJourneyListData.
 * Matches the data interface expected by JourneyList.
 */
export interface UseJourneyListDataResult {
  /** All active journeys */
  journeys: VersionedJourney[];
  /** Loading state */
  loading: boolean;
  /** Refresh journeys from data layer */
  refreshJourneys: () => void;
  /** Get a journey by ID */
  getJourney: (id: string) => VersionedJourney | null;
}

/**
 * Transform GroveObject<Journey> back to Journey interface.
 */
function groveObjectToJourney(obj: GroveObject<Journey>): VersionedJourney {
  // The payload already contains the full Journey
  return {
    ...obj.payload,
    id: obj.meta.id,
    title: obj.meta.title || obj.payload.title,
    description: obj.meta.description || obj.payload.description,
    status: obj.meta.status as Journey['status'] || obj.payload.status,
  };
}

/**
 * Data hook for JourneyList.
 *
 * Wraps useGroveData<Journey>('journey') to provide the interface
 * expected by JourneyList, matching the previous useNarrativeEngine +
 * useVersionedCollection pattern.
 *
 * Key adaptations:
 * - Filters to active journeys only (matching original filter)
 * - Transforms GroveObject<Journey> to Journey interface
 */
export function useJourneyListData(): UseJourneyListDataResult {
  const groveData = useGroveData<Journey>('journey');

  // Transform and filter to active journeys only
  const journeys = useMemo(() => {
    return groveData.objects
      .map(groveObjectToJourney)
      .filter(journey => journey.status === 'active');
  }, [groveData.objects]);

  // Adapt refetch to sync signature
  const refreshJourneys = useCallback(() => {
    groveData.refetch();
  }, [groveData]);

  // Get a journey by ID
  const getJourney = useCallback(
    (id: string): VersionedJourney | null => {
      return journeys.find(j => j.id === id) ?? null;
    },
    [journeys]
  );

  return {
    journeys,
    loading: groveData.loading,
    refreshJourneys,
    getJourney,
  };
}

export default useJourneyListData;
