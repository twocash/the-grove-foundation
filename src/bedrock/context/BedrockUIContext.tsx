// src/bedrock/context/BedrockUIContext.tsx
// UI context for Bedrock workspace - manages inspector, console, and skin state
// Sprint: bedrock-foundation-v1, hotfix/console-factory, S1-SKIN-HybridEngine

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { InspectorConfig } from '../patterns/console-factory.types';
import type { GroveSkin } from '../types/GroveSkin';
import { SKIN_CSS_MAP } from '../types/GroveSkin';
import defaultTheme from '../themes/quantum-glass-skin.json';
import zenithPaperTheme from '../themes/zenith-paper-skin.json';

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

  // Skin state (S1-SKIN-HybridEngine)
  /** Active GroveSkin configuration */
  skin: GroveSkin;
  /** Available theme IDs */
  availableThemes: string[];
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

  // Skin actions (S1-SKIN-HybridEngine)
  /** Set the active skin */
  setSkin: (skin: GroveSkin) => void;
  /** Load a theme by ID from the registry */
  loadTheme: (themeId: string) => void;
}

type BedrockUIContextValue = BedrockUIState & BedrockUIActions;

// =============================================================================
// Context
// =============================================================================

const BedrockUIContext = createContext<BedrockUIContextValue | null>(null);

// =============================================================================
// Theme Registry (S1-SKIN-HybridEngine)
// =============================================================================

/**
 * Theme registry - maps theme IDs to GroveSkin configurations.
 * New themes can be added here without code changes to consumers.
 */
const THEME_REGISTRY: Record<string, GroveSkin> = {
  'quantum-glass-v1': defaultTheme as unknown as GroveSkin,
  'zenith-paper-v1': zenithPaperTheme as unknown as GroveSkin,
};

// =============================================================================
// Provider
// =============================================================================

interface BedrockUIProviderProps {
  children: ReactNode;
}

const METRICS_BAR_STORAGE_KEY = 'bedrock-metrics-bar-visible';
const SKIN_STORAGE_KEY = 'bedrock-active-skin';

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

  // ==========================================================================
  // Skin state (S1-SKIN-HybridEngine)
  // ==========================================================================

  // Initialize skin from localStorage or default
  const [skin, setSkinState] = useState<GroveSkin>(() => {
    if (typeof window === 'undefined') return defaultTheme as unknown as GroveSkin;
    try {
      const storedId = localStorage.getItem(SKIN_STORAGE_KEY);
      if (storedId && THEME_REGISTRY[storedId]) {
        return THEME_REGISTRY[storedId];
      }
    } catch {
      // Ignore localStorage errors
    }
    return defaultTheme as unknown as GroveSkin;
  });

  // Available themes from registry
  const availableThemes = useMemo(() => Object.keys(THEME_REGISTRY), []);

  // Set skin and persist to localStorage
  const setSkin = useCallback((newSkin: GroveSkin) => {
    setSkinState(newSkin);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SKIN_STORAGE_KEY, newSkin.id);
    }
  }, []);

  // Load theme by ID from registry
  const loadTheme = useCallback((themeId: string) => {
    const theme = THEME_REGISTRY[themeId];
    if (theme) {
      setSkin(theme);
    } else {
      console.warn(`Theme "${themeId}" not found in registry`);
    }
  }, [setSkin]);

  // CSS Variable Injection - the "muscle" of the hybrid approach
  useEffect(() => {
    const root = document.documentElement;

    // Inject color tokens
    Object.entries(skin.tokens.colors).forEach(([key, value]) => {
      const cssVar = SKIN_CSS_MAP.tokens.colors[key as keyof typeof SKIN_CSS_MAP.tokens.colors];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });

    // Inject effect tokens
    Object.entries(skin.tokens.effects).forEach(([key, value]) => {
      const cssVar = SKIN_CSS_MAP.tokens.effects[key as keyof typeof SKIN_CSS_MAP.tokens.effects];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });

    // Log for verification in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[BedrockUI] Skin applied:', skin.id, skin.name);
    }
  }, [skin]);

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
    // Skin state (S1-SKIN-HybridEngine)
    skin,
    availableThemes,
    // Actions
    setActiveConsole,
    setSelectedObjectId,
    setMetricsBarVisible,
    openInspector,
    closeInspector,
    updateInspector,
    // Skin actions (S1-SKIN-HybridEngine)
    setSkin,
    loadTheme,
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
// Convenience Hook: useSkin (S1-SKIN-HybridEngine)
// =============================================================================

/**
 * Convenience hook for components that only need skin access.
 * Returns skin state and actions without the full BedrockUI context.
 */
export function useSkin() {
  const { skin, setSkin, loadTheme, availableThemes } = useBedrockUI();
  return { skin, setSkin, loadTheme, availableThemes };
}

// =============================================================================
// Exports
// =============================================================================

export { THEME_REGISTRY };
export type { BedrockUIState, BedrockUIActions, BedrockUIContextValue, GroveSkin };
