// src/bedrock/patterns/usePatchHistory.ts
// Undo/redo hook via inverse patches
// Sprint: bedrock-foundation-v1 (Epic 2, Story 2.3)

import { useState, useCallback, useMemo, useRef } from 'react';
import type { PatchOperation, PatchHistoryEntry } from '../types/copilot.types';
import type { GroveObject } from '../../core/schema/grove-object';

// =============================================================================
// Types
// =============================================================================

export interface UsePatchHistoryOptions {
  maxHistory?: number;
  objectId?: string;
}

export interface UsePatchHistoryReturn {
  // Apply a patch (adds to history)
  applyPatch: (
    operations: PatchOperation[],
    currentObject: GroveObject,
    source?: 'user' | 'copilot'
  ) => PatchOperation[];

  // Undo/redo
  undo: () => PatchOperation[] | null;
  redo: () => PatchOperation[] | null;

  // State
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  position: number;

  // Clear history (on object change)
  clearHistory: () => void;
}

interface HistoryState {
  entries: PatchHistoryEntry[];
  position: number; // Index of last applied entry, -1 means nothing applied
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get value at a JSON Pointer path from an object
 */
export function getValueAtPath(obj: unknown, path: string): unknown {
  // Remove leading slash and split
  const parts = path.replace(/^\//, '').split('/');

  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;

    // Handle array indices
    const index = parseInt(part, 10);
    if (Array.isArray(current) && !isNaN(index)) {
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Generate inverse patch operation for a given operation
 */
export function generateInversePatch(
  op: PatchOperation,
  currentObject: GroveObject
): PatchOperation {
  switch (op.op) {
    case 'replace': {
      const currentValue = getValueAtPath(currentObject, op.path);
      return { op: 'replace', path: op.path, value: currentValue };
    }

    case 'add': {
      return { op: 'remove', path: op.path };
    }

    case 'remove': {
      const currentValue = getValueAtPath(currentObject, op.path);
      return { op: 'add', path: op.path, value: currentValue };
    }

    default:
      return op;
  }
}

/**
 * Generate inverse patches for a batch of operations
 * Note: Operations are reversed to maintain correct undo order
 */
export function generateInversePatches(
  operations: PatchOperation[],
  currentObject: GroveObject
): PatchOperation[] {
  // Process in reverse order for correct undo behavior
  return operations
    .map(op => generateInversePatch(op, currentObject))
    .reverse();
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePatchHistory(
  options: UsePatchHistoryOptions = {}
): UsePatchHistoryReturn {
  const { maxHistory = 50, objectId } = options;

  // Combined state to avoid stale closure issues
  const [state, setState] = useState<HistoryState>({
    entries: [],
    position: -1,
  });

  // Use ref to access current state synchronously
  const stateRef = useRef(state);
  stateRef.current = state;

  // Clear history when object changes
  const clearHistory = useCallback(() => {
    setState({ entries: [], position: -1 });
  }, []);

  // Apply a patch and add to history
  const applyPatch = useCallback(
    (
      operations: PatchOperation[],
      currentObject: GroveObject,
      source: 'user' | 'copilot' = 'user'
    ): PatchOperation[] => {
      // Generate inverse operations before applying
      const inverse = generateInversePatches(operations, currentObject);

      const entry: PatchHistoryEntry = {
        forward: operations,
        inverse,
        timestamp: Date.now(),
        source,
        objectId: objectId || currentObject.meta.id,
      };

      setState(prev => {
        // If we're not at the end, truncate redo stack
        const base = prev.position < prev.entries.length - 1
          ? prev.entries.slice(0, prev.position + 1)
          : prev.entries;

        // Add new entry
        let newEntries = [...base, entry];

        // Enforce max history limit
        if (newEntries.length > maxHistory) {
          newEntries = newEntries.slice(newEntries.length - maxHistory);
        }

        return {
          entries: newEntries,
          position: newEntries.length - 1,
        };
      });

      return operations;
    },
    [maxHistory, objectId]
  );

  // Undo - returns inverse patch to apply
  const undo = useCallback((): PatchOperation[] | null => {
    const current = stateRef.current;

    if (current.position < 0 || current.entries.length === 0) {
      return null;
    }

    const result = current.entries[current.position].inverse;

    setState(prev => ({
      ...prev,
      position: prev.position - 1,
    }));

    return result;
  }, []);

  // Redo - returns forward patch to apply
  const redo = useCallback((): PatchOperation[] | null => {
    const current = stateRef.current;
    const nextPosition = current.position + 1;

    if (nextPosition >= current.entries.length) {
      return null;
    }

    const result = current.entries[nextPosition].forward;

    setState(prev => ({
      ...prev,
      position: prev.position + 1,
    }));

    return result;
  }, []);

  // Computed state
  const canUndo = useMemo(() => {
    return state.position >= 0;
  }, [state.position]);

  const canRedo = useMemo(() => {
    return state.position < state.entries.length - 1;
  }, [state.entries.length, state.position]);

  return {
    applyPatch,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: state.entries.length,
    position: state.position,
    clearHistory,
  };
}
