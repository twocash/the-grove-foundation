// src/surface/components/modals/SproutFinishingRoom/components/WriterPanel.tsx
// Sprint: S22-WP research-writer-panel-v1
//
// Right panel for Writer workflow:
// 1. Writer template selection (visual grid)
// 2. User notes input
// 3. Generate document button
// 4. Preview generated document
// 5. Save to Nursery
//
// DEX: Declarative Sovereignty
// User selects Writer Template to control document style.

import React, { useState, useMemo, useCallback } from 'react';
import { useOutputTemplateData } from '@bedrock/consoles/ExperienceConsole/useOutputTemplateData';
import type { Sprout } from '@core/schema/sprout';

export interface WriterPanelProps {
  sprout: Sprout;
  onGenerate: (templateId: string, userNotes: string) => Promise<void>;
  isGenerating: boolean;
}

/**
 * WriterPanel - S22-WP Right panel for Writer workflow
 *
 * Flow:
 * 1. User selects Writer template from visual grid
 * 2. User adds optional notes for context
 * 3. User clicks Generate → Writer Agent runs
 *
 * S24-SFR: "Save to Nursery" and "Promote to Garden" actions moved to
 * DocumentViewer center column bottom bar.
 */
export const WriterPanel: React.FC<WriterPanelProps> = ({
  sprout,
  onGenerate,
  isGenerating,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [userNotes, setUserNotes] = useState('');

  // Get writer templates from output template data
  const { objects: templates, loading: templatesLoading } = useOutputTemplateData();

  // Filter to active writer templates
  const writerTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.payload.agentType === 'writer' && t.payload.status === 'active'
    );
  }, [templates]);

  // Get default template
  const defaultTemplate = useMemo(() => {
    return writerTemplates.find((t) => t.payload.isDefault);
  }, [writerTemplates]);

  // Set default selection when templates load
  React.useEffect(() => {
    if (!selectedTemplateId && defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.meta.id);
    }
  }, [selectedTemplateId, defaultTemplate]);

  // Check if research evidence exists
  const hasResearchEvidence = useMemo(() => {
    return (
      !!sprout.canonicalResearch ||
      (sprout.researchBranches && sprout.researchBranches.length > 0) ||
      (sprout.researchEvidence && sprout.researchEvidence.length > 0) ||
      !!sprout.researchSynthesis
    );
  }, [sprout]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplateId) return;
    await onGenerate(selectedTemplateId, userNotes);
  }, [selectedTemplateId, userNotes, onGenerate]);

  // Get selected template details
  const selectedTemplate = useMemo(() => {
    return writerTemplates.find((t) => t.meta.id === selectedTemplateId);
  }, [writerTemplates, selectedTemplateId]);

  // If no research evidence, show message
  if (!hasResearchEvidence) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1 h-4 bg-amber-500 rounded-full" />
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Waiting for Research
          </h3>
        </div>
        <p className="text-sm text-[var(--glass-text-muted)]">
          Research evidence will appear in the center panel. Once complete, you can
          generate a styled document here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Section: Writer Template Selection */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-[var(--neon-cyan)] rounded-full" />
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Output Style
          </h3>
        </div>

        {templatesLoading ? (
          <div className="text-sm text-[var(--glass-text-muted)]">
            Loading styles...
          </div>
        ) : (
          <div className="space-y-2">
            {writerTemplates.map((template) => (
              <button
                key={template.meta.id}
                onClick={() => setSelectedTemplateId(template.meta.id)}
                disabled={isGenerating}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  selectedTemplateId === template.meta.id
                    ? 'border-[var(--neon-cyan)] bg-[var(--glass-elevated)]'
                    : 'border-[var(--glass-border)] hover:border-[var(--neon-cyan)]/50'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                    {template.payload.name}
                  </span>
                  {template.payload.isDefault && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--glass-elevated)] text-[var(--neon-cyan)]">
                      Default
                    </span>
                  )}
                </div>
                {template.payload.description && (
                  <p className="mt-1 text-xs text-[var(--glass-text-muted)] line-clamp-2">
                    {template.payload.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section: User Notes */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-blue-500 rounded-full" />
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Additional Context
          </h3>
        </div>
        <textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Optional: Add notes for the writer (audience, focus areas, tone preferences...)"
          disabled={isGenerating}
          className="w-full h-20 p-3 text-sm border border-[var(--glass-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] disabled:opacity-50"
          style={{ backgroundColor: 'var(--glass-panel)' }}
          aria-label="Additional context for writer"
        />
      </div>

      {/* Section: Generate Action */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTemplateId}
          className="w-full py-3 px-4 bg-[var(--neon-cyan)] text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Artifact...
            </span>
          ) : (
            'Generate Artifact'
          )}
        </button>

        {selectedTemplate && (
          <p className="mt-2 text-xs text-[var(--glass-text-muted)] text-center">
            Using: {selectedTemplate.payload.name}
          </p>
        )}
      </div>

      {/* Section: Metadata */}
      <div className="p-4 mt-auto">
        <div className="text-xs text-[var(--glass-text-muted)] space-y-1">
          <p>
            <strong>Query:</strong>{' '}
            <span className="truncate block">{sprout.query}</span>
          </p>
          <p>
            <strong>Status:</strong> {sprout.status}
          </p>
          {sprout.researchBranches && (
            <p>
              <strong>Branches:</strong> {sprout.researchBranches.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WriterPanel;
