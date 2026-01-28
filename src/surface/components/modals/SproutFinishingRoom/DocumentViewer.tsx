// Sprint: S22-WP → S24-SFR sfr-garden-bridge-v1
// Tabbed viewer: RAW research via EvidenceRegistry, styled documents via ResearchRegistry,
// generated artifact version tabs, and Garden promotion display

import React, { useState, useMemo } from 'react';
import type { Sprout } from '@core/schema/sprout';
import type { ResearchDocument } from '@core/schema/research-document';
import type { GeneratedArtifact } from './SproutFinishingRoom';
import type { PromotionResult } from './garden-bridge';
import {
  Renderer,
  ResearchRegistry,
  PromotionRegistry,
  researchDocumentToRenderTree,
  promotionResultToRenderTree,
} from './json-render';
import { EvidenceRegistry } from './json-render/evidence-registry';
import {
  sproutSynthesisToRenderTree,
  sproutFullReportToRenderTree,
  sproutSourcesToRenderTree,
} from './json-render/evidence-transform';

export interface DocumentViewerProps {
  sprout: Sprout;
  /** S23-SFR v1.0: Generated artifacts for version tabs */
  generatedArtifacts?: GeneratedArtifact[];
  /** S23-SFR v1.0: Currently active artifact index (null = research view) */
  activeArtifactIndex?: number | null;
  /** S23-SFR v1.0: Callback when user selects an artifact tab (null = back to research) */
  onArtifactSelect?: (index: number | null) => void;
  /** S26-NUR: Save current artifact to Nursery (persist to sprout) */
  onSaveToNursery?: (document: ResearchDocument) => void;
  /** S26-NUR: Whether a save-to-nursery call is in flight */
  isSaving?: boolean;
  /** S24-SFR: Promote current artifact to Garden (seed tier) */
  onPromoteToGarden?: (document: ResearchDocument) => void;
  /** S24-SFR: Whether promotion API call is in flight */
  isPromoting?: boolean;
  /** S24-SFR: Result of successful promotion (null = not yet promoted) */
  promotionResult?: PromotionResult | null;
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
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  sprout,
  generatedArtifacts = [],
  activeArtifactIndex = null,
  onArtifactSelect,
  onSaveToNursery,
  isSaving = false,
  onPromoteToGarden,
  isPromoting = false,
  promotionResult = null,
}) => {
  // US-C003: Toggle between rendered and raw JSON view
  const [showRawJson, setShowRawJson] = useState(false);

  // S22-WP: Tab state - Full Report is the primary/default view (shows ALL content)
  const [activeTab, setActiveTab] = useState<'summary' | 'report' | 'sources'>('report');

  // S23-SFR v1.0: Whether we're viewing an artifact (version tab) or research
  const isViewingArtifact = activeArtifactIndex !== null && activeArtifactIndex < generatedArtifacts.length;
  const activeArtifact = isViewingArtifact ? generatedArtifacts[activeArtifactIndex!] : null;

  // Check what structured data we have
  // S22-WP: Prefer canonicalResearch (100% lossless) when available
  const hasCanonicalResearch = !!sprout.canonicalResearch?.title && !!sprout.canonicalResearch?.sources?.length;

  // S23-SFR: Detect corrupted canonical research (title exists but no content)
  // This happens when sprouts were saved during development before capture was working
  const hasCorruptedCanonicalResearch =
    !!sprout.canonicalResearch?.title &&
    (!sprout.canonicalResearch?.sections?.length || !sprout.canonicalResearch?.sources?.length);

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

  // S23-SFR v1.0: Build render tree for active artifact
  const artifactTree = useMemo(() => {
    if (!activeArtifact) return null;
    return researchDocumentToRenderTree(activeArtifact.document);
  }, [activeArtifact]);

  // S24-SFR: Build render tree for promotion confirmation card
  const promotionTree = useMemo(() => {
    if (!promotionResult) return null;
    return promotionResultToRenderTree(promotionResult);
  }, [promotionResult]);

  // Determine which mode to display
  const displayMode: 'research' | 'document' | 'fallback' = (() => {
    if (summaryTree || fullReportTree || sourcesTree) return 'research';
    if (documentTree) return 'document';
    return 'fallback';
  })();

  const hasStructuredData = displayMode !== 'fallback';

  // Check if tabs should be shown
  const showTabs = displayMode === 'research';

  /** Resolve which content to render for the main area, avoiding nested ternaries */
  function renderMainContent(): React.ReactNode {
    // S23-SFR v1.0: Artifact view takes priority when active
    if (isViewingArtifact && artifactTree) {
      return <Renderer tree={artifactTree} registry={ResearchRegistry} />;
    }

    if (displayMode === 'research') {
      if (showRawJson) {
        // S22-WP: Show canonicalResearch when available (100% lossless), otherwise legacy fields
        const jsonData = hasCanonicalResearch
          ? { canonicalResearch: sprout.canonicalResearch }
          : {
              researchBranches: sprout.researchBranches,
              researchEvidence: sprout.researchEvidence,
              researchSynthesis: sprout.researchSynthesis,
            };
        return (
          <pre className="text-xs font-mono text-[var(--glass-text-body)] whitespace-pre-wrap p-4 rounded overflow-x-auto" style={{ backgroundColor: 'var(--glass-elevated)' }}>
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        );
      }

      // Tab-based rendering with fallback chain
      const tabTreeMap: Record<string, ReturnType<typeof sproutSynthesisToRenderTree>> = {
        summary: summaryTree,
        report: fullReportTree,
        sources: sourcesTree,
      };
      const activeTree = tabTreeMap[activeTab];
      if (activeTree) {
        return <Renderer tree={activeTree} registry={EvidenceRegistry} />;
      }
      if (fullReportTree) {
        return <Renderer tree={fullReportTree} registry={EvidenceRegistry} />;
      }
      return (
        <div className="text-[var(--glass-text-muted)] text-sm">
          No research data available
        </div>
      );
    }

    if (displayMode === 'document') {
      if (showRawJson) {
        return (
          <pre className="text-xs font-mono text-[var(--glass-text-body)] whitespace-pre-wrap p-4 rounded overflow-x-auto" style={{ backgroundColor: 'var(--glass-elevated)' }}>
            {JSON.stringify(sprout.researchDocument, null, 2)}
          </pre>
        );
      }
      return <Renderer tree={documentTree!} registry={ResearchRegistry} />;
    }

    // Fallback mode
    if (hasCorruptedCanonicalResearch) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--semantic-warning-bg)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--semantic-warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-2">
            Research Data Incomplete
          </h3>
          <p className="text-sm text-[var(--glass-text-muted)] max-w-md mb-4">
            This sprout was saved with incomplete research data. The title exists but the full research content (sections and sources) was not captured.
          </p>
          <p className="text-xs text-[var(--glass-text-muted)] font-mono mb-4">
            Title: &ldquo;{sprout.canonicalResearch?.title?.slice(0, 60)}...&rdquo;
          </p>
          <p className="text-xs text-[var(--glass-text-muted)]">
            Re-run research on this query to capture the complete results.
          </p>
        </div>
      );
    }

    // Raw response display for non-research sprouts
    return (
      <article className="prose prose-sm max-w-none text-[var(--glass-text-body)]">
        <div className="mb-6 pb-4 border-b border-[var(--glass-border)]">
          <p className="text-sm text-[var(--glass-text-muted)]">
            <span className="font-mono text-xs mr-2">Query:</span>
            {sprout.query}
          </p>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed">
          {sprout.response}
        </div>
      </article>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: 'var(--glass-panel, transparent)' }}>
      {/* S23-SFR v1.0: Version tab bar - Research + generated artifact tabs */}
      {generatedArtifacts.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-[var(--glass-border)] flex items-center gap-1">
          <button
            onClick={() => onArtifactSelect?.(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !isViewingArtifact
                ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)]'
                : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)]'
            }`}
          >
            Research
          </button>
          {generatedArtifacts.map((artifact, idx) => (
            <button
              key={idx}
              onClick={() => onArtifactSelect?.(idx)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeArtifactIndex === idx
                  ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
                  : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-body)]'
              }`}
            >
              V{idx + 1}: {artifact.templateName}
            </button>
          ))}
        </div>
      )}

      {/* S22-WP: Header with three tabs and view toggle */}
      {hasStructuredData && !isViewingArtifact && (
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
            <span className="text-xs font-mono text-[var(--glass-text-muted)]">
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
        {renderMainContent()}
      </div>

      {/* S24-SFR: Promotion result card - shown after successful Garden promotion */}
      {isViewingArtifact && promotionResult && promotionTree && (
        <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--glass-border)]" style={{ backgroundColor: 'var(--glass-elevated)' }}>
          <Renderer tree={promotionTree} registry={PromotionRegistry} />
        </div>
      )}

      {/* S26-NUR: Artifact action bar — sequential lifecycle:
           1. Unsaved artifact → "Save to Nursery" (graft to sprout)
           2. Saved artifact   → "Promote to Garden" (publish to Garden) */}
      {isViewingArtifact && activeArtifact && !promotionResult && (
        <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--glass-border)] flex items-center justify-between" style={{ backgroundColor: 'var(--glass-elevated)' }}>
          <span className="text-sm text-[var(--glass-text-muted)]">
            V{(activeArtifactIndex ?? 0) + 1}: {activeArtifact.templateName}
          </span>
          {/* Step 1: Save to Nursery (artifact not yet grafted) */}
          {!activeArtifact.savedAt && onSaveToNursery && (
            <button
              onClick={() => onSaveToNursery(activeArtifact.document)}
              disabled={isSaving}
              className="py-2 px-6 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isSaving ? 'var(--glass-elevated)' : 'var(--neon-cyan, #06b6d4)',
                color: isSaving ? 'var(--glass-text-muted)' : '#ffffff',
              }}
            >
              {isSaving ? 'Saving...' : 'Save to Nursery'}
            </button>
          )}
          {/* Step 2: Promote to Garden (artifact already grafted) */}
          {activeArtifact.savedAt && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--glass-text-muted)]">
                Saved to {sprout.id.slice(0, 8)}
              </span>
              {onPromoteToGarden && (
                <button
                  onClick={() => onPromoteToGarden(activeArtifact.document)}
                  disabled={isPromoting}
                  className="py-2 px-6 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: isPromoting ? 'var(--glass-elevated)' : 'var(--semantic-success, #10b981)',
                    color: isPromoting ? 'var(--glass-text-muted)' : '#ffffff',
                  }}
                >
                  {isPromoting ? 'Promoting...' : 'Promote to Garden'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default DocumentViewer;
