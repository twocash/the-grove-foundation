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
import {
  downloadMarkdown,
  documentToMarkdown,
  type ProvenanceInfo,
} from '@explore/utils/markdown-export';

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
  onDocumentGenerated?: (
    document: ResearchDocument,
    templateId: string,
    templateName: string,
    renderingSource?: 'template' | 'default-writer' | 'default-research',
    writerConfigVersion?: number  // S28-PIPE: Config provenance
  ) => void;
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
      } else if (sprout.canonicalResearch) {
        // S26-NUR: Use canonical research (modern format) as evidence source
        const cr = sprout.canonicalResearch;
        branches = [{
          branchQuery: sprout.query,
          sources: (cr.sources || []).map(src => ({
            url: src.url,
            title: src.title,
            snippet: src.snippet || '',
            accessedAt: cr._meta?.capturedAt || new Date().toISOString(),
            sourceType: 'academic' as const,
          })),
          findings: cr.key_findings || [],
          relevanceScore: cr.confidence_assessment?.score || 0.85,
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
      const confidenceScore = sprout.researchSynthesis?.confidence
        || sprout.canonicalResearch?.confidence_assessment?.score
        || 0.7;

      const evidenceBundle = {
        sproutId: sprout.id,
        branches,
        totalSources,
        executionTime: 0, // Not tracked in Sprout, use 0
        confidenceScore,
        createdAt: new Date().toISOString(),
        apiCallsUsed: 0, // Not tracked in Sprout, use 0
      };

      // S28-PIPE: Pass groveId for config loading
      // TODO: Get from grove context when available
      const groveId = 'main'; // Default grove for now

      const result = await generateDocument({
        evidenceBundle,
        query: sprout.query,
        groveId,
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
        onDocumentGenerated(
          result.document,
          templateId,
          templateName,
          result.renderingSource,
          result.writerConfigVersion  // S28-PIPE: Config provenance
        );
      }

      toast.success('Document generated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [sprout.id, sprout.query, updateSprout, getSprout, onSproutUpdate, onDocumentGenerated, signals, emit, toast, provenance]);

  // S22-WP → S28-PIPE: Export to markdown with full formatting
  const handleExport = useCallback(() => {
    // Get the best available document source
    // Priority: 1) Most recent generated artifact, 2) researchDocument, 3) raw response fallback
    const latestArtifact = sprout.generatedArtifacts?.[sprout.generatedArtifacts.length - 1];
    const doc = latestArtifact?.document || sprout.researchDocument;

    if (doc) {
      // Full professional export with ResearchDocument
      const exportProvenance: ProvenanceInfo = {
        lensName: sprout.provenance?.lens?.name,
        journeyName: sprout.provenance?.journey?.name,
        hubName: sprout.provenance?.hub?.name,
        templateName: latestArtifact?.templateName,
        writerConfigVersion: latestArtifact?.writerConfigVersion,
        generatedAt: latestArtifact?.generatedAt || doc.createdAt,
      };

      downloadMarkdown(doc, exportProvenance, {
        includeMetadata: true,
        includeProvenance: true,
        citationStyle: 'endnotes',
      });

      toast.success('Research document exported');
    } else {
      // Fallback: Export raw sprout response if no structured document
      const cognitiveRouting = buildCognitiveRouting(sprout.provenance);
      const content = `# ${sprout.query}

---
generated: ${new Date(sprout.capturedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
lens: ${sprout.provenance?.lens?.name || 'Default'}
cognitive_path: ${cognitiveRouting.path}
---

${sprout.response}

---
*Exported from Grove Research Platform*
`;

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grove-research-${sprout.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Document exported (raw format)');
    }

    // S6-SL-ObservableSignals: Emit sprout_exported signal
    signals.emitExported(
      sprout.id,
      { format: 'markdown' },
      provenance
    );

    emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
  }, [sprout, signals, emit, toast, provenance]);

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-[var(--glass-border)] overflow-y-auto overflow-x-hidden flex flex-col" style={{ backgroundColor: 'var(--glass-elevated, transparent)' }}>
      {/* S22-WP: Primary Workflow - Writer Panel */}
      <WriterPanel
        sprout={sprout}
        onGenerate={handleGenerateDocument}
        isGenerating={isGenerating}
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
