// src/foundation/FoundationUIContext.tsx
// State management for Foundation workspace

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  FoundationConsole,
  FoundationInspectorMode,
  FoundationUIContextType,
  FoundationNavState,
  FoundationInspectorState,
} from '@core/schema/foundation';
import { FOUNDATION_CONSOLE_KEY, FOUNDATION_EXPANDED_KEY } from '@core/schema/foundation';

const FoundationUIContext = createContext<FoundationUIContextType | null>(null);

// Map route paths to console identifiers
const routeToConsole: Record<string, FoundationConsole> = {
  '/foundation': 'dashboard',
  '/foundation/genesis': 'genesis',
  '/foundation/health': 'health',
  '/foundation/narrative': 'narrative',
  '/foundation/engagement': 'engagement',
  '/foundation/knowledge': 'knowledge',
  '/foundation/tuner': 'tuner',
  '/foundation/audio': 'audio',
  '/foundation/sprouts': 'sprouts',
};

interface FoundationUIProviderProps {
  children: ReactNode;
}

export function FoundationUIProvider({ children }: FoundationUIProviderProps) {
  const location = useLocation();

  // Navigation state - synced with route
  const [navigation, setNavigation] = useState<FoundationNavState>(() => {
    const storedExpanded = localStorage.getItem(FOUNDATION_EXPANDED_KEY);
    let expandedGroups = new Set<string>(['content', 'analytics']);

    if (storedExpanded) {
      try {
        expandedGroups = new Set(JSON.parse(storedExpanded));
      } catch { /* ignore */ }
    }

    const activeConsole = routeToConsole[location.pathname] || 'dashboard';

    return {
      activeConsole,
      expandedGroups,
    };
  });

  // Inspector state
  const [inspector, setInspector] = useState<FoundationInspectorState>({
    mode: { type: 'none' },
    isOpen: false,
  });

  // Sync navigation state with route changes
  useEffect(() => {
    const console = routeToConsole[location.pathname];
    if (console && console !== navigation.activeConsole) {
      setNavigation(s => ({ ...s, activeConsole: console }));
    }
  }, [location.pathname, navigation.activeConsole]);

  // Persist expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem(
      FOUNDATION_EXPANDED_KEY,
      JSON.stringify([...navigation.expandedGroups])
    );
  }, [navigation.expandedGroups]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes inspector
      if (e.key === 'Escape' && inspector.isOpen) {
        e.preventDefault();
        setInspector(s => ({ ...s, isOpen: false }));
      }
      // Cmd+\ toggles inspector
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setInspector(s => ({ ...s, isOpen: !s.isOpen }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspector.isOpen]);

  // Navigation actions
  const setActiveConsole = useCallback((console: FoundationConsole) => {
    setNavigation(s => ({ ...s, activeConsole: console }));
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setNavigation(s => {
      const newExpanded = new Set(s.expandedGroups);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return { ...s, expandedGroups: newExpanded };
    });
  }, []);

  // Inspector actions
  const openInspector = useCallback((mode: FoundationInspectorMode) => {
    setInspector({ mode, isOpen: true });
  }, []);

  const closeInspector = useCallback(() => {
    setInspector(s => ({ ...s, isOpen: false }));
  }, []);

  const toggleInspector = useCallback(() => {
    setInspector(s => ({ ...s, isOpen: !s.isOpen }));
  }, []);

  const value: FoundationUIContextType = {
    // State
    navigation,
    inspector,
    // Actions
    setActiveConsole,
    toggleGroup,
    openInspector,
    closeInspector,
    toggleInspector,
  };

  return (
    <FoundationUIContext.Provider value={value}>
      {children}
    </FoundationUIContext.Provider>
  );
}

export function useFoundationUI(): FoundationUIContextType {
  const context = useContext(FoundationUIContext);
  if (!context) {
    throw new Error('useFoundationUI must be used within FoundationUIProvider');
  }
  return context;
}
