// src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx
// Editor component for Writer Agent Config
// Sprint: experience-console-cleanup-v1
//
// IMPORTANT: This editor uses BufferedInput for text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// Voice formality options
const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', description: 'Conversational and approachable' },
  { value: 'professional', label: 'Professional', description: 'Business-appropriate tone' },
  { value: 'academic', label: 'Academic', description: 'Scholarly and formal' },
  { value: 'technical', label: 'Technical', description: 'Precise and detailed' },
] as const;

// Perspective options
const PERSPECTIVE_OPTIONS = [
  { value: 'first-person', label: 'First Person', description: 'Uses "I" and "we"' },
  { value: 'third-person', label: 'Third Person', description: 'Uses "they" and "it"' },
  { value: 'neutral', label: 'Neutral', description: 'Avoids personal pronouns' },
] as const;

// Citation style options
const CITATION_STYLE_OPTIONS = [
  { value: 'inline', label: 'Inline', description: 'Citations appear in text' },
  { value: 'endnote', label: 'Endnote', description: 'Citations at document end' },
] as const;

// Citation format options
const CITATION_FORMAT_OPTIONS = [
  { value: 'simple', label: 'Simple', description: 'Basic source attribution' },
  { value: 'apa', label: 'APA', description: 'American Psychological Association' },
  { value: 'chicago', label: 'Chicago', description: 'Chicago Manual of Style' },
] as const;

/**
 * Editor component for WriterAgentConfig objects
 * SINGLETON type - typically only one active config exists
 */
export function WriterAgentConfigEditor({
  object: config,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<WriterAgentConfigPayload>) {
  const isActive = config.meta.status === 'active';
  const { voice, documentStructure, qualityRules } = config.payload;

  // Helper to generate patch operations for meta fields
  const patchMeta = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/meta/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Helper to patch nested payload fields
  const patchVoice = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/voice/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchDocStructure = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/documentStructure/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchQualityRules = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/qualityRules/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Status Banner */}
      <div className={`
        flex items-center gap-3 px-4 py-3 border-b transition-colors
        ${isActive
          ? 'bg-teal-500/10 border-teal-500/20'
          : 'bg-slate-500/10 border-slate-500/20'
        }
      `}>
        <span className="relative flex h-3 w-3">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          )}
          <span className={`
            relative inline-flex rounded-full h-3 w-3
            ${isActive ? 'bg-teal-500' : 'bg-slate-500'}
          `} />
        </span>
        <div className="flex-1">
          <span className={`text-sm font-medium ${isActive ? 'text-teal-300' : 'text-slate-300'}`}>
            {isActive ? 'Active Configuration' : 'Draft Configuration'}
          </span>
          <p className={`text-xs ${isActive ? 'text-teal-400/70' : 'text-slate-400/70'}`}>
            SINGLETON: Only one Writer Agent config can be active
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-teal-400">
            edit_note
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {config.meta.title || 'Writer Agent Config'}
            </h1>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Configure document writing behavior
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Identity Section */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={config.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                placeholder="Config Title"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={config.meta.description || ''}
                onChange={(val) => patchMeta('description', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
                placeholder="What does this config control?"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Voice Settings */}
        <InspectorSection title="Voice & Tone" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Formality</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchVoice('formality', opt.value)}
                    className={`
                      p-2 rounded-lg border text-left transition-colors
                      ${voice.formality === opt.value
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium block">{opt.label}</span>
                    <span className="text-xs text-[var(--glass-text-muted)]">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Perspective</label>
              <div className="flex gap-2">
                {PERSPECTIVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchVoice('perspective', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${voice.perspective === opt.value
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Personality (optional)
              </label>
              <BufferedInput
                value={voice.personality || ''}
                onChange={(val) => patchVoice('personality', val || undefined)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                placeholder="e.g., 'thoughtful and nuanced'"
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Document Structure */}
        <InspectorSection title="Document Structure" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentStructure.includePosition}
                  onChange={(e) => patchDocStructure('includePosition', e.target.checked)}
                  className="w-5 h-5 rounded accent-teal-500"
                />
                <div>
                  <span className="text-sm text-[var(--glass-text-primary)]">Include Position</span>
                  <p className="text-xs text-[var(--glass-text-muted)]">Add thesis/position section</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentStructure.includeLimitations}
                  onChange={(e) => patchDocStructure('includeLimitations', e.target.checked)}
                  className="w-5 h-5 rounded accent-teal-500"
                />
                <div>
                  <span className="text-sm text-[var(--glass-text-primary)]">Include Limitations</span>
                  <p className="text-xs text-[var(--glass-text-muted)]">Add limitations section</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Citation Style</label>
              <div className="flex gap-2">
                {CITATION_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchDocStructure('citationStyle', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${documentStructure.citationStyle === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Citation Format</label>
              <div className="flex gap-2">
                {CITATION_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchDocStructure('citationFormat', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${documentStructure.citationFormat === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Max Length (words, optional)
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={documentStructure.maxLength || ''}
                onChange={(e) => patchDocStructure('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-32 bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-teal-500 focus:outline-none"
                placeholder="No limit"
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Quality Rules */}
        <InspectorSection title="Quality Rules" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityRules.requireCitations}
                onChange={(e) => patchQualityRules('requireCitations', e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Require Citations</span>
                <p className="text-xs text-[var(--glass-text-muted)]">All claims must have sources</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityRules.flagUncertainty}
                onChange={(e) => patchQualityRules('flagUncertainty', e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Flag Uncertainty</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Mark uncertain claims in output</p>
              </div>
            </label>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Minimum Confidence to Include
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(qualityRules.minConfidenceToInclude * 100)}
                onChange={(e) => patchQualityRules('minConfidenceToInclude', parseInt(e.target.value) / 100)}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>0% (include all)</span>
                <span className="text-emerald-400 font-medium">
                  {Math.round(qualityRules.minConfidenceToInclude * 100)}%
                </span>
                <span>100% (high only)</span>
              </div>
            </div>
          </div>
        </InspectorSection>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
        {hasChanges ? (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </GlassButton>
        ) : (
          <div className="w-full px-4 py-2.5 rounded-lg bg-[var(--glass-surface)] text-[var(--glass-text-muted)] text-center text-sm">
            No unsaved changes
          </div>
        )}

        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">delete</span>
            Delete
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default WriterAgentConfigEditor;
