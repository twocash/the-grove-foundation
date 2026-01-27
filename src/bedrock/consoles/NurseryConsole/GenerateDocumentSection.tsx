// src/bedrock/consoles/NurseryConsole/GenerateDocumentSection.tsx
// Generate Document section for Sprout Editor
// Sprint: research-template-wiring-v1 - US-RL006 Writer Template selection
//
// This section enables user-triggered document generation with Writer Template selection.
// It decouples Writer Agent from the auto-chained pipeline.
//
// DEX: Declarative Sovereignty
// User selects Writer Template (blog, engineering, vision, higher-ed) to control output style.

import React, { useState, useMemo, useCallback } from 'react';
import { InspectorSection } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { useOutputTemplateData } from '../ExperienceConsole/useOutputTemplateData';

// =============================================================================
// Props
// =============================================================================

export interface GenerateDocumentSectionProps {
  /** Sprout ID */
  sproutId: string;

  /** Whether sprout has completed research (synthesis exists) */
  hasResearchResults: boolean;

  /** Whether document already exists */
  hasDocument: boolean;

  /** Callback when user clicks Generate */
  onGenerate: (templateId: string) => Promise<void>;

  /** S25-SFR: Callback to view the generated document in a modal */
  onViewDocument?: () => void;

  /** Whether console is in loading state */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * GenerateDocumentSection - Writer Template selection and Generate button
 *
 * US-RL006: Enables user-triggered document generation with Writer Profile selection.
 *
 * Only shown when:
 * - Research has completed (hasResearchResults = true)
 * - No document exists yet (hasDocument = false)
 *
 * Sprint: research-template-wiring-v1
 */
export function GenerateDocumentSection({
  sproutId,
  hasResearchResults,
  hasDocument,
  onGenerate,
  onViewDocument,
  disabled = false,
}: GenerateDocumentSectionProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load writer templates
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

  // Get selected template for description
  const selectedTemplate = useMemo(() => {
    return writerTemplates.find((t) => t.meta.id === selectedTemplateId);
  }, [writerTemplates, selectedTemplateId]);

  // Handle generate click
  const handleGenerate = useCallback(async () => {
    if (!selectedTemplateId) return;

    setIsGenerating(true);
    setError(null);

    try {
      await onGenerate(selectedTemplateId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplateId, onGenerate]);

  // Don't show if no research results yet
  if (!hasResearchResults) {
    return null;
  }

  // Don't show if document already exists
  if (hasDocument) {
    return (
      <InspectorSection title="Document">
        <div className="flex items-center gap-2 text-sm text-[var(--neon-green)]">
          <span className="material-symbols-outlined text-base">check_circle</span>
          Document generated
        </div>
        {onViewDocument && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onViewDocument}
            className="mt-3 w-full"
          >
            <span className="material-symbols-outlined text-base mr-1">description</span>
            View Document
          </GlassButton>
        )}
        <p className="mt-2 text-xs text-[var(--glass-text-muted)]">
          Use "Promote to Garden" to publish this research.
        </p>
      </InspectorSection>
    );
  }

  return (
    <InspectorSection title="Generate Document">
      <div className="space-y-4">
        {/* Explanation */}
        <p className="text-sm text-[var(--glass-text-secondary)]">
          Research evidence is ready. Select a writing style and generate your document.
        </p>

        {/* Template selector */}
        {templatesLoading ? (
          <div className="text-sm text-[var(--glass-text-muted)]">
            Loading writing styles...
          </div>
        ) : writerTemplates.length === 0 ? (
          <div className="text-sm text-[var(--semantic-warning)]">
            No writer templates available. Check output_templates configuration.
          </div>
        ) : (
          <div>
            <label
              htmlFor="writer-template-select"
              className="block text-xs text-[var(--glass-text-muted)] mb-1"
            >
              Writing Style
            </label>
            <select
              id="writer-template-select"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={disabled || isGenerating}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 disabled:opacity-50"
            >
              {writerTemplates.map((template) => (
                <option key={template.meta.id} value={template.meta.id}>
                  {template.payload.name}
                  {template.payload.isDefault ? ' (Default)' : ''}
                </option>
              ))}
            </select>

            {/* Template description */}
            {selectedTemplate && (
              <p className="mt-2 text-xs text-[var(--glass-text-muted)] italic">
                {selectedTemplate.payload.description}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--semantic-error-bg)] border border-[var(--semantic-error-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--semantic-error)]">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          </div>
        )}

        {/* Generate button */}
        <GlassButton
          variant="primary"
          onClick={handleGenerate}
          disabled={disabled || isGenerating || !selectedTemplateId}
          className="w-full"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[var(--glass-text-muted)] border-t-[var(--neon-cyan)] rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined text-base mr-1">auto_awesome</span>
              Generate Document
            </>
          )}
        </GlassButton>
      </div>
    </InspectorSection>
  );
}

export default GenerateDocumentSection;
