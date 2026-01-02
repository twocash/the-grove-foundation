// src/explore/hooks/useLensPickerData.ts
// Data hook for LensPicker - wraps useGroveData for unified data layer
// Sprint: grove-data-layer-v1 (Epic 3)

import { useMemo, useCallback } from 'react';
import { useGroveData } from '@core/data';
import { useCustomLens } from '../../../hooks/useCustomLens';
import type { GroveObject } from '@core/schema/grove-object';
import type { Persona } from '../../../data/narratives-schema';
import type { CustomLens } from '../../../types/lens';

/**
 * Result interface for useLensPickerData.
 * Matches the data interface expected by LensPicker.
 */
export interface UseLensPickerDataResult {
  /** Schema personas (enabled only) */
  personas: Persona[];
  /** User-created custom lenses */
  customLenses: CustomLens[];
  /** Loading state */
  loading: boolean;
  /** Refresh personas from data layer */
  refreshPersonas: () => void;
  /** Delete a custom lens */
  deleteCustomLens: (id: string) => Promise<void>;
}

/**
 * Transform GroveObject<Persona> back to Persona interface.
 * Inverse of personaToGroveObject in defaults.ts.
 */
function groveObjectToPersona(obj: GroveObject<Persona>): Persona {
  // The payload already contains the full Persona
  // We just ensure the enabled status is derived from meta.status
  return {
    ...obj.payload,
    id: obj.meta.id,
    publicLabel: obj.meta.title || obj.payload.publicLabel,
    description: obj.meta.description || obj.payload.description,
    icon: obj.meta.icon || obj.payload.icon,
    enabled: obj.meta.status === 'active',
  };
}

/**
 * Data hook for LensPicker.
 *
 * Wraps useGroveData<Persona>('lens') to provide the interface
 * expected by LensPicker, matching the previous useNarrativeEngine +
 * useVersionedCollection pattern.
 *
 * Key adaptations:
 * - Filters to enabled personas only (matching getEnabledPersonas)
 * - Transforms GroveObject<Persona> to Persona interface
 * - Custom lenses handled separately via useCustomLens (encrypted storage)
 */
export function useLensPickerData(): UseLensPickerDataResult {
  const groveData = useGroveData<Persona>('lens');
  const customLensHook = useCustomLens();

  // Transform and filter to enabled personas only
  const personas = useMemo(() => {
    return groveData.objects
      .map(groveObjectToPersona)
      .filter(persona => persona.enabled);
  }, [groveData.objects]);

  // Adapt refetch to sync signature
  const refreshPersonas = useCallback(() => {
    groveData.refetch();
  }, [groveData]);

  return {
    personas,
    customLenses: customLensHook.customLenses,
    loading: groveData.loading || customLensHook.isLoading,
    refreshPersonas,
    deleteCustomLens: customLensHook.deleteCustomLens,
  };
}

export default useLensPickerData;
