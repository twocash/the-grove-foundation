// src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx
// Editor for highlight trigger patterns
// Sprint: kinetic-highlights-v1

import React, { useState } from 'react';
import type { HighlightTrigger, HighlightMatchMode } from '@core/context-fields/types';

interface Props {
  triggers: HighlightTrigger[];
  onChange: (triggers: HighlightTrigger[]) => void;
  disabled?: boolean;
}

export function HighlightTriggersEditor({ triggers, onChange, disabled }: Props) {
  const [newText, setNewText] = useState('');
  const [newMode, setNewMode] = useState<HighlightMatchMode>('exact');

  const addTrigger = () => {
    if (!newText.trim()) return;
    onChange([...triggers, { text: newText.trim(), matchMode: newMode }]);
    setNewText('');
  };

  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrigger();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[var(--glass-text-primary)]">
        Highlight Triggers
      </label>

      {/* Existing triggers */}
      <div className="flex flex-wrap gap-2">
        {triggers.length === 0 && (
          <span className="text-xs text-[var(--glass-text-muted)] italic">
            No triggers defined. Add text patterns that will activate this prompt.
          </span>
        )}
        {triggers.map((trigger, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--glass-subtle)] border border-[var(--glass-border)]"
          >
            <span className="text-[var(--neon-cyan)]" title={trigger.matchMode === 'exact' ? 'Exact match' : 'Contains match'}>
              {trigger.matchMode === 'exact' ? '=' : '~'}
            </span>
            <span className="text-[var(--glass-text-primary)]">{trigger.text}</span>
            {!disabled && (
              <button
                onClick={() => removeTrigger(i)}
                className="ml-1 hover:text-red-400 transition-colors"
                title="Remove trigger"
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Add new trigger */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. distributed ownership"
            className="flex-1 px-3 py-2 rounded bg-[var(--glass-input)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            onKeyDown={handleKeyDown}
          />
          <select
            value={newMode}
            onChange={(e) => setNewMode(e.target.value as HighlightMatchMode)}
            className="px-3 py-2 rounded bg-[var(--glass-input)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-primary)]"
          >
            <option value="exact">Exact</option>
            <option value="contains">Contains</option>
          </select>
          <button
            onClick={addTrigger}
            disabled={!newText.trim()}
            className="px-4 py-2 rounded bg-[var(--neon-green)] text-black text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Add
          </button>
        </div>
      )}

      <p className="text-xs text-[var(--glass-text-muted)]">
        <strong>Exact (=)</strong>: Full text match. <strong>Contains (~)</strong>: Substring match.
      </p>
    </div>
  );
}

export default HighlightTriggersEditor;
