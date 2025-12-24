// src/theme/ThemeProvider.tsx
// React context provider for theme system

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Theme, Mode, Surface, ResolvedTokens, Typography, Effects } from './tokens';
import { themeResolver } from './ThemeResolver';
import { detectSurface, THEME_MAP } from './constants';
import { defaultTokens, defaultTypography, defaultEffects } from './defaults';

const THEME_MODE_KEY = 'grove-theme-mode';

interface ThemeContextValue {
  // Current state
  theme: Theme | null;
  surface: Surface;
  mode: Mode;
  tokens: ResolvedTokens;
  typography: Typography;
  effects: Effects;
  loading: boolean;

  // Actions
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: Mode;
}

/**
 * Convert tokens to CSS custom properties and inject into :root
 */
function injectCSSVariables(tokens: ResolvedTokens): void {
  const root = document.documentElement;

  // Background
  root.style.setProperty('--theme-bg-primary', tokens.background.primary);
  root.style.setProperty('--theme-bg-secondary', tokens.background.secondary);
  root.style.setProperty('--theme-bg-tertiary', tokens.background.tertiary);
  root.style.setProperty('--theme-bg-glass', tokens.background.glass);
  root.style.setProperty('--theme-bg-overlay', tokens.background.overlay);

  // Text
  root.style.setProperty('--theme-text-primary', tokens.text.primary);
  root.style.setProperty('--theme-text-secondary', tokens.text.secondary);
  root.style.setProperty('--theme-text-muted', tokens.text.muted);
  root.style.setProperty('--theme-text-accent', tokens.text.accent);
  root.style.setProperty('--theme-text-inverse', tokens.text.inverse);

  // Border
  root.style.setProperty('--theme-border-default', tokens.border.default);
  root.style.setProperty('--theme-border-strong', tokens.border.strong);
  root.style.setProperty('--theme-border-accent', tokens.border.accent);
  root.style.setProperty('--theme-border-focus', tokens.border.focus);

  // Semantic
  root.style.setProperty('--theme-success', tokens.semantic.success);
  root.style.setProperty('--theme-warning', tokens.semantic.warning);
  root.style.setProperty('--theme-error', tokens.semantic.error);
  root.style.setProperty('--theme-info', tokens.semantic.info);
  root.style.setProperty('--theme-highlight', tokens.semantic.highlight);

  // Accent
  root.style.setProperty('--theme-accent-primary', tokens.accent.primary);
  root.style.setProperty('--theme-accent-primary-muted', tokens.accent.primaryMuted);
  root.style.setProperty('--theme-accent-secondary', tokens.accent.secondary);
  root.style.setProperty('--theme-accent-glow', tokens.accent.glow);
}

export function ThemeProvider({ children, defaultMode = 'dark' }: ThemeProviderProps) {
  const location = useLocation();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setModeState] = useState<Mode>(() => {
    // Initialize from localStorage or default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_MODE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return defaultMode;
  });

  // Detect current surface from pathname
  const surface = useMemo(() => detectSurface(location.pathname), [location.pathname]);

  // Load theme when surface changes
  useEffect(() => {
    const loadTheme = async () => {
      setLoading(true);
      const themeUrl = THEME_MAP[surface];
      const loadedTheme = await themeResolver.loadTheme(themeUrl);
      setTheme(loadedTheme);
      setLoading(false);
    };

    loadTheme();
  }, [surface]);

  // Resolve tokens based on current theme and mode
  const tokens = useMemo(() => {
    return themeResolver.resolveTokens(theme, mode);
  }, [theme, mode]);

  // Get typography and effects
  const typography = useMemo(() => themeResolver.getTypography(theme), [theme]);
  const effects = useMemo(() => themeResolver.getEffects(theme), [theme]);

  // Inject CSS variables when tokens change
  useEffect(() => {
    injectCSSVariables(tokens);
  }, [tokens]);

  // Update document class for mode
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  // Set mode with persistence
  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  }, []);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    surface,
    mode,
    tokens,
    typography,
    effects,
    loading,
    setMode,
    toggleMode,
  }), [theme, surface, mode, tokens, typography, effects, loading, setMode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
