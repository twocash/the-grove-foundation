// src/surface/components/modals/SproutFinishingRoom/json-render/useResolvedLayout.ts
// Sprint: S13-BD-LayoutDensity-v1 - Phase 2: Layout Resolution Hook
// Pattern: Memoized layout resolution with preset defaults and token overrides

import { useMemo } from 'react';
import type { LayoutConfig, ResolvedLayout } from './layout-types';
import { DENSITY_PRESETS, DEFAULT_DENSITY } from './layout-presets';

/**
 * useResolvedLayout - Resolves layout configuration to concrete Tailwind classes
 *
 * Merges the density preset with any token overrides to produce
 * a fully resolved layout configuration. Memoized for performance.
 *
 * @param layout - Optional layout configuration
 * @returns ResolvedLayout with all spacing values
 *
 * @example
 * // Use default (comfortable)
 * const layout = useResolvedLayout();
 * // → { containerPadding: 'p-6', sectionGap: 'space-y-4', cardGap: 'gap-4' }
 *
 * @example
 * // Use compact preset
 * const layout = useResolvedLayout({ density: 'compact' });
 * // → { containerPadding: 'p-3', sectionGap: 'space-y-2', cardGap: 'gap-2' }
 *
 * @example
 * // Override specific token
 * const layout = useResolvedLayout({ density: 'comfortable', sectionGap: 'space-y-8' });
 * // → { containerPadding: 'p-6', sectionGap: 'space-y-8', cardGap: 'gap-4' }
 */
export function useResolvedLayout(layout?: LayoutConfig): ResolvedLayout {
  return useMemo(() => {
    // Determine density: use provided or default
    const density = layout?.density ?? DEFAULT_DENSITY;

    // Get the preset for this density
    const preset = DENSITY_PRESETS[density];

    // Merge preset with any overrides
    return {
      containerPadding: layout?.containerPadding ?? preset.containerPadding,
      sectionGap: layout?.sectionGap ?? preset.sectionGap,
      cardGap: layout?.cardGap ?? preset.cardGap,
    };
  }, [layout?.density, layout?.containerPadding, layout?.sectionGap, layout?.cardGap]);
}
