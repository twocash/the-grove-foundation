// src/bedrock/primitives/GlassCard.tsx
// Quantum Glass card primitive for data display
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type CardSize = 'sm' | 'md' | 'lg';
type NeonAccent = 'green' | 'cyan' | 'amber' | 'violet' | 'none';

interface GlassCardProps {
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Material Symbols icon name */
  icon?: string;
  /** Neon accent color */
  accent?: NeonAccent;
  /** Card size variant */
  size?: CardSize;
  /** Whether card is selected/active */
  selected?: boolean;
  /** Badge content (e.g., count, status) */
  badge?: ReactNode;
  /** Main content */
  children?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
}

// =============================================================================
// Style Mappings
// =============================================================================

const sizeStyles: Record<CardSize, { padding: string; iconSize: string; titleSize: string }> = {
  sm: { padding: 'p-3', iconSize: 'text-base', titleSize: 'text-xs' },
  md: { padding: 'p-4', iconSize: 'text-lg', titleSize: 'text-sm' },
  lg: { padding: 'p-5', iconSize: 'text-xl', titleSize: 'text-base' },
};

const accentColors: Record<NeonAccent, { icon: string; border: string; glow: string }> = {
  green: {
    icon: 'text-[var(--neon-green)]',
    border: 'border-[var(--neon-green)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-green)/15]',
  },
  cyan: {
    icon: 'text-[var(--neon-cyan)]',
    border: 'border-[var(--neon-cyan)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-cyan)/15]',
  },
  amber: {
    icon: 'text-[var(--neon-amber)]',
    border: 'border-[var(--neon-amber)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-amber)/15]',
  },
  violet: {
    icon: 'text-[var(--neon-violet)]',
    border: 'border-[var(--neon-violet)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-violet)/15]',
  },
  none: {
    icon: 'text-[var(--glass-text-secondary)]',
    border: 'border-white/5',
    glow: '',
  },
};

// =============================================================================
// Component
// =============================================================================

export function GlassCard({
  title,
  subtitle,
  icon,
  accent = 'none',
  size = 'md',
  selected = false,
  badge,
  children,
  onClick,
  className = '',
}: GlassCardProps) {
  const isInteractive = Boolean(onClick);
  const styles = sizeStyles[size];
  const colors = accentColors[accent];

  const baseClasses = `
    rounded-lg border transition-all duration-200
    bg-[var(--glass-solid)]
    ${selected ? `${colors.border} ${colors.glow}` : 'border-white/5'}
    ${isInteractive ? 'cursor-pointer hover:border-white/10 hover:bg-[var(--glass-elevated)]' : ''}
    ${styles.padding}
    ${className}
  `;

  const content = (
    <div className="flex items-start gap-3">
      {/* Icon */}
      {icon && (
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          ${selected ? `bg-[var(--glass-void)]` : 'bg-[var(--glass-panel)]'}
        `}>
          <span className={`material-symbols-outlined ${styles.iconSize} ${colors.icon}`}>
            {icon}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-center gap-2">
            <h4 className={`font-medium text-[var(--glass-text-primary)] ${styles.titleSize} truncate`}>
              {title}
            </h4>
            {badge && (
              <span className="flex-shrink-0">
                {badge}
              </span>
            )}
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--glass-text-muted)] mt-0.5 truncate">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </div>
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

export default GlassCard;
