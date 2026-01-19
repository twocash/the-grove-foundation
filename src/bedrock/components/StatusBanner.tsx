// src/bedrock/components/StatusBanner.tsx
// Status banner component for displaying connection/entity status
// Sprint: S15-BD-FederationEditors-v1

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export type StatusBannerStatus = 'connected' | 'disconnected' | 'pending' | 'failed' | 'active' | 'inactive';

export interface StatusBannerProps {
  /** Current status */
  status: StatusBannerStatus;
  /** Primary label (defaults to capitalized status) */
  label?: string;
  /** Optional description text */
  description?: string;
  /** Optional action buttons to display on the right */
  actions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Status Configuration
// =============================================================================

const STATUS_CONFIG: Record<StatusBannerStatus, {
  bgColor: string;
  dotColor: string;
  textColor: string;
  icon: string;
  defaultLabel: string;
}> = {
  connected: {
    bgColor: 'bg-[var(--neon-green)]/10',
    dotColor: 'bg-[var(--neon-green)]',
    textColor: 'text-[var(--neon-green)]',
    icon: 'link',
    defaultLabel: 'Connected',
  },
  disconnected: {
    bgColor: 'bg-[var(--glass-text-muted)]/10',
    dotColor: 'bg-[var(--glass-text-muted)]',
    textColor: 'text-[var(--glass-text-muted)]',
    icon: 'link_off',
    defaultLabel: 'Disconnected',
  },
  pending: {
    bgColor: 'bg-[var(--neon-amber)]/10',
    dotColor: 'bg-[var(--neon-amber)]',
    textColor: 'text-[var(--neon-amber)]',
    icon: 'pending',
    defaultLabel: 'Pending',
  },
  failed: {
    bgColor: 'bg-red-500/10',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    icon: 'error',
    defaultLabel: 'Failed',
  },
  active: {
    bgColor: 'bg-[var(--neon-cyan)]/10',
    dotColor: 'bg-[var(--neon-cyan)]',
    textColor: 'text-[var(--neon-cyan)]',
    icon: 'check_circle',
    defaultLabel: 'Active',
  },
  inactive: {
    bgColor: 'bg-[var(--glass-text-muted)]/10',
    dotColor: 'bg-[var(--glass-text-muted)]',
    textColor: 'text-[var(--glass-text-muted)]',
    icon: 'cancel',
    defaultLabel: 'Inactive',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * StatusBanner displays the current status of an entity with a colored background,
 * pulsing indicator dot, and optional action buttons.
 *
 * @example
 * <StatusBanner
 *   status="connected"
 *   label="Grove Connection"
 *   description="Last synced 5 minutes ago"
 *   actions={<button>Refresh</button>}
 * />
 */
export function StatusBanner({
  status,
  label,
  description,
  actions,
  className = '',
}: StatusBannerProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.defaultLabel;

  // Determine if dot should pulse (for active/pending states)
  const shouldPulse = status === 'connected' || status === 'pending' || status === 'active';

  return (
    <div
      data-testid="status-banner"
      className={`
        flex items-center justify-between gap-3 px-4 py-3 rounded-lg
        ${config.bgColor}
        border border-white/5
        ${className}
      `}
    >
      {/* Left side: Status indicator and text */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Pulsing dot indicator */}
        <div className="relative flex-shrink-0">
          <span
            className={`
              block w-2.5 h-2.5 rounded-full
              ${config.dotColor}
              ${shouldPulse ? 'animate-pulse' : ''}
            `}
          />
          {shouldPulse && (
            <span
              className={`
                absolute inset-0 w-2.5 h-2.5 rounded-full
                ${config.dotColor}
                animate-ping opacity-75
              `}
            />
          )}
        </div>

        {/* Icon and text content */}
        <div className="flex items-center gap-2 min-w-0">
          <span className={`material-symbols-outlined text-lg ${config.textColor}`}>
            {config.icon}
          </span>
          <div className="min-w-0">
            <span className={`font-medium ${config.textColor}`}>
              {displayLabel}
            </span>
            {description && (
              <p className="text-xs text-[var(--glass-text-muted)] truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      {actions && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default StatusBanner;
