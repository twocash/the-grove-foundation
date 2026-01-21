// src/bedrock/primitives/GlassStatusBadge.tsx
// Quantum Glass status badge for pipeline states
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React from 'react';

// =============================================================================
// Types
// =============================================================================

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';
type BadgeSize = 'sm' | 'md' | 'lg';

interface GlassStatusBadgeProps {
  /** Status type determines color */
  status: StatusType;
  /** Badge text */
  children: React.ReactNode;
  /** Optional icon (Material Symbols name) */
  icon?: string;
  /** Size variant */
  size?: BadgeSize;
  /** Whether to show pulse animation */
  pulse?: boolean;
  /** Additional classes */
  className?: string;
}

// =============================================================================
// Style Mappings
// =============================================================================

const statusStyles: Record<StatusType, { bg: string; text: string; border: string; glow: string }> = {
  success: {
    bg: 'bg-[var(--neon-green)]/10',
    text: 'text-[var(--neon-green)]',
    border: 'border-[var(--neon-green)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-green)/20]',
  },
  warning: {
    bg: 'bg-[var(--neon-amber)]/10',
    text: 'text-[var(--neon-amber)]',
    border: 'border-[var(--neon-amber)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-amber)/20]',
  },
  error: {
    bg: 'bg-[var(--semantic-error-bg)]',
    text: 'text-[var(--semantic-error)]',
    border: 'border-[var(--semantic-error-border)]',
    glow: 'shadow-[0_0_10px_var(--semantic-error-glow)]',
  },
  info: {
    bg: 'bg-[var(--neon-cyan)]/10',
    text: 'text-[var(--neon-cyan)]',
    border: 'border-[var(--neon-cyan)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-cyan)/20]',
  },
  pending: {
    bg: 'bg-[var(--neon-violet)]/10',
    text: 'text-[var(--neon-violet)]',
    border: 'border-[var(--neon-violet)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-violet)/20]',
  },
  neutral: {
    bg: 'bg-white/5',
    text: 'text-[var(--glass-text-muted)]',
    border: 'border-white/10',
    glow: '',
  },
};

const sizeStyles: Record<BadgeSize, { padding: string; text: string; icon: string; gap: string }> = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 'text-xs', gap: 'gap-1' },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 'text-sm', gap: 'gap-1.5' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'text-base', gap: 'gap-2' },
};

// =============================================================================
// Component
// =============================================================================

export function GlassStatusBadge({
  status,
  children,
  icon,
  size = 'md',
  pulse = false,
  className = '',
}: GlassStatusBadgeProps) {
  const colors = statusStyles[status];
  const sizes = sizeStyles[size];

  return (
    <span
      className={`
        inline-flex items-center ${sizes.gap} ${sizes.padding}
        rounded-full border font-medium
        ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}
        ${sizes.text}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.bg} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.bg}`} />
        </span>
      )}
      {icon && (
        <span className={`material-symbols-outlined ${sizes.icon}`}>{icon}</span>
      )}
      {children}
    </span>
  );
}

// =============================================================================
// Convenience Components
// =============================================================================

export function SuccessBadge({ children, ...props }: Omit<GlassStatusBadgeProps, 'status'>) {
  return <GlassStatusBadge status="success" icon="check_circle" {...props}>{children}</GlassStatusBadge>;
}

export function WarningBadge({ children, ...props }: Omit<GlassStatusBadgeProps, 'status'>) {
  return <GlassStatusBadge status="warning" icon="warning" {...props}>{children}</GlassStatusBadge>;
}

export function ErrorBadge({ children, ...props }: Omit<GlassStatusBadgeProps, 'status'>) {
  return <GlassStatusBadge status="error" icon="error" {...props}>{children}</GlassStatusBadge>;
}

export function InfoBadge({ children, ...props }: Omit<GlassStatusBadgeProps, 'status'>) {
  return <GlassStatusBadge status="info" icon="info" {...props}>{children}</GlassStatusBadge>;
}

export function PendingBadge({ children, ...props }: Omit<GlassStatusBadgeProps, 'status'>) {
  return <GlassStatusBadge status="pending" icon="hourglass_empty" pulse {...props}>{children}</GlassStatusBadge>;
}

export default GlassStatusBadge;
