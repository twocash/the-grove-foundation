// src/bedrock/primitives/GlassPanel.tsx
// Quantum Glass panel primitive for Bedrock consoles
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type GlassTier = 'void' | 'panel' | 'solid' | 'elevated';
type NeonAccent = 'green' | 'cyan' | 'amber' | 'violet' | 'none';

interface GlassPanelProps {
  /** Glass elevation tier (void is deepest, elevated is highest) */
  tier?: GlassTier;
  /** Optional neon accent border */
  accent?: NeonAccent;
  /** Panel header content */
  header?: ReactNode;
  /** Panel title (alternative to full header) */
  title?: string;
  /** Header icon (Material Symbols name) */
  icon?: string;
  /** Header actions slot */
  actions?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether panel has padding */
  padded?: boolean;
  /** Click handler for interactive panels */
  onClick?: () => void;
}

// =============================================================================
// Style Mappings
// =============================================================================

const tierStyles: Record<GlassTier, string> = {
  void: 'bg-[var(--glass-void)]',
  panel: 'bg-[var(--glass-panel)] backdrop-blur-md',
  solid: 'bg-[var(--glass-solid)]',
  elevated: 'bg-[var(--glass-elevated)]',
};

const accentStyles: Record<NeonAccent, string> = {
  green: 'border-[var(--neon-green)]/30 shadow-[0_0_20px_var(--neon-green)/10]',
  cyan: 'border-[var(--neon-cyan)]/30 shadow-[0_0_20px_var(--neon-cyan)/10]',
  amber: 'border-[var(--neon-amber)]/30 shadow-[0_0_20px_var(--neon-amber)/10]',
  violet: 'border-[var(--neon-violet)]/30 shadow-[0_0_20px_var(--neon-violet)/10]',
  none: 'border-white/5',
};

const iconAccentColors: Record<NeonAccent, string> = {
  green: 'text-[var(--neon-green)]',
  cyan: 'text-[var(--neon-cyan)]',
  amber: 'text-[var(--neon-amber)]',
  violet: 'text-[var(--neon-violet)]',
  none: 'text-[var(--glass-text-secondary)]',
};

// =============================================================================
// Component
// =============================================================================

export function GlassPanel({
  tier = 'panel',
  accent = 'none',
  header,
  title,
  icon,
  actions,
  children,
  className = '',
  padded = true,
  onClick,
}: GlassPanelProps) {
  const isInteractive = Boolean(onClick);

  const baseClasses = `
    rounded-xl border transition-all duration-200
    ${tierStyles[tier]}
    ${accentStyles[accent]}
    ${isInteractive ? 'cursor-pointer hover:border-white/10 hover:bg-[var(--glass-elevated)]' : ''}
    ${className}
  `;

  const hasHeader = header || title || actions;

  const headerContent = header || (title && (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`material-symbols-outlined text-lg ${iconAccentColors[accent]}`}>
            {icon}
          </span>
        )}
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
          {title}
        </h3>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  ));

  const content = (
    <>
      {hasHeader && (
        <div className="px-4 py-3 border-b border-white/5">
          {headerContent}
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>
        {children}
      </div>
    </>
  );

  if (isInteractive) {
    return (
      <button onClick={onClick} className={`${baseClasses} w-full text-left`}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

export default GlassPanel;
