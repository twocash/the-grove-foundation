// tests/unit/explore-hooks.test.tsx
// Unit tests for explore data hooks
// Sprint: grove-data-layer-v1 (Epic 5)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { GroveDataProviderComponent } from '../../src/core/data';

// =============================================================================
// Test Setup
// =============================================================================

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Wrapper component for hooks that need GroveDataProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GroveDataProviderComponent>
    {children}
  </GroveDataProviderComponent>
);

// =============================================================================
// useLensPickerData Tests
// =============================================================================

describe('useLensPickerData', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('returns personas from data layer', async () => {
    // Dynamic import to avoid issues with context
    const { useLensPickerData } = await import('../../src/explore/hooks/useLensPickerData');

    const { result } = renderHook(() => useLensPickerData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have default personas
    expect(result.current.personas.length).toBeGreaterThan(0);
    expect(result.current.personas[0]).toHaveProperty('id');
    expect(result.current.personas[0]).toHaveProperty('publicLabel');
  });

  it('filters to enabled personas only', async () => {
    const { useLensPickerData } = await import('../../src/explore/hooks/useLensPickerData');

    const { result } = renderHook(() => useLensPickerData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // All personas should be enabled
    result.current.personas.forEach(persona => {
      expect(persona.enabled).toBe(true);
    });
  });

  it('provides refreshPersonas function', async () => {
    const { useLensPickerData } = await import('../../src/explore/hooks/useLensPickerData');

    const { result } = renderHook(() => useLensPickerData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refreshPersonas).toBe('function');
  });

  it('includes custom lenses array', async () => {
    const { useLensPickerData } = await import('../../src/explore/hooks/useLensPickerData');

    const { result } = renderHook(() => useLensPickerData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Custom lenses should be an array (may be empty)
    expect(Array.isArray(result.current.customLenses)).toBe(true);
  });
});

// =============================================================================
// useJourneyListData Tests
// =============================================================================

describe('useJourneyListData', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('returns journeys from data layer', async () => {
    const { useJourneyListData } = await import('../../src/explore/hooks/useJourneyListData');

    const { result } = renderHook(() => useJourneyListData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Journeys array should exist (may be empty if no defaults)
    expect(Array.isArray(result.current.journeys)).toBe(true);
  });

  it('provides getJourney function', async () => {
    const { useJourneyListData } = await import('../../src/explore/hooks/useJourneyListData');

    const { result } = renderHook(() => useJourneyListData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.getJourney).toBe('function');

    // Getting non-existent journey returns null
    expect(result.current.getJourney('non-existent')).toBeNull();
  });

  it('provides refreshJourneys function', async () => {
    const { useJourneyListData } = await import('../../src/explore/hooks/useJourneyListData');

    const { result } = renderHook(() => useJourneyListData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refreshJourneys).toBe('function');
  });
});

// =============================================================================
// Interface Compatibility Tests
// =============================================================================

describe('Interface Compatibility', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('useLensPickerData matches expected interface', async () => {
    const { useLensPickerData } = await import('../../src/explore/hooks/useLensPickerData');

    const { result } = renderHook(() => useLensPickerData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify interface shape
    expect(result.current).toHaveProperty('personas');
    expect(result.current).toHaveProperty('customLenses');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('refreshPersonas');
    expect(result.current).toHaveProperty('deleteCustomLens');
  });

  it('useJourneyListData matches expected interface', async () => {
    const { useJourneyListData } = await import('../../src/explore/hooks/useJourneyListData');

    const { result } = renderHook(() => useJourneyListData(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify interface shape
    expect(result.current).toHaveProperty('journeys');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('refreshJourneys');
    expect(result.current).toHaveProperty('getJourney');
  });
});
