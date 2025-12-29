// src/surface/components/KineticStream/hooks/useKineticScroll.ts
// Sticky-release scroll physics for streaming content
// Sprint: kinetic-scroll-v1

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';

const BOTTOM_THRESHOLD = 50; // pixels from bottom to consider "at bottom"

export interface UseKineticScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  showScrollButton: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}

export function useKineticScroll(
  deps: [number, number, string | null], // [items.length, contentLength, currentId]
  isStreaming: boolean
): UseKineticScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Track previous values to detect change type
  const prevItemsLength = useRef(deps[0]);
  const prevContentLength = useRef(deps[1]);

  // 1. Track User Scroll Intent
  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distToBottom = scrollHeight - clientHeight - scrollTop;
      const stuck = distToBottom < BOTTOM_THRESHOLD;

      setIsAtBottom(stuck);
      setShowScrollButton(!stuck && isStreaming);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isStreaming]);

  // Update FAB visibility when streaming state changes
  useEffect(() => {
    if (!isStreaming) {
      setShowScrollButton(false);
    } else if (!isAtBottom) {
      setShowScrollButton(true);
    }
  }, [isStreaming, isAtBottom]);

  // 2. The Magnet - Auto-scroll during streaming (Layout Effect prevents flicker)
  useLayoutEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || !isStreaming || !isAtBottom) return;

    // Determine scroll behavior based on change type
    const itemsChanged = deps[0] !== prevItemsLength.current;
    const contentChanged = deps[1] !== prevContentLength.current;

    // Update refs
    prevItemsLength.current = deps[0];
    prevContentLength.current = deps[1];

    if (itemsChanged || contentChanged) {
      // Use scrollTop directly for reliable nested container scrolling
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [deps, isStreaming, isAtBottom]);

  // 3. Manual scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    if (smooth) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  return {
    scrollRef,
    bottomRef,
    isAtBottom,
    showScrollButton,
    scrollToBottom,
  };
}
