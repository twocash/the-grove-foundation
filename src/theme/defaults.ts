// src/theme/defaults.ts
// Default theme tokens, typography, and effects

import type { TokenSet, Typography, Effects } from './tokens';

export const defaultTokens: TokenSet = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    glass: 'rgba(255, 255, 255, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    muted: '#64748b',
    accent: '#10b981',
    inverse: '#f8fafc',
  },
  border: {
    default: '#e2e8f0',
    strong: '#94a3b8',
    accent: '#10b981',
    focus: '#10b981',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    highlight: '#34d399',
  },
  accent: {
    primary: '#10b981',
    primaryMuted: 'rgba(16, 185, 129, 0.1)',
    secondary: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
};

export const defaultTypography: Typography = {
  display: ['Space Grotesk', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
  ui: ['Inter', 'sans-serif'],
};

export const defaultEffects: Effects = {
  grain: false,
  glow: false,
  gridOverlay: false,
  glassmorphism: false,
  scanlines: false,
};
