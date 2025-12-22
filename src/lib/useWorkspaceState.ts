// src/lib/useWorkspaceState.ts
// React hook for workspace state management

import { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceState,
  WorkspacePreferences,
  loadWorkspaceState,
  updatePreferences,
  updateSession,
  pushViewHistory,
  getEffectiveTheme,
  applyTheme,
  initializeTheme,
} from './workspace-state';

export interface UseWorkspaceStateReturn {
  state: WorkspaceState;
  preferences: WorkspacePreferences;
  effectiveTheme: 'light' | 'dark';

  // Preference setters
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setInspectorWidth: (width: number) => void;
  setLastVisitedSection: (section: string | null) => void;

  // Navigation history
  pushHistory: (path: string) => void;
  getSessionDuration: () => number; // in minutes
}

export function useWorkspaceState(): UseWorkspaceStateReturn {
  const [state, setState] = useState<WorkspaceState>(() => loadWorkspaceState());

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme(state.preferences);
  }, []);

  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (state.preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const effective = getEffectiveTheme('system');
      applyTheme(effective);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.preferences.theme]);

  const effectiveTheme = getEffectiveTheme(state.preferences.theme);

  // Preference setters
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    setState(prev => {
      const newState = updatePreferences(prev, { theme });
      const effective = getEffectiveTheme(theme);
      applyTheme(effective);
      return newState;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => {
      // Cycle: light -> dark -> system -> light
      const current = prev.preferences.theme;
      let next: 'light' | 'dark' | 'system';
      if (current === 'light') next = 'dark';
      else if (current === 'dark') next = 'system';
      else next = 'light';

      const newState = updatePreferences(prev, { theme: next });
      const effective = getEffectiveTheme(next);
      applyTheme(effective);
      return newState;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => updatePreferences(prev, { sidebarCollapsed: collapsed }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev =>
      updatePreferences(prev, { sidebarCollapsed: !prev.preferences.sidebarCollapsed })
    );
  }, []);

  const setInspectorWidth = useCallback((width: number) => {
    setState(prev => updatePreferences(prev, { inspectorWidth: width }));
  }, []);

  const setLastVisitedSection = useCallback((section: string | null) => {
    setState(prev => updatePreferences(prev, { lastVisitedSection: section }));
  }, []);

  // Navigation
  const pushHistory = useCallback((path: string) => {
    setState(prev => pushViewHistory(prev, path));
  }, []);

  const getSessionDuration = useCallback((): number => {
    const now = Date.now();
    const start = state.session.sessionStartTime;
    return Math.floor((now - start) / 60000); // Convert to minutes
  }, [state.session.sessionStartTime]);

  return {
    state,
    preferences: state.preferences,
    effectiveTheme,
    setTheme,
    toggleTheme,
    setSidebarCollapsed,
    toggleSidebar,
    setInspectorWidth,
    setLastVisitedSection,
    pushHistory,
    getSessionDuration,
  };
}
