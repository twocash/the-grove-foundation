// hooks/useVersionedPersonas.ts
// Provides personas merged with versioned overrides from IndexedDB

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNarrativeEngine } from './useNarrativeEngine';
import type { Persona } from '../data/narratives-schema';
import { getVersionedObjectStore, type StoredObject } from '../src/core/versioning';

/**
 * Extended persona with version metadata
 */
export interface VersionedPersona extends Persona {
  /** Version ordinal if modified from IndexedDB */
  versionOrdinal?: number;
  /** Whether this persona has local modifications */
  hasLocalModifications?: boolean;
}

/**
 * Hook that provides personas merged with any versioned overrides from IndexedDB.
 *
 * This enables edits made in the LensInspector to be reflected in the LensPicker cards.
 *
 * Data flow:
 * 1. Load personas from narrative schema (source of truth for structure)
 * 2. Check IndexedDB for versioned copies (local modifications)
 * 3. Merge versioned data over schema data
 * 4. Return unified list
 */
export function useVersionedPersonas() {
  const { getEnabledPersonas } = useNarrativeEngine();
  const schemaPersonas = getEnabledPersonas();

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

        // Check each persona for versioned copy
        for (const persona of schemaPersonas) {
          const stored = await store.get(persona.id);
          if (stored && stored.versionCount > 0) {
            overrides.set(persona.id, stored);
          }
        }

        if (!cancelled) {
          setVersionedOverrides(overrides);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load versioned personas:', error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVersionedOverrides();

    return () => {
      cancelled = true;
    };
  }, [schemaPersonas, refreshKey]);

  // Merge schema personas with versioned overrides
  const personas: VersionedPersona[] = useMemo(() => {
    return schemaPersonas.map((schemaPersona) => {
      const versioned = versionedOverrides.get(schemaPersona.id);

      if (!versioned) {
        // No local modifications
        return schemaPersona;
      }

      // Merge versioned data over schema data
      const versionedMeta = versioned.current.meta;
      const versionedPayload = versioned.current.payload as Record<string, unknown>;

      return {
        ...schemaPersona,
        // Override display fields from versioned meta
        publicLabel: (versionedMeta.title as string) || schemaPersona.publicLabel,
        description: (versionedMeta.description as string) || schemaPersona.description,
        icon: (versionedMeta.icon as string) || schemaPersona.icon,
        // Override payload fields
        color: (versionedPayload.color as string) || schemaPersona.color,
        toneGuidance: (versionedPayload.toneGuidance as string) || schemaPersona.toneGuidance,
        narrativeStyle: (versionedPayload.narrativeStyle as string) || schemaPersona.narrativeStyle,
        // Version metadata
        versionOrdinal: versioned.versionCount,
        hasLocalModifications: true,
      };
    });
  }, [schemaPersonas, versionedOverrides]);

  // Force refresh of versioned data
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    personas,
    loading,
    refresh,
    /** Check if a specific persona has local modifications */
    hasModifications: (personaId: string) => versionedOverrides.has(personaId),
  };
}
