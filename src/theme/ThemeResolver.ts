// src/theme/ThemeResolver.ts
// Theme loading, caching, and resolution

import type { Theme, TokenSet, Mode, ResolvedTokens } from './tokens';
import { defaultTokens, defaultTypography, defaultEffects } from './defaults';

// In-memory cache for loaded themes
const themeCache = new Map<string, Theme>();

/**
 * Deep merge two objects, with source overriding target
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as object,
        sourceValue as object
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  }

  return result;
}

export class ThemeResolver {
  private static instance: ThemeResolver;

  private constructor() {}

  static getInstance(): ThemeResolver {
    if (!ThemeResolver.instance) {
      ThemeResolver.instance = new ThemeResolver();
    }
    return ThemeResolver.instance;
  }

  /**
   * Load a theme from a URL, with caching
   */
  async loadTheme(url: string): Promise<Theme | null> {
    // Check cache first
    if (themeCache.has(url)) {
      return themeCache.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[ThemeResolver] Failed to load theme: ${url}`);
        return null;
      }

      const theme = await response.json() as Theme;

      // Resolve inheritance if extends is specified
      if (theme.extends) {
        const parentTheme = await this.loadTheme(theme.extends);
        if (parentTheme) {
          // Merge parent tokens with child tokens
          theme.tokens = deepMerge(parentTheme.tokens as TokenSet, theme.tokens as TokenSet);
          if (theme.modes && parentTheme.modes) {
            if (theme.modes.light && parentTheme.modes.light) {
              theme.modes.light = deepMerge(parentTheme.modes.light as TokenSet, theme.modes.light as TokenSet);
            }
            if (theme.modes.dark && parentTheme.modes.dark) {
              theme.modes.dark = deepMerge(parentTheme.modes.dark as TokenSet, theme.modes.dark as TokenSet);
            }
          }
          if (!theme.typography && parentTheme.typography) {
            theme.typography = parentTheme.typography;
          }
          if (!theme.effects && parentTheme.effects) {
            theme.effects = parentTheme.effects;
          }
        }
      }

      themeCache.set(url, theme);
      return theme;
    } catch (error) {
      console.error(`[ThemeResolver] Error loading theme: ${url}`, error);
      return null;
    }
  }

  /**
   * Resolve tokens for a specific mode, merging with defaults
   */
  resolveTokens(theme: Theme | null, mode: Mode): ResolvedTokens {
    if (!theme) {
      return defaultTokens;
    }

    // Start with defaults
    let resolved = { ...defaultTokens };

    // Apply base theme tokens
    if (theme.tokens) {
      resolved = deepMerge(resolved, theme.tokens as TokenSet);
    }

    // Apply mode-specific overrides
    if (theme.modes && theme.modes[mode]) {
      resolved = deepMerge(resolved, theme.modes[mode] as TokenSet);
    }

    return resolved;
  }

  /**
   * Get typography settings from theme
   */
  getTypography(theme: Theme | null) {
    return theme?.typography || defaultTypography;
  }

  /**
   * Get effects settings from theme
   */
  getEffects(theme: Theme | null) {
    return theme?.effects || defaultEffects;
  }

  /**
   * Clear the theme cache
   */
  clearCache(): void {
    themeCache.clear();
  }
}

// Export singleton instance
export const themeResolver = ThemeResolver.getInstance();
