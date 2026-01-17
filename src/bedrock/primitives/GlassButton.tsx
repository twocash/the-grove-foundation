// src/bedrock/primitives/GlassButton.tsx
// Quantum Glass button primitive for actions
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React from 'react';

// =============================================================================
// Types
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';
type NeonAccent = 'green' | 'cyan' | 'amber' | 'violet';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Neon accent color (for primary variant) */
  accent?: NeonAccent;
  /** Material Symbols icon name (left) */
  icon?: string;
  /** Material Symbols icon name (right) */
  iconRight?: string;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

// =============================================================================
// Style Mappings
// =============================================================================

const sizeStyles: Record<ButtonSize, { padding: string; text: string; icon: string; height: string }> = {
  sm: { padding: 'px-3', text: 'text-xs', icon: 'text-sm', height: 'h-8' },
  md: { padding: 'px-4', text: 'text-sm', icon: 'text-base', height: 'h-10' },
  lg: { padding: 'px-6', text: 'text-base', icon: 'text-lg', height: 'h-12' },
};

const accentStyles: Record<NeonAccent, { bg: string; hover: string; glow: string; text: string }> = {
  green: {
    bg: 'bg-[var(--neon-green)]',
    hover: 'hover:bg-[var(--neon-green)]/90',
    glow: 'shadow-[0_0_20px_var(--neon-green)/30]',
    text: 'text-black',
  },
  cyan: {
    bg: 'bg-[var(--neon-cyan)]',
    hover: 'hover:bg-[var(--neon-cyan)]/90',
    glow: 'shadow-[0_0_20px_var(--neon-cyan)/30]',
    text: 'text-black',
  },
  amber: {
    bg: 'bg-[var(--neon-amber)]',
    hover: 'hover:bg-[var(--neon-amber)]/90',
    glow: 'shadow-[0_0_20px_var(--neon-amber)/30]',
    text: 'text-black',
  },
  violet: {
    bg: 'bg-[var(--neon-violet)]',
    hover: 'hover:bg-[var(--neon-violet)]/90',
    glow: 'shadow-[0_0_20px_var(--neon-violet)/30]',
    text: 'text-white',
  },
};

// =============================================================================
// Component
// =============================================================================

export function GlassButton({
  variant = 'secondary',
  size = 'md',
  accent = 'cyan',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: GlassButtonProps) {
  const sizes = sizeStyles[size];
  const accents = accentStyles[accent];

  const variantStyles: Record<ButtonVariant, string> = {
    primary: `
      ${accents.bg} ${accents.hover} ${accents.glow} ${accents.text}
      font-medium border-transparent
    `,
    secondary: `
      bg-[var(--glass-solid)] hover:bg-[var(--glass-elevated)]
      text-[var(--glass-text-primary)] border-white/10 hover:border-white/20
    `,
    ghost: `
      bg-transparent hover:bg-white/5
      text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)]
      border-transparent
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500/20
      text-red-400 border-red-500/30
      shadow-[0_0_15px_rgba(239,68,68,0.15)]
    `,
    success: `
      bg-emerald-500/20 hover:bg-emerald-500/30
      text-emerald-400 border-emerald-500/40
      shadow-[0_0_15px_rgba(16,185,129,0.2)]
    `,
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-lg border transition-all duration-200
    font-medium focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    ${sizes.height} ${sizes.padding} ${sizes.text}
    ${variantStyles[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={`material-symbols-outlined ${sizes.icon} animate-spin`}>
          progress_activity
        </span>
      ) : icon ? (
        <span className={`material-symbols-outlined ${sizes.icon}`}>{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className={`material-symbols-outlined ${sizes.icon}`}>{iconRight}</span>
      )}
    </button>
  );
}

// =============================================================================
// IconButton Variant
// =============================================================================

interface GlassIconButtonProps extends Omit<GlassButtonProps, 'icon' | 'iconRight' | 'children'> {
  /** Material Symbols icon name */
  icon: string;
  /** Accessible label */
  label: string;
}

export function GlassIconButton({
  icon,
  label,
  size = 'md',
  ...props
}: GlassIconButtonProps) {
  const sizeMap: Record<ButtonSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes: Record<ButtonSize, string> = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <GlassButton
      {...props}
      size={size}
      className={`${sizeMap[size]} !p-0 ${props.className || ''}`}
      aria-label={label}
    >
      <span className={`material-symbols-outlined ${iconSizes[size]}`}>{icon}</span>
    </GlassButton>
  );
}

export default GlassButton;
