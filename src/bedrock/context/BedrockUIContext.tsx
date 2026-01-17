// src/bedrock/context/BedrockUIContext.tsx
// UI context for Bedrock workspace - manages inspector and console state
// Sprint: bedrock-foundation-v1, hotfix/console-factory

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { InspectorConfig } from '../patterns/console-factory.types';

// =============================================================================
// Types
// =============================================================================

interface BedrockUIState {
  /** Currently active console ID */
  activeConsole: string;
  /** Currently selected object ID (for tracking) */
  selectedObjectId: string | null;

  // Metrics bar state
  /** Whether metrics bar is visible (persisted to localStorage) */
  metricsBarVisible: boolean;

  // Inspector state
  /** Whether inspector is open */
  inspectorOpen: boolean;
  /** Inspector panel title */
  inspectorTitle: string;
  /** Inspector panel subtitle */
  inspectorSubtitle: ReactNode;
  /** Inspector panel icon */
  inspectorIcon: string | undefined;
  /** Inspector panel content (editor) */
  inspectorContent: ReactNode;
  /** Copilot panel content */
  copilotContent: ReactNode;
}

interface BedrockUIActions {
  /** Set active console ID */
  setActiveConsole: (id: string) => void;
  /** Set selected object ID */
  setSelectedObjectId: (id: string | null) => void;

  // Metrics bar actions
  /** Set metrics bar visibility (persists to localStorage) */
  setMetricsBarVisible: (visible: boolean) => void;

  // Inspector actions
  /** Open inspector with config */
  openInspector: (config: InspectorConfig) => void;
  /** Close inspector */
  closeInspector: () => void;
  /** Update inspector content without closing */
  updateInspector: (config: Partial<InspectorConfig>) => void;
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
}

const METRICS_BAR_STORAGE_KEY = 'bedrock-metrics-bar-visible';

export function BedrockUIProvider({ children }: BedrockUIProviderProps) {
  // Console state
  const [activeConsole, setActiveConsole] = useState('dashboard');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Metrics bar state (persisted to localStorage)
  const [metricsBarVisible, setMetricsBarVisibleState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem(METRICS_BAR_STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const setMetricsBarVisible = useCallback((visible: boolean) => {
    setMetricsBarVisibleState(visible);
    if (typeof window !== 'undefined') {
      localStorage.setItem(METRICS_BAR_STORAGE_KEY, JSON.stringify(visible));
    }
  }, []);

  // Inspector state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTitle, setInspectorTitle] = useState('');
  const [inspectorSubtitle, setInspectorSubtitle] = useState<ReactNode>(null);
  const [inspectorIcon, setInspectorIcon] = useState<string | undefined>();
  const [inspectorContent, setInspectorContent] = useState<ReactNode>(null);
  const [copilotContent, setCopilotContent] = useState<ReactNode>(null);

  // Open inspector with full config
  const openInspector = useCallback((config: InspectorConfig) => {
    setInspectorTitle(config.title);
    setInspectorSubtitle(config.subtitle ?? null);
    setInspectorIcon(config.icon);
    setInspectorContent(config.content);
    setCopilotContent(config.copilot ?? null);
    setInspectorOpen(true);
  }, []);

  // Close inspector and clear content
  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    // Small delay before clearing content for smooth animation
    setTimeout(() => {
      setInspectorContent(null);
      setCopilotContent(null);
    }, 200);
  }, []);

  // Update inspector without closing (for live updates)
  const updateInspector = useCallback((config: Partial<InspectorConfig>) => {
    if (config.title !== undefined) setInspectorTitle(config.title);
    if (config.subtitle !== undefined) setInspectorSubtitle(config.subtitle);
    if (config.icon !== undefined) setInspectorIcon(config.icon);
    if (config.content !== undefined) setInspectorContent(config.content);
    if (config.copilot !== undefined) setCopilotContent(config.copilot);
  }, []);

  const value: BedrockUIContextValue = {
    // State
    activeConsole,
    selectedObjectId,
    metricsBarVisible,
    inspectorOpen,
    inspectorTitle,
    inspectorSubtitle,
    inspectorIcon,
    inspectorContent,
    copilotContent,
    // Actions
    setActiveConsole,
    setSelectedObjectId,
    setMetricsBarVisible,
    openInspector,
    closeInspector,
    updateInspector,
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

export type { BedrockUIState, BedrockUIActions, BedrockUIContextValue };
