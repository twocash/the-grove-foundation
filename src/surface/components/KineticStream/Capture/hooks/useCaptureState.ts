// src/surface/components/KineticStream/Capture/hooks/useCaptureState.ts
// Capture state management for kinetic sprout capture
// Sprint: kinetic-cultivation-v1

import { useState, useCallback } from 'react';
import { SelectionState } from './useTextSelection';

export interface CaptureState {
  isCapturing: boolean;
  selection: SelectionState | null;
}

export function useCaptureState() {
  const [state, setState] = useState<CaptureState>({
    isCapturing: false,
    selection: null,
  });

  const startCapture = useCallback((selection: SelectionState) => {
    setState({ isCapturing: true, selection });
  }, []);

  const cancelCapture = useCallback(() => {
    setState({ isCapturing: false, selection: null });
    window.getSelection()?.removeAllRanges();
  }, []);

  const completeCapture = useCallback(() => {
    setState({ isCapturing: false, selection: null });
    window.getSelection()?.removeAllRanges();
  }, []);

  return {
    state,
    startCapture,
    cancelCapture,
    completeCapture,
  };
}
