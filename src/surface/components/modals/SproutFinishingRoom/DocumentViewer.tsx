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

  // S23-SFR: Detect corrupted canonical research (title exists but no content)
  // This happens when sprouts were saved during development before capture was working
  const hasCorruptedCanonicalResearch =
    !!sprout.canonicalResearch?.title &&
    (!sprout.canonicalResearch?.sections?.length || !sprout.canonicalResearch?.sources?.length);

  // S23-SFR DEBUG: Log sprout structure to identify missing data
  console.log('[DocumentViewer] Sprout received:', {
    id: sprout.id,
    query: sprout.query?.substring(0, 50),
    hasCanonicalResearch,
    hasCorruptedCanonicalResearch,
    canonicalResearchKeys: sprout.canonicalResearch ? Object.keys(sprout.canonicalResearch) : [],
    canonicalTitle: sprout.canonicalResearch?.title,
    canonicalSectionsCount: sprout.canonicalResearch?.sections?.length || 0,
    canonicalSourcesCount: sprout.canonicalResearch?.sources?.length || 0,
    canonicalExecSummaryLength: sprout.canonicalResearch?.executive_summary?.length || 0,
  });

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
    const tree = hasResearchEvidence ? sproutFullReportToRenderTree(sprout) : null;
    // S23-SFR DEBUG: Log render tree structure
    console.log('[DocumentViewer] fullReportTree:', {
      hasTree: !!tree,
      childrenCount: tree?.children?.length || 0,
      childTypes: tree?.children?.map(c => c.type) || [],
    });
    return tree;
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

  // S23-SFR DEBUG: Log display mode decision
  console.log('[DocumentViewer] Display mode decision:', {
    displayMode,
    hasSummaryTree: !!summaryTree,
    hasFullReportTree: !!fullReportTree,
    hasSourcesTree: !!sourcesTree,
    hasDocumentTree: !!documentTree,
    hasResearchEvidence,
    hasCanonicalResearch,
    hasLegacyResearch,
    hasCorruptedCanonicalResearch,
  });

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
    <main className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: 'var(--glass-panel, transparent)' }}>
      {/* S22-WP: Header with three tabs and view toggle */}
      {hasStructuredData && (
        <div className="flex-shrink-0 px-6 py-3 border-b border-[var(--glass-border)] flex items-center justify-between">
          {/* Tab buttons (for research mode) */}
          {showTabs ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)]'
                    : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)]'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'report'
                    ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)]'
                    : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)]'
                }`}
              >
                Full Report
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'sources'
                    ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)]'
                    : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)]'
                }`}
              >
                Sources
              </button>
            </div>
          ) : (
            <span className="text-xs font-mono text-[var(--glass-text-muted)] uppercase">
              {displayMode === 'document' ? 'Styled Document' : 'Response'}
            </span>
          )}

          {/* JSON toggle */}
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs font-mono px-2 py-1 rounded bg-[var(--glass-elevated)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)] transition-colors"
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
        ) : hasCorruptedCanonicalResearch ? (
          // S23-SFR: Corrupted canonical research - title exists but no content
          // This happens with sprouts saved before the capture was fully working
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-8">
            <div className="w-16 h-16 rounded-full bg-grove-clay/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-grove-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink dark:text-paper mb-2">
              Research Data Incomplete
            </h3>
            <p className="text-sm text-ink-muted dark:text-paper/60 max-w-md mb-4">
              This sprout was saved with incomplete research data. The title exists but the full research content (sections and sources) was not captured.
            </p>
            <p className="text-xs text-ink-muted/60 dark:text-paper/40 font-mono mb-4">
              Title: "{sprout.canonicalResearch?.title?.slice(0, 60)}..."
            </p>
            <p className="text-xs text-ink-muted dark:text-paper/50">
              Re-run research on this query to capture the complete results.
            </p>
          </div>
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
