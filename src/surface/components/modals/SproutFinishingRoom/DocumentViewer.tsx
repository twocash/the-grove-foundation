// src/surface/components/modals/SproutFinishingRoom/DocumentViewer.tsx
// Sprint: S22-WP research-writer-panel-v1 (updated from S2-SFR-Display)
// Displays RAW research via EvidenceRegistry, OR styled document via ResearchRegistry
// S22-WP: Tabbed interface - Synthesis (main) and Evidence (secondary)

import React, { useState, useMemo } from 'react';
import type { Sprout } from '@core/schema/sprout';
import {
  Renderer,
  ResearchRegistry,
  researchDocumentToRenderTree,
} from './json-render';
import { EvidenceRegistry } from './json-render/evidence-registry';
import {
  sproutResearchToRenderTree,
  sproutSynthesisToRenderTree,
  sproutFullReportToRenderTree,
  sproutSourcesToRenderTree,
} from './json-render/evidence-transform';

export interface DocumentViewerProps {
  sprout: Sprout;
}

/**
 * DocumentViewer - Center column (flex: 1)
 *
 * S22-WP: Tabbed interface for research display:
 * - "Synthesis" tab (primary): AI-generated research synthesis
 * - "Evidence" tab (secondary): Raw sources and citations
 *
 * Display hierarchy:
 * 1. Tabbed research evidence via EvidenceRegistry
 * 2. Styled document via ResearchRegistry (Writer output)
 * 3. Fallback: raw response text
 *
 * US-C003: Raw JSON toggle (implemented here)
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ sprout }) => {
  // US-C003: Toggle between rendered and raw JSON view
  const [showRawJson, setShowRawJson] = useState(false);

  // S22-WP: Tab state - Full Report is the primary/default view (shows ALL content)
  const [activeTab, setActiveTab] = useState<'summary' | 'report' | 'sources'>('report');

  // Check what structured data we have
  // S22-WP: Prefer canonicalResearch (100% lossless) when available
  const hasCanonicalResearch = !!sprout.canonicalResearch?.title && !!sprout.canonicalResearch?.sources?.length;
  const hasLegacyResearch =
    !!sprout.researchBranches?.length ||
    !!sprout.researchEvidence?.length ||
    !!sprout.researchSynthesis;
  const hasResearchEvidence = hasCanonicalResearch || hasLegacyResearch;
  const hasResearchDocument = !!sprout.researchDocument;

  // S22-WP: Build separate render trees for each tab
  // Summary: Just the synthesis/executive summary
  const summaryTree = useMemo(() => {
    return hasResearchEvidence ? sproutSynthesisToRenderTree(sprout) : null;
  }, [sprout, hasResearchEvidence]);

  // Full Report: The COMPLETE research synthesis/analysis (main content user waited for)
  const fullReportTree = useMemo(() => {
    return hasResearchEvidence ? sproutFullReportToRenderTree(sprout) : null;
  }, [sprout, hasResearchEvidence]);

  // Sources: Just the citation cards
  const sourcesTree = useMemo(() => {
    return hasResearchEvidence ? sproutSourcesToRenderTree(sprout) : null;
  }, [sprout, hasResearchEvidence]);

  const documentTree = hasResearchDocument
    ? researchDocumentToRenderTree(sprout.researchDocument!)
    : null;

  // Determine which mode to display
  const displayMode: 'research' | 'document' | 'fallback' =
    (summaryTree || fullReportTree || sourcesTree)
      ? 'research'
      : documentTree
        ? 'document'
        : 'fallback';

  const hasStructuredData = displayMode !== 'fallback';

  // Check if tabs should be shown
  const showTabs = displayMode === 'research';

  // Tab labels for display
  const tabLabels = {
    summary: 'Summary',
    report: 'Full Report',
    sources: 'Sources',
  };

  return (
    <main className="flex-1 overflow-y-auto bg-paper dark:bg-ink flex flex-col">
      {/* S22-WP: Header with three tabs and view toggle */}
      {hasStructuredData && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-ink/10 dark:border-white/10 flex items-center justify-between">
          {/* Tab buttons (for research mode) */}
          {showTabs ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-grove-forest text-paper'
                    : 'text-ink-muted dark:text-paper/50 hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'bg-grove-forest text-paper'
                    : 'text-ink-muted dark:text-paper/50 hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                Full Report
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'sources'
                    ? 'bg-grove-forest text-paper'
                    : 'text-ink-muted dark:text-paper/50 hover:bg-ink/5 dark:hover:bg-white/10'
                }`}
              >
                Sources
              </button>
            </div>
          ) : (
            <span className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase">
              {displayMode === 'document' ? 'Styled Document' : 'Response'}
            </span>
          )}

          {/* JSON toggle */}
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
        {displayMode === 'research' ? (
          showRawJson ? (
            // Raw JSON view of evidence data
            // S22-WP: Show canonicalResearch when available (100% lossless), otherwise legacy fields
            <pre className="text-xs font-mono text-ink dark:text-paper/80 whitespace-pre-wrap bg-ink/5 dark:bg-white/5 p-4 rounded overflow-x-auto">
              {JSON.stringify(
                hasCanonicalResearch
                  ? { canonicalResearch: sprout.canonicalResearch }
                  : {
                      researchBranches: sprout.researchBranches,
                      researchEvidence: sprout.researchEvidence,
                      researchSynthesis: sprout.researchSynthesis,
                    },
                null,
                2
              )}
            </pre>
          ) : activeTab === 'summary' && summaryTree ? (
            // S22-WP: Summary tab - executive overview
            <Renderer tree={summaryTree} registry={EvidenceRegistry} />
          ) : activeTab === 'report' && fullReportTree ? (
            // S22-WP: Full Report tab - ALL the content
            <Renderer tree={fullReportTree} registry={EvidenceRegistry} />
          ) : activeTab === 'sources' && sourcesTree ? (
            // S22-WP: Sources tab - citation cards only
            <Renderer tree={sourcesTree} registry={EvidenceRegistry} />
          ) : fullReportTree ? (
            // Fallback to full report
            <Renderer tree={fullReportTree} registry={EvidenceRegistry} />
          ) : (
            // Should not reach here but handle gracefully
            <div className="text-ink-muted dark:text-paper/50 text-sm">
              No research data available
            </div>
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
