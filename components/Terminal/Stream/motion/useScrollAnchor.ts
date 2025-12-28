// components/Terminal/Stream/motion/useScrollAnchor.ts
// Smart scroll management hook
// Sprint: kinetic-stream-polish-v1

import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

export interface ScrollAnchorState {
  isAtBottom: boolean;
  isUserScrolling: boolean;
  shouldAutoScroll: boolean;
  newMessageCount: number;
}

interface UseScrollAnchorOptions {
  containerRef: RefObject<HTMLElement | null>;
  bottomThreshold?: number;
  debounceMs?: number;
}

interface UseScrollAnchorReturn {
  state: ScrollAnchorState;
  scrollToBottom: () => void;
  onNewMessage: () => void;
  resetAutoScroll: () => void;
}

const DEFAULT_THRESHOLD = 100; // pixels from bottom
const DEFAULT_DEBOUNCE = 100; // milliseconds

/**
 * Smart scroll management hook.
 * Auto-scrolls during generation but respects user scroll.
 */
export function useScrollAnchor({
  containerRef,
  bottomThreshold = DEFAULT_THRESHOLD,
  debounceMs = DEFAULT_DEBOUNCE
}: UseScrollAnchorOptions): UseScrollAnchorReturn {
  const [state, setState] = useState<ScrollAnchorState>({
    isAtBottom: true,
    isUserScrolling: false,
    shouldAutoScroll: true,
    newMessageCount: 0
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if scrolled to bottom (within threshold)
  const checkIfAtBottom = useCallback((): boolean => {
    const el = containerRef.current;
    if (!el) return true;

    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight < bottomThreshold;
  }, [containerRef, bottomThreshold]);

  // Scroll to bottom with smooth behavior
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });

    setState(prev => ({
      ...prev,
      isAtBottom: true,
      isUserScrolling: false,
      shouldAutoScroll: true,
      newMessageCount: 0
    }));
  }, [containerRef]);

  // Handle scroll events with debounce
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce scroll handling
      timeoutRef.current = setTimeout(() => {
        const atBottom = checkIfAtBottom();

        setState(prev => ({
          ...prev,
          isAtBottom: atBottom,
          isUserScrolling: !atBottom,
          shouldAutoScroll: atBottom,
          // Reset count if user scrolled to bottom
          newMessageCount: atBottom ? 0 : prev.newMessageCount
        }));
      }, debounceMs);
    };

    // Use passive listener for performance
    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, checkIfAtBottom, debounceMs]);

  // Called when new message arrives
  const onNewMessage = useCallback(() => {
    if (state.shouldAutoScroll) {
      // Auto-scroll to bottom
      scrollToBottom();
    } else {
      // Increment new message count
      setState(prev => ({
        ...prev,
        newMessageCount: prev.newMessageCount + 1
      }));
    }
  }, [state.shouldAutoScroll, scrollToBottom]);

  // Reset auto-scroll (alias for scrollToBottom)
  const resetAutoScroll = scrollToBottom;

  return {
    state,
    scrollToBottom,
    onNewMessage,
    resetAutoScroll
  };
}

export default useScrollAnchor;
