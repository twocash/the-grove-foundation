// src/surface/hooks/useQuantumInterface.ts
// The Observer: Listens to lens changes, returns collapsed reality
// v0.13: The Quantum Interface

import { useState, useEffect } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { getReality, LensReality } from '../../data/quantum-content';

interface UseQuantumInterfaceReturn {
  reality: LensReality;
  activeLens: string | null;
  quantumTrigger: string | null;
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session } = useNarrativeEngine();
  const [reality, setReality] = useState<LensReality>(getReality(session.activeLens));
  const [targetLens, setTargetLens] = useState<string | null>(session.activeLens);

  // Sync with engine - update reality when lens changes
  useEffect(() => {
    if (session.activeLens !== targetLens) {
      setTargetLens(session.activeLens);
      const nextReality = getReality(session.activeLens);
      setReality(nextReality);
    }
  }, [session.activeLens, targetLens]);

  return {
    reality,
    activeLens: session.activeLens,
    // We pass the lens ID as the 'trigger' for animations
    quantumTrigger: session.activeLens
  };
};

export default useQuantumInterface;
