// src/bedrock/context/BedrockUIContext.tsx
// UI state context for Bedrock workspace
// Sprint: bedrock-foundation-v1

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

interface SelectedItem {
  id: string;
  type: string;
}

interface BedrockUIState {
  /** Currently selected item in the main view */
  selectedItem: SelectedItem | null;
  /** Whether the inspector panel is open */
  inspectorOpen: boolean;
  /** Whether the copilot panel is open */
  copilotOpen: boolean;
  /** Current active console ID */
  activeConsole: string | null;
}

interface BedrockUIActions {
  /** Select an item to show in inspector */
  selectItem: (item: SelectedItem | null) => void;
  /** Toggle inspector panel visibility */
  toggleInspector: () => void;
  /** Set inspector panel visibility */
  setInspectorOpen: (open: boolean) => void;
  /** Toggle copilot panel visibility */
  toggleCopilot: () => void;
  /** Set copilot panel visibility */
  setCopilotOpen: (open: boolean) => void;
  /** Set active console */
  setActiveConsole: (consoleId: string | null) => void;
}

type BedrockUIContextValue = BedrockUIState & BedrockUIActions;

// =============================================================================
// Context
// =============================================================================

const BedrockUIContext = createContext<BedrockUIContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface BedrockUIProviderProps {
  children: ReactNode;
  defaultInspectorOpen?: boolean;
  defaultCopilotOpen?: boolean;
}

export function BedrockUIProvider({
  children,
  defaultInspectorOpen = true,
  defaultCopilotOpen = false,
}: BedrockUIProviderProps) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(defaultInspectorOpen);
  const [copilotOpen, setCopilotOpen] = useState(defaultCopilotOpen);
  const [activeConsole, setActiveConsole] = useState<string | null>(null);

  const selectItem = useCallback((item: SelectedItem | null) => {
    setSelectedItem(item);
    // Auto-open inspector when selecting an item
    if (item && !inspectorOpen) {
      setInspectorOpen(true);
    }
  }, [inspectorOpen]);

  const toggleInspector = useCallback(() => {
    setInspectorOpen(prev => !prev);
  }, []);

  const toggleCopilot = useCallback(() => {
    setCopilotOpen(prev => !prev);
  }, []);

  const value: BedrockUIContextValue = {
    selectedItem,
    inspectorOpen,
    copilotOpen,
    activeConsole,
    selectItem,
    toggleInspector,
    setInspectorOpen,
    toggleCopilot,
    setCopilotOpen,
    setActiveConsole,
  };

  return (
    <BedrockUIContext.Provider value={value}>
      {children}
    </BedrockUIContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useBedrockUI(): BedrockUIContextValue {
  const context = useContext(BedrockUIContext);
  if (!context) {
    throw new Error('useBedrockUI must be used within a BedrockUIProvider');
  }
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type { BedrockUIState, BedrockUIActions, SelectedItem };
