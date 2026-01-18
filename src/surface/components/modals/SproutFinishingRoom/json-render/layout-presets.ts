// src/surface/components/modals/SproutFinishingRoom/json-render/layout-presets.ts
// Sprint: S13-BD-LayoutDensity-v1 - Phase 1: Density Presets
// Pattern: Tailwind class mappings for each density level

import type { LayoutDensity, ResolvedLayout } from './layout-types';

/**
 * DENSITY_PRESETS - Tailwind class mappings for each density level
 *
 * These presets define the spacing characteristics for each density:
 *
 * | Density     | Container | Sections  | Cards   |
 * |-------------|-----------|-----------|---------|
 * | compact     | p-3       | space-y-2 | gap-2   |
 * | comfortable | p-6       | space-y-4 | gap-4   |
 * | spacious    | p-8       | space-y-6 | gap-6   |
 *
 * Based on 4px grid (Tailwind's default spacing scale).
 */
export const DENSITY_PRESETS: Record<LayoutDensity, ResolvedLayout> = {
  compact: {
    containerPadding: 'p-3',
    sectionGap: 'space-y-2',
    cardGap: 'gap-2',
  },
  comfortable: {
    containerPadding: 'p-6',
    sectionGap: 'space-y-4',
    cardGap: 'gap-4',
  },
  spacious: {
    containerPadding: 'p-8',
    sectionGap: 'space-y-6',
    cardGap: 'gap-6',
  },
};

/**
 * DEFAULT_DENSITY - The default density when none is specified
 *
 * 'comfortable' is the recommended default as it balances
 * information density with visual breathing room.
 */
export const DEFAULT_DENSITY: LayoutDensity = 'comfortable';
