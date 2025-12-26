// components/Terminal/useTerminalState.ts
// Consolidated state hook for Terminal component
// Sprint: Terminal Architecture Refactor v1.0

import { useState, useCallback, useMemo } from 'react';
import {
  BridgeState,
  TerminalFlowState,
  RevealStates,
  ModalStates,
  TerminalUIState,
  TerminalActions,
  INITIAL_BRIDGE_STATE,
  INITIAL_REVEAL_STATES,
  INITIAL_MODAL_STATES
} from './types';

/**
 * Options for initializing terminal state
 */
export interface UseTerminalStateOptions {
  /** Initial lens ID (if any) */
  initialLens?: string | null;
  /** Initial flow state */
  initialFlowState?: TerminalFlowState;
  /** Whether to start with welcome interstitial */
  showWelcome?: boolean;
}

/**
 * Consolidated state hook for the Terminal component.
 *
 * This hook consolidates the 25+ useState calls from Terminal.tsx into
 * a single, coherent state management interface with grouped state
 * and action dispatchers.
 *
 * @example
 * ```tsx
 * const { state, actions } = useTerminalState({ initialLens: 'academic' });
 *
 * // Access state
 * if (state.showLensPicker) { ... }
 *
 * // Dispatch actions
 * actions.openModal('help');
 * actions.setReveal('simulation', true);
 * ```
 */
export function useTerminalState(options: UseTerminalStateOptions = {}) {
  const {
    initialFlowState = 'idle',
    showWelcome = false
  } = options;

  // ============================================================================
  // STATE HOOKS
  // ============================================================================

  // Flow states
  const [flowState, setFlowStateInternal] = useState<TerminalFlowState>(initialFlowState);
  const [showLensPicker, setShowLensPicker] = useState(false);
  const [showJourneyPicker, setShowJourneyPicker] = useState(false);
  const [showCustomLensWizard, setShowCustomLensWizard] = useState(false);
  const [showWelcomeInterstitial, setShowWelcomeInterstitial] = useState(showWelcome);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Cognitive Bridge
  const [bridgeState, setBridgeStateInternal] = useState<BridgeState>(INITIAL_BRIDGE_STATE);

  // Reveal states
  const [reveals, setReveals] = useState<RevealStates>(INITIAL_REVEAL_STATES);

  // Modal states
  const [modals, setModals] = useState<ModalStates>(INITIAL_MODAL_STATES);

  // Input states
  const [input, setInputInternal] = useState('');
  const [isVerboseMode, setIsVerboseMode] = useState(false);
  const [dynamicSuggestion, setDynamicSuggestionInternal] = useState('');
  const [currentTopic, setCurrentTopicInternal] = useState('');

  // Navigation states
  const [currentNodeId, setCurrentNodeIdInternal] = useState<string | null>(null);

  // Journey completion
  const [completedJourneyTitle, setCompletedJourneyTitleInternal] = useState<string | null>(null);
  const [journeyStartTime, setJourneyStartTime] = useState(Date.now());

  // ============================================================================
  // ACTION DISPATCHERS
  // ============================================================================

  // Flow actions
  const setFlowState = useCallback((state: TerminalFlowState) => {
    setFlowStateInternal(state);
    // Sync related states
    switch (state) {
      case 'welcome':
        setShowWelcomeInterstitial(true);
        setShowLensPicker(false);
        setShowCustomLensWizard(false);
        break;
      case 'selecting':
        setShowWelcomeInterstitial(false);
        setShowLensPicker(true);
        setShowCustomLensWizard(false);
        break;
      case 'wizard':
        setShowWelcomeInterstitial(false);
        setShowLensPicker(false);
        setShowCustomLensWizard(true);
        break;
      case 'active':
      case 'idle':
        setShowWelcomeInterstitial(false);
        setShowLensPicker(false);
        setShowCustomLensWizard(false);
        break;
    }
  }, []);

  const showLensPickerAction = useCallback(() => {
    setShowLensPicker(true);
    setShowJourneyPicker(false);
  }, []);

  const hideLensPicker = useCallback(() => {
    setShowLensPicker(false);
  }, []);

  const showJourneyPickerAction = useCallback(() => {
    setShowJourneyPicker(true);
    setShowLensPicker(false);
  }, []);

  const hideJourneyPicker = useCallback(() => {
    setShowJourneyPicker(false);
  }, []);

  const showCustomLensWizardAction = useCallback(() => {
    setShowCustomLensWizard(true);
    setShowLensPicker(false);
  }, []);

  const hideCustomLensWizard = useCallback(() => {
    setShowCustomLensWizard(false);
  }, []);

  const showWelcomeInterstitialAction = useCallback(() => {
    setShowWelcomeInterstitial(true);
  }, []);

  const hideWelcomeInterstitial = useCallback(() => {
    setShowWelcomeInterstitial(false);
    setHasShownWelcome(true);
  }, []);

  // Bridge actions
  const setBridgeState = useCallback((state: BridgeState) => {
    setBridgeStateInternal(state);
  }, []);

  const dismissBridge = useCallback(() => {
    setBridgeStateInternal(INITIAL_BRIDGE_STATE);
  }, []);

  // Reveal actions
  const setReveal = useCallback((reveal: keyof RevealStates, visible: boolean) => {
    setReveals(prev => ({ ...prev, [reveal]: visible }));
  }, []);

  const dismissAllReveals = useCallback(() => {
    setReveals(INITIAL_REVEAL_STATES);
  }, []);

  // Modal actions
  const openModal = useCallback((modal: keyof ModalStates) => {
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: keyof ModalStates) => {
    setModals(prev => ({ ...prev, [modal]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(INITIAL_MODAL_STATES);
  }, []);

  // Input actions
  const setInput = useCallback((value: string) => {
    setInputInternal(value);
  }, []);

  const toggleVerboseMode = useCallback(() => {
    setIsVerboseMode(prev => !prev);
  }, []);

  const setDynamicSuggestion = useCallback((value: string) => {
    setDynamicSuggestionInternal(value);
  }, []);

  const setCurrentTopic = useCallback((value: string) => {
    setCurrentTopicInternal(value);
  }, []);

  // Navigation actions
  const setCurrentNodeId = useCallback((id: string | null) => {
    setCurrentNodeIdInternal(id);
  }, []);

  // Journey actions
  const setCompletedJourneyTitle = useCallback((title: string | null) => {
    setCompletedJourneyTitleInternal(title);
  }, []);

  const resetJourneyStartTime = useCallback(() => {
    setJourneyStartTime(Date.now());
  }, []);

  // ============================================================================
  // MEMOIZED STATE AND ACTIONS
  // ============================================================================

  const state: TerminalUIState = useMemo(() => ({
    flowState,
    showLensPicker,
    showJourneyPicker,
    showCustomLensWizard,
    showWelcomeInterstitial,
    hasShownWelcome,
    bridgeState,
    reveals,
    modals,
    input,
    isVerboseMode,
    dynamicSuggestion,
    currentTopic,
    currentNodeId,
    completedJourneyTitle,
    journeyStartTime
  }), [
    flowState,
    showLensPicker,
    showJourneyPicker,
    showCustomLensWizard,
    showWelcomeInterstitial,
    hasShownWelcome,
    bridgeState,
    reveals,
    modals,
    input,
    isVerboseMode,
    dynamicSuggestion,
    currentTopic,
    currentNodeId,
    completedJourneyTitle,
    journeyStartTime
  ]);

  const actions: TerminalActions = useMemo(() => ({
    setFlowState,
    showLensPicker: showLensPickerAction,
    hideLensPicker,
    showJourneyPicker: showJourneyPickerAction,
    hideJourneyPicker,
    showCustomLensWizard: showCustomLensWizardAction,
    hideCustomLensWizard,
    showWelcomeInterstitial: showWelcomeInterstitialAction,
    hideWelcomeInterstitial,
    setBridgeState,
    dismissBridge,
    setReveal,
    dismissAllReveals,
    openModal,
    closeModal,
    closeAllModals,
    setInput,
    toggleVerboseMode,
    setDynamicSuggestion,
    setCurrentTopic,
    setCurrentNodeId,
    setCompletedJourneyTitle,
    resetJourneyStartTime
  }), [
    setFlowState,
    showLensPickerAction,
    hideLensPicker,
    showJourneyPickerAction,
    hideJourneyPicker,
    showCustomLensWizardAction,
    hideCustomLensWizard,
    showWelcomeInterstitialAction,
    hideWelcomeInterstitial,
    setBridgeState,
    dismissBridge,
    setReveal,
    dismissAllReveals,
    openModal,
    closeModal,
    closeAllModals,
    setInput,
    toggleVerboseMode,
    setDynamicSuggestion,
    setCurrentTopic,
    setCurrentNodeId,
    setCompletedJourneyTitle,
    resetJourneyStartTime
  ]);

  return { state, actions };
}

export default useTerminalState;
