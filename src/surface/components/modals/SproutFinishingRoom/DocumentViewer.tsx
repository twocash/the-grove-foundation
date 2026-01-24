// src/surface/components/modals/SproutFinishingRoom/DocumentViewer.tsx
// Sprint: S22-WP research-writer-panel-v1 (updated from S2-SFR-Display)
// Displays RAW research via EvidenceRegistry, OR styled document via ResearchRegistry

import React, { useState } from 'react';
import type { Sprout } from '@core/schema/sprout';
import {
  Renderer,
  ResearchRegistry,
  researchDocumentToRenderTree,
} from './json-render';
import { EvidenceRegistry } from './json-render/evidence-registry';
import { sproutResearchToRenderTree } from './json-render/evidence-transform';

export interface DocumentViewerProps {
  sprout: Sprout;
}

/**
 * DocumentViewer - Center column (flex: 1)
 *
 * S22-WP: Display hierarchy (priority order):
 * 1. Raw research evidence via EvidenceRegistry (user SEES all their research)
 * 2. Styled document via ResearchRegistry (Writer output)
 * 3. Fallback: raw response text
 *
 * US-C003: Raw JSON toggle (implemented here)
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ sprout }) => {
  // US-C003: Toggle between rendered and raw JSON view
  const [showRawJson, setShowRawJson] = useState(false);

  // Check what structured data we have
  const hasResearchEvidence =
    !!sprout.researchBranches?.length ||
    !!sprout.researchEvidence?.length ||
    !!sprout.researchSynthesis;
  const hasResearchDocument = !!sprout.researchDocument;

  // Build render tree based on available data
  // Priority: Evidence (raw research) > Document (Writer output)
  const evidenceTree = hasResearchEvidence
    ? sproutResearchToRenderTree(sprout)
    : null;
  const documentTree = hasResearchDocument
    ? researchDocumentToRenderTree(sprout.researchDocument!)
    : null;

  // Determine which mode to display
  const displayMode: 'evidence' | 'document' | 'fallback' = evidenceTree
    ? 'evidence'
    : documentTree
      ? 'document'
      : 'fallback';

  const hasStructuredData = displayMode !== 'fallback';

  // Determine label for the header
  const modeLabel =
    displayMode === 'evidence'
      ? 'Research Evidence'
      : displayMode === 'document'
        ? 'Styled Document'
        : 'Response';

  return (
    <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink flex flex-col">
      {/* US-C003: View toggle (only show if we have structured data) */}
      {hasStructuredData && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-ink/10 dark:border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase">
            {modeLabel}
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
        {displayMode === 'evidence' ? (
          showRawJson ? (
            // Raw JSON view of evidence data
            <pre className="text-xs font-mono text-ink dark:text-paper/80 whitespace-pre-wrap bg-ink/5 dark:bg-white/5 p-4 rounded overflow-x-auto">
              {JSON.stringify(
                {
                  researchBranches: sprout.researchBranches,
                  researchEvidence: sprout.researchEvidence,
                  researchSynthesis: sprout.researchSynthesis,
                },
                null,
                2
              )}
            </pre>
          ) : (
            // S22-WP: Evidence display via EvidenceRegistry
            <Renderer tree={evidenceTree!} registry={EvidenceRegistry} />
          )
        ) : displayMode === 'document' ? (
          showRawJson ? (
            // Raw JSON view of document
            <pre className="text-xs font-mono text-ink dark:text-paper/80 whitespace-pre-wrap bg-ink/5 dark:bg-white/5 p-4 rounded overflow-x-auto">
              {JSON.stringify(sprout.researchDocument, null, 2)}
            </pre>
          ) : (
            // Styled document via ResearchRegistry
            <Renderer tree={documentTree!} registry={ResearchRegistry} />
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
