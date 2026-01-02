// tests/integration/LensWorkshop.integration.test.ts
// Integration tests for Lens Workshop console
// Sprint: bedrock-foundation-v1 (Epic 8)

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollectionView } from '../../src/bedrock/patterns/useCollectionView';
import { usePatchHistory, generateInversePatches } from '../../src/bedrock/patterns/usePatchHistory';
import {
  parseSetCommand,
  validateLens,
  testLens,
  suggestLens,
} from '../../src/bedrock/consoles/LensWorkshop/LensCopilotActions';
import { lensWorkshopConfig } from '../../src/bedrock/consoles/LensWorkshop/LensWorkshop.config';
import type { Lens } from '../../src/bedrock/types/lens';

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockLens(overrides: Partial<Lens> = {}): Lens {
  return {
    meta: {
      id: 'test-lens-1',
      type: 'lens',
      title: 'Test Lens',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    payload: {
      name: 'Test Lens',
      description: 'A test lens for unit testing',
      category: 'role',
      filters: [],
      sortPriority: 50,
      isActive: true,
      iconEmoji: '🔍',
    },
    ...overrides,
  } as Lens;
}

function createMockLenses(): Lens[] {
  return [
    createMockLens({ meta: { id: 'lens-1', type: 'lens', title: 'Lens 1', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z' } }),
    createMockLens({
      meta: { id: 'lens-2', type: 'lens', title: 'Lens 2', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      payload: { name: 'Lens 2', description: 'Second lens', category: 'interest', filters: [], sortPriority: 30, isActive: false },
    }),
    createMockLens({
      meta: { id: 'lens-3', type: 'lens', title: 'Lens 3', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      payload: { name: 'Custom Lens', description: 'Custom category', category: 'custom', filters: [], sortPriority: 100, isActive: true },
    }),
  ];
}

// =============================================================================
// Configuration Tests
// =============================================================================

describe('LensWorkshop Configuration', () => {
  it('has required configuration fields', () => {
    expect(lensWorkshopConfig.id).toBe('lens-workshop');
    expect(lensWorkshopConfig.title).toBe('Lens Workshop');
    expect(lensWorkshopConfig.metrics).toHaveLength(4);
    expect(lensWorkshopConfig.navigation.length).toBeGreaterThan(0);
    expect(lensWorkshopConfig.collectionView).toBeDefined();
    expect(lensWorkshopConfig.copilot.enabled).toBe(true);
  });

  it('defines correct metric queries', () => {
    const metricIds = lensWorkshopConfig.metrics.map((m) => m.id);
    expect(metricIds).toContain('total');
    expect(metricIds).toContain('active');
    expect(metricIds).toContain('drafts');
    expect(metricIds).toContain('lastEdited');
  });

  it('has search fields configured', () => {
    expect(lensWorkshopConfig.collectionView.searchFields).toContain('meta.title');
    expect(lensWorkshopConfig.collectionView.searchFields).toContain('payload.name');
    expect(lensWorkshopConfig.collectionView.searchFields).toContain('payload.description');
  });
});

// =============================================================================
// Collection View Integration Tests
// =============================================================================

describe('Collection View Integration', () => {
  const collectionConfig = {
    searchFields: ['meta.title', 'payload.name', 'payload.description'],
    filterOptions: [],
    sortOptions: [
      { field: 'meta.title', label: 'Name' },
      { field: 'meta.updatedAt', label: 'Updated' },
    ],
    defaultSort: { field: 'meta.updatedAt', direction: 'desc' as const },
    favoritesStorageKey: 'test:favorites',
  };

  it('filters lenses by search query', () => {
    const lenses = createMockLenses();
    const { result } = renderHook(() => useCollectionView(lenses, collectionConfig));

    expect(result.current.results).toHaveLength(3);

    act(() => {
      result.current.setSearchQuery('Custom');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].payload.name).toBe('Custom Lens');
  });

  it('sorts lenses by field', () => {
    const lenses = createMockLenses();
    const { result } = renderHook(() => useCollectionView(lenses, collectionConfig));

    // Default sort is by updatedAt desc
    expect(result.current.sortField).toBe('meta.updatedAt');
    expect(result.current.sortDirection).toBe('desc');

    // Change to sort by title asc
    act(() => {
      result.current.setSort('meta.title', 'asc');
    });

    expect(result.current.sortField).toBe('meta.title');
    expect(result.current.sortDirection).toBe('asc');
  });

  it('tracks favorites', () => {
    const lenses = createMockLenses();
    const { result } = renderHook(() => useCollectionView(lenses, collectionConfig));

    expect(result.current.favorites.size).toBe(0);
    expect(result.current.isFavorite('lens-1')).toBe(false);

    act(() => {
      result.current.toggleFavorite('lens-1');
    });

    expect(result.current.favorites.size).toBe(1);
    expect(result.current.isFavorite('lens-1')).toBe(true);
  });

  it('shows only favorites when filter enabled', () => {
    const lenses = createMockLenses();
    const { result } = renderHook(() => useCollectionView(lenses, collectionConfig));

    act(() => {
      result.current.toggleFavorite('lens-2');
      result.current.setShowFavoritesOnly(true);
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].meta.id).toBe('lens-2');
  });
});

// =============================================================================
// Patch History Integration Tests
// =============================================================================

describe('Patch History Integration', () => {
  it('integrates with lens editing', () => {
    const lens = createMockLens();
    const { result } = renderHook(() => usePatchHistory());

    // Apply a name change
    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'Updated Name' }],
        lens,
        'user'
      );
    });

    expect(result.current.historyLength).toBe(1);
    expect(result.current.canUndo).toBe(true);

    // Undo should return inverse patch
    let undoPatch;
    act(() => {
      undoPatch = result.current.undo();
    });

    expect(undoPatch).toEqual([
      { op: 'replace', path: '/payload/name', value: 'Test Lens' },
    ]);
  });

  it('tracks copilot vs user edits', () => {
    const lens = createMockLens();
    const { result } = renderHook(() => usePatchHistory());

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/description', value: 'User edit' }],
        lens,
        'user'
      );
    });

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/isActive', value: false }],
        lens,
        'copilot'
      );
    });

    expect(result.current.historyLength).toBe(2);
  });
});

// =============================================================================
// Copilot Actions Tests
// =============================================================================

describe('Copilot Actions Integration', () => {
  describe('parseSetCommand', () => {
    it('parses name field', () => {
      const ops = parseSetCommand('set name to New Lens Name');
      expect(ops).toEqual([
        { op: 'replace', path: '/payload/name', value: 'New Lens Name' },
      ]);
    });

    it('parses description field', () => {
      const ops = parseSetCommand('set description to A detailed description');
      expect(ops).toEqual([
        { op: 'replace', path: '/payload/description', value: 'A detailed description' },
      ]);
    });

    it('parses active status as boolean', () => {
      const ops = parseSetCommand('set active to true');
      expect(ops).toEqual([
        { op: 'replace', path: '/payload/isActive', value: true },
      ]);
    });

    it('parses priority as number', () => {
      const ops = parseSetCommand('set priority to 75');
      expect(ops).toEqual([
        { op: 'replace', path: '/payload/sortPriority', value: 75 },
      ]);
    });

    it('returns null for unrecognized fields', () => {
      const ops = parseSetCommand('set unknown to value');
      expect(ops).toBeNull();
    });

    it('returns null for invalid format', () => {
      const ops = parseSetCommand('update name');
      expect(ops).toBeNull();
    });
  });

  describe('validateLens', () => {
    it('validates a valid lens', () => {
      const lens = createMockLens();
      const result = validateLens(lens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('catches missing name', () => {
      const lens = createMockLens({
        payload: { ...createMockLens().payload, name: '' },
      } as Partial<Lens>);
      const result = validateLens(lens);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('catches invalid sort priority', () => {
      const lens = createMockLens({
        payload: { ...createMockLens().payload, sortPriority: 150 },
      } as Partial<Lens>);
      const result = validateLens(lens);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Sort priority must be between 0 and 100');
    });
  });

  describe('testLens', () => {
    it('returns test results', () => {
      const lens = createMockLens();
      const results = testLens(lens);
      expect(results.length).toBe(3);
      expect(results[0]).toHaveProperty('query');
      expect(results[0]).toHaveProperty('matched');
      expect(results[0]).toHaveProperty('confidence');
      expect(results[0]).toHaveProperty('explanation');
    });

    it('shows lower confidence for draft lenses', () => {
      const draftLens = createMockLens({
        payload: { ...createMockLens().payload, isActive: false },
      } as Partial<Lens>);
      const results = testLens(draftLens);
      expect(results[0].confidence).toBeLessThan(0.5);
    });
  });

  describe('suggestLens', () => {
    it('suggests lens based on existing data', () => {
      const context = {
        consoleId: 'lens-workshop' as const,
        selectedLens: null,
        lenses: createMockLenses(),
      };
      const suggestion = suggestLens(context);
      expect(suggestion.name).toBe('Suggested Lens');
      expect(suggestion.category).toBeDefined();
      expect(suggestion.isActive).toBe(false);
    });
  });
});

// =============================================================================
// End-to-End Flow Tests
// =============================================================================

describe('End-to-End Flows', () => {
  it('complete CRUD flow with undo/redo', () => {
    const lenses = createMockLenses();
    const lens = lenses[0];
    const { result: collectionResult } = renderHook(() =>
      useCollectionView(lenses, {
        searchFields: ['meta.title', 'payload.name'],
        filterOptions: [],
        sortOptions: [],
        defaultSort: { field: 'meta.updatedAt', direction: 'desc' },
        favoritesStorageKey: 'test:favorites',
      })
    );

    const { result: historyResult } = renderHook(() => usePatchHistory());

    // Initial state
    expect(collectionResult.current.results).toHaveLength(3);

    // Edit a lens
    act(() => {
      historyResult.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'Edited Lens' }],
        lens,
        'user'
      );
    });

    expect(historyResult.current.canUndo).toBe(true);

    // Undo
    let undoPatch;
    act(() => {
      undoPatch = historyResult.current.undo();
    });

    expect(undoPatch).toEqual([
      { op: 'replace', path: '/payload/name', value: 'Test Lens' },
    ]);
    expect(historyResult.current.canRedo).toBe(true);

    // Redo
    let redoPatch;
    act(() => {
      redoPatch = historyResult.current.redo();
    });

    expect(redoPatch).toEqual([
      { op: 'replace', path: '/payload/name', value: 'Edited Lens' },
    ]);
  });

  it('copilot command to patch flow', () => {
    const lens = createMockLens();
    const { result: historyResult } = renderHook(() => usePatchHistory());

    // Parse copilot command
    const operations = parseSetCommand('set description to AI-generated description');
    expect(operations).not.toBeNull();

    // Apply the patch
    act(() => {
      historyResult.current.applyPatch(operations!, lens, 'copilot');
    });

    expect(historyResult.current.historyLength).toBe(1);

    // Undo the copilot change
    act(() => {
      historyResult.current.undo();
    });

    expect(historyResult.current.canRedo).toBe(true);
  });
});
