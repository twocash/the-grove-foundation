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
 * Typography settings for rich font control
 * S17-SKIN-LivingGlass: High-end typography support
 */
export interface TypographySettings {
  family: string;
  weight?: string;
  tracking?: string;  // letter-spacing
  transform?: string; // text-transform
}

/**
 * Typography value can be a simple font stack or rich settings
 */
export type TypographyValue = string | TypographySettings;

/**
 * Typography tokens for font control across the UI
 */
export interface TypographyTokens {
  display?: TypographyValue;  // Hero/display text
  heading?: TypographyValue;  // Section headings
  body?: TypographyValue;     // Body text
  mono?: TypographyValue;     // Code/monospace
  ui?: TypographyValue;       // UI labels/buttons
}

/**
 * GroveSkin tokens structure
 * Maps to CSS variables for runtime injection
 */
/**
 * Semantic color tokens for status/state colors
 * S17-SKIN-LivingGlass: Theme-aware state colors
 */
export interface SemanticColorTokens {
  // Success colors (enabled, active, confirmed)
  success: string;        // Primary success text/border
  successBg: string;      // Success background (subtle)
  successBorder: string;  // Success border

  // Warning colors (unsaved, caution, pending)
  warning: string;        // Primary warning text/border
  warningBg: string;      // Warning background (subtle)
  warningBorder: string;  // Warning border

  // Error colors (delete, failed, required)
  error: string;          // Primary error text/border
  errorBg: string;        // Error background (subtle)
  errorBorder: string;    // Error border

  // Info colors (highlights, focus, informational)
  info: string;           // Primary info text/border
  infoBg: string;         // Info background (subtle)
  infoBorder: string;     // Info border

  // Secondary accent (special features, premium)
  accentSecondary: string;
  accentSecondaryBg: string;
  accentSecondaryBorder: string;
}

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

    // S17-SKIN-LivingGlass: Semantic state colors (optional for backward compat)
    semantic?: SemanticColorTokens;
  };
  effects: {
    blur: string;       // Backdrop blur amount
    radius: string;     // Border radius
    glow: string;       // Glow/shadow effect
  };
  // S17-SKIN-LivingGlass: Typography tokens
  typography?: TypographyTokens;
}

/**
 * Layout configuration for density-aware spacing
 */
export interface GroveSkinLayout {
  density: DensityTier;
  spacingScale: number;
}

/**
 * Color scheme determines Tailwind dark mode class.
 * This bridges GroveSkins CSS variables with Tailwind's dark: variants
 * used by json-render components.
 */
export type ColorScheme = 'dark' | 'light';

/**
 * GroveSkin - The complete skin definition
 *
 * This is the portable, versionable, AI-generatable configuration
 * that drives the entire visual appearance of the application.
 */
export interface GroveSkin {
  id: string;
  name: string;
  colorScheme: ColorScheme;  // Explicit dark/light for Tailwind dark mode sync
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
      // S17-SKIN-LivingGlass: Semantic state color CSS variables
      semantic: {
        success: '--semantic-success',
        successBg: '--semantic-success-bg',
        successBorder: '--semantic-success-border',
        warning: '--semantic-warning',
        warningBg: '--semantic-warning-bg',
        warningBorder: '--semantic-warning-border',
        error: '--semantic-error',
        errorBg: '--semantic-error-bg',
        errorBorder: '--semantic-error-border',
        info: '--semantic-info',
        infoBg: '--semantic-info-bg',
        infoBorder: '--semantic-info-border',
        accentSecondary: '--semantic-accent-secondary',
        accentSecondaryBg: '--semantic-accent-secondary-bg',
        accentSecondaryBorder: '--semantic-accent-secondary-border',
      },
    },
    effects: {
      blur: '--glass-blur',
      radius: '--radius-panel',
      glow: '--glow-ambient',
    },
    // S17-SKIN-LivingGlass: Typography CSS variables
    typography: {
      display: '--font-display',
      heading: '--font-heading',
      body: '--font-body',
      mono: '--font-mono',
      ui: '--font-ui',
    },
    typographyExtended: {
      display: { weight: '--font-display-weight', tracking: '--font-display-tracking', transform: '--font-display-transform' },
      heading: { weight: '--font-heading-weight', tracking: '--font-heading-tracking', transform: '--font-heading-transform' },
      body: { weight: '--font-body-weight', tracking: '--font-body-tracking', transform: '--font-body-transform' },
      mono: { weight: '--font-mono-weight', tracking: '--font-mono-tracking', transform: '--font-mono-transform' },
      ui: { weight: '--font-ui-weight', tracking: '--font-ui-tracking', transform: '--font-ui-transform' },
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
