// tests/unit/json-render/layout-density.test.ts
// Sprint: S13-BD-LayoutDensity-v1 - Unit tests for layout density system
// @vitest-environment jsdom

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  DENSITY_PRESETS,
  DEFAULT_DENSITY,
} from '../../../src/surface/components/modals/SproutFinishingRoom/json-render/layout-presets';
import { useResolvedLayout } from '../../../src/surface/components/modals/SproutFinishingRoom/json-render/useResolvedLayout';
import type {
  LayoutDensity,
  LayoutConfig,
  ResolvedLayout,
} from '../../../src/surface/components/modals/SproutFinishingRoom/json-render/layout-types';

// =============================================================================
// DENSITY_PRESETS Tests
// =============================================================================

describe('DENSITY_PRESETS', () => {
  test('has all three density levels', () => {
    expect(DENSITY_PRESETS).toHaveProperty('compact');
    expect(DENSITY_PRESETS).toHaveProperty('comfortable');
    expect(DENSITY_PRESETS).toHaveProperty('spacious');
  });

  test('compact preset has smallest spacing values', () => {
    const compact = DENSITY_PRESETS.compact;
    expect(compact.containerPadding).toBe('p-3');
    expect(compact.sectionGap).toBe('space-y-2');
    expect(compact.cardGap).toBe('gap-2');
  });

  test('comfortable preset has medium spacing values', () => {
    const comfortable = DENSITY_PRESETS.comfortable;
    expect(comfortable.containerPadding).toBe('p-6');
    expect(comfortable.sectionGap).toBe('space-y-4');
    expect(comfortable.cardGap).toBe('gap-4');
  });

  test('spacious preset has largest spacing values', () => {
    const spacious = DENSITY_PRESETS.spacious;
    expect(spacious.containerPadding).toBe('p-8');
    expect(spacious.sectionGap).toBe('space-y-6');
    expect(spacious.cardGap).toBe('gap-6');
  });

  test('all presets have all required properties', () => {
    const densities: LayoutDensity[] = ['compact', 'comfortable', 'spacious'];

    for (const density of densities) {
      const preset = DENSITY_PRESETS[density];
      expect(preset.containerPadding, `${density} missing containerPadding`).toBeTruthy();
      expect(preset.sectionGap, `${density} missing sectionGap`).toBeTruthy();
      expect(preset.cardGap, `${density} missing cardGap`).toBeTruthy();
    }
  });

  test('all presets use valid Tailwind class patterns', () => {
    const paddingRegex = /^p-\d+$/;
    const spaceRegex = /^space-y-\d+$/;
    const gapRegex = /^gap-\d+$/;

    const densities: LayoutDensity[] = ['compact', 'comfortable', 'spacious'];

    for (const density of densities) {
      const preset = DENSITY_PRESETS[density];
      expect(preset.containerPadding).toMatch(paddingRegex);
      expect(preset.sectionGap).toMatch(spaceRegex);
      expect(preset.cardGap).toMatch(gapRegex);
    }
  });
});

describe('DEFAULT_DENSITY', () => {
  test('is comfortable', () => {
    expect(DEFAULT_DENSITY).toBe('comfortable');
  });

  test('is a valid density key', () => {
    expect(DENSITY_PRESETS[DEFAULT_DENSITY]).toBeDefined();
  });
});

// =============================================================================
// useResolvedLayout Hook Tests
// =============================================================================

describe('useResolvedLayout', () => {
  describe('default behavior', () => {
    test('returns comfortable preset when no layout provided', () => {
      const { result } = renderHook(() => useResolvedLayout());

      expect(result.current).toEqual(DENSITY_PRESETS.comfortable);
    });

    test('returns comfortable preset when undefined layout provided', () => {
      const { result } = renderHook(() => useResolvedLayout(undefined));

      expect(result.current).toEqual(DENSITY_PRESETS.comfortable);
    });
  });

  describe('density presets', () => {
    test('returns compact preset', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'compact' })
      );

      expect(result.current).toEqual(DENSITY_PRESETS.compact);
    });

    test('returns comfortable preset', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'comfortable' })
      );

      expect(result.current).toEqual(DENSITY_PRESETS.comfortable);
    });

    test('returns spacious preset', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'spacious' })
      );

      expect(result.current).toEqual(DENSITY_PRESETS.spacious);
    });
  });

  describe('token overrides', () => {
    test('allows containerPadding override', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'comfortable', containerPadding: 'p-0' })
      );

      expect(result.current.containerPadding).toBe('p-0');
      expect(result.current.sectionGap).toBe('space-y-4'); // from preset
      expect(result.current.cardGap).toBe('gap-4'); // from preset
    });

    test('allows sectionGap override', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'compact', sectionGap: 'space-y-8' })
      );

      expect(result.current.containerPadding).toBe('p-3'); // from preset
      expect(result.current.sectionGap).toBe('space-y-8');
      expect(result.current.cardGap).toBe('gap-2'); // from preset
    });

    test('allows cardGap override', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'spacious', cardGap: 'gap-1' })
      );

      expect(result.current.containerPadding).toBe('p-8'); // from preset
      expect(result.current.sectionGap).toBe('space-y-6'); // from preset
      expect(result.current.cardGap).toBe('gap-1');
    });

    test('allows multiple overrides simultaneously', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({
          density: 'comfortable',
          containerPadding: 'p-0',
          sectionGap: 'space-y-6',
          cardGap: 'gap-8',
        })
      );

      expect(result.current.containerPadding).toBe('p-0');
      expect(result.current.sectionGap).toBe('space-y-6');
      expect(result.current.cardGap).toBe('gap-8');
    });
  });

  describe('memoization', () => {
    test('returns stable reference for same config', () => {
      const config: LayoutConfig = { density: 'compact' };
      const { result, rerender } = renderHook(() => useResolvedLayout(config));

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    test('returns new reference when density changes', () => {
      let config: LayoutConfig = { density: 'compact' };
      const { result, rerender } = renderHook(() => useResolvedLayout(config));

      const firstResult = result.current;
      config = { density: 'spacious' };
      rerender();
      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
    });
  });

  describe('real-world usage patterns', () => {
    test('AttributionDashboard pattern: spacious with no container padding', () => {
      // This is the pattern used in AttributionDashboard.tsx after migration
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'spacious', containerPadding: 'p-0' })
      );

      expect(result.current.containerPadding).toBe('p-0');
      expect(result.current.sectionGap).toBe('space-y-6');
      expect(result.current.cardGap).toBe('gap-6');
    });

    test('modal pattern: comfortable density for balanced spacing', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'comfortable' })
      );

      expect(result.current.containerPadding).toBe('p-6');
      expect(result.current.sectionGap).toBe('space-y-4');
      expect(result.current.cardGap).toBe('gap-4');
    });

    test('dashboard pattern: compact for data-dense displays', () => {
      const { result } = renderHook(() =>
        useResolvedLayout({ density: 'compact' })
      );

      expect(result.current.containerPadding).toBe('p-3');
      expect(result.current.sectionGap).toBe('space-y-2');
      expect(result.current.cardGap).toBe('gap-2');
    });
  });
});
