// src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx
// Surface selection UI for prompts
// Sprint: kinetic-highlights-v1

import React from 'react';
import type { PromptSurface } from '@core/context-fields/types';

interface Props {
  surfaces: PromptSurface[];
  onChange: (surfaces: PromptSurface[]) => void;
  disabled?: boolean;
}

const ALL_SURFACES: { value: PromptSurface; label: string; description: string }[] = [
  { value: 'suggestion', label: 'Suggestion', description: 'Standard prompt panel' },
  { value: 'highlight', label: 'Highlight', description: 'Clickable concepts' },
  { value: 'journey', label: 'Journey', description: 'Guided journey steps' },
  { value: 'followup', label: 'Follow-up', description: 'Contextual follow-ups' },
];

export function SurfaceSelector({ surfaces, onChange, disabled }: Props) {
  const toggle = (surface: PromptSurface) => {
    if (surfaces.includes(surface)) {
      // Don't allow empty surfaces - keep at least 'suggestion'
      if (surfaces.length > 1) {
        onChange(surfaces.filter(s => s !== surface));
      }
    } else {
      onChange([...surfaces, surface]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--glass-text-primary)]">
        Surfaces
      </label>
      <div className="flex flex-wrap gap-2">
        {ALL_SURFACES.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            disabled={disabled}
            title={description}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              surfaces.includes(value)
                ? 'bg-[var(--neon-green)] text-black'
                : 'bg-[var(--glass-subtle)] text-[var(--glass-text-muted)] hover:bg-[var(--glass-hover)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--glass-text-muted)]">
        Where this prompt can appear. Click to toggle.
      </p>
    </div>
  );
}

export default SurfaceSelector;
