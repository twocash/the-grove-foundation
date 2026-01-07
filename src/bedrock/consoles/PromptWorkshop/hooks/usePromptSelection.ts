// src/bedrock/consoles/PromptWorkshop/hooks/usePromptSelection.ts
// Selection state management for batch operations
// Sprint: prompt-refinement-v1

import { useState, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}

interface SelectOptions {
  /** If true, extend selection (range or additive) */
  shift?: boolean;
  /** If true, toggle selection without clearing others (Cmd/Ctrl+Click) */
  toggle?: boolean;
}

export interface UsePromptSelectionReturn {
  /** Set of currently selected IDs */
  selectedIds: Set<string>;
  /** Number of selected items */
  selectedCount: number;
  /** Last selected ID (for range selection) */
  lastSelectedId: string | null;
  /** Select/deselect an item */
  select: (id: string, options?: SelectOptions) => void;
  /** Select multiple items at once */
  selectAll: (ids: string[]) => void;
  /** Select a range between last selected and target (inclusive) */
  selectRange: (targetId: string, orderedIds: string[]) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if an item is selected */
  isSelected: (id: string) => boolean;
  /** Toggle selection for an item */
  toggleSelection: (id: string) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function usePromptSelection(): UsePromptSelectionReturn {
  const [state, setState] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
  });

  // Select/deselect a single item
  const select = useCallback((id: string, options?: SelectOptions) => {
    setState((prev) => {
      const newSet = new Set(prev.selectedIds);

      if (options?.toggle) {
        // Toggle mode: add or remove without clearing others
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      } else if (options?.shift) {
        // Shift mode: extend selection (handled by selectRange for full range)
        newSet.add(id);
      } else {
        // Default: single selection (clear others)
        newSet.clear();
        newSet.add(id);
      }

      return { selectedIds: newSet, lastSelectedId: id };
    });
  }, []);

  // Select a range between lastSelectedId and targetId
  const selectRange = useCallback((targetId: string, orderedIds: string[]) => {
    setState((prev) => {
      if (!prev.lastSelectedId) {
        // No previous selection, just select the target
        return { selectedIds: new Set([targetId]), lastSelectedId: targetId };
      }

      const startIndex = orderedIds.indexOf(prev.lastSelectedId);
      const endIndex = orderedIds.indexOf(targetId);

      if (startIndex === -1 || endIndex === -1) {
        // IDs not found in list, just select target
        return { selectedIds: new Set([targetId]), lastSelectedId: targetId };
      }

      // Select all IDs in range (inclusive)
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const rangeIds = orderedIds.slice(minIndex, maxIndex + 1);

      return {
        selectedIds: new Set([...prev.selectedIds, ...rangeIds]),
        lastSelectedId: targetId,
      };
    });
  }, []);

  // Select all provided IDs
  const selectAll = useCallback((ids: string[]) => {
    setState({
      selectedIds: new Set(ids),
      lastSelectedId: ids[ids.length - 1] || null,
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setState({ selectedIds: new Set(), lastSelectedId: null });
  }, []);

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => state.selectedIds.has(id),
    [state.selectedIds]
  );

  // Toggle selection for an item
  const toggleSelection = useCallback((id: string) => {
    setState((prev) => {
      const newSet = new Set(prev.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedIds: newSet, lastSelectedId: id };
    });
  }, []);

  // Global Escape key handler to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  return {
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.size,
    lastSelectedId: state.lastSelectedId,
    select,
    selectAll,
    selectRange,
    clearSelection,
    isSelected,
    toggleSelection,
  };
}

export default usePromptSelection;
