// src/bedrock/consoles/LensWorkshop/useLensData.ts
// Data hook for Lens Workshop with real Persona data
// Migration: MIGRATION-001-lens

import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_PERSONAS } from '../../../../data/default-personas';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import { personaToLens, createDefaultLens } from './lens-transforms';

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'grove-bedrock-lenses-v2';

// =============================================================================
// Storage Helpers
// =============================================================================

function getDefaultLenses(): GroveObject<LensPayload>[] {
  // Transform DEFAULT_PERSONAS to GroveObject format
  return Object.values(DEFAULT_PERSONAS).map(personaToLens);
}

function loadFromStorage(): GroveObject<LensPayload>[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[useLensData] Failed to load from localStorage:', e);
  }
  return getDefaultLenses();
}

function saveToStorage(lenses: GroveObject<LensPayload>[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lenses));
  } catch (e) {
    console.warn('[useLensData] Failed to save to localStorage:', e);
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Lens Workshop
 * Loads real Persona data from DEFAULT_PERSONAS, persists to localStorage
 */
export function useLensData(): CollectionDataResult<LensPayload> & { reset: () => void } {
  const [lenses, setLenses] = useState<GroveObject<LensPayload>[]>(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist to localStorage whenever lenses change
  useEffect(() => {
    saveToStorage(lenses);
  }, [lenses]);

  const refetch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLenses(loadFromStorage());
      setLoading(false);
    }, 300);
  }, []);

  const create = useCallback(async (defaults?: Partial<LensPayload>) => {
    const newLens = createDefaultLens(defaults);
    setLenses((prev) => [...prev, newLens]);
    return newLens;
  }, []);

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    setLenses((prev) =>
      prev.map((lens) => {
        if (lens.meta.id !== id) return lens;

        // Deep clone to avoid mutation
        const updated: GroveObject<LensPayload> = {
          meta: { ...lens.meta, updatedAt: new Date().toISOString() },
          payload: {
            ...lens.payload,
            arcEmphasis: { ...lens.payload.arcEmphasis },
            entryPoints: [...lens.payload.entryPoints],
            suggestedThread: [...lens.payload.suggestedThread],
          },
        };

        // Apply patch operations
        for (const op of operations) {
          if (op.op === 'replace') {
            if (op.path.startsWith('/payload/arcEmphasis/')) {
              const field = op.path.replace('/payload/arcEmphasis/', '') as keyof typeof updated.payload.arcEmphasis;
              updated.payload.arcEmphasis[field] = op.value as 1 | 2 | 3 | 4;
            } else if (op.path.startsWith('/payload/')) {
              const field = op.path.replace('/payload/', '') as keyof LensPayload;
              (updated.payload as Record<string, unknown>)[field] = op.value;
            } else if (op.path.startsWith('/meta/')) {
              const field = op.path.replace('/meta/', '');
              (updated.meta as Record<string, unknown>)[field] = op.value;
            }
          }
        }

        return updated;
      })
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    setLenses((prev) => prev.filter((lens) => lens.meta.id !== id));
  }, []);

  const duplicate = useCallback(async (object: GroveObject<LensPayload>) => {
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
    setLenses((prev) => [...prev, duplicated]);
    return duplicated;
  }, []);

  // Reset to defaults (useful for testing)
  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLenses(getDefaultLenses());
  }, []);

  return {
    objects: lenses,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
    reset,
  };
}

export default useLensData;
