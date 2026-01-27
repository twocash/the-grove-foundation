// src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx
// Sprint: S3||SFR-Actions - US-D001 Revise & Resubmit form (stubbed)
// Sprint: prompt-template-architecture-v1 - Added output template selection

import React, { useState, useMemo } from 'react';
import { useOutputTemplateData } from '@bedrock/consoles/ExperienceConsole/useOutputTemplateData';

export interface ReviseFormProps {
  sproutId: string;
  onSubmit: (notes: string, templateId?: string) => void;
}

/**
 * ReviseForm - Primary action section (green accent)
 *
 * US-D001: Accepts revision instructions for future agent requeue.
 * v1.0: Stubbed - emits event and shows toast, no backend call.
 *
 * Sprint: prompt-template-architecture-v1
 * Added output template selection for writer agent configuration.
 */
export const ReviseForm: React.FC<ReviseFormProps> = ({ sproutId, onSubmit }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = () => {
    if (!notes.trim()) return;
    setIsSubmitting(true);
    // v1.0: Stub - just emit event via callback with optional templateId
    onSubmit(notes, selectedTemplateId || undefined);
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 border-b border-[var(--glass-border)]">
      {/* Section header with green accent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1 h-4 bg-[var(--neon-cyan)] rounded-full" />
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
          Revise & Resubmit
        </h3>
      </div>

      {/* Template selector - Sprint: prompt-template-architecture-v1 */}
      {!templatesLoading && writerTemplates.length > 0 && (
        <div className="mb-3">
          <label
            htmlFor="template-select"
            className="block text-xs text-[var(--glass-text-muted)] mb-1"
          >
            Output Template
          </label>
          <select
            id="template-select"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full p-2 text-sm border border-[var(--glass-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 text-[var(--glass-text-primary)]"
            style={{ backgroundColor: 'var(--glass-panel)' }}
            aria-label="Select output template"
          >
            {writerTemplates.map((template) => (
              <option key={template.meta.id} value={template.meta.id}>
                {template.payload.name}
                {template.payload.isDefault ? ' (Default)' : ''}
                {template.payload.source === 'system-seed' ? ' • System' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What should the next version address differently?"
        className="w-full h-24 p-3 text-sm border border-[var(--glass-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)]"
        style={{ backgroundColor: 'var(--glass-panel)' }}
        aria-label="Revision instructions"
      />

      <button
        onClick={handleSubmit}
        disabled={!notes.trim() || isSubmitting}
        className="mt-3 w-full py-2 px-4 bg-[var(--neon-cyan)] text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Revision'}
      </button>
    </div>
  );
};

export default ReviseForm;
