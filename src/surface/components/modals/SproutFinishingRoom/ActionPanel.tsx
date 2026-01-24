// src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx
// Sprint: S3||SFR-Actions - Complete Action Panel with engagement integration

import React, { useState, useCallback } from 'react';
import type { Sprout } from '@core/schema/sprout';
import { useEngagementEmit } from '../../../../../hooks/useEngagementBus';
import { useSproutStorage } from '../../../../../hooks/useSproutStorage';
import { useSproutSignals } from '../../../hooks/useSproutSignals';
import { useToast } from '@explore/context/ToastContext';
import { ReviseForm } from './components/ReviseForm';
import { GenerateDocumentForm } from './components/GenerateDocumentForm';
import { PromotionChecklist } from './components/PromotionChecklist';
import { TertiaryActions, type TertiaryAction } from './components/TertiaryActions';

/**
 * Extract a human-readable title from a URL or reference string
 * Sprint: research-template-wiring-v1
 */
function extractTitleFromSource(source: string): string {
  if (!source) return 'Unknown Source';

  try {
    // If it's a URL, extract domain and path
    const url = new URL(source);
    const domain = url.hostname.replace('www.', '');
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length > 0) {
      // Take the last meaningful path segment
      const lastPart = pathParts[pathParts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.(html?|php|aspx?)$/i, '');
      return `${domain}: ${lastPart}`;
    }
    return domain;
  } catch {
    // Not a URL, return as-is or truncate
    return source.length > 50 ? source.slice(0, 47) + '...' : source;
  }
}

export interface ActionPanelProps {
  sprout: Sprout;
  onClose: () => void;
  onSproutUpdate?: (sprout: Sprout) => void;
}

/**
 * ActionPanel - Right column (320px fixed)
 *
 * Integrates all action components with engagement bus and sprout storage.
 * Three sections:
 * - Primary: Revise & Resubmit (green accent)
 * - Secondary: Add to Field / Promotion (cyan accent)
 * - Tertiary: Archive, Note, Export (neutral)
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({
  sprout,
  onClose,
  onSproutUpdate,
}) => {
  const emit = useEngagementEmit();
  const { updateSprout, getSprout } = useSproutStorage();
  const signals = useSproutSignals();
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // S6-SL-ObservableSignals: Build provenance from sprout
  const buildProvenance = () => ({
    lensId: sprout.provenance?.lens?.id,
    lensName: sprout.provenance?.lens?.name,
    journeyId: sprout.provenance?.journey?.id,
    journeyName: sprout.provenance?.journey?.name,
    hubId: sprout.provenance?.hub?.id,
    hubName: sprout.provenance?.hub?.name,
  });

  // US-D001: Revise & Resubmit (stubbed)
  // Sprint: prompt-template-architecture-v1 - Added templateId parameter
  const handleRevisionSubmit = (notes: string, templateId?: string) => {
    // S6-SL-ObservableSignals: Emit sprout_refined signal
    signals.emitRefined(
      sprout.id,
      { refinementType: 'revise', charsDelta: notes.length },
      buildProvenance()
    );

    emit.custom('sproutRefinementSubmitted', {
      sproutId: sprout.id,
      revisionNotes: notes,
      templateId, // Sprint: prompt-template-architecture-v1
    });
    toast.success('Revision submitted for processing!');
  };

  // US-RL006: Generate Document with Writer Template
  // Sprint: research-template-wiring-v1
  const handleGenerateDocument = useCallback(async (templateId?: string) => {
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
          const sources = branchEvidence.map(ev => ({
            url: ev.source || '',
            title: extractTitleFromSource(ev.source),
            snippet: ev.content,
            accessedAt: ev.collectedAt || new Date().toISOString(),
            sourceType: ev.sourceType as 'academic' | 'practitioner' | 'news' | 'primary' | undefined,
          }));

          return {
            branchQuery: branch.queries?.[0] || branch.label,
            sources,
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
          sources: aggregatedEvidence.map(ev => ({
            url: ev.source || '',
            title: extractTitleFromSource(ev.source),
            snippet: ev.content,
            accessedAt: ev.collectedAt || new Date().toISOString(),
            sourceType: ev.sourceType as 'academic' | 'practitioner' | 'news' | 'primary' | undefined,
          })),
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
        buildProvenance()
      );

      emit.custom('sproutDocumentGenerated', {
        sproutId: sprout.id,
        templateId,
        templateUsed: result.templateUsed,
      });

      toast.success('Document generated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [sprout.id, sprout.query, updateSprout, getSprout, onSproutUpdate, signals, emit, toast, buildProvenance]);

  // US-D005: Promote to RAG - S4-SL-TierProgression: Also update stage
  const handlePromote = async (content: string, selectedItems: string[]) => {
    const previousStage = sprout.stage || 'seed';

    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sprout.query,
          content,
          tier: 'sprout', // Valid tier string: seed, sprout, sapling, tree, grove
          sourceType: 'sprout',
          sourceUrl: `sprout://${sprout.id}`,
        }),
      });

      if (!response.ok) throw new Error('Upload failed');

      // S4-SL-TierProgression: Update stage to 'established' with timestamp
      try {
        updateSprout(sprout.id, {
          stage: 'established',
          promotedAt: new Date().toISOString(),
        });

        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
      } catch (stageError) {
        console.error('Stage update failed:', stageError);
        toast.warning('Content saved, but tier update failed.');
      }

      // S6-SL-ObservableSignals: Emit sprout_promoted signal
      signals.emitPromoted(
        sprout.id,
        { fromTier: previousStage, toTier: 'established' },
        buildProvenance()
      );

      emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
      toast.success('Promoted to Sapling! Added to Knowledge Commons.');
    } catch (error) {
      toast.error('Failed to promote content');
    }
  };

  // US-D002, D003, D004: Tertiary actions
  const handleTertiaryAction = (action: TertiaryAction, payload?: unknown) => {
    switch (action) {
      case 'archive':
        // Update sprout stage to dormant (archived)
        updateSprout(sprout.id, { stage: 'dormant' });
        emit.custom('sproutArchived', { sproutId: sprout.id });
        toast.success('Sprout archived to your garden');
        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
        onClose();
        break;

      case 'annotate':
        const note = payload as string;
        updateSprout(sprout.id, { notes: note });

        // S6-SL-ObservableSignals: Emit sprout_refined signal for annotations
        signals.emitRefined(
          sprout.id,
          { refinementType: 'annotate', charsDelta: note.length },
          buildProvenance()
        );

        emit.custom('sproutAnnotated', { sproutId: sprout.id, note });
        toast.success('Note saved');
        // Notify parent of update
        if (onSproutUpdate) {
          const updated = getSprout(sprout.id);
          if (updated) onSproutUpdate(updated);
        }
        break;

      case 'export':
        // S6-SL-ObservableSignals: Emit sprout_exported signal
        signals.emitExported(
          sprout.id,
          { format: 'markdown' },
          buildProvenance()
        );

        emit.custom('sproutExported', { sproutId: sprout.id, format: 'markdown' });
        toast.success('Document exported');
        break;
    }
  };

  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto flex flex-col">
      {/* US-D001: Primary Action - Revise & Resubmit */}
      <ReviseForm sproutId={sprout.id} onSubmit={handleRevisionSubmit} />

      {/* US-RL006: Generate Document - Sprint: research-template-wiring-v1 */}
      <GenerateDocumentForm
        sproutId={sprout.id}
        hasEvidence={!!sprout.response}
        hasDocument={!!sprout.researchDocument}
        onGenerate={handleGenerateDocument}
        isGenerating={isGenerating}
      />

      {/* US-D005: Secondary Action - Promote to Field */}
      <PromotionChecklist sprout={sprout} onPromote={handlePromote} />

      {/* US-D002, D003, D004: Tertiary Actions */}
      <TertiaryActions sprout={sprout} onAction={handleTertiaryAction} />
    </aside>
  );
};

export default ActionPanel;
