// tests/unit/usePatchHistory.test.ts
// Unit tests for usePatchHistory hook
// Sprint: bedrock-foundation-v1 (Epic 2, Story 2.3)

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePatchHistory,
  getValueAtPath,
  generateInversePatch,
  generateInversePatches,
} from '../../src/bedrock/patterns/usePatchHistory';
import type { GroveObject } from '../../src/core/schema/grove-object';
import type { PatchOperation } from '../../src/bedrock/types/copilot.types';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestObject(): GroveObject<{ name: string; description: string; count: number }> {
  return {
    meta: {
      id: 'test-1',
      type: 'lens',
      title: 'Test Lens',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    payload: {
      name: 'Original Name',
      description: 'Original Description',
      count: 10,
    },
  };
}

// =============================================================================
// getValueAtPath Tests
// =============================================================================

describe('getValueAtPath', () => {
  it('gets top-level value', () => {
    const obj = createTestObject();
    expect(getValueAtPath(obj, '/meta')).toEqual(obj.meta);
  });

  it('gets nested value', () => {
    const obj = createTestObject();
    expect(getValueAtPath(obj, '/payload/name')).toBe('Original Name');
  });

  it('gets deeply nested value', () => {
    const obj = createTestObject();
    expect(getValueAtPath(obj, '/meta/id')).toBe('test-1');
  });

  it('returns undefined for non-existent path', () => {
    const obj = createTestObject();
    expect(getValueAtPath(obj, '/payload/nonexistent')).toBeUndefined();
  });

  it('handles array indices', () => {
    const obj = { items: ['a', 'b', 'c'] };
    expect(getValueAtPath(obj, '/items/1')).toBe('b');
  });

  it('returns undefined for null values', () => {
    const obj = { value: null };
    expect(getValueAtPath(obj, '/value/nested')).toBeUndefined();
  });
});

// =============================================================================
// generateInversePatch Tests
// =============================================================================

describe('generateInversePatch', () => {
  it('generates correct inverse for replace operation', () => {
    const obj = createTestObject();
    const op: PatchOperation = {
      op: 'replace',
      path: '/payload/name',
      value: 'New Name',
    };

    const inverse = generateInversePatch(op, obj);

    expect(inverse).toEqual({
      op: 'replace',
      path: '/payload/name',
      value: 'Original Name',
    });
  });

  it('generates correct inverse for add operation', () => {
    const obj = createTestObject();
    const op: PatchOperation = {
      op: 'add',
      path: '/payload/newField',
      value: 'new value',
    };

    const inverse = generateInversePatch(op, obj);

    expect(inverse).toEqual({
      op: 'remove',
      path: '/payload/newField',
    });
  });

  it('generates correct inverse for remove operation', () => {
    const obj = createTestObject();
    const op: PatchOperation = {
      op: 'remove',
      path: '/payload/name',
    };

    const inverse = generateInversePatch(op, obj);

    expect(inverse).toEqual({
      op: 'add',
      path: '/payload/name',
      value: 'Original Name',
    });
  });
});

// =============================================================================
// generateInversePatches Tests
// =============================================================================

describe('generateInversePatches', () => {
  it('generates inverse patches in reverse order', () => {
    const obj = createTestObject();
    const ops: PatchOperation[] = [
      { op: 'replace', path: '/payload/name', value: 'New Name' },
      { op: 'replace', path: '/payload/description', value: 'New Description' },
    ];

    const inverse = generateInversePatches(ops, obj);

    expect(inverse).toHaveLength(2);
    // Should be in reverse order
    expect(inverse[0].path).toBe('/payload/description');
    expect(inverse[1].path).toBe('/payload/name');
  });

  it('handles empty operations array', () => {
    const obj = createTestObject();
    const inverse = generateInversePatches([], obj);
    expect(inverse).toEqual([]);
  });
});

// =============================================================================
// usePatchHistory Hook Tests
// =============================================================================

describe('usePatchHistory', () => {
  it('starts with empty history', () => {
    const { result } = renderHook(() => usePatchHistory());

    expect(result.current.historyLength).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('tracks applied patches', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'New Name' }],
        obj
      );
    });

    expect(result.current.historyLength).toBe(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo returns inverse patch', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'New Name' }],
        obj
      );
    });

    let undoPatch: PatchOperation[] | null = null;
    act(() => {
      undoPatch = result.current.undo();
    });

    expect(undoPatch).toEqual([
      { op: 'replace', path: '/payload/name', value: 'Original Name' },
    ]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo returns forward patch', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'New Name' }],
        obj
      );
    });

    act(() => {
      result.current.undo();
    });

    let redoPatch: PatchOperation[] | null = null;
    act(() => {
      redoPatch = result.current.redo();
    });

    expect(redoPatch).toEqual([
      { op: 'replace', path: '/payload/name', value: 'New Name' },
    ]);
  });

  it('respects max history limit', () => {
    const { result } = renderHook(() => usePatchHistory({ maxHistory: 3 }));
    const obj = createTestObject();

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.applyPatch(
          [{ op: 'replace', path: '/payload/count', value: i }],
          obj
        );
      }
    });

    expect(result.current.historyLength).toBe(3);
  });

  it('clears redo stack on new patch', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    // Apply two patches
    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'First' }],
        obj
      );
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'Second' }],
        obj
      );
    });

    // Undo both
    act(() => {
      result.current.undo();
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    // Apply new patch - should clear redo stack
    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'Third' }],
        obj
      );
    });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.historyLength).toBe(1);
  });

  it('clearHistory resets state', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'New' }],
        obj
      );
    });

    expect(result.current.historyLength).toBe(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.historyLength).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('tracks patch source (user vs copilot)', () => {
    const { result } = renderHook(() => usePatchHistory());
    const obj = createTestObject();

    act(() => {
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/name', value: 'User Edit' }],
        obj,
        'user'
      );
      result.current.applyPatch(
        [{ op: 'replace', path: '/payload/description', value: 'AI Edit' }],
        obj,
        'copilot'
      );
    });

    expect(result.current.historyLength).toBe(2);
  });
});
