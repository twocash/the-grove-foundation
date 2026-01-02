// src/bedrock/components/ViewModeToggle.tsx
// Grid/List view mode toggle for collections
// Sprint: bedrock-foundation-v1 (Epic 4, Story 4.1)

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export type ViewMode = 'grid' | 'list';

export interface ViewModeToggleProps {
  /** Current view mode */
  mode: ViewMode;
  /** Callback when mode changes */
  onChange: (mode: ViewMode) => void;
  /** Available modes (defaults to both) */
  availableModes?: ViewMode[];
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ViewModeToggle({
  mode,
  onChange,
  availableModes = ['grid', 'list'],
  size = 'md',
  className = '',
}: ViewModeToggleProps) {
  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-1.5 text-base',
  };

  const iconSize = size === 'sm' ? 'text-base' : 'text-lg';

  // If only one mode is available, don't show toggle
  if (availableModes.length <= 1) {
    return null;
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1 p-0.5 rounded-lg
        bg-[var(--glass-panel)] border border-[var(--glass-border)]
        ${className}
      `}
      role="radiogroup"
      aria-label="View mode"
    >
      {availableModes.includes('grid') && (
        <button
          type="button"
          onClick={() => onChange('grid')}
          className={`
            ${sizeClasses[size]}
            rounded-md transition-colors
            ${mode === 'grid'
              ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)] shadow-sm'
              : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]'
            }
          `}
          role="radio"
          aria-checked={mode === 'grid'}
          aria-label="Grid view"
          title="Grid view"
        >
          <span className={`material-symbols-outlined ${iconSize}`}>grid_view</span>
        </button>
      )}

      {availableModes.includes('list') && (
        <button
          type="button"
          onClick={() => onChange('list')}
          className={`
            ${sizeClasses[size]}
            rounded-md transition-colors
            ${mode === 'list'
              ? 'bg-[var(--glass-elevated)] text-[var(--glass-text-primary)] shadow-sm'
              : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]'
            }
          `}
          role="radio"
          aria-checked={mode === 'list'}
          aria-label="List view"
          title="List view"
        >
          <span className={`material-symbols-outlined ${iconSize}`}>view_list</span>
        </button>
      )}
    </div>
  );
}

export default ViewModeToggle;
