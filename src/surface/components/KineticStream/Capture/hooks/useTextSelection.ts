// src/surface/components/KineticStream/Capture/hooks/useTextSelection.ts
// Text selection hook for sprout capture
// Sprint: kinetic-cultivation-v1

import { useState, useLayoutEffect, useCallback, RefObject } from 'react';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';

export interface SelectionState {
  text: string;
  rect: DOMRect;
  messageId: string;
  contextSpan: string;
}

interface UseTextSelectionOptions {
  minLength?: number;
  debounceMs?: number;
}

export function useTextSelection(
  containerRef: RefObject<HTMLElement | null>,
  options: UseTextSelectionOptions = {}
): SelectionState | null {
  const {
    minLength = SPROUT_CAPTURE_CONFIG.ui.selection.minLength,
    debounceMs = SPROUT_CAPTURE_CONFIG.ui.selection.debounceMs
  } = options;

  const [selection, setSelection] = useState<SelectionState | null>(null);

  const handleSelectionChange = useCallback(() => {
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

    // Get context span (surrounding paragraph)
    const contextNode = messageElement?.closest('p') || messageElement;
    const contextSpan = contextNode?.textContent?.slice(0, 200) || '';

    setSelection({
      text,
      rect,
      messageId,
      contextSpan,
    });
  }, [containerRef, minLength]);

  useLayoutEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, debounceMs);
    };

    document.addEventListener('selectionchange', debouncedHandler);

    return () => {
      document.removeEventListener('selectionchange', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [handleSelectionChange, debounceMs]);

  // Clear on click outside
  useLayoutEffect(() => {
    const handleClick = () => {
      const sel = window.getSelection();
      if (sel?.isCollapsed) {
        setSelection(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return selection;
}
