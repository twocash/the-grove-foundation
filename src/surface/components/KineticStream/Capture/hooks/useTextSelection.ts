// src/surface/components/KineticStream/Capture/hooks/useTextSelection.ts
// Text selection hook for sprout capture
// Sprint: kinetic-cultivation-v1, selection-model-fix-v1

import { useState, useLayoutEffect, useCallback, useRef, RefObject } from 'react';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';

/** Serializable rect for highlight rendering */
export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SelectionState {
  text: string;
  rect: DOMRect;
  /** All rects for multi-line selection highlights */
  rects: SelectionRect[];
  messageId: string;
  contextSpan: string;
  range: Range;
  capturedAt: number;
}

interface UseTextSelectionOptions {
  minLength?: number;
}

export interface UseTextSelectionResult {
  selection: SelectionState | null;
  lockSelection: () => void;
  unlockSelection: () => void;
  isLocked: boolean;
}

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  options: UseTextSelectionOptions = {}
): UseTextSelectionResult {
  const { minLength = SPROUT_CAPTURE_CONFIG.ui.selection.minLength } = options;

  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Track if user is currently making a selection (mousedown active)
  const isSelectingRef = useRef(false);

  // Capture the current selection - only called on mouseup
  const captureSelection = useCallback(() => {
    // Don't update if locked
    if (isLocked) return;

    const sel = window.getSelection();

    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < minLength) {
      setSelection(null);
      return;
    }

    // Check if selection is within container
    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    // Find message ID from closest data attribute
    const ancestorNode = range.commonAncestorContainer;
    const elementToSearch = ancestorNode.nodeType === Node.ELEMENT_NODE
      ? (ancestorNode as Element)
      : ancestorNode.parentElement;

    const messageElement = elementToSearch?.closest?.('[data-message-id]');
    const messageId = messageElement?.getAttribute('data-message-id');

    // Skip if no message ID (UI chrome selection)
    if (!messageId) {
      setSelection(null);
      return;
    }

    // Get bounding rect for pill positioning
    const rect = range.getBoundingClientRect();

    // Get all rects for multi-line highlight overlay (serialize to plain objects)
    const clientRects = range.getClientRects();
    const rects: SelectionRect[] = Array.from(clientRects).map(r => ({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    }));

    // Get context span (surrounding paragraph)
    const contextNode = messageElement?.closest('p') || messageElement;
    const contextSpan = contextNode?.textContent?.slice(0, 200) || '';

    setSelection({
      text,
      rect,
      rects,
      messageId,
      contextSpan,
      range: range.cloneRange(),
      capturedAt: Date.now(),
    });
  }, [containerRef, minLength, isLocked]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Track when selection starts (mousedown in container)
    const handleMouseDown = (e: MouseEvent) => {
      // Only track if clicking inside container and not on our UI elements
      const target = e.target as Element;
      if (container.contains(target) && !target.closest('[data-capture-ui]')) {
        isSelectingRef.current = true;
        // Clear existing selection when starting a new one
        if (!isLocked) {
          setSelection(null);
        }
      }
    };

    // Capture selection when mouse is released
    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelectingRef.current) return;
      isSelectingRef.current = false;

      // Small delay to let browser finalize selection
      requestAnimationFrame(() => {
        captureSelection();
      });
    };

    // Clear selection when clicking outside (but not on capture UI)
    const handleDocumentClick = (e: MouseEvent) => {
      if (isLocked) return;

      const target = e.target as Element;
      // Don't clear if clicking on capture UI elements
      if (target.closest('[data-capture-ui]')) return;

      // Don't clear if clicking inside container (might be starting new selection)
      if (container.contains(target)) return;

      // Clear selection when clicking outside
      setSelection(null);
    };

    // Handle keyboard-based selection (Shift+arrows, Ctrl+A, etc.)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isLocked) return;
      // If shift key was used (selection modification), capture after a brief delay
      if (e.shiftKey || e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        requestAnimationFrame(() => {
          captureSelection();
        });
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [containerRef, captureSelection, isLocked]);

  // Lock selection to prevent updates during capture flow
  const lockSelection = useCallback(() => {
    setIsLocked(true);
  }, []);

  // Unlock selection and clear state to resume normal behavior
  const unlockSelection = useCallback(() => {
    setIsLocked(false);
    setSelection(null);
  }, []);

  return { selection, lockSelection, unlockSelection, isLocked };
}
