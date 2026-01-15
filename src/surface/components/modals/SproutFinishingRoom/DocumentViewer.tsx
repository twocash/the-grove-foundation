// src/surface/components/modals/SproutFinishingRoom/DocumentViewer.tsx
// Sprint: S1-SFR-Shell - US-A002 Three-column layout (center placeholder)

import React from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface DocumentViewerProps {
  sprout: Sprout;
}

/**
 * DocumentViewer - Center column placeholder (flex: 1)
 *
 * Will be implemented in S2||SFR-Display to show:
 * - Full response content
 * - Markdown rendering
 * - Code highlighting
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ sprout }) => {
  return (
    <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink">
      {/* US-A002: Placeholder content */}
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-5xl mb-4 opacity-30">📄</div>
        <p className="text-sm text-ink-muted dark:text-paper/50 font-mono">
          Document Viewer (S2)
        </p>
        <p className="text-xs text-ink-muted/70 dark:text-paper/40 mt-2">
          Research content display
        </p>
      </div>
    </main>
  );
};

export default DocumentViewer;
