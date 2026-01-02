// src/explore/hooks/useCaptureFlow.ts
// React hook for capture flow state machine
// Sprint: bedrock-foundation-v1

import { useMemo, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import {
  captureFlowMachine,
  type SproutType,
  type CaptureFlowContext,
  type CaptureFlowState,
} from '../machines/captureFlow.machine';
import {
  getManifest,
  validateDraft,
  getDefaultValues,
  type SproutManifest,
} from '../../bedrock/config/sprout-manifests';

// =============================================================================
// Types
// =============================================================================

export interface CaptureFlowHook {
  // State
  state: CaptureFlowState;
  context: CaptureFlowContext;
  isOpen: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;

  // Current manifest
  manifest: SproutManifest | null;

  // Validation
  validation: {
    valid: boolean;
    errors: Record<string, string>;
  };

  // Actions
  openCapture: () => void;
  selectType: (type: SproutType) => void;
  updateField: (field: string, value: unknown) => void;
  submit: () => void;
  cancel: () => void;
  reset: () => void;
  captureAnother: () => void;
  retry: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useCaptureFlow(): CaptureFlowHook {
  const [snapshot, send] = useMachine(captureFlowMachine);

  // Derive state string
  const state = useMemo((): CaptureFlowState => {
    if (snapshot.matches('browsing')) return 'browsing';
    if (snapshot.matches('selectingType')) return 'selectingType';
    if (snapshot.matches('editingManifest')) return 'editingManifest';
    if (snapshot.matches('submitting')) return 'submitting';
    if (snapshot.matches('success')) return 'success';
    if (snapshot.matches('error')) return 'error';
    return 'browsing';
  }, [snapshot]);

  // Get current manifest
  const manifest = useMemo((): SproutManifest | null => {
    if (!snapshot.context.sproutType) return null;
    return getManifest(snapshot.context.sproutType);
  }, [snapshot.context.sproutType]);

  // Validate current draft
  const validation = useMemo(() => {
    if (!snapshot.context.sproutType) {
      return { valid: false, errors: {} };
    }
    return validateDraft(snapshot.context.sproutType, snapshot.context.draft);
  }, [snapshot.context.sproutType, snapshot.context.draft]);

  // Actions
  const openCapture = useCallback(() => {
    send({ type: 'OPEN_CAPTURE' });
  }, [send]);

  const selectType = useCallback((type: SproutType) => {
    send({ type: 'SELECT_TYPE', sproutType: type });
  }, [send]);

  const updateField = useCallback((field: string, value: unknown) => {
    send({ type: 'UPDATE_DRAFT', field, value });
  }, [send]);

  const submit = useCallback(() => {
    send({ type: 'SUBMIT' });
  }, [send]);

  const cancel = useCallback(() => {
    send({ type: 'CANCEL' });
  }, [send]);

  const reset = useCallback(() => {
    send({ type: 'RESET' });
  }, [send]);

  const captureAnother = useCallback(() => {
    send({ type: 'CAPTURE_ANOTHER' });
  }, [send]);

  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  return {
    // State
    state,
    context: snapshot.context,
    isOpen: state !== 'browsing',
    isSubmitting: state === 'submitting',
    isSuccess: state === 'success',
    isError: state === 'error',

    // Manifest
    manifest,

    // Validation
    validation,

    // Actions
    openCapture,
    selectType,
    updateField,
    submit,
    cancel,
    reset,
    captureAnother,
    retry,
  };
}

// =============================================================================
// Context Hook (for deep components)
// =============================================================================

import { createContext, useContext, type ReactNode } from 'react';

const CaptureFlowContext = createContext<CaptureFlowHook | null>(null);

export function CaptureFlowProvider({ children }: { children: ReactNode }) {
  const captureFlow = useCaptureFlow();
  return (
    <CaptureFlowContext.Provider value={captureFlow}>
      {children}
    </CaptureFlowContext.Provider>
  );
}

export function useCaptureFlowContext(): CaptureFlowHook {
  const context = useContext(CaptureFlowContext);
  if (!context) {
    throw new Error('useCaptureFlowContext must be used within CaptureFlowProvider');
  }
  return context;
}
