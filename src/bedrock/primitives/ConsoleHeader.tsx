// src/bedrock/primitives/ConsoleHeader.tsx
// Console header with title, description, and primary action
// Sprint: bedrock-foundation-v1 (Epic 3, Story 3.3)

import React, { type ReactNode } from 'react';
import type { PrimaryActionConfig } from '../types/console.types';
import { GlassButton } from './GlassButton';

// =============================================================================
// Types
// =============================================================================

interface ConsoleHeaderProps {
  /** Console title */
  title: string;
  /** Console description/subtitle */
  description?: string;
  /** Primary action configuration */
  primaryAction?: PrimaryActionConfig;
  /** Handler for primary action */
  onPrimaryAction?: () => void;
  /** Additional actions slot (right side) */
  actions?: ReactNode;
  /** Breadcrumb navigation slot */
  breadcrumbs?: ReactNode;
  /** Whether the console is in loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ConsoleHeader({
  title,
  description,
  primaryAction,
  onPrimaryAction,
  actions,
  breadcrumbs,
  loading = false,
  className = '',
}: ConsoleHeaderProps) {
  return (
    <header
      className={`
        h-14 px-6 flex items-center justify-between
        border-b border-[var(--glass-border)] bg-[var(--glass-solid)]
        flex-shrink-0
        ${className}
      `}
    >
      {/* Left: Title & Description */}
      <div className="flex items-center gap-4">
        {breadcrumbs && (
          <div className="text-sm text-[var(--glass-text-muted)]">
            {breadcrumbs}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-[var(--glass-text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--glass-text-muted)]">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Custom actions slot */}
        {actions}

        {/* Primary action button */}
        {primaryAction && onPrimaryAction && (
          <GlassButton
            onClick={onPrimaryAction}
            variant="primary"
            size="sm"
            disabled={loading}
          >
            {primaryAction.icon && (
              <span className="material-symbols-outlined text-lg">
                {primaryAction.icon}
              </span>
            )}
            {primaryAction.label}
          </GlassButton>
        )}
      </div>
    </header>
  );
}

// =============================================================================
// Standalone Header (for non-BedrockLayout usage)
// =============================================================================

interface StandaloneHeaderProps extends ConsoleHeaderProps {
  /** Whether to use sticky positioning */
  sticky?: boolean;
}

export function StandaloneHeader({
  sticky = false,
  ...props
}: StandaloneHeaderProps) {
  return (
    <ConsoleHeader
      {...props}
      className={`
        ${sticky ? 'sticky top-0 z-10' : ''}
        ${props.className || ''}
      `}
    />
  );
}

export default ConsoleHeader;
