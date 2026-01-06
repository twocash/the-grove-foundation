// src/bedrock/consoles/LensWorkshop/LensEditor.tsx
// Lens editor with real Persona fields organized by function
// Migration: MIGRATION-001-lens
//
// TODO: If text inputs in this editor lose characters during rapid typing,
// replace native <input>/<textarea> with BufferedInput/BufferedTextarea.
// @see src/bedrock/primitives/BufferedInput.tsx
// @see docs/hotfixes/HOTFIX-002-inspector-input-race.md

import React, { useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { LensPayload, ArcEmphasis } from '../../types/lens';
import type { PatchOperation } from '../../types/copilot.types';
import {
  LENS_COLOR_CONFIG,
  NARRATIVE_STYLES,
  OPENING_PHASES,
  VOCABULARY_LEVELS,
  EMOTIONAL_REGISTERS,
  PERSONA_COLORS,
} from '../../types/lens';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';

// =============================================================================
// Arc Emphasis Editor Component
// =============================================================================

interface ArcEmphasisEditorProps {
  value: ArcEmphasis;
  onChange: (emphasis: ArcEmphasis) => void;
  disabled?: boolean;
}

function ArcEmphasisEditor({ value, onChange, disabled }: ArcEmphasisEditorProps) {
  const phases: { key: keyof ArcEmphasis; label: string }[] = [
    { key: 'hook', label: 'Hook' },
    { key: 'stakes', label: 'Stakes' },
    { key: 'mechanics', label: 'Mechanics' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'resolution', label: 'Resolution' },
  ];

  return (
    <div className="space-y-3">
      {phases.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-[var(--glass-text-muted)] w-20">{label}</span>
          <input
            type="range"
            min={1}
            max={4}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: parseInt(e.target.value) as 1 | 2 | 3 | 4 })}
            className="flex-1 h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
            disabled={disabled}
          />
          <span className="text-xs text-[var(--glass-text-secondary)] w-4 text-right">
            {value[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Editor
// =============================================================================

export function LensEditor({
  object: lens,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<LensPayload>) {
  const [showSystemPrompt, setShowSystemPrompt] = useState(!!lens.payload.systemPrompt);

  // Helper to create patch operation
  const patchPayload = (field: keyof LensPayload, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  const patchArcEmphasis = (emphasis: ArcEmphasis) => {
    // Patch each field individually for proper tracking
    const ops: PatchOperation[] = Object.entries(emphasis).map(([key, val]) => ({
      op: 'replace' as const,
      path: `/payload/arcEmphasis/${key}`,
      value: val,
    }));
    onEdit(ops);
  };

  const colorConfig = LENS_COLOR_CONFIG[lens.payload.color] || LENS_COLOR_CONFIG.slate;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={lens.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Description
              </label>
              <input
                type="text"
                value={lens.meta.description || ''}
                onChange={(e) => patchMeta('description', e.target.value)}
                placeholder="One-liner for lens picker"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PERSONA_COLORS.map((color) => {
                  const config = LENS_COLOR_CONFIG[color];
                  return (
                    <button
                      key={color}
                      onClick={() => patchPayload('color', color)}
                      className={`
                        w-8 h-8 rounded-lg transition-all flex items-center justify-center
                        ${lens.payload.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--glass-solid)]' : ''}
                      `}
                      style={{ backgroundColor: config.hex }}
                      title={config.label}
                      disabled={loading}
                    >
                      {lens.payload.color === color && (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--glass-text-secondary)]">Show in Lens Picker</span>
              <button
                onClick={() => patchMeta('status', lens.meta.status === 'active' ? 'draft' : 'active')}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${lens.meta.status === 'active' ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'}
                `}
                disabled={loading}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                    ${lens.meta.status === 'active' ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === VOICE PROMPT (THE MAIN FIELD) === */}
        <InspectorSection
          title="Voice Prompt"
          subtitle="Injected into LLM system prompt"
        >
          <textarea
            value={lens.payload.toneGuidance}
            onChange={(e) => patchPayload('toneGuidance', e.target.value)}
            rows={10}
            placeholder="[PERSONA: Name]&#10;Describe how this lens should speak, what vocabulary to use, what metaphors work, what to emphasize..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
            disabled={loading}
          />
          <p className="text-xs text-[var(--glass-text-muted)] mt-2">
            {lens.payload.toneGuidance.length} characters
          </p>
        </InspectorSection>

        <InspectorDivider />

        {/* === SYSTEM OVERRIDE (collapsible) === */}
        <InspectorSection
          title="System Override"
          collapsible
          defaultCollapsed={!showSystemPrompt}
        >
          <p className="text-xs text-[var(--glass-text-muted)] mb-2">
            Optional: Replace the default system prompt entirely
          </p>
          <textarea
            value={lens.payload.systemPrompt || ''}
            onChange={(e) => patchPayload('systemPrompt', e.target.value || undefined)}
            rows={6}
            placeholder="Leave empty to use default system prompt with toneGuidance injected"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
            disabled={loading}
          />
        </InspectorSection>

        <InspectorDivider />

        {/* === VOICE MODIFIERS === */}
        <InspectorSection title="Voice Modifiers">
          <div className="space-y-4">
            {/* Vocabulary Level */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Vocabulary Level
              </label>
              <select
                value={lens.payload.vocabularyLevel}
                onChange={(e) => patchPayload('vocabularyLevel', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {VOCABULARY_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Emotional Register */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Emotional Register
              </label>
              <select
                value={lens.payload.emotionalRegister}
                onChange={(e) => patchPayload('emotionalRegister', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {EMOTIONAL_REGISTERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Opening Template */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Opening Message (optional)
              </label>
              <textarea
                value={lens.payload.openingTemplate || ''}
                onChange={(e) => patchPayload('openingTemplate', e.target.value || undefined)}
                rows={2}
                placeholder="Custom message shown when session starts"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === NARRATIVE CONTROL === */}
        <InspectorSection title="Narrative Control">
          <div className="space-y-4">
            {/* Narrative Style */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Narrative Style
              </label>
              <select
                value={lens.payload.narrativeStyle}
                onChange={(e) => patchPayload('narrativeStyle', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {NARRATIVE_STYLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Opening Phase */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Opening Phase
              </label>
              <select
                value={lens.payload.openingPhase}
                onChange={(e) => patchPayload('openingPhase', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {OPENING_PHASES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Arc Emphasis */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Arc Emphasis (1-4)
              </label>
              <ArcEmphasisEditor
                value={lens.payload.arcEmphasis}
                onChange={patchArcEmphasis}
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === JOURNEY BINDING (collapsible) === */}
        <InspectorSection
          title="Journey Binding"
          collapsible
          defaultCollapsed={true}
        >
          <div className="space-y-4">
            {/* Thread Length */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Default Thread Length: {lens.payload.defaultThreadLength}
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={lens.payload.defaultThreadLength}
                onChange={(e) => patchPayload('defaultThreadLength', parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>3</span>
                <span>10</span>
              </div>
            </div>

            {/* Entry Points (placeholder for card picker) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Entry Points
              </label>
              <p className="text-xs text-[var(--glass-text-muted)] italic">
                {lens.payload.entryPoints.length} cards configured
              </p>
            </div>

            {/* Suggested Thread (placeholder for card picker) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Suggested Thread
              </label>
              <p className="text-xs text-[var(--glass-text-muted)] italic">
                {lens.payload.suggestedThread.length} cards in sequence
              </p>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === METADATA === */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs">
                {lens.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={onSave}
            variant="primary"
            size="sm"
            disabled={loading || !hasChanges}
            className="flex-1"
          >
            {hasChanges ? 'Save Changes' : 'Saved'}
          </GlassButton>
          <GlassButton
            onClick={onDuplicate}
            variant="ghost"
            size="sm"
            disabled={loading}
            title="Duplicate"
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </GlassButton>
          <GlassButton
            onClick={onDelete}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-red-400 hover:text-red-300"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default LensEditor;
