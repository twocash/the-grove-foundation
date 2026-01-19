// src/theme/mappings/quantum-glass.map.ts
// CSS variable mapping for Quantum Glass design system
// Sprint: S0-SKIN-QuantumAudit
// Source: styles/globals.css (Quantum Glass section, lines 566-632)

/**
 * Quantum Glass CSS Variable Map
 *
 * This file provides a TypeScript mapping of CSS variable names to semantic keys.
 * It enables type-safe access to design tokens and serves as documentation.
 *
 * IMPORTANT: This is a READ-ONLY mapping of existing CSS variables.
 * The actual values live in styles/globals.css - this file does NOT change behavior.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export type BackgroundToken =
  | 'void'
  | 'panel'
  | 'solid'
  | 'elevated';

export type BorderToken =
  | 'default'
  | 'hover'
  | 'active'
  | 'selected';

export type NeonToken =
  | 'green'
  | 'cyan'
  | 'amber'
  | 'violet';

export type TextToken =
  | 'primary'
  | 'secondary'
  | 'body'
  | 'muted'
  | 'subtle'
  | 'faint';

export type GlowToken =
  | 'green'
  | 'cyan'
  | 'ambient';

export type DurationToken =
  | 'fast'
  | 'normal'
  | 'slow';

export type DensityToken = 'compact' | 'comfortable' | 'spacious';

// =============================================================================
// CSS Variable Mappings
// =============================================================================

/**
 * Background color CSS variables
 */
export const BACKGROUND_VARS: Record<BackgroundToken, string> = {
  void: '--glass-void',
  panel: '--glass-panel',
  solid: '--glass-solid',
  elevated: '--glass-elevated',
} as const;

/**
 * Border color CSS variables
 */
export const BORDER_VARS: Record<BorderToken, string> = {
  default: '--glass-border',
  hover: '--glass-border-hover',
  active: '--glass-border-active',
  selected: '--glass-border-selected',
} as const;

/**
 * Neon accent color CSS variables
 */
export const NEON_VARS: Record<NeonToken, string> = {
  green: '--neon-green',
  cyan: '--neon-cyan',
  amber: '--neon-amber',
  violet: '--neon-violet',
} as const;

/**
 * Text color CSS variables (6-level scale)
 */
export const TEXT_VARS: Record<TextToken, string> = {
  primary: '--glass-text-primary',
  secondary: '--glass-text-secondary',
  body: '--glass-text-body',
  muted: '--glass-text-muted',
  subtle: '--glass-text-subtle',
  faint: '--glass-text-faint',
} as const;

/**
 * Glow effect CSS variables
 */
export const GLOW_VARS: Record<GlowToken, string> = {
  green: '--glow-green',
  cyan: '--glow-cyan',
  ambient: '--glow-ambient',
} as const;

/**
 * Animation duration CSS variables
 */
export const DURATION_VARS: Record<DurationToken, string> = {
  fast: '--duration-fast',
  normal: '--duration-normal',
  slow: '--duration-slow',
} as const;

/**
 * Easing function CSS variable
 */
export const EASING_VAR = '--ease-out-expo' as const;

// =============================================================================
// Complete Quantum Glass Map
// =============================================================================

/**
 * Complete mapping of all Quantum Glass CSS variables.
 * Use this for iteration, validation, or generating documentation.
 */
export const QUANTUM_GLASS_MAP = {
  backgrounds: BACKGROUND_VARS,
  borders: BORDER_VARS,
  neon: NEON_VARS,
  text: TEXT_VARS,
  glows: GLOW_VARS,
  durations: DURATION_VARS,
  easing: EASING_VAR,
} as const;

// =============================================================================
// Utility Types
// =============================================================================

export type QuantumGlassMap = typeof QUANTUM_GLASS_MAP;

/**
 * All CSS variable names used in Quantum Glass
 */
export type QuantumGlassCSSVar =
  | (typeof BACKGROUND_VARS)[BackgroundToken]
  | (typeof BORDER_VARS)[BorderToken]
  | (typeof NEON_VARS)[NeonToken]
  | (typeof TEXT_VARS)[TextToken]
  | (typeof GLOW_VARS)[GlowToken]
  | (typeof DURATION_VARS)[DurationToken]
  | typeof EASING_VAR;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get CSS variable reference string (e.g., 'var(--glass-void)')
 */
export function cssVar(varName: QuantumGlassCSSVar): string {
  return `var(${varName})`;
}

/**
 * Get all CSS variable names as a flat array
 */
export function getAllCSSVars(): QuantumGlassCSSVar[] {
  return [
    ...Object.values(BACKGROUND_VARS),
    ...Object.values(BORDER_VARS),
    ...Object.values(NEON_VARS),
    ...Object.values(TEXT_VARS),
    ...Object.values(GLOW_VARS),
    ...Object.values(DURATION_VARS),
    EASING_VAR,
  ];
}

// =============================================================================
// Density Configuration (for Task 0.3)
// =============================================================================

/**
 * Density multipliers for spacing adjustments.
 * These are MULTIPLIERS, not CSS variables - they're applied in JavaScript.
 */
export const DENSITY_MULTIPLIERS: Record<DensityToken, number> = {
  compact: 0.75,
  comfortable: 1.0,
  spacious: 1.25,
} as const;

/**
 * Default density (ensures non-breaking behavior)
 */
export const DEFAULT_DENSITY: DensityToken = 'comfortable';
