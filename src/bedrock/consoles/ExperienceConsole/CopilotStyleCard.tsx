// src/bedrock/consoles/ExperienceConsole/CopilotStyleCard.tsx
// Card component for Copilot Style in grid/list view
// Sprint: inspector-copilot-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { CopilotStylePayload } from '@core/schema/copilot-style';

// Color mapping for presets
const PRESET_COLORS: Record<string, { bg: string; accent: string; label: string }> = {
  'terminal-green': { bg: '#0d0d0d', accent: '#00ff00', label: 'Terminal Green' },
  'terminal-amber': { bg: '#0d0a08', accent: '#ffaa00', label: 'Terminal Amber' },
  'terminal-cyan': { bg: '#0a0d0d', accent: '#00ffff', label: 'Terminal Cyan' },
  'custom': { bg: '#0d0d0d', accent: '#888888', label: 'Custom' },
};

/**
 * Card component for displaying a copilot style in grid/list view
 */
export function CopilotStyleCard({
  object: style,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<CopilotStylePayload>) {
  const preset = style.payload.preset;
  const presetConfig = PRESET_COLORS[preset] || PRESET_COLORS['terminal-green'];
  const isActive = style.meta.status === 'active';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="copilot-style-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: presetConfig.accent }}
      />

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8 mt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: presetConfig.bg }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: presetConfig.accent }}
          >
            terminal
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {style.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] font-mono">
            {presetConfig.label}
          </p>
        </div>
      </div>

      {/* Terminal preview */}
      <div
        className="rounded-lg p-2 mb-3 font-mono text-[10px]"
        style={{ backgroundColor: presetConfig.bg }}
      >
        <div style={{ color: presetConfig.accent }}>
          {style.payload.decorations.promptChar} /help
        </div>
        <div className="text-[#888] pl-2 border-l border-[#333] mt-1">
          Available commands...
        </div>
      </div>

      {/* Settings preview */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--glass-panel)] text-[var(--glass-text-muted)]">
          <span className="material-symbols-outlined text-xs">text_fields</span>
          {style.payload.typography.fontSize}px
        </span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--glass-panel)] text-[var(--glass-text-muted)]">
          <span className="material-symbols-outlined text-xs">history</span>
          {style.payload.maxDisplayMessages} msgs
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isActive
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          {isActive ? 'Active' : 'Draft'}
        </span>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${presetConfig.accent}20`,
            color: presetConfig.accent,
          }}
        >
          {presetConfig.label}
        </span>
      </div>
    </div>
  );
}

export default CopilotStyleCard;
