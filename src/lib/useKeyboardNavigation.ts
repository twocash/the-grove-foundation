// src/lib/useKeyboardNavigation.ts
// Keyboard navigation hook for grid-based views

import { useEffect, useCallback, useState } from 'react';

export interface UseKeyboardNavigationOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelect?: (item: T) => void;
  onActivate?: (item: T) => void;
  enabled?: boolean;
  columns?: number; // For grid navigation (default: 2)
}

export interface UseKeyboardNavigationReturn<T> {
  selectedIndex: number;
  selectedId: string | null;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isSelected: (item: T) => boolean;
}

export function useKeyboardNavigation<T>({
  items,
  getItemId,
  onSelect,
  onActivate,
  enabled = true,
  columns = 2,
}: UseKeyboardNavigationOptions<T>): UseKeyboardNavigationReturn<T> {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [items.length]);

  const selectedId = selectedIndex >= 0 && selectedIndex < items.length
    ? getItemId(items[selectedIndex])
    : null;

  const isSelected = useCallback(
    (item: T) => getItemId(item) === selectedId,
    [getItemId, selectedId]
  );

  const moveSelection = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (items.length === 0) return;

      setSelectedIndex((prev) => {
        // If nothing selected, start from first item
        if (prev < 0) return 0;

        let next = prev;
        const rows = Math.ceil(items.length / columns);
        const currentRow = Math.floor(prev / columns);
        const currentCol = prev % columns;

        switch (direction) {
          case 'up':
            if (currentRow > 0) {
              next = prev - columns;
            }
            break;
          case 'down':
            if (currentRow < rows - 1 && prev + columns < items.length) {
              next = prev + columns;
            }
            break;
          case 'left':
            if (prev > 0) {
              next = prev - 1;
            }
            break;
          case 'right':
            if (prev < items.length - 1) {
              next = prev + 1;
            }
            break;
        }

        // Call onSelect when selection changes
        if (next !== prev && onSelect && items[next]) {
          onSelect(items[next]);
        }

        return next;
      });
    },
    [items, columns, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveSelection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveSelection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveSelection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveSelection('right');
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length && onActivate) {
            onActivate(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedIndex(-1);
          break;
        case 'Home':
          e.preventDefault();
          if (items.length > 0) {
            setSelectedIndex(0);
            if (onSelect && items[0]) {
              onSelect(items[0]);
            }
          }
          break;
        case 'End':
          e.preventDefault();
          if (items.length > 0) {
            const lastIndex = items.length - 1;
            setSelectedIndex(lastIndex);
            if (onSelect && items[lastIndex]) {
              onSelect(items[lastIndex]);
            }
          }
          break;
      }
    },
    [enabled, moveSelection, selectedIndex, items, onActivate, onSelect]
  );

  // Global keyboard listener for when container is focused
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      // Handle navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        moveSelection(
          e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
        );
      }
    };

    // Don't add global listener - let components handle it via handleKeyDown
    // window.addEventListener('keydown', handleGlobalKeyDown);
    // return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enabled, moveSelection]);

  return {
    selectedIndex,
    selectedId,
    setSelectedIndex,
    handleKeyDown,
    isSelected,
  };
}
