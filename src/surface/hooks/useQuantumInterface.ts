// src/surface/hooks/useQuantumInterface.ts
// The Observer: Listens to lens changes, returns collapsed reality
// v0.14: Reality Projector - generative collapse for custom lenses

import { useState, useEffect, useCallback } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { LensReality, DEFAULT_REALITY, SUPERPOSITION_MAP } from '../../data/quantum-content';
import { realityCollapser } from '../../core/transformers';
import { ArchetypeId } from '../../../types/lens';

interface UseQuantumInterfaceReturn {
  reality: LensReality;
  activeLens: string | null;
  quantumTrigger: string | null;
  isCollapsing: boolean;
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session, getPersonaById } = useNarrativeEngine();
  const [reality, setReality] = useState<LensReality>(DEFAULT_REALITY);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [currentLensId, setCurrentLensId] = useState<string | null>(null);

  const resolveReality = useCallback(async (lensId: string | null) => {
    // No lens = default reality
    if (!lensId) {
      setReality(DEFAULT_REALITY);
      setIsCollapsing(false);
      return;
    }

    // Archetype = use pre-defined static content (instant)
    const archetypeReality = SUPERPOSITION_MAP[lensId as ArchetypeId];
    if (archetypeReality) {
      setReality(archetypeReality);
      setIsCollapsing(false);
      return;
    }

    // Custom lens = generate via LLM
    const persona = getPersonaById?.(lensId);
    if (!persona) {
      console.warn('[Quantum] Persona not found:', lensId);
      setReality(DEFAULT_REALITY);
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
      setReality(DEFAULT_REALITY);
    } finally {
      setIsCollapsing(false);
    }
  }, [getPersonaById]);

  // React to lens changes
  useEffect(() => {
    if (session.activeLens !== currentLensId) {
      setCurrentLensId(session.activeLens);
      resolveReality(session.activeLens);
    }
  }, [session.activeLens, currentLensId, resolveReality]);

  // Initial resolution on mount
  useEffect(() => {
    resolveReality(session.activeLens);
  }, []);

  return {
    reality,
    activeLens: session.activeLens,
    quantumTrigger: session.activeLens,
    isCollapsing
  };
};

export default useQuantumInterface;
