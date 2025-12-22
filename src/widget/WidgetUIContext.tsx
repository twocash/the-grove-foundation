// src/widget/WidgetUIContext.tsx
// State management for Grove Widget

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  type WidgetMode,
  type InspectorMode,
  type WidgetUIContextType,
  WIDGET_MODE_KEY,
  isWidgetMode,
} from '@core/schema/widget';

const WidgetUIContext = createContext<WidgetUIContextType | null>(null);

interface WidgetUIProviderProps {
  children: ReactNode;
  initialMode?: WidgetMode;
}

export function WidgetUIProvider({ children, initialMode }: WidgetUIProviderProps) {
  // Initialize mode from localStorage or prop
  const [currentMode, setCurrentMode] = useState<WidgetMode>(() => {
    if (initialMode) return initialMode;
    const stored = localStorage.getItem(WIDGET_MODE_KEY);
    return isWidgetMode(stored) ? stored : 'explore';
  });

  // Session state
  const [sessionStartTime] = useState(() => new Date());
  const [sproutCount, setSproutCount] = useState(0);

  // Inspector state
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('none');
  const [inspectorEntityId, setInspectorEntityId] = useState<string | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Load sprout count on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('grove-sprouts');
      if (stored) {
        const sprouts = JSON.parse(stored);
        if (Array.isArray(sprouts)) {
          setSproutCount(sprouts.length);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Actions
  const setMode = useCallback((mode: WidgetMode) => {
    setCurrentMode(mode);
    localStorage.setItem(WIDGET_MODE_KEY, mode);
  }, []);

  const openInspector = useCallback((mode: InspectorMode, entityId: string) => {
    setInspectorMode(mode);
    setInspectorEntityId(entityId);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorMode('none');
    setInspectorEntityId(null);
  }, []);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const incrementSproutCount = useCallback(() => setSproutCount(c => c + 1), []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K opens command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Escape closes command palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  const value: WidgetUIContextType = {
    // State
    currentMode,
    sessionStartTime,
    sproutCount,
    inspectorMode,
    inspectorEntityId,
    isCommandPaletteOpen,
    // Actions
    setMode,
    openInspector,
    closeInspector,
    openCommandPalette,
    closeCommandPalette,
    incrementSproutCount,
  };

  return (
    <WidgetUIContext.Provider value={value}>
      {children}
    </WidgetUIContext.Provider>
  );
}

export function useWidgetUI(): WidgetUIContextType {
  const context = useContext(WidgetUIContext);
  if (!context) {
    throw new Error('useWidgetUI must be used within WidgetUIProvider');
  }
  return context;
}
