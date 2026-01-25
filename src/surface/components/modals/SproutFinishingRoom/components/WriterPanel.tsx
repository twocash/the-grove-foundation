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
import type { ResearchDocument } from '@core/schema/research-document';

export interface WriterPanelProps {
  sprout: Sprout;
  onGenerate: (templateId: string, userNotes: string) => Promise<void>;
  onSaveToNursery?: (document: ResearchDocument) => Promise<void>;
  isGenerating: boolean;
  generatedDocument?: ResearchDocument | null;
}

/**
 * WriterPanel - S22-WP Right panel for Writer workflow
 *
 * Flow:
 * 1. User selects Writer template from visual grid
 * 2. User adds optional notes for context
 * 3. User clicks Generate → Writer Agent runs
 * 4. Preview shows generated document
 * 5. User can Save to Nursery
 */
export const WriterPanel: React.FC<WriterPanelProps> = ({
  sprout,
  onGenerate,
  onSaveToNursery,
  isGenerating,
  generatedDocument,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [userNotes, setUserNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      (sprout.researchBranches && sprout.researchBranches.length > 0) ||
      (sprout.researchEvidence && sprout.researchEvidence.length > 0) ||
      !!sprout.researchSynthesis
    );
  }, [sprout]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplateId) return;
    await onGenerate(selectedTemplateId, userNotes);
  }, [selectedTemplateId, userNotes, onGenerate]);

  const handleSave = useCallback(async () => {
    if (!generatedDocument || !onSaveToNursery) return;
    setIsSaving(true);
    try {
      await onSaveToNursery(generatedDocument);
    } finally {
      setIsSaving(false);
    }
  }, [generatedDocument, onSaveToNursery]);

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
          <h3 className="text-sm font-medium text-ink dark:text-paper">
            Waiting for Research
          </h3>
        </div>
        <p className="text-sm text-ink-muted dark:text-paper/60">
          Research evidence will appear in the center panel. Once complete, you can
          generate a styled document here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Section: Writer Template Selection */}
      <div className="p-4 border-b border-ink/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-grove-forest rounded-full" />
          <h3 className="text-sm font-medium text-ink dark:text-paper">
            Output Style
          </h3>
        </div>

        {templatesLoading ? (
          <div className="text-sm text-ink-muted dark:text-paper/60">
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
                    ? 'border-grove-forest bg-grove-forest/10 dark:bg-grove-forest/20'
                    : 'border-ink/10 dark:border-white/10 hover:border-grove-forest/50'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink dark:text-paper">
                    {template.payload.name}
                  </span>
                  {template.payload.isDefault && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-grove-forest/10 text-grove-forest">
                      Default
                    </span>
                  )}
                </div>
                {template.payload.description && (
                  <p className="mt-1 text-xs text-ink-muted dark:text-paper/60 line-clamp-2">
                    {template.payload.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section: User Notes */}
      <div className="p-4 border-b border-ink/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 bg-blue-500 rounded-full" />
          <h3 className="text-sm font-medium text-ink dark:text-paper">
            Additional Context
          </h3>
        </div>
        <textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Optional: Add notes for the writer (audience, focus areas, tone preferences...)"
          disabled={isGenerating}
          className="w-full h-20 p-3 text-sm bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-ink dark:text-paper placeholder:text-ink-muted dark:placeholder:text-paper/50 disabled:opacity-50"
          aria-label="Additional context for writer"
        />
      </div>

      {/* Section: Generate Action */}
      <div className="p-4 border-b border-ink/10 dark:border-white/10">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTemplateId}
          className="w-full py-3 px-4 bg-grove-forest text-paper rounded-lg font-medium text-sm hover:bg-grove-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
              Generating Artifact...
            </span>
          ) : generatedDocument ? (
            'Regenerate Artifact'
          ) : (
            'Generate Artifact'
          )}
        </button>

        {selectedTemplate && (
          <p className="mt-2 text-xs text-ink-muted dark:text-paper/50 text-center">
            Using: {selectedTemplate.payload.name}
          </p>
        )}
      </div>

      {/* Section: Generated Document Preview (if exists) */}
      {generatedDocument && (
        <div className="p-4 border-b border-ink/10 dark:border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-cyan-500 rounded-full" />
            <h3 className="text-sm font-medium text-ink dark:text-paper">
              Document Generated
            </h3>
          </div>

          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-3">
            <p className="text-sm text-ink dark:text-paper font-medium">
              {generatedDocument.title || 'Research Document'}
            </p>
            {generatedDocument.positionStatement && (
              <p className="mt-1 text-xs text-ink-muted dark:text-paper/60 line-clamp-3">
                {generatedDocument.positionStatement}
              </p>
            )}
          </div>

          {onSaveToNursery && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2 px-4 bg-cyan-500 text-white rounded-lg font-medium text-sm hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save to Nursery'}
            </button>
          )}
        </div>
      )}

      {/* Section: Metadata */}
      <div className="p-4 mt-auto">
        <div className="text-xs text-ink-muted dark:text-paper/40 space-y-1">
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
