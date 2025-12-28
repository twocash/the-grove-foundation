// components/Terminal/Stream/StreamingText.tsx
// Text that reveals character-by-character during streaming
// Sprint: kinetic-stream-polish-v1

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  characterDelay?: number;
  batchSize?: number;
  onComplete?: () => void;
  className?: string;
}

const DEFAULT_CHAR_DELAY = 50;
const DEFAULT_BATCH_SIZE = 3;

/**
 * Text that reveals character-by-character during streaming.
 * Respects reduced motion preference.
 */
export function StreamingText({
  content,
  isStreaming,
  characterDelay = DEFAULT_CHAR_DELAY,
  batchSize = DEFAULT_BATCH_SIZE,
  onComplete,
  className
}: StreamingTextProps) {
  const reducedMotion = useReducedMotion();
  const [displayedLength, setDisplayedLength] = useState(
    // Show all immediately if not streaming or reduced motion
    (!isStreaming || reducedMotion) ? content.length : 0
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const completedRef = useRef(false);

  useEffect(() => {
    // Reset when content changes
    if (!isStreaming || reducedMotion) {
      setDisplayedLength(content.length);
      return;
    }

    // Start from 0 for new streaming content
    setDisplayedLength(0);
    completedRef.current = false;

    // Character reveal loop
    intervalRef.current = setInterval(() => {
      setDisplayedLength(prev => {
        const next = Math.min(prev + batchSize, content.length);

        // Check if complete
        if (next >= content.length && !completedRef.current) {
          completedRef.current = true;
          clearInterval(intervalRef.current);
          onComplete?.();
        }

        return next;
      });
    }, characterDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, isStreaming, characterDelay, batchSize, onComplete, reducedMotion]);

  // Sync displayed length when content grows (during actual streaming)
  useEffect(() => {
    if (isStreaming && displayedLength > content.length) {
      setDisplayedLength(content.length);
    }
  }, [content.length, displayedLength, isStreaming]);

  const displayedText = content.slice(0, displayedLength);
  const showCursor = isStreaming && displayedLength < content.length;

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <motion.span
          className="streaming-cursor"
          animate={{ opacity: [1, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            ease: 'linear'
          }}
        >
          ▋
        </motion.span>
      )}
    </span>
  );
}

export default StreamingText;
