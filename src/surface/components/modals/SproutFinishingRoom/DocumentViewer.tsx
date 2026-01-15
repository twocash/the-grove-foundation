// src/surface/components/modals/SproutFinishingRoom/DocumentViewer.tsx
// Sprint: S2-SFR-Display - US-C002 Render ResearchDocument via json-render

import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';
import {
  Renderer,
  ResearchRegistry,
  researchDocumentToRenderTree,
} from './json-render';

export interface DocumentViewerProps {
  sprout: Sprout;
}

/**
 * DocumentViewer - Center column (flex: 1)
 *
 * US-C002: Renders ResearchDocument via json-render when present.
 * Falls back to raw response display for non-research sprouts.
 *
 * US-C003: Raw JSON toggle (implemented here)
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ sprout }) => {
  // US-C003: Toggle between rendered and raw JSON view
  const [showRawJson, setShowRawJson] = useState(false);

  // Check if we have structured research data
  const hasResearchDocument = !!sprout.researchDocument;

  // Build render tree if we have research document
  const renderTree = hasResearchDocument
    ? researchDocumentToRenderTree(sprout.researchDocument!)
    : null;

  return (
    <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink flex flex-col">
      {/* US-C003: View toggle (only show if we have structured data) */}
      {hasResearchDocument && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-ink/10 dark:border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase">
            Research Document
          </span>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs font-mono px-2 py-1 rounded bg-ink/5 dark:bg-white/5 text-ink-muted dark:text-paper/50 hover:bg-ink/10 dark:hover:bg-white/10 transition-colors"
            aria-pressed={showRawJson}
          >
            {showRawJson ? '📄 Rendered' : '{ } JSON'}
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {hasResearchDocument ? (
          showRawJson ? (
            // US-C003: Raw JSON view
            <pre className="text-xs font-mono text-ink dark:text-paper/80 whitespace-pre-wrap bg-ink/5 dark:bg-white/5 p-4 rounded overflow-x-auto">
              {JSON.stringify(sprout.researchDocument, null, 2)}
            </pre>
          ) : (
            // US-C002: json-render view
            <Renderer tree={renderTree!} registry={ResearchRegistry} />
          )
        ) : (
          // Fallback: Raw response display for non-research sprouts
          <article className="prose prose-sm max-w-none text-ink dark:text-paper">
            {/* Query header */}
            <div className="mb-6 pb-4 border-b border-ink/10 dark:border-white/10">
              <p className="text-sm text-ink-muted dark:text-paper/60">
                <span className="font-mono text-xs uppercase mr-2">Query:</span>
                {sprout.query}
              </p>
            </div>

            {/* Raw response with whitespace preserved */}
            <div className="whitespace-pre-wrap leading-relaxed">
              {sprout.response}
            </div>
          </article>
        )}
      </div>
    </main>
  );
};

export default DocumentViewer;
