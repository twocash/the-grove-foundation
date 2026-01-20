// src/bedrock/types/GroveSkin.ts
// Type definition for GroveSkin theming system
// Sprint: S1-SKIN-HybridEngine

/**
 * Density tiers control spacing and padding throughout the UI.
 * - compact: Reduced spacing for data-dense views
 * - comfortable: Default balanced spacing
 * - spacious: Increased spacing for focus/presentation
 */
export type DensityTier = 'compact' | 'comfortable' | 'spacious';

/**
 * Provenance metadata for tracking skin origin
 */
export interface SkinProvenance {
  authorId: string;
  authorType: 'system' | 'user' | 'ai';
  createdAt: string;
  source: string;
  version: string;
}

/**
 * Color token with CSS variable mapping
 */
export interface ColorToken {
  cssVar: string;
  value: string;
  description?: string;
}

/**
 * GroveSkin tokens structure
 * Maps to CSS variables for runtime injection
 */
export interface GroveSkinTokens {
  colors: {
    // Semantic surface colors
    void: string;       // Deepest background (page body)
    panel: string;      // Semi-transparent panel
    solid: string;      // Opaque panel
    elevated: string;   // Elevated surface

    // Border colors
    border: string;     // Default border

    // Text colors
    foreground: string; // Primary text
    muted: string;      // Secondary/de-emphasized text

    // Accent colors
    accent: string;     // Primary accent (links, buttons)
    primary: string;    // Legacy primary

    // Semantic states (optional)
    canvas?: string;    // Light mode page background
  };
  effects: {
    blur: string;       // Backdrop blur amount
    radius: string;     // Border radius
    glow: string;       // Glow/shadow effect
  };
}

/**
 * Layout configuration for density-aware spacing
 */
export interface GroveSkinLayout {
  density: DensityTier;
  spacingScale: number;
}

/**
 * GroveSkin - The complete skin definition
 *
 * This is the portable, versionable, AI-generatable configuration
 * that drives the entire visual appearance of the application.
 */
export interface GroveSkin {
  id: string;
  name: string;
  provenance: SkinProvenance;
  tokens: GroveSkinTokens;
  layout: GroveSkinLayout;
}

/**
 * CSS Variable mapping for injection
 * Maps semantic token keys to CSS custom property names
 */
export const SKIN_CSS_MAP = {
  tokens: {
    colors: {
      void: '--glass-void',
      panel: '--glass-panel',
      solid: '--glass-solid',
      elevated: '--glass-elevated',
      border: '--glass-border',
      foreground: '--glass-text-primary',
      muted: '--glass-text-muted',
      accent: '--neon-cyan',
      primary: '--glass-text-primary',
      canvas: '--glass-canvas',
    },
    effects: {
      blur: '--glass-blur',
      radius: '--radius-panel',
      glow: '--glow-ambient',
    },
  },
} as const;

/**
 * Default density multipliers for spacing calculations
 */
export const DENSITY_MULTIPLIERS: Record<DensityTier, number> = {
  compact: 0.75,
  comfortable: 1.0,
  spacious: 1.25,
};

/**
 * Default density setting
 */
export const DEFAULT_DENSITY: DensityTier = 'comfortable';
