// useWizardState - State management for wizard engine
// Sprint: wizard-engine-v1

import { useReducer, useCallback, useMemo } from 'react';
import { WizardSchema, WizardStepSchema, WizardEngineState, ConditionalAction } from '@core/wizard';
import { evaluateCondition } from '@core/wizard';

// ============================================================================
// ACTION TYPES
// ============================================================================

type WizardAction =
  | { type: 'GO_TO_STEP'; stepId: string }
  | { type: 'GO_BACK' }
  | { type: 'UPDATE_INPUTS'; updates: Record<string, unknown> }
  | { type: 'SET_GENERATED_OPTIONS'; options: unknown[] }
  | { type: 'SET_SELECTED_OPTION'; option: unknown }
  | { type: 'SET_SELECTED_INDEX'; index: number | null }
  | { type: 'SET_GENERATING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

// Extended state with selected index
interface ExtendedWizardState extends WizardEngineState {
  selectedIndex: number | null;
}

// ============================================================================
// REDUCER
// ============================================================================

function wizardReducer(
  state: ExtendedWizardState,
  action: WizardAction
): ExtendedWizardState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.stepId,
        stepHistory: [...state.stepHistory, state.currentStep],
        error: null
      };

    case 'GO_BACK': {
      const newHistory = [...state.stepHistory];
      const prevStep = newHistory.pop();
      return {
        ...state,
        currentStep: prevStep || state.currentStep,
        stepHistory: newHistory,
        error: null
      };
    }

    case 'UPDATE_INPUTS':
      return {
        ...state,
        inputs: { ...state.inputs, ...action.updates }
      };

    case 'SET_GENERATED_OPTIONS':
      return {
        ...state,
        generatedOptions: action.options,
        selectedOption: null,
        selectedIndex: null
      };

    case 'SET_SELECTED_OPTION':
      return {
        ...state,
        selectedOption: action.option
      };

    case 'SET_SELECTED_INDEX':
      return {
        ...state,
        selectedIndex: action.index,
        selectedOption: action.index !== null ? state.generatedOptions[action.index] : null
      };

    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.value
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isGenerating: false
      };

    case 'RESET':
      return {
        currentStep: state.currentStep,
        stepHistory: [],
        inputs: {},
        generatedOptions: [],
        selectedOption: null,
        selectedIndex: null,
        isGenerating: false,
        error: null
      };

    default:
      return state;
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useWizardState(
  schema: WizardSchema,
  initialInputs?: Record<string, unknown>
) {
  const initialState: ExtendedWizardState = {
    currentStep: schema.initialStep,
    stepHistory: [],
    inputs: initialInputs || {},
    generatedOptions: [],
    selectedOption: null,
    selectedIndex: null,
    isGenerating: false,
    error: null
  };

  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Get current step schema
  const currentStepSchema = useMemo((): WizardStepSchema | undefined =>
    schema.steps.find(s => s.id === state.currentStep),
    [schema.steps, state.currentStep]
  );

  // Navigation actions
  const goToStep = useCallback((stepId: string) => {
    dispatch({ type: 'GO_TO_STEP', stepId });
  }, []);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  // Input management
  const updateInputs = useCallback((updates: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_INPUTS', updates });
  }, []);

  // Generation management
  const setGeneratedOptions = useCallback((options: unknown[]) => {
    dispatch({ type: 'SET_GENERATED_OPTIONS', options });
  }, []);

  const setSelectedOption = useCallback((option: unknown) => {
    dispatch({ type: 'SET_SELECTED_OPTION', option });
  }, []);

  const setSelectedIndex = useCallback((index: number | null) => {
    dispatch({ type: 'SET_SELECTED_INDEX', index });
  }, []);

  const setGenerating = useCallback((value: boolean) => {
    dispatch({ type: 'SET_GENERATING', value });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  // Conditional evaluation
  const evaluateNext = useCallback((action: ConditionalAction): string => {
    if (action.conditions) {
      for (const condition of action.conditions) {
        if (evaluateCondition(condition.if, state.inputs)) {
          return condition.then;
        }
      }
    }
    return action.default;
  }, [state.inputs]);

  // Progress calculation
  const getProgress = useCallback((): number => {
    return currentStepSchema?.progress || 0;
  }, [currentStepSchema]);

  const getMaxProgress = useCallback((): number => {
    return Math.max(...schema.steps.map(s => s.progress || 0));
  }, [schema.steps]);

  // Can go back?
  const canGoBack = state.stepHistory.length > 0;

  return {
    // State
    state,
    currentStep: state.currentStep,
    currentStepSchema,
    inputs: state.inputs,
    generatedOptions: state.generatedOptions,
    selectedOption: state.selectedOption,
    selectedIndex: state.selectedIndex,
    isGenerating: state.isGenerating,
    error: state.error,

    // Navigation
    goToStep,
    goBack,
    canGoBack,

    // Input management
    updateInputs,

    // Generation management
    setGeneratedOptions,
    setSelectedOption,
    setSelectedIndex,
    setGenerating,
    setError,

    // Evaluation
    evaluateNext,

    // Progress
    getProgress,
    getMaxProgress
  };
}
