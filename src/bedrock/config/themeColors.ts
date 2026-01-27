// src/bedrock/config/themeColors.ts
// Centralized color registry for theme-aware color resolution
// Sprint: S25-GSE (GroveSkins Everywhere)
//
// Pattern: Config objects import CSS variable strings from here instead of
// hardcoding hex values. Each value is a CSS var() with a hex fallback,
// so it works in inline styles AND degrades gracefully without the theme provider.
//
// Usage:
//   import { themeColor } from '@bedrock/config/themeColors';
//   style={{ color: themeColor.forest }}
//   style={{ backgroundColor: themeColor.research + '20' }}  // with alpha suffix

// =============================================================================
// Theme-Aware Color Tokens
// =============================================================================

/**
 * CSS variable strings with hex fallbacks for inline styles.
 * These resolve to the active theme's colors at render time.
 *
 * Categories:
 * - Lens palette: persona colors for lens/persona badges
 * - Category: experience type and flag category badges
 * - Semantic: status indicators (success, warning, error, info)
 * - Chart: SVG stroke/fill colors for data visualization
 * - Accent: brand and highlight colors
 */
export const themeColor = {
  // === LENS / PERSONA PALETTE ===
  forest:  'var(--neon-green, #2F5C3B)',
  moss:    'var(--semantic-success, #7EA16B)',
  amber:   'var(--neon-amber, #E0A83B)',
  clay:    'var(--semantic-error, #D95D39)',
  slate:   'var(--glass-text-muted, #526F8A)',
  fig:     'var(--semantic-accent-secondary, #6B4B56)',
  stone:   'var(--glass-text-subtle, #9C9285)',

  // === CATEGORY BADGE COLORS ===
  /** Experience / system-prompt / journey */
  experience:   'var(--neon-green, #2F5C3B)',
  /** Research / prompt-architect / research-agent */
  research:     'var(--semantic-accent-secondary, #7E57C2)',
  /** Experimental / feature-flag */
  experimental: 'var(--semantic-error, #D95D39)',
  /** Internal / settings */
  internal:     'var(--glass-text-muted, #526F8A)',
  /** Writing / writer-agent */
  writing:      'var(--semantic-info, #26A69A)',
  /** Copilot / terminal */
  terminal:     'var(--neon-green, #00ff00)',
  /** Lifecycle / growth */
  lifecycle:    'var(--semantic-success, #8BC34A)',
  /** Advancement / progression */
  advancement:  'var(--semantic-success, #4CAF50)',
  /** Automation / jobs */
  automation:   'var(--semantic-info, #2196F3)',
  /** Templates / output */
  template:     'var(--neon-amber, #FF9800)',

  // === SEMANTIC STATUS ===
  success: 'var(--semantic-success)',
  warning: 'var(--semantic-warning)',
  error:   'var(--semantic-error)',
  info:    'var(--semantic-info)',
  accentSecondary: 'var(--semantic-accent-secondary)',

  // === ACCENT / BRAND ===
  accent:      'var(--neon-cyan)',
  accentWarm:  'var(--neon-amber)',
  accentGreen: 'var(--neon-green)',

  // === CHART / SVG COLORS ===
  chartPrimary:  'var(--neon-green, #2F5C3B)',
  chartSecondary: 'var(--semantic-info, #60a5fa)',

  // === CONFETTI / CELEBRATION ===
  confetti: [
    'var(--neon-green, #2F5C3B)',
    'var(--semantic-error, #D95D39)',
    'var(--neon-amber, #FFB800)',
    'var(--semantic-info, #60A5FA)',
    'var(--semantic-accent-secondary, #A78BFA)',
  ] as const,
} as const;

/**
 * Type for lens persona color keys.
 * Matches the PersonaColor type from narratives-schema.
 */
export type LensColorKey = 'forest' | 'moss' | 'amber' | 'clay' | 'slate' | 'fig' | 'stone';

/**
 * Maps a PersonaColor name to its theme-aware CSS variable string.
 * For use in LENS_COLOR_CONFIG and similar persona-color lookups.
 */
export function lensColor(color: LensColorKey): string {
  return themeColor[color];
}
