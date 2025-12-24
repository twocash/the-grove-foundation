// src/surface/hooks/useQuantumInterface.ts
// The Observer: Listens to lens changes, returns collapsed reality
// v0.14: Reality Projector - generative collapse for custom lenses
// v0.14+: Uses schema.lensRealities (GCS-backed) with SUPERPOSITION_MAP as fallback

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { LensReality, DEFAULT_REALITY, SUPERPOSITION_MAP } from '../../data/quantum-content';
import { realityCollapser } from '../../core/transformers';
import { ArchetypeId } from '../../../types/lens';
import { useEngagement, useLensState } from '@core/engagement';

interface UseQuantumInterfaceReturn {
  reality: LensReality;
  activeLens: string | null;
  quantumTrigger: string | null;
  isCollapsing: boolean;
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { schema, getPersonaById } = useNarrativeEngine();

  // Get lens from engagement state machine (Epic 7: migrated from session.activeLens)
  const { actor } = useEngagement();
  const { lens: activeLensFromMachine } = useLensState({ actor });

  const [reality, setReality] = useState<LensReality>(DEFAULT_REALITY);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [currentLensId, setCurrentLensId] = useState<string | null>(null);

  // Compute effective realities: schema takes precedence, fallback to hardcoded
  const effectiveRealities = useMemo(() => {
    const schemaRealities = schema?.lensRealities || {};
    // Merge: schema values override hardcoded SUPERPOSITION_MAP
    return { ...SUPERPOSITION_MAP, ...schemaRealities };
  }, [schema?.lensRealities]);

  // Compute effective default reality
  const effectiveDefaultReality = useMemo(() => {
    return schema?.defaultReality || DEFAULT_REALITY;
  }, [schema?.defaultReality]);

  const resolveReality = useCallback(async (lensId: string | null) => {
    // No lens = default reality
    if (!lensId) {
      setReality(effectiveDefaultReality);
      setIsCollapsing(false);
      return;
    }

    // Check for pre-defined reality (schema or hardcoded fallback)
    const predefinedReality = effectiveRealities[lensId as ArchetypeId];
    if (predefinedReality) {
      console.log('[Quantum] Using predefined reality for:', lensId, schema?.lensRealities?.[lensId] ? '(from schema)' : '(from fallback)');
      setReality(predefinedReality);
      setIsCollapsing(false);
      return;
    }

    // Custom lens = generate via LLM
    const persona = getPersonaById?.(lensId);
    if (!persona) {
      console.warn('[Quantum] Persona not found:', lensId);
      setReality(effectiveDefaultReality);
      setIsCollapsing(false);
      return;
    }

    // Start generation
    setIsCollapsing(true);
    try {
      const result = await realityCollapser.collapse(persona);
      console.log('[Quantum] Reality collapsed:', result.fromCache ? 'cached' : `${result.generationTimeMs}ms`);
      setReality(result.reality);
    } catch (error) {
      console.error('[Quantum] Collapse failed:', error);
      setReality(effectiveDefaultReality);
    } finally {
      setIsCollapsing(false);
    }
  }, [getPersonaById, effectiveRealities, effectiveDefaultReality, schema?.lensRealities]);

  // React to lens changes (Epic 7: now uses engagement state machine)
  useEffect(() => {
    if (activeLensFromMachine !== currentLensId) {
      setCurrentLensId(activeLensFromMachine);
      resolveReality(activeLensFromMachine);
    }
  }, [activeLensFromMachine, currentLensId, resolveReality]);

  // Initial resolution on mount
  useEffect(() => {
    resolveReality(activeLensFromMachine);
  }, []);

  return {
    reality,
    activeLens: activeLensFromMachine,
    quantumTrigger: activeLensFromMachine,
    isCollapsing
  };
};

export default useQuantumInterface;
