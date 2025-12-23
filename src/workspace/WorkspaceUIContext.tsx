// src/workspace/WorkspaceUIContext.tsx
// State management for Grove Workspace

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  NavigationPath,
  EntityType,
  InspectorMode,
  WorkspaceUIContextType,
  NavigationState,
  InspectorState,
  SessionState,
} from '@core/schema/workspace';
import { DEFAULT_NAV_PATH, WORKSPACE_NAV_KEY, WORKSPACE_EXPANDED_KEY } from '@core/schema/workspace';

const WorkspaceUIContext = createContext<WorkspaceUIContextType | null>(null);

interface WorkspaceUIProviderProps {
  children: ReactNode;
  initialPath?: NavigationPath;
}

export function WorkspaceUIProvider({ children, initialPath }: WorkspaceUIProviderProps) {
  // Navigation state
  const [navigation, setNavigation] = useState<NavigationState>(() => {
    // Try to restore from localStorage
    const storedPath = localStorage.getItem(WORKSPACE_NAV_KEY);
    const storedExpanded = localStorage.getItem(WORKSPACE_EXPANDED_KEY);

    let activePath = initialPath || DEFAULT_NAV_PATH;
    if (!initialPath && storedPath) {
      try {
        activePath = JSON.parse(storedPath);
      } catch { /* ignore */ }
    }

    let expandedGroups = new Set<string>(['explore']); // Expand explore by default
    if (storedExpanded) {
      try {
        expandedGroups = new Set(JSON.parse(storedExpanded));
      } catch { /* ignore */ }
    }

    return {
      activePath,
      expandedGroups,
      selectedEntityId: null,
      selectedEntityType: null,
    };
  });

  // Inspector state
  const [inspector, setInspector] = useState<InspectorState>({
    mode: { type: 'none' },
    isOpen: false,
  });

  // Session state
  const [session, setSession] = useState<SessionState>(() => ({
    startTime: new Date(),
    sproutCount: 0,
  }));

  // Command palette state
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Load sprout count on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('grove-sprouts');
      if (stored) {
        const sprouts = JSON.parse(stored);
        if (Array.isArray(sprouts)) {
          setSession(s => ({ ...s, sproutCount: sprouts.length }));
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist navigation to localStorage
  useEffect(() => {
    localStorage.setItem(WORKSPACE_NAV_KEY, JSON.stringify(navigation.activePath));
    localStorage.setItem(WORKSPACE_EXPANDED_KEY, JSON.stringify([...navigation.expandedGroups]));
  }, [navigation.activePath, navigation.expandedGroups]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K opens command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Escape closes command palette or inspector
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setCommandPaletteOpen(false);
        } else if (inspector.isOpen) {
          e.preventDefault();
          setInspector(s => ({ ...s, isOpen: false }));
        }
      }
      // Cmd+\ toggles inspector
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setInspector(s => ({ ...s, isOpen: !s.isOpen }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, inspector.isOpen]);

  // Navigation actions
  const navigateTo = useCallback((path: NavigationPath) => {
    setNavigation(s => ({
      ...s,
      activePath: path,
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, []);

  const toggleGroup = useCallback((groupPath: string) => {
    setNavigation(s => {
      const newExpanded = new Set(s.expandedGroups);
      if (newExpanded.has(groupPath)) {
        newExpanded.delete(groupPath);
      } else {
        newExpanded.add(groupPath);
      }
      return { ...s, expandedGroups: newExpanded };
    });
  }, []);

  // Inspector actions
  const openInspector = useCallback((mode: InspectorMode) => {
    setInspector({ mode, isOpen: true });
  }, []);

  const closeInspector = useCallback(() => {
    setInspector(s => ({ ...s, isOpen: false }));
  }, []);

  const toggleInspector = useCallback(() => {
    setInspector(s => ({ ...s, isOpen: !s.isOpen }));
  }, []);

  // Selection actions
  const selectEntity = useCallback((id: string, type: EntityType) => {
    setNavigation(s => ({
      ...s,
      selectedEntityId: id,
      selectedEntityType: type,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setNavigation(s => ({
      ...s,
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, []);

  // Command palette actions
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  // Session actions
  const incrementSproutCount = useCallback(() => {
    setSession(s => ({ ...s, sproutCount: s.sproutCount + 1 }));
  }, []);

  const value: WorkspaceUIContextType = {
    // State
    navigation,
    inspector,
    session,
    isCommandPaletteOpen,
    // Actions
    navigateTo,
    toggleGroup,
    openInspector,
    closeInspector,
    toggleInspector,
    selectEntity,
    clearSelection,
    openCommandPalette,
    closeCommandPalette,
    incrementSproutCount,
  };

  return (
    <WorkspaceUIContext.Provider value={value}>
      {children}
    </WorkspaceUIContext.Provider>
  );
}

export function useWorkspaceUI(): WorkspaceUIContextType {
  const context = useContext(WorkspaceUIContext);
  if (!context) {
    throw new Error('useWorkspaceUI must be used within WorkspaceUIProvider');
  }
  return context;
}

/**
 * Optional version of useWorkspaceUI that returns null outside WorkspaceUIProvider.
 * Use this for components that need to work both inside and outside the workspace.
 */
export function useOptionalWorkspaceUI(): WorkspaceUIContextType | null {
  return useContext(WorkspaceUIContext);
}
