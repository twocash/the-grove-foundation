// src/surface/components/modals/SproutFinishingRoom/components/GenerateDocumentForm.tsx
// Sprint: research-template-wiring-v1 - US-RL006 Generate Document with Writer Template selection
//
// This form enables user-triggered document generation with Writer Template selection.
// It decouples Writer Agent from the auto-chained pipeline, giving users control
// over the output style (blog, engineering doc, vision doc, etc.)
//
// DEX: Declarative Sovereignty
// User selects Writer Template to control document style.
//
// Pattern: Mirrors ReviseForm.tsx but for Writer Templates (agentType: 'writer')

import React, { useState, useMemo } from 'react';
import { useOutputTemplateData } from '@bedrock/consoles/ExperienceConsole/useOutputTemplateData';

export interface GenerateDocumentFormProps {
  /** Sprout ID for context */
  sproutId: string;

  /** Whether research evidence is available */
  hasEvidence: boolean;

  /** Whether document already exists */
  hasDocument: boolean;

  /** Callback when user clicks Generate */
  onGenerate: (templateId?: string) => void;

  /** Whether generation is in progress */
  isGenerating?: boolean;
}

/**
 * GenerateDocumentForm - Generate Document action section (blue accent)
 *
 * US-RL006: Writer Profile selector with Generate button.
 * Only shown when research evidence exists but document hasn't been generated yet.
 *
 * Sprint: research-template-wiring-v1
 * Enables user-triggered Writer Agent with template selection.
 */
export const GenerateDocumentForm: React.FC<GenerateDocumentFormProps> = ({
  sproutId,
  hasEvidence,
  hasDocument,
  onGenerate,
  isGenerating = false,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

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

  const handleGenerate = () => {
    onGenerate(selectedTemplateId || undefined);
  };

  // Don't show if no evidence yet (research not complete)
  if (!hasEvidence) {
    return null;
  }

  // Don't show if document already exists
  if (hasDocument) {
    return null;
  }

  return (
    <div className="p-4 border-b border-ink/10 dark:border-white/10">
      {/* Section header with blue accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-blue-500 rounded-full" />
        <h3 className="text-sm font-medium text-ink dark:text-paper">
          Generate Document
        </h3>
      </div>

      {/* Explanation text */}
      <p className="text-xs text-ink-muted dark:text-paper/60 mb-3">
        Research evidence is ready. Select a writing style and generate your document.
      </p>

      {/* Template selector */}
      {!templatesLoading && writerTemplates.length > 0 && (
        <div className="mb-3">
          <label
            htmlFor="writer-template-select"
            className="block text-xs text-ink-muted dark:text-paper/60 mb-1"
          >
            Writing Style
          </label>
          <select
            id="writer-template-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            disabled={isGenerating}
            className="w-full p-2 text-sm bg-paper dark:bg-ink border border-ink/10 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-ink dark:text-paper disabled:opacity-50"
            aria-label="Select writing style"
          >
            {writerTemplates.map((template) => (
              <option key={template.meta.id} value={template.meta.id}>
                {template.payload.name}
                {template.payload.isDefault ? ' (Default)' : ''}
                {template.payload.source === 'system-seed' ? ' • System' : ''}
              </option>
            ))}
          </select>

          {/* Template description hint */}
          {selectedTemplateId && (
            <p className="mt-1 text-xs text-ink-muted dark:text-paper/50 italic">
              {writerTemplates.find(t => t.meta.id === selectedTemplateId)?.payload.description ||
               'Transforms research into a formatted document.'}
            </p>
          )}
        </div>
      )}

      {/* Loading state */}
      {templatesLoading && (
        <div className="mb-3 text-xs text-ink-muted dark:text-paper/50">
          Loading writing styles...
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          'Generate Document'
        )}
      </button>
    </div>
  );
};

export default GenerateDocumentForm;
