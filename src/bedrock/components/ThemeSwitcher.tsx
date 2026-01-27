// src/bedrock/components/ThemeSwitcher.tsx
// Theme switching component for GroveSkins
// Sprint: S4-SKIN-ZenithPaper

import React from 'react';
import { useSkin, THEME_REGISTRY } from '../context/BedrockUIContext';

// =============================================================================
// Types
// =============================================================================

interface ThemeSwitcherProps {
  /** Visual variant */
  variant?: 'compact' | 'full';
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Theme Metadata
// =============================================================================

interface ThemeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview: {
    bg: string;
    fg: string;
    accent: string;
  };
}

const THEME_INFO: Record<string, ThemeInfo> = {
  // S24-EMT: New v1.0 default themes
  'elegant-modern-v1': {
    id: 'elegant-modern-v1',
    name: 'Elegant Modern',
    description: 'Light theme with high contrast',
    icon: 'light_mode',
    preview: {
      bg: '#F9F8F6',
      fg: '#111111',
      accent: '#C66B3D',
    },
  },
  'elegant-dark-v1': {
    id: 'elegant-dark-v1',
    name: 'Elegant Dark',
    description: 'Warm charcoal night mode',
    icon: 'dark_mode',
    preview: {
      bg: '#191A1C',
      fg: '#EDEDED',
      accent: '#E09F3E',
    },
  },
  // Legacy themes
  'quantum-glass-v1': {
    id: 'quantum-glass-v1',
    name: 'Quantum Glass',
    description: 'Dark theme with glass morphism',
    icon: 'dark_mode',
    preview: {
      bg: '#030712',
      fg: '#ffffff',
      accent: '#06b6d4',
    },
  },
  'zenith-paper-v1': {
    id: 'zenith-paper-v1',
    name: 'Zenith Paper',
    description: 'Light theme with paper texture',
    icon: 'light_mode',
    preview: {
      bg: '#FBFBF9',
      fg: '#1C1C1C',
      accent: '#2F5C3B',
    },
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Theme switcher component for selecting GroveSkins.
 *
 * Variants:
 * - `compact`: Icon-only toggle between themes
 * - `full`: Full cards with theme previews
 *
 * Usage:
 * ```tsx
 * <ThemeSwitcher variant="compact" />
 * <ThemeSwitcher variant="full" />
 * ```
 */
export function ThemeSwitcher({
  variant = 'compact',
  className = '',
}: ThemeSwitcherProps) {
  const { skin, loadTheme, availableThemes } = useSkin();
  const currentThemeId = skin.id;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {availableThemes.map((themeId) => {
          const info = THEME_INFO[themeId];
          if (!info) return null;

          const isActive = currentThemeId === themeId;

          return (
            <button
              key={themeId}
              onClick={() => loadTheme(themeId)}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
                  : 'bg-white/5 text-[var(--glass-text-secondary)] hover:bg-white/10'
                }
              `}
              title={info.name}
            >
              <span className="material-symbols-outlined text-lg">
                {info.icon}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Full variant with theme cards
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {availableThemes.map((themeId) => {
        const info = THEME_INFO[themeId];
        if (!info) return null;

        const isActive = currentThemeId === themeId;

        return (
          <button
            key={themeId}
            onClick={() => loadTheme(themeId)}
            className={`
              relative p-3 rounded-xl border transition-all duration-200
              text-left
              ${isActive
                ? 'border-[var(--neon-cyan)]/50 bg-[var(--neon-cyan)]/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
              }
            `}
          >
            {/* Preview swatch */}
            <div
              className="w-full h-12 rounded-lg mb-3 border border-black/10 flex items-center justify-center"
              style={{ backgroundColor: info.preview.bg }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.preview.accent }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: info.preview.fg }}
                >
                  Aa
                </span>
              </div>
            </div>

            {/* Theme name */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--glass-text-secondary)]">
                {info.icon}
              </span>
              <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                {info.name}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-[var(--glass-text-secondary)] mt-1">
              {info.description}
            </p>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-2 right-2">
                <span className="material-symbols-outlined text-sm text-[var(--neon-cyan)]">
                  check_circle
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeSwitcher;
