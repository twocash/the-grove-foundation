// hooks/useVersionedJourneys.ts
// Provides journeys merged with versioned overrides from IndexedDB

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNarrativeEngine } from './useNarrativeEngine';
import type { Journey } from '../data/narratives-schema';
import { getVersionedObjectStore, type StoredObject } from '../src/core/versioning';

/**
 * Extended journey with version metadata
 */
export interface VersionedJourney extends Journey {
  /** Version ordinal if modified from IndexedDB */
  versionOrdinal?: number;
  /** Whether this journey has local modifications */
  hasLocalModifications?: boolean;
}

/**
 * Hook that provides journeys merged with any versioned overrides from IndexedDB.
 *
 * This enables edits made in the JourneyInspector to be reflected in the JourneyList cards.
 *
 * Data flow:
 * 1. Load journeys from narrative schema (source of truth for structure)
 * 2. Check IndexedDB for versioned copies (local modifications)
 * 3. Merge versioned data over schema data
 * 4. Return unified list
 */
export function useVersionedJourneys() {
  const { schema, loading: schemaLoading } = useNarrativeEngine();

  // Get active journeys from schema
  const schemaJourneys = useMemo(() => {
    if (!schema?.journeys) return [];
    return Object.values(schema.journeys).filter(j => j.status === 'active');
  }, [schema]);

  const [versionedOverrides, setVersionedOverrides] = useState<Map<string, StoredObject>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load versioned overrides from IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function loadVersionedOverrides() {
      try {
        const store = await getVersionedObjectStore();
        const overrides = new Map<string, StoredObject>();

        // Check each journey for versioned copy
        for (const journey of schemaJourneys) {
          const stored = await store.get(journey.id);
          if (stored && stored.versionCount > 0) {
            overrides.set(journey.id, stored);
          }
        }

        if (!cancelled) {
          setVersionedOverrides(overrides);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load versioned journeys:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVersionedOverrides();

    return () => {
      cancelled = true;
    };
  }, [schemaJourneys, refreshKey]);

  // Merge schema journeys with versioned overrides
  const journeys: VersionedJourney[] = useMemo(() => {
    return schemaJourneys.map((schemaJourney) => {
      const versioned = versionedOverrides.get(schemaJourney.id);

      if (!versioned) {
        // No local modifications
        return schemaJourney;
      }

      // Merge versioned data over schema data
      const versionedMeta = versioned.current.meta;
      const versionedPayload = versioned.current.payload as Record<string, unknown>;

      return {
        ...schemaJourney,
        // Override display fields from versioned meta
        title: (versionedMeta.title as string) || schemaJourney.title,
        description: (versionedMeta.description as string) || schemaJourney.description,
        // Override payload fields
        targetAha: (versionedPayload.targetAha as string) || schemaJourney.targetAha,
        estimatedMinutes: (versionedPayload.estimatedMinutes as number) || schemaJourney.estimatedMinutes,
        // Version metadata
        versionOrdinal: versioned.versionCount,
        hasLocalModifications: true,
      };
    });
  }, [schemaJourneys, versionedOverrides]);

  // Force refresh of versioned data
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Get a single journey by ID (with versioned overrides applied)
  const getJourney = useCallback((journeyId: string): VersionedJourney | null => {
    return journeys.find(j => j.id === journeyId) ?? null;
  }, [journeys]);

  return {
    journeys,
    loading: schemaLoading || loading,
    refresh,
    getJourney,
    /** Check if a specific journey has local modifications */
    hasModifications: (journeyId: string) => versionedOverrides.has(journeyId),
  };
}
