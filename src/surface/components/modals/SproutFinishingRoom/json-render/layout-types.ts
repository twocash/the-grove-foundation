// src/surface/components/modals/SproutFinishingRoom/json-render/layout-types.ts
// Sprint: S13-BD-LayoutDensity-v1 - Phase 1: Type System
// Pattern: Declarative layout density configuration for json-render

/**
 * LayoutDensity - Preset density levels for json-render components
 *
 * - compact: Minimal spacing, ideal for dense data displays
 * - comfortable: Default balanced spacing (recommended)
 * - spacious: Generous spacing for readability-focused layouts
 */
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * LayoutConfig - Configuration for json-render layout density
 *
 * Allows selecting a preset density and optionally overriding
 * specific spacing tokens for fine-grained control.
 *
 * @example
 * // Use preset only
 * { density: 'compact' }
 *
 * @example
 * // Override specific token
 * { density: 'comfortable', sectionGap: 'space-y-8' }
 */
export interface LayoutConfig {
  /** The base density preset to apply */
  density: LayoutDensity;
  /** Override container padding (Tailwind class, e.g., 'p-4') */
  containerPadding?: string;
  /** Override section gap (Tailwind class, e.g., 'space-y-4') */
  sectionGap?: string;
  /** Override card gap (Tailwind class, e.g., 'gap-4') */
  cardGap?: string;
}

/**
 * ResolvedLayout - Fully resolved layout values after preset + overrides
 *
 * This is the internal representation used by the Renderer.
 * All properties are guaranteed to have values.
 */
export interface ResolvedLayout {
  containerPadding: string;
  sectionGap: string;
  cardGap: string;
}
