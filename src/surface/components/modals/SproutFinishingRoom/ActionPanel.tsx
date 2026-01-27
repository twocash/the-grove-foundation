// Sprint: S22-WP → S23-SFR v1.0
// Right column: WriterPanel workflow + export actions

import React, { useState, useCallback, useMemo } from 'react';
import type { Sprout } from '@core/schema/sprout';
import type { ResearchDocument } from '@core/schema/research-document';
import { useEngagementEmit } from '../../../../../hooks/useEngagementBus';
import { useSproutStorage } from '../../../../../hooks/useSproutStorage';
import { useSproutSignals } from '../../../hooks/useSproutSignals';
import { useToast } from '@explore/context/ToastContext';
import { WriterPanel } from './components/WriterPanel';
import { buildCognitiveRouting } from '@core/schema/cognitive-routing';

/**
 * Extract a human-readable title from a URL or reference string.
 * Sprint: research-template-wiring-v1
 */
function extractTitleFromSource(source: string): string {
  if (!source) return 'Unknown Source';

  try {
    const url = new URL(source);
    const domain = url.hostname.replace('www.', '');
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.(html?|php|aspx?)$/i, '');
      return `${domain}: ${lastPart}`;
    }
    return domain;
  } catch {
    return source.length > 50 ? source.slice(0, 47) + '...' : source;
  }
}

/** Map a single evidence item to the source format expected by EvidenceBundle */
function evidenceToSource(ev: { source: string; content: string; collectedAt?: string; sourceType?: string }) {
  return {
    url: ev.source || '',
    title: extractTitleFromSource(ev.source),
    snippet: ev.content,
    accessedAt: ev.collectedAt || new Date().toISOString(),
    sourceType: ev.sourceType as 'academic' | 'practitioner' | 'news' | 'primary' | undefined,
  };
}

export interface ActionPanelProps {
  sprout: Sprout;
  onClose?: () => void; // Optional - kept for interface compatibility
  onSproutUpdate?: (sprout: Sprout) => void;
  /** S23-SFR v1.0: Route generated document to center column as artifact tab */
  onDocumentGenerated?: (document: ResearchDocument, templateId: string, templateName: string) => void;
}

/**
 * ActionPanel - Right column (320px fixed)
 *
 * Sprint: S22-WP - Simplified for v1.0 release
 *
 * Primary workflow via WriterPanel:
 * 1. User selects Writer template from visual grid
 * 2. User adds optional notes for context
 * 3. User clicks Generate → Writer Agent runs
 * 4. Preview shows generated document
 * 5. User can Save to Nursery
 *
 * Secondary action:
 * - Export to Markdown
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({
  sprout,
  onSproutUpdate,
  onDocumentGenerated,
}) => {
  const emit = useEngagementEmit();
  const { updateSprout, getSprout } = useSproutStorage();
  const signals = useSproutSignals();
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // S6-SL-ObservableSignals: Stable provenance object from sprout
  const provenance = useMemo(() => ({
    lensId: sprout.provenance?.lens?.id,
    lensName: sprout.provenance?.lens?.name,
    journeyId: sprout.provenance?.journey?.id,
    journeyName: sprout.provenance?.journey?.name,
    hubId: sprout.provenance?.hub?.id,
    hubName: sprout.provenance?.hub?.name,
  }), [sprout.provenance]);

  // S22-WP: Generate Document with Writer Template and user notes
  const handleGenerateDocument = useCallback(async (templateId: string, userNotes: string) => {
    setIsGenerating(true);

    try {
      // Import document generator dynamically to avoid circular deps
      const { generateDocument } = await import('@explore/services/document-generator');

      // Sprint: research-template-wiring-v1
      // Build evidence bundle from ResearchSprout data bridged through Sprout type
      // EvidenceBundle schema: sproutId, branches[], totalSources, executionTime, confidenceScore, createdAt, apiCallsUsed
      //
      // Evidence location hierarchy:
      // 1. branch.evidence[] (per-branch, preferred)
      // 2. sprout.researchEvidence[] (aggregated from all branches)
      // 3. Synthesis summary (fallback if no structured evidence)

      const researchBranches = sprout.researchBranches || [];
      const aggregatedEvidence = sprout.researchEvidence || [];

      // Check if we have branch-level evidence
      const hasBranchEvidence = researchBranches.some(b => b.evidence && b.evidence.length > 0);

      let branches;
      if (hasBranchEvidence) {
        // Use branch-level evidence (preferred)
        branches = researchBranches.map(branch => {
          const branchEvidence = branch.evidence || [];
          return {
            branchQuery: branch.queries?.[0] || branch.label,
            sources: branchEvidence.map(evidenceToSource),
            findings: [],
            relevanceScore: branchEvidence.length > 0
              ? branchEvidence.reduce((sum, ev) => sum + (ev.relevance || 0), 0) / branchEvidence.length
              : 0.5,
            status: branch.status === 'complete' ? 'complete' as const : 'pending' as const,
          };
        });
      } else if (aggregatedEvidence.length > 0) {
        // Use aggregated evidence - create a single branch containing all sources
        branches = [{
          branchQuery: sprout.query,
          sources: aggregatedEvidence.map(evidenceToSource),
          findings: sprout.researchSynthesis?.insights || [],
          relevanceScore: aggregatedEvidence.reduce((sum, ev) => sum + (ev.relevance || 0), 0) / aggregatedEvidence.length,
          status: 'complete' as const,
        }];
      } else if (sprout.researchSynthesis) {
        // Fallback: Use synthesis summary as pseudo-evidence
        // This allows document generation even without structured evidence
        branches = [{
          branchQuery: sprout.query,
          sources: [{
            url: `sprout://${sprout.id}`,
            title: 'Research Synthesis',
            snippet: sprout.researchSynthesis.summary,
            accessedAt: sprout.researchSynthesis.synthesizedAt || new Date().toISOString(),
            sourceType: 'primary' as const,
          }],
          findings: sprout.researchSynthesis.insights || [],
          relevanceScore: sprout.researchSynthesis.confidence,
          status: 'complete' as const,
        }];
      } else {
        // No evidence at all - empty branches (writer will return INSUFFICIENT_EVIDENCE)
        branches = [];
      }

      const totalSources = branches.reduce((sum, b) => sum + b.sources.length, 0);
      const confidenceScore = sprout.researchSynthesis?.confidence || 0.7;

      const evidenceBundle = {
        sproutId: sprout.id,
        branches,
        totalSources,
        executionTime: 0, // Not tracked in Sprout, use 0
        confidenceScore,
        createdAt: new Date().toISOString(),
        apiCallsUsed: 0, // Not tracked in Sprout, use 0
      };

      const result = await generateDocument({
        evidenceBundle,
        query: sprout.query,
        writerTemplateId: templateId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Document generation failed');
      }

      // Save the generated document to the sprout
      updateSprout(sprout.id, { researchDocument: result.document });

      // Notify parent of update
      if (onSproutUpdate) {
        const updated = getSprout(sprout.id);
        if (updated) onSproutUpdate(updated);
      }

      // Emit signal
      signals.emitRefined(
        sprout.id,
        { refinementType: 'generate-document', charsDelta: result.document?.analysis?.length || 0 },
        provenance
      );

      emit.custom('sproutDocumentGenerated', {
        sproutId: sprout.id,
        templateId,
        templateUsed: result.templateUsed,
      });

      // S23-SFR v1.0: Route generated document to center column as artifact tab
      if (onDocumentGenerated && result.document) {
        const templateName = typeof result.templateUsed === 'string'
          ? result.templateUsed
          : result.templateUsed?.name || templateId;
        onDocumentGenerated(result.document, templateId, templateName);
      }

      toast.success('Document generated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [sprout.id, sprout.query, updateSprout, getSprout, onSproutUpdate, onDocumentGenerated, signals, emit, toast, provenance]);

  // S22-WP: Export to markdown - simplified for v1.0
  const handleExport = useCallback(() => {
    const cognitiveRouting = buildCognitiveRouting(sprout.provenance);

    // Build markdown content with provenance header
    const content = `# ${sprout.query}

---
**Generated:** ${new Date(sprout.capturedAt).toLocaleDateString()}
**Lens:** ${sprout.provenance?.lens?.name || 'Default'}
**Cognitive Path:** ${cognitiveRouting.path}
---

${sprout.response}
`;

    // Create and trigger download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprout-${sprout.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);

    // S6-SL-ObservableSignals: Emit sprout_exported signal
    signals.emitExported(
      sprout.id,
      { format: 'markdown' },
      provenance
    );

    emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
    toast.success('Document exported');
  }, [sprout.id, sprout.query, sprout.capturedAt, sprout.provenance, sprout.response, signals, emit, toast, provenance]);

  // S22-WP: Save to Nursery handler
  const handleSaveToNursery = useCallback(async (document: ResearchDocument) => {
    try {
      // Save document to sprout
      updateSprout(sprout.id, {
        researchDocument: document,
        stage: 'captured'
      });

      // Notify parent of update
      if (onSproutUpdate) {
        const updated = getSprout(sprout.id);
        if (updated) onSproutUpdate(updated);
      }

      // Emit signal
      signals.emitRefined(
        sprout.id,
        { refinementType: 'save-to-nursery', charsDelta: document.analysis?.length || 0 },
        provenance
      );

      emit.custom('sproutSavedToNursery', {
        sproutId: sprout.id,
        documentTitle: document.title,
      });

      toast.success('Saved to Nursery!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed';
      toast.error(message);
    }
  }, [sprout.id, updateSprout, getSprout, onSproutUpdate, signals, emit, toast, provenance]);

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-[var(--glass-border)] overflow-y-auto overflow-x-hidden flex flex-col" style={{ backgroundColor: 'var(--glass-elevated, transparent)' }}>
      {/* S22-WP: Primary Workflow - Writer Panel */}
      <WriterPanel
        sprout={sprout}
        onGenerate={handleGenerateDocument}
        onSaveToNursery={handleSaveToNursery}
        isGenerating={isGenerating}
        generatedDocument={sprout.researchDocument}
      />

      {/* S22-WP: Export actions - simplified for v1.0 */}
      <div className="p-4 mt-auto border-t border-[var(--glass-border)] space-y-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--glass-panel)] hover:bg-[var(--glass-elevated)] text-[var(--glass-text-body)] rounded-lg font-medium text-sm transition-colors"
        >
          <span className="text-lg" role="img" aria-label="Export">
            📤
          </span>
          Export to Markdown
        </button>

        {/* S22-WP: Save to Notion stub - requires API key integration */}
        <button
          onClick={() => toast.info('Notion integration coming soon! Configure API key in settings.')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--glass-panel)] hover:bg-[var(--glass-elevated)] text-[var(--glass-text-body)] rounded-lg font-medium text-sm transition-colors opacity-70"
        >
          <span className="text-lg" role="img" aria-label="Notion">
            📓
          </span>
          Save to Notion
        </button>
      </div>
    </aside>
  );
};

export default ActionPanel;
