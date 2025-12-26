// src/shared/inspector/hooks/useCopilot.ts
// State management for Copilot Configurator

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import {
  type CopilotState,
  type CopilotAction,
  type CopilotMessage,
  type ModelConfig,
  type JsonPatch,
  DEFAULT_MODEL,
  parseIntent,
  generatePatch,
  validatePatch,
  generateResponseMessage,
  generateValidationErrorMessage,
  simulateDelay,
  getSuggestionsForType,
  getWelcomeMessage,
} from '@core/copilot';

// ============================================================================
// Reducer
// ============================================================================

function copilotReducer(state: CopilotState, action: CopilotAction): CopilotState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.value };

    case 'TOGGLE_COLLAPSE':
      return { ...state, isCollapsed: !state.isCollapsed };

    case 'SET_MODEL':
      return { ...state, currentModel: action.model };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };

    default:
      return state;
  }
}

// ============================================================================
// Initial State
// ============================================================================

function createInitialState(objectType: string): CopilotState {
  const welcomeMessage: CopilotMessage = {
    id: 'welcome',
    role: 'assistant',
    content: getWelcomeMessage(objectType),
    timestamp: new Date(),
    suggestions: getSuggestionsForType(objectType),
  };

  return {
    messages: [welcomeMessage],
    isProcessing: false,
    isCollapsed: sessionStorage.getItem('copilot-collapsed') === 'true',
    currentModel: DEFAULT_MODEL,
  };
}

// ============================================================================
// Hook
// ============================================================================

interface UseCopilotReturn {
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
  sendMessage: (content: string) => Promise<void>;
  applyPatch: (messageId: string) => JsonPatch | null;
  rejectPatch: (messageId: string) => void;
  toggleCollapse: () => void;
  suggestions: { label: string; template: string; icon?: string }[];
}

export function useCopilot(
  object: GroveObject,
  onApplyPatch: (patch: JsonPatch) => void
): UseCopilotReturn {
  const [state, dispatch] = useReducer(
    copilotReducer,
    object.meta.type,
    createInitialState
  );

  // Persist collapse state
  useEffect(() => {
    sessionStorage.setItem('copilot-collapsed', String(state.isCollapsed));
  }, [state.isCollapsed]);

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Send a message and process response
  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: CopilotMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: userMessage });
    dispatch({ type: 'SET_PROCESSING', value: true });

    // Parse intent
    const intent = parseIntent(content);

    // Simulate processing delay
    await simulateDelay(state.currentModel);

    if (intent.type === 'UNKNOWN') {
      // Unknown intent
      const errorMessage: CopilotMessage = {
        id: generateId(),
        role: 'assistant',
        content: generateResponseMessage(intent, []),
        timestamp: new Date(),
        suggestions: getSuggestionsForType(object.meta.type),
      };
      dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
    } else {
      // Generate and validate patch
      const patch = generatePatch(intent, object);
      const validation = validatePatch(patch, object.meta.type);

      if (!validation.valid) {
        // Validation failed
        const errorMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: generateValidationErrorMessage(validation.errors),
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
      } else if (patch.length === 0) {
        // No changes needed
        const noChangeMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: 'No changes needed - the object already has that value.',
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', message: noChangeMessage });
      } else {
        // Valid patch - show preview
        const previewMessage: CopilotMessage = {
          id: generateId(),
          role: 'assistant',
          content: generateResponseMessage(intent, patch),
          timestamp: new Date(),
          patch,
          patchStatus: 'pending',
        };
        dispatch({ type: 'ADD_MESSAGE', message: previewMessage });
      }
    }

    dispatch({ type: 'SET_PROCESSING', value: false });
  }, [object, state.currentModel]);

  // Apply a pending patch
  const applyPatch = useCallback((messageId: string): JsonPatch | null => {
    const message = state.messages.find(m => m.id === messageId);
    if (!message?.patch || message.patchStatus !== 'pending') return null;

    // Update message status
    dispatch({
      type: 'UPDATE_MESSAGE',
      id: messageId,
      updates: { patchStatus: 'applied' },
    });

    // Add confirmation message
    const confirmMessage: CopilotMessage = {
      id: generateId(),
      role: 'assistant',
      content: '✓ Changes applied successfully.',
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', message: confirmMessage });

    // Notify parent to apply
    onApplyPatch(message.patch);

    return message.patch;
  }, [state.messages, onApplyPatch]);

  // Reject a pending patch
  const rejectPatch = useCallback((messageId: string) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      id: messageId,
      updates: { patchStatus: 'rejected' },
    });
  }, []);

  // Toggle collapse state
  const toggleCollapse = useCallback(() => {
    dispatch({ type: 'TOGGLE_COLLAPSE' });
  }, []);

  // Memoized suggestions
  const suggestions = useMemo(
    () => getSuggestionsForType(object.meta.type),
    [object.meta.type]
  );

  return {
    messages: state.messages,
    isProcessing: state.isProcessing,
    isCollapsed: state.isCollapsed,
    currentModel: state.currentModel,
    sendMessage,
    applyPatch,
    rejectPatch,
    toggleCollapse,
    suggestions,
  };
}
