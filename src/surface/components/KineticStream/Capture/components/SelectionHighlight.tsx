// src/surface/components/KineticStream/Capture/components/SelectionHighlight.tsx
// Custom highlight overlay that persists during capture interactions
// Sprint: selection-model-fix-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { SelectionRect } from '../hooks/useTextSelection';

interface SelectionHighlightProps {
  /** Array of rects to highlight (from range.getClientRects()) */
  rects: SelectionRect[];
  /** Optional: scroll offset if container is scrollable */
  scrollOffset?: { x: number; y: number };
}

/**
 * SelectionHighlight - Renders a persistent highlight overlay over selected text
 *
 * This replaces the browser's native selection highlight which disappears
 * when focus shifts to capture UI elements. The overlay stays visible
 * throughout the entire capture flow, giving users confidence that their
 * selection is preserved.
 */
export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  rects,
  scrollOffset = { x: 0, y: 0 },
}) => {
  if (rects.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden="true"
      data-capture-ui="highlight"
    >
      {rects.map((rect, index) => (
        <motion.div
          key={`highlight-${index}`}
          className="absolute bg-[var(--neon-cyan)]/25 rounded-sm"
          style={{
            top: rect.top - scrollOffset.y,
            left: rect.left - scrollOffset.x,
            width: rect.width,
            height: rect.height,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      ))}
    </div>
  );
};

export default SelectionHighlight;
