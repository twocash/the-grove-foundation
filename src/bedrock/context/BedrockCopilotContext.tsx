// src/bedrock/context/BedrockCopilotContext.tsx
// Copilot context for Bedrock workspace - provides contextual AI assistance
// Sprint: bedrock-foundation-v1

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface CopilotContext {
  /** Current console context */
  consoleId: string | null;
  /** Currently selected item context */
  selectedItemId: string | null;
  selectedItemType: string | null;
  /** Additional context data */
  contextData: Record<string, unknown>;
}

interface BedrockCopilotState {
  /** Whether copilot is processing */
  isProcessing: boolean;
  /** Conversation history */
  messages: CopilotMessage[];
  /** Current context for the copilot */
  context: CopilotContext;
  /** Available actions for current context */
  availableActions: CopilotAction[];
}

interface CopilotAction {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

interface BedrockCopilotActions {
  /** Send a message to copilot */
  sendMessage: (content: string) => Promise<void>;
  /** Execute a copilot action */
  executeAction: (actionId: string) => Promise<void>;
  /** Update copilot context */
  setContext: (context: Partial<CopilotContext>) => void;
  /** Clear conversation history */
  clearHistory: () => void;
  /** Set available actions for current context */
  setAvailableActions: (actions: CopilotAction[]) => void;
}

type BedrockCopilotContextValue = BedrockCopilotState & BedrockCopilotActions;

// =============================================================================
// Context
// =============================================================================

const BedrockCopilotContext = createContext<BedrockCopilotContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface BedrockCopilotProviderProps {
  children: ReactNode;
}

export function BedrockCopilotProvider({ children }: BedrockCopilotProviderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [context, setContextState] = useState<CopilotContext>({
    consoleId: null,
    selectedItemId: null,
    selectedItemType: null,
    contextData: {},
  });
  const [availableActions, setAvailableActions] = useState<CopilotAction[]>([]);

  const setContext = useCallback((newContext: Partial<CopilotContext>) => {
    setContextState(prev => ({ ...prev, ...newContext }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // TODO: Integrate with actual AI service
      // For now, log the context and provide a placeholder response
      console.log('[Copilot] Context:', context);
      console.log('[Copilot] User message:', content);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const assistantMessage: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I received your message in the context of ${context.consoleId || 'Bedrock'}. Full AI integration coming soon.`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [context]);

  const executeAction = useCallback(async (actionId: string) => {
    const action = availableActions.find(a => a.id === actionId);
    if (!action) {
      console.warn(`[Copilot] Action not found: ${actionId}`);
      return;
    }

    console.log('[Copilot] Executing action:', action);
    setIsProcessing(true);

    try {
      // TODO: Implement action execution
      await new Promise(resolve => setTimeout(resolve, 300));

      const systemMessage: CopilotMessage = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Executed action: ${action.label}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, systemMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [availableActions]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const value: BedrockCopilotContextValue = {
    isProcessing,
    messages,
    context,
    availableActions,
    sendMessage,
    executeAction,
    setContext,
    clearHistory,
    setAvailableActions,
  };

  return (
    <BedrockCopilotContext.Provider value={value}>
      {children}
    </BedrockCopilotContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useBedrockCopilot(): BedrockCopilotContextValue {
  const context = useContext(BedrockCopilotContext);
  if (!context) {
    throw new Error('useBedrockCopilot must be used within a BedrockCopilotProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { CopilotMessage, CopilotContext, CopilotAction, BedrockCopilotState };
